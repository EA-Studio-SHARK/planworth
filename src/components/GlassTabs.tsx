import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { usePrefs } from "../context/Prefs";
import { blurStyle, incomingBlur, outgoingBlur, SWITCH_SPRING } from "../lib/switch-motion";

function tabIcon(icon: ReactNode, on: boolean) {
  if (!isValidElement(icon)) return icon;
  return cloneElement(icon as ReactElement<{ weight?: string }>, {
    weight: on ? "fill" : "regular",
  });
}

function TabFace({
  icon,
  label,
  on,
  blur = 0,
}: {
  icon?: ReactNode;
  label: string;
  on: boolean;
  blur?: number;
}) {
  return (
    <span className="glass-tab-face" style={blurStyle(blur)}>
      {icon ? tabIcon(icon, on) : null}
      {label}
    </span>
  );
}

type Tab = {
  id: string;
  label: string;
  icon?: ReactNode;
  promo?: boolean;
};

type Pill = { x: number; w: number };

type Morph = { from: string | null; to: string | null; fromBlur: number; toBlur: number };

function center(p: Pill) {
  return p.x + p.w / 2;
}

function travel(from: Pill, to: Pill, pill: Pill) {
  const a = center(from);
  const b = center(to);
  if (Math.abs(b - a) < 1) return 1;
  return Math.max(0, Math.min(1, (center(pill) - a) / (b - a)));
}

function usePill(activeKey: string) {
  const railRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<Pill>({ x: 5, w: 0 });
  const [morph, setMorph] = useState<Morph>({ from: null, to: null, fromBlur: 0, toBlur: 0 });
  const target = useRef<Pill>({ x: 5, w: 0 });
  const motion = useRef({ x: 5, w: 0, vx: 0, vw: 0 });
  const raf = useRef(0);
  const prevActive = useRef(activeKey);
  const fromRect = useRef<{ key: string; x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const publish = (next: Pill, moving: boolean) => {
      setPill(next);
      const from = fromRect.current;
      if (!moving || !from || reduce) {
        setMorph({ from: null, to: null, fromBlur: 0, toBlur: 0 });
        return;
      }
      const p = travel(from, target.current, next);
      setMorph({
        from: from.key,
        to: activeKey,
        fromBlur: outgoingBlur(p),
        toBlur: incomingBlur(p),
      });
    };

    const tick = (now: number, last: number) => {
      const dt = Math.min(0.032, (now - last) / 1000);
      const { stiffness, damping } = SWITCH_SPRING;
      const cur = motion.current;
      const to = target.current;
      cur.vx += ((to.x - cur.x) * stiffness - cur.vx * damping) * dt;
      cur.vw += ((to.w - cur.w) * stiffness - cur.vw * damping) * dt;
      cur.x += cur.vx * dt;
      cur.w += cur.vw * dt;
      const stretch = Math.min(22, Math.abs(cur.vx) * 0.1);
      const next = { x: cur.x - stretch / 2, w: Math.max(0, cur.w + stretch) };
      const settled =
        Math.abs(to.x - cur.x) < 0.2 &&
        Math.abs(to.w - cur.w) < 0.2 &&
        Math.abs(cur.vx) < 4 &&
        Math.abs(cur.vw) < 4;
      if (settled) {
        cur.x = to.x;
        cur.w = to.w;
        cur.vx = 0;
        cur.vw = 0;
        fromRect.current = null;
        publish({ x: to.x, w: to.w }, false);
        raf.current = 0;
        return;
      }
      publish(next, true);
      raf.current = requestAnimationFrame((n) => tick(n, now));
    };

    const start = () => {
      if (reduce) {
        motion.current.x = target.current.x;
        motion.current.w = target.current.w;
        motion.current.vx = 0;
        motion.current.vw = 0;
        fromRect.current = null;
        publish({ x: target.current.x, w: target.current.w }, false);
        return;
      }
      if (raf.current) return;
      raf.current = requestAnimationFrame((now) => tick(now, now));
    };

    const measure = () => {
      const active = activeKey
        ? rail.querySelector<HTMLElement>(`[data-tab="${CSS.escape(activeKey)}"]`)
        : null;
      if (!active) {
        const cur = motion.current;
        target.current = { x: cur.x + cur.w / 2, w: 0 };
        if (prevActive.current !== activeKey) prevActive.current = activeKey;
        start();
        return;
      }
      target.current = { x: active.offsetLeft, w: active.offsetWidth };
      if (motion.current.w === 0) {
        motion.current.x = target.current.x;
        motion.current.w = target.current.w;
        fromRect.current = null;
        publish({ x: target.current.x, w: target.current.w }, false);
        prevActive.current = activeKey;
        return;
      }
      if (prevActive.current !== activeKey) {
        const prev = rail.querySelector<HTMLElement>(`[data-tab="${CSS.escape(prevActive.current)}"]`);
        if (prev && !reduce) {
          fromRect.current = { key: prevActive.current, x: prev.offsetLeft, w: prev.offsetWidth };
        }
        prevActive.current = activeKey;
      }
      start();
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(rail);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [activeKey]);

  function blurOf(id: string) {
    if (morph.from === id) return morph.fromBlur;
    if (morph.to === id) return morph.toBlur;
    return 0;
  }

  return { railRef, pill, blurOf };
}

export function GlassTabs({
  tabs,
  value,
  onChange,
  ariaLabel,
  size = "md",
}: {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  size?: "sm" | "md";
}) {
  const { railRef, pill, blurOf } = usePill(value);

  return (
    <div
      ref={railRef}
      className={`glass-rail size-${size}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      <span
        className="glass-pill"
        style={{ transform: `translateX(${pill.x}px)`, width: pill.w }}
        aria-hidden
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          data-tab={tab.id}
          role="tab"
          aria-selected={value === tab.id}
          className={`glass-tab ${value === tab.id ? "is-on" : ""} ${tab.promo ? "is-promo" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <TabFace icon={tab.icon} label={tab.label} on={value === tab.id} blur={blurOf(tab.id)} />
        </button>
      ))}
    </div>
  );
}

export function GlassNav({
  links,
}: {
  links: { to: string; label: string; icon?: ReactNode; end?: boolean; promo?: boolean; also?: string }[];
}) {
  const { t } = usePrefs();
  const location = useLocation();
  const active =
    links.find((l) =>
      l.end
        ? location.pathname === l.to
        : location.pathname.startsWith(l.to) || (l.also != null && location.pathname.startsWith(l.also)),
    )?.to ?? "";
  const { railRef, pill, blurOf } = usePill(active);

  return (
    <nav ref={railRef} className="glass-rail size-nav" aria-label={t.navMain}>
      <span
        className="glass-pill"
        style={{ transform: `translateX(${pill.x}px)`, width: pill.w }}
        aria-hidden
      />
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          data-tab={l.to}
          className={`glass-tab ${active === l.to ? "is-on" : ""} ${l.promo ? "is-promo" : ""}`.trim()}
        >
          <TabFace icon={l.icon} label={l.label} on={active === l.to} blur={blurOf(l.to)} />
        </NavLink>
      ))}
    </nav>
  );
}
