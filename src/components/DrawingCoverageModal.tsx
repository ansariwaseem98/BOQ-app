import React from 'react';
import { X, Layers, CheckCircle2, AlertTriangle, FileText, Check, Clock } from 'lucide-react';
import { DrawingCoverageItem } from '../types';

interface DrawingCoverageModalProps {
  coverageList: DrawingCoverageItem[];
  onClose: () => void;
}

export const DrawingCoverageModal: React.FC<DrawingCoverageModalProps> = ({ coverageList, onClose }) => {
  const totalDrawings = coverageList.length;
  const processedDrawings = coverageList.filter(d => d.isProcessed).length;
  const verifiedDrawings = coverageList.filter(d => d.isVerified).length;
  const percentComplete = totalDrawings > 0 ? Math.round((processedDrawings / totalDrawings) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Drawing Coverage Matrix</h3>
              <p className="text-xs text-slate-400">Cross-discipline drawing takeoff verification and status matrix</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-2xs text-slate-500 font-semibold uppercase">Total Project Drawings</div>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">{totalDrawings}</div>
            </div>
            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
              <div className="text-2xs text-emerald-700 font-semibold uppercase">Processed for Takeoff</div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{processedDrawings} / {totalDrawings}</div>
            </div>
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
              <div className="text-2xs text-blue-700 font-semibold uppercase">Verified by Engineer</div>
              <div className="text-xl font-bold font-mono text-blue-700 mt-1">{verifiedDrawings} / {totalDrawings}</div>
            </div>
            <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg">
              <div className="text-2xs text-indigo-700 font-semibold uppercase">Drawing Coverage</div>
              <div className="text-xl font-bold font-mono text-indigo-700 mt-1">{percentComplete}%</div>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Drawing Number</th>
                  <th className="py-2.5 px-3">Drawing Title</th>
                  <th className="py-2.5 px-3">Revision</th>
                  <th className="py-2.5 px-3">Disciplines Included</th>
                  <th className="py-2.5 px-3 text-center">BOQ Items</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {coverageList.map((dwg, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono font-bold text-indigo-600">{dwg.drawingNumber}</td>
                    <td className="py-2 px-3 text-slate-800 font-medium">{dwg.drawingTitle}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{dwg.revision}</td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {dwg.disciplinesDetected.map((d, dIdx) => (
                          <span key={dIdx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-2xs">
                            {d}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-700">
                      {dwg.boqItemsGeneratedCount}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {dwg.isProcessed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-2xs">
                          <Check className="w-3 h-3" /> Fully Covered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold text-2xs">
                          <Clock className="w-3 h-3" /> Unprocessed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Coverage Matrix
          </button>
        </div>
      </div>
    </div>
  );
};
