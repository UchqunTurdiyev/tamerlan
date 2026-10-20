"use client";
import { useEffect, useRef, useState } from "react";
import { planSVG } from "@/lib/plan";

// three.js maketi; faqat brauzerda yuklanadi
export default function Viewer3D({ apt, labels = true, onReady, onUser }) {
  const host = useRef(null);
  const inst = useRef(null);
  const aptRef = useRef(apt);
  const userRef = useRef(onUser);
  const [failed, setFailed] = useState(false);
  userRef.current = onUser;

  useEffect(() => {
    let dead = false;
    import("@/lib/three-scene")
      .then((m) => {
        if (dead || !host.current) return;
        try {
          inst.current = m.createViewer(host.current, { labels, onUser: () => userRef.current && userRef.current() });
          onReady && onReady(inst.current);
          if (aptRef.current) inst.current.show(aptRef.current);
        } catch (e) { setFailed(true); }
      })
      .catch(() => setFailed(true));
    return () => { dead = true; if (inst.current) inst.current.destroy(); inst.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    aptRef.current = apt;
    if (inst.current && apt) inst.current.show(apt);
  }, [apt]);

  return (
    <>
      <div ref={host} className="gl" />
      {failed && apt && (
        <div className="info">
          <div style={{ width: "min(320px,80%)" }} dangerouslySetInnerHTML={{ __html: planSVG(apt) }} />
          <p>3D ko'rinish bu qurilmada ochilmadi, soddalashtirilgan reja ko'rsatildi.</p>
        </div>
      )}
    </>
  );
}
