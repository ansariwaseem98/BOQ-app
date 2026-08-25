import React from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { PricingQaReport, PricingQaIssue } from '../types/rateAnalysis';

interface PricingQualityGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  qaReport: PricingQaReport;
  onSelectIssueItem: (itemCode: string) => void;
}

export const PricingQualityGateModal: React.FC<PricingQualityGateModalProps> = ({
  isOpen,
  onClose,
  qaReport,
  onSelectIssueItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl text-white flex items-center justify-center font-bold shadow-xs ${
                qaReport.qualityGatePassed ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {qaReport.qualityGatePassed ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                  Pricing QA & Pre-Flight Quality Gate
                </h3>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    qaReport.qualityGatePassed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {qaReport.qualityGatePassed ? 'PASSED — TENDER READY' : 'BLOCKERS DETECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                7 commercial integrity checks: unpriced items, unit mismatches, expired quotations, and audit completeness
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 grid grid-cols-2 md:grid-cols-5 gap-3 shrink-0 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] block font-bold uppercase">Priced Scope</span>
            <strong className="text-slate-900 font-mono text-sm">
              {qaReport.pricedItemsCount} / {qaReport.totalBoqItems} ({qaReport.pricedPercent}%)
            </strong>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] block font-bold uppercase">Unpriced Items</span>
            <strong className={qaReport.unpricedItemsCount > 0 ? 'text-rose-600 font-mono text-sm font-black' : 'text-emerald-600 font-mono text-sm'}>
              {qaReport.unpricedItemsCount}
            </strong>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] block font-bold uppercase">Unit Mismatches</span>
            <strong className={qaReport.unitMismatchesCount > 0 ? 'text-rose-600 font-mono text-sm font-black' : 'text-emerald-600 font-mono text-sm'}>
              {qaReport.unitMismatchesCount}
            </strong>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] block font-bold uppercase">Expired Rates</span>
            <strong className={qaReport.expiredRatesCount > 0 ? 'text-amber-600 font-mono text-sm font-black' : 'text-emerald-600 font-mono text-sm'}>
              {qaReport.expiredRatesCount}
            </strong>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-slate-400 text-[10px] block font-bold uppercase">Critical Blockers</span>
            <strong className={qaReport.criticalIssuesCount > 0 ? 'text-rose-600 font-mono text-sm font-black' : 'text-emerald-600 font-mono text-sm'}>
              {qaReport.criticalIssuesCount}
            </strong>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-4">
          {qaReport.issues.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-sm font-black text-emerald-950 uppercase">Zero Commercial Pricing Defects</h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                All BOQ items have complete, validated rate build-ups matching drawing units and verified prices. The tender estimate is ready for export and submission.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {qaReport.issues.map((issue) => (
                <div
                  key={issue.id}
                  className={`bg-white rounded-xl border p-4 shadow-xs transition-all flex items-start justify-between gap-4 ${
                    issue.severity === 'CRITICAL'
                      ? 'border-rose-300 ring-1 ring-rose-500/10'
                      : issue.severity === 'WARNING'
                      ? 'border-amber-300'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {issue.severity === 'CRITICAL' ? (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      ) : issue.severity === 'WARNING' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Info className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {issue.itemCode}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            issue.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : issue.severity === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {issue.issueType.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-900 mb-1">{issue.message}</p>
                      <p className="text-xs text-slate-600">
                        <strong>Action:</strong> {issue.suggestedAction}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onSelectIssueItem(issue.itemCode);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all shrink-0 flex items-center gap-1"
                  >
                    <span>Fix in Build-up</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Quality Gate timestamp: {new Date(qaReport.timestamp).toLocaleString()}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            Close Quality Gate
          </button>
        </div>
      </div>
    </div>
  );
};
