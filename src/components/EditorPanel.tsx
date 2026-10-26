import React, { useState } from 'react';
import { QuotationData, QuoteItem, DEFAULT_QUOTATION } from '../types/quote';
import { parseQuoteFromNaturalText } from '../utils/geminiParser';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Building2, 
  User, 
  FileText, 
  Palette, 
  DollarSign, 
  RotateCcw, 
  Loader2, 
  CheckCircle2,
  Upload,
  X
} from 'lucide-react';

interface EditorPanelProps {
  data: QuotationData;
  onChange: (updated: QuotationData) => void;
  onResetToSample: () => void;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  data,
  onChange,
  onResetToSample,
}) => {
  const [activeTab, setActiveTab] = useState<'quick-write' | 'items' | 'details' | 'company'>('quick-write');
  const [freeformText, setFreeformText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseSuccessMessage, setParseSuccessMessage] = useState<string | null>(null);

  const themeColors = [
    { label: 'One Step Blue (Brand)', value: '#0284c7' },
    { label: 'Forest Green', value: '#2e7d32' },
    { label: 'Deep Pine', value: '#1b4332' },
    { label: 'Classic Navy', value: '#1e3a8a' },
    { label: 'Slate Charcoal', value: '#334155' },
    { label: 'Burgundy Wine', value: '#831843' },
    { label: 'Teal Cyan', value: '#0f766e' },
  ];

  const currencyOptions = [
    { label: 'KSh - Kenyan Shilling (KES)', symbol: 'KSh' },
    { label: '₱ - Philippine Peso (PHP)', symbol: '₱' },
    { label: '$ - US Dollar (USD)', symbol: '$' },
    { label: '€ - Euro (EUR)', symbol: '€' },
    { label: '£ - British Pound (GBP)', symbol: '£' },
    { label: 'TSH - Tanzanian Shilling (TZS)', symbol: 'TSH' },
    { label: 'UGX - Ugandan Shilling (UGX)', symbol: 'UGX' },
    { label: '¥ - Japanese Yen (JPY)', symbol: '¥' },
    { label: 'CA$ - Canadian Dollar', symbol: 'CA$' },
  ];

  const handleQuickParse = async () => {
    if (!freeformText.trim()) return;
    setIsParsing(true);
    setParseSuccessMessage(null);

    try {
      const parsed = await parseQuoteFromNaturalText(freeformText, data);
      onChange({ ...data, ...parsed });
      setParseSuccessMessage('Quotation generated successfully from your text!');
      setTimeout(() => setParseSuccessMessage(null), 3500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsing(false);
    }
  };

  const handlePresetExample = (type: 'kenya-default' | 'kenya-solar' | 'kenya-it' | 'kenya-enterprise-long' | 'philippines') => {
    if (type === 'kenya-default') {
      onChange(DEFAULT_QUOTATION);
      setFreeformText(
        `Quotation #KE-1234 for Mary Anne Wanjiku at AOTA Enterprises Ltd (Kilimani, Nairobi). Phone: +254 722 456 789.\n\n3 line items:\n- Supply of High-Grade Interior Wall Emulsion Paint (20L Bucket): 5 units at KSh 8,500\n- Polished Porcelain Floor Tiles 600x600mm (Box of 4 pcs): 25 boxes at KSh 2,400\n- Skilled Masonry & Professional Finishing Labor: 30 sqm at KSh 1,200\n\nTax: 16% VAT (KSh 22,160). Project: Residential construction fittings and architectural finishes.`
      );
    } else if (type === 'kenya-enterprise-long') {
      onChange({
        ...data,
        company: {
          name: 'CONSOLIDATED TELECOMMUNICATIONS & LOGISTICS SERVICES EAST AFRICA LIMITED',
          tagline: 'TURNKEY INFRASTRUCTURE & ENTERPRISE PROCUREMENT DIVISION',
          address: 'DELTA CORNER TOWER A, 14TH FLOOR, WAIYAKI WAY, WESTLANDS, NAIROBI, KENYA',
          phone: '+254 111 537 414',
          website: 'onestependlesssolutions@gmail.com',
          logoUrl: data.company.logoUrl || '/assets/aistudio/image_6276447f.png',
        },
        client: {
          name: 'Dr. Humphrey Kimani',
          company: 'KENYA ELECTRICITY GENERATING COMPANY PLC (KENGEN) - REGIONAL ENERGY COMPLEX',
          address: 'Stima Plaza, Kolobot Road, Parklands, P.O. Box 47936-00100, Nairobi',
          phone: '+254 719 036 000',
          customerId: 'OSS-LONG-992',
        },
        details: {
          quoteNumber: '#OSS-ENT-5501',
          date: '2026-10-26',
          validUntil: '2026-11-26',
          projectDescription: 'Provision of high-density optical fiber core distribution, redundant microwave links, and high-availability server racks across regional sub-stations.',
        },
        items: [
          { id: 'it-1', description: 'Dual-Redundant 40Gbps Optical Fiber Core Switches with Hot-Swappable Power Units', quantity: 2, price: 345000 },
          { id: 'it-2', description: 'Industrial Grade IP67 Outdoor Microwave Wireless Backhaul Transceivers (10km Range)', quantity: 4, price: 125000 },
          { id: 'it-3', description: 'Heavy-Duty 42U Server Rack Enclosures with Intelligent Vertical PDU & Sensor Monitoring', quantity: 3, price: 88000 },
        ],
        pricing: {
          currencySymbol: 'KSh',
          taxRatePercent: 16,
          taxAmount: 232640,
          othersFee: 0,
        },
        terms: 'All quotations are valid for 30 calendar days. 16% VAT is applicable per Kenya Revenue Authority regulations. Direct manufacturer warranty of 3 years included.',
        themeColor: '#0284c7',
      });
      setFreeformText('Enterprise long-name quote for KenGen regional energy complex.');
    } else if (type === 'kenya-solar') {
      onChange({
        ...data,
        company: {
          name: 'SAFARI SOLAR & BOREHOLE TECH',
          tagline: 'CLEAN ENERGY & WATER SOLUTIONS LTD',
          address: 'SAMEER BUSINESS PARK, ENTERPRISE RD, NAIROBI',
          phone: '+254 700 889 900 / +254 20 655 4321',
          website: 'WWW.SAFARISOLARKENYA.CO.KE',
          logoUrl: data.company.logoUrl || '',
        },
        client: {
          name: 'David Kiprono',
          company: 'Rift Agri-Farms Ltd',
          address: 'P.O. Box 340, Nakuru-Njoro Road, Kenya',
          phone: '+254 711 234 567',
          customerId: 'KE-SOL-440',
        },
        details: {
          quoteNumber: '#SOL-2026-90',
          date: '2026-10-26',
          validUntil: '2026-11-26',
          projectDescription: 'Supply, transport, and turnkey commissioning of 10kW hybrid solar pumping and battery backup array.',
        },
        items: [
          { id: 'it-1', description: 'Tier-1 Monocrystalline Solar PV Panels (550W Half-Cut)', quantity: 18, price: 16500 },
          { id: 'it-2', description: 'Growatt 10kW 3-Phase Hybrid Inverter & BMS', quantity: 1, price: 285000 },
          { id: 'it-3', description: 'Lithium Iron Phosphate Battery Pack (10.24kWh)', quantity: 2, price: 195000 },
          { id: 'it-4', description: 'EPRA Certified Engineering Installation & Surge Protection', quantity: 1, price: 45000 },
        ],
        pricing: {
          currencySymbol: 'KSh',
          taxRatePercent: 16,
          taxAmount: 162720,
          othersFee: 15000,
        },
        terms: 'Solar panels carry 25-year performance warranty. Inverter and batteries carry 5-year replacement warranty. Delivery to Nakuru site included.',
        themeColor: '#2e7d32',
      });
      setFreeformText('Solar quote for David Kiprono at Rift Agri-Farms Nakuru with 18 solar panels at KSh 16,500, inverter at KSh 285,000, and batteries.');
    } else if (type === 'kenya-it') {
      onChange({
        ...data,
        company: {
          name: 'SAVANNAH CLOUD TECHNOLOGIES',
          tagline: 'ENTERPRISE DIGITAL ARCHITECTURE',
          address: 'THE MIRAGE, TOWER 2, CHIROMO ROAD, WESTLANDS, NAIROBI',
          phone: '+254 720 112 233',
          website: 'WWW.SAVANNAHCLOUD.CO.KE',
          logoUrl: data.company.logoUrl || '',
        },
        client: {
          name: 'Grace Mutua',
          company: 'Apex Logistics East Africa Ltd',
          address: 'ICD Road, Embakasi, Nairobi',
          phone: '+254 733 998 877',
          customerId: 'KE-IT-881',
        },
        details: {
          quoteNumber: '#SAV-1044',
          date: '2026-10-26',
          validUntil: '2026-11-15',
          projectDescription: 'Custom M-Pesa Daraja B2C/C2B payment automation, dispatch portal frontend, and cloud microservices.',
        },
        items: [
          { id: 'it-1', description: 'Custom Web Portal & Real-Time Tracking UI', quantity: 1, price: 180000 },
          { id: 'it-2', description: 'Safaricom M-Pesa Daraja API Integration & STK Push', quantity: 1, price: 95000 },
          { id: 'it-3', description: 'PostgreSQL Database & Automated Backup Clustering', quantity: 1, price: 65000 },
          { id: 'it-4', description: '12 Months Enterprise SLA & Security Maintenance', quantity: 1, price: 120000 },
        ],
        pricing: {
          currencySymbol: 'KSh',
          taxRatePercent: 16,
          taxAmount: 73600,
          othersFee: 0,
        },
        terms: 'Payment terms: 40% on mobilization, 40% upon UAT signoff, 20% upon final production deployment. VAT inclusive.',
        themeColor: '#1e3a8a',
      });
      setFreeformText('M-Pesa integration and web portal quote for Grace Mutua at Apex Logistics Nairobi.');
    } else if (type === 'philippines') {
      onChange({
        ...data,
        pricing: {
          ...data.pricing,
          currencySymbol: '₱',
          taxAmount: 100,
        },
        items: [
          { id: 'it-1', description: 'Description of item or service goes here', quantity: 5, price: 100 },
          { id: 'it-2', description: 'Description of item or service goes here', quantity: 5, price: 100 },
          { id: 'it-3', description: 'Description of item or service goes here', quantity: 5, price: 100 },
        ],
      });
    }
  };

  const handleAddItem = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      description: 'New service or item',
      quantity: 1,
      price: 100,
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const handleRemoveItem = (id: string) => {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter((it) => it.id !== id) });
  };

  const handleUpdateItem = (id: string, field: keyof QuoteItem, val: any) => {
    onChange({
      ...data,
      items: data.items.map((it) => (it.id === id ? { ...it, [field]: val } : it)),
    });
  };

  return (
    <div className="w-full lg:w-[420px] xl:w-[460px] shrink-0 bg-[#0f172a] border-r border-[#334155] flex flex-col h-full overflow-hidden text-slate-200 print:hidden">
      {/* Top Tabs */}
      <div className="p-3 border-b border-[#334155] bg-[#0b1326] flex items-center justify-between gap-1">
        <div className="flex items-center gap-1 p-1 bg-[#1e293b] rounded-lg border border-[#334155] w-full">
          <button
            onClick={() => setActiveTab('quick-write')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'quick-write'
                ? 'bg-[#2e7d32] text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Just Write</span>
          </button>

          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'items'
                ? 'bg-[#172554] text-sky-200 border border-sky-800 shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Line Items ({data.items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'details'
                ? 'bg-[#334155] text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Client</span>
          </button>

          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'company'
                ? 'bg-[#334155] text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: QUICK WRITE */}
        {activeTab === 'quick-write' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Instant Text-to-Quote
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                  Freeform Writer
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Just describe what you are quoting in natural language or paste bullet points. The system will automatically build the quotation sheet.
              </p>

              <textarea
                rows={5}
                value={freeformText}
                onChange={(e) => setFreeformText(e.target.value)}
                placeholder="Example:
Quotation for Mary Anne Garcia at AOTA.
3 units of Waterproof Roofing Sealant at ₱850
2 rolls of Fiberglass Mesh at ₱420
Labor and application: ₱2,500
Tax: ₱150."
                className="w-full bg-[#0b1326] border border-[#334155] rounded-lg p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setFreeformText('')}
                  className="text-[11px] text-slate-500 hover:text-slate-300"
                >
                  Clear text
                </button>

                <button
                  onClick={handleQuickParse}
                  disabled={isParsing || !freeformText.trim()}
                  className="px-4 py-2 rounded-lg bg-[#2e7d32] hover:bg-[#256629] disabled:opacity-50 text-white font-semibold text-xs shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Update Quotation</span>
                    </>
                  )}
                </button>
              </div>

              {parseSuccessMessage && (
                <div className="p-2 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{parseSuccessMessage}</span>
                </div>
              )}
            </div>

            {/* Quick Presets / Templates */}
            <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] space-y-2">
              <span className="font-semibold text-slate-200 text-xs block">
                Load Ready-to-Use Templates
              </span>
              <p className="text-[11px] text-slate-400">
                Click any template to quickly populate the page:
              </p>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  onClick={() => handlePresetExample('kenya-default')}
                  className="p-2.5 rounded-lg bg-[#0f172a] hover:bg-[#131d38] border border-[#334155] hover:border-emerald-600 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-white block">Kenyan Construction & Finishes (KSh)</span>
                    <span className="text-[10px] text-slate-400">Buhay Homes layout with 16% VAT · Nairobi</span>
                  </div>
                  <span className="text-emerald-400 text-xs font-mono font-semibold">KSh 160,660</span>
                </button>

                <button
                  onClick={() => handlePresetExample('kenya-solar')}
                  className="p-2.5 rounded-lg bg-[#0f172a] hover:bg-[#131d38] border border-[#334155] hover:border-emerald-600 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-white block">Kenyan Solar & Pumping Installation</span>
                    <span className="text-[10px] text-slate-400">Solar PV, Inverter, and Battery storage</span>
                  </div>
                  <span className="text-emerald-400 text-xs font-mono font-semibold">KSh 1.19M</span>
                </button>

                <button
                  onClick={() => handlePresetExample('kenya-it')}
                  className="p-2.5 rounded-lg bg-[#0f172a] hover:bg-[#131d38] border border-[#334155] hover:border-blue-600 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-white block">Kenyan Software & M-Pesa Integration</span>
                    <span className="text-[10px] text-slate-400">Safaricom Daraja API, Web Portal & SLA</span>
                  </div>
                  <span className="text-sky-400 text-xs font-mono font-semibold">KSh 533,600</span>
                </button>

                <button
                  onClick={() => handlePresetExample('kenya-enterprise-long')}
                  className="p-2.5 rounded-lg bg-[#0f172a] hover:bg-[#131d38] border border-cyan-800/60 hover:border-cyan-500 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-cyan-200 block">Long Company Name Demo</span>
                      <span className="text-[9px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.2 rounded font-bold uppercase">Multi-line</span>
                    </div>
                    <span className="text-[10px] text-slate-400">70+ character company & client names with auto-wrapping</span>
                  </div>
                  <span className="text-cyan-400 text-xs font-mono font-semibold">KSh 1.68M</span>
                </button>

                <button
                  onClick={() => handlePresetExample('philippines')}
                  className="p-2 rounded-lg bg-[#0f172a]/60 hover:bg-[#131d38] border border-[#334155] text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium text-slate-300 text-xs block">Original Image Template (₱)</span>
                    <span className="text-[10px] text-slate-400">3x ₱100 items + ₱100 tax</span>
                  </div>
                  <span className="text-slate-400 text-xs font-mono">₱1,600</span>
                </button>
              </div>
            </div>

            {/* In-Place Hint */}
            <div className="p-3 rounded-lg bg-[#0b1326] border border-[#334155] text-slate-400 text-[11px] leading-relaxed">
              💡 <strong className="text-white">Direct On-Page Editing:</strong> You can also click directly on any text, quantity, or price inside the quotation sheet on the right to edit it in place!
            </div>
          </div>
        )}

        {/* TAB 2: ITEMS */}
        {activeTab === 'items' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Quotation Line Items</span>
              <button
                onClick={handleAddItem}
                className="px-2.5 py-1 rounded bg-[#2e7d32] hover:bg-[#256629] text-white text-xs font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {data.items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#1e293b] border border-[#334155] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      Item #{index + 1}
                    </span>
                    {data.items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-400 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Price ({data.pricing.currencySymbol})</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.price}
                        onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Taxes and Extra Fees */}
            <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] space-y-2.5 mt-4">
              <span className="font-semibold text-white block">Taxes & Other Charges</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Value-Added Tax ({data.pricing.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={data.pricing.taxAmount}
                    onChange={(e) => onChange({
                      ...data,
                      pricing: { ...data.pricing, taxAmount: parseFloat(e.target.value) || 0 },
                    })}
                    className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Others ({data.pricing.currencySymbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={data.pricing.othersFee}
                    onChange={(e) => onChange({
                      ...data,
                      pricing: { ...data.pricing, othersFee: parseFloat(e.target.value) || 0 },
                    })}
                    className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CLIENT & QUOTE DETAILS */}
        {activeTab === 'details' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] space-y-2.5">
              <span className="font-semibold text-white block">Client / Recipient Details</span>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Recipient Full Name</label>
                <input
                  type="text"
                  value={data.client.name}
                  onChange={(e) => onChange({ ...data, client: { ...data.client, name: e.target.value } })}
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] text-slate-400 font-medium">Company Name (e.g. AOTA)</label>
                  <span className="text-[9px] text-sky-400">Auto-wraps long names</span>
                </div>
                <textarea
                  rows={2}
                  value={data.client.company}
                  onChange={(e) => onChange({ ...data, client: { ...data.client, company: e.target.value } })}
                  placeholder="Client company or organization name"
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Address</label>
                <textarea
                  rows={2}
                  value={data.client.address}
                  onChange={(e) => onChange({ ...data, client: { ...data.client, address: e.target.value } })}
                  placeholder="Street, building, postal code, city"
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Phone Number</label>
                <input
                  type="text"
                  value={data.client.phone}
                  onChange={(e) => onChange({ ...data, client: { ...data.client, phone: e.target.value } })}
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] space-y-2.5">
              <span className="font-semibold text-white block">Quotation Metadata</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Quotation No.</label>
                  <input
                    type="text"
                    value={data.details.quoteNumber}
                    onChange={(e) => onChange({ ...data, details: { ...data.details, quoteNumber: e.target.value } })}
                    className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Customer ID</label>
                  <input
                    type="text"
                    value={data.client.customerId || ''}
                    onChange={(e) => onChange({ ...data, client: { ...data.client, customerId: e.target.value } })}
                    className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Date</label>
                  <input
                    type="text"
                    value={data.details.date}
                    onChange={(e) => onChange({ ...data, details: { ...data.details, date: e.target.value } })}
                    className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Valid Until</label>
                  <input
                    type="text"
                    value={data.details.validUntil}
                    onChange={(e) => onChange({ ...data, details: { ...data.details, validUntil: e.target.value } })}
                    className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Project Description</label>
                <textarea
                  rows={2}
                  value={data.details.projectDescription}
                  onChange={(e) => onChange({ ...data, details: { ...data.details, projectDescription: e.target.value } })}
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: COMPANY & THEME */}
        {activeTab === 'company' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] space-y-3">
              <span className="font-semibold text-white block">Your Business Profile</span>

              {/* Logo Upload Box */}
              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#334155] space-y-2">
                <label className="text-[10px] text-slate-400 block font-medium">Company Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-12 rounded border border-[#334155] bg-[#131b2e] flex items-center justify-center overflow-hidden shrink-0">
                    {data.company.logoUrl ? (
                      <img src={data.company.logoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Icon</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="px-3 py-1.5 rounded-lg bg-[#2e7d32] hover:bg-[#256629] text-white text-xs font-semibold cursor-pointer text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{data.company.logoUrl ? 'Change Custom Logo' : 'Upload Company Logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) {
                              onChange({
                                ...data,
                                company: { ...data.company, logoUrl: ev.target.result as string }
                              });
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    {data.company.logoUrl ? (
                      <button
                        type="button"
                        onClick={() => onChange({ ...data, company: { ...data.company, logoUrl: '' } })}
                        className="text-[10px] text-rose-400 hover:text-rose-300 text-left underline cursor-pointer"
                      >
                        Remove logo
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500">PNG, JPG, or SVG with transparent background</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] text-slate-400 font-medium">Company Name</label>
                  <span className="text-[9px] text-sky-400">Auto-scales & wraps long names</span>
                </div>
                <textarea
                  rows={2}
                  value={data.company.name}
                  onChange={(e) => onChange({ ...data, company: { ...data.company, name: e.target.value } })}
                  placeholder="Enter company or organization name"
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Tagline / Sub-header</label>
                <input
                  type="text"
                  value={data.company.tagline || ''}
                  onChange={(e) => onChange({ ...data, company: { ...data.company, tagline: e.target.value } })}
                  placeholder="e.g. ONE STEP. ENDLESS SOLUTIONS."
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Address</label>
                <textarea
                  rows={2}
                  value={data.company.address}
                  onChange={(e) => onChange({ ...data, company: { ...data.company, address: e.target.value } })}
                  placeholder="Building, Street, Area, City"
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Phone</label>
                <input
                  type="text"
                  value={data.company.phone}
                  onChange={(e) => onChange({ ...data, company: { ...data.company, phone: e.target.value } })}
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Website</label>
                <input
                  type="text"
                  value={data.company.website}
                  onChange={(e) => onChange({ ...data, company: { ...data.company, website: e.target.value } })}
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Currency & Colors */}
            <div className="p-3.5 rounded-xl bg-[#1e293b] border border-[#334155] space-y-2.5">
              <span className="font-semibold text-white block">Currency & Color Theme</span>
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Currency</label>
                <select
                  value={data.pricing.currencySymbol}
                  onChange={(e) => onChange({
                    ...data,
                    pricing: { ...data.pricing, currencySymbol: e.target.value },
                  })}
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  {currencyOptions.map((c) => (
                    <option key={c.symbol} value={c.symbol}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1.5">Accent Color</label>
                <div className="grid grid-cols-3 gap-2">
                  {themeColors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => onChange({ ...data, themeColor: color.value })}
                      className={`p-1.5 rounded-lg border text-left flex items-center gap-1.5 transition-all ${
                        data.themeColor === color.value
                          ? 'border-white bg-[#0b1326] shadow-sm'
                          : 'border-[#334155] hover:border-slate-500 bg-[#0b1326]/60'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-[10px] truncate text-slate-300">
                        {color.label.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={data.terms}
                  onChange={(e) => onChange({ ...data, terms: e.target.value })}
                  className="w-full bg-[#0b1326] border border-[#334155] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset footer */}
      <div className="p-3 border-t border-[#334155] bg-[#0b1326] flex items-center justify-between text-xs">
        <button
          onClick={onResetToSample}
          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Screenshot Default</span>
        </button>

        <span className="text-[10px] text-slate-500">
          Auto-saves in real time
        </span>
      </div>
    </div>
  );
};
