import React, { useRef, useState, useEffect } from 'react';
import { QuotationData, QuoteItem } from '../types/quote';
import { Trash2, Plus, PenTool, Check, RotateCcw, Upload, X, Image as ImageIcon } from 'lucide-react';

interface AutoResizeTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const AutoResizeTextarea: React.FC<AutoResizeTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  style,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`resize-none overflow-hidden block ${className}`}
      style={style}
    />
  );
};

const getCompanyNameStyle = (name: string) => {
  const len = (name || '').trim().length;
  if (len > 50) {
    return 'text-xs sm:text-[13px] font-bold leading-snug tracking-tight';
  }
  if (len > 30) {
    return 'text-sm sm:text-[15px] font-bold leading-snug tracking-wide';
  }
  return 'text-sm sm:text-base font-bold leading-tight tracking-wide';
};

const getClientCompanyStyle = (company: string) => {
  const len = (company || '').trim().length;
  if (len > 40) {
    return 'text-xs font-semibold leading-snug';
  }
  return 'text-xs sm:text-sm font-semibold leading-normal';
};

interface QuotationDocumentProps {
  data: QuotationData;
  onChange: (updated: QuotationData) => void;
  interactive?: boolean;
}

export const QuotationDocument: React.FC<QuotationDocumentProps> = ({
  data,
  onChange,
  interactive = true,
}) => {
  const [isSigning, setIsSigning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Subtotal calculations
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const tax = data.pricing.taxAmount || (subtotal * (data.pricing.taxRatePercent / 100));
  const others = data.pricing.othersFee || 0;
  const grandTotal = subtotal + tax + others;

  const currency = data.pricing.currencySymbol || 'KSh';
  const currDisplay = currency.length > 1 ? `${currency} ` : currency;
  const theme = data.themeColor || '#2e7d32';

  // Format numbers nicely
  const formatNum = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Logo upload handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onChange({
          ...data,
          company: {
            ...data.company,
            logoUrl: event.target.result as string,
          },
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({
      ...data,
      company: {
        ...data.company,
        logoUrl: '',
      },
    });
  };

  // Field change helpers
  const handleUpdateItem = (id: string, field: keyof QuoteItem, value: any) => {
    const updatedItems = data.items.map((it) => {
      if (it.id === id) {
        return { ...it, [field]: value };
      }
      return it;
    });
    onChange({ ...data, items: updatedItems });
  };

  const handleAddItem = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      description: 'Description of item or service goes here',
      quantity: 1,
      price: 100,
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const handleRemoveItem = (id: string) => {
    if (data.items.length <= 1) return;
    onChange({ ...data, items: data.items.filter((it) => it.id !== id) });
  };

  // Signature canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = ('clientX' in e ? e.clientX : e.touches[0].clientX) - rect.left;
    const y = ('clientY' in e ? e.clientY : e.touches[0].clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange({
        ...data,
        signature: {
          ...data.signature,
          signatureDataUrl: canvas.toDataURL(),
        },
      });
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      onChange({
        ...data,
        signature: {
          ...data.signature,
          signatureDataUrl: undefined,
        },
      });
    }
  };

  return (
    <div 
      id="printable-quotation"
      className="bg-white text-[#1f2937] w-full max-w-[800px] min-h-[1050px] mx-auto p-10 sm:p-14 shadow-2xl rounded-sm font-sans flex flex-col justify-between print:shadow-none print:p-8 print:w-full print:max-w-none print:m-0 print:rounded-none select-text"
      style={{
        boxSizing: 'border-box',
      }}
    >
      <div>
        {/* Header: Company Logo / Name & Address (Adaptive for long company names) */}
        <div className="flex items-start justify-between gap-4 sm:gap-6 mb-8">
          {/* Logo & Company Name (supports short, medium, and long enterprise names) */}
          <div className="flex items-start gap-3 flex-1 min-w-0 max-w-[62%]">
            {/* Hidden file input for logo */}
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />

            {data.company.logoUrl ? (
              <div
                className="relative group cursor-pointer shrink-0 mt-0.5"
                onClick={() => interactive && logoInputRef.current?.click()}
                title="Click to change logo"
              >
                <img
                  src={data.company.logoUrl}
                  alt="Company Logo"
                  className="max-h-14 max-w-[120px] object-contain rounded"
                />
                {interactive && (
                  <div className="absolute inset-0 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-opacity print:hidden text-[9px] font-medium p-1">
                    <Upload className="w-3 h-3" />
                    <span>Change</span>
                    <button
                      onClick={handleRemoveLogo}
                      title="Reset to default icon"
                      className="ml-1 p-0.5 rounded hover:bg-white/20 text-rose-300 hover:text-rose-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div 
                className="relative group cursor-pointer w-14 h-12 flex items-center justify-center shrink-0 rounded hover:bg-slate-50 transition-colors mt-0.5"
                style={{ color: theme }}
                onClick={() => interactive && logoInputRef.current?.click()}
                title="Click to upload custom logo"
              >
                <svg viewBox="0 0 100 80" className="w-full h-full fill-none stroke-current" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 65 Q 50 10 90 65" />
                  <path d="M22 65 Q 50 25 78 65" strokeWidth="5" />
                  <path d="M30 65 L 45 42 L 58 55 L 70 40 L 78 65" strokeWidth="5" fill="currentColor" fillOpacity="0.15" />
                </svg>
                {interactive && (
                  <div className="absolute inset-0 bg-black/60 text-white rounded opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity print:hidden text-[9px] font-semibold text-center leading-tight p-0.5">
                    <Upload className="w-3 h-3 mb-0.5" />
                    <span>Upload Logo</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <AutoResizeTextarea
                value={data.company.name}
                onChange={(val) => onChange({ ...data, company: { ...data.company, name: val } })}
                placeholder="COMPANY NAME"
                className={`w-full uppercase text-slate-800 bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 -ml-1 transition-all ${getCompanyNameStyle(data.company.name)}`}
                style={{ color: theme }}
              />
              <AutoResizeTextarea
                value={data.company.tagline || ''}
                onChange={(val) => onChange({ ...data, company: { ...data.company, tagline: val } })}
                placeholder="TAGLINE OR SUBTITLE"
                className="w-full font-semibold text-xs tracking-wider uppercase text-slate-700 bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 -ml-1 mt-0.5 leading-snug"
                style={{ color: theme }}
              />
            </div>
          </div>

          {/* Company Contact Details (Right-aligned, auto-wrapping for long addresses) */}
          <div className="text-right text-[11px] sm:text-xs leading-relaxed space-y-0.5 shrink-0 max-w-[38%]" style={{ color: theme }}>
            <AutoResizeTextarea
              value={data.company.address}
              onChange={(val) => onChange({ ...data, company: { ...data.company, address: val } })}
              placeholder="COMPANY ADDRESS"
              className="text-right uppercase font-medium bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 w-full ml-auto leading-snug"
              style={{ color: theme }}
            />
            <input
              type="text"
              value={data.company.phone}
              onChange={(e) => onChange({ ...data, company: { ...data.company, phone: e.target.value } })}
              placeholder="PHONE NUMBER"
              className="text-right font-medium bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 w-full block ml-auto"
              style={{ color: theme }}
            />
            <AutoResizeTextarea
              value={data.company.website}
              onChange={(val) => onChange({ ...data, company: { ...data.company, website: val } })}
              placeholder="EMAIL / WEBSITE"
              className="text-right uppercase font-medium bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 w-full ml-auto break-all leading-snug"
              style={{ color: theme }}
            />
          </div>
        </div>

        {/* Big Bold QUOTATION Header */}
        <div className="text-center my-6">
          <h1 
            className="text-3xl sm:text-4xl font-extrabold tracking-wider uppercase"
            style={{ color: theme }}
          >
            QUOTATION
          </h1>
        </div>

        {/* 2-Column Metadata Block */}
        <div className="grid grid-cols-2 gap-8 my-6 text-xs sm:text-sm">
          {/* Left Metadata: Quotation No, Date, Valid Until, Customer ID */}
          <div className="space-y-1.5 text-slate-900">
            <div className="flex items-center gap-2">
              <span className="font-bold w-28 shrink-0">Quotation No:</span>
              <input
                type="text"
                value={data.details.quoteNumber}
                onChange={(e) => onChange({ ...data, details: { ...data.details, quoteNumber: e.target.value } })}
                className="font-medium bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold w-28 shrink-0">Date:</span>
              <input
                type="text"
                value={data.details.date}
                onChange={(e) => onChange({ ...data, details: { ...data.details, date: e.target.value } })}
                className="font-medium bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold w-28 shrink-0">Valid Until:</span>
              <input
                type="text"
                value={data.details.validUntil}
                onChange={(e) => onChange({ ...data, details: { ...data.details, validUntil: e.target.value } })}
                className="font-medium bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold w-28 shrink-0">Customer ID:</span>
              <input
                type="text"
                value={data.client.customerId || '123456'}
                onChange={(e) => onChange({ ...data, client: { ...data.client, customerId: e.target.value } })}
                className="font-medium bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 flex-1"
              />
            </div>
          </div>

          {/* Right Metadata: Client Name, Company, Address, Phone (Auto-wrapping for long names) */}
          <div className="space-y-1 text-slate-800 min-w-0">
            <AutoResizeTextarea
              value={data.client.name}
              onChange={(val) => onChange({ ...data, client: { ...data.client, name: val } })}
              placeholder="Client Name"
              className="font-bold text-sm sm:text-base text-slate-900 bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 w-full leading-snug"
            />
            <AutoResizeTextarea
              value={data.client.company}
              onChange={(val) => onChange({ ...data, client: { ...data.client, company: val } })}
              placeholder="Client Company"
              className={`bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 w-full text-slate-800 transition-all ${getClientCompanyStyle(data.client.company)}`}
            />
            <AutoResizeTextarea
              value={data.client.address}
              onChange={(val) => onChange({ ...data, client: { ...data.client, address: val } })}
              placeholder="Client Address"
              className="font-normal text-xs text-slate-700 bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 w-full leading-snug"
            />
            <input
              type="text"
              value={data.client.phone}
              onChange={(e) => onChange({ ...data, client: { ...data.client, phone: e.target.value } })}
              placeholder="Client Phone"
              className="font-normal text-xs text-slate-700 bg-transparent hover:bg-slate-100 focus:bg-slate-50 focus:outline-none rounded px-1 w-full block"
            />
          </div>
        </div>

        {/* Divider Line */}
        <div 
          className="h-[3px] w-full my-5" 
          style={{ backgroundColor: theme }} 
        />

        {/* PROJECT DESCRIPTION */}
        <div className="my-5 flex items-start gap-6 text-xs sm:text-sm">
          <span className="font-extrabold uppercase tracking-wide text-slate-900 shrink-0 w-44 pt-0.5">
            PROJECT DESCRIPTION
          </span>
          <AutoResizeTextarea
            value={data.details.projectDescription}
            onChange={(val) => onChange({ ...data, details: { ...data.details, projectDescription: val } })}
            placeholder="Add a brief and concise description of the project, item, or service here."
            className="flex-1 bg-transparent hover:bg-slate-50 focus:bg-slate-50 focus:outline-none rounded p-1 text-slate-700 leading-relaxed"
          />
        </div>

        {/* Quotation Items Table */}
        <div className="my-6">
          <table className="w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr style={{ backgroundColor: theme, color: '#ffffff' }}>
                <th className="py-2 px-4 text-left font-semibold rounded-tl-sm w-[50%]">
                  Description
                </th>
                <th className="py-2 px-3 text-center font-semibold w-[15%]">
                  Quantity
                </th>
                <th className="py-2 px-3 text-center font-semibold w-[15%]">
                  Price
                </th>
                <th className="py-2 px-4 text-right font-semibold rounded-tr-sm w-[20%]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => {
                const lineTotal = item.quantity * item.price;
                const isEven = index % 2 === 0;

                return (
                  <tr 
                    key={item.id}
                    className={`group transition-colors ${isEven ? 'bg-[#f4f7f5]' : 'bg-white'}`}
                  >
                    <td className="py-2.5 px-4 text-slate-700 relative">
                      <div className="flex items-start gap-1.5">
                        <AutoResizeTextarea
                          value={item.description}
                          onChange={(val) => handleUpdateItem(item.id, 'description', val)}
                          placeholder="Description of item or service"
                          className="w-full bg-transparent focus:bg-white focus:outline-none rounded px-1 leading-snug"
                        />
                        {interactive && data.items.length > 1 && (
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            title="Remove line"
                            className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-1 print:hidden transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center text-slate-800">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-16 text-center bg-transparent focus:bg-white focus:outline-none rounded px-1 font-mono"
                      />
                    </td>

                    <td className="py-2.5 px-3 text-center text-slate-800 font-mono">
                      <div className="flex items-center justify-center">
                        <span className="text-slate-600 mr-0.5">{currDisplay}</span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-20 text-center bg-transparent focus:bg-white focus:outline-none rounded px-1 font-mono"
                        />
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                      {currDisplay}{formatNum(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Add Row Button (Hidden during print) */}
          {interactive && (
            <div className="pt-2 print:hidden flex justify-start">
              <button
                onClick={handleAddItem}
                className="text-xs font-semibold flex items-center gap-1 py-1 px-2.5 rounded hover:bg-slate-100 transition-colors"
                style={{ color: theme }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>
          )}
        </div>

        {/* Totals Section */}
        <div className="flex justify-end my-4">
          <div className="w-64 sm:w-72 space-y-1 text-xs sm:text-sm">
            {/* Subtotal */}
            <div className="flex justify-between items-center py-0.5 text-slate-800">
              <span className="font-bold">Subtotal</span>
              <span className="font-mono font-medium">{currDisplay}{formatNum(subtotal)}</span>
            </div>

            {/* Value-Added Tax */}
            <div className="flex justify-between items-center py-0.5 text-slate-800">
              <span className="font-bold">Value-Added Tax</span>
              <div className="flex items-center justify-end font-mono">
                <span className="text-slate-600 mr-0.5">{currDisplay}</span>
                <input
                  type="number"
                  min="0"
                  value={data.pricing.taxAmount}
                  onChange={(e) => onChange({
                    ...data,
                    pricing: {
                      ...data.pricing,
                      taxAmount: parseFloat(e.target.value) || 0,
                    },
                  })}
                  className="w-16 text-right bg-transparent hover:bg-slate-100 focus:bg-white focus:outline-none rounded px-1 font-mono font-medium"
                />
              </div>
            </div>

            {/* Others */}
            <div className="flex justify-between items-center py-0.5 text-slate-800">
              <span className="font-bold">Others</span>
              <div className="flex items-center justify-end font-mono">
                <span className="text-slate-600 mr-0.5">{currDisplay}</span>
                <input
                  type="number"
                  min="0"
                  value={data.pricing.othersFee}
                  onChange={(e) => onChange({
                    ...data,
                    pricing: {
                      ...data.pricing,
                      othersFee: parseFloat(e.target.value) || 0,
                    },
                  })}
                  className="w-16 text-right bg-transparent hover:bg-slate-100 focus:bg-white focus:outline-none rounded px-1 font-mono font-medium"
                />
              </div>
            </div>

            {/* Solid Accent Color Total Bar matching image */}
            <div 
              className="flex justify-between items-center px-4 py-1.5 mt-2 rounded-xs font-bold text-white text-sm sm:text-base font-mono"
              style={{ backgroundColor: theme }}
            >
              <span>Total</span>
              <span>{currDisplay}{formatNum(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div 
          className="h-[3px] w-full my-6" 
          style={{ backgroundColor: theme }} 
        />

        {/* TERMS & CONDITIONS */}
        <div className="my-5 flex items-start gap-6 text-xs sm:text-sm">
          <span className="font-extrabold uppercase tracking-wide text-slate-900 shrink-0 w-44 pt-0.5">
            TERMS & CONDITIONS
          </span>
          <textarea
            rows={2}
            value={data.terms}
            onChange={(e) => onChange({ ...data, terms: e.target.value })}
            className="flex-1 bg-transparent hover:bg-slate-50 focus:bg-slate-50 focus:outline-none rounded p-1 resize-none text-slate-700 leading-relaxed"
          />
        </div>

        {/* PLEASE CONFIRM YOUR ACCEPTANCE OF THIS QUOTE */}
        <div className="mt-8 pt-4">
          <h3 className="text-center font-extrabold text-xs sm:text-sm uppercase tracking-wider text-slate-900 mb-8">
            PLEASE CONFIRM YOUR ACCEPTANCE OF THIS QUOTE
          </h3>

          <div className="grid grid-cols-2 gap-10 max-w-lg mx-auto text-center text-xs text-slate-700">
            {/* Signature over printed name */}
            <div className="flex flex-col items-center">
              <div className="w-full border-b border-slate-900 h-16 flex items-end justify-center pb-1 relative">
                {data.signature?.signatureDataUrl ? (
                  <img
                    src={data.signature.signatureDataUrl}
                    alt="Signature"
                    className="max-h-14 object-contain"
                  />
                ) : (
                  <input
                    type="text"
                    value={data.signature?.printedName || ''}
                    onChange={(e) => onChange({
                      ...data,
                      signature: {
                        ...data.signature,
                        printedName: e.target.value,
                      },
                    })}
                    placeholder="Sign here or type name"
                    className="w-full text-center font-serif italic text-base sm:text-lg text-slate-900 bg-transparent focus:outline-none"
                  />
                )}
                {interactive && (
                  <button
                    onClick={() => setIsSigning(!isSigning)}
                    className="absolute right-0 top-0 text-[10px] text-slate-500 hover:text-slate-900 print:hidden flex items-center gap-1"
                  >
                    <PenTool className="w-3 h-3" />
                    <span>{isSigning ? 'Close' : 'Draw'}</span>
                  </button>
                )}
              </div>
              <span className="mt-1 font-medium text-[11px] sm:text-xs text-slate-800">
                Signature over printed name
              </span>

              {/* Drawing pad toggle */}
              {isSigning && (
                <div className="mt-2 p-2 bg-slate-100 border border-slate-300 rounded shadow-sm print:hidden">
                  <canvas
                    ref={canvasRef}
                    width={220}
                    height={80}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="bg-white border border-slate-300 rounded cursor-crosshair w-full"
                  />
                  <div className="flex justify-between items-center mt-1 text-[10px]">
                    <button
                      onClick={clearCanvas}
                      className="text-slate-600 hover:text-rose-600 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear
                    </button>
                    <button
                      onClick={() => setIsSigning(false)}
                      className="text-emerald-700 font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Date signed */}
            <div className="flex flex-col items-center">
              <div className="w-full border-b border-slate-900 h-16 flex items-end justify-center pb-1">
                <input
                  type="text"
                  value={data.signature?.dateSigned || data.details.date}
                  onChange={(e) => onChange({
                    ...data,
                    signature: {
                      ...data.signature,
                      dateSigned: e.target.value,
                    },
                  })}
                  className="w-full text-center font-medium text-slate-900 bg-transparent focus:outline-none"
                />
              </div>
              <span className="mt-1 font-medium text-[11px] sm:text-xs text-slate-800">
                Date signed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
