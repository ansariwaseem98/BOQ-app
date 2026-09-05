import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  message?: string;
  onStay: () => void;
  onDiscardAndLeave: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  message = 'You have unsaved changes that will be lost if you leave this page.',
  onStay,
  onDiscardAndLeave,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      id="unsaved-changes-modal"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white border border-amber-300 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1 flex-1">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Unsaved Changes Warning
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] font-medium text-amber-900">
            Click <strong>[ STAY ]</strong> to keep editing, or <strong>[ DISCARD & LEAVE ]</strong> to abandon your changes and navigate away.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="unsaved-changes-stay-btn"
              type="button"
              onClick={onStay}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              [ STAY ]
            </button>

            <button
              id="unsaved-changes-discard-btn"
              type="button"
              onClick={onDiscardAndLeave}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black tracking-wide shadow-md transition-all cursor-pointer"
            >
              [ DISCARD & LEAVE ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
