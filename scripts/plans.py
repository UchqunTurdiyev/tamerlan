"""Qavat rejalarini arxitektura PDF'laridan kesib olish.

  pip install pymupdf pillow numpy scipy scikit-image
  python3 scripts/plans.py ~/Downloads        # 6-blok.pdf va 8-blok.pdf shu papkada

Natija: public/plans/b{blok}-{qavat}.webp va lib/plans.json (har xonadonning rejadagi joyi),
public/plans/b{blok}-{qavat}.3d.json — 3D uchun devor, deraza va eshik o'rinlari.
Xonadon joyi chizmadagi xona maydonlari yorliqlaridan topiladi: lib/data.js dagi har bir xona
maydoni rejada qayerda yozilgani qidiriladi, eng yaqin to'plam xonadon chegarasi bo'ladi.
"""
import hashlib, io, json, math, os, re, shutil, subprocess, sys, tempfile
import fitz
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd
from skimage.segmentation import watershed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else "~/Downloads")
OUT_IMG = os.path.join(ROOT, "public", "plans")
OUT_JSON = os.path.join(ROOT, "lib", "plans.json")
# chizma masshtabi, pt / metr (o'qlar orasidagi o'lchamlardan)
SCALE = {1: 20.0, 2: 20.0, 3: 20.0, 4: 23.7, 5: 13.6, 6: 23.3, 8: 23.3}
PX_M = 72  # rasm aniqligi: metrga piksel (xonadonga yaqinlashtirilganda ham yozuvlar o'qilsin)


def load_blocks():
    with tempfile.NamedTemporaryFile("w", suffix=".mjs", delete=False) as t:
        t.write(open(os.path.join(ROOT, "lib", "data.js")).read())
    js = f'import("{t.name}").then(m=>process.stdout.write(JSON.stringify(m.BLOCKS)))'
    out = subprocess.run(["node", "-e", js], capture_output=True, text=True, check=True).stdout
    os.unlink(t.name)
    return json.loads(out)


def spans(page):
    res = []
    for bl in page.get_text("dict")["blocks"]:
        for ln in bl.get("lines", []):
            for sp in ln["spans"]:
                t = sp["text"].strip()
                if t:
                    r = fitz.Rect(sp["bbox"]) * page.rotation_matrix
                    res.append((t, r, sp["color"]))
    return res


def table_rects(sp):
    rs = []
    for t, r, _ in sp:
        if "Эксплика" in t:
            rs.append(fitz.Rect(r.x0 - 25, r.y0 - 4, r.x1 + 25, r.y0 + 260))
    return rs


NUM = re.compile(r"^(\d{1,3}[.,]\d{1,2})(?:\s*м.*)?$")
LBL = [re.compile(r"^(\d+)\s*-\s*[кК]в"), re.compile(r"^Квартира\s+(\d+)")]


def labels(sp):
    out = {}
    for i, (t, r, c) in enumerate(sp):
        if c not in (0xFF0000, 0x0000FF) or "Эксплика" in t:
            continue
        n = None
        for rx in LBL:
            m = rx.match(t)
            if m:
                n = int(m.group(1))
        if n is None and re.match(r"^\d+-$", t):
            # "4-" va "кв" alohida yozilgan
            if any(t2 == "кв" and abs(r2.y0 - r.y0) < 3 and -3 <= r2.x0 - r.x1 < 4 for t2, r2, _ in sp):
                n = int(t[:-1])
        if n is not None:
            out.setdefault(n, []).append(((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2))
    # bir raqam ikki marta yozilgan bo'lsa (ko'zgu xonadonlar), raqamlash chapdan o'ngga: chapdagisi olinadi
    return {n: min(ps) for n, ps in out.items()}


def locate(apt, nums, anchor, sc, used, rooms=None):
    pts = []
    cand = {}
    for room in apt["rooms"]:
        a = room["a"]
        cand[a] = [p for v, p in nums if abs(v - a) < 0.006 and p not in used]
    if anchor is None:
        allp = [p for ps in cand.values() for p in ps]
        if not allp:
            return None
        xs, ys = sorted(p[0] for p in allp), sorted(p[1] for p in allp)
        anchor = (xs[len(xs) // 2], ys[len(ys) // 2])
        for _ in range(3):  # markazni aniqlashtirish
            near = [min(ps, key=lambda p: math.dist(p, anchor)) for ps in cand.values() if ps]
            anchor = (sum(p[0] for p in near) / len(near), sum(p[1] for p in near) / len(near))
    for room in apt["rooms"]:
        ps = [p for p in cand[room["a"]] if p not in used and math.dist(p, anchor) < 11 * sc]
        if not ps:
            continue
        p = min(ps, key=lambda p: math.dist(p, anchor))
        used.add(p)
        if rooms is not None:
            rooms.append((p, room["t"], room["a"], apt["n"]))
        h = max(1.0, math.sqrt(room["a"]) / 2) * sc
        pts.append(fitz.Rect(p[0] - h, p[1] - h, p[0] + h, p[1] + h))
    if not pts:
        return None
    box = pts[0]
    for r in pts[1:]:
        box |= r
    return box, anchor, len(pts), len(apt["rooms"])


RES = 0.025  # 3D to'ri, metr
ROOMS = []  # (nuqta, xona turi, maydon, xonadon raqami) — har xona yorlig'i qayerda


def is_wall(d):
    # devor kesimi chizmalarda 0.84 qalinlikdagi to'q rangsiz chiziq (kulrang 0.33 yoki qora)
    c = d.get("color")
    return d["type"] == "s" and c and max(c) - min(c) < 0.01 and max(c) <= 0.34 and abs((d.get("width") or 0) - 0.84) < 0.01


def rects(mask):
    """Niqobni to'rtburchaklarga bo'lish: har qatordagi bo'laklar, pastga bir xil davom etsa cho'ziladi."""
    out, open_ = [], {}
    for y in range(mask.shape[0] + 1):
        runs = {}
        if y < mask.shape[0]:
            row = np.concatenate([[0], mask[y].astype(np.int8), [0]])
            d = np.diff(row)
            for a, b in zip(np.where(d == 1)[0], np.where(d == -1)[0]):
                runs[(int(a), int(b))] = True
        for k in list(open_):
            if k not in runs:
                y0 = open_.pop(k)
                out.append([k[0], y0, k[1] - k[0], y - y0])
        for k in runs:
            open_.setdefault(k, y)
    return out


def walls3d(page, crop, sc, compts, aptrooms, anchors):
    k = 1 / (sc * RES)
    M = page.rotation_matrix
    w, h = int(crop.width * k) + 1, int(crop.height * k) + 1
    im = Image.new("L", (w, h), 0)
    dd = ImageDraw.Draw(im)
    T = lambda q: ((q.x - crop.x0) * k, (q.y - crop.y0) * k)
    for d in page.get_drawings():
        if not is_wall(d) or not (d["rect"] * M).intersects(crop) or (d["rect"] * M).width > page.rect.width * 0.6:
            continue
        for it in d["items"]:
            if it[0] == "l":
                dd.line([T(it[1] * M), T(it[2] * M)], fill=255)
            elif it[0] == "c":
                dd.line([T(q * M) for q in it[1:]], fill=255)
            elif it[0] == "re":
                r = it[1] * M
                dd.rectangle([*T(r.tl), *T(r.br)], outline=255)
            elif it[0] == "qu":
                q = it[1]
                dd.polygon([T(v * M) for v in (q.ul, q.ur, q.lr, q.ll)], outline=255)
    L = np.array(im) > 0
    # devor = chiziqlar orasidagi ingichka yopiq bo'shliqlar (xonalar keng, devor ichi ≤ 0.6 m)
    lab, n = nd.label(~L)
    if not n:
        return None
    mx = nd.maximum(nd.distance_transform_edt(~L), lab, index=np.arange(1, n + 1))
    thin = np.zeros(n + 1, bool)
    thin[1:] = mx <= 0.3 / RES
    for e in np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])):
        thin[e] = False
    wall = nd.binary_opening(thin[lab] | L, iterations=1)
    # teshiklar: bir chiziqdagi ikki devor uchi orasidagi, devor qalinligidagi bo'shliq
    gap = np.zeros_like(wall)
    for st in (np.ones((1, int(1.9 / RES))), np.ones((int(1.9 / RES), 1))):
        c = nd.binary_closing(wall, structure=st) & ~wall
        cl, cn = nd.label(c)
        for i, sl in enumerate(nd.find_objects(cl), 1):
            hh, ww = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
            thick, long_ = (hh, ww) if st.shape[0] == 1 else (ww, hh)
            if thick <= 0.6 / RES and long_ >= 0.45 / RES:
                gap[sl] |= cl[sl] == i
    # bino izi: devorlarni 1.2 m ga yopib, ichini to'ldirish — yo'lak va zinapoya ichkarida qoladi
    r = int(1.2 / RES)
    fp = nd.binary_fill_holes(nd.binary_erosion(nd.binary_dilation(np.pad(wall | gap, r), iterations=r), iterations=r))[r:-r, r:-r]
    # ---- chizmadagi rang: har xonadon o'z rangida bo'yalgan (qo'shnilari boshqa rangda) ----
    cmap = Image.new("I", (w, h), 0)
    cd = ImageDraw.Draw(cmap)
    cols, carea = {}, {}
    for d in page.get_drawings():
        f_ = d.get("fill")
        if "f" not in d["type"] or not f_ or min(f_) > 0.965 or (max(f_) - min(f_) < 0.02 and max(f_) < 0.6):
            continue
        dr_ = d["rect"] * M
        if not dr_.intersects(crop) or dr_.width * dr_.height / (sc * sc) < 2 or dr_.width * dr_.height / (sc * sc) > 300:
            continue
        key = tuple(round(v, 2) for v in f_)
        ci = cols.setdefault(key, len(cols) + 1)
        carea[ci] = carea.get(ci, 0) + dr_.width * dr_.height / (sc * sc)
        pts = []
        for it in d["items"]:
            if it[0] == "l":
                pts += [T(it[1] * M), T(it[2] * M)]
            elif it[0] == "c":
                pts += [T(it[1] * M), T(it[4] * M)]
            elif it[0] == "re":
                q = it[1] * M
                pts += [T(q.tl), T(q.tr), T(q.br), T(q.bl)]
            elif it[0] == "qu":
                q = it[1]
                pts += [T(v * M) for v in (q.ul, q.ur, q.lr, q.ll)]
        if len(pts) >= 3:
            cd.polygon(pts, fill=ci)
    cmap = np.array(cmap)
    # rangli xonalar ham bino ichida (tashqi devorda keng ochiq joy bo'lsa ham)
    good = {ci for ci, a_ in carea.items() if a_ >= 15}
    if good:
        fp |= nd.binary_fill_holes(nd.binary_erosion(nd.binary_dilation(np.pad(wall | gap | np.isin(cmap, list(good)), r), iterations=r), iterations=r))[r:-r, r:-r]
    P = lambda q: (int((q[1] - crop.y0) * k), int((q[0] - crop.x0) * k))
    inside = lambda ij: 0 <= ij[0] < h and 0 <= ij[1] < w
    flat = lambda m: [v for r in rects(m) for v in r]
    bbox = lambda m: (lambda ys, xs: [int(xs.min()), int(ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)])(*np.where(m))

    # bo'lish uchun 1.2 m gacha har qanday tirqish yopiladi (eshik, burchakdagi deraza, siljigan devor uchi)
    R = int(0.6 / RES)
    yy, xx = np.ogrid[-R:R + 1, -R:R + 1]
    solid = nd.binary_closing(np.pad(wall | gap, R), structure=xx * xx + yy * yy <= R * R)[R:-R, R:-R] | wall | gap
    closed, _ = nd.label(~solid)
    csize = np.bincount(closed.ravel()) * RES * RES

    # yopiq balkon/terrasa: yorlig'i turgan, maydoni mos yopiq hudud; ochiq balkon — fasadga yopishgan to'rtburchak
    seeds = []  # (i, j, xona turi, maydon, xonadon)
    outdoor = np.zeros_like(wall)
    owner_out = {}
    fdist = fidx = None
    for (x, y), t, a, n in ROOMS:
        ij = P((x, y))
        if not inside(ij):
            continue
        if t in ("bl", "t"):
            c = closed[ij]
            if c and csize[c] <= a * 1.6 + 2 and not fp[ij]:
                m = closed == c
            elif not fp[ij]:
                # eng yaqin fasad nuqtasi: balkon chuqurligi = 2 × masofa, eni = maydon / chuqurlik
                if fdist is None:
                    fdist, fidx = nd.distance_transform_edt(~fp, return_indices=True)
                dist, idx = fdist, fidx
                d = dist[ij]
                if d * RES > 3.5:
                    continue
                qi, qj = idx[0][ij], idx[1][ij]
                dep = max(1.0, min(3.2, 2 * d * RES)) / RES
                wid = max(1.2 / RES, a / (dep * RES * RES))
                m = np.zeros_like(wall)
                if abs(ij[0] - qi) >= abs(ij[1] - qj):  # fasad gorizontal
                    y0, y1 = sorted((qi, qi + int(np.sign(ij[0] - qi) * dep)))
                    m[max(0, y0):y1 + 1, max(0, int(ij[1] - wid / 2)):int(ij[1] + wid / 2)] = True
                else:
                    x0, x1 = sorted((qj, qj + int(np.sign(ij[1] - qj) * dep)))
                    m[max(0, int(ij[0] - wid / 2)):int(ij[0] + wid / 2), max(0, x0):x1 + 1] = True
                m &= ~fp & ~wall
            else:
                seeds.append((ij[0], ij[1], t, a, n))
                continue
            if m.any():
                outdoor |= m
                owner_out[len(owner_out)] = (m, t, a, n)
            continue
        if fp[ij] and not wall[ij]:
            seeds.append((ij[0], ij[1], t, a, n))
    # umumiy joylar (zinapoya, yo'lak) — xonadonga tegishli bo'lmagan maydon yozuvlari
    for q in compts:
        ij = P(q)
        if inside(ij) and fp[ij] and not wall[ij] and all((ij[0] - s_[0]) ** 2 + (ij[1] - s_[1]) ** 2 > (1.0 / RES) ** 2 for s_ in seeds):
            seeds.append((ij[0], ij[1], "common", None, None))

    # urug'dan o'sish: avval yopiq xona ichi (narx 0), keyin tirqish/eshik (narx 1) — xona eshikdan oshib qo'shnisini egallamaydi
    cost = np.where(solid, 1, 0).astype(np.uint8)
    marks = np.zeros(wall.shape, np.int32)
    for sid, (si, sj, *_r) in enumerate(seeds, 1):
        marks[max(0, si - 2):si + 3, max(0, sj - 2):sj + 3] = sid
    marks[wall] = 0
    region = (fp & ~wall) | gap
    own = watershed(cost, marks, mask=region) if seeds else np.zeros(wall.shape, np.int32)
    own[gap | wall] = 0
    # yopiq xona butunligicha bitta xonadonga: bir xonaga ikki xonadon yorlig'i tushsa (qo'shni xona raqami adashgan),
    # maydoni mosrog'i qoladi; bir xonadonning bir nechta yorlig'i bo'lsa — xona ular orasida bo'linadi
    by_c = {}
    for sid, s_ in enumerate(seeds, 1):
        c = closed[s_[0], s_[1]]
        if c:
            by_c.setdefault(c, []).append(sid)
    for c, sids in by_c.items():
        if csize[c] > 60:
            continue
        if len(sids) == 1:
            own[closed == c] = sids[0]
            continue
        groups = {}
        for sid in sids:
            groups.setdefault(seeds[sid - 1][4], []).append(sid)
        if len(groups) == 1:
            win_ = sids
        else:
            score = lambda n: abs(sum((seeds[i - 1][3] or 0) for i in groups[n]) - csize[c]) if n is not None else 1e9
            win_ = groups[min(groups, key=score)]
        m = closed == c
        sub = np.zeros(wall.shape, np.int32)
        for sid in win_:
            sub[max(0, seeds[sid - 1][0] - 2):seeds[sid - 1][0] + 3, max(0, seeds[sid - 1][1] - 2):seeds[sid - 1][1] + 3] = sid
        sub[~m] = 0
        own[m] = watershed(np.zeros(wall.shape, np.uint8), sub, mask=m)[m] if len(win_) > 1 else win_[0]
    # maydon nazorati: xona yorliqdagidan ancha katta chiqsa (zinapoyaga oqib ketgan), o'z yopiq hududi bilan cheklanadi
    for sid, (si, sj, t, a, n) in enumerate(seeds, 1):
        if not a:
            continue
        m = own == sid
        lim = a * 1.8 + 3
        if m.sum() * RES * RES <= lim:
            continue
        m2 = m & (closed == closed[si, sj]) if closed[si, sj] else m
        if m2.sum() * RES * RES > lim:
            rr = np.sqrt(a) * 0.9 / RES
            Y, X = np.ogrid[:h, :w]
            m2 = m & ((Y - si) ** 2 + (X - sj) ** 2 <= rr * rr)
        own[m & ~m2] = -1  # umumiy

    # devor turlari
    D = int(0.65 / RES)
    low = wall & ~nd.binary_dilation(fp & ~wall, iterations=D)
    full = wall & ~low
    out_near = nd.binary_dilation(~fp, iterations=int(0.3 / RES))
    bal_near = nd.binary_dilation(outdoor, iterations=int(0.3 / RES))
    gl, _ = nd.label(gap)
    win, glz = np.zeros_like(gap), np.zeros_like(gap)
    for i, sl in enumerate(nd.find_objects(gl), 1):
        part = gl[sl] == i
        if (bal_near[sl] & part).any():
            glz[sl] |= part  # balkonga chiqish: poldan shisha
        elif (out_near[sl] & part).any():
            win[sl] |= part
    door = gap & ~win & ~glz
    # ochiq balkon panjarasi: balkonning bino tomonidan boshqa chetlari
    rail = np.zeros_like(wall)
    T_ = int(0.06 / RES) + 1
    for m, *_r in owner_out.values():
        edge = m & ~nd.binary_erosion(m, iterations=T_)
        rail |= edge & ~nd.binary_dilation(fp, iterations=T_ + 1)
    low |= rail & ~wall

    # yorlig'i topilmagan yopiq xona (chizmadagi raqam jadvaldan farq qilsa): faqat bitta xonadonga tutashsa — o'shaniki,
    # turi — shu xonadonning hali topilmagan xonalaridan maydoni eng yaqini
    seed_apt = {sid: s_[4] for sid, s_ in enumerate(seeds, 1)}
    have = {}
    for s_ in seeds:
        if s_[4] is not None:
            have.setdefault(s_[4], []).append(s_[2])
    extra = []
    seeded = {closed[s_[0], s_[1]] for s_ in seeds}
    for _pass in range(3):  # keyingi o'tishlar: birinchi o'tishda biriktirilgan xona orqali ichkaridagilar
        for c in range(1, len(csize)):
            if c in seeded or not (1.0 <= csize[c] <= 40):
                continue
            m = (closed == c) & fp
            if not m.any():
                continue
            # faqat eshik orqali tutashgan qo'shnilar (devor ortidagi qo'shni xonadon hisobga olinmaydi)
            touch = gap & nd.binary_dilation(m, iterations=3)
            if not touch.any():
                continue
            beyond = nd.binary_dilation(touch, iterations=int(0.7 / RES)) & ~m & ~wall & ~gap
            ns = {seed_apt.get(int(v)) for v in np.unique(own[beyond]) if v > 0} - {None}
            ns |= {e[3] for e in extra if (e[0] & beyond).any()}
            if len(ns) != 1:
                continue
            n = ns.pop()
            left = [r for r in aptrooms.get(n, []) if r["t"] not in ("bl", "t")]
            for t_ in have.get(n, []):
                for r in left:
                    if r["t"] == t_:
                        left.remove(r)
                        break
            if not left:
                continue
            r = min(left, key=lambda r: abs(r["a"] - csize[c]))
            have.setdefault(n, []).append(r["t"])
            own[m] = -2
            seeded.add(c)
            extra.append((m, r["t"], r["a"], n))

    fill_rooms = {}
    if good:
        reg = {}
        # oqib ketgan katta hudud (yo'lak + bir necha xona) — rang bo'yicha bo'laklarga
        nxt = len(csize)
        for c in range(1, len(csize)):
            if csize[c] <= 80:
                continue
            m0 = (closed == c) & fp
            for ci in good:
                part = m0 & (cmap == ci)
                if part.sum() * RES * RES < 1.5:
                    continue
                part = nd.binary_closing(part, iterations=int(0.4 / RES)) & m0
                pl, pn = nd.label(part)
                for q in range(1, pn + 1):
                    pm = pl == q
                    if pm.sum() * RES * RES >= 1.5:
                        reg[nxt] = (ci, pm)
                        nxt += 1
        for c in range(1, len(csize)):
            if not (0.8 <= csize[c] <= 80):
                continue
            m = (closed == c) & fp
            if not m.any():
                continue
            v = cmap[m]
            v = v[np.isin(v, list(good))]
            if v.size < 0.15 * m.sum():
                continue
            reg[c] = (int(np.bincount(v).argmax()), m)
        # bir rangdagi tutash xonalar — bitta xonadon
        par = {c: c for c in reg}
        def fnd(x):
            while par[x] != x:
                par[x] = par[par[x]]
                x = par[x]
            return x
        cid = np.zeros(wall.shape, np.int32)
        for c, (ci, m) in reg.items():
            cid[m] = c
        for c, (ci, m) in reg.items():
            ring = nd.binary_dilation(m, iterations=int(0.5 / RES)) & ~m
            for o in np.unique(cid[ring]):
                if o and o != c and reg[o][0] == ci:
                    par[fnd(o)] = fnd(c)
        comps = {}
        for c in reg:
            comps.setdefault(fnd(c), []).append(c)
        # xonadon raqami — ichidagi yorliq (chizmadagi «N-кв» / «Квартира N» yoki xonalar markazi)
        # yorliq rangsiz joyda (dahliz) tursa — 3 m ichidagi eng yaqin rangli xona
        cd_, ci_ = nd.distance_transform_edt(cid == 0, return_indices=True)
        def at(q):
            ij = P(q)
            if not inside(ij) or cd_[ij] * RES > 3:
                return 0
            return cid[ci_[0][ij], ci_[1][ij]]
        anc = {n: at(q) for n, q in anchors.items()}
        for root, cs in comps.items():
            hit = [n for n, c in anc.items() if c in cs]
            if len(hit) != 1:
                continue
            n = hit[0]
            if n in fill_rooms:
                fill_rooms.pop(n)  # ikki bo'lak bir raqamga — ishonchsiz
                continue
            fill_rooms[n] = cs
        res_rooms = []
        for n, cs in fill_rooms.items():
            left = [r for r in aptrooms.get(n, []) if r["t"] not in ("bl", "t")]
            placed = []
            for c in cs:
                m = reg[c][1]
                # ichidagi shu xonadon yorlig'i bo'yicha tur
                ts = [s_ for s_ in seeds if s_[4] == n and m[s_[0], s_[1]]]
                if ts:
                    t_, a_ = ts[0][2], ts[0][3]
                else:
                    t_, a_ = None, None
                placed.append([c, m, t_, a_])
            for pl in placed:  # yorliqli xonalar ro'yxatdan chiqariladi
                if pl[2]:
                    for r in left:
                        if r["t"] == pl[2]:
                            left.remove(r)
                            break
            # yorliqli xona yorlig'idan ancha katta (masalan oshxona + dahliz bitta ochiq joy) — hali joylanmagan, maydoni mosroq xona turi
            for pl in placed:
                if pl[2] and pl[3] and left:
                    sz = pl[1].sum() * RES * RES
                    if sz > pl[3] * 1.4 + 3:
                        r = min(left, key=lambda r: abs(r["a"] - sz))
                        if abs(r["a"] - sz) < abs(pl[3] - sz):
                            left.remove(r)
                            left.append({"t": pl[2], "a": pl[3]})
                            pl[2], pl[3] = r["t"], r["a"]
            for pl in sorted([p_ for p_ in placed if not p_[2]], key=lambda p_: -p_[1].sum()):
                sz = pl[1].sum() * RES * RES
                if left:
                    r = min(left, key=lambda r: abs(r["a"] - sz))
                    left.remove(r)
                    pl[2], pl[3] = r["t"], r["a"]
                else:
                    pl[2] = "d"
            for c, m, t_, a_ in placed:
                res_rooms.append((m, t_, a_, n))
        fill_rooms = {n: True for n in fill_rooms}
        fill_list = res_rooms
    else:
        fill_list = []

    # xonalar
    rl, apt_mask = [], {}
    fill_px = np.zeros_like(wall)
    for m, t, a, n in fill_list:
        rl.append({"t": t, "a": a, "n": n, "bb": bbox(m), "r": flat(m)})
        apt_mask.setdefault(n, np.zeros_like(wall))
        apt_mask[n] |= m
        fill_px |= m
    extra = [e for e in extra if e[3] not in fill_rooms and not (e[0] & fill_px).any()]
    for m, t, a, n in extra:
        rl.append({"t": t, "a": a, "n": n, "bb": bbox(m), "r": flat(m)})
        apt_mask.setdefault(n, np.zeros_like(wall))
        apt_mask[n] |= m
    for sid, (si, sj, t, a, n) in enumerate(seeds, 1):
        m = own == sid
        if m.sum() * RES * RES < 0.6:
            continue
        if t == "common" or n in fill_rooms:
            continue
        m &= ~fill_px
        if m.sum() * RES * RES < 0.6:
            continue
        rl.append({"t": t, "a": a, "n": n, "bb": bbox(m), "r": flat(m)})
        apt_mask.setdefault(n, np.zeros_like(wall))
        apt_mask[n] |= m
    for m, t, a, n in owner_out.values():
        rl.append({"t": t, "a": a, "n": n, "bb": bbox(m), "r": flat(m)})
        apt_mask.setdefault(n, np.zeros_like(wall))
        apt_mask[n] |= m
    common = (own > 0) & ~np.isin(own, [sid for sid, s_ in enumerate(seeds, 1) if s_[2] != "common"])
    common |= fp & ~wall & ~gap & ((own == 0) | (own == -1))
    common &= ~fill_px
    common = nd.binary_opening(common, iterations=2)

    # har xonadon alohida: o'z xonalariga tegib turgan devor, deraza, eshik va panjaralar
    apts = {}
    E = int(0.45 / RES)
    for n, m in apt_mask.items():
        # alohida ko'rsatish faqat xonalar maydoni loyihaga yaqin bo'lsa (aks holda qavatda yaqinlashtiriladi)
        inner = sum(r["a"] for r in aptrooms.get(n, []) if r["t"] not in ("bl", "t"))
        got = (m & fp).sum() * RES * RES
        if not inner or not (0.75 <= got / inner <= 1.35):
            continue
        near = nd.binary_dilation(m, iterations=E)
        apts[str(n)] = {"bb": bbox(near), "walls": flat(full & near), "low": flat(low & near), "win": flat(win & near), "glz": flat(glz & near), "door": flat(door & near)}
    return {"res": RES, "rooms": rl, "common": flat(common), "out": [], "apts": apts, "w": round(w * RES, 3), "h": round(h * RES, 3),
            "walls": flat(full), "low": flat(low), "win": flat(win), "glz": flat(glz), "door": flat(door)}

def main():
    shutil.rmtree(OUT_IMG, ignore_errors=True)
    os.makedirs(OUT_IMG)
    plans, report, seen = {}, [], {}
    for b in load_blocks():
        doc = fitz.open(os.path.join(SRC, f"{b['id']}-blok.pdf"))
        sc = SCALE[b["id"]]
        for f in b["floors"]:
            if not f.get("apts"):
                continue
            page = doc[f["pg"] - 1]
            sp = spans(page)
            tabs = table_rects(sp)
            nums = []
            for t, r, _ in sp:
                m = NUM.match(t)
                c = fitz.Point((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2)
                if m and not any(c in tr for tr in tabs):
                    nums.append((float(m.group(1).replace(",", ".")), (c.x, c.y)))
            lab = labels(sp)
            found, used = {}, set()
            ROOMS.clear()
            # yorlig'i bor xonadonlar avval: ko'zgu xonadonlar bir xil maydonli, band nuqtalar qayta olinmaydi
            for a in sorted(f["apts"], key=lambda a: a["n"] not in lab):
                res = locate(a, nums, lab.get(a["n"]), sc, used, ROOMS)
                if res:
                    found[a["n"]] = res
                report.append(f"{b['id']}-{f['k']} #{a['n']}: " + (f"{res[2]}/{res[3]} xona" + ("" if a["n"] in lab else ", yorliqsiz") if res else "TOPILMADI"))
            if not found:
                continue
            crop = None
            for box, *_ in found.values():
                crop = box if crop is None else crop | box
            m = 1.5 * sc
            core = fitz.Rect(crop.x0 - m, crop.y0 - m, crop.x1 + m, crop.y1 + m)
            # devor, terrasa va o'lcham chiziqlari xonadonlardan tashqariga chiqadi — ularni ham qamrab olish
            pr = page.rect
            for dr in page.get_drawings():
                r = dr["rect"] * page.rotation_matrix
                if r.width < pr.width * 0.5 and r.height < pr.height * 0.5 and r.intersects(core) and not any(r.intersects(t) for t in tabs):
                    crop |= r
            crop = fitz.Rect(crop.x0 - 6, crop.y0 - 6, crop.x1 + 6, crop.y1 + 6) & pr
            for tr in tabs:  # jadvallar rasmga tushmasin
                if not crop.intersects(tr):
                    continue
                if tr.x0 > (crop.x0 + crop.x1) / 2:
                    crop.x1 = min(crop.x1, tr.x0 - 4)
                elif tr.y0 > (crop.y0 + crop.y1) / 2:
                    crop.y1 = min(crop.y1, tr.y0 - 4)
            z = min(PX_M / sc, 6000 / crop.width)
            # page.rect aylantirilgan koordinatalarda; get_pixmap clip ham shu tizimda
            pix = page.get_pixmap(matrix=fitz.Matrix(z, z), clip=crop, alpha=False)
            img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
            name = f"b{b['id']}-{f['k'].lower()}.webp"
            buf = io.BytesIO()
            img.save(buf, "WEBP", quality=76, method=6)
            data = buf.getvalue()
            h = hashlib.sha1(data).hexdigest()
            if h in seen:  # bir xil qavatlar bitta rasmdan foydalanadi
                name = seen[h]
            else:
                seen[h] = name
                open(os.path.join(OUT_IMG, name), "wb").write(data)
            g = walls3d(page, crop, sc, [p for _, p in nums if p not in used], {a["n"]: a["rooms"] for a in f["apts"]}, {n: an for n, (bx, an, *_) in found.items()})
            if g:
                json.dump(g, open(os.path.join(OUT_IMG, name.replace(".webp", ".3d.json")), "w"), separators=(",", ":"))
            W, H = crop.width, crop.height
            nz = lambda v, o, s: round((v - o) / s, 4)
            plans[f"{b['id']}-{f['k']}"] = {
                "src": f"/plans/{name}", "w": pix.width, "h": pix.height, "m": [round(W / sc, 2), round(H / sc, 2)],
                "g": f"/plans/{name.replace('.webp', '.3d.json')}" if g else None,
                "apts": {str(n): {"box": [nz(bx.x0, crop.x0, W), nz(bx.y0, crop.y0, H), round(bx.width / W, 4), round(bx.height / H, 4)],
                                   "pin": [nz(an[0], crop.x0, W), nz(an[1], crop.y0, H)]}
                         for n, (bx, an, *_) in found.items()},
            }
    json.dump(plans, open(OUT_JSON, "w"), ensure_ascii=False, separators=(",", ":"))
    print("\n".join(report))
    print(f"{len(plans)} ta reja → {OUT_IMG}")


if __name__ == "__main__":
    main()
