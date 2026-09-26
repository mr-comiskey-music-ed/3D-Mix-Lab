import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { ThemeMode } from '../types';

export type ConfirmDeleteState =
  | {
      type: 'instrument';
      bubbleId: string;
      bubbleName: string;
    }
  | {
      type: 'multiple-instruments';
      bubbleIds: string[];
      bubbleNames: string[];
    }
  | {
      type: 'timeline-region';
      bubbleId: string;
      bubbleName: string;
      regionId: string;
      timeRange?: string;
    };

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  state: ConfirmDeleteState | null;
  onConfirm: () => void;
  onCancel: () => void;
  theme?: ThemeMode;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  state,
  onConfirm,
  onCancel,
  theme = 'dark',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen || !state) return null;

  const isLight = theme === 'light';

  let title = 'Delete Instrument';
  let message = '';
  let subMessage = '';

  if (state.type === 'instrument') {
    title = 'Delete Instrument';
    message = `Are you sure you want to delete "${state.bubbleName}"?`;
    subMessage = 'This will remove the instrument, its 3D stage presence, and all associated arrangement regions.';
  } else if (state.type === 'multiple-instruments') {
    title = `Delete ${state.bubbleIds.length} Instruments`;
    message = `Are you sure you want to delete ${state.bubbleIds.length} selected instruments?`;
    subMessage = state.bubbleNames.length > 0
      ? `Tracks to delete: ${state.bubbleNames.join(', ')}`
      : 'This will remove all selected instruments and their arrangement regions.';
  } else if (state.type === 'timeline-region') {
    title = 'Delete Arrangement Region';
    message = `Are you sure you want to delete this arrangement block for "${state.bubbleName}"${
      state.timeRange ? ` (${state.timeRange})` : ''
    }?`;
    subMessage = 'Only this timeline region block will be removed. The instrument itself will remain active in your mix.';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className={`w-full max-w-md rounded-xl border p-5 shadow-2xl transition-all scale-100 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 shrink-0">
            {state.type === 'timeline-region' ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-base tracking-tight">{title}</h3>
              <button
                onClick={onCancel}
                className={`p-1 rounded-md transition ${
                  isLight
                    ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className={`mt-2 text-sm font-medium ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>
              {message}
            </p>

            <p className={`mt-1 text-xs leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {subMessage}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition ${
              isLight
                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 flex items-center gap-1.5 transition active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
