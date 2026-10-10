import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * A light that traces the outline of its parent pill / circle on hover.
 * Drop it inside any element that has `relative glow-host` and a fully rounded border.
 * The light starts at the top-centre of the perimeter and runs both ways round
 * until the two ends meet at the bottom (see .glow-seg in index.css).
 */
export const PerimeterGlow: React.FC = () => {
  const ref = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const measure = () => setBox({ w: host.offsetWidth, h: host.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const { w, h } = box;
  const inset = 0.9; // centre of the stroke sits on the 1px glass border
  const x0 = inset, y0 = inset, W = w - inset * 2, H = h - inset * 2;
  const r = Math.max(0, Math.min(W, H) / 2);
  // Closed rounded-rect path, clockwise, starting at the top-centre.
  const d =
    w > 0
      ? `M${w / 2} ${y0}H${x0 + W - r}A${r} ${r} 0 0 1 ${x0 + W} ${y0 + r}V${y0 + H - r}A${r} ${r} 0 0 1 ${x0 + W - r} ${y0 + H}` +
        `H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y0 + H - r}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}H${w / 2}`
      : '';

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      className="glow-ring pointer-events-none absolute left-0 top-0 overflow-visible"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
    >
      {d && (
        <>
          {/* clockwise half */}
          <path className="glow-seg" d={d} pathLength={1} />
          {/* mirrored copy runs the other way round, so the light leaves the start point in both directions */}
          <path className="glow-seg" d={d} pathLength={1} transform={`translate(${w} 0) scale(-1 1)`} />
        </>
      )}
    </svg>
  );
};
