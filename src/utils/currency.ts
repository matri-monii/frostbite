/** Format a number as Indian rupees, e.g. 4000 -> ₹4,000 (lakh/crore grouping). */
const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
export const formatINR = (amount: number): string => `₹${inr.format(Math.round(amount))}`;

/** Free-shipping threshold and flat shipping fee, in rupees. */
export const FREE_SHIPPING_THRESHOLD = 5000;
export const SHIPPING_FEE = 1000;
