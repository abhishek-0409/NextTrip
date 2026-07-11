

// ── Formatters (created once, reused across calls) ────────────────────────────


const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});


const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  notation: 'compact',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

// ── Public API ────────────────────────────────────────────────────────────────


export function formatINR(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  return inrFormatter.format(Math.round(amount));
}


export function formatINRCompact(amount: number): string {
  if (!Number.isFinite(amount)) return '₹0';
  return inrCompactFormatter.format(Math.round(amount));
}


export function formatINRPlain(amount: number): string {
  if (!Number.isFinite(amount)) return '0';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}


export function discountPercent(
  basePrice: number,
  discountedPrice: number
): number {
  if (basePrice <= 0 || discountedPrice >= basePrice) return 0;
  return Math.round(((basePrice - discountedPrice) / basePrice) * 100);
}
