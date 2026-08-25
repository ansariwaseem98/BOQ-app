import React from 'react';
import { X, Calculator, ShieldCheck, FileText, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface ArchitecturalCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category: string;
  mark: string;
  formulaWithValues: string;
  dimensions: { label: string; value: string | number; unit?: string }[];
  deductions?: { label: string; areaOrVol: string; rule: string }[];
  auditSteps?: { id: string; user: string; timestamp: string; action: string; reason: string }[];
  sourceDrawing: { number: string; revision: string; location: string };
  standard?: string;
}

export const ArchitecturalCalculationModal: React.FC<ArchitecturalCalculationModalProps> = ({
  isOpen,
  onClose,
  title,
  category,
  mark,
  formulaWithValues,
  dimensions,
  deductions,
  auditSteps,
  sourceDrawing,
  standard = 'POMI / NRM2 Standard Method',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-lg">{title}</h3>
                <span className="px-2 py-0.5 text-xs font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                  {mark}
                </span>
                <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded font-mono">
                  {category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic geometric formula & audit traceability
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
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Formula Display Box */}
          <div className="bg-slate-950 border border-blue-500/30 rounded-lg p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1 flex items-center justify-between">
              <span>Mathematical Expression</span>
              <span className="text-[11px] text-slate-400 normal-case font-mono">
                Standard: {standard}
              </span>
            </div>
            <div className="font-mono text-sm text-blue-100 bg-slate-900/90 p-3 rounded border border-slate-800 break-words">
              {formulaWithValues}
            </div>
          </div>

          {/* Dimension Breakdown Grid */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Input Parameters & Geometric Dimensions</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {dimensions.map((dim, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 flex flex-col justify-between"
                >
                  <span className="text-[11px] text-slate-400">{dim.label}</span>
                  <span className="text-sm font-semibold text-slate-100 font-mono mt-1">
                    {dim.value} {dim.unit || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deductions Breakdown (if any) */}
          {deductions && deductions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Openings & Surface Deductions</span>
              </h4>
              <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800">
                {deductions.map((ded, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-slate-200">{ded.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ded.rule}</div>
                    </div>
                    <div className="font-mono font-semibold text-amber-300">
                      -{ded.areaOrVol}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Drawing Provenance */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-lg p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <div className="font-medium text-slate-200">
                  Drawing {sourceDrawing.number} (Rev {sourceDrawing.revision})
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Source: {sourceDrawing.location}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded font-medium text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              Traceable
            </span>
          </div>

          {/* Audit History */}
          {auditSteps && auditSteps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Calculation Audit Trail
              </h4>
              <div className="space-y-2">
                {auditSteps.map((aud, idx) => (
                  <div
                    key={idx}
                    className="text-xs bg-slate-950/60 border border-slate-800 rounded p-2.5 flex items-start justify-between"
                  >
                    <div>
                      <span className="font-medium text-slate-200">{aud.action}</span>
                      <span className="text-slate-400 text-[11px] ml-2 font-mono">
                        {new Date(aud.timestamp).toLocaleTimeString()}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">{aud.reason}</div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{aud.user}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
