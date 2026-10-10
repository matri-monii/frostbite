import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { LAND_PATH, MAP_BOTTOM, MAP_SCALE, MAP_TOP, MAP_WIDTH } from '../data/worldMap.ts';

export interface MapPin {
  id: string;
  name: string;
  city: string;
  lng: number;
  lat: number;
  // optional details shown on the map's place card
  type?: string;
  area?: string;
  status?: string;
  hours?: string;
}

interface Props {
  pins: MapPin[];
  /** ids that match the current search (others are dimmed) */
  visibleIds: string[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

// Same Miller projection the land path was generated with (see src/data/worldMap.ts).
const project = (lng: number, lat: number) => ({
  x: (lng * Math.PI) / 180 * MAP_SCALE,
  y: -MAP_SCALE * 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * (lat * Math.PI) / 180)),
});

// The part of the world we allow the camera to show (a little sky above the Arctic, Antarctica trimmed).
const WORLD = { x0: -MAP_WIDTH / 2, x1: MAP_WIDTH / 2, y0: MAP_TOP - 30, y1: 263 };

interface View { cx: number; cy: number; vw: number }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Offline fallback map (midnight colours): no WebGL or tile server required. */
export const WorldMap: React.FC<Props> = ({ pins, visibleIds, selectedId, onSelect }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pinLayerRef = useRef<SVGGElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const view = useRef<View | null>(null);   // what is on screen right now
  const target = useRef<View | null>(null); // where the camera is gliding to
  const raf = useRef(0);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /** Apply a camera view to the DOM: viewBox + counter-scaled pins (pins keep a constant pixel size). */
  const paint = useCallback((v: View) => {
    const svg = svgRef.current;
    if (!svg || !size.w) return;
    const vh = (v.vw * size.h) / size.w;
    svg.setAttribute('viewBox', `${v.cx - v.vw / 2} ${v.cy - vh / 2} ${v.vw} ${vh}`);
    const k = size.w / v.vw; // px per map unit
    pinLayerRef.current?.querySelectorAll<SVGGElement>('[data-pin]').forEach((g) => {
      const x = g.dataset.x, y = g.dataset.y;
      const sel = g.dataset.selected === '1' ? 1.35 : 1;
      g.setAttribute('transform', `translate(${x} ${y}) scale(${(sel / k).toFixed(5)})`);
    });
  }, [size.w, size.h]);

  /** Work out the camera that frames a set of points. */
  const frame = useCallback((pts: { x: number; y: number }[], single: boolean): View => {
    const aspect = size.h / Math.max(size.w, 1);
    const coverMax = ((WORLD.y1 - WORLD.y0) / Math.max(aspect, 0.01)); // widest view that still fills the box vertically
    const maxVw = Math.min(MAP_WIDTH, coverMax * 1.3); // may show a little extra sea above/below so edge pins are not cropped
    let vw: number, cx: number, cy: number;
    if (single) {
      vw = 150;
      cx = pts[0].x; cy = pts[0].y;
    } else {
      const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
      const bw = Math.max(...xs) - Math.min(...xs), bh = Math.max(...ys) - Math.min(...ys);
      vw = Math.max(bw * 1.45, (bh * 1.45) / Math.max(aspect, 0.01), 220);
      cx = (Math.max(...xs) + Math.min(...xs)) / 2;
      cy = (Math.max(...ys) + Math.min(...ys)) / 2;
    }
    vw = Math.min(vw, maxVw);
    const vh = vw * aspect;
    cx = clamp(cx, WORLD.x0 + vw / 2, WORLD.x1 - vw / 2);
    cy = clamp(cy, WORLD.y0 + vh / 2, WORLD.y1 - vh / 2);
    return { cx, cy, vw };
  }, [size.w, size.h]);

  const visibleKey = visibleIds.join(',');

  // Choose a target whenever the selection / search / box size changes.
  useEffect(() => {
    if (!size.w || !size.h) return;
    const byId = new Map(pins.map((p) => [p.id, p]));
    const sel = selectedId ? byId.get(selectedId) : undefined;
    const vis = visibleIds.map((id) => byId.get(id)).filter(Boolean) as MapPin[];
    let next: View;
    if (sel) next = frame([project(sel.lng, sel.lat)], true);
    else if (vis.length === 1) next = frame([project(vis[0].lng, vis[0].lat)], true);
    else next = frame((vis.length ? vis : pins).map((p) => project(p.lng, p.lat)), false);

    target.current = next;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!view.current || reduce) {
      view.current = next;
      paint(next);
      return;
    }
    cancelAnimationFrame(raf.current);
    const step = () => {
      const cur = view.current!, tg = target.current!;
      // slow, eased glide (a fraction of the remaining distance each frame)
      const f = 0.035;
      const nxt = { cx: cur.cx + (tg.cx - cur.cx) * f, cy: cur.cy + (tg.cy - cur.cy) * f, vw: cur.vw + (tg.vw - cur.vw) * f };
      const done = Math.abs(tg.cx - nxt.cx) < 0.15 && Math.abs(tg.cy - nxt.cy) < 0.15 && Math.abs(tg.vw - nxt.vw) < 0.2;
      view.current = done ? tg : nxt;
      paint(view.current);
      if (!done) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, visibleKey, size.w, size.h, pins]);

  // Re-apply the camera after React re-renders pins (selected scale lives in the transform).
  useLayoutEffect(() => {
    if (view.current) paint(view.current);
  });

  const visible = new Set(visibleIds);

  return (
    <div ref={boxRef} className="absolute inset-0">
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox={`${WORLD.x0} ${WORLD.y0} ${MAP_WIDTH} ${WORLD.y1 - WORLD.y0}`}
        role="img"
        aria-label="Dark world map of Frostbite stockists"
      >
        {/* Sea */}
        <rect x={WORLD.x0 - 4000} y={WORLD.y0 - 4000} width={MAP_WIDTH + 8000} height={WORLD.y1 - WORLD.y0 + 8000} fill="#101c2a" />
        {/* Land, repeated left/right so a wide box never shows an edge */}
        {[-MAP_WIDTH, 0, MAP_WIDTH].map((dx) => (
          <g key={dx} transform={`translate(${dx} 0)`}>
            <path
              d={LAND_PATH}
              fill="#0b0c12"
              stroke="#252d39"
              strokeWidth={1}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}

        {/* Pins */}
        <g ref={pinLayerRef}>
          {pins.map((p) => {
            const { x, y } = project(p.lng, p.lat);
            const isSel = p.id === selectedId;
            return (
              <g
                key={p.id}
                data-pin
                data-x={x.toFixed(2)}
                data-y={y.toFixed(2)}
                data-selected={isSel ? '1' : '0'}
                tabIndex={0}
                role="button"
                aria-label={`${p.name}, ${p.city}`}
                onClick={() => onSelect(p.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(p.id); } }}
                style={{ cursor: 'pointer', opacity: visible.has(p.id) ? 1 : 0.22, transition: 'opacity 500ms ease', outline: 'none' }}
              >
                <title>{p.name}</title>
                {isSel && <circle cy={-19} r={22} fill="none" stroke="rgba(234,67,53,0.6)" strokeWidth={2} className="frost-pin-pulse" />}
                <path
                  transform="translate(-13.5 -43)"
                  d="M13.5 0C6.04 0 0 6.04 0 13.5 0 23.6 13.5 43 13.5 43S27 23.6 27 13.5C27 6.04 20.96 0 13.5 0z"
                  fill="#ea4335"
                  stroke="#c5221f"
                  strokeWidth={1}
                />
                <circle cy={-29.5} r={5.2} fill="#b31412" />
                <text
                  x={20}
                  y={-24}
                  fontFamily="Inter Tight, Arial, sans-serif"
                  fontWeight={600}
                  fontSize={13}
                  fill="#d8dde6"
                  stroke="#0b0c12"
                  strokeWidth={4}
                  paintOrder="stroke"
                  strokeLinejoin="round"
                  style={{ opacity: isSel ? 1 : 0, transition: 'opacity 500ms ease', pointerEvents: 'none' }}
                >
                  {p.city}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
