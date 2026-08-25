import React, { useState } from 'react';
import { MEPOpenItemRecord } from '../types';

interface MepOpenItemModalProps {
  openItem: MEPOpenItemRecord;
  onClose: () => void;
  onResolve: (openItemId: string, resolutionNote: string) => void;
}

export const MepOpenItemModal: React.FC<MepOpenItemModalProps> = ({
  openItem,
  onClose,
  onResolve,
}) => {
  const [resolutionNote, setResolutionNote] = useState(
    'RFI #MEP-04 responded by MEP Consultant: Confirmed DN110 (4") pipe size.'
  );

  const handleResolve = () => {
    onResolve(openItem.id, resolutionNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-amber-950 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-mono font-bold rounded-md">
              OPEN ITEM
            </span>
            <div>
              <h3 className="text-base font-bold font-mono">
                {openItem.elementTag} ({openItem.discipline})
              </h3>
              <p className="text-xs text-amber-200">
                Unresolved parameter / RFI requirement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-300 hover:text-white p-1 rounded-lg hover:bg-amber-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800">
                Issue Classification
              </span>
              <span className="px-2 py-0.5 bg-amber-200/80 text-amber-950 text-[10px] font-bold rounded font-mono">
                {openItem.status}
              </span>
            </div>
            <p className="text-sm font-semibold">{openItem.issueType.replace(/_/g, ' ')}</p>
            <p className="text-xs text-amber-800">{openItem.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">Drawing Reference:</span>
              <span className="font-mono font-bold text-slate-900">{openItem.drawingReference} ({openItem.revision})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Source Location:</span>
              <span className="text-slate-900 font-medium">{openItem.sourceLocation}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-1">Recommended Engineering Action:</span>
            <p className="text-xs text-slate-600 font-sans">{openItem.suggestedAction}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Resolution Note / RFI Reference
            </label>
            <textarea
              rows={3}
              value={resolutionNote}
              onChange={e => setResolutionNote(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500"
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
            className="px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 shadow-xs transition-colors"
          >
            Mark as Resolved
          </button>
        </div>
      </div>
    </div>
  );
};
