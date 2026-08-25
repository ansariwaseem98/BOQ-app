import React, { useState } from 'react';
import { X, GitCommit, Plus, History, ArrowUpRight, ArrowDownRight, Tag, ShieldCheck } from 'lucide-react';
import { BoqRevisionRecord, UnifiedBoqItem } from '../types';

interface BoqRevisionModalProps {
  revisions: BoqRevisionRecord[];
  activeRevision: string;
  items: UnifiedBoqItem[];
  onCreateRevision: (revisionCode: string, reason: string, basis: string) => void;
  onClose: () => void;
}

export const BoqRevisionModal: React.FC<BoqRevisionModalProps> = ({
  revisions,
  activeRevision,
  items,
  onCreateRevision,
  onClose,
}) => {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCode, setNewCode] = useState(`BOQ Rev 0${revisions.length}`);
  const [reason, setReason] = useState('');
  const [basis, setBasis] = useState('Latest Architectural & Structural Addendum Drawings');
  const [selectedRevCode, setSelectedRevCode] = useState(activeRevision);

  const selectedRev = revisions.find(r => r.revisionCode === selectedRevCode) || revisions[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    onCreateRevision(newCode, reason, basis);
    setShowNewForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">BOQ Revision History & Change Log</h3>
              <p className="text-xs text-slate-400">Track and compare formal tender revisions and quantity deltas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!showNewForm && (
              <button
                onClick={() => setShowNewForm(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Branch New Revision
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* New Revision Form */}
          {showNewForm && (
            <form onSubmit={handleCreate} className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Branch New BOQ Revision</h4>
                <button
                  type="button"
                  onClick={() => setShowNewForm(false)}
                  className="text-indigo-600 text-xs hover:underline"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-indigo-900 mb-1">Revision Code</label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-xs font-mono font-bold bg-white"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-indigo-900 mb-1">Drawing Revision Basis</label>
                  <input
                    type="text"
                    value={basis}
                    onChange={(e) => setBasis(e.target.value)}
                    className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-xs bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-indigo-900 mb-1">Reason for Revision</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Tender Addendum 01, Structural re-design of transfer slab..."
                  className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg text-xs bg-white"
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Create & Activate Revision
                </button>
              </div>
            </form>
          )}

          {/* Revision Selector Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {revisions.map((rev) => (
              <button
                key={rev.revisionCode}
                onClick={() => setSelectedRevCode(rev.revisionCode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
                  selectedRevCode === rev.revisionCode
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{rev.revisionCode}</span>
                {rev.isFrozen && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            ))}
          </div>

          {/* Selected Revision Metadata Card */}
          {selectedRev && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-sm font-bold text-slate-900">{selectedRev.revisionCode}</span>
                    <span className="text-xs text-slate-500 ml-2">Created on {selectedRev.createdDate} by {selectedRev.createdBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">+{selectedRev.addedItemsCount} Added</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">{selectedRev.modifiedItemsCount} Modified</span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">-{selectedRev.removedItemsCount} Removed</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700">
                  <span className="font-semibold text-slate-900">Reason: </span>
                  {selectedRev.reason}
                </div>
                <div className="text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Drawing Basis: </span>
                  {selectedRev.drawingRevisionBasis}
                </div>
              </div>

              {/* Change Log Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-500" />
                  Item-Level Change Log ({selectedRev.changeLog.length})
                </h4>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Item Code</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">Change Type</th>
                        <th className="py-2 px-3">Previous Value</th>
                        <th className="py-2 px-3">New Value</th>
                        <th className="py-2 px-3 text-right">Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                      {selectedRev.changeLog.map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-semibold text-slate-800">{log.itemCode}</td>
                          <td className="py-2 px-3 font-sans text-slate-700 max-w-xs truncate">{log.description}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-2xs font-bold ${
                              log.changeType === 'ADDED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.changeType === 'QUANTITY_CHANGE'
                                ? 'bg-blue-100 text-blue-800'
                                : log.changeType === 'SPEC_CHANGE'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {log.changeType}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">{log.oldValue || '—'}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{log.newValue || '—'}</td>
                          <td className="py-2 px-3 text-right">
                            {log.delta !== undefined ? (
                              <span className={log.delta >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                                {log.delta >= 0 ? `+${log.delta}` : log.delta} ({log.percentChange}%)
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Revisions
          </button>
        </div>
      </div>
    </div>
  );
};
