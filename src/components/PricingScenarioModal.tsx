import React, { useState } from 'react';
import {
  X,
  Sliders,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  PricingScenario,
  ValueEngineeringProposal,
  RateAnalysisRecord,
} from '../types/rateAnalysis';
import { UnifiedBoqItem } from '../types';
import { RateAnalysisEngine } from '../engine/rateAnalysisEngine';

interface PricingScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: PricingScenario[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  onUpdateScenario: (scenario: PricingScenario) => void;
  veProposals: ValueEngineeringProposal[];
  onUpdateVeProposal: (proposal: ValueEngineeringProposal) => void;
  boqItems: UnifiedBoqItem[];
  rateAnalyses: RateAnalysisRecord[];
}

export const PricingScenarioModal: React.FC<PricingScenarioModalProps> = ({
  isOpen,
  onClose,
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onUpdateScenario,
  veProposals,
  onUpdateVeProposal,
  boqItems,
  rateAnalyses,
}) => {
  const [activeTab, setActiveTab] = useState<'SCENARIOS' | 'VALUE_ENGINEERING'>('SCENARIOS');
  const [editingScenario, setEditingScenario] = useState<PricingScenario | null>(null);

  if (!isOpen) return null;

  // Calculate totals for each scenario using strictly the same verified quantities
  const scenarioEvaluations = scenarios.map((sc) => {
    let directCost = 0;
    let overhead = 0;
    let profit = 0;
    let tax = 0;
    let tenderTotal = 0;

    boqItems.forEach((boq) => {
      const rateRec = rateAnalyses.find((r) => r.boqItemId === boq.id || r.itemCode === boq.itemCode);
      if (rateRec) {
        const evalRate = RateAnalysisEngine.evaluateScenarioRate(rateRec, sc);
        const qty = boq.finalQuantity || 0;
        directCost += evalRate.directCost * qty;
        overhead += evalRate.overheadAmount * qty;
        profit += evalRate.profitAmount * qty;
        tax += evalRate.taxAmount * qty;
        tenderTotal += evalRate.finalRate * qty;
      }
    });

    return {
      scenario: sc,
      directCost,
      overhead,
      profit,
      tax,
      tenderTotal,
    };
  });

  const activeEval = scenarioEvaluations.find((e) => e.scenario.id === activeScenarioId) || scenarioEvaluations[0];

  const totalVeSavings = veProposals
    .filter((p) => p.consultantApprovalStatus === 'APPROVED')
    .reduce((sum, p) => sum + p.savingsAmount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">
                Pricing Scenarios & Value Engineering
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Compare multi-tier bidding strategies and engineering optimization on verified quantities
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

        {/* Tab Switcher */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="bg-slate-100 p-0.5 rounded-lg flex items-center">
            <button
              onClick={() => setActiveTab('SCENARIOS')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                activeTab === 'SCENARIOS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Alternative Pricing Scenarios ({scenarios.length})
            </button>
            <button
              onClick={() => setActiveTab('VALUE_ENGINEERING')}
              className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                activeTab === 'VALUE_ENGINEERING' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Value Engineering Proposals ({veProposals.length})</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Verified Scope Items: <strong>{boqItems.length}</strong>
          </span>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {activeTab === 'SCENARIOS' ? (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900">
                  <strong>Engineering Quantity Integrity Guarantee:</strong> All pricing scenarios strictly share the identical verified takeoff quantities extracted and calculated from engineering drawings. Only unit rates, overheads, and margin multipliers vary.
                </div>
              </div>

              {/* Scenario Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {scenarioEvaluations.map(({ scenario, directCost, overhead, profit, tax, tenderTotal }) => {
                  const isActive = scenario.id === activeScenarioId;
                  const delta = tenderTotal - (activeEval?.tenderTotal || tenderTotal);

                  return (
                    <div
                      key={scenario.id}
                      className={`rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                        isActive
                          ? 'bg-white border-indigo-600 shadow-lg ring-2 ring-indigo-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {scenario.code}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                              Active Bid
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-black text-slate-900 mb-1">{scenario.name}</h4>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">{scenario.description}</p>

                        <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-100 mb-4 text-xs font-medium">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Direct Cost:</span>
                            <span className="font-mono text-slate-900 font-bold">${directCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Overhead ({scenario.overheadPercent}%):</span>
                            <span className="font-mono text-slate-700">${overhead.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Profit ({scenario.profitPercent}%):</span>
                            <span className="font-mono text-slate-700">${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tax ({scenario.taxRatePercent}%):</span>
                            <span className="font-mono text-slate-700">${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black">
                            <span className="text-slate-900">Tender Total:</span>
                            <span className="font-mono text-indigo-700">${tenderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>

                        {!isActive && (
                          <div className="text-[11px] flex items-center justify-between px-2 py-1 bg-slate-100 rounded-lg text-slate-600 mb-4 font-mono">
                            <span>Variance vs Active:</span>
                            <strong className={delta < 0 ? 'text-emerald-700' : 'text-rose-700'}>
                              {delta < 0 ? `-$${Math.abs(delta).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `+$${delta.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </strong>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onSelectScenario(scenario.id)}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isActive ? 'Current Active Scenario' : 'Apply This Scenario'}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Side-by-side Comparison Matrix Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                    Commercial Multipliers & Parameter Matrix
                  </h4>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Scenario</th>
                      <th className="py-2.5 px-4">Material Multiplier</th>
                      <th className="py-2.5 px-4">Labour Multiplier</th>
                      <th className="py-2.5 px-4">Overhead %</th>
                      <th className="py-2.5 px-4">Profit %</th>
                      <th className="py-2.5 px-4">Tax %</th>
                      <th className="py-2.5 px-4 text-right">Tender Total ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {scenarioEvaluations.map(({ scenario, tenderTotal }) => (
                      <tr key={scenario.id} className={scenario.id === activeScenarioId ? 'bg-indigo-50/40 font-bold' : ''}>
                        <td className="py-3 px-4 text-slate-900 font-sans">{scenario.name}</td>
                        <td className="py-3 px-4 text-slate-700">{(scenario.materialCostMultiplier * 100).toFixed(0)}%</td>
                        <td className="py-3 px-4 text-slate-700">{(scenario.labourCostMultiplier * 100).toFixed(0)}%</td>
                        <td className="py-3 px-4 text-slate-700">{scenario.overheadPercent}%</td>
                        <td className="py-3 px-4 text-slate-700">{scenario.profitPercent}%</td>
                        <td className="py-3 px-4 text-slate-700">{scenario.taxRatePercent}%</td>
                        <td className="py-3 px-4 text-right text-indigo-700 font-black">
                          ${tenderTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Value Engineering Tab */
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    Total Approved Value Engineering Savings
                  </h4>
                  <p className="text-xs text-emerald-800">
                    Net commercial savings achievable through approved alternative specifications
                  </p>
                </div>
                <div className="text-xl font-black font-mono text-emerald-700">
                  ${totalVeSavings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div className="space-y-4">
                {veProposals.map((ve) => (
                  <div key={ve.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {ve.itemCode}
                          </span>
                          <h5 className="text-xs font-black text-slate-900">{ve.itemDescription}</h5>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Verified Takeoff Quantity: {ve.verifiedQuantity} {ve.unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={ve.consultantApprovalStatus}
                          onChange={(e) =>
                            onUpdateVeProposal({
                              ...ve,
                              consultantApprovalStatus: e.target.value as any,
                            })
                          }
                          className={`px-3 py-1 text-xs font-bold rounded-lg border ${
                            ve.consultantApprovalStatus === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : ve.consultantApprovalStatus === 'REJECTED'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          <option value="PENDING">PENDING APPROVAL</option>
                          <option value="APPROVED">APPROVED BY CONSULTANT</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Original Spec */}
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                          Base Tender Specification
                        </span>
                        <p className="text-slate-800 font-medium mb-2">{ve.originalSpecification}</p>
                        <div className="flex justify-between font-mono">
                          <span className="text-slate-500">Rate: ${ve.originalRate.toFixed(2)}/{ve.unit}</span>
                          <span className="text-slate-900 font-bold">Total: ${ve.originalTotalAmount.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Alternative Spec */}
                      <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-200">
                        <span className="text-[10px] font-bold uppercase text-emerald-800 block mb-1">
                          Proposed Alternative Specification
                        </span>
                        <p className="text-slate-800 font-medium mb-2">{ve.alternativeSpecification}</p>
                        <div className="flex justify-between font-mono">
                          <span className="text-emerald-700">Rate: ${ve.alternativeRate.toFixed(2)}/{ve.unit}</span>
                          <span className="text-emerald-900 font-bold">Total: ${ve.alternativeTotalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <p className="text-slate-500 italic max-w-xl">
                        Justification: {ve.justificationNotes}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-500">Savings:</span>
                        <strong className="font-mono text-emerald-700 text-sm">
                          ${ve.savingsAmount.toFixed(2)} ({ve.savingsPercent}%)
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Active Scenario: <strong>{activeEval?.scenario.name}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            Close Scenarios
          </button>
        </div>
      </div>
    </div>
  );
};
