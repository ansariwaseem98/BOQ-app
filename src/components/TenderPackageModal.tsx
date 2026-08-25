import React from 'react';
import { X, Briefcase, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Printer } from 'lucide-react';
import { TenderPackageData } from '../types';

interface TenderPackageModalProps {
  tenderData: TenderPackageData;
  onClose: () => void;
}

export const TenderPackageModal: React.FC<TenderPackageModalProps> = ({ tenderData, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tenderData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Tender_Package_${tenderData.projectNumber}_${tenderData.boqRevision.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Unified Tender Package Summary</h3>
              <p className="text-xs text-slate-400">Tender Volume II — Bill of Quantities & Contract Scope Documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export Package JSON
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          {/* Project Title Block */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span className="text-2xs uppercase tracking-widest text-slate-500 font-bold block">TENDER PACKAGE VOLUME II</span>
                <h2 className="text-lg font-bold text-slate-900">{tenderData.projectName}</h2>
                <span className="font-mono text-xs text-indigo-600 font-semibold">{tenderData.projectNumber}</span>
              </div>
              <div className="text-left sm:text-right font-mono text-xs">
                <span className="px-2.5 py-1 rounded bg-slate-900 text-white font-bold inline-block">{tenderData.boqRevision}</span>
                <span className="block text-slate-500 text-2xs mt-1">Date: {tenderData.generatedDate}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Client / Employer</span>
                <span className="font-semibold text-slate-800">{tenderData.clientName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Consultant / Engineer</span>
                <span className="font-semibold text-slate-800">{tenderData.consultantName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Total BOQ Items</span>
                <span className="font-mono font-bold text-slate-800">{tenderData.totalItemsCount} Items</span>
              </div>
              <div>
                <span className="text-slate-500 block">Drawings Basis</span>
                <span className="font-mono font-bold text-slate-800">{tenderData.drawingsIncludedCount} Verified Drawings</span>
              </div>
            </div>
          </div>

          {/* Discipline Grand Summary Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-slate-500" />
              Summary of Grand Disciplines
            </h4>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Discipline Code & Description</th>
                    <th className="py-2.5 px-3 text-center">Items Count</th>
                    <th className="py-2.5 px-3 text-right">Discipline Scope Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-xs">
                  {tenderData.disciplinesSummary.map((disc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-800 font-sans">{disc.discipline}</td>
                      <td className="py-2 px-3 text-center text-slate-600">{disc.itemCount}</td>
                      <td className="py-2 px-3 text-right text-slate-800 font-bold">
                        {disc.totalAmount ? `${disc.totalAmount.toLocaleString()} ${tenderData.currency}` : 'Rate Only (To be Priced)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assumptions Register */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Explicit Assumptions Register ({tenderData.assumptions.length})
            </h4>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden bg-white">
              {tenderData.assumptions.map((asm) => (
                <div key={asm.id} className="p-3 hover:bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xs font-bold text-indigo-600">{asm.id}</span>
                    <span className="text-2xs text-slate-400 font-mono">By {asm.enteredBy} on {asm.date}</span>
                  </div>
                  <p className="font-semibold text-slate-800">{asm.description}</p>
                  <p className="text-slate-500 text-2xs italic">Basis: {asm.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Exclusions Register */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Explicit Exclusions Register ({tenderData.exclusions.length})
            </h4>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden bg-white">
              {tenderData.exclusions.map((exc) => (
                <div key={exc.id} className="p-3 hover:bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xs font-bold text-amber-600">{exc.id}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono text-2xs uppercase">
                      {exc.category}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">{exc.description}</p>
                  <p className="text-slate-500 text-2xs italic">Commercial Reason: {exc.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Tender Package
          </button>
        </div>
      </div>
    </div>
  );
};
