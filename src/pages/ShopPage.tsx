import React, { useState } from 'react';
import { FLAVORS } from '../data/flavors.ts';
import { FlavorItem } from '../types/index.ts';
import { EditorialFooter } from '../components/EditorialFooter.tsx';
import { ScrambleText } from '../components/ScrambleText.tsx';
import { useReveal } from '../hooks/useReveal.ts';
import { formatINR } from '../utils/currency.ts';

interface ShopPageProps {
  currentFlavor: FlavorItem;
  onSelectFlavor: (flavor: FlavorItem) => void;
  onAddToCart: (flavor: FlavorItem, packSize: '6-pack' | '12-pack', purchaseType: 'one-time' | 'subscribe') => void;
  onNavigateToCart: () => void;
}

type Tab = 'description' | 'ingredients' | 'nutrition';

const TABS: { id: Tab; label: string }[] = [
  { id: 'description', label: 'DESCRIPTION' },
  { id: 'ingredients', label: 'INGREDIENTS' },
  { id: 'nutrition', label: 'NUTRITION' },
];

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] gap-2 sm:gap-8 py-8 border-t border-white/25">
    <div className="font-editorial text-[30px] sm:text-[34px] leading-none text-white">{label}</div>
    <div className="font-display text-[16px] sm:text-[17px] leading-[1.5] tracking-[-0.01em] text-white/90 max-w-[560px]">{children}</div>
  </div>
);

export const ShopPage: React.FC<ShopPageProps> = ({ currentFlavor, onSelectFlavor, onAddToCart, onNavigateToCart }) => {
  const [packSize, setPackSize] = useState<'6-pack' | '12-pack'>('6-pack');
  const [purchaseType, setPurchaseType] = useState<'one-time' | 'subscribe'>('one-time');
  const [tab, setTab] = useState<Tab>('description');
  const [added, setAdded] = useState(false);

  useReveal([currentFlavor.id, tab]);

  const base = packSize === '6-pack' ? currentFlavor.priceOneTime : currentFlavor.priceOneTime * 1.85;
  const price = purchaseType === 'subscribe' ? base * 0.9 : base;

  const handleAdd = () => {
    onAddToCart(currentFlavor, packSize, purchaseType);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  const n = currentFlavor.nutrition;
  const nutritionRows: [string, string][] = [
    ['Serving size', currentFlavor.servingSize],
    ['Calories', String(n.calories)],
    ['Total fat', n.totalFat],
    ['Saturated fat', n.saturatedFat],
    ['Cholesterol', n.cholesterol],
    ['Sodium', n.sodium],
    ['Total carbohydrate', n.totalCarb],
    ['Total sugars', `${n.totalSugars} (${n.addedSugars})`],
    ['Protein', n.protein],
    ['Calcium', n.calcium],
  ];

  return (
    <div className="relative w-full text-white">
      <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-3 px-2 sm:px-3 pt-[88px] sm:pt-[100px] lg:pt-3 items-start">
        {/* LEFT: flavour scene (crossfades between flavours) */}
        <div className="relative lg:sticky lg:top-3 h-[62svh] lg:h-[calc(100svh-24px)] rounded-[44px] sm:rounded-[56px] overflow-hidden bg-black/20">
          {FLAVORS.map((f) => (
            <img
              key={f.id}
              src={f.imageUrl}
              alt={`${f.name} in a bowl`}
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1100ms]"
              style={{ opacity: f.id === currentFlavor.id ? 1 : 0, transitionTimingFunction: 'var(--ease-glass)' }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10 pointer-events-none" />

          {/* flavour switcher */}
          <div className="absolute left-4 right-4 sm:left-6 sm:right-6 bottom-4 sm:bottom-6 flex flex-wrap gap-2">
            {FLAVORS.map((f) => {
              const on = f.id === currentFlavor.id;
              return (
                <button
                  key={f.id}
                  onClick={() => onSelectFlavor(f)}
                  className={`glass rounded-[100px] pl-2 pr-5 py-2 flex items-center gap-3 focus-visible:outline-none ${on ? '!bg-white/30 !border-white/70' : ''}`}
                >
                  <span className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center" style={{ background: f.tint }}>
                    <img src={f.canThumbnailUrl} alt="" className="h-8 w-auto" />
                  </span>
                  <span className="font-mono-tag text-[12px] uppercase text-white">
                    <ScrambleText text={f.headlineTitle.toUpperCase()} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: details */}
        <div className="relative px-2 sm:px-8 lg:pt-[120px] pb-40">
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-10">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-[100px] px-6 py-3 font-mono-tag text-[12px] sm:text-[13px] uppercase border transition-all duration-500 focus-visible:outline-none ${
                  tab === t.id ? 'border-white text-white bg-white/10' : 'border-white/25 text-white/75 hover:border-white/60'
                }`}
              >
                <ScrambleText text={t.label} />
              </button>
            ))}
          </div>

          <h1 key={currentFlavor.id} className="reveal font-editorial text-[44px] sm:text-[60px] xl:text-[68px] leading-[0.97] tracking-[-0.03em] text-white max-w-[820px]">
            {currentFlavor.headlineSerif}
          </h1>

          <div key={`${currentFlavor.id}-${tab}`} className="reveal mt-14">
            {tab === 'description' && (
              <>
                <Row label="Tasting notes">{currentFlavor.tastingNotesShort}</Row>
                <Row label="What it is">{currentFlavor.description}</Row>
                <Row label="The story">{currentFlavor.descriptionDetailed}</Row>
                <Row label="Made with">
                  <div className="flex flex-wrap gap-2">
                    {currentFlavor.functionalPills.map((p) => (
                      <span key={p} className="rounded-[100px] border border-white/40 px-3.5 py-1.5 font-mono-tag text-[11px] uppercase">{p}</span>
                    ))}
                  </div>
                </Row>
              </>
            )}
            {tab === 'ingredients' && (
              <>
                <Row label="Ingredients">{currentFlavor.ingredientsText}</Row>
                <Row label="Contains">
                  {currentFlavor.id === 'blood-orange-sorbet'
                    ? 'No dairy and no eggs. Made in a kitchen that also handles milk, eggs and tree nuts.'
                    : 'Milk and eggs. Made in a kitchen that also handles tree nuts.'}
                </Row>
              </>
            )}
            {tab === 'nutrition' && (
              <>
                {nutritionRows.map(([k, v]) => (
                  <Row key={k} label={k}>{v}</Row>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <EditorialFooter />

      {/* Floating order widget: stays bottom-right while scrolling */}
      <aside
        aria-label="Your selection"
        className="glass-card fixed z-30 right-3 bottom-3 left-3 sm:left-auto sm:w-[300px] rounded-[40px] p-4 sm:p-5 flex sm:flex-col items-center gap-4 text-center bg-[#2b4258]/40"
      >
        <img src={currentFlavor.canThumbnailUrl} alt="" className="h-[84px] sm:h-[150px] w-auto drop-shadow-xl shrink-0" key={currentFlavor.id} />
        <div className="flex-1 w-full min-w-0 space-y-3">
          <div>
            <div className="font-display font-medium text-[20px] sm:text-[22px] uppercase leading-[0.95] tracking-[-0.05em]">{currentFlavor.name}</div>
            <div className="font-editorial text-[18px] text-white/90 mt-1">{packSize === '6-pack' ? '6 pints' : '12 pints'}</div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(['6-pack', '12-pack'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPackSize(p)}
                className={`rounded-[100px] py-1.5 font-mono-tag text-[11px] uppercase border transition-colors ${packSize === p ? 'bg-white/25 border-white' : 'border-white/25 text-white/70 hover:border-white/55'}`}
              >
                {p === '6-pack' ? '6 PINTS' : '12 PINTS'}
              </button>
            ))}
            <button
              onClick={() => setPurchaseType('one-time')}
              className={`rounded-[100px] py-1.5 font-mono-tag text-[11px] uppercase border transition-colors ${purchaseType === 'one-time' ? 'bg-white/25 border-white' : 'border-white/25 text-white/70 hover:border-white/55'}`}
            >
              ONE-TIME
            </button>
            <button
              onClick={() => setPurchaseType('subscribe')}
              className={`rounded-[100px] py-1.5 font-mono-tag text-[11px] uppercase border transition-colors ${purchaseType === 'subscribe' ? 'bg-white/25 border-white' : 'border-white/25 text-white/70 hover:border-white/55'}`}
            >
              SUB -10%
            </button>
          </div>
          <button onClick={handleAdd} className="btn-solid w-full py-3.5 font-mono-tag text-[13px] uppercase">
            {added ? '✓ ADDED' : <ScrambleText text={`ADD TO CART - ${formatINR(price)}`} />}
          </button>
          {added && (
            <button onClick={onNavigateToCart} className="font-mono-tag text-[11px] uppercase text-white/80 underline underline-offset-4">
              VIEW CART
            </button>
          )}
        </div>
      </aside>
    </div>
  );
};
