import React, { useState } from 'react';
import { CartItem } from '../types/index.ts';
import { EditorialFooter } from '../components/EditorialFooter.tsx';
import { formatINR, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from '../utils/currency.ts';

interface CartPageProps {
  cart: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onNavigateToShop: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateToShop,
}) => {
  const [isCheckout, setIsCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [zip, setZip] = useState('');
  const [note, setNote] = useState('Front porch / leave in shade');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const subtotal = cart.reduce((acc, item) => {
    const itemPrice =
      item.purchaseType === 'subscribe'
        ? (item.packSize === '6-pack' ? item.flavor.priceSubscribe : item.flavor.priceSubscribe * 1.85)
        : (item.packSize === '6-pack' ? item.flavor.priceOneTime : item.flavor.priceOneTime * 1.85);
    return acc + itemPrice * item.quantity;
  }, 0);

  const discountAmount = subtotal * appliedDiscount;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const total = discountedSubtotal + shipping;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'GET10' || couponCode.trim().toUpperCase() === 'PRIORITY10') {
      setAppliedDiscount(0.10);
      setCouponMessage('✓ 10% NEWSLETTER ALLOCATION CODE APPLIED');
    } else {
      setCouponMessage('INVALID CODE. TRY "GET10"');
    }
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    setOrderPlaced(true);
  };

  return (
    <div className="relative w-full min-h-screen text-white pt-28 pb-20 px-4 sm:px-8 selection:bg-white selection:text-black">
      <div className="relative max-w-[1200px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/15 mb-10">
          <div>
            <span className="font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-white/60 block mb-2">
              YOUR ORDER
            </span>
            <h1 className="font-editorial text-[52px] sm:text-[72px] leading-[0.95] tracking-[-0.03em] text-white">
              Your cart.
            </h1>
          </div>

          {cart.length > 0 && !orderPlaced && (
            <button
              onClick={onClearCart}
              className="rounded-[100px] bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 px-5 py-2 font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-white transition-colors self-start sm:self-auto backdrop-blur-xl"
            >
              EMPTY CART
            </button>
          )}
        </div>

        {/* Order Confirmed View (Translucent) */}
        {orderPlaced ? (
          <div className="rounded-[44px] bg-white/[0.08] backdrop-blur-2xl border border-white/20 p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center font-display font-black text-2xl mx-auto">
              ✓
            </div>
            <span className="font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-white/60 block">
              ORDER CONFIRMED
            </span>
            <h2 className="font-editorial text-[38px] sm:text-[46px] leading-tight text-white">
              Manifest #{Math.floor(100000 + Math.random() * 900000)}
            </h2>
            <p className="font-mono-tag text-[12px] uppercase tracking-[-0.071em] text-white/80 leading-relaxed">
              Thanks, {name}. Your pints are on the way, packed in dry ice and shipping to {address}.
            </p>
            <div className="pt-4 border-t border-white/15 text-left font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-white/70 space-y-1.5">
              <div>DISPATCH: FROSTBITE COLD STORE 04</div>
              <div>COLD CHAIN: STAYS FROZEN FOR 48 HOURS</div>
              <div>STATUS: PACKING YOUR ORDER</div>
            </div>
            <button
              onClick={() => {
                onClearCart();
                setOrderPlaced(false);
                setIsCheckout(false);
                onNavigateToShop();
              }}
              className="rounded-[100px] bg-white hover:bg-[#e0e0e0] text-black px-8 py-3.5 font-mono-tag text-[12px] uppercase tracking-[-0.071em] font-bold"
            >
              EXPLORE MORE FLAVORS
            </button>
          </div>
        ) : cart.length === 0 ? (
          /* Empty Cart (Translucent) */
          <div className="rounded-[44px] bg-white/[0.08] backdrop-blur-2xl border border-white/20 p-12 sm:p-16 text-center max-w-xl mx-auto space-y-5 shadow-2xl">
            <span className="font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-white/60 block">
              CART EMPTY
            </span>
            <p className="font-editorial text-[32px] text-white">
              Nothing in your cart yet.
            </p>
            <p className="font-mono-tag text-[12px] uppercase tracking-[-0.071em] text-white/70">
              Pick a flavor and build your pack.
            </p>
            <button
              onClick={onNavigateToShop}
              className="rounded-[100px] bg-white hover:bg-[#e0e0e0] text-black px-8 py-3.5 font-mono-tag text-[12px] uppercase tracking-[-0.071em] font-bold"
            >
              SHOP FLAVORS
            </button>
          </div>
        ) : (
          /* Active Cart List & Summary Grid (Translucent frosted glass) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Items Column */}
            <div className="lg:col-span-7 space-y-4">
              {cart.map((item, idx) => {
                const itemPrice =
                  item.purchaseType === 'subscribe'
                    ? (item.packSize === '6-pack' ? item.flavor.priceSubscribe : item.flavor.priceSubscribe * 1.85)
                    : (item.packSize === '6-pack' ? item.flavor.priceOneTime : item.flavor.priceOneTime * 1.85);

                return (
                  <div
                    key={`${item.flavor.id}-${item.packSize}-${idx}`}
                    className="rounded-[36px] bg-white/[0.08] backdrop-blur-2xl border border-white/20 p-5 sm:p-6 flex items-center gap-4 sm:gap-6 shadow-xl"
                  >
                    <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-[20px] overflow-hidden bg-black/30 shrink-0">
                      <img
                        src={item.flavor.canThumbnailUrl}
                        alt={item.flavor.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-1"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-white/60 mb-1">
                        <span>{item.packSize}</span>
                        <span>·</span>
                        <span>{item.purchaseType === 'subscribe' ? 'MONTHLY SUB (10% OFF)' : 'ONE-TIME'}</span>
                      </div>

                      <h3 className="font-editorial text-[22px] sm:text-[26px] leading-tight text-white truncate mb-2">
                        {item.flavor.headlineSerif}
                      </h3>

                      <div className="flex items-center justify-between">
                        <span className="font-mono-tag text-[14px] sm:text-[16px] font-bold text-white tabular-nums">
                          {formatINR(itemPrice * item.quantity)}
                        </span>

                        <div className="flex items-center gap-3">
                          {/* Quantity Stepper (Translucent) */}
                          <div className="flex items-center rounded-[100px] bg-white/[0.08] border border-white/25 px-2.5 py-1">
                            <button
                              onClick={() => onUpdateQuantity(idx, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center font-mono-tag text-xs text-white hover:opacity-60"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-mono-tag text-xs font-bold text-white tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(idx, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center font-mono-tag text-xs text-white hover:opacity-60"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => onRemoveItem(idx)}
                            aria-label="Remove item"
                            className="font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-white/50 hover:text-white"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary & Checkout Column */}
            <div className="lg:col-span-5">
              <div className="rounded-[44px] bg-white/[0.08] backdrop-blur-2xl border border-white/20 p-7 sm:p-9 space-y-6 shadow-2xl">
                <span className="font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-white/60 block">
                  ORDER TOTALS
                </span>

                {/* Free Shipping Progress Meter */}
                <div className="rounded-[24px] bg-white/[0.06] border border-white/15 p-3.5 space-y-2">
                  <div className="flex justify-between font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-white/70">
                    <span>SHIPPING:</span>
                    <span className="font-bold text-white">
                      {shipping === 0 ? `FREE (${formatINR(0)})` : `${formatINR(FREE_SHIPPING_THRESHOLD - discountedSubtotal)} AWAY FROM FREE`}
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-300"
                      style={{ width: `${Math.min(100, (discountedSubtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Promo Code Input (Translucent) */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="PROMO CODE (e.g. GET10)"
                    className="flex-1 rounded-[100px] bg-white/[0.08] border border-white/25 px-4 py-2 font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-white placeholder:text-white/40 focus:outline-none focus:border-white"
                  />
                  <button
                    type="submit"
                    className="rounded-[100px] bg-white/[0.15] hover:bg-white/[0.25] px-4 py-2 font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-white border border-white/25 transition-colors"
                  >
                    APPLY
                  </button>
                </form>
                {couponMessage && (
                  <p className="font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-[#2dd4bf]">
                    {couponMessage}
                  </p>
                )}

                <div className="space-y-3 font-mono-tag text-[12px] uppercase tracking-[-0.071em] text-white/80">
                  <div className="flex justify-between">
                    <span>SUBTOTAL</span>
                    <span className="text-white font-bold tabular-nums">{formatINR(subtotal)}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-[#2dd4bf]">
                      <span>10% DISCOUNT</span>
                      <span className="tabular-nums">-{formatINR(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>DRY ICE SHIPPING</span>
                    <span>COMPLIMENTARY</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SHIPPING</span>
                    <span className="tabular-nums font-bold text-white">
                      {shipping === 0 ? 'FREE' : formatINR(shipping)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-white/15 flex justify-between text-[16px] font-bold text-white">
                    <span>TOTAL</span>
                    <span className="tabular-nums">{formatINR(total)}</span>
                  </div>
                </div>

                {isCheckout ? (
                  <form onSubmit={handleConfirmOrder} className="space-y-4 pt-4 border-t border-white/15">
                    <div>
                      <label className="font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-white/70 block mb-1">
                        RECIPIENT NAME
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Julian Vance"
                        className="w-full rounded-[100px] bg-white/[0.08] border border-white/25 px-4 py-2.5 font-mono-tag text-[11px] text-white focus:outline-none focus:border-white"
                      />
                    </div>

                    <div>
                      <label className="font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-white/70 block mb-1">
                        SHIPPING ADDRESS
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="742 Evergreen Terrace, Suite 4"
                        className="w-full rounded-[100px] bg-white/[0.08] border border-white/25 px-4 py-2.5 font-mono-tag text-[11px] text-white focus:outline-none focus:border-white"
                      />
                    </div>

                    <div>
                      <label className="font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-white/70 block mb-1">
                        ZIP / POSTAL CODE
                      </label>
                      <input
                        type="text"
                        required
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="94103"
                        className="w-full rounded-[100px] bg-white/[0.08] border border-white/25 px-4 py-2.5 font-mono-tag text-[11px] text-white focus:outline-none focus:border-white"
                      />
                    </div>

                    <div>
                      <label className="font-mono-tag text-[10px] uppercase tracking-[-0.071em] text-white/70 block mb-1">
                        DROP-OFF INSTRUCTIONS
                      </label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full rounded-[100px] bg-white/[0.08] border border-white/25 px-4 py-2.5 font-mono-tag text-[11px] text-white focus:outline-none focus:border-white"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCheckout(false)}
                        className="rounded-[100px] bg-white/[0.1] hover:bg-white/[0.2] border border-white/20 px-5 py-3 font-mono-tag text-[11px] uppercase tracking-[-0.071em] text-white"
                      >
                        BACK
                      </button>
                      <button
                        type="submit"
                        className="flex-1 rounded-[100px] bg-white hover:bg-[#e0e0e0] text-black py-3 font-mono-tag text-[11px] uppercase tracking-[-0.071em] font-bold"
                      >
                        SUBMIT DISPATCH — {formatINR(total)}
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsCheckout(true)}
                    className="w-full rounded-[100px] bg-white hover:bg-[#e0e0e0] text-black py-4 font-mono-tag text-[12px] font-bold uppercase tracking-[-0.071em] transition-colors"
                  >
                    PROCEED TO DISPATCH
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editorial Footer for consistent white bottom */}
      <div className="mt-24">
        <EditorialFooter />
      </div>
    </div>
  );
};
