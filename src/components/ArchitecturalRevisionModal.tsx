import React from 'react';
import { X, GitCommit, ArrowRight, Check, History } from 'lucide-react';
import { ArchitecturalRevisionDiffRecord } from '../types';

interface ArchitecturalRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  diffs: ArchitecturalRevisionDiffRecord[];
  onReviewDiff: (id: string) => void;
}

export const ArchitecturalRevisionModal: React.FC<ArchitecturalRevisionModalProps> = ({
  isOpen,
  onClose,
  diffs,
  onReviewDiff,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">
                Architectural Revision Comparison (Rev 00 vs Rev 01)
              </h3>
              <p className="text-xs text-slate-400">
                Deterministic quantity deltas and specification revisions tracked from drawing updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {diffs.map((diff) => (
            <div
              key={diff.id}
              className="border border-slate-800 bg-slate-950/60 rounded-lg p-4 text-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-100">{diff.elementMark}</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-mono text-[10px]">
                    {diff.category}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      diff.deltaQuantity >= 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {diff.deltaQuantity >= 0 ? `+${diff.deltaQuantity}` : diff.deltaQuantity}{' '}
                    {diff.unit}
                  </span>
                  <button
                    onClick={() => onReviewDiff(diff.id)}
                    className={`p-1.5 rounded transition-colors ${
                      diff.reviewed
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800'
                    }`}
                    title={diff.reviewed ? 'Reviewed' : 'Mark as reviewed'}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Rev {diff.oldRevision} (Previous)
                  </span>
                  <span className="text-slate-300 block font-medium mt-1">
                    {diff.oldSpecification}
                  </span>
                  <span className="font-mono text-slate-400 mt-1 block">
                    {diff.oldQuantity} {diff.unit}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-900 rounded border border-indigo-500/30">
                  <span className="text-indigo-400 block text-[10px] uppercase font-bold">
                    Rev {diff.newRevision} (Current)
                  </span>
                  <span className="text-indigo-200 block font-medium mt-1">
                    {diff.newSpecification}
                  </span>
                  <span className="font-mono text-indigo-300 mt-1 block font-bold">
                    {diff.newQuantity} {diff.unit}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/50 p-2 rounded">
                <span className="text-slate-500">Summary: </span>
                {diff.changeSummary}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
