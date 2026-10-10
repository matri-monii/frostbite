import React from 'react';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToShop: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ isOpen, onClose, onNavigateToShop }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#07060b]/75 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#fafafa] text-[#07060b] rounded-[44px] border border-[#cdcdce] p-8 sm:p-12 my-8 shadow-2xl space-y-6"
      >
        <button
          onClick={onClose}
          aria-label="Close story"
          className="absolute top-6 right-6 w-10 h-10 rounded-[100px] bg-[#d9d9d9] hover:bg-[#cdcdce] text-[#07060b] flex items-center justify-center font-mono-tag text-xs transition-colors"
        >
          ✕
        </button>

        <div>
          <span className="font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-[#07060b]/60 block mb-1">
            THE SUB-ZERO DISCIPLINE
          </span>
          <h2 className="font-editorial text-[36px] sm:text-[44px] leading-tight text-[#07060b]">
            The Architecture of Cold
          </h2>
        </div>

        <div className="space-y-4 font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-[#07060b]/80 leading-relaxed max-h-[55vh] overflow-y-auto pr-2">
          <p>
            Most frozen desserts are engineered for shelf stability rather than gastronomy. Commercial manufacturers pump up to 50% ambient air (known as overrun) and blend polysorbates and chemical gums to artificially prevent water separation.
          </p>

          <p>
            Frostbite was conceived as a radical rejection of that industrial baseline. Operating in high-altitude sub-zero chambers, our churn speeds exceed 3,200 RPM at -18.4°C. Under this violent velocity, water molecules freeze into micro-crystals smaller than 12 microns—well beneath the tactile perception of the human tongue.
          </p>

          <div className="p-4 rounded-[24px] bg-[#d9d9d9] border border-[#cdcdce] my-4">
            <span className="font-bold text-[#07060b] block mb-1">THE FLAVOURS</span>
            <p>
              Glacier Mint (real mint, dark chocolate shards), Wild Blueberry (slow-cooked jam swirled through vanilla cream) and Blood Orange Sorbet (dairy free, pressed fruit). Cold, bright and made to savor.
            </p>
          </div>

          <p>
            The resulting mouthfeel is dense, unbroken silk that melts with zero oily film, releasing volatile terpenes and aromatics instantly.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-[100px] bg-[#d9d9d9] text-[#07060b] py-3.5 font-mono-tag text-[11px] uppercase tracking-[-0.071em] hover:bg-[#cdcdce] transition-colors"
          >
            CLOSE
          </button>
          <button
            onClick={() => {
              onClose();
              onNavigateToShop();
            }}
            className="flex-1 rounded-[100px] bg-[#07060b] text-[#fafafa] py-3.5 font-mono-tag text-[11px] uppercase tracking-[-0.071em] hover:opacity-85 transition-opacity"
          >
            EXPLORE FLAVORS
          </button>
        </div>
      </div>
    </div>
  );
};
