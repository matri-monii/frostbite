import React from 'react';
import { PageRoute } from '../types/index.ts';
import { EditorialFooter } from '../components/EditorialFooter.tsx';
import { ScrambleText } from '../components/ScrambleText.tsx';
import { useReveal } from '../hooks/useReveal.ts';

interface AboutPageProps {
  onNavigate: (route: PageRoute) => void;
}

// 90s film-style photos, shown in a right-to-left strip.
const STRIP: { src: string; alt: string }[] = [
  { src: '/images/about-portrait.jpg', alt: 'Woman leaning on a wall holding a Frostbite pint' },
  { src: '/images/about-bar.jpg', alt: 'Two friends behind a bar, each holding a Frostbite pint' },
  { src: '/images/about-eating.jpg', alt: 'Man eating Frostbite ice cream with a spoon' },
  { src: '/images/bar-friends-1.jpg', alt: 'Three friends laughing with Frostbite pints' },
  { src: '/images/tennis.jpg', alt: 'Frostbite pint held on a tennis court' },
  { src: '/images/bar-friends-2.jpg', alt: 'Friends sharing ice cream at a bar' },
];

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  useReveal();

  const renderStrip = (suffix: string) =>
    STRIP.map((img) => (
      <img
        key={`${img.src}-${suffix}`}
        src={img.src}
        alt={suffix === 'a' ? img.alt : ''}
        aria-hidden={suffix === 'b'}
        draggable={false}
        className="h-[300px] sm:h-[460px] lg:h-[560px] w-auto rounded-[36px] sm:rounded-[48px] object-cover shrink-0"
        loading="lazy"
      />
    ));

  return (
    <div className="relative w-full text-white">
      {/* Headline */}
      <section className="relative z-10 pt-[170px] sm:pt-[210px] pb-16 sm:pb-24 px-4 text-center">
        <h1 className="reveal font-editorial text-[44px] sm:text-[72px] md:text-[88px] leading-[0.98] tracking-[-0.035em] max-w-[1000px] mx-auto">
          Ice cream that rises to any occasion.
        </h1>
      </section>

      {/* Photo strip: moves right to left */}
      <section className="strip-wrap relative z-10 w-full overflow-hidden">
        <div className="strip-track flex w-max gap-2 sm:gap-3 pr-2 sm:pr-3">
          {renderStrip('a')}
          {renderStrip('b')}
        </div>
      </section>

      {/* Story */}
      <section className="relative z-10 px-4 py-28 sm:py-44">
        <p className="reveal font-editorial text-[30px] sm:text-[46px] md:text-[56px] leading-[1.0] tracking-[-0.03em] text-center max-w-[900px] mx-auto">
          Frostbite is for the moments you want to eat in. For late nights, for lazy afternoons, for celebrating the small wins and the big ones.
          For savoring the cold, but never rushing it. Distinctive flavors and real ingredients, churned slowly and served hard.
          <br />
          Every spoonful is made to savor.
          <br />
          Stay cool, wherever you are.
        </p>
      </section>

      {/* Two cards */}
      <section className="relative z-10 px-2 sm:px-3 pb-28">
        <div className="max-w-[1900px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          {[
            { img: '/images/bar-friends-2.jpg', alt: 'Friends at a bar with Frostbite pints', eyebrow: 'STOCK UP', title: 'Find Frostbite near you', cta: 'FIND US', action: () => onNavigate('find-us'), pos: '50% 40%' },
            { img: '/images/tennis.jpg', alt: 'Frostbite pint on a tennis court', eyebrow: 'WHOLESALE', title: 'Offer a refreshing alternative', cta: 'GET IN TOUCH', action: () => { window.location.href = 'mailto:talk@frostbite.bev?subject=Wholesale'; }, pos: '50% 35%' },
          ].map((c) => (
            <div key={c.eyebrow} className="reveal">
              <div className="glass-card rounded-[44px] sm:rounded-[56px] overflow-hidden flex flex-col h-full">
                <img src={c.img} alt={c.alt} className="w-full h-[56svh] md:h-[68svh] object-cover" style={{ objectPosition: c.pos }} loading="lazy" draggable={false} />
                <div className="flex-1 px-6 py-14 sm:py-20 text-center flex flex-col items-center gap-8">
                  <span className="font-mono-tag text-[13px] uppercase text-white/85">{c.eyebrow}</span>
                  <h3 className="font-editorial text-[38px] sm:text-[52px] leading-[0.98] tracking-[-0.03em] max-w-[520px]">{c.title}</h3>
                  <button onClick={c.action} className="btn-solid px-8 py-4 font-mono-tag text-[13px] uppercase">
                    <ScrambleText text={c.cta} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <EditorialFooter />
    </div>
  );
};
