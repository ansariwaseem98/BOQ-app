import React from 'react';
import { MEPRevisionDiffRecord } from '../types';

interface MepRevisionModalProps {
  revisions: MEPRevisionDiffRecord[];
  onClose: () => void;
  onMarkReviewed?: (revisionId: string) => void;
}

export const MepRevisionModal: React.FC<MepRevisionModalProps> = ({
  revisions,
  onClose,
  onMarkReviewed,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-amber-500 text-slate-950 text-xs font-mono font-bold rounded-md uppercase">
              Revision Tracker
            </span>
            <div>
              <h3 className="text-base font-bold font-mono">
                MEP Revision Diff Matrix (Rev 00 vs Rev 01)
              </h3>
              <p className="text-xs text-slate-300">
                Track added, deleted, rerouted, and resized MEP elements across drawing issues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-mono text-[11px] uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Discipline</th>
                  <th className="py-2.5 px-3">Element Tag</th>
                  <th className="py-2.5 px-3">Change Type</th>
                  <th className="py-2.5 px-3">Rev 00 Spec / Qty</th>
                  <th className="py-2.5 px-3">Rev 01 Spec / Qty</th>
                  <th className="py-2.5 px-3 text-right">Delta</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {revisions.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-slate-600">
                      {rev.discipline}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {rev.elementTag}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[10px] font-mono font-semibold">
                        {rev.changeType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      <div>{rev.oldSpecification}</div>
                      <div className="text-[11px] text-slate-400">{rev.oldQuantity} {rev.unit}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-900 font-bold">
                      <div>{rev.newSpecification}</div>
                      <div className="text-[11px] text-emerald-600">{rev.newQuantity} {rev.unit}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={rev.deltaQuantity > 0 ? 'text-emerald-600' : rev.deltaQuantity < 0 ? 'text-rose-600' : 'text-slate-600'}>
                        {rev.deltaQuantity > 0 ? `+${rev.deltaQuantity}` : rev.deltaQuantity} {rev.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {onMarkReviewed && (
                        <button
                          onClick={() => onMarkReviewed(rev.id)}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-[10px] font-mono font-bold rounded transition-colors"
                        >
                          Reviewed
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {revisions.length} revision changes detected between tender issues
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
