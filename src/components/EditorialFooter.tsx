import React, { useState } from 'react';
import { PoliciesModal } from './PoliciesModal.tsx';
import { AccountModal } from './AccountModal.tsx';
import { ScrambleText } from './ScrambleText.tsx';

export const EditorialFooter: React.FC = () => {
  const [isPoliciesOpen, setIsPoliciesOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  return (
    <>
      <footer className="relative z-10 w-full bg-transparent text-[#07060b] pt-20 pb-12 px-4 sm:px-8 border-t border-[#d8e0e6]/70 select-none">
        <div className="max-w-[1520px] mx-auto space-y-16">
          {/* Top Pill Buttons Navigation Bar (Translucent) */}
          <div className="flex flex-wrap items-center justify-between gap-4 font-mono-tag text-[11px] sm:text-[12px] uppercase tracking-[-0.071em]">
            {/* Left Pill Links (Translucent) */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <a
                href="mailto:talk@frostbite.bev"
                className="rounded-[100px] bg-black/[0.08] hover:bg-black/[0.14] backdrop-blur-md border border-black/10 px-5 sm:px-6 py-2.5 sm:py-3 text-[#07060b] transition-colors duration-500"
              >
                <ScrambleText text="TALK(AT)FROSTBITE.BEV" />
              </a>
              <a
                href="#instagram"
                onClick={(e) => {
                  e.preventDefault();
                  alert('@frostbite.cream on Instagram — Daily micro-batch vat stories.');
                }}
                className="rounded-[100px] bg-black/[0.08] hover:bg-black/[0.14] backdrop-blur-md border border-black/10 px-5 sm:px-6 py-2.5 sm:py-3 text-[#07060b] transition-colors duration-500"
              >
                <ScrambleText text="INSTAGRAM" />
              </a>
              <a
                href="#tiktok"
                onClick={(e) => {
                  e.preventDefault();
                  alert('@frostbite.cream on TikTok — Behind the -18°C churn.');
                }}
                className="rounded-[100px] bg-black/[0.08] hover:bg-black/[0.14] backdrop-blur-md border border-black/10 px-5 sm:px-6 py-2.5 sm:py-3 text-[#07060b] transition-colors duration-500"
              >
                <ScrambleText text="TIKTOK" />
              </a>
            </div>

            {/* Right Pill Links (Translucent) */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => setIsPoliciesOpen(true)}
                className="rounded-[100px] bg-black/[0.08] hover:bg-black/[0.14] backdrop-blur-md border border-black/10 px-5 sm:px-6 py-2.5 sm:py-3 text-[#07060b] transition-colors duration-500"
              >
                <ScrambleText text="POLICIES" />
              </button>
              <button
                onClick={() => setIsAccountOpen(true)}
                className="rounded-[100px] bg-black/[0.08] hover:bg-black/[0.14] backdrop-blur-md border border-black/10 px-5 sm:px-6 py-2.5 sm:py-3 text-[#07060b] transition-colors duration-500"
              >
                <ScrambleText text="ACCOUNT" />
              </button>
            </div>
          </div>

          {/* Massive Display Watermark across Full Width */}
          <div className="overflow-hidden py-4 select-none">
            <h1 className="wordmark !tracking-[-0.015em] block w-full text-[#cdd7dc] text-center whitespace-nowrap select-none text-[clamp(48px,12.6vw,270px)] leading-[0.95] pb-[0.08em]">
              you’ve arrived.
            </h1>
          </div>

          {/* Bottom Copyright & Credit Strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#d8e0e6]/70 font-mono-tag text-[10px] sm:text-[11px] uppercase tracking-[-0.071em] text-[#07060b]/60">
            <span>© 2026 FROSTBITE</span>
            <span>A STANDARD SITE | FROSTBITE 2026</span>
          </div>

          {/* Builder credit */}
          <p className="text-center font-mono-tag text-[10px] sm:text-[11px] uppercase tracking-[-0.071em] text-[#07060b]/60 !mt-6">
            BUILT BY MONISH
          </p>
        </div>
      </footer>

      {/* Interactive Modals */}
      <PoliciesModal isOpen={isPoliciesOpen} onClose={() => setIsPoliciesOpen(false)} />
      <AccountModal isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
    </>
  );
};
