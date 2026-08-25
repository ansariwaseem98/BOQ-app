import React from 'react';
import { X, History, Check, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { SteelRevisionDiffRecord } from '../types';

interface SteelRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisions: SteelRevisionDiffRecord[];
  onMarkReviewed?: (id: string) => void;
}

export const SteelRevisionModal: React.FC<SteelRevisionModalProps> = ({
  isOpen,
  onClose,
  revisions,
  onMarkReviewed,
}) => {
  if (!isOpen) return null;

  const totalDeltaKg = revisions.reduce((acc, r) => acc + r.deltaKg, 0);
  const totalDeltaTonnes = totalDeltaKg / 1000;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Steel Structure Revision Delta Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Member modifications, section up-sizing & tonnage variance between drawing revisions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delta Summary Banner */}
        <div className="px-6 py-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Net Steel Revision Impact:</span>
            <span
              className={`text-sm font-black font-mono flex items-center gap-1 ${
                totalDeltaKg >= 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {totalDeltaKg >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {totalDeltaKg >= 0 ? `+${totalDeltaKg.toFixed(2)} kg` : `${totalDeltaKg.toFixed(2)} kg`} (
              {totalDeltaTonnes >= 0 ? `+${totalDeltaTonnes.toFixed(3)}` : totalDeltaTonnes.toFixed(3)} Tonnes)
            </span>
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            {revisions.length} modified members tracked
          </span>
        </div>

        {/* Revisions Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Member Mark</th>
                  <th className="px-3 py-2.5">Element Description</th>
                  <th className="px-3 py-2.5">Previous Revision</th>
                  <th className="px-3 py-2.5">New Revision</th>
                  <th className="px-3 py-2.5 text-right">Old Weight (kg)</th>
                  <th className="px-3 py-2.5 text-right">New Weight (kg)</th>
                  <th className="px-3 py-2.5 text-right">Delta (kg)</th>
                  <th className="px-3 py-2.5">Engineering Reason</th>
                  <th className="px-3 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revisions.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                      {rev.memberMark}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{rev.element}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-slate-500 font-mono block text-[11px]">{rev.oldRevision}</span>
                      <span className="text-slate-600 font-semibold">{rev.oldSection}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-indigo-600 font-mono font-bold block text-[11px]">{rev.newRevision}</span>
                      <span className="text-indigo-900 font-bold">{rev.newSection}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                      {rev.oldWeightKg.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-900 font-bold">
                      {rev.newWeightKg.toFixed(2)}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-mono font-bold ${
                        rev.deltaKg >= 0 ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {rev.deltaKg >= 0 ? `+${rev.deltaKg.toFixed(2)}` : rev.deltaKg.toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-[200px] truncate" title={rev.changeSummary}>
                      {rev.changeSummary}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {rev.reviewed ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Reviewed
                        </span>
                      ) : (
                        <button
                          onClick={() => onMarkReviewed && onMarkReviewed(rev.id)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                        >
                          Approve
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
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
};
