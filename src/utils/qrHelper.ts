import { QuotationData } from '../types/quote';

/**
 * Returns the target verification URL encoded into the quotation QR code.
 * If user configured a custom URL, that is used; otherwise an official digital
 * verification link containing the quote number and client reference is generated.
 */
export function getVerificationUrl(data: QuotationData): string {
  if (data.qrCode?.linkUrl && data.qrCode.linkUrl.trim()) {
    return data.qrCode.linkUrl.trim();
  }

  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const quoteNum = (data.details?.quoteNumber || '1001').replace(/^#/, '');
    const clientName = encodeURIComponent(data.client?.name || 'Client');
    return `${origin}${pathname}?verify=true&quote=${encodeURIComponent(quoteNum)}&client=${clientName}`;
  }

  return `https://onestep.co.ke/verify?quote=${encodeURIComponent(data.details?.quoteNumber || '1001')}`;
}
