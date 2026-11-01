import { QuotationPricing, QuoteItem } from '../types/quote';

export interface PricingBreakdown {
  subtotal: number;
  discountAmount: number;
  discountLabel: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  taxableSubtotal: number;
  isTaxEnabled: boolean;
  taxRatePercent: number;
  taxAmount: number;
  taxLabel: string;
  isOthersEnabled: boolean;
  othersFee: number;
  othersLabel: string;
  grandTotal: number;
}

/**
 * Calculates complete, synchronized pricing totals including discount (percentage or fixed),
 * automatic Kenyan 16% VAT toggle calculations, and optional Other/incidental charges.
 */
export function calculateQuotationTotals(
  items: QuoteItem[],
  pricing: QuotationPricing
): PricingBreakdown {
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.price) || 0),
    0
  );

  const discountType = pricing.discountType || 'percentage';
  const discountValue = Math.max(0, Number(pricing.discountValue) || 0);

  let discountAmount = 0;
  if (discountValue > 0) {
    if (discountType === 'percentage') {
      discountAmount = Math.round(subtotal * (discountValue / 100) * 100) / 100;
    } else {
      discountAmount = Math.min(subtotal, discountValue);
    }
  }

  const taxableSubtotal = Math.max(0, subtotal - discountAmount);

  // 1. VAT / Tax Removal or Toggle
  const isTaxEnabled = pricing.taxEnabled !== false;
  const taxRatePercent = pricing.taxRatePercent !== undefined ? pricing.taxRatePercent : 16;

  let taxAmount = 0;
  if (isTaxEnabled) {
    taxAmount = Math.round(taxableSubtotal * (taxRatePercent / 100) * 100) / 100;
  } else {
    taxAmount = 0;
  }

  // 2. Others Fee Removal or Toggle
  const rawOthersFee = Math.max(0, Number(pricing.othersFee) || 0);
  const isOthersEnabled = pricing.othersEnabled !== false && (rawOthersFee > 0 || pricing.othersEnabled === true);
  const othersFee = isOthersEnabled ? rawOthersFee : 0;
  const othersLabel = pricing.othersLabel || 'Others';

  const grandTotal = Math.round((taxableSubtotal + taxAmount + othersFee) * 100) / 100;

  return {
    subtotal,
    discountAmount,
    discountLabel: discountType === 'percentage' ? `${discountValue}%` : `Fixed`,
    discountType,
    discountValue,
    taxableSubtotal,
    isTaxEnabled,
    taxRatePercent,
    taxAmount,
    taxLabel: isTaxEnabled ? `${taxRatePercent}% VAT` : '0% (Exempt)',
    isOthersEnabled,
    othersFee,
    othersLabel,
    grandTotal,
  };
}
