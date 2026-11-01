import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, RefreshCw, ShieldAlert } from 'lucide-react';
import { DEFAULT_QUOTATION } from '../types/quote';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleHardReset = () => {
    try {
      localStorage.removeItem('quotecraft_current_quote');
      localStorage.removeItem('quotecraft_current_quote_time');
      localStorage.removeItem('quotecraft_emergency_backup');
      // Save pristine default to prevent re-triggering
      localStorage.setItem('quotecraft_current_quote', JSON.stringify(DEFAULT_QUOTATION));
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#060e20] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
          <div className="w-full max-w-lg bg-[#0b1326] border border-rose-800/60 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            {/* Header Icon */}
            <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-700/80 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Quotation Recovery Screen
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                QuoteCraft encountered an unexpected rendering issue. Your work snapshots remain preserved in IndexedDB.
              </p>
            </div>

            {/* Error snippet if available */}
            {this.state.error && (
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-left overflow-x-auto text-[11px] font-mono text-rose-300 max-h-32">
                <p className="font-semibold text-rose-400 mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-slate-200 hover:text-white font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-sky-400" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleHardReset}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs shadow-md shadow-sky-950/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Default Template</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              One Step Solution · Technical Support: +254 111 537 414
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
