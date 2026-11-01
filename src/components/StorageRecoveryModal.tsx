import React, { useEffect, useState, useMemo } from 'react';
import { 
  FolderHeart, 
  RotateCcw, 
  Trash2, 
  X, 
  Database, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search, 
  Plus, 
  Copy, 
  Building, 
  Calendar, 
  History, 
  User, 
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { QuotationData } from '../types/quote';
import { 
  getSavedQuotes, 
  saveQuoteToLibrary, 
  deleteSavedQuote, 
  SavedQuoteRecord,
  getRecoverySnapshots,
  deleteRecoverySnapshot,
  QuotationSnapshot,
  createRecoverySnapshot
} from '../utils/indexedDb';

interface StorageRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentQuotation: QuotationData;
  onRestore: (quotation: QuotationData) => void;
  defaultTab?: 'saved' | 'history';
}

export const StorageRecoveryModal: React.FC<StorageRecoveryModalProps> = ({
  isOpen,
  onClose,
  currentQuotation,
  onRestore,
  defaultTab = 'saved',
}) => {
  const [activeTab, setActiveTab] = useState<'saved' | 'history'>(defaultTab);

  // Saved Quotes State
  const [savedQuotes, setSavedQuotes] = useState<SavedQuoteRecord[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'client-asc' | 'amount-desc'>('date-desc');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);

  // Auto-Save Snapshots State
  const [snapshots, setSnapshots] = useState<QuotationSnapshot[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [restoredId, setRestoredId] = useState<string | number | null>(null);

  const loadAllData = async () => {
    setLoadingQuotes(true);
    setLoadingSnapshots(true);
    try {
      const [quotesList, snapshotList] = await Promise.all([
        getSavedQuotes(),
        getRecoverySnapshots(),
      ]);
      setSavedQuotes(quotesList);
      setSnapshots(snapshotList);
    } catch (e) {
      console.warn('Error loading indexedDB quotes:', e);
    } finally {
      setLoadingQuotes(false);
      setLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      setActionNotice(null);
      setRestoredId(null);
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Extract unique client names for quick filtering
  const uniqueClients = useMemo(() => {
    const names = new Set<string>();
    savedQuotes.forEach((q) => {
      if (q.clientName && q.clientName.trim()) {
        names.add(q.clientName.trim());
      }
    });
    return Array.from(names);
  }, [savedQuotes]);

  // Filter and sort saved quotes
  const filteredQuotes = useMemo(() => {
    let result = [...savedQuotes];

    // Search query filter (client, quote#, company, description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => 
        (item.clientName && item.clientName.toLowerCase().includes(q)) ||
        (item.quoteNumber && item.quoteNumber.toLowerCase().includes(q)) ||
        (item.clientCompany && item.clientCompany.toLowerCase().includes(q)) ||
        (item.projectDescription && item.projectDescription.toLowerCase().includes(q))
      );
    }

    // Client pill filter
    if (selectedClientFilter !== 'ALL') {
      result = result.filter((item) => item.clientName.trim() === selectedClientFilter);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return (new Date(b.documentDate || b.updatedAt).getTime()) - (new Date(a.documentDate || a.updatedAt).getTime());
      }
      if (sortBy === 'date-asc') {
        return (new Date(a.documentDate || a.updatedAt).getTime()) - (new Date(b.documentDate || b.updatedAt).getTime());
      }
      if (sortBy === 'client-asc') {
        return a.clientName.localeCompare(b.clientName);
      }
      if (sortBy === 'amount-desc') {
        return b.totalAmount - a.totalAmount;
      }
      return 0;
    });

    return result;
  }, [savedQuotes, searchQuery, selectedClientFilter, sortBy]);

  if (!isOpen) return null;

  // Handle Save Current Quotation into Library
  const handleSaveCurrentToLibrary = async () => {
    setIsSavingCurrent(true);
    try {
      const saved = await saveQuoteToLibrary(currentQuotation);
      setSavedQuotes((prev) => [saved, ...prev.filter(q => q.id !== saved.id)]);
      setActionNotice(`Saved current draft (Quote #${saved.quoteNumber} for ${saved.clientName}) to library!`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (e) {
      console.error('Failed to save to library:', e);
    } finally {
      setIsSavingCurrent(false);
    }
  };

  // Jump back / Load quotation draft
  const handleLoadDraft = (quote: SavedQuoteRecord) => {
    setRestoredId(quote.id);
    onRestore(quote.data);
    setActionNotice(`Loaded draft for ${quote.clientName} (#${quote.quoteNumber})`);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  // Duplicate quote
  const handleDuplicate = async (quote: SavedQuoteRecord) => {
    const cloneData: QuotationData = JSON.parse(JSON.stringify(quote.data));
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    cloneData.details.quoteNumber = `${quote.quoteNumber}-COPY`;
    cloneData.details.date = new Date().toISOString().split('T')[0];

    try {
      const duplicated = await saveQuoteToLibrary(cloneData);
      setSavedQuotes((prev) => [duplicated, ...prev]);
      setActionNotice(`Created duplicate copy as Quote #${duplicated.quoteNumber}`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (e) {
      console.warn('Duplicate failed:', e);
    }
  };

  // Delete quote from library
  const handleDeleteQuote = async (id: string, clientName: string) => {
    if (!window.confirm(`Delete saved quote for "${clientName}" from your browser library?`)) {
      return;
    }
    await deleteSavedQuote(id);
    setSavedQuotes((prev) => prev.filter((q) => q.id !== id));
    setActionNotice(`Deleted quote for ${clientName}`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  // Restore snapshot from history
  const handleRestoreSnapshot = (snapshot: QuotationSnapshot) => {
    if (snapshot.id) setRestoredId(snapshot.id);
    onRestore(snapshot.data);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  const handleDeleteSnapshot = async (id?: number) => {
    if (!id) return;
    await deleteRecoverySnapshot(id);
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCreateSnapshotNow = async () => {
    await createRecoverySnapshot(currentQuotation);
    const updated = await getRecoverySnapshots();
    setSnapshots(updated);
    setActionNotice('New recovery snapshot recorded to IndexedDB.');
    setTimeout(() => setActionNotice(null), 2500);
  };

  const formatCurrency = (amount: number, symbol: string) => {
    return `${symbol} ${Number(amount || 0).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDateDisplay = (dateString?: string, ts?: number) => {
    if (dateString) {
      const d = new Date(dateString);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-KE', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return dateString;
    }
    if (ts) {
      return new Date(ts).toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return 'Recent';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-[#0b1326] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#111c38] border-b border-[#334155] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 shrink-0">
              <FolderHeart className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>IndexedDB Quotation Management</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Local & Offline
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Browse previous quotations organized by client name and date, or jump back to old drafts instantly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Notice Toast */}
        {actionNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/50 px-5 py-2 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{actionNotice}</span>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="px-5 sm:px-6 bg-[#0e172e] border-b border-[#223150] flex flex-wrap items-center justify-between gap-3 shrink-0 py-2.5">
          <div className="flex items-center gap-1.5 bg-[#070d1d] p-1 rounded-xl border border-[#1e2a44]">
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'saved'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderHeart className="w-3.5 h-3.5" />
              <span>Saved Quotes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'saved' ? 'bg-sky-700 text-white' : 'bg-[#1b263b] text-slate-300'
              }`}>
                {savedQuotes.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Auto-Save Snapshots</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'history' ? 'bg-sky-700 text-white' : 'bg-[#1b263b] text-slate-300'
              }`}>
                {snapshots.length}
              </span>
            </button>
          </div>

          {/* Quick Action: Save current quotation as a new record */}
          <button
            onClick={handleSaveCurrentToLibrary}
            disabled={isSavingCurrent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs transition-all shadow-md shadow-sky-950/40 active:scale-95 cursor-pointer disabled:opacity-60"
            title="Save current editor quotation to your permanent Saved Quotes library"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Current Quote to Library</span>
          </button>
        </div>

        {/* Tab 1: SAVED QUOTES (Organized by Client & Date) */}
        {activeTab === 'saved' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Search & Sort Controls Toolbar */}
            <div className="p-4 sm:p-5 bg-[#0a1224] border-b border-[#1b2742] space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by client name, quote number, or company..."
                    className="w-full bg-[#121c35] border border-[#263756] focus:border-sky-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slate-400 font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-[#121c35] border border-[#263756] text-xs text-slate-200 rounded-xl px-2.5 py-2 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="date-desc">Date (Newest first)</option>
                    <option value="date-asc">Date (Oldest first)</option>
                    <option value="client-asc">Client Name (A - Z)</option>
                    <option value="amount-desc">Total Amount (High - Low)</option>
                  </select>
                </div>
              </div>

              {/* Client Quick-Filter Chips */}
              {uniqueClients.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-[11px]">
                  <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-sky-400" />
                    Clients:
                  </span>
                  <button
                    onClick={() => setSelectedClientFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer ${
                      selectedClientFilter === 'ALL'
                        ? 'bg-sky-500 text-white font-semibold'
                        : 'bg-[#15203a] text-slate-400 hover:text-white'
                    }`}
                  >
                    All Clients ({savedQuotes.length})
                  </button>
                  {uniqueClients.map((client) => {
                    const count = savedQuotes.filter((q) => q.clientName.trim() === client).length;
                    const isSelected = selectedClientFilter === client;
                    return (
                      <button
                        key={client}
                        onClick={() => setSelectedClientFilter(client)}
                        className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-sky-500 text-white font-semibold'
                            : 'bg-[#15203a] text-slate-300 hover:text-white'
                        }`}
                      >
                        <User className="w-2.5 h-2.5 text-sky-300" />
                        <span>{client}</span>
                        <span className="opacity-70 text-[10px]">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quotes List / Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#070e1e]">
              {loadingQuotes ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs">Querying IndexedDB Saved Quotes store...</p>
                </div>
              ) : filteredQuotes.length === 0 ? (
                <div className="py-16 text-center bg-[#0a1224] border border-dashed border-[#223150] rounded-2xl p-8">
                  <FolderHeart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-200">No matching saved quotes found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    {searchQuery || selectedClientFilter !== 'ALL'
                      ? 'No quotes match your current filter criteria. Try resetting filters or search query.'
                      : 'Save your current work as a named draft to build your quotation library.'}
                  </p>
                  {(searchQuery || selectedClientFilter !== 'ALL') ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedClientFilter('ALL');
                      }}
                      className="mt-4 px-3.5 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-xs font-semibold text-sky-300 transition-colors cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveCurrentToLibrary}
                      className="mt-4 px-3.5 py-1.5 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      Save Current Quote to Library
                    </button>
                  )}
                </div>
              ) : (
                filteredQuotes.map((quote) => {
                  const isCurrentRestored = restoredId === quote.id;
                  return (
                    <div
                      key={quote.id}
                      className={`p-4 rounded-xl border transition-all duration-150 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCurrentRestored
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50'
                          : 'bg-[#0e172e] border-[#1f2d4d] hover:border-sky-500/60 hover:bg-[#121c38]'
                      }`}
                    >
                      {/* Left: Client Name, Company, Date, Quote Number */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {/* Client Name & Quote Number */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm sm:text-base text-white flex items-center gap-1.5 tracking-tight">
                            <User className="w-4 h-4 text-sky-400 shrink-0" />
                            {quote.clientName || 'Unnamed Client'}
                          </span>
                          
                          {quote.clientCompany && (
                            <span className="text-xs text-slate-400 flex items-center gap-1 bg-[#162340] px-2 py-0.5 rounded-md border border-[#27385e]">
                              <Building className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{quote.clientCompany}</span>
                            </span>
                          )}

                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/40 font-semibold">
                            Quote #{quote.quoteNumber}
                          </span>
                        </div>

                        {/* Date & Details */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            {formatDateDisplay(quote.documentDate, quote.createdAt)}
                          </span>

                          <span className="text-slate-600">•</span>

                          <span className="text-slate-400">
                            {quote.itemCount} line items
                          </span>

                          <span className="text-slate-600">•</span>

                          <span className="font-bold text-emerald-400">
                            {formatCurrency(quote.totalAmount, quote.currency)}
                          </span>
                        </div>

                        {/* Project Description Snippet */}
                        {quote.projectDescription && (
                          <p className="text-xs text-slate-400 line-clamp-1 italic">
                            "{quote.projectDescription}"
                          </p>
                        )}
                      </div>

                      {/* Right: Actions (Jump Back, Duplicate, Delete) */}
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        {/* Duplicate Button */}
                        <button
                          onClick={() => handleDuplicate(quote)}
                          title="Create a duplicate copy of this quote"
                          className="px-2.5 py-1.5 rounded-lg bg-[#16223d] hover:bg-[#203054] text-slate-300 hover:text-white border border-[#273960] text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-sky-400" />
                          <span className="hidden sm:inline">Duplicate</span>
                        </button>

                        {/* Primary: Jump Back / Load Draft */}
                        <button
                          onClick={() => handleLoadDraft(quote)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                            isCurrentRestored
                              ? 'bg-emerald-600 text-white shadow-emerald-950/60'
                              : 'bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sky-950/60 active:scale-95'
                          }`}
                          title="Load this quotation draft into the live editor and document view"
                        >
                          {isCurrentRestored ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Draft Loaded!</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Jump Back to Draft</span>
                            </>
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteQuote(quote.id, quote.clientName)}
                          title="Delete from saved library"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: AUTO-SAVE HISTORY & CRASH RECOVERY */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Info bar */}
            <div className="px-5 py-3 bg-[#0d172e] border-b border-[#1e293b] flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  Automatic background snapshots captured while you write. Useful for crash recovery or undoing mistakes.
                </span>
              </div>
              <button
                onClick={handleCreateSnapshotNow}
                className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Snapshot Current State</span>
              </button>
            </div>

            {/* Snapshot List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#070e1e]">
              {loadingSnapshots ? (
                <div className="py-16 text-center text-slate-400">
                  <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs">Loading recovery snapshots from IndexedDB...</p>
                </div>
              ) : snapshots.length === 0 ? (
                <div className="py-16 text-center bg-[#0a1224] border border-dashed border-[#223150] rounded-2xl p-8">
                  <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-300">No snapshot history yet</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    As you edit line items, discounts, or company details, automatic recovery checkpoints are saved here.
                  </p>
                  <button
                    onClick={handleCreateSnapshotNow}
                    className="mt-4 px-3.5 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-xs font-semibold text-slate-200 transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Create Checkpoint Now</span>
                  </button>
                </div>
              ) : (
                snapshots.map((snap) => {
                  const isJustRestored = restoredId === snap.id;
                  return (
                    <div
                      key={snap.id || snap.timestamp}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isJustRestored 
                          ? 'bg-emerald-950/40 border-emerald-500/60' 
                          : 'bg-[#0e172e] border-[#1f2d4d] hover:border-sky-500/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                            Quote #{snap.quoteNumber || 'Draft'}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-xs text-slate-300 font-medium">
                            {snap.clientName || 'General Client'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(snap.timestamp).toLocaleTimeString('en-KE', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })} ({new Date(snap.timestamp).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })})
                          </span>
                          <span>•</span>
                          <span>{snap.itemCount} items</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-400">
                            {formatCurrency(snap.totalAmount, snap.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleRestoreSnapshot(snap)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isJustRestored
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#1e293b] hover:bg-sky-600 text-slate-200 hover:text-white border border-slate-700 hover:border-sky-500'
                          }`}
                        >
                          {isJustRestored ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Restored!</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Jump Back to This Checkpoint</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteSnapshot(snap.id)}
                          title="Delete this snapshot"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-[#081024] border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="font-medium text-slate-300">IndexedDB Storage Active</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">All drafts persist across browser restarts and offline</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-slate-200 font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
