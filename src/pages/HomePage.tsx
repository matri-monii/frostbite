import React, { useEffect, useRef, useState } from 'react';
import { FLAVORS } from '../data/flavors.ts';
import { FlavorItem } from '../types/index.ts';
import { StoryModal } from '../components/StoryModal.tsx';
import { EditorialFooter } from '../components/EditorialFooter.tsx';
import { ScrambleText } from '../components/ScrambleText.tsx';
import { useReveal } from '../hooks/useReveal.ts';
import { NOISE } from '../components/AtmosphericBackground.tsx';

interface HomePageProps {
  onSelectFlavorForShop: (flavor: FlavorItem) => void;
  onNavigateToShop: () => void;
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * Scroll-driven brand reveal.
 *  0   – 0.50  the wordmark slowly fades up out of the dark (takes a long scroll to get clear)
 *  0.50 – 0.90 it locks in place and softens into a blur while the description rises from below
 *  0.90 – 1    everything holds, then the page continues
 * Progress is eased with a lerp so the motion stays glassy even with a notchy mouse wheel.
 */
const BrandReveal: React.FC<{ onReadMore: () => void }> = ({ onReadMore }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let target = 0;
    let current = 0;
    let raf = 0;

    const compute = () => {
      const wrap = wrapRef.current;
      if (!wrap) return 0;
      const range = wrap.offsetHeight - window.innerHeight;
      return clamp(-wrap.getBoundingClientRect().top / Math.max(range, 1));
    };

    const paint = (p: number) => {
      const reveal = smooth(0.02, 0.5, p);
      const lock = smooth(0.5, 0.92, p);
      const copy = smooth(0.56, 0.92, p);

      if (markRef.current) {
        const opacity = (0.07 + 0.93 * reveal) * (1 - 0.62 * lock);
        const scale = 0.94 + 0.06 * reveal + 0.05 * lock;
        markRef.current.style.opacity = String(opacity);
        markRef.current.style.filter = `blur(${(lock * 18).toFixed(2)}px)`;
        markRef.current.style.transform = `translate3d(0, ${(-lock * 8).toFixed(2)}vh, 0) skewX(-10deg) scale(${scale.toFixed(4)})`;
      }
      if (eyebrowRef.current) {
        eyebrowRef.current.style.opacity = String(copy);
        eyebrowRef.current.style.transform = `translate3d(0, ${((1 - copy) * 90).toFixed(1)}px, 0)`;
      }
      if (copyRef.current) {
        copyRef.current.style.opacity = String(copy);
        copyRef.current.style.transform = `translate3d(0, ${((1 - copy) * 160).toFixed(1)}px, 0)`;
        copyRef.current.style.pointerEvents = copy > 0.85 ? 'auto' : 'none';
      }
      if (hintRef.current) hintRef.current.style.opacity = String(1 - smooth(0, 0.08, p));
    };

    const loop = () => {
      current += (target - current) * 0.09;
      if (Math.abs(target - current) < 0.0004) current = target;
      paint(current);
      raf = current === target ? 0 : requestAnimationFrame(loop);
    };
    const kick = () => {
      target = compute();
      if (reduce) { current = target; paint(current); return; }
      if (!raf) raf = requestAnimationFrame(loop);
    };

    kick();
    paint(current);
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    return () => {
      window.removeEventListener('scroll', kick);
      window.removeEventListener('resize', kick);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative h-[430vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden flex items-center justify-center px-4">
        <div
          ref={markRef}
          className="wordmark absolute text-white text-[clamp(88px,19vw,330px)] select-none pointer-events-none"
          style={{ opacity: 0.07, willChange: 'opacity, transform, filter' }}
          aria-label="Frostbite"
        >
          frostbite
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-[980px] mt-[10vh]">
          <div
            ref={eyebrowRef}
            className="font-mono-tag text-[12px] sm:text-[14px] uppercase text-white/55 mb-6"
            style={{ opacity: 0, willChange: 'opacity, transform' }}
          >
            YOU&apos;VE ARRIVED
          </div>
          <div ref={copyRef} style={{ opacity: 0, willChange: 'opacity, transform', pointerEvents: 'none' }}>
            <p className="font-editorial text-white text-[34px] sm:text-[52px] md:text-[62px] leading-[0.98] tracking-[-0.035em]">
              Small-batch ice cream made with real ingredients, serious flavor and a cold, balanced approach to meeting the moment.
            </p>
            <button
              onClick={onReadMore}
              className="glass mt-10 rounded-[100px] px-8 py-4 font-mono-tag text-[13px] uppercase text-white/90 focus-visible:outline-none"
            >
              <ScrambleText text="READ MORE" />
            </button>
          </div>
        </div>

        <div
          ref={hintRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono-tag text-[11px] uppercase text-white/45 flex flex-col items-center gap-2"
        >
          <span>SCROLL</span>
          <span className="block w-px h-8 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </div>
    </div>
  );
};

/** One product card: glass at rest, flavour-colour face on hover. */
const ProductCard: React.FC<{
  flavor: FlavorItem;
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onShop: () => void;
}> = ({ flavor, active, onActivate, onDeactivate, onShop }) => (
  <div className="reveal">
  <div
    onMouseEnter={onActivate}
    onMouseLeave={onDeactivate}
    onFocus={onActivate}
    onBlur={onDeactivate}
    onClick={onActivate}
    tabIndex={0}
    className={`glass-card group relative rounded-[52px] overflow-hidden min-h-[640px] md:min-h-[760px] cursor-pointer outline-none transition-transform duration-[900ms] ${
      active ? '-translate-y-1' : ''
    }`}
    style={{ transitionTimingFunction: 'var(--ease-glass)' }}
  >
    {/* Rest face */}
    <div
      className="absolute inset-0 flex flex-col items-center justify-between py-10 px-6 transition-opacity duration-700"
      style={{ opacity: active ? 0 : 1 }}
    >
      <div className="flex-1 flex items-center justify-center">
        <img
          src={flavor.canThumbnailUrl}
          alt={`${flavor.name} pint`}
          className="h-[360px] md:h-[430px] w-auto drop-shadow-[0_30px_40px_rgba(0,0,0,0.3)]"
          draggable={false}
        />
      </div>
      <div className="text-center">
        <h3 className="font-display font-medium text-[28px] sm:text-[32px] uppercase leading-[0.92] tracking-[-0.05em] text-white">
          {flavor.name}
        </h3>
        <p className="font-editorial text-[22px] text-white mt-3">{flavor.tastingNotesShort}</p>
      </div>
    </div>

    {/* Flavour face */}
    <div
      className="absolute inset-[6px] rounded-[46px] overflow-hidden transition-opacity duration-700 border border-white/30"
      style={{
        opacity: active ? 1 : 0,
        pointerEvents: active ? 'auto' : 'none',
        background: `linear-gradient(180deg, ${flavor.gradient[0]}cc 0%, ${flavor.gradient[1]}d9 55%, ${flavor.gradient[2]} 100%)`,
      }}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-between py-9 px-6 text-center text-white">
        <div className="flex flex-col items-center gap-3">
          <img src="/images/logo.png" alt="" draggable={false} className="w-12 h-12 object-contain select-none" />
          <span className="font-mono-tag text-[13px] uppercase text-white/85">{flavor.coordinates}</span>
        </div>

        <div className="relative w-full">
          <span
            aria-hidden="true"
            className="wordmark absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] sm:text-[190px] text-white/[0.16] whitespace-nowrap select-none"
          >
            -18°
          </span>
          <h3 className="relative font-display font-medium text-[26px] sm:text-[30px] uppercase leading-[0.95] tracking-[-0.04em]">
            {flavor.name}
          </h3>
        </div>

        <div className="flex flex-col items-center gap-5 w-full">
          <p className="font-editorial text-[22px]">{flavor.tastingNotesShort}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {flavor.functionalPills.map((p) => (
              <span key={p} className="rounded-[100px] border border-white/60 px-3.5 py-1.5 font-display text-[12px] uppercase tracking-[-0.02em]">
                {p}
              </span>
            ))}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onShop(); }}
            className="btn-solid w-full py-4 font-mono-tag text-[14px] uppercase"
          >
            <ScrambleText text="SHOP" />
          </button>
        </div>
      </div>
    </div>
  </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Flavour-panel hero: three tall panels, one active at a time         */
/* ------------------------------------------------------------------ */
const HERO_WIDTH_MS = 1500;
const HERO_EASE = 'cubic-bezier(0.42, 0, 0.18, 1)';
const TEXT_DELAY_MS = 550; // the new panel's copy waits until its width is well under way
const TEXT_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

const usePrefersReducedMotion = () => {
  const [reduce, setReduce] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduce(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduce;
};

const FlavorHero: React.FC<{ onShop: (flavor: FlavorItem) => void }> = ({ onShop }) => {
  const reduce = usePrefersReducedMotion();
  const [active, setActive] = useState(1);
  // `shown` = panel whose text is currently revealed; `settled` = panel whose width animation has finished
  const [shown, setShown] = useState<number | null>(null);
  const [settled, setSettled] = useState<number | null>(null);

  useEffect(() => {
    if (reduce) {
      setShown(active);
      setSettled(null);
      return;
    }
    // new active panel: text starts hidden, slides in after TEXT_DELAY_MS, breathe only after the width tween ends
    setShown(null);
    setSettled(null);
    const t1 = window.setTimeout(() => setShown(active), TEXT_DELAY_MS);
    const t2 = window.setTimeout(() => setSettled(active), HERO_WIDTH_MS);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [active, reduce]);

  const textStyle = (visible: boolean, delay = 0): React.CSSProperties => {
    if (reduce) return { opacity: visible ? 1 : 0 };
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translate3d(0,0,0)' : 'translate3d(0,28px,0)',
      transition: visible
        ? `opacity 750ms ${TEXT_EASE} ${delay}ms, transform 750ms ${TEXT_EASE} ${delay}ms`
        : 'opacity 180ms ease-out, transform 0s linear 180ms',
    };
  };

  return (
    <section className="relative z-10 w-full h-[100svh] min-h-[640px] p-2" aria-label="Flavours">
      <div className="flex flex-col md:flex-row gap-[6px] w-full h-full">
        {FLAVORS.map((f, i) => {
          const isActive = active === i;
          const isShown = shown === i;
          return (
            <div
              key={f.id}
              role="group"
              aria-label={f.name}
              aria-current={isActive}
              tabIndex={0}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className="relative min-h-0 min-w-0 overflow-hidden rounded-[28px] md:rounded-[44px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{
                flex: isActive ? '4.1 1 0%' : '1 1 0%',
                transition: reduce ? 'none' : `flex ${HERO_WIDTH_MS}ms ${HERO_EASE}`,
                transform: 'translateZ(0)', // keeps rounded clipping clean while children transform
              }}
            >
              {/* Scene image */}
              <img
                src={f.imageUrl}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover select-none"
                style={{
                  objectPosition: isActive ? '50% 50%' : '44% 56%',
                  transform: !reduce && settled === i ? 'scale(1.035)' : 'scale(1)',
                  transition: reduce
                    ? 'none'
                    : `object-position ${HERO_WIDTH_MS}ms ${HERO_EASE}, transform ${settled === i ? '7000ms' : '600ms'} ease-in-out`,
                }}
              />

              {/* Overlays: light dark wash on strips, bottom-up gradient on the active panel */}
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-black/10"
                style={{ opacity: isActive ? 0 : 1, transition: reduce ? 'none' : `opacity ${HERO_WIDTH_MS}ms ${HERO_EASE}` }}
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
                style={{ opacity: isActive ? 1 : 0, transition: reduce ? 'none' : `opacity ${HERO_WIDTH_MS}ms ${HERO_EASE}` }}
              />
              {/* Film grain */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-30"
                style={{ backgroundImage: NOISE, backgroundRepeat: 'repeat' }}
              />

              {/* ---- Narrow strip: flavour name only (the scene already shows the product) ---- */}
              <div
                aria-hidden={isActive}
                className="absolute inset-0 pointer-events-none"
                style={{
                  opacity: isActive ? 0 : 1,
                  transition: reduce ? 'none' : isActive ? 'opacity 300ms ease-out' : 'opacity 900ms ease-out 700ms',
                }}
              >
                <span className="absolute font-mono-tag uppercase text-white whitespace-nowrap text-[14px] md:text-[15px] [-webkit-text-stroke:0.7px_#fff] [text-shadow:0_1px_16px_rgba(0,0,0,0.5)] left-5 bottom-4 md:left-1/2 md:bottom-7 md:-translate-x-1/2">
                  {f.name}
                </span>
              </div>

              {/* ---- Active panel: lower-left copy ---- */}
              <div
                className="absolute left-5 right-5 bottom-5 md:left-14 md:bottom-14 md:right-6 lg:right-[340px] flex flex-col items-start"
                style={{ pointerEvents: isShown ? 'auto' : 'none' }}
              >
                <div
                  className="font-mono-tag uppercase text-white text-[11px] md:text-[14px] mb-3 md:mb-4"
                  style={textStyle(isShown)}
                >
                  SMALL-BATCH PINTS, NO SHORTCUTS
                </div>
                <h2
                  className="font-editorial text-white text-[52px] md:[font-size:clamp(56px,min(6.4vw,11.5vh),96px)] leading-[0.92] tracking-[-0.035em] max-w-[16ch] md:max-w-[15ch] lg:max-w-none"
                  style={textStyle(isShown, 60)}
                >
                  {f.headlineSerif}
                </h2>
                <div style={textStyle(isShown, 120)} className="mt-5 md:mt-8">
                  <button
                    tabIndex={isShown ? 0 : -1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onShop(f);
                    }}
                    className="btn-solid px-8 h-[52px] md:h-[60px] font-mono-tag text-[13px] uppercase"
                  >
                    <ScrambleText text="SHOP" />
                  </button>
                </div>
              </div>

              {/* ---- Active panel: lower-right glass info card (lg and up; on tablets it would collide with the headline) ---- */}
              <div
                className="hidden lg:flex absolute right-[22px] bottom-[22px] w-[280px] glass-card rounded-[44px] flex-col items-center text-center px-6 pt-6 pb-7"
                style={{ ...textStyle(isShown, 160), pointerEvents: 'none' }}
              >
                {f.canThumbnailUrl && (
                  <img src={f.canThumbnailUrl} alt={`${f.name} pint`} draggable={false} className="h-[150px] w-auto drop-shadow-[0_18px_24px_rgba(0,0,0,0.3)]" />
                )}
                <h3 className="font-display font-semibold uppercase text-white text-[26px] leading-[0.95] tracking-[-0.04em] mt-4">
                  {f.name}
                </h3>
                <p className="font-editorial text-white text-[22px] leading-none mt-2">{f.tastingNotesShort}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ onSelectFlavorForShop, onNavigateToShop }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useReveal();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const goShop = (flavor: FlavorItem) => {
    onSelectFlavorForShop(flavor);
    onNavigateToShop();
  };

  return (
    <div className="relative w-full overflow-x-clip text-white">
      <FlavorHero onShop={goShop} />

      <BrandReveal onReadMore={() => setIsStoryOpen(true)} />

      {/* ---------------- Products ---------------- */}
      <section className="relative z-10 w-full px-2 sm:px-3 pt-10 pb-24">
        <div className="max-w-[1900px] mx-auto">
          <div className="reveal text-center mb-10 sm:mb-14">
            <span className="font-mono-tag text-[13px] uppercase text-white/85">OUR PRODUCTS</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
            {FLAVORS.map((f) => (
              <ProductCard
                key={f.id}
                flavor={f}
                active={activeId === f.id}
                onActivate={() => setActiveId(f.id)}
                onDeactivate={() => setActiveId((cur) => (cur === f.id ? null : cur))}
                onShop={() => goShop(f)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Newsletter ---------------- */}
      <section className="relative z-10 w-full px-2 sm:px-3 pb-24">
        <div className="reveal max-w-[1900px] mx-auto relative rounded-[52px] overflow-hidden min-h-[620px] flex items-center justify-center p-6 sm:p-12">
          <img
            src="/images/bar-friends-1.jpg"
            alt="Three friends laughing at a bar with Frostbite pints"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-[#0b0d14]/35" />
          <div className="glass-card relative z-10 w-full max-w-xl rounded-[48px] p-8 sm:p-12 text-center space-y-6 bg-black/25">
            <span className="font-mono-tag text-[12px] uppercase text-white/70 block">NEWSLETTER</span>
            <h3 className="font-editorial text-[36px] sm:text-[46px] leading-[1.02] text-white">
              Join the crew.
              <br />
              Get 10% off your first pint.
            </h3>
            {submitted ? (
              <div className="glass rounded-[100px] p-4 font-mono-tag text-[12px] uppercase text-white">
                ✓ YOU&apos;RE IN. USE CODE FROSTY10 FOR 10% OFF.
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSubmitted(true); }}
                className="relative max-w-md mx-auto"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="YOUR EMAIL"
                  className="w-full rounded-[100px] bg-white/[0.1] border border-white/30 pl-6 pr-16 py-4 font-mono-tag text-[13px] uppercase text-white placeholder:text-white/55 focus:outline-none focus:border-white transition-colors"
                />
                <button
                  type="submit"
                  aria-label="Submit email"
                  className="btn-solid absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center font-mono-tag text-[16px]"
                >
                  &gt;
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <EditorialFooter />

      <StoryModal isOpen={isStoryOpen} onClose={() => setIsStoryOpen(false)} onNavigateToShop={onNavigateToShop} />
    </div>
  );
};
