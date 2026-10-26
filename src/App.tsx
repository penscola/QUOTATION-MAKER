import React, { useState } from 'react';
import { QuotationData, DEFAULT_QUOTATION } from './types/quote';
import { QuotationDocument } from './components/QuotationDocument';
import { EditorPanel } from './components/EditorPanel';
import { CompanyFooter } from './components/CompanyFooter';
import { downloadQuotationPDF } from './utils/pdfExport';
import { 
  Printer, 
  Download, 
  Share2, 
  Check, 
  RotateCcw,
  Loader2,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [quotation, setQuotation] = useState<QuotationData>(() => {
    // Try restoring from localStorage if available
    try {
      const saved = localStorage.getItem('quotecraft_current_quote');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pricing?.currencySymbol === '₱') {
          parsed.pricing.currencySymbol = 'KSh';
        }
        // If company is still default, Buhay, or has old placeholder phone
        if (!parsed.company?.logoUrl || parsed.company.name.includes('BUHAY') || parsed.company.phone?.includes('700 123 456') || parsed.company.phone?.includes('0123 456')) {
          parsed.company = DEFAULT_QUOTATION.company;
        }
        return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_QUOTATION;
  });

  const [showEditorMobile, setShowEditorMobile] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfToast, setPdfToast] = useState<{ type: 'loading' | 'success' | 'error'; message: string } | null>(null);

  // Sync to localStorage
  const handleUpdateQuotation = (updated: QuotationData) => {
    setQuotation(updated);
    try {
      localStorage.setItem('quotecraft_current_quote', JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const handleResetToSample = () => {
    handleUpdateQuotation(DEFAULT_QUOTATION);
  };

  // High-reliability PDF Download
  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    
    // Clean quote number for safe filename
    const quoteNum = (quotation.details.quoteNumber || '1234')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeClient = (quotation.client.name || 'Client')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Quotation_${quoteNum}_${safeClient}_OneStepSolution.pdf`;

    setPdfToast({ type: 'loading', message: 'Generating high-resolution PDF...' });

    try {
      await downloadQuotationPDF(quotation, {
        filename,
        onProgress: (msg) => {
          setPdfToast({ type: 'loading', message: msg });
        },
      });

      setPdfToast({ 
        type: 'success', 
        message: `Saved ${filename}!` 
      });

      setTimeout(() => {
        setPdfToast(null);
      }, 3500);
    } catch (err: any) {
      console.error('PDF export failed:', err);
      setPdfToast({ 
        type: 'error', 
        message: `Export failed: ${err?.message || 'Please try again'}` 
      });
      setTimeout(() => setPdfToast(null), 4000);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Print handler with graceful iframe sandbox fallback
  const handlePrint = () => {
    setPdfToast({ type: 'loading', message: 'Opening print dialog...' });
    
    try {
      window.print();
      setPdfToast({ type: 'success', message: 'Print dialog initiated' });
      setTimeout(() => setPdfToast(null), 2500);
    } catch (err) {
      console.warn('Standard window.print() was blocked by sandbox, downloading PDF instead:', err);
      setPdfToast({
        type: 'loading',
        message: 'Print blocked by iframe security. Generating direct PDF file instead...',
      });
      handleDownloadPdf();
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#060e20] text-slate-100 flex flex-col font-sans select-none antialiased print:bg-white print:text-black print:min-h-auto print:h-auto print:overflow-visible">
      {/* Toast Feedback Notification */}
      {pdfToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 print:hidden animate-in fade-in slide-in-from-top duration-200">
          <div 
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-2xl border text-xs sm:text-sm font-medium backdrop-blur-md ${
              pdfToast.type === 'loading'
                ? 'bg-[#0f172a]/95 border-sky-500 text-sky-200 shadow-sky-950/50'
                : pdfToast.type === 'success'
                ? 'bg-[#064e3b]/95 border-emerald-500 text-emerald-100 shadow-emerald-950/50'
                : 'bg-[#7f1d1d]/95 border-rose-500 text-rose-100 shadow-rose-950/50'
            }`}
          >
            {pdfToast.type === 'loading' && (
              <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
            )}
            {pdfToast.type === 'success' && (
              <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            {pdfToast.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{pdfToast.message}</span>
          </div>
        </div>
      )}

      {/* Top Application Bar (Hidden during print) */}
      <header className="h-16 px-4 sm:px-6 bg-[#0b1326] border-b border-[#334155] flex items-center justify-between gap-4 shrink-0 z-30 print:hidden">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md flex items-center justify-center shrink-0 border border-slate-700">
            <img
              src="/assets/aistudio/image_6276447f.png"
              alt="One Step Solution Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                One Step Solution
              </span>
              <span 
                className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border tracking-wider"
                style={{ 
                  color: '#38bdf8', 
                  borderColor: '#0284c7',
                  backgroundColor: 'rgba(2, 132, 199, 0.15)'
                }}
              >
                Kenya · KSh
              </span>
            </div>
            <span className="text-[11px] text-sky-200/80 block -mt-0.5 font-medium tracking-wide">
              ONE STEP. ENDLESS SOLUTIONS.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Quick Currency Switcher in Header */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#334155] text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Currency:</span>
            <select
              value={quotation.pricing.currencySymbol}
              onChange={(e) => handleUpdateQuotation({
                ...quotation,
                pricing: { ...quotation.pricing, currencySymbol: e.target.value }
              })}
              className="bg-transparent font-bold text-sky-400 focus:outline-none cursor-pointer"
            >
              <option value="KSh" className="bg-[#0b1326] text-white">KSh (Kenya)</option>
              <option value="TSH" className="bg-[#0b1326] text-white">TSH (Tanzania)</option>
              <option value="UGX" className="bg-[#0b1326] text-white">UGX (Uganda)</option>
              <option value="$" className="bg-[#0b1326] text-white">$ (USD)</option>
              <option value="€" className="bg-[#0b1326] text-white">€ (EUR)</option>
              <option value="£" className="bg-[#0b1326] text-white">£ (GBP)</option>
              <option value="₱" className="bg-[#0b1326] text-white">₱ (PHP)</option>
            </select>
          </div>

          {/* Mobile view toggle */}
          <div className="flex lg:hidden items-center bg-[#1e293b] rounded-lg p-0.5 border border-[#334155]">
            <button
              onClick={() => setShowEditorMobile(true)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                showEditorMobile ? 'bg-[#0284c7] text-white font-semibold' : 'text-slate-400'
              }`}
            >
              Write / Edit
            </button>
            <button
              onClick={() => setShowEditorMobile(false)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                !showEditorMobile ? 'bg-[#0284c7] text-white font-semibold' : 'text-slate-400'
              }`}
            >
              Preview
            </button>
          </div>

          {/* Reset to sample button */}
          <button
            onClick={handleResetToSample}
            title="Reset to default One Step Solution template"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171f33] border border-[#334155] text-xs font-medium text-slate-300 hover:text-white hover:bg-[#222a3d] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Sample</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171f33] border border-[#334155] text-xs font-medium text-slate-300 hover:text-white hover:bg-[#222a3d] transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
          </button>

          {/* Action 1: Direct Save / Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-white font-semibold text-xs shadow-md shadow-sky-950/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            style={{ backgroundColor: quotation.themeColor || '#0284c7' }}
            title="Download crisp PDF file directly to your device"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{isExportingPdf ? 'Exporting...' : 'Save PDF'}</span>
          </button>

          {/* Action 2: Print */}
          <button
            onClick={handlePrint}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#171f33] hover:bg-[#222a3d] border border-[#334155] text-white font-semibold text-xs transition-all cursor-pointer active:scale-95"
            title="Open browser print preview dialog"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            <span>Print</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative print:overflow-visible print:block print:h-auto app-workspace-container">
        {/* Left Side: Editor & Natural Language Writer (Hidden on print) */}
        <div className={`h-[calc(100vh-4rem)] flex shrink-0 print:hidden ${showEditorMobile ? 'w-full lg:w-auto' : 'hidden lg:flex'}`}>
          <EditorPanel
            data={quotation}
            onChange={handleUpdateQuotation}
            onResetToSample={handleResetToSample}
          />
        </div>

        {/* Right Side: High-Fidelity Paper Quotation Document & Company Advertising Footer */}
        <div className={`flex-1 h-[calc(100vh-4rem)] overflow-y-auto p-4 sm:p-8 lg:p-12 bg-[#060e20] print:p-0 print:m-0 print:h-auto print:bg-white print:overflow-visible print:block document-scroll-container ${!showEditorMobile ? 'w-full' : 'hidden lg:block'}`}>
          {/* Document container */}
          <div className="max-w-[800px] mx-auto space-y-6">
            {/* Quick Helper Banner above sheet with Direct PDF & Print Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-1 print:hidden bg-[#0b1326] p-2.5 rounded-xl border border-[#334155]/60">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-200 font-semibold">Live Interactive Sheet</span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-slate-400 hidden sm:inline">Click any text on paper to edit directly</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1e293b] hover:bg-[#334155] text-slate-200 border border-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  <Printer className="w-3 h-3 text-sky-400" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* The Document Sheet */}
            <QuotationDocument
              data={quotation}
              onChange={handleUpdateQuotation}
              interactive={true}
            />

            {/* Company Advertising Footer */}
            <CompanyFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
