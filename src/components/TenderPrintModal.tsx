/**
 * AI BOQ & Tender Estimation Engineer - Phase 13 Tender Print & Form of Tender Modal
 */

import React from 'react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';
import {
  TenderInfo,
  CommercialBidSummary,
  TenderSignatures,
  TenderAddendum,
  ScopeMatrixItem,
  ProvisionalSumItem,
  PrimeCostItem,
} from '../types/tender';

interface TenderPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderInfo: TenderInfo;
  commercialSummary: CommercialBidSummary;
  signatures: TenderSignatures;
  addenda: TenderAddendum[];
  provisionalSums: ProvisionalSumItem[];
  primeCostItems: PrimeCostItem[];
}

export const TenderPrintModal: React.FC<TenderPrintModalProps> = ({
  isOpen,
  onClose,
  tenderInfo,
  commercialSummary,
  signatures,
  addenda,
  provisionalSums,
  primeCostItems,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full">
        {/* Header - Hidden in Print */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-800">
              Form of Tender & Executive Commercial Proposal
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-800 space-y-6 print:p-0 print:space-y-4">
          {/* Document Masthead */}
          <div className="border-b-2 border-slate-800 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                FORM OF TENDER & COMMERCIAL PROPOSAL
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">
                FIDIC Contract Submission | Commercial Bid Division
              </p>
            </div>
            <div className="text-right text-xs">
              <span className="font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                {tenderInfo.currentTenderRevision}
              </span>
              <p className="text-slate-500 mt-1">Date: {tenderInfo.closingDate}</p>
            </div>
          </div>

          {/* Parties & Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200 print:bg-transparent">
            <div>
              <span className="text-slate-500 font-medium">To (The Employer):</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{tenderInfo.client}</p>
              <p className="text-slate-600">Consultant: {tenderInfo.consultant}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">From (The Tenderer):</span>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{tenderInfo.contractor}</p>
              <p className="text-slate-600">Tender Ref: {tenderInfo.tenderNumber}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Project Title:</span>
              <p className="font-semibold text-slate-800">{tenderInfo.project}</p>
              <p className="text-slate-600">Location: {tenderInfo.location}</p>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Contract Terms:</span>
              <p className="font-semibold text-slate-800">
                {tenderInfo.contractType} · Validity: {tenderInfo.validityDays} Days (Until {tenderInfo.validityExpiryDate})
              </p>
            </div>
          </div>

          {/* Tender Sum Covenant Banner */}
          <div className="bg-slate-900 text-white p-5 rounded-lg space-y-2">
            <div className="flex justify-between items-center text-xs uppercase tracking-wider text-slate-300">
              <span>Total Form of Tender Submission Sum</span>
              <span>Reconciled & Locked</span>
            </div>
            <div className="text-2xl font-black text-amber-300">
              {tenderInfo.currency || 'AED'} {commercialSummary.tenderGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-300 font-serif italic border-t border-slate-700 pt-2">
              Amount in words: <strong className="text-white not-italic">{commercialSummary.tenderGrandTotalInWords}</strong>
            </div>
          </div>

          {/* Commercial Breakdown Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Summary of Commercial Price Build-up
            </h3>
            <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-left">
                <tr>
                  <th className="py-2 px-3">Item</th>
                  <th className="py-2 px-3">Commercial Category / Description</th>
                  <th className="py-2 px-3 text-right">Amount ({tenderInfo.currency || 'AED'})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-1.5 px-3 font-mono">1.0</td>
                  <td className="py-1.5 px-3">Base Measured BOQ Direct & Indirect Works</td>
                  <td className="py-1.5 px-3 text-right font-mono">
                    {commercialSummary.baseBoqMeasuredTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-mono">2.0</td>
                  <td className="py-1.5 px-3">Provisional Sums ({provisionalSums.length} Defined Allocations)</td>
                  <td className="py-1.5 px-3 text-right font-mono">
                    {commercialSummary.provisionalSumsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-mono">3.0</td>
                  <td className="py-1.5 px-3">Prime Cost Items ({primeCostItems.length} Nominated Packages with Attendance)</td>
                  <td className="py-1.5 px-3 text-right font-mono">
                    {commercialSummary.primeCostTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-mono">4.0</td>
                  <td className="py-1.5 px-3">Selected Optional Additions</td>
                  <td className="py-1.5 px-3 text-right font-mono">
                    {commercialSummary.selectedOptionsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-1.5 px-3 font-mono">5.0</td>
                  <td className="py-1.5 px-3">SUBTOTAL BEFORE RISK & DISCOUNT</td>
                  <td className="py-1.5 px-3 text-right font-mono">
                    {commercialSummary.subtotalBeforeRiskDiscount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-mono">6.0</td>
                  <td className="py-1.5 px-3">Risk Allowance Contingency ({commercialSummary.riskAllowancePercent.toFixed(2)}%)</td>
                  <td className="py-1.5 px-3 text-right font-mono text-amber-700">
                    +{commercialSummary.riskAllowanceAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-mono">7.0</td>
                  <td className="py-1.5 px-3">Commercial Volume Discount ({commercialSummary.discountPercent.toFixed(2)}%)</td>
                  <td className="py-1.5 px-3 text-right font-mono text-emerald-700">
                    -{commercialSummary.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-1.5 px-3 font-mono">8.0</td>
                  <td className="py-1.5 px-3">NET COMMERCIAL SUB-TOTAL</td>
                  <td className="py-1.5 px-3 text-right font-mono">
                    {commercialSummary.subtotalAfterDiscountRisk.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-mono">9.0</td>
                  <td className="py-1.5 px-3">Statutory VAT / Sales Tax ({commercialSummary.taxVatPercent.toFixed(2)}%)</td>
                  <td className="py-1.5 px-3 text-right font-mono">
                    +{commercialSummary.taxVatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="bg-indigo-50/80 font-bold text-indigo-950">
                  <td className="py-2 px-3 font-mono">10.0</td>
                  <td className="py-2 px-3">FINAL TENDER GRAND TOTAL</td>
                  <td className="py-2 px-3 text-right font-mono text-sm">
                    {commercialSummary.tenderGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Addenda Acknowledgement */}
          {addenda.length > 0 && (
            <div className="text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700">Addenda Acknowledgement:</span>{' '}
              We formally acknowledge receipt and full commercial incorporation of Addenda Nos.{' '}
              <strong>{addenda.map((a) => a.addendumNo).join(', ')}</strong> into this tender return.
            </div>
          )}

          {/* Signatures & Execution Section */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Authorized Corporate Signatories
            </h4>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="border border-slate-200 p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Prepared By</span>
                <p className="font-bold text-slate-800">{signatures.preparedBy.name}</p>
                <p className="text-[11px] text-slate-500">{signatures.preparedBy.title}</p>
                <div className="pt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Signed ({signatures.preparedBy.date})
                </div>
              </div>

              <div className="border border-slate-200 p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Checked By</span>
                <p className="font-bold text-slate-800">{signatures.checkedBy.name}</p>
                <p className="text-[11px] text-slate-500">{signatures.checkedBy.title}</p>
                <div className="pt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Signed ({signatures.checkedBy.date})
                </div>
              </div>

              <div className="border border-slate-200 p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Approved By (Executive)</span>
                <p className="font-bold text-slate-800">{signatures.approvedBy.name}</p>
                <p className="text-[11px] text-slate-500">{signatures.approvedBy.title}</p>
                <div className="pt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Signed ({signatures.approvedBy.date})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Official Tender Submission Document</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Print Preview
          </button>
        </div>
      </div>
    </div>
  );
};
