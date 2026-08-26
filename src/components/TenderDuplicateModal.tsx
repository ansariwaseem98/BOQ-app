/**
 * AI BOQ & Tender Estimation Engineer - Phase 13 Tender Duplication Modal
 */

import React, { useState } from 'react';
import { X, Copy, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { TenderInfo } from '../types/tender';

interface TenderDuplicateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTender: TenderInfo;
  onConfirmDuplicate: (
    newTenderNumber: string,
    newProjectName: string,
    newClient: string,
    copiedModules: {
      copyScopeMatrix: boolean;
      copyInclusionsExclusions: boolean;
      copyProvisionalSums: boolean;
      copyPrimeCostItems: boolean;
      copyRateAnalysisTemplates: boolean;
      copyRiskRegister: boolean;
      copyChecklist: boolean;
    }
  ) => void;
}

export const TenderDuplicateModal: React.FC<TenderDuplicateModalProps> = ({
  isOpen,
  onClose,
  currentTender,
  onConfirmDuplicate,
}) => {
  const [newTenderNumber, setNewTenderNumber] = useState(
    `${currentTender.tenderNumber}-COPY`
  );
  const [newProjectName, setNewProjectName] = useState(
    `${currentTender.project} (Duplicate Clone)`
  );
  const [newClient, setNewClient] = useState(currentTender.client);

  const [copyScopeMatrix, setCopyScopeMatrix] = useState(true);
  const [copyInclusionsExclusions, setCopyInclusionsExclusions] = useState(true);
  const [copyProvisionalSums, setCopyProvisionalSums] = useState(true);
  const [copyPrimeCostItems, setCopyPrimeCostItems] = useState(true);
  const [copyRateAnalysisTemplates, setCopyRateAnalysisTemplates] = useState(true);
  const [copyRiskRegister, setCopyRiskRegister] = useState(true);
  const [copyChecklist, setCopyChecklist] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!newTenderNumber.trim() || !newProjectName.trim()) return;
    onConfirmDuplicate(newTenderNumber, newProjectName, newClient, {
      copyScopeMatrix,
      copyInclusionsExclusions,
      copyProvisionalSums,
      copyPrimeCostItems,
      copyRateAnalysisTemplates,
      copyRiskRegister,
      copyChecklist,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Copy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                Duplicate Tender as New Project Baseline
              </h2>
              <p className="text-xs text-slate-500">
                Transparent clone with explicit module selection. Prevents hidden data copying.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* Isolation Warning */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Project Isolation Protocol:</span>
              <p className="mt-0.5 text-amber-800">
                A new independent tender instance will be created. Select below which templates and registers you wish to copy. Verified drawing takeoff quantities from the current project will NOT be copied.
              </p>
            </div>
          </div>

          {/* New Tender Metadata */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                New Tender Number *
              </label>
              <input
                type="text"
                value={newTenderNumber}
                onChange={(e) => setNewTenderNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                New Project Name *
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Client Organization
              </label>
              <input
                type="text"
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          {/* Selectable Data to Copy */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Select Components to Clone:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={copyScopeMatrix}
                  onChange={(e) => setCopyScopeMatrix(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Scope & Responsibility Matrix</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={copyInclusionsExclusions}
                  onChange={(e) => setCopyInclusionsExclusions(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Inclusions & Exclusions List</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={copyProvisionalSums}
                  onChange={(e) => setCopyProvisionalSums(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Provisional Sums Register</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={copyPrimeCostItems}
                  onChange={(e) => setCopyPrimeCostItems(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Prime Cost (PC) Items</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={copyRateAnalysisTemplates}
                  onChange={(e) => setCopyRateAnalysisTemplates(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Unit Rate Build-Up Templates</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={copyRiskRegister}
                  onChange={(e) => setCopyRiskRegister(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Risk Register & Mitigation Plans</span>
              </label>
              <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-100 col-span-2">
                <input
                  type="checkbox"
                  checked={copyChecklist}
                  onChange={(e) => setCopyChecklist(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Submission Checklist Standard Template</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Copy className="w-4 h-4" />
            Create Cloned Tender Project
          </button>
        </div>
      </div>
    </div>
  );
};
