import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";

export const SWITCH_SPRING = { stiffness: 102, damping: 15.4 } as const;
export const SWITCH_BLUR = 7;

export function outgoingBlur(p: number) {
  const t = Math.max(0, Math.min(1, p));
  return Math.sin(t * Math.PI) * SWITCH_BLUR;
}

export function incomingBlur(p: number) {
  const t = Math.max(0, Math.min(1, p));
  return (1 - t) * SWITCH_BLUR;
}

export function blurStyle(blur: number, fade = 1): CSSProperties | undefined {
  const clamped = Math.max(0, Math.min(1, fade));
  if (blur <= 0.2 && clamped >= 0.98) return undefined;
  const t = Math.max(0, Math.min(1, blur / SWITCH_BLUR));
  const opacity = (blur > 0.2 ? 0.55 + 0.45 * (1 - t) : 1) * clamped;
  return {
    filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
    opacity,
  };
}

export function useFaceSwitch(value: string) {
  const [from, setFrom] = useState<string | null>(null);
  const [p, setP] = useState(1);
  const last = useRef(value);
  const motion = useRef({ x: 1, v: 0 });
  const raf = useRef(0);

  if (last.current !== value) {
    setFrom(last.current);
    last.current = value;
    setP(0);
    motion.current = { x: 0, v: 0 };
  }

  useLayoutEffect(() => {
    if (!from) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      motion.current = { x: 1, v: 0 };
      setP(1);
      setFrom(null);
      return;
    }

    motion.current = { x: 0, v: 0 };
    setP(0);

    const tick = (now: number, lastT: number) => {
      const dt = Math.min(0.032, (now - lastT) / 1000);
      const cur = motion.current;
      cur.v += ((1 - cur.x) * SWITCH_SPRING.stiffness - cur.v * SWITCH_SPRING.damping) * dt;
      cur.x += cur.v * dt;
      const settled = Math.abs(1 - cur.x) < 0.002 && Math.abs(cur.v) < 0.04;
      if (settled) {
        cur.x = 1;
        cur.v = 0;
        setP(1);
        setFrom(null);
        raf.current = 0;
        return;
      }
      setP(Math.max(0, Math.min(1, cur.x)));
      raf.current = requestAnimationFrame((n) => tick(n, now));
    };

    raf.current = requestAnimationFrame((now) => tick(now, now));
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [from, value]);

  return {
    from,
    p,
    fromBlur: from ? outgoingBlur(p) : 0,
    toBlur: from ? incomingBlur(p) : 0,
  };
}
