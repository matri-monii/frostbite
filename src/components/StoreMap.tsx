import React, { useEffect, useRef, useState } from 'react';
import type { Map as MLMap, Marker as MLMarker } from 'maplibre-gl';
import { GOOGLE_STYLE } from '../data/googleMapStyle.ts';
import { WorldMap, type MapPin } from './WorldMap.tsx';

interface Props {
  pins: MapPin[];
  /** ids that match the current search (others are dimmed) */
  visibleIds: string[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

type Phase = 'loading' | 'ready' | 'failed';
type MapLibre = typeof import('maplibre-gl');

/** The classic Google Maps teardrop: red body, dark-red dot. Tip sits on the coordinate. */
const PIN_SVG =
  '<svg viewBox="0 0 27 43" width="27" height="43" aria-hidden="true">' +
  '<path d="M13.5 0C6.04 0 0 6.04 0 13.5 0 23.6 13.5 43 13.5 43S27 23.6 27 13.5C27 6.04 20.96 0 13.5 0z" fill="#ea4335" stroke="#c5221f" stroke-width="1"/>' +
  '<circle cx="13.5" cy="13.5" r="5.2" fill="#b31412"/></svg>';

// Inline style on purpose: maplibre's own (unlayered) CSS sets `position: relative` on its container and
// would beat Tailwind's layered `absolute inset-0`, collapsing the map to zero height.
const MAP_BOX_STYLE: React.CSSProperties = { position: 'absolute', inset: 0 };

const CARD_SHADOW = 'shadow-[0_2px_8px_rgba(0,0,0,0.34),0_10px_28px_rgba(0,0,0,0.24)]';

/**
 * Store locator built with MapLibre + OpenFreeMap tiles, custom dark styling, and store pins.
 * If WebGL or the tile server is unavailable it falls back to the offline SVG world map
 * (same pins and dark styling), so the page never ends up with a blank box.
 */
export const StoreMap: React.FC<Props> = ({ pins, visibleIds, selectedId, onSelect }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const mlRef = useRef<MapLibre | null>(null);
  const markers = useRef<Map<string, { marker: MLMarker; el: HTMLButtonElement }>>(new Map());
  const firstFit = useRef(true);
  const [phase, setPhase] = useState<Phase>('loading');

  // Latest props for callbacks created once inside the init effect.
  const pinsRef = useRef(pins);
  pinsRef.current = pins;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const visibleKey = visibleIds.join(',');

  // ---- Create the map once -------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let map: MLMap | null = null;
    let ro: ResizeObserver | null = null;

    const teardown = () => {
      ro?.disconnect();
      ro = null;
      markers.current.forEach((m) => m.marker.remove());
      markers.current.clear();
      map?.remove();
      map = null;
      mapRef.current = null;
    };
    const fail = () => {
      if (cancelled) return;
      window.clearTimeout(timer);
      setPhase('failed');
      window.setTimeout(teardown, 0); // not from inside one of the map's own event handlers
    };

    (async () => {
      try {
        // The package is UMD: depending on the bundler the API sits on `.default` or on the namespace itself.
        const mod = (await import('maplibre-gl')) as unknown as { default?: MapLibre } & MapLibre;
        const ml: MapLibre = mod.default ?? mod;
        if (cancelled || !boxRef.current) return;
        mlRef.current = ml;

        map = new ml.Map({
          container: boxRef.current,
          style: GOOGLE_STYLE,
          center: [12, 28],
          zoom: 1.4,
          minZoom: 1,
          maxZoom: 18.5,
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          maxPitch: 0,
          cooperativeGestures: true, // Ctrl + scroll to zoom, two fingers on touch: like an embedded Google map
          fadeDuration: 200,
        });
        map.touchZoomRotate.disableRotation();
        map.keyboard.disableRotation();
        map.addControl(new ml.AttributionControl({ compact: false }), 'bottom-right');
        mapRef.current = map;

        // Pins
        for (const p of pinsRef.current) {
          const el = document.createElement('button');
          el.type = 'button';
          el.className = 'gm-pin';
          el.title = p.name;
          el.setAttribute('aria-label', `${p.name}, ${p.city}`);
          el.innerHTML = `<span class="gm-pin__body">${PIN_SVG}</span>`;
          el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            onSelectRef.current(p.id);
          });
          const marker = new ml.Marker({ element: el, anchor: 'bottom' }).setLngLat([p.lng, p.lat]).addTo(map);
          markers.current.set(p.id, { marker, el });
        }

        // Click on empty map closes the place card, like Google Maps.
        map.on('click', () => onSelectRef.current(null));

        // Detect an unusable tile service (offline, blocked) so we can fall back.
        let tilesOk = false;
        map.on('sourcedata', (e) => {
          if (e.sourceId === 'openmaptiles' && (e.sourceDataType === 'metadata' || e.tile)) tilesOk = true;
        });
        map.on('error', (e) => {
          const sourceId = (e as unknown as { sourceId?: string }).sourceId;
          if (!tilesOk && sourceId === 'openmaptiles') fail();
        });
        map.once('load', () => {
          if (!cancelled) setPhase('ready');
        });
        timer = window.setTimeout(() => {
          if (!tilesOk) fail();
        }, 10000);

        ro = new ResizeObserver(() => map?.resize());
        ro.observe(boxRef.current);
      } catch {
        fail(); // no WebGL, or the library failed to load
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      teardown();
    };
  }, []);

  // ---- Pin state: selected / dimmed ------------------------------------------------------------
  useEffect(() => {
    const vis = new Set(visibleIds);
    markers.current.forEach(({ el }, id) => {
      el.classList.toggle('is-selected', id === selectedId);
      el.classList.toggle('is-dim', !vis.has(id));
      el.style.zIndex = id === selectedId ? '2' : '1';
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, visibleKey, phase]);

  // ---- Camera: glide to the selection / fit the search results ---------------------------------
  useEffect(() => {
    const map = mapRef.current;
    const ml = mlRef.current;
    if (!map || !ml || phase !== 'ready') return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = reduce || firstFit.current ? 0 : 1900;
    firstFit.current = false;

    const byId = new Map(pins.map((p) => [p.id, p]));
    const sel = selectedId ? byId.get(selectedId) : undefined;
    const vis = visibleIds.map((id) => byId.get(id)).filter((p): p is MapPin => !!p);
    // On narrow screens the place card sits over the top of the map, so leave room above the pin.
    const narrow = (boxRef.current?.clientWidth ?? 800) < 640;
    const padding = { top: narrow && sel ? 180 : 60, bottom: 60, left: 60, right: 60 };

    if (sel) {
      map.flyTo({ center: [sel.lng, sel.lat], zoom: 14.5, duration, essential: true, padding });
    } else if (vis.length === 1) {
      map.flyTo({ center: [vis[0].lng, vis[0].lat], zoom: 13, duration, essential: true, padding });
    } else {
      const bounds = new ml.LngLatBounds();
      (vis.length ? vis : pins).forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding, maxZoom: 4.5, duration, essential: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, visibleKey, phase]);

  const selected = selectedId ? pins.find((p) => p.id === selectedId) : undefined;
  const stockColor = selected?.status === 'LIMITED' ? 'text-[#e7a64b]' : 'text-[#87c99b]';

  return (
    <div className="gm-root absolute inset-0 bg-[#0b0c12]">
      {phase === 'failed' ? (
        <WorldMap pins={pins} visibleIds={visibleIds} selectedId={selectedId} onSelect={onSelect} />
      ) : (
        <div ref={boxRef} style={MAP_BOX_STYLE} />
      )}

      {/* Map zoom controls */}
      {phase === 'ready' && (
        <div className={`absolute right-3 bottom-9 z-10 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#11141c] ${CARD_SHADOW}`}>
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => mapRef.current?.zoomIn()}
            className="flex h-10 w-10 items-center justify-center text-[#aab3c1] hover:bg-[#202631] hover:text-white focus-visible:outline-none focus-visible:bg-[#202631]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6z" /></svg>
          </button>
          <span className="h-px bg-white/10" aria-hidden="true" />
          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => mapRef.current?.zoomOut()}
            className="flex h-10 w-10 items-center justify-center text-[#aab3c1] hover:bg-[#202631] hover:text-white focus-visible:outline-none focus-visible:bg-[#202631]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19 13H5v-2h14z" /></svg>
          </button>
        </div>
      )}

      {/* Store details card */}
      {selected && (
        <div
          className={`gm-card absolute left-3 top-3 z-10 w-[min(330px,calc(100%-24px))] rounded-xl border border-white/10 bg-[#11141c] p-4 text-[#edf0f5] ${CARD_SHADOW}`}
          role="dialog"
          aria-label={selected.name}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => onSelect(null)}
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full text-[#a3adbd] hover:bg-[#202631] focus-visible:outline-none focus-visible:bg-[#202631]"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>

          <h3 className="pr-8 text-[19px] font-medium leading-snug">{selected.name}</h3>
          <p className="mt-0.5 pr-8 text-[13px] text-[#9aa4b4]">
            {[selected.type, selected.area].filter(Boolean).join(' · ')}
          </p>
          {selected.status && (
            <p className={`mt-2 text-[13px] font-medium capitalize ${stockColor}`}>{selected.status.toLowerCase()}</p>
          )}
          {selected.hours && <p className="mt-0.5 text-[13px] text-[#c1c8d4]">{selected.hours}</p>}

          <div className="mt-3.5 flex flex-wrap gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#668dbb] px-4 py-2 text-[13px] font-medium text-[#080b11] hover:bg-[#7da3cf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8bb6e8]/40"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="m21.71 11.29-9-9a1 1 0 0 0-1.42 0l-9 9a1 1 0 0 0 0 1.42l9 9a1 1 0 0 0 1.42 0l9-9a1 1 0 0 0 0-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 0 1 1-1h5V7.5l3.5 3.5z" /></svg>
              Directions
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-[13px] font-medium text-[#b8d5f7] hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8bb6e8]/40"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
