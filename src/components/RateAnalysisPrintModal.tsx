import React from 'react';
import { X, Printer, Download, Building, ShieldCheck } from 'lucide-react';
import { RateAnalysisRecord, TenderSummaryReport } from '../types/rateAnalysis';
import { UnifiedBoqItem, ProjectData } from '../types';
import { RateAnalysisEngine } from '../engine/rateAnalysisEngine';

interface RateAnalysisPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: RateAnalysisRecord | null;
  selectedBoq: UnifiedBoqItem | null;
  summaryReport: TenderSummaryReport;
  project: ProjectData | null;
}

export const RateAnalysisPrintModal: React.FC<RateAnalysisPrintModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
  selectedBoq,
  summaryReport,
  project,
}) => {
  if (!isOpen || !selectedItem || !selectedBoq) return null;

  const handlePrint = () => {
    window.print();
  };

  const rateWords = RateAnalysisEngine.numberToEnglishWords(selectedItem.finalRate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Header - Hidden on Print */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase">
              Printable Rate Analysis Sheet ({selectedItem.itemCode})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Content */}
        <div className="flex-1 overflow-y-auto p-8 print:p-0 bg-white text-slate-900 font-sans">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                {project?.company?.name || 'APEX ENGINEERING & ESTIMATION CORP'}
              </h1>
              <p className="text-xs text-slate-600">
                Commercial Estimating & Cost Control Department | Tender Pricing Division
              </p>
              <p className="text-xs text-slate-600">
                Project: <strong>{project?.project?.name || summaryReport.projectName}</strong> (Ref: {project?.project?.projectNumber || project?.id || 'PRJ-2026-001'})
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2.5 py-1 rounded">
                RATE ANALYSIS SHEET
              </span>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                Date: {new Date().toISOString().split('T')[0]} | Rev: {summaryReport.pricingRevision}
              </div>
            </div>
          </div>

          {/* Item Meta Block */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block font-bold text-[10px] uppercase">BOQ Item Code:</span>
              <strong className="font-mono text-sm text-slate-900">{selectedItem.itemCode}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-bold text-[10px] uppercase">Discipline:</span>
              <strong className="text-slate-900">{selectedBoq.discipline}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-bold text-[10px] uppercase">Verified Drawing Qty:</span>
              <strong className="font-mono text-slate-900">{selectedBoq.finalQuantity} {selectedBoq.unit}</strong>
            </div>
            <div>
              <span className="text-slate-500 block font-bold text-[10px] uppercase">Analysis Unit:</span>
              <strong className="font-mono text-slate-900">1.00 {selectedItem.rateUnit}</strong>
            </div>

            <div className="col-span-2 md:col-span-4 pt-2 border-t border-slate-200">
              <span className="text-slate-500 block font-bold text-[10px] uppercase">Item Scope & Specification:</span>
              <p className="text-slate-900 font-medium">{selectedItem.description}</p>
            </div>
          </div>

          {/* Rate Build-up Components Table */}
          <table className="w-full text-left text-xs border-collapse border border-slate-300 mb-6">
            <thead className="bg-slate-100 font-bold border-b border-slate-300">
              <tr>
                <th className="p-2 border border-slate-300">Category</th>
                <th className="p-2 border border-slate-300">Resource Component & Spec</th>
                <th className="p-2 border border-slate-300 text-center">Unit</th>
                <th className="p-2 border border-slate-300 text-right">Consumption</th>
                <th className="p-2 border border-slate-300 text-right">Unit Rate ($)</th>
                <th className="p-2 border border-slate-300 text-right">Wastage %</th>
                <th className="p-2 border border-slate-300 text-right">Amount ($)</th>
              </tr>
            </thead>
            <tbody>
              {selectedItem.components.map((c) => (
                <tr key={c.id}>
                  <td className="p-2 border border-slate-300 font-bold text-slate-700">{c.category}</td>
                  <td className="p-2 border border-slate-300 font-medium text-slate-900">{c.description}</td>
                  <td className="p-2 border border-slate-300 text-center font-mono">{c.unit}</td>
                  <td className="p-2 border border-slate-300 text-right font-mono">{c.consumption.toFixed(3)}</td>
                  <td className="p-2 border border-slate-300 text-right font-mono">${c.unitRate.toFixed(2)}</td>
                  <td className="p-2 border border-slate-300 text-right font-mono">{c.wastagePercent ? `${c.wastagePercent}%` : '—'}</td>
                  <td className="p-2 border border-slate-300 text-right font-mono font-bold">${c.amount.toFixed(2)}</td>
                </tr>
              ))}

              {/* Direct Cost Subtotal */}
              <tr className="bg-slate-50 font-bold">
                <td colSpan={6} className="p-2 border border-slate-300 text-right uppercase">
                  TOTAL DIRECT COST PER {selectedItem.rateUnit}
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono text-slate-900 font-black">
                  ${selectedItem.directCost.toFixed(2)}
                </td>
              </tr>

              {/* Overhead */}
              <tr>
                <td colSpan={6} className="p-2 border border-slate-300 text-right">
                  Add: Overhead Allowance ({selectedItem.overheadPercent}%)
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono">
                  ${selectedItem.overheadAmount.toFixed(2)}
                </td>
              </tr>

              {/* Profit */}
              <tr>
                <td colSpan={6} className="p-2 border border-slate-300 text-right">
                  Add: Profit Margin ({selectedItem.profitPercent}%)
                </td>
                <td className="p-2 border border-slate-300 text-right font-mono">
                  ${selectedItem.profitAmount.toFixed(2)}
                </td>
              </tr>

              {/* Tax */}
              {selectedItem.taxEnabled && (
                <tr>
                  <td colSpan={6} className="p-2 border border-slate-300 text-right">
                    Add: Tax / VAT Allowance ({selectedItem.taxRatePercent}%)
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-mono">
                    ${selectedItem.taxAmount.toFixed(2)}
                  </td>
                </tr>
              )}

              {/* Final Unit Rate */}
              <tr className="bg-slate-900 text-white font-black text-sm">
                <td colSpan={6} className="p-2.5 border border-slate-900 text-right uppercase">
                  FINAL UNIT RATE PER {selectedItem.rateUnit}
                </td>
                <td className="p-2.5 border border-slate-900 text-right font-mono text-emerald-400">
                  ${selectedItem.finalRate.toFixed(2)}
                </td>
              </tr>

              {/* Total BOQ Amount */}
              <tr className="bg-emerald-50 text-emerald-950 font-bold">
                <td colSpan={6} className="p-2.5 border border-slate-300 text-right uppercase">
                  TOTAL BOQ ITEM AMOUNT ({selectedBoq.finalQuantity} {selectedBoq.unit} × ${selectedItem.finalRate.toFixed(2)})
                </td>
                <td className="p-2.5 border border-slate-300 text-right font-mono text-emerald-800 font-black text-sm">
                  ${(selectedBoq.finalQuantity * selectedItem.finalRate).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Rate in Words */}
          <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs mb-8">
            <span className="font-bold text-slate-600 uppercase text-[10px] block">Unit Rate in Words:</span>
            <strong className="font-serif italic text-slate-900">"{rateWords}"</strong>
          </div>

          {/* Sign-off Blocks */}
          <div className="grid grid-cols-3 gap-8 pt-6 border-t border-slate-300 text-xs">
            <div>
              <span className="text-slate-500 block mb-8">Prepared By (Estimator):</span>
              <div className="border-b border-slate-400 pb-1 font-bold">Lead Civil & MEP Estimator</div>
              <span className="text-[10px] text-slate-400">Date: {new Date().toISOString().split('T')[0]}</span>
            </div>

            <div>
              <span className="text-slate-500 block mb-8">Reviewed By (Chief Estimator):</span>
              <div className="border-b border-slate-400 pb-1 font-bold">Commercial Review Manager</div>
              <span className="text-[10px] text-slate-400">Signature & Seal</span>
            </div>

            <div>
              <span className="text-slate-500 block mb-8">Approved By (Tender Director):</span>
              <div className="border-b border-slate-400 pb-1 font-bold">Director of Commercial Bids</div>
              <span className="text-[10px] text-slate-400">Tender Committee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
