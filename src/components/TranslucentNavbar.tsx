import React from 'react';
import { PageRoute } from '../types/index.ts';
import { ScrambleText } from './ScrambleText.tsx';
import { PerimeterGlow } from './PerimeterGlow.tsx';

interface TranslucentNavbarProps {
  currentRoute: PageRoute;
  cartCount: number;
  onNavigate: (route: PageRoute) => void;
}

const LINKS: { route: PageRoute; label: string }[] = [
  { route: 'shop', label: 'SHOP' },
  { route: 'about', label: 'ABOUT' },
  { route: 'find-us', label: 'FIND US' },
];

export const TranslucentNavbar: React.FC<TranslucentNavbarProps> = ({ currentRoute, cartCount, onNavigate }) => {
  const linkClass = (active: boolean) =>
    `font-mono-tag whitespace-nowrap text-[10px] sm:text-[13px] uppercase tracking-[-0.02em] transition-opacity duration-300 focus-visible:outline-none ${
      active ? 'text-white opacity-100' : 'text-white/85 hover:text-white'
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-5 pt-3 sm:pt-4 pointer-events-none">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand pill */}
        <button
          onClick={() => onNavigate('home')}
          aria-label="Frostbite home"
          className="glass glow-host relative pointer-events-auto rounded-[100px] px-4 sm:px-7 h-[48px] sm:h-[74px] flex items-center shrink-0 focus-visible:outline-none"
        >
          <span className="wordmark text-[21px] sm:text-[34px] text-white">frostbite</span>
          <PerimeterGlow />
        </button>

        {/* Centre navigation pill */}
        <div
          role="navigation"
          aria-label="Main"
          className="glass glow-host relative pointer-events-auto rounded-[100px] h-[48px] sm:h-[74px] px-4 sm:px-14 flex items-center gap-3 sm:gap-10 md:gap-12"
        >
          {LINKS.map((l) => (
            <button key={l.route} onClick={() => onNavigate(l.route)} className={linkClass(currentRoute === l.route)}>
              <ScrambleText text={l.label} />
            </button>
          ))}
          <button onClick={() => onNavigate('cart')} className={`${linkClass(currentRoute === 'cart')} whitespace-nowrap`}>
            <ScrambleText text={`CART (${cartCount})`} />
          </button>
          <PerimeterGlow />
        </div>

        {/* Mark */}
        <button
          onClick={() => onNavigate('home')}
          aria-label="Back to top"
          className="glass glow-host relative pointer-events-auto rounded-full hidden sm:flex w-[52px] h-[52px] sm:w-[74px] sm:h-[74px] items-center justify-center shrink-0 text-white focus-visible:outline-none hover:scale-105"
        >
          <img src="/images/logo.png" alt="" draggable={false} className="w-9 h-9 sm:w-[50px] sm:h-[50px] object-contain select-none" />
          <PerimeterGlow />
        </button>
      </div>
    </nav>
  );
};
