import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Eye,
  Edit3,
  HelpCircle,
  Search,
  Filter,
  Check,
  ShieldCheck
} from 'lucide-react';
import { RccRebarRegisterItem, BbsVerificationStatus } from '../types';

interface BbsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rebarList: RccRebarRegisterItem[];
  onApproveBar: (id: string) => void;
  onEditBar: (item: RccRebarRegisterItem) => void;
  onViewSourceDrawing?: (documentId: string, page: number) => void;
  onResolveOpenItem?: (openItemId: string) => void;
}

export const BbsReviewModal: React.FC<BbsReviewModalProps> = ({
  isOpen,
  onClose,
  rebarList,
  onApproveBar,
  onEditBar,
  onViewSourceDrawing,
  onResolveOpenItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL_PENDING');

  if (!isOpen) return null;

  const pendingItems = rebarList.filter((r) => {
    const matchesSearch =
      r.barMark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.memberDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.elementMark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.rawNotation.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL_PENDING') {
      return r.verificationStatus !== 'FINAL' && r.verificationStatus !== 'USER VERIFIED';
    }
    if (filterStatus === 'BLOCKED') {
      return r.isBlocked || r.verificationStatus === 'BLOCKED';
    }
    if (filterStatus === 'REQUIRES_REVIEW') {
      return r.verificationStatus === 'REQUIRES REVIEW' || r.verificationStatus === 'AI EXTRACTED — NOT VERIFIED';
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Review & Verify BBS Reinforcement Schedule
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {pendingItems.length} Items Needing Review
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Rule 45: Only USER VERIFIED or USER CORRECTED rebar items can proceed to Final BBS release.
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

        {/* Filter Controls */}
        <div className="px-6 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('ALL_PENDING')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterStatus === 'ALL_PENDING'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Unverified Items ({rebarList.filter((r) => r.verificationStatus !== 'FINAL' && r.verificationStatus !== 'USER VERIFIED').length})
            </button>
            <button
              onClick={() => setFilterStatus('BLOCKED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterStatus === 'BLOCKED'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              Blocked by Open Items ({rebarList.filter((r) => r.isBlocked).length})
            </button>
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All {rebarList.length} Rebar Rows
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search bar mark, member, raw text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Schedule Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Bar Mark</th>
                <th className="py-2.5 px-3">Element / Description</th>
                <th className="py-2.5 px-3">Raw Notation</th>
                <th className="py-2.5 px-2 text-center">Dia</th>
                <th className="py-2.5 px-2 text-center">Shape</th>
                <th className="py-2.5 px-2 text-right">Cut L (m)</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Weight (kg)</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="font-semibold text-slate-700">All BBS bar items in this category are verified!</p>
                    <p className="text-xs text-slate-400 mt-0.5">Ready for Final BBS Bar Bending Schedule issuance.</p>
                  </td>
                </tr>
              ) : (
                pendingItems.map((r) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      r.isBlocked ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {r.isBlocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3 h-3" />
                          <span>BLOCKED</span>
                        </span>
                      ) : r.verificationStatus === 'USER VERIFIED' || r.verificationStatus === 'FINAL' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>VERIFIED</span>
                        </span>
                      ) : r.verificationStatus === 'USER CORRECTED' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 w-max">
                          <span>CORRECTED</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-max">
                          <span>NEEDS REVIEW</span>
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      {r.barMark}
                    </td>

                    <td className="py-2.5 px-3">
                      <p className="font-semibold text-slate-900">{r.memberDescription}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {r.elementType} • {r.level} • {r.grid}
                      </p>
                      {r.blockedReason && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{r.blockedReason}</span>
                        </p>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700 block max-w-xs truncate">
                        {r.rawNotation}
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                      Ø{r.barDiameterMm}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono text-[11px]">
                      {r.shapeCode}
                    </td>

                    <td className="py-2.5 px-2 text-right font-mono font-semibold text-slate-900">
                      {r.cuttingLengthM.toFixed(3)}
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-900">
                      {r.totalBars}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-black text-indigo-700">
                      {r.totalWeightKg.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.isBlocked ? (
                          <button
                            onClick={() => onEditBar(r)}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Resolve Open Item</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => onApproveBar(r.id)}
                              className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer shadow-2xs"
                              title="Approve & Lock Rebar"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onEditBar(r)}
                              className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                              title="Edit Geometry & Parameters"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {onViewSourceDrawing && (
                          <button
                            onClick={() => onViewSourceDrawing(r.sourceDrawing.documentId, r.sourceDrawing.page)}
                            className="p-1.5 rounded bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
                            title="View on Drawing"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>All verification changes update the calculation audit ledger immutably.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
