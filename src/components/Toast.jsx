import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
              isSuccess
                ? 'bg-zinc-900/95 border-emerald-500/40 text-zinc-100 shadow-emerald-500/10'
                : isError
                ? 'bg-zinc-900/95 border-rose-500/40 text-zinc-100 shadow-rose-500/10'
                : 'bg-zinc-900/95 border-indigo-500/40 text-zinc-100 shadow-indigo-500/10'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {isError && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {isInfo && <Info className="w-4 h-4 text-indigo-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold tracking-wide text-zinc-200">
                {toast.title}
              </p>
              {toast.message && (
                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                  {toast.message}
                </p>
              )}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
