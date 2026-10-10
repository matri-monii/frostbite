import React, { useMemo, useState } from 'react';
import { StoreMap } from '../components/StoreMap.tsx';
import { EditorialFooter } from '../components/EditorialFooter.tsx';
import { useReveal } from '../hooks/useReveal.ts';

interface Stockist {
  id: string;
  name: string;
  city: string;
  neighborhood: string;
  zip: string;
  type: string;
  area: string;
  status: string;
  hours: string;
  lng: number;
  lat: number;
}

// PLACEHOLDER STOCKISTS: replace with your real retail partners before launch.
const STOCKISTS: Stockist[] = [
  { id: '1', name: 'Frostbite Flagship', city: 'Geneva', neighborhood: 'Old Town', zip: '1204', type: 'Flagship scoop shop', area: 'Old Town, Geneva', status: 'IN STOCK', hours: 'Wed - Sun: 13:00 - 21:00', lng: 6.1469, lat: 46.2017 },
  { id: '2', name: 'The Cold Room', city: 'New York', neighborhood: 'SoHo', zip: '10013', type: 'Tasting counter', area: 'SoHo, New York', status: 'IN STOCK', hours: 'Tue - Sun: 12:00 - 22:00', lng: -74.003, lat: 40.7233 },
  { id: '3', name: 'Corner Freezer', city: 'Los Angeles', neighborhood: 'Beverly Hills', zip: '90210', type: 'Grocery partner', area: 'Beverly Hills, Los Angeles', status: 'IN STOCK', hours: 'Daily: 07:00 - 22:00', lng: -118.4004, lat: 34.0736 },
  { id: '4', name: 'The Ice House', city: 'London', neighborhood: 'Knightsbridge', zip: 'SW1X', type: 'Food hall partner', area: 'Knightsbridge, London', status: 'LIMITED', hours: 'Mon - Sat: 10:00 - 21:00', lng: -0.1632, lat: 51.4994 },
  { id: '5', name: 'Ginza Cold Counter', city: 'Tokyo', neighborhood: 'Ginza', zip: '104-0061', type: 'Partner counter', area: 'Ginza, Tokyo', status: 'LIMITED', hours: 'Daily: 11:00 - 20:30', lng: 139.764, lat: 35.6717 },
  { id: '6', name: 'Porta Nuova Pint Bar', city: 'Milan', neighborhood: 'Porta Nuova', zip: '20154', type: 'Concept store', area: 'Porta Nuova, Milan', status: 'IN STOCK', hours: 'Tue - Sun: 11:00 - 20:00', lng: 9.1881, lat: 45.4859 },
];

export const FindUsPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  useReveal();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STOCKISTS;
    return STOCKISTS.filter((s) => [s.name, s.city, s.neighborhood, s.zip, s.area].some((v) => v.toLowerCase().includes(q)));
  }, [query]);

  return (
    <div className="relative w-full text-white">
      <div className="px-3 sm:px-6 pt-[110px] sm:pt-[130px] pb-24 grid grid-cols-1 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] gap-6 lg:gap-8 items-start">
        {/* Left: search + results */}
        <div className="space-y-8 lg:h-[calc(100svh-170px)] flex flex-col">
          <h1 className="reveal font-editorial text-[44px] sm:text-[60px] leading-[0.98] tracking-[-0.03em]">Find our products near you</h1>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }}
            placeholder="ENTER ZIP CODE OR CITY"
            aria-label="Search by zip code or city"
            className="w-full rounded-[100px] bg-white/[0.04] border border-white/35 px-7 py-5 font-mono-tag text-[14px] uppercase text-white placeholder:text-white/60 focus:outline-none focus:border-white focus:bg-white/[0.1] transition-colors"
          />
          <ul className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-2" data-lenis-prevent>
            {results.length === 0 && (
              <li className="font-mono-tag text-[12px] uppercase text-white/70 py-6">NOTHING NEAR THAT YET. TRY A CITY NAME.</li>
            )}
            {results.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setSelectedId(s.id)}
                  className={`glass w-full text-left rounded-[32px] p-6 focus-visible:outline-none ${selectedId === s.id ? '!bg-white/30 !border-white/70' : ''}`}
                >
                  <div className="flex items-center justify-between font-mono-tag text-[11px] uppercase text-white/70 mb-2">
                    <span>{s.city} // {s.zip}</span>
                    <span className="text-[#bff5dc]">{s.status}</span>
                  </div>
                  <div className="font-editorial text-[30px] leading-tight">{s.name}</div>
                  <div className="font-mono-tag text-[11px] uppercase text-white/65 mt-2">{s.type} · {s.area}</div>
                  <div className="font-mono-tag text-[11px] uppercase text-white/55 mt-1">{s.hours}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: map */}
        <div className="reveal lg:sticky lg:top-[110px]">
          <div className="relative rounded-[44px] sm:rounded-[56px] overflow-hidden h-[58svh] lg:h-[calc(100svh-170px)] bg-[#e8eaed] border border-white/10">
            <StoreMap
              pins={STOCKISTS}
              visibleIds={results.map((r) => r.id)}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>
        </div>
      </div>

      <EditorialFooter />
    </div>
  );
};
