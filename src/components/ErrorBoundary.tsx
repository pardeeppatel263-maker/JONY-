import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TaskVibe Caught Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              {this.props.fallbackTitle || 'Something went wrong'}
            </h2>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              TaskVibe encountered an unexpected issue while loading this view. You can reload the app or reset cached data to recover immediately.
            </p>

            {this.state.error && (
              <div className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 mb-6 text-left overflow-auto max-h-28">
                <p className="text-xs font-mono text-red-400 break-words">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/30"
              >
                <RefreshCw className="w-4 h-4" />
                Reload App
              </button>

              <button
                onClick={this.handleResetStorage}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold text-sm flex items-center justify-center gap-2 transition-all border border-slate-700"
                title="Clears local cache in case of corrupted data"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                Reset Data
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
