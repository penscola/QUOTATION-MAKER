import React, { useState, useEffect, useRef } from 'react';
import { QuotationData, DEFAULT_QUOTATION } from './types/quote';
import { QuotationDocument } from './components/QuotationDocument';
import { EditorPanel } from './components/EditorPanel';
import { CompanyFooter } from './components/CompanyFooter';
import { StorageRecoveryModal } from './components/StorageRecoveryModal';
import { downloadQuotationPDF } from './utils/pdfExport';
import { 
  saveQuotationToIndexedDB, 
  loadQuotationFromIndexedDB, 
  createRecoverySnapshot, 
  flushEmergencySync,
  getSavedQuotes,
  saveQuoteToLibrary
} from './utils/indexedDb';
import { 
  Printer, 
  Download, 
  Share2, 
  Check, 
  RotateCcw,
  Loader2,
  FileCheck2,
  AlertCircle,
  Database,
  History,
  WifiOff,
  ShieldCheck,
  FolderHeart,
  BookmarkPlus
} from 'lucide-react';

export default function App() {
  const [quotation, setQuotation] = useState<QuotationData>(() => {
    // Instant synchronous hydration from localStorage for zero layout shift
    try {
      const saved = localStorage.getItem('quotecraft_current_quote');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pricing?.currencySymbol === '₱') {
          parsed.pricing.currencySymbol = 'KSh';
        }
        if (parsed.pricing) {
          if (parsed.pricing.taxEnabled === undefined) parsed.pricing.taxEnabled = true;
          if (parsed.pricing.taxRatePercent === undefined) parsed.pricing.taxRatePercent = 16;
          if (parsed.pricing.discountType === undefined) parsed.pricing.discountType = 'percentage';
          if (parsed.pricing.discountValue === undefined) parsed.pricing.discountValue = 0;
          if (parsed.pricing.othersEnabled === undefined) parsed.pricing.othersEnabled = (parsed.pricing.othersFee || 0) > 0;
          if (!parsed.pricing.othersLabel) parsed.pricing.othersLabel = 'Others';
        }
        if (!parsed.company?.logoUrl || parsed.company.name?.includes('BUHAY') || parsed.company.phone?.includes('700 123 456') || parsed.company.phone?.includes('0123 456')) {
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

  // Storage & Offline state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<Date>(new Date());
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [modalDefaultTab, setModalDefaultTab] = useState<'saved' | 'history'>('saved');
  const [savedQuotesCount, setSavedQuotesCount] = useState<number>(0);
  const [restoredBanner, setRestoredBanner] = useState<string | null>(null);

  // Keep a ref for beforeunload / pagehide events
  const quotationRef = useRef<QuotationData>(quotation);
  quotationRef.current = quotation;

  // Refresh saved quotes count
  const refreshSavedQuotesCount = async () => {
    try {
      const quotes = await getSavedQuotes();
      setSavedQuotesCount(quotes.length);
    } catch (e) {
      // ignore
    }
  };

  // Asynchronous hydration from IndexedDB on startup (loads freshest persistent data)
  useEffect(() => {
    let isMounted = true;
    async function hydrateFromIndexedDB() {
      try {
        const idbData = await loadQuotationFromIndexedDB();
        if (idbData && idbData.quotation && isMounted) {
          const parsed = idbData.quotation;
          if (parsed.pricing?.currencySymbol === '₱') {
            parsed.pricing.currencySymbol = 'KSh';
          }
          if (parsed.pricing) {
            if (parsed.pricing.taxEnabled === undefined) parsed.pricing.taxEnabled = true;
            if (parsed.pricing.taxRatePercent === undefined) parsed.pricing.taxRatePercent = 16;
            if (parsed.pricing.discountType === undefined) parsed.pricing.discountType = 'percentage';
            if (parsed.pricing.discountValue === undefined) parsed.pricing.discountValue = 0;
            if (parsed.pricing.othersEnabled === undefined) parsed.pricing.othersEnabled = (parsed.pricing.othersFee || 0) > 0;
            if (!parsed.pricing.othersLabel) parsed.pricing.othersLabel = 'Others';
          }
          if (!parsed.company?.logoUrl || parsed.company.name?.includes('BUHAY') || parsed.company.phone?.includes('700 123 456') || parsed.company.phone?.includes('0123 456')) {
            parsed.company = DEFAULT_QUOTATION.company;
          }
          setQuotation(parsed);
          setLastSavedTime(new Date(idbData.timestamp));
        }
        await refreshSavedQuotesCount();
      } catch (err) {
        console.warn('Hydration from IndexedDB skipped or failed:', err);
      }
    }

    hydrateFromIndexedDB();
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for online / offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setSaveStatus('saved');
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for beforeunload, pagehide, and visibilitychange to ensure progress is NEVER lost on tab close/crash
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushEmergencySync(quotationRef.current);
    };

    const handlePageHide = () => {
      flushEmergencySync(quotationRef.current);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushEmergencySync(quotationRef.current);
        saveQuotationToIndexedDB(quotationRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Automatic periodic checkpoint snapshot creation (every 4 minutes of active usage)
  useEffect(() => {
    const interval = setInterval(() => {
      if (quotationRef.current) {
        createRecoverySnapshot(quotationRef.current);
      }
    }, 4 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Debounced auto-save to IndexedDB + instant LocalStorage write on state change
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleUpdateQuotation = (updated: QuotationData) => {
    setQuotation(updated);
    setSaveStatus('saving');

    // 1. Instant synchronous write to localStorage for zero delay
    try {
      localStorage.setItem('quotecraft_current_quote', JSON.stringify(updated));
      localStorage.setItem('quotecraft_current_quote_time', Date.now().toString());
    } catch (e) {
      // ignore
    }

    // 2. Debounced asynchronous transactional write to IndexedDB
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await saveQuotationToIndexedDB(updated);
        setLastSavedTime(new Date(res.timestamp));
        setSaveStatus(navigator.onLine ? 'saved' : 'offline');
      } catch (err) {
        console.warn('Auto-save to IndexedDB warning:', err);
        setSaveStatus('saved');
      }
    }, 350);
  };

  // Explicit Save to Library
  const handleQuickSaveToLibrary = async () => {
    try {
      const saved = await saveQuoteToLibrary(quotation);
      await refreshSavedQuotesCount();
      setPdfToast({
        type: 'success',
        message: `Saved Quote #${saved.quoteNumber} for ${saved.clientName} to IndexedDB library!`,
      });
      setTimeout(() => setPdfToast(null), 3500);
    } catch (e: any) {
      setPdfToast({
        type: 'error',
        message: `Failed to save quote: ${e?.message || 'Storage error'}`,
      });
      setTimeout(() => setPdfToast(null), 3500);
    }
  };

  const handleResetToSample = () => {
    createRecoverySnapshot(quotation);
    handleUpdateQuotation(DEFAULT_QUOTATION);
    setRestoredBanner('Reset to default One Step Solution template. Previous draft backed up to recovery snapshots.');
    setTimeout(() => setRestoredBanner(null), 5000);
  };

  const handleRestoreFromSnapshot = (restored: QuotationData) => {
    handleUpdateQuotation(restored);
    setRestoredBanner(`Loaded Quote #${restored.details.quoteNumber || 'Draft'} for ${restored.client.name || 'Client'}`);
    setTimeout(() => setRestoredBanner(null), 4000);
  };

  // High-reliability PDF Download
  const handleDownloadPdf = async () => {
    if (isExportingPdf) return;
    setIsExportingPdf(true);
    
    // Save checkpoint snapshot before PDF generation
    createRecoverySnapshot(quotation);

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

      {/* Restored Banner Notice */}
      {restoredBanner && (
        <div className="bg-sky-900/90 border-b border-sky-600 px-4 py-2 text-xs text-sky-100 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{restoredBanner}</span>
          </div>
          <button 
            onClick={() => setRestoredBanner(null)} 
            className="text-sky-300 hover:text-white font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Application Bar (Hidden during print) */}
      <header className="h-16 px-4 sm:px-6 bg-[#0b1326] border-b border-[#334155] flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-30 print:hidden">
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

        {/* Center / Actions: Saved Quotes Library & Auto-Save Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Primary Saved Quotes Library Button */}
          <button
            onClick={() => {
              setModalDefaultTab('saved');
              setIsRecoveryModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#15223e] hover:bg-[#1d2f56] border border-sky-800/60 hover:border-sky-500 text-sky-200 font-semibold text-xs transition-all cursor-pointer shadow-sm active:scale-95 group"
            title="Browse previous quotations by client name and date, or jump back to old drafts"
          >
            <FolderHeart className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Saved Quotes</span>
            <span className="sm:hidden">Quotes</span>
            {savedQuotesCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-sky-950 text-sky-300 border border-sky-700/60 font-bold">
                {savedQuotesCount}
              </span>
            )}
          </button>

          {/* Robust IndexedDB Auto-save & Recovery Status Pill */}
          <button
            onClick={() => {
              setModalDefaultTab('history');
              setIsRecoveryModalOpen(true);
            }}
            className="hidden md:flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-[#141d33] hover:bg-[#1c2847] border border-[#2a3b5c] transition-colors cursor-pointer group text-left"
            title="All changes are continuously stored in IndexedDB. Click to inspect or restore recovery snapshots."
          >
            <div className="flex items-center gap-1.5">
              {saveStatus === 'saving' ? (
                <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              ) : isOffline ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <div className="relative flex items-center justify-center">
                  <Database className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
                </div>
              )}
              <div className="text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-200">
                    {saveStatus === 'saving' ? 'Saving...' : isOffline ? 'Offline' : 'Auto-Saved'}
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-[#202d4a] text-sky-300">
                    IndexedDB
                  </span>
                </div>
              </div>
            </div>
          </button>

          {/* Quick Currency Switcher in Header */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#171f33] border border-[#334155] text-xs">
            <span className="text-slate-400 text-[11px] font-medium">Currency:</span>
            <select
              value={quotation.pricing?.currencySymbol || 'KSh'}
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
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                showEditorMobile ? 'bg-[#0284c7] text-white font-semibold' : 'text-slate-400'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setShowEditorMobile(false)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                !showEditorMobile ? 'bg-[#0284c7] text-white font-semibold' : 'text-slate-400'
              }`}
            >
              Paper
            </button>
          </div>

          {/* Reset to sample button */}
          <button
            onClick={handleResetToSample}
            title="Reset to default One Step Solution template"
            className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171f33] border border-[#334155] text-xs font-medium text-slate-300 hover:text-white hover:bg-[#222a3d] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171f33] border border-[#334155] text-xs font-medium text-slate-300 hover:text-white hover:bg-[#222a3d] transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          {/* Action 1: Direct Save / Download PDF */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExportingPdf}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg text-white font-semibold text-xs shadow-md shadow-sky-950/40 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
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
            onOpenSavedQuotes={() => {
              setModalDefaultTab('saved');
              setIsRecoveryModalOpen(true);
            }}
            onSaveCurrentQuote={handleQuickSaveToLibrary}
          />
        </div>

        {/* Right Side: High-Fidelity Paper Quotation Document & Company Advertising Footer */}
        <div className={`flex-1 h-[calc(100vh-4rem)] overflow-y-auto p-4 sm:p-8 lg:p-12 bg-[#060e20] print:p-0 print:m-0 print:h-auto print:bg-white print:overflow-visible print:block document-scroll-container ${!showEditorMobile ? 'w-full' : 'hidden lg:block'}`}>
          {/* Document container */}
          <div className="max-w-[800px] mx-auto space-y-6">
            {/* Quick Helper Banner above sheet with Direct PDF & Print Buttons & Storage Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 px-3 py-2 bg-[#0b1326] rounded-xl border border-[#334155]/60 print:hidden">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-200 font-semibold">Live Interactive Sheet</span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-slate-400 hidden sm:inline">Protected by IndexedDB auto-save</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setModalDefaultTab('saved');
                    setIsRecoveryModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#172138] hover:bg-[#1f2d4e] text-sky-300 font-medium text-[11px] border border-sky-800/50 transition-colors cursor-pointer"
                  title="Browse previous quotations organized by client name and date"
                >
                  <FolderHeart className="w-3.5 h-3.5 text-sky-400" />
                  <span>Saved Quotes ({savedQuotesCount})</span>
                </button>
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

      {/* Storage & Recovery Snapshots Modal */}
      <StorageRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => {
          setIsRecoveryModalOpen(false);
          refreshSavedQuotesCount();
        }}
        currentQuotation={quotation}
        onRestore={handleRestoreFromSnapshot}
        defaultTab={modalDefaultTab}
      />
    </div>
  );
}
