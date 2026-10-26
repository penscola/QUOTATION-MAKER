export interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
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
  pricing: {
    currencySymbol: string;
    taxRatePercent: number; // e.g. 6.67% or fixed amount
    taxAmount: number;
    othersFee: number;
  };
  terms: string;
  signature: {
    printedName: string;
    dateSigned: string;
    signatureDataUrl?: string;
  };
  themeColor: string; // e.g. '#2e7d32' (Forest Green from image)
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
    othersFee: 0,
  },
  terms: 'Above quotation is an estimate of goods and services valid for 30 days. 16% Value-Added Tax (VAT) applies per KRA regulations. 50% deposit required upon confirmation.',
  signature: {
    printedName: 'Mary Anne Wanjiku',
    dateSigned: '2026-10-26',
  },
  themeColor: '#0284c7', // Matching One Step Solution brand blue
};
