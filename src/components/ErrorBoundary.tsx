import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  declare state: ErrorBoundaryState;
  declare props: { children: React.ReactNode };

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let displayMessage = error?.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(displayMessage);
      if (parsed && parsed.error) {
        displayMessage = `Workspace sync error (${parsed.operationType || 'operation'}): ${parsed.error}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, errorMessage: displayMessage };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RangeCraft ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5 text-center">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-[#0F172A]">
                Something interrupted your session
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                {this.state.errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload RangeCraft</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
