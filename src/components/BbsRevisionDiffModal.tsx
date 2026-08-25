import React from 'react';
import {
  X,
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  History
} from 'lucide-react';
import { BbsRevisionDelta } from '../types';

interface BbsRevisionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisions: BbsRevisionDelta[];
  onMarkReviewed: (id: string) => void;
}

export const BbsRevisionDiffModal: React.FC<BbsRevisionDiffModalProps> = ({
  isOpen,
  onClose,
  revisions,
  onMarkReviewed,
}) => {
  if (!isOpen) return null;

  const totalDeltaKg = revisions.reduce((acc, r) => acc + r.deltaKg, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  BBS Drawing Revision Comparison (Delta Ledger)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300">
                  Rev 00 → Rev 01 Delta
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quantified delta weight tracking and engineering justification notes for every revision.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delta Summary Card */}
        <div className="px-6 py-3 bg-purple-50/50 border-b border-purple-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-purple-950">Net Steel Revision Impact:</span>
            <span className="font-mono font-bold text-sm text-purple-900">
              {totalDeltaKg >= 0 ? `+${totalDeltaKg.toFixed(2)}` : totalDeltaKg.toFixed(2)} kg
            </span>
          </div>
          <span className="text-purple-700 font-mono text-[11px]">
            {revisions.filter((r) => r.reviewed).length} of {revisions.length} revision changes acknowledged
          </span>
        </div>

        {/* Revision Items */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {revisions.map((rev) => (
            <div
              key={rev.id}
              className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs hover:border-slate-300 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {rev.barMark}
                  </span>
                  <span className="font-bold text-slate-900 text-xs">{rev.element}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      rev.deltaKg >= 0
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {rev.deltaKg >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span>{rev.deltaKg >= 0 ? `+${rev.deltaKg.toFixed(2)}` : rev.deltaKg.toFixed(2)} kg</span>
                  </span>

                  {!rev.reviewed ? (
                    <button
                      onClick={() => onMarkReviewed(rev.id)}
                      className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] border border-indigo-200 transition-colors cursor-pointer"
                    >
                      Acknowledge Delta
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Reviewed</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Side by side notation compare */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                    <span>{rev.oldRevision} (Previous)</span>
                    <span className="font-mono text-slate-700 font-bold">{rev.oldWeightKg.toFixed(2)} kg</span>
                  </div>
                  <div className="font-mono text-slate-800 text-xs font-semibold bg-white p-1.5 rounded border border-slate-200">
                    {rev.oldNotation}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-700">
                    <span>{rev.newRevision} (Latest Issued)</span>
                    <span className="font-mono text-indigo-900 font-bold">{rev.newWeightKg.toFixed(2)} kg</span>
                  </div>
                  <div className="font-mono text-indigo-950 text-xs font-semibold bg-white p-1.5 rounded border border-indigo-200">
                    {rev.newNotation}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                <strong>ENGINEERING NOTE:</strong> {rev.changeSummary}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Revision deltas ensure complete cost transparency between design iterations.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            Close Revision Diff
          </button>
        </div>
      </div>
    </div>
  );
};
