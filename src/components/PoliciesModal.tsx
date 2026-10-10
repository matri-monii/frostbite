import React from 'react';

interface PoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PoliciesModal: React.FC<PoliciesModalProps> = ({ isOpen, onClose }) => {
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
          aria-label="Close policies"
          className="absolute top-6 right-6 w-10 h-10 rounded-[100px] bg-[#d9d9d9] hover:bg-[#cdcdce] text-[#07060b] flex items-center justify-center font-mono-tag text-xs transition-colors"
        >
          ✕
        </button>

        <div>
          <span className="font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-[#07060b]/60 block mb-1">
            DISPATCH POLICIES & STANDARDS
          </span>
          <h2 className="font-editorial text-[36px] sm:text-[42px] leading-tight text-[#07060b]">
            Cold-Chain Governance
          </h2>
        </div>

        <div className="space-y-5 font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-[#07060b]/80 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
          <div className="p-4 rounded-[24px] bg-[#d9d9d9]/60 border border-[#cdcdce]">
            <span className="font-bold text-[#07060b] block mb-1">01. 100% MELT-FREE GUARANTEE</span>
            <p>Every parcel is packed with solid carbon dioxide (-78.5°C) inside insulated recyclable coolers. If your delivery arrives soft or melted, we dispatch a fresh complimentary pack within 24 hours.</p>
          </div>

          <div className="p-4 rounded-[24px] bg-[#d9d9d9]/60 border border-[#cdcdce]">
            <span className="font-bold text-[#07060b] block mb-1">02. DISPATCH & TRANSIT WINDOWS</span>
            <p>We dispatch Monday through Wednesday via express cold transport to ensure parcels do not sit in courier depots over weekends. Tracking codes are transmitted automatically at time of cryogenic sealing.</p>
          </div>

          <div className="p-4 rounded-[24px] bg-[#d9d9d9]/60 border border-[#cdcdce]">
            <span className="font-bold text-[#07060b] block mb-1">03. ALLERGEN TRANSPARENCY</span>
            <p>Manufactured in our dedicated city workshop. Tree nuts, dairy (whole milk) and eggs are processed in segregated air-controlled zones. Full batch lab tests available upon request.</p>
          </div>

          <div className="p-4 rounded-[24px] bg-[#d9d9d9]/60 border border-[#cdcdce]">
            <span className="font-bold text-[#07060b] block mb-1">04. SUBSCRIPTION FLEXIBILITY</span>
            <p>Monthly subscriptions may be skipped, rescheduled, or cancelled at any time with one click in your account portal. No lock-in terms or hidden penalties.</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-[100px] bg-[#07060b] text-[#fafafa] py-3.5 font-mono-tag text-[11px] uppercase tracking-[-0.071em] hover:opacity-85 transition-opacity"
        >
          ACKNOWLEDGE & CLOSE
        </button>
      </div>
    </div>
  );
};
