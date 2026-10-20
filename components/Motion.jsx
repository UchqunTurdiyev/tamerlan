"use client";
import { useEffect } from "react";

// Sahifa bo'ylab animatsiyalar: scrollda paydo bo'lish, sanagich, parallaks, tilt, header holati
export default function Motion() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.classList.add("js");

    // [data-r] — ekranga kirganda .in klassi
    const countUp = (el) => {
      const to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
      const out = (v) => (el.textContent = v.toFixed(dec).replace(".", ","));
      if (reduce) return out(to);
      const t0 = performance.now(), dur = 1600;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur); out(to * (1 - Math.pow(1 - k, 4))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add("in");
      // animatsiyadan keyin data-r olib tashlanadi, hover o'z transition'iga qaytadi
      setTimeout(() => { el.removeAttribute("data-r"); el.style.removeProperty("--d"); }, 1000 + (parseFloat(getComputedStyle(el).getPropertyValue("--d")) || 0) * 1000);
      e.target.querySelectorAll("[data-count]").forEach(countUp);
      if (e.target.dataset.count) countUp(e.target);
      io.unobserve(e.target);
    }), { threshold: 0.06, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll("[data-r]").forEach((el) => io.observe(el));

    // header, progress, parallaks
    const head = document.querySelector(".header");
    const bar = document.querySelector(".progress");
    const px = [...document.querySelectorAll("[data-px]")];
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
        head && head.classList.toggle("is-scrolled", y > 40);
        if (bar) bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
        if (reduce) return;
        const vh = window.innerHeight;
        px.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          const k = (r.top + r.height / 2 - vh / 2) / vh;
          el.style.transform = `translate3d(0,${(k * -parseFloat(el.dataset.px || 60)).toFixed(1)}px,0)`;
        });
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // [data-tilt] — sichqoncha bilan 3D egilish
    const tilts = reduce || !window.matchMedia("(hover: hover)").matches ? [] : [...document.querySelectorAll("[data-tilt]")];
    const offs = tilts.map((el) => {
      const max = parseFloat(el.dataset.tilt || 8);
      const move = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(1000px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
        el.style.setProperty("--gx", `${(x + 0.5) * 100}%`); el.style.setProperty("--gy", `${(y + 0.5) * 100}%`);
      };
      const leave = () => { el.style.transform = ""; };
      el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave);
      return () => { el.removeEventListener("pointermove", move); el.removeEventListener("pointerleave", leave); };
    });

    return () => { io.disconnect(); window.removeEventListener("scroll", onScroll); offs.forEach((f) => f()); };
  }, []);
  return null;
}
