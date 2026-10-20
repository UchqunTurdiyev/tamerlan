// Brauzer tomonidagi Meta Pixel yordamchilari
export function track(event, params = {}, eventID) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (eventID) window.fbq("track", event, params, { eventID });
  else window.fbq("track", event, params);
}

export function getCookie(name) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : "";
}

// fbclid va UTM belgilarini saqlash (sahifa ochilganda bir marta)
export function captureAttribution() {
  try {
    const u = new URL(window.location.href);
    const fbclid = u.searchParams.get("fbclid");
    if (fbclid && !getCookie("_fbc")) {
      const v = `fb.1.${Date.now()}.${fbclid}`;
      document.cookie = `_fbc=${v}; path=/; max-age=${90 * 86400}; SameSite=Lax`;
    }
    const utm = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => {
      const v = u.searchParams.get(k);
      if (v) utm[k] = v;
    });
    if (Object.keys(utm).length) localStorage.setItem("bc_utm", JSON.stringify(utm));
  } catch (e) {}
}

export function getAttribution() {
  let utm = {};
  try { utm = JSON.parse(localStorage.getItem("bc_utm") || "{}"); } catch (e) {}
  return { fbp: getCookie("_fbp"), fbc: getCookie("_fbc"), utm };
}
