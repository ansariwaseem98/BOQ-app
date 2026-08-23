import React from 'react';
import { AlertTriangle, Layers, ArrowRight, CheckCircle2, FileText, X } from 'lucide-react';
import { ProjectDocument } from '../types';

export interface RevisionConflictData {
  file: File;
  technicalMeta: any;
  drawingNumber: string;
  newRevision: string;
  existingCurrentDoc?: ProjectDocument;
  seriesId: string;
  docForm: Partial<ProjectDocument>;
}

interface RevisionWarningModalProps {
  conflictData: RevisionConflictData | null;
  isOpen: boolean;
  onMakeCurrent: () => void;
  onKeepAsDraft: () => void;
  onCancel: () => void;
}

export const RevisionWarningModal: React.FC<RevisionWarningModalProps> = ({
  conflictData,
  isOpen,
  onMakeCurrent,
  onKeepAsDraft,
  onCancel,
}) => {
  if (!isOpen || !conflictData) return null;

  const { drawingNumber, newRevision, existingCurrentDoc, file } = conflictData;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-800">
        {/* Warning Header */}
        <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">NEW REVISION DETECTED</h3>
              <p className="text-[11px] text-amber-800">
                A drawing with sheet number <strong className="font-mono">{drawingNumber}</strong> already exists.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            You are uploading a new document for Drawing <strong className="font-mono text-slate-900">{drawingNumber}</strong>.
            Existing drawings will <strong>NOT</strong> be deleted or overwritten. All revisions remain permanently accessible.
          </p>

          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Existing Current Revision */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Existing Drawing</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900">{drawingNumber}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                  {existingCurrentDoc?.revision || 'Current'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-1 font-medium">
                {existingCurrentDoc?.title || 'Existing Sheet'}
              </p>
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                Currently Active
              </span>
            </div>

            {/* New Uploaded Revision */}
            <div className="p-3 rounded-lg border border-indigo-200 bg-indigo-50/50 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-indigo-500 block">New Upload</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-indigo-900">{drawingNumber}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-600 text-white">
                  {newRevision}
                </span>
              </div>
              <p className="text-[11px] text-indigo-900 line-clamp-1 font-medium">{file.name}</p>
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                New Candidate
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">What would you like to do?</p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-500">
              <li><strong>Make Current:</strong> Sets the new upload as the active current revision for estimation.</li>
              <li><strong>Keep as Draft:</strong> Saves the new file without superseding the current revision.</li>
              <li><strong>Cancel:</strong> Aborts uploading this file.</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onKeepAsDraft}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            Keep as Draft
          </button>

          <button
            type="button"
            onClick={onMakeCurrent}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Make Current</span>
          </button>
        </div>
      </div>
    </div>
  );
};
