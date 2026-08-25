import React from 'react';
import { X, AlertTriangle, CheckCircle2, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { ArchitecturalConflictRecord } from '../types';

interface ArchitecturalConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ArchitecturalConflictRecord[];
  onResolve: (conflictId: string, resolvedSource: 'A' | 'B', note: string) => void;
}

export const ArchitecturalConflictModal: React.FC<ArchitecturalConflictModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolve,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-lg">
                Architectural Drawing Conflict Adjudication
              </h3>
              <p className="text-xs text-slate-400">
                Discrepancies identified between architectural floor plans, sections, and schedules
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
          {conflicts.map((conf) => (
            <div
              key={conf.id}
              className={`border rounded-lg p-4 text-xs space-y-3 ${
                conf.status === 'RESOLVED'
                  ? 'bg-slate-950/40 border-slate-800'
                  : 'bg-amber-950/20 border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-300">
                    {conf.elementMark}
                  </span>
                  <span className="font-semibold text-slate-200">{conf.conflictType}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                    conf.status === 'RESOLVED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {conf.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Source A */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-blue-400 mb-1">
                    Source A: {conf.sourceA.documentName}
                  </div>
                  <div className="text-slate-300 font-mono text-sm font-semibold">
                    {conf.sourceA.value}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1">
                    Drawing {conf.sourceA.drawingNumber} (Rev {conf.sourceA.revision}) •{' '}
                    {conf.sourceA.location}
                  </div>
                  {conf.status === 'OPEN' && (
                    <button
                      onClick={() =>
                        onResolve(
                          conf.id,
                          'A',
                          `Adopted ${conf.sourceA.documentName} dimension (${conf.sourceA.value})`
                        )
                      }
                      className="mt-2.5 w-full py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded text-[11px] font-medium transition-colors"
                    >
                      Adjudicate: Accept Source A
                    </button>
                  )}
                </div>

                {/* Source B */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-purple-400 mb-1">
                    Source B: {conf.sourceB.documentName}
                  </div>
                  <div className="text-slate-300 font-mono text-sm font-semibold">
                    {conf.sourceB.value}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1">
                    Drawing {conf.sourceB.drawingNumber} (Rev {conf.sourceB.revision}) •{' '}
                    {conf.sourceB.location}
                  </div>
                  {conf.status === 'OPEN' && (
                    <button
                      onClick={() =>
                        onResolve(
                          conf.id,
                          'B',
                          `Adopted ${conf.sourceB.documentName} dimension (${conf.sourceB.value})`
                        )
                      }
                      className="mt-2.5 w-full py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white rounded text-[11px] font-medium transition-colors"
                    >
                      Adjudicate: Accept Source B
                    </button>
                  )}
                </div>
              </div>

              {conf.status === 'RESOLVED' && conf.resolutionNote && (
                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded p-2.5 text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    Resolution Note: {conf.resolutionNote} (by {conf.resolvedBy || 'Lead QS'} at{' '}
                    {conf.resolvedAt || 'Just now'})
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
