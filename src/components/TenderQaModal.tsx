/**
 * AI BOQ & Tender Estimation Engineer - Phase 13 Tender QA Pre-Flight Modal
 */

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  FileCheck,
  AlertOctagon,
  Lock,
} from 'lucide-react';
import { TenderQaReport, TenderQaPillarCheck } from '../types/tender';

interface TenderQaModalProps {
  isOpen: boolean;
  onClose: () => void;
  qaReport: TenderQaReport;
  onProceedToSubmission: () => void;
}

export const TenderQaModal: React.FC<TenderQaModalProps> = ({
  isOpen,
  onClose,
  qaReport,
  onProceedToSubmission,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                qaReport.overallReadyForSubmission
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {qaReport.overallReadyForSubmission ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <AlertOctagon className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Tender Pre-Flight Commercial QA Gate
              </h2>
              <p className="text-xs text-slate-500">
                8-Pillar Integrity & Compliance Audit prior to Final Submission Authorization
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

        {/* Overall Status Banner */}
        <div
          className={`px-6 py-3 border-b flex items-center justify-between ${
            qaReport.overallReadyForSubmission
              ? 'bg-emerald-50/80 border-emerald-100 text-emerald-900'
              : 'bg-rose-50/80 border-rose-100 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {qaReport.overallReadyForSubmission ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <div>
              <span className="font-semibold text-sm">
                {qaReport.overallReadyForSubmission
                  ? 'Tender Package Verified & Ready for Submission'
                  : 'Tender Submission Blocked by Quality Gate'}
              </span>
              <p className="text-xs opacity-85">
                {qaReport.criticalBlockersCount} Critical Blockers · {qaReport.warningsCount} Warnings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                qaReport.overallReadyForSubmission
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}
            >
              {qaReport.overallReadyForSubmission ? 'READY' : 'NOT READY'}
            </span>
          </div>
        </div>

        {/* Content Body: 8 Pillars Grid */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/40">
          {/* Critical Blockers Alert if any */}
          {qaReport.blockerMessages.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                Critical Submission Blockers ({qaReport.blockerMessages.length})
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-xs text-rose-700">
                {qaReport.blockerMessages.map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 8 Pillars Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Object.entries(qaReport.pillars) as [string, TenderQaPillarCheck][]).map(([key, pillar]) => {
              const isPassed = pillar.status === 'PASSED';
              const isWarning = pillar.status === 'WARNING';
              return (
                <div
                  key={key}
                  className={`p-4 rounded-lg border bg-white shadow-xs space-y-2 transition-all ${
                    isPassed
                      ? 'border-emerald-200'
                      : isWarning
                      ? 'border-amber-200'
                      : 'border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                      <h4 className="text-sm font-semibold text-slate-800">{pillar.pillarName}</h4>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isPassed
                          ? 'bg-emerald-100 text-emerald-800'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {pillar.status}
                    </span>
                  </div>

                  <ul className="space-y-1 text-xs text-slate-600 pl-4 list-disc max-h-24 overflow-y-auto">
                    {pillar.details.map((d, idx) => (
                      <li key={idx}>{d}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close QA Report
          </button>

          {qaReport.overallReadyForSubmission ? (
            <button
              onClick={() => {
                onProceedToSubmission();
                onClose();
              }}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              Generate Final Submission Package
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">
              <Lock className="w-4 h-4" />
              Submission Blocked: Resolve all critical items above to unlock package generation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
