"use client";

import { useEffect, useRef } from "react";

/**
 * Animated "swarm" background: glowing particles drift on a soft flow field, link up into a
 * constellation, gather around the pointer, and burst apart on click before rebuilding.
 * Theme-aware (reads the accent CSS variables), pauses when the tab is hidden, and renders a
 * single still frame for visitors who prefer reduced motion.
 */

type P = { x: number; y: number; vx: number; vy: number; r: number; c: number; phase: number };

const LINK = 130; // px: max distance for a connecting line
const POINTER_R = 200; // px: radius in which particles swarm the pointer

function readColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return [v("--accent-1", "#3b82f6"), v("--accent-2", "#8b5cf6"), v("--accent-3", "#22d3ee")];
}

/** "#3b82f6" / "rgb(…)" → [r,g,b] */
function rgb(color: string): [number, number, number] {
  const hex = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = color.match(/(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [99, 102, 241];
}

export function SwarmBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    const particles: P[] = [];
    let palette = readColors().map(rgb);
    let dark = document.documentElement.classList.contains("dark");
    const pointer = { x: -9999, y: -9999, active: false };
    let burst: { x: number; y: number; t: number } | null = null;
    let raf = 0;
    let last = performance.now();

    const spawn = (): P => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.6 + 0.8,
      c: Math.floor(Math.random() * 3),
      phase: Math.random() * Math.PI * 2,
    });

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(150, Math.max(45, (w * h) / 11000)));
      while (particles.length < target) particles.push(spawn());
      particles.length = target;
    };

    const draw = (t: number, dt: number) => {
      ctx.clearRect(0, 0, w, h);
      const time = t / 1000;
      const alphaScale = dark ? 1 : 0.7;

      // Move
      for (const p of particles) {
        // Gentle flow field so the swarm never looks random-walky.
        const angle = Math.sin(p.x * 0.004 + time * 0.25) + Math.cos(p.y * 0.004 - time * 0.2);
        p.vx += Math.cos(angle) * 0.012 * dt;
        p.vy += Math.sin(angle) * 0.012 * dt;

        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const d = Math.hypot(dx, dy);
          if (d < POINTER_R && d > 0.1) {
            // Pull in, plus a sideways component so they orbit instead of collapsing.
            const f = (1 - d / POINTER_R) * 0.06 * dt;
            p.vx += (dx / d) * f - (dy / d) * f * 0.9;
            p.vy += (dy / d) * f + (dx / d) * f * 0.9;
            if (d < 28) {
              p.vx -= (dx / d) * 0.12 * dt;
              p.vy -= (dy / d) * 0.12 * dt;
            }
          }
        }

        if (burst) {
          const age = t - burst.t;
          if (age < 500) {
            const dx = p.x - burst.x;
            const dy = p.y - burst.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < 320) {
              const f = (1 - d / 320) * (1 - age / 500) * 0.9 * dt;
              p.vx += (dx / d) * f;
              p.vy += (dy / d) * f;
            }
          }
        }

        p.vx *= 0.965;
        p.vy *= 0.965;
        const speed = Math.hypot(p.vx, p.vy);
        const max = 3.2;
        if (speed > max) {
          p.vx = (p.vx / speed) * max;
          p.vy = (p.vy / speed) * max;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Wrap around the edges
        if (p.x < -20) p.x = w + 20;
        else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        else if (p.y > h + 20) p.y = -20;
      }
      if (burst && t - burst.t > 900) burst = null;

      // Links
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          if (dx > LINK || dx < -LINK) continue;
          const dy = a.y - b.y;
          if (dy > LINK || dy < -LINK) continue;
          const d = Math.hypot(dx, dy);
          if (d >= LINK) continue;
          const [r, g, bl] = palette[a.c];
          ctx.strokeStyle = `rgba(${r},${g},${bl},${(1 - d / LINK) * 0.22 * alphaScale})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        // Lines to the pointer make the swarm feel alive.
        if (pointer.active) {
          const d = Math.hypot(a.x - pointer.x, a.y - pointer.y);
          if (d < POINTER_R) {
            const [r, g, bl] = palette[a.c];
            ctx.strokeStyle = `rgba(${r},${g},${bl},${(1 - d / POINTER_R) * 0.35 * alphaScale})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.stroke();
          }
        }
      }

      // Particles with a soft glow and a slow twinkle
      for (const p of particles) {
        const [r, g, b] = palette[p.c];
        const tw = 0.6 + 0.4 * Math.sin(time * 1.6 + p.phase);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        glow.addColorStop(0, `rgba(${r},${g},${b},${0.35 * tw * alphaScale})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${r},${g},${b},${(0.55 + 0.45 * tw) * alphaScale})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Expanding ring on click
      if (burst) {
        const age = (t - burst.t) / 900;
        const [r, g, b] = palette[1];
        ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - age) * 0.5 * alphaScale})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(burst.x, burst.y, 20 + age * 300, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const loop = (t: number) => {
      const dt = Math.min(3, (t - last) / 16.67); // frame-rate independent, capped after tab switches
      last = t;
      draw(t, dt);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (reduced) {
        draw(performance.now(), 0);
        return;
      }
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.active = e.pointerType === "mouse";
    };
    const onLeave = () => {
      pointer.active = false;
    };
    const onDown = (e: PointerEvent) => {
      burst = { x: e.clientX, y: e.clientY, t: performance.now() };
    };
    const onVisibility = () => (document.hidden ? cancelAnimationFrame(raf) : start());

    // Re-read colours when the theme or accent changes.
    const themeObserver = new MutationObserver(() => {
      palette = readColors().map(rgb);
      dark = document.documentElement.classList.contains("dark");
      if (reduced) draw(performance.now(), 0);
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-accent", "style"] });

    resize();
    start();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10" />;
}
