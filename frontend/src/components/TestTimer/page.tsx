"use client";
import { useEffect, useRef, useState } from "react";

type Props = { label?: string };

export default function TestTimer({ label }: Props) {
  const [ms, setMs] = useState(0);
  const pausedRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  const fmt = (val: number) => {
    const s = Math.floor(val / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? `${h}h ` : ``}${m}m ${sec}s`;
  };

  useEffect(() => {
    const tick = () => {
      if (!pausedRef.current) setMs((v) => v + 1000);
    };
    intervalRef.current = window.setInterval(tick, 1000);

    const onVisibility = () => {
      pausedRef.current = document.visibilityState !== "visible";
    };
    const onBlur = () => {
      pausedRef.current = true;
    };
    const onFocus = () => {
      pausedRef.current = false;
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-black/70 text-white px-4 py-2 shadow-lg backdrop-blur">
      <div className="text-xs opacity-80">{label || "Tiempo activo"}</div>
      <div className="text-lg font-semibold">{fmt(ms)}</div>
    </div>
  );
}