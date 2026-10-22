# Boulevard City — sayt

Next.js 14 (App Router). Mijoz blok va qavatni tanlaydi, xonadonni chizmadan qurilgan 3D maketda (devorlar, derazalar, eshiklar, pol va mebel) yoki 2D rejada ko'radi va ariza qoldiradi. Ariza Telegram botga tushadi. Sotuvchi tugma bosib sotuv summasini yozadi va Purchase hodisasi summa bilan Meta Conversions API'ga yuboriladi.

## Hodisalar oqimi

| Qachon | Hodisa | Qayerdan |
|---|---|---|
| Sahifa ochildi | PageView | Pixel |
| Mijoz boshqa xonadonni ko'rdi | ViewContent | Pixel |
| Ariza yuborildi | Lead | Pixel + CAPI (bir xil `event_id`, dublikat bo'lmaydi) |
| Botda "⭐ Sifatli lid" | QualifiedLead (nomi o'zgartiriladi) | CAPI |
| Botda "✅ Sotib oldi" + summa | Purchase (`value`, `currency`) | CAPI |

CAPI'ga telefon va ism SHA-256 bilan, shuningdek `fbp`, `fbc` (fbclid), IP va user-agent ariza paytida saqlangan holda yuboriladi. Shu sabab Purchase bir necha haftadan keyin yuborilsa ham reklama bilan bog'lanadi.

## O'rnatish

1. **Telegram bot.** @BotFather → `/newbot` → tokenni oling. Botni sotuv guruhiga qo'shing va admin qiling.
2. **Redis.** [upstash.com](https://upstash.com) → bepul Redis → REST URL va token. Yoki Vercel → Storage → Upstash/KV (o'zgaruvchilarni o'zi qo'shadi).
3. **Meta.** Events Manager → Pixel → Settings → Conversions API → *Generate access token*.
4. **GitHub va Vercel.** Loyihani GitHub'ga yuklang va Vercel'da import qiling. `.env.example` dagi o'zgaruvchilarni Vercel → Settings → Environment Variables ga yozing.
5. **Webhook.** Deploy'dan keyin brauzerda bir marta oching:
   `https://SAYTINGIZ/api/telegram/setup?key=SETUP_KEY`
6. **Chat ID.** Guruhda botga `/id` yozing. Chat ID va o'z ID'ingizni `TELEGRAM_CHAT_ID` va `TELEGRAM_ADMIN_IDS` ga yozing, keyin qayta deploy qiling.

## Test

- `META_TEST_EVENT_CODE` ga Events Manager → Test events kodini yozing.
- Saytda ariza qoldiring. Guruhga xabar tushadi, Test events'da Lead ko'rinadi.
- Botda "✅ Sotib oldi" ni bosing va javobga `750 mln` yozing. Purchase 750 000 000 UZS bilan ko'rinadi.
- Test tugagach `META_TEST_EVENT_CODE` ni o'chirib, qayta deploy qiling.

Summa formatlari: `750000000`, `750 000 000`, `750 mln`, `1,2 mlrd`, `65000$` (USD sifatida).

## Mahalliy ishga tushirish

```bash
npm install
cp .env.example .env.local   # qiymatlarni yozing
npm run dev
```

## Fayllar

- `lib/data.js` — bloklar, qavatlar, xonadonlar (chizmalar eksplikatsiyasidan). Xonadonni o'zgartirish shu yerda.
- `public/plans/*.webp`, `public/plans/*.3d.json`, `lib/plans.json` — qavat rejalari, 3D uchun devor/deraza/eshik/xona o'rinlari va har xonadonning rejadagi joyi. PDF'lardan avtomatik olinadi:
  ```bash
  pip install pymupdf pillow numpy scipy scikit-image
  python3 scripts/plans.py ~/Downloads   # 6-blok.pdf va 8-blok.pdf turgan papka
  ```
  `lib/data.js` yoki chizmalar o'zgarsa qayta ishga tushiring.
- `components/PlanViewer.jsx` — 2D reja ko'rgich (surish, kattalashtirish, xonadonga yaqinlashish).
- `components/Plan3D.jsx`, `lib/scene3d.js` — 3D maket (three.js, faqat 3D ochilganda yuklanadi).
- `app/api/lead` — arizani qabul qilish, CAPI Lead, Telegram.
- `app/api/telegram` — bot tugmalari va sotuv summasi, CAPI Purchase.
# tamerlan
