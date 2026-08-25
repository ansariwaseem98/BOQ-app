import React, { useState } from 'react';
import { MEPConflictRecord } from '../types';

interface MepConflictModalProps {
  conflict: MEPConflictRecord;
  onClose: () => void;
  onResolve: (conflictId: string, resolvedSource: 'A' | 'B' | 'CUSTOM', note: string) => void;
}

export const MepConflictModal: React.FC<MepConflictModalProps> = ({
  conflict,
  onClose,
  onResolve,
}) => {
  const [selectedSource, setSelectedSource] = useState<'A' | 'B' | 'CUSTOM'>('A');
  const [resolutionNote, setResolutionNote] = useState(
    'Resolved as per latest MEP Consultant Addendum and RFI response.'
  );

  const handleResolve = () => {
    onResolve(conflict.id, selectedSource, resolutionNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-rose-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-rose-600 text-white text-xs font-mono font-bold rounded-md">
              MEP CONFLICT
            </span>
            <div>
              <h3 className="text-base font-bold font-mono">
                {conflict.elementTag} ({conflict.discipline})
              </h3>
              <p className="text-xs text-rose-200">
                Discrepancy detected across project engineering documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-rose-300 hover:text-white p-1 rounded-lg hover:bg-rose-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-900 text-xs">
            <p className="font-bold uppercase tracking-wider mb-1 font-mono">Conflict Classification</p>
            <p>{conflict.conflictType.replace(/_/g, ' ')}</p>
          </div>

          {/* Side by side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source A */}
            <div
              onClick={() => setSelectedSource('A')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedSource === 'A'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-indigo-700">
                  SOURCE A: {conflict.sourceA.documentName}
                </span>
                <input
                  type="radio"
                  checked={selectedSource === 'A'}
                  onChange={() => setSelectedSource('A')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-500 mb-2 font-mono">
                Drawing: {conflict.sourceA.drawingNumber} ({conflict.sourceA.revision})
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-sm font-bold text-slate-900">
                {conflict.sourceA.value}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Location: {conflict.sourceA.location}</p>
            </div>

            {/* Source B */}
            <div
              onClick={() => setSelectedSource('B')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedSource === 'B'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-indigo-700">
                  SOURCE B: {conflict.sourceB.documentName}
                </span>
                <input
                  type="radio"
                  checked={selectedSource === 'B'}
                  onChange={() => setSelectedSource('B')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <p className="text-xs text-slate-500 mb-2 font-mono">
                Drawing: {conflict.sourceB.drawingNumber} ({conflict.sourceB.revision})
              </p>
              <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-sm font-bold text-slate-900">
                {conflict.sourceB.value}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Location: {conflict.sourceB.location}</p>
            </div>
          </div>

          {/* Resolution note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Adjudication Decision & Justification Note
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={e => setResolutionNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleResolve}
            className="px-5 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 shadow-xs transition-colors"
          >
            Confirm Resolution (Adopt Source {selectedSource})
          </button>
        </div>
      </div>
    </div>
  );
};
