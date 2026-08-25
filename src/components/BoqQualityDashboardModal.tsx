import React from 'react';
import { X, ShieldCheck, AlertOctagon, CheckCircle2, AlertTriangle, FileWarning, Layers, Database } from 'lucide-react';
import { BoqQualityDashboardData } from '../types';

interface BoqQualityDashboardModalProps {
  data: BoqQualityDashboardData;
  onClose: () => void;
}

export const BoqQualityDashboardModal: React.FC<BoqQualityDashboardModalProps> = ({ data, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              data.qualityGatePassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {data.qualityGatePassed ? <ShieldCheck className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">BOQ Quality & Completeness Dashboard</h3>
              <p className="text-xs text-slate-400">Pre-Submission Quality Gate & Completeness Verification</p>
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
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top Score Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
            data.qualityGatePassed
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-red-50/70 border-red-200 text-red-950'
          }`}>
            <div>
              <div className="text-xs uppercase tracking-wider font-semibold opacity-75">Takeoff Completeness Status</div>
              <div className="text-2xl font-bold flex items-center gap-2 mt-0.5">
                <span>{data.completenessScorePercent}%</span>
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-white/80 border border-current">
                  {data.qualityGatePassed ? 'Quality Gate PASSED' : 'Quality Gate BLOCKED'}
                </span>
              </div>
              <p className="text-xs mt-1 text-slate-600">
                {data.qualityGatePassed
                  ? 'All items satisfy source traceability, mathematical derivations, and verification checks.'
                  : 'Critical engineering governance requirements must be resolved prior to final BOQ freeze.'}
              </p>
            </div>

            <div className="w-24 h-24 shrink-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" className="text-slate-200" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeDasharray={201}
                    strokeDashoffset={201 - (201 * data.completenessScorePercent) / 100}
                    strokeLinecap="round"
                    className={data.qualityGatePassed ? 'text-emerald-600' : 'text-red-600'}
                    fill="transparent"
                  />
                </svg>
                <span className="absolute font-mono text-sm font-bold text-slate-800">
                  {data.completenessScorePercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Blocking Reasons if any */}
          {data.blockingReasons.length > 0 && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-2">
              <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Critical Blocking Conditions ({data.blockingReasons.length})
              </h4>
              <ul className="space-y-1.5 text-xs text-red-800 font-medium">
                {data.blockingReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-2xs text-slate-500 font-semibold uppercase">Total BOQ Items</div>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">{data.totalItems}</div>
            </div>

            <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg">
              <div className="text-2xs text-emerald-700 font-semibold uppercase">Finalized Items</div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">{data.finalItems}</div>
            </div>

            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
              <div className="text-2xs text-amber-700 font-semibold uppercase">Requires Review</div>
              <div className="text-xl font-bold font-mono text-amber-700 mt-1">{data.requiresReviewItems}</div>
            </div>

            <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg">
              <div className="text-2xs text-rose-700 font-semibold uppercase">Open Items / RFIs</div>
              <div className="text-xl font-bold font-mono text-rose-700 mt-1">{data.openItemsCount}</div>
            </div>

            <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-lg">
              <div className="text-2xs text-rose-700 font-semibold uppercase">Active Conflicts</div>
              <div className="text-xl font-bold font-mono text-rose-700 mt-1">{data.conflictsCount}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-2xs text-slate-500 font-semibold uppercase">Unverified Drafts</div>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">{data.unverifiedItems}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-2xs text-slate-500 font-semibold uppercase">Missing Sources</div>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">{data.missingSourcesCount}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-2xs text-slate-500 font-semibold uppercase">Missing Formulas</div>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">{data.missingFormulasCount}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-2xs text-slate-500 font-semibold uppercase">Missing Specs</div>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">{data.missingSpecsCount}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-2xs text-slate-500 font-semibold uppercase">Zero / Negative Qty</div>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">{data.zeroOrNegativeCount}</div>
            </div>

            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg">
              <div className="text-2xs text-blue-700 font-semibold uppercase">User Overrides</div>
              <div className="text-xl font-bold font-mono text-blue-700 mt-1">{data.overriddenCount}</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-2xs text-slate-500 font-semibold uppercase">Unprocessed Drawings</div>
              <div className="text-xl font-bold font-mono text-slate-800 mt-1">{data.unprocessedDrawingsCount}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
