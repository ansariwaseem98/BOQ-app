import React, { useState } from 'react';
import { X, Lock, Unlock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { BoqQualityDashboardData } from '../types';

interface BoqFreezeModalProps {
  isFrozen: boolean;
  activeRevision: string;
  qualityData: BoqQualityDashboardData;
  onConfirmToggleFreeze: (frozenBy: string) => void;
  onClose: () => void;
}

export const BoqFreezeModal: React.FC<BoqFreezeModalProps> = ({
  isFrozen,
  activeRevision,
  qualityData,
  onConfirmToggleFreeze,
  onClose,
}) => {
  const [authorizedPerson, setAuthorizedPerson] = useState('Chief Estimator / Commercial Lead');

  const handleAction = () => {
    onConfirmToggleFreeze(authorizedPerson);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 text-white flex items-center justify-between ${
          isFrozen ? 'bg-amber-900' : 'bg-slate-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              {isFrozen ? <Unlock className="w-5 h-5 text-amber-300" /> : <Lock className="w-5 h-5 text-indigo-300" />}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                {isFrozen ? 'Unfreeze Active BOQ' : 'Freeze BOQ Revision'}
              </h3>
              <p className="text-xs text-white/70 font-mono">{activeRevision}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-600">
          {!isFrozen ? (
            <>
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-950 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-indigo-900">
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  Read-Only Governance Lock
                </div>
                <p>
                  Freezing <strong>{activeRevision}</strong> will lock all {qualityData.totalItems} line items against direct manual edits. Any subsequent modifications will require branching a new official revision (e.g. BOQ Rev 01).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Authorizing Sign-off Party</label>
                <input
                  type="text"
                  value={authorizedPerson}
                  onChange={(e) => setAuthorizedPerson(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-medium text-slate-800"
                  required
                />
              </div>
            </>
          ) : (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-950 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                <Unlock className="w-4 h-4 text-amber-600" />
                Unlocking BOQ for Direct Edits
              </div>
              <p>
                Unfreezing this revision re-enables direct modification of item descriptions, specifications, units, and quantities.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAction}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors flex items-center gap-1.5 ${
              isFrozen
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isFrozen ? 'Confirm Unfreeze' : 'Lock & Freeze BOQ'}
          </button>
        </div>
      </div>
    </div>
  );
};
