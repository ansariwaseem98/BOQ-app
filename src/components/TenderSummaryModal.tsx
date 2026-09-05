import React, { useState } from 'react';
import {
  X,
  DollarSign,
  PieChart,
  Building2,
  Layers,
  FileCheck,
  Download,
  Printer,
  Sparkles,
  CheckCircle2,
  Lock,
  History,
} from 'lucide-react';
import { TenderSummaryReport, PricingRevisionSnapshot } from '../types/rateAnalysis';

interface TenderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryReport: TenderSummaryReport;
  onExportExcel: () => void;
  onOpenPrintModal: () => void;
  onFreezePricing: () => void;
  pricingRevisions: PricingRevisionSnapshot[];
}

export const TenderSummaryModal: React.FC<TenderSummaryModalProps> = ({
  isOpen,
  onClose,
  summaryReport,
  onExportExcel,
  onOpenPrintModal,
  onFreezePricing,
  pricingRevisions,
}) => {
  const [activeSection, setActiveSection] = useState<'ELEMENTS' | 'DISCIPLINE' | 'BUILDING' | 'LEVELS' | 'REVISIONS'>('ELEMENTS');

  if (!isOpen) return null;

  const { costElements } = summaryReport;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                  Tender Pricing Summary & Executive Dashboard
                </h3>
                {summaryReport.isFrozen ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>Frozen ({summaryReport.pricingRevision})</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Active ({summaryReport.pricingRevision})
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Comprehensive cost build-up breakdown by engineering discipline, building asset, and floor level
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!summaryReport.isFrozen && (
              <button
                onClick={onFreezePricing}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Freeze Pricing (Lock Rev)</span>
              </button>
            )}
            <button
              onClick={onOpenPrintModal}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </button>
            <button
              onClick={onExportExcel}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grand Total Hero Banner */}
        <div className="bg-slate-900 text-white px-8 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Final Commercial Tender Bid Total
            </span>
            <div className="text-3xl font-black font-mono tracking-tight text-emerald-400">
              AED {summaryReport.tenderGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-normal text-slate-400 ml-2 uppercase">AED Total Sum</span>
            </div>
            <p className="text-xs text-slate-300 italic mt-1 max-w-2xl font-serif">
              "{summaryReport.tenderTotalWords}"
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Direct Cost:</span>
              <strong className="font-mono text-white">AED {costElements.directCostTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px]">Overhead ({costElements.overheadPercent.toFixed(1)}%):</span>
              <strong className="font-mono text-white">AED {costElements.overheadTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 block text-[10px]">Profit ({costElements.profitPercent.toFixed(1)}%):</span>
              <strong className="font-mono text-emerald-300">AED {costElements.profitTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveSection('ELEMENTS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSection === 'ELEMENTS' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Cost Elements Breakdown (%)
          </button>
          <button
            onClick={() => setActiveSection('DISCIPLINE')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSection === 'DISCIPLINE' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            By Discipline ({summaryReport.disciplineBreakdown.length})
          </button>
          <button
            onClick={() => setActiveSection('BUILDING')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSection === 'BUILDING' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            By Building & Area (AED/m²)
          </button>
          <button
            onClick={() => setActiveSection('LEVELS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSection === 'LEVELS' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            By Floor Level ({summaryReport.levelBreakdown.length})
          </button>
          <button
            onClick={() => setActiveSection('REVISIONS')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              activeSection === 'REVISIONS' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Pricing Revisions ({pricingRevisions.length})</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeSection === 'ELEMENTS' && (
            <div className="space-y-6">
              {/* Cost Elements Breakdown Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">Cost Element</th>
                      <th className="py-3 px-5">Classification</th>
                      <th className="py-3 px-5 text-right">Total Amount (AED)</th>
                      <th className="py-3 px-5 text-right">% of Tender Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="py-3 px-5 font-bold text-slate-900">1. Material Supply Cost</td>
                      <td className="py-3 px-5 text-slate-500">Direct Cost</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-900">AED {costElements.materialTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-indigo-600 font-bold">{costElements.materialPercent}%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-bold text-slate-900">2. Labour Trades & Productivity</td>
                      <td className="py-3 px-5 text-slate-500">Direct Cost</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-900">AED {costElements.labourTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-indigo-600 font-bold">{costElements.labourPercent}%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-bold text-slate-900">3. Plant & Equipment Machinery</td>
                      <td className="py-3 px-5 text-slate-500">Direct Cost</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-900">AED {costElements.equipmentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-indigo-600 font-bold">{costElements.equipmentPercent}%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-bold text-slate-900">4. Specialist Subcontract Packages</td>
                      <td className="py-3 px-5 text-slate-500">Direct Cost</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-900">AED {costElements.subcontractTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-indigo-600 font-bold">{costElements.subcontractPercent}%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-bold text-slate-900">5. Haulage & Site Logistics</td>
                      <td className="py-3 px-5 text-slate-500">Direct Cost</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-900">AED {costElements.transportTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-indigo-600 font-bold">{costElements.transportPercent}%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-bold text-slate-900">6. Testing, Formwork & Other Directs</td>
                      <td className="py-3 px-5 text-slate-500">Direct Cost</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-900">AED {costElements.otherTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-indigo-600 font-bold">{costElements.otherPercent}%</td>
                    </tr>

                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td className="py-3 px-5 text-slate-900 uppercase">SUBTOTAL: TOTAL DIRECT COST</td>
                      <td className="py-3 px-5 text-slate-700">Direct Sum</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-900">AED {costElements.directCostTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-900">100.0% (Base)</td>
                    </tr>

                    <tr>
                      <td className="py-3 px-5 font-bold text-slate-900">7. Site & Head Office Overhead</td>
                      <td className="py-3 px-5 text-slate-500">Indirect Markup ({costElements.overheadPercent.toFixed(1)}%)</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-900">AED {costElements.overheadTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-amber-600 font-bold">+{((costElements.overheadTotal / summaryReport.tenderGrandTotal) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-bold text-slate-900">8. Commercial Profit Margin</td>
                      <td className="py-3 px-5 text-slate-500">Commercial Margin ({costElements.profitPercent.toFixed(1)}%)</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-900">AED {costElements.profitTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-emerald-600 font-bold">+{((costElements.profitTotal / summaryReport.tenderGrandTotal) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-bold text-slate-900">9. Configured Statutory Tax / VAT</td>
                      <td className="py-3 px-5 text-slate-500">Statutory Duty ({costElements.taxPercent}%)</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-900">AED {costElements.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-600">+{((costElements.taxTotal / summaryReport.tenderGrandTotal) * 100).toFixed(1)}%</td>
                    </tr>

                    <tr className="bg-slate-900 text-white font-black text-sm">
                      <td className="py-4 px-5 uppercase">TENDER GRAND TOTAL</td>
                      <td className="py-4 px-5 text-slate-300 font-normal">All Directs + Indirects + Tax</td>
                      <td className="py-4 px-5 text-right font-mono text-emerald-400 text-base">
                        AED {summaryReport.tenderGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-5 text-right font-mono text-white">100.0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'DISCIPLINE' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Engineering Discipline</th>
                    <th className="py-3 px-5">Priced Items</th>
                    <th className="py-3 px-5 text-right">Direct Cost (AED)</th>
                    <th className="py-3 px-5 text-right">Overhead (AED)</th>
                    <th className="py-3 px-5 text-right">Profit (AED)</th>
                    <th className="py-3 px-5 text-right">Tender Amount (AED)</th>
                    <th className="py-3 px-5 text-right">% of Tender</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {summaryReport.disciplineBreakdown.map((d) => (
                    <tr key={d.discipline} className="hover:bg-slate-50/80">
                      <td className="py-3 px-5 font-bold text-slate-900">{d.discipline}</td>
                      <td className="py-3 px-5 text-slate-600 font-mono">{d.itemCount} items</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-800">AED {d.directCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-600">AED {d.overheadAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-600">AED {d.profitAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-indigo-700 font-black">AED {d.tenderAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-700 font-bold">{d.percentageOfTender}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'BUILDING' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-5">Building / Facility</th>
                      <th className="py-3 px-5">Priced Scope</th>
                      <th className="py-3 px-5">Gross Floor Area (GFA)</th>
                      <th className="py-3 px-5 text-right">Direct Cost (AED)</th>
                      <th className="py-3 px-5 text-right">Tender Amount (AED)</th>
                      <th className="py-3 px-5 text-right">Cost / m² (AED/m²)</th>
                      <th className="py-3 px-5 text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {summaryReport.buildingBreakdown.map((b) => (
                      <tr key={b.buildingName} className="hover:bg-slate-50/80">
                        <td className="py-3 px-5 font-bold text-slate-900">{b.buildingName}</td>
                        <td className="py-3 px-5 text-slate-600">{b.itemCount} BOQ items</td>
                        <td className="py-3 px-5 font-mono text-slate-700">
                          {b.isGfaVerified ? `${b.grossFloorAreaM2?.toLocaleString()} m² (Verified)` : 'Unverified Area'}
                        </td>
                        <td className="py-3 px-5 text-right font-mono text-slate-800">AED {b.directCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-5 text-right font-mono text-indigo-700 font-black">AED {b.tenderAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-5 text-right font-mono text-emerald-700 font-black">
                          {b.costPerM2 ? `AED ${b.costPerM2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / m²` : 'N/A'}
                        </td>
                        <td className="py-3 px-5 text-right font-mono text-slate-700 font-bold">{b.percentageOfTotal}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === 'LEVELS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5">Floor Level / Stage</th>
                    <th className="py-3 px-5 text-right">Direct Cost (AED)</th>
                    <th className="py-3 px-5 text-right">Tender Amount (AED)</th>
                    <th className="py-3 px-5 text-right">% of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {summaryReport.levelBreakdown.map((l) => (
                    <tr key={l.levelName} className="hover:bg-slate-50/80">
                      <td className="py-3 px-5 font-bold text-slate-900">{l.levelName}</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-800">AED {l.directCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-indigo-700 font-black">AED {l.tenderAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-3 px-5 text-right font-mono text-slate-700 font-bold">{l.percentageOfTotal}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'REVISIONS' && (
            <div className="space-y-4">
              {pricingRevisions.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                  No previous frozen pricing revisions recorded. Use <strong>Freeze Pricing</strong> to snapshot current pricing.
                </div>
              ) : (
                pricingRevisions.map((rev) => (
                  <div key={rev.revisionCode} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {rev.revisionCode}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{rev.reason}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Frozen by {rev.createdBy} on {rev.createdAt} | Scenario: {rev.scenarioUsed}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black font-mono text-slate-900">
                        AED {rev.tenderGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-slate-500">{rev.itemRatesSummary.length} items captured</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Project: {summaryReport.projectName} ({summaryReport.totalBoqItems} verified BOQ items)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};
