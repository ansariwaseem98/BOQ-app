import React from 'react';
import { GitCompare, ArrowRight, TrendingUp, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { RevisionComparison, ProjectRecord, DetectedElement, BoqItem } from '../types';

interface RevisionManagerProps {
  revisions?: RevisionComparison[];
  elements?: DetectedElement[];
  boqItems?: BoqItem[];
  projectData?: ProjectRecord | any | null;
  onApproveRevision?: (id: string) => void;
}

export const RevisionManager: React.FC<RevisionManagerProps> = ({
  revisions = [],
  elements = [],
  boqItems = [],
  projectData = null,
  onApproveRevision,
}) => {
  const currency = 
    projectData?.tender?.currencySymbol || 
    projectData?.contract?.currencySymbol || 
    '$';

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6 text-slate-800 select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-indigo-600" />
            Drawing Revision Comparison & Delta Cost Impact
          </h2>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            Tender Addendum Tracker
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Automated comparison between tender drawing revisions, geometry changes and financial cost impact
        </p>
      </div>

      {/* Revisions List */}
      {revisions.length > 0 ? (
        <div className="space-y-4">
          {revisions.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-indigo-600">
                      Sheet {rev.drawingNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {rev.oldRevision} <ArrowRight className="inline w-3 h-3 mx-0.5" /> {rev.newRevision}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 mt-1 font-semibold">{rev.changesSummary}</p>
                </div>

                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Cost Delta</span>
                    <span className="font-mono text-lg font-extrabold text-amber-700">
                      +{currency}{(rev.totalCostImpact || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {rev.status === 'approved' ? (
                    <span className="px-3 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Approved
                    </span>
                  ) : (
                    onApproveRevision && (
                      <button
                        onClick={() => onApproveRevision(rev.id)}
                        className="px-3.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors shadow-2xs"
                      >
                        Approve Delta
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Elements Modified Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Modified Elements ({(rev.elementsModified || []).length})
                </span>
                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Element</th>
                        <th className="px-4 py-2.5">Previous Specification</th>
                        <th className="px-4 py-2.5">Revised Specification</th>
                        <th className="px-4 py-2.5 text-right">Quantity Delta</th>
                        <th className="px-4 py-2.5 text-right">Cost Delta ({currency})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {(rev.elementsModified || []).map((m) => (
                        <tr key={m.elementId} className="hover:bg-slate-50/80">
                          <td className="px-4 py-2.5 font-sans font-bold text-slate-900">{m.name}</td>
                          <td className="px-4 py-2.5 text-slate-500">{m.oldDimension}</td>
                          <td className="px-4 py-2.5 text-indigo-700 font-semibold">{m.newDimension}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-amber-700">
                            {m.quantityDelta > 0 ? `+${m.quantityDelta}` : m.quantityDelta} {m.unit}
                          </td>
                          <td className="px-4 py-2.5 text-right font-extrabold text-slate-900">
                            +{currency}{(m.costImpact || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 space-y-2">
          <GitCompare className="w-8 h-8 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No Drawing Revisions Tracked</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            When revised drawing sheets or tender addenda are uploaded, geometric changes and cost impacts will be compared automatically here.
          </p>
        </div>
      )}
    </div>
  );
};
