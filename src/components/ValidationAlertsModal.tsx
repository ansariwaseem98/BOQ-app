import React from 'react';
import { X, AlertTriangle, AlertCircle, Info, ShieldCheck, ArrowRight } from 'lucide-react';
import { ValidationIssue } from '../types';

interface ValidationAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  issues?: ValidationIssue[];
  onSelectElementFromIssue?: (elementId: string) => void;
  onNavigateToElement?: (elementId: string) => void;
}

export const ValidationAlertsModal: React.FC<ValidationAlertsModalProps> = ({
  isOpen,
  onClose,
  issues = [],
  onSelectElementFromIssue,
  onNavigateToElement,
}) => {
  if (!isOpen) return null;

  const handleNavigate = onSelectElementFromIssue || onNavigateToElement;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Engineering QA & Validation Warnings ({issues.length})
              </h2>
              <p className="text-xs text-slate-500">
                Automated engineering sanity rules & cross-schedule checks
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {issues.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500">
              <ShieldCheck className="w-12 h-12 text-emerald-600 mb-2" />
              <h4 className="text-sm font-bold text-slate-900">All QA Rules Passed</h4>
              <p className="text-xs text-slate-500 mt-1">
                No dimensional anomalies, negative quantities, or duplicate tags detected.
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-4 rounded-lg border text-xs space-y-2 ${
                  issue.severity === 'error'
                    ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                    : issue.severity === 'warning'
                    ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                    : 'bg-indigo-50/60 border-indigo-200 text-indigo-900'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        issue.severity === 'error'
                          ? 'bg-rose-100 text-rose-800'
                          : issue.severity === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {issue.severity}
                    </span>
                    <span className="font-mono text-slate-500">{issue.ruleCode}</span>
                  </div>

                  {issue.elementId && handleNavigate && (
                    <button
                      onClick={() => {
                        handleNavigate(issue.elementId!);
                        onClose();
                      }}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect {issue.elementId}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <p className="font-semibold text-slate-900">{issue.message}</p>
                <p className="text-slate-600">{issue.suggestedRemedy}</p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
