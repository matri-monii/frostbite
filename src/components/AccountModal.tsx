import React, { useState } from 'react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'portal' | 'tracking'>('portal');
  const [email, setEmail] = useState('');
  const [manifestCode, setManifestCode] = useState('');
  const [trackingResult, setTrackingResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manifestCode.trim()) return;
    setTrackingResult(`Manifest #${manifestCode.toUpperCase()} · In Transit · Sealed with Solid CO₂ · Expected Delivery: Tomorrow before 14:00`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#07060b]/75 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#fafafa] text-[#07060b] rounded-[44px] border border-[#cdcdce] p-8 sm:p-12 my-8 shadow-2xl space-y-6"
      >
        <button
          onClick={onClose}
          aria-label="Close account"
          className="absolute top-6 right-6 w-10 h-10 rounded-[100px] bg-[#d9d9d9] hover:bg-[#cdcdce] text-[#07060b] flex items-center justify-center font-mono-tag text-xs transition-colors"
        >
          ✕
        </button>

        <div>
          <span className="font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-[#07060b]/60 block mb-1">
            CLIENT ATELIER
          </span>
          <h2 className="font-editorial text-[36px] sm:text-[42px] leading-tight text-[#07060b]">
            Member Account
          </h2>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 p-1.5 rounded-[100px] bg-[#d9d9d9] border border-[#cdcdce]">
          <button
            onClick={() => setActiveTab('portal')}
            className={`flex-1 rounded-[100px] py-2 font-mono-tag text-[11px] uppercase tracking-[-0.071em] transition-all ${
              activeTab === 'portal'
                ? 'bg-[#07060b] text-[#fafafa]'
                : 'text-[#07060b]/70 hover:text-[#07060b]'
            }`}
          >
            SUBSCRIPTIONS
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex-1 rounded-[100px] py-2 font-mono-tag text-[11px] uppercase tracking-[-0.071em] transition-all ${
              activeTab === 'tracking'
                ? 'bg-[#07060b] text-[#fafafa]'
                : 'text-[#07060b]/70 hover:text-[#07060b]'
            }`}
          >
            TRACK PARCEL
          </button>
        </div>

        {activeTab === 'portal' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert(`Magic login link transmitted to ${email}`);
            }}
            className="space-y-4"
          >
            <p className="font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-[#07060b]/70">
              Enter your account email to access your active recurring subscriptions, modify flavor selections, or adjust delivery schedules.
            </p>

            <div>
              <label className="font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-[#07060b]/60 block mb-1">
                REGISTERED EMAIL
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="COLLECTOR@DOMAIN.COM"
                className="w-full rounded-[100px] bg-[#d9d9d9] border border-[#cdcdce] px-5 py-3 font-mono-tag text-[11px] text-[#07060b] focus:outline-none focus:border-[#07060b]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-[100px] bg-[#07060b] text-[#fafafa] py-3.5 font-mono-tag text-[11px] uppercase tracking-[-0.071em] hover:opacity-85 transition-opacity"
            >
              TRANSMIT MAGIC SIGN-IN LINK
            </button>
          </form>
        ) : (
          <form onSubmit={handleTrack} className="space-y-4">
            <p className="font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-[#07060b]/70">
              Enter the 6-digit manifest code provided on your parcel confirmation receipt.
            </p>

            <div>
              <label className="font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-[#07060b]/60 block mb-1">
                PARCEL MANIFEST ID
              </label>
              <input
                type="text"
                required
                value={manifestCode}
                onChange={(e) => setManifestCode(e.target.value)}
                placeholder="e.g. 748291"
                className="w-full rounded-[100px] bg-[#d9d9d9] border border-[#cdcdce] px-5 py-3 font-mono-tag text-[11px] text-[#07060b] focus:outline-none focus:border-[#07060b]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-[100px] bg-[#07060b] text-[#fafafa] py-3.5 font-mono-tag text-[11px] uppercase tracking-[-0.071em] hover:opacity-85 transition-opacity"
            >
              QUERY COLD CHAIN STATUS
            </button>

            {trackingResult && (
              <div className="p-4 rounded-[24px] bg-[#ddfcff] border border-[#cdcdce] font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-[#07060b]">
                {trackingResult}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
