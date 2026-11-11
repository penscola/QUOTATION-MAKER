export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface QuotationPricing {
  currencySymbol: string;
  taxRatePercent: number; // e.g. 16 for standard 16% VAT
  taxAmount: number;
  taxEnabled?: boolean; // VAT toggle (defaults to true for 16% VAT)
  discountType?: 'percentage' | 'fixed'; // '%' or fixed amount
  discountValue?: number; // e.g. 10 for 10% or 5000 for KSh 5,000
  othersFee: number;
  othersEnabled?: boolean; // Toggle to include or remove "Others" fee
  othersLabel?: string; // Optional label e.g. "Others", "Shipping & Handling"
}

export interface QuotationQRCode {
  enabled: boolean;
  linkUrl?: string; // Custom link URL; defaults to canonical verification URL
  label?: string; // e.g. "Scan to Verify Quote"
  caption?: string; // e.g. "Official digital document & online view"
}

export interface QuotationData {
  company: {
    name: string;
    tagline?: string;
    address: string;
    phone: string;
    website: string;
    logoUrl?: string;
  };
  client: {
    name: string;
    company: string;
    address: string;
    phone: string;
    customerId?: string;
  };
  details: {
    quoteNumber: string;
    date: string;
    validUntil: string;
    projectDescription: string;
  };
  items: QuoteItem[];
  pricing: QuotationPricing;
  terms: string;
  signature: {
    printedName: string;
    dateSigned: string;
    signatureDataUrl?: string;
  };
  qrCode?: QuotationQRCode;
  themeColor: string; // e.g. '#2e7d32' (Forest Green) or '#0284c7' (One Step Blue)
}

export const DEFAULT_QUOTATION: QuotationData = {
  company: {
    name: 'ONE STEP SOLUTION LTD',
    tagline: 'ONE STEP. ENDLESS SOLUTIONS.',
    address: 'THE WESTCOM POINT, MAHIGA MAIRU AVE, WESTLANDS, NAIROBI',
    phone: '+254 111 537 414',
    website: 'onestependlesssolutions@gmail.com',
    logoUrl: '/assets/aistudio/image_6276447f.png',
  },
  client: {
    name: 'Mary Anne Wanjiku',
    company: 'AOTA ENTERPRISES LTD',
    address: 'Argwings Kodhek Rd, Kilimani, Nairobi 00100',
    phone: '+254 722 456 789',
    customerId: 'OSS-KE-12345',
  },
  details: {
    quoteNumber: '#OSS-1234',
    date: '2026-10-26',
    validUntil: '2026-11-26',
    projectDescription: 'Turnkey enterprise IT infrastructure, high-speed fiber routing, and secure cloud networking deployment.',
  },
  items: [
    {
      id: 'item-1',
      description: 'Gigabit Managed PoE+ Switch 24-Port with SFP Uplinks',
      quantity: 2,
      price: 48500,
    },
    {
      id: 'item-2',
      description: 'Enterprise Dual-Band WiFi 6 Access Points (Indoor/Outdoor)',
      quantity: 6,
      price: 18500,
    },
    {
      id: 'item-3',
      description: 'Cat6 Pure Copper Structured Cabling & Patch Panel Rigging',
      quantity: 1,
      price: 35000,
    },
    {
      id: 'item-4',
      description: 'Professional Systems Engineering, Configuration & SLA Commissioning',
      quantity: 1,
      price: 25000,
    },
  ],
  pricing: {
    currencySymbol: 'KSh',
    taxRatePercent: 16,
    taxAmount: 42880,
    taxEnabled: true,
    discountType: 'percentage',
    discountValue: 0,
    othersFee: 0,
    othersEnabled: false,
    othersLabel: 'Others',
  },
  terms: 'Above quotation is an estimate of goods and services valid for 30 days. 16% Value-Added Tax (VAT) applies per KRA regulations. 50% deposit required upon confirmation.',
  signature: {
    printedName: 'Mary Anne Wanjiku',
    dateSigned: '2026-10-26',
  },
  qrCode: {
    enabled: true,
    linkUrl: '',
    label: 'Scan to Verify Quote',
    caption: 'Official digital document & online view',
  },
  themeColor: '#0284c7', // Matching One Step Solution brand blue
};

export function sanitizeQuotation(raw: any): QuotationData {
  if (!raw || typeof raw !== 'object') {
    return JSON.parse(JSON.stringify(DEFAULT_QUOTATION));
  }

  const base: QuotationData = JSON.parse(JSON.stringify(DEFAULT_QUOTATION));

  const company = {
    name: typeof raw.company?.name === 'string' && raw.company.name.trim() ? raw.company.name : base.company.name,
    tagline: typeof raw.company?.tagline === 'string' ? raw.company.tagline : base.company.tagline,
    address: typeof raw.company?.address === 'string' ? raw.company.address : base.company.address,
    phone: typeof raw.company?.phone === 'string' ? raw.company.phone : base.company.phone,
    website: typeof raw.company?.website === 'string' ? raw.company.website : base.company.website,
    logoUrl: typeof raw.company?.logoUrl === 'string' ? raw.company.logoUrl : base.company.logoUrl,
  };

  if (
    !company.logoUrl ||
    company.name?.includes('BUHAY') ||
    company.phone?.includes('700 123 456') ||
    company.phone?.includes('0123 456')
  ) {
    company.name = base.company.name;
    company.tagline = base.company.tagline;
    company.address = base.company.address;
    company.phone = base.company.phone;
    company.website = base.company.website;
    company.logoUrl = base.company.logoUrl;
  }

  const client = {
    name: typeof raw.client?.name === 'string' ? raw.client.name : base.client.name,
    company: typeof raw.client?.company === 'string' ? raw.client.company : base.client.company,
    address: typeof raw.client?.address === 'string' ? raw.client.address : base.client.address,
    phone: typeof raw.client?.phone === 'string' ? raw.client.phone : base.client.phone,
    customerId: typeof raw.client?.customerId === 'string' ? raw.client.customerId : base.client.customerId,
  };

  const details = {
    quoteNumber: typeof raw.details?.quoteNumber === 'string' ? raw.details.quoteNumber : base.details.quoteNumber,
    date: typeof raw.details?.date === 'string' ? raw.details.date : base.details.date,
    validUntil: typeof raw.details?.validUntil === 'string' ? raw.details.validUntil : base.details.validUntil,
    projectDescription: typeof raw.details?.projectDescription === 'string' ? raw.details.projectDescription : base.details.projectDescription,
  };

  let items: QuoteItem[] = [];
  if (Array.isArray(raw.items) && raw.items.length > 0) {
    items = raw.items.map((it: any, idx: number) => ({
      id: typeof it?.id === 'string' && it.id.trim() ? it.id : `item-${idx}-${Date.now()}`,
      description: typeof it?.description === 'string' ? it.description : 'Item or service description',
      quantity: Number(it?.quantity) > 0 ? Number(it.quantity) : 1,
      price: Number(it?.price) >= 0 ? Number(it.price) : 0,
    }));
  } else {
    items = base.items;
  }

  const rawPricing = raw.pricing || {};
  let currencySymbol = rawPricing.currencySymbol || 'KSh';
  if (currencySymbol === '₱') {
    currencySymbol = 'KSh';
  }

  const pricing: QuotationPricing = {
    currencySymbol,
    taxRatePercent: typeof rawPricing.taxRatePercent === 'number' ? rawPricing.taxRatePercent : 16,
    taxAmount: Number(rawPricing.taxAmount) || 0,
    taxEnabled: rawPricing.taxEnabled !== false,
    discountType: rawPricing.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValue: Math.max(0, Number(rawPricing.discountValue) || 0),
    othersFee: Math.max(0, Number(rawPricing.othersFee) || 0),
    othersEnabled: rawPricing.othersEnabled !== undefined ? Boolean(rawPricing.othersEnabled) : (Number(rawPricing.othersFee) || 0) > 0,
    othersLabel: typeof rawPricing.othersLabel === 'string' && rawPricing.othersLabel.trim() ? rawPricing.othersLabel : 'Others',
  };

  const signature = {
    printedName: typeof raw.signature?.printedName === 'string' ? raw.signature.printedName : (client.name || base.signature.printedName),
    dateSigned: typeof raw.signature?.dateSigned === 'string' ? raw.signature.dateSigned : details.date,
    signatureDataUrl: typeof raw.signature?.signatureDataUrl === 'string' ? raw.signature.signatureDataUrl : undefined,
  };

  const qrCode: QuotationQRCode = {
    enabled: raw.qrCode?.enabled !== false,
    linkUrl: typeof raw.qrCode?.linkUrl === 'string' ? raw.qrCode.linkUrl : '',
    label: typeof raw.qrCode?.label === 'string' && raw.qrCode.label.trim() ? raw.qrCode.label : 'Scan to Verify Quote',
    caption: typeof raw.qrCode?.caption === 'string' && raw.qrCode.caption.trim() ? raw.qrCode.caption : 'Official digital document & online view',
  };

  const terms = typeof raw.terms === 'string' && raw.terms.trim() ? raw.terms : base.terms;
  const themeColor = typeof raw.themeColor === 'string' && raw.themeColor.startsWith('#') ? raw.themeColor : base.themeColor;

  return {
    company,
    client,
    details,
    items,
    pricing,
    terms,
    signature,
    qrCode,
    themeColor,
  };
}
