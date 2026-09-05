import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  Plus,
  Trash2,
  Lock,
  Download,
  Printer,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Sliders,
  Building,
  Sparkles,
  Calculator,
  History,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,
  RefreshCw,
  Zap,
  ArrowRight,
  Database,
  Tag,
  Copy,
} from 'lucide-react';
import {
  UnifiedBoqItem,
  ProjectData,
} from '../types';
import {
  RateAnalysisRecord,
  RateComponent,
  RateComponentCategory,
  RateDatabaseItem,
  SupplierQuoteItem,
  PricingScenario,
  ValueEngineeringProposal,
  PricingRevisionSnapshot,
  CurrencyExchangeRate,
} from '../types/rateAnalysis';
import { RateAnalysisEngine } from '../engine/rateAnalysisEngine';
import { RateAnalysisExcelExportEngine } from '../engine/rateAnalysisExcelExportEngine';
import {
  INITIAL_RATE_DATABASE,
  INITIAL_SUPPLIER_QUOTES,
  INITIAL_PRICING_SCENARIOS,
  INITIAL_RATE_TEMPLATES,
  INITIAL_EXCHANGE_RATES,
  INITIAL_VALUE_ENGINEERING_PROPOSALS,
} from '../data/rateDatabaseInitialData';
import { RateDatabaseModal } from './RateDatabaseModal';
import { SupplierQuotesModal } from './SupplierQuotesModal';
import { PricingScenarioModal } from './PricingScenarioModal';
import { TenderSummaryModal } from './TenderSummaryModal';
import { PricingQualityGateModal } from './PricingQualityGateModal';
import { RateAnalysisPrintModal } from './RateAnalysisPrintModal';
import { RateAnalysisTestSuiteModal } from './RateAnalysisTestSuiteModal';

interface RateAnalysisWorkspaceProps {
  project: ProjectData | null;
  unifiedBoqItems: UnifiedBoqItem[];
  onUpdateBoqRate?: (itemId: string, newRate: number) => void;
}

export const RateAnalysisWorkspace: React.FC<RateAnalysisWorkspaceProps> = ({
  project,
  unifiedBoqItems,
  onUpdateBoqRate,
}) => {
  // Master state
  const [rateAnalyses, setRateAnalyses] = useState<RateAnalysisRecord[]>(() =>
    RateAnalysisEngine.initializeRateAnalyses(unifiedBoqItems)
  );

  const [rateDatabase, setRateDatabase] = useState<RateDatabaseItem[]>(INITIAL_RATE_DATABASE);
  const [supplierQuotes, setSupplierQuotes] = useState<SupplierQuoteItem[]>(INITIAL_SUPPLIER_QUOTES);
  const [scenarios, setScenarios] = useState<PricingScenario[]>(INITIAL_PRICING_SCENARIOS);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('SC-NORMAL');
  const [exchangeRates, setExchangeRates] = useState<CurrencyExchangeRate[]>(INITIAL_EXCHANGE_RATES);
  const [veProposals, setVeProposals] = useState<ValueEngineeringProposal[]>(INITIAL_VALUE_ENGINEERING_PROPOSALS);

  // Selection state
  const [selectedBoqId, setSelectedBoqId] = useState<string>(
    unifiedBoqItems.length > 0 ? unifiedBoqItems[0].id : ''
  );
  const [searchBoq, setSearchBoq] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PRICED' | 'UNPRICED' | 'REVIEW'>('ALL');
  const [activeCategoryTab, setActiveCategoryTab] = useState<RateComponentCategory | 'ALL'>('ALL');
  const [bottomTab, setBottomTab] = useState<'FORMULA' | 'SOURCE' | 'AUDIT' | 'OVERRIDE'>('FORMULA');

  // Override note temp state
  const [overrideInputRate, setOverrideInputRate] = useState<string>('');
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Freeze & Revision state
  const [isFrozen, setIsFrozen] = useState(false);
  const [pricingRevisions, setPricingRevisions] = useState<PricingRevisionSnapshot[]>([]);

  // Modals state
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [showQuotesModal, setShowQuotesModal] = useState(false);
  const [showScenariosModal, setShowScenariosModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showQualityGateModal, setShowQualityGateModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showTestSuiteModal, setShowTestSuiteModal] = useState(false);

  // Active scenario object
  const activeScenario = useMemo(
    () => scenarios.find((s) => s.id === activeScenarioId) || scenarios[0],
    [scenarios, activeScenarioId]
  );

  // Selected BOQ item
  const selectedBoq = useMemo(
    () => unifiedBoqItems.find((b) => b.id === selectedBoqId) || unifiedBoqItems[0],
    [unifiedBoqItems, selectedBoqId]
  );

  // Selected Rate Analysis record
  const selectedRateAnalysis = useMemo(
    () =>
      rateAnalyses.find(
        (r) => r.boqItemId === selectedBoq?.id || r.itemCode === selectedBoq?.itemCode
      ) || null,
    [rateAnalyses, selectedBoq]
  );

  // QA quality gate evaluation
  const qaReport = useMemo(
    () => RateAnalysisEngine.runPricingQaQualityGate(unifiedBoqItems, rateAnalyses),
    [unifiedBoqItems, rateAnalyses]
  );

  // Tender summary report
  const tenderSummary = useMemo(
    () =>
      RateAnalysisEngine.generateTenderSummaryReport(
        project?.id || 'PROJ-001',
        project?.project?.name || 'Project Bid',
        unifiedBoqItems,
        rateAnalyses,
        activeScenario,
        isFrozen,
        isFrozen ? 'PRICING REV 00' : 'ACTIVE DRAFT'
      ),
    [project, unifiedBoqItems, rateAnalyses, activeScenario, isFrozen]
  );

  // Filtered BOQ list
  const filteredBoqItems = useMemo(() => {
    return unifiedBoqItems.filter((b) => {
      const matchSearch =
        b.itemCode.toLowerCase().includes(searchBoq.toLowerCase()) ||
        b.description.toLowerCase().includes(searchBoq.toLowerCase()) ||
        b.discipline.toLowerCase().includes(searchBoq.toLowerCase());

      const matchDisc = filterDiscipline === 'ALL' || b.discipline === filterDiscipline;

      const rateRec = rateAnalyses.find((r) => r.boqItemId === b.id || r.itemCode === b.itemCode);
      let matchStat = true;
      if (filterStatus === 'PRICED') {
        matchStat = Boolean(rateRec && rateRec.finalRate > 0 && rateRec.status === 'PRICED');
      } else if (filterStatus === 'UNPRICED') {
        matchStat = !rateRec || rateRec.finalRate <= 0 || rateRec.components.length === 0;
      } else if (filterStatus === 'REVIEW') {
        matchStat = Boolean(rateRec && (rateRec.unitMismatch || rateRec.isExpired || rateRec.isUserOverridden));
      }

      return matchSearch && matchDisc && matchStat;
    });
  }, [unifiedBoqItems, rateAnalyses, searchBoq, filterDiscipline, filterStatus]);

  // Discipline list for filtering
  const disciplines = useMemo(() => {
    return ['ALL', ...Array.from(new Set(unifiedBoqItems.map((b) => b.discipline)))];
  }, [unifiedBoqItems]);

  // Helper: Update a Rate Analysis Record
  const handleUpdateCurrentRateAnalysis = (updater: (prev: RateAnalysisRecord) => RateAnalysisRecord) => {
    if (!selectedRateAnalysis) return;

    setRateAnalyses((prev) =>
      prev.map((ra) => {
        if (ra.id === selectedRateAnalysis.id) {
          const updated = updater(ra);
          // Recalculate build-up
          const buildUp = RateAnalysisEngine.calculateRateBuildUp(
            updated.components,
            updated.overheadPercent,
            updated.profitPercent,
            updated.taxEnabled,
            updated.taxRatePercent,
            updated.overheadType,
            updated.profitType
          );
          const finalRecord = {
            ...updated,
            ...buildUp,
            lastModifiedAt: new Date().toISOString(),
          };

          // Synchronize with parent applet if handler provided
          if (onUpdateBoqRate && selectedBoq) {
            onUpdateBoqRate(selectedBoq.id, finalRecord.finalRate);
          }

          return finalRecord;
        }
        return ra;
      })
    );
  };

  // Add Component to current analysis
  const handleAddComponent = (cat: RateComponentCategory = 'MATERIAL') => {
    if (!selectedRateAnalysis) return;

    const newComp: RateComponent = {
      id: `RC-${selectedRateAnalysis.itemCode}-${Date.now()}`,
      category: cat,
      description: `New ${cat} Component`,
      unit: cat === 'LABOUR' ? 'man-day' : cat === 'EQUIPMENT' ? 'hour' : 'm³',
      consumption: 1.0,
      unitRate: 10.0,
      wastagePercent: cat === 'MATERIAL' ? 2.5 : 0,
      amount: 10.0,
      source: 'Rate Database',
      date: new Date().toISOString().split('T')[0],
      currency: 'AED',
    };

    handleUpdateCurrentRateAnalysis((prev) => ({
      ...prev,
      components: [...prev.components, newComp],
      auditTrail: [
        ...prev.auditTrail,
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: 'Lead Estimator',
          action: 'MODIFIED',
          reason: `Added ${cat} component: ${newComp.description}`,
        },
      ],
    }));
  };

  // Delete Component
  const handleDeleteComponent = (compId: string) => {
    handleUpdateCurrentRateAnalysis((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.id !== compId),
      auditTrail: [
        ...prev.auditTrail,
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: 'Lead Estimator',
          action: 'MODIFIED',
          reason: 'Removed component from build-up',
        },
      ],
    }));
  };

  // Update specific component
  const handleUpdateComponent = (compId: string, field: keyof RateComponent, value: any) => {
    handleUpdateCurrentRateAnalysis((prev) => ({
      ...prev,
      components: prev.components.map((c) => {
        if (c.id === compId) {
          const updated = { ...c, [field]: value };
          // recalculate component amount
          const consumption = Math.max(0, updated.consumption || 0);
          const unitRate = Math.max(0, updated.unitRate || 0);
          const wastage = Math.max(0, updated.wastagePercent || 0);
          const amt = consumption * (1 + wastage / 100) * unitRate;
          updated.amount = Number(amt.toFixed(4));
          return updated;
        }
        return c;
      }),
    }));
  };

  // Apply Rate Template
  const handleApplyTemplate = (templateId: string) => {
    const template = INITIAL_RATE_TEMPLATES.find((t) => t.id === templateId);
    if (!template || !selectedRateAnalysis) return;

    const newComponents: RateComponent[] = template.defaultComponents.map((tc, idx) => ({
      id: `RC-${selectedRateAnalysis.itemCode}-${idx + 1}`,
      category: tc.category,
      description: tc.description,
      unit: tc.unit,
      consumption: tc.defaultConsumption,
      unitRate: tc.suggestedRate,
      wastagePercent: tc.wastagePercent,
      amount: tc.defaultConsumption * (1 + (tc.wastagePercent || 0) / 100) * tc.suggestedRate,
      source: 'Template Catalog',
      date: new Date().toISOString().split('T')[0],
      currency: 'AED',
    }));

    handleUpdateCurrentRateAnalysis((prev) => ({
      ...prev,
      components: newComponents,
      templateId: template.id,
      auditTrail: [
        ...prev.auditTrail,
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: 'Lead Estimator',
          action: 'MODIFIED',
          reason: `Applied engineering rate template: ${template.name}`,
        },
      ],
    }));
  };

  // Apply Manual Rate Override
  const handleApplyOverride = (e: React.FormEvent) => {
    e.preventDefault();
    const rateVal = parseFloat(overrideInputRate);
    if (isNaN(rateVal) || rateVal < 0 || !overrideReason.trim() || !selectedRateAnalysis) return;

    const oldRate = selectedRateAnalysis.finalRate;

    handleUpdateCurrentRateAnalysis((prev) => ({
      ...prev,
      finalRate: rateVal,
      isUserOverridden: true,
      overrideReason: overrideReason,
      auditTrail: [
        ...prev.auditTrail,
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: 'Lead Estimator',
          action: 'OVERRIDDEN',
          oldRate,
          newRate: rateVal,
          reason: overrideReason,
        },
      ],
    }));

    setOverrideInputRate('');
    setOverrideReason('');
  };

  // Revert Manual Override
  const handleRevertOverride = () => {
    if (!selectedRateAnalysis) return;
    const dbRate = selectedRateAnalysis.databaseReferenceRate || selectedRateAnalysis.directCost * 1.25;

    handleUpdateCurrentRateAnalysis((prev) => ({
      ...prev,
      isUserOverridden: false,
      overrideReason: undefined,
      auditTrail: [
        ...prev.auditTrail,
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: 'Lead Estimator',
          action: 'MODIFIED',
          reason: 'Reverted manual override back to component rate build-up calculation.',
        },
      ],
    }));
  };

  // Freeze Pricing
  const handleFreezePricing = () => {
    const revCode = `PRICING REV 0${pricingRevisions.length}`;
    const newSnapshot: PricingRevisionSnapshot = {
      revisionCode: revCode,
      createdAt: new Date().toISOString(),
      createdBy: 'Lead Estimator (Commercial Director)',
      scenarioUsed: activeScenario.name,
      reason: 'Formal Tender Baseline Freeze for Commercial Submission',
      isFrozen: true,
      frozenAt: new Date().toISOString(),
      frozenBy: 'Lead Estimator',
      totalDirectCost: tenderSummary.costElements.directCostTotal,
      totalOverhead: tenderSummary.costElements.overheadTotal,
      totalProfit: tenderSummary.costElements.profitTotal,
      totalTax: tenderSummary.costElements.taxTotal,
      tenderGrandTotal: tenderSummary.tenderGrandTotal,
      rateChangesCount: rateAnalyses.filter((r) => r.isUserOverridden).length,
      itemRatesSummary: rateAnalyses.map((r) => {
        const boq = unifiedBoqItems.find((b) => b.id === r.boqItemId || b.itemCode === r.itemCode);
        const qty = boq?.finalQuantity || 1;
        return {
          boqItemId: r.boqItemId,
          itemCode: r.itemCode,
          verifiedQuantity: qty,
          unit: r.unit,
          finalRate: r.finalRate,
          totalAmount: qty * r.finalRate,
        };
      }),
    };

    setPricingRevisions((prev) => [newSnapshot, ...prev]);
    setIsFrozen(true);
  };

  // Export Excel
  const handleExportExcel = () => {
    const buffer = RateAnalysisExcelExportEngine.generateRateAnalysisWorkbook(
      project,
      unifiedBoqItems,
      rateAnalyses,
      rateDatabase,
      supplierQuotes,
      scenarios,
      veProposals,
      activeScenario
    );

    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RATE_ANALYSIS_TENDER_PACKAGE_${project?.meta?.projectNumber || 'PRJ'}_${activeScenario.code}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 font-sans select-none overflow-hidden">
      {/* Top Action & Navigation Bar */}
      <header className="px-6 py-3 bg-slate-900 text-white border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-tight uppercase text-white">
                Rate Analysis & Tender Pricing Engine
              </h2>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">
                Phase 12
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Verified BOQ Quantities Linked • Zero Drawing Mutability • Granular Cost Build-up
            </p>
          </div>
        </div>

        {/* Commercial Highlights Banner */}
        <div className="flex items-center gap-2 bg-slate-800/90 px-4 py-1.5 rounded-xl border border-slate-700 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Scenario:</span>
            <select
              value={activeScenarioId}
              onChange={(e) => setActiveScenarioId(e.target.value)}
              className="bg-slate-900 text-emerald-400 font-bold px-2.5 py-1 rounded text-xs border border-slate-700 focus:outline-hidden"
            >
              {scenarios.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.name} ({sc.code})
                </option>
              ))}
            </select>
          </div>

          <div className="h-5 w-px bg-slate-700 mx-2" />

          <div>
            <span className="text-slate-400 text-[10px] uppercase font-bold block">Tender Bid Total:</span>
            <strong className="font-mono text-emerald-400 text-sm font-black">
              AED {tenderSummary.tenderGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowQualityGateModal(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
              qaReport.qualityGatePassed
                ? 'bg-emerald-700/80 hover:bg-emerald-700 text-white'
                : 'bg-rose-700/90 hover:bg-rose-700 text-white animate-pulse'
            }`}
          >
            {qaReport.qualityGatePassed ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
            <span>QA Quality Gate ({qaReport.qualityGatePassed ? 'PASS' : 'ISSUES'})</span>
          </button>

          <button
            onClick={() => setShowDatabaseModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Rate Catalog</span>
          </button>

          <button
            onClick={() => setShowQuotesModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <Building className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quotes ({supplierQuotes.length})</span>
          </button>

          <button
            onClick={() => setShowScenariosModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Scenarios & VE</span>
          </button>

          <button
            onClick={() => setShowSummaryModal(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>Tender Summary</span>
          </button>

          <button
            onClick={() => setShowTestSuiteModal(true)}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>30-Rule Tests</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* LEFT PANE: VERIFIED BOQ ITEMS LIST */}
        {/* ========================================================================= */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-700 tracking-wider">
                Verified BOQ Items ({filteredBoqItems.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Drawing Quantities</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search code, scope..."
                value={searchBoq}
                onChange={(e) => setSearchBoq(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <select
                value={filterDiscipline}
                onChange={(e) => setFilterDiscipline(e.target.value)}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-medium"
              >
                {disciplines.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRICED">Priced</option>
                <option value="UNPRICED">Unpriced</option>
                <option value="REVIEW">Review Flag</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredBoqItems.map((boq) => {
              const isSelected = selectedBoq?.id === boq.id;
              const rateRec = rateAnalyses.find(
                (r) => r.boqItemId === boq.id || r.itemCode === boq.itemCode
              );
              const finalRate = rateRec ? rateRec.finalRate : boq.unitRate;
              const boqAmount = (boq.finalQuantity || 0) * finalRate;

              return (
                <div
                  key={boq.id}
                  onClick={() => setSelectedBoqId(boq.id)}
                  className={`p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-black text-slate-900">{boq.itemCode}</span>
                    <span className="text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {boq.discipline}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium line-clamp-2 mb-2 leading-relaxed">
                    {boq.description}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Verified Qty:</span>
                      <strong className="font-mono text-slate-800">
                        {boq.finalQuantity} {boq.unit}
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase">Unit Rate:</span>
                      <strong className="font-mono text-indigo-700 font-bold">
                        AED {finalRate.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-100/60 text-[11px]">
                    <span className="text-slate-500">BOQ Amount:</span>
                    <strong className="font-mono text-slate-900 font-bold">
                      AED {boqAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CENTER PANE: GRANULAR RATE BUILD-UP WORKSPACE */}
        {/* ========================================================================= */}
        <div className="flex-1 bg-slate-50 flex flex-col overflow-hidden border-r border-slate-200">
          {/* Header of Selected Item */}
          {selectedBoq && selectedRateAnalysis ? (
            <>
              <div className="p-4 bg-white border-b border-slate-200 shrink-0">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {selectedBoq.itemCode}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Discipline: <strong>{selectedBoq.discipline}</strong> | Unit: <strong>{selectedBoq.unit}</strong>
                      </span>
                      {selectedRateAnalysis.isUserOverridden && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 font-black px-2 py-0.5 rounded border border-amber-200 uppercase">
                          Manual Override
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-black text-slate-900 mt-1 leading-snug">
                      {selectedBoq.description}
                    </h3>
                  </div>

                  {/* Template Loader & Actions */}
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          handleApplyTemplate(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      defaultValue=""
                      className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200"
                    >
                      <option value="" disabled>
                        ⚡ Apply Template...
                      </option>
                      {INITIAL_RATE_TEMPLATES.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.unit})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setShowPrintModal(true)}
                      className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Sheet</span>
                    </button>
                  </div>
                </div>

                {/* Read-Only Verified Quantity Banner */}
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-600">
                      Verified Engineering Takeoff Quantity: <strong className="font-mono text-slate-900">{selectedBoq.finalQuantity} {selectedBoq.unit}</strong>
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono uppercase">
                      Read-Only
                    </span>
                  </div>

                  <span className="text-slate-500 font-mono text-[11px]">
                    Analysis Build-up Base: <strong>1.00 {selectedRateAnalysis.rateUnit}</strong>
                  </span>
                </div>
              </div>

              {/* Component Categories Bar & Add Component */}
              <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {(['ALL', 'MATERIAL', 'LABOUR', 'EQUIPMENT', 'SUBCONTRACT', 'TRANSPORT', 'OTHER'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategoryTab(cat)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                        activeCategoryTab === cat
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAddComponent('MATERIAL')}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Material</span>
                  </button>
                  <button
                    onClick={() => handleAddComponent('LABOUR')}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Labour</span>
                  </button>
                  <button
                    onClick={() => handleAddComponent('EQUIPMENT')}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Equip</span>
                  </button>
                </div>
              </div>

              {/* Components List / Table */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {selectedRateAnalysis.components
                  .filter((c) => activeCategoryTab === 'ALL' || c.category === activeCategoryTab)
                  .map((comp, idx) => (
                    <div
                      key={comp.id}
                      className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row items-center gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 w-full md:w-32 shrink-0">
                        <select
                          value={comp.category}
                          onChange={(e) => handleUpdateComponent(comp.id, 'category', e.target.value)}
                          className="w-full text-[10px] font-black uppercase bg-slate-100 text-slate-800 rounded px-2 py-1 border border-slate-200 font-sans"
                        >
                          <option value="MATERIAL">MATERIAL</option>
                          <option value="LABOUR">LABOUR</option>
                          <option value="EQUIPMENT">EQUIPMENT</option>
                          <option value="SUBCONTRACT">SUBCONTRACT</option>
                          <option value="TRANSPORT">TRANSPORT</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>

                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={comp.description}
                          onChange={(e) => handleUpdateComponent(comp.id, 'description', e.target.value)}
                          placeholder="Component description..."
                          className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded font-medium text-slate-900 focus:bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-2 w-full md:w-80 shrink-0 font-mono">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">Unit</span>
                          <input
                            type="text"
                            value={comp.unit}
                            onChange={(e) => handleUpdateComponent(comp.id, 'unit', e.target.value)}
                            className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-center font-bold"
                          />
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">Consump.</span>
                          <input
                            type="number"
                            step="0.001"
                            value={comp.consumption}
                            onChange={(e) => handleUpdateComponent(comp.id, 'consumption', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-right font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">Rate (AED)</span>
                          <input
                            type="number"
                            step="0.01"
                            value={comp.unitRate}
                            onChange={(e) => handleUpdateComponent(comp.id, 'unitRate', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-right font-bold text-slate-900"
                          />
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">Wastage%</span>
                          <input
                            type="number"
                            step="0.1"
                            disabled={comp.category !== 'MATERIAL'}
                            value={comp.wastagePercent || 0}
                            onChange={(e) => handleUpdateComponent(comp.id, 'wastagePercent', parseFloat(e.target.value) || 0)}
                            className="w-full px-1.5 py-1 bg-slate-50 border border-slate-200 rounded text-right font-bold text-slate-700 disabled:opacity-30"
                          />
                        </div>
                      </div>

                      <div className="w-24 text-right shrink-0">
                        <span className="text-[9px] text-slate-400 block uppercase">Amount</span>
                        <strong className="font-mono text-emerald-700 font-black text-sm">
                          AED {comp.amount.toFixed(2)}
                        </strong>
                      </div>

                      <button
                        onClick={() => handleDeleteComponent(comp.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete component"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                {selectedRateAnalysis.components.length === 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
                    No rate components added yet. Use the buttons above to add Materials, Labour, or apply a Template.
                  </div>
                )}
              </div>

              {/* Bottom Section: Traceability, Formulas & Audit */}
              <div className="h-44 bg-white border-t border-slate-200 flex flex-col shrink-0">
                <div className="px-4 py-1.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBottomTab('FORMULA')}
                      className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                        bottomTab === 'FORMULA' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Calculation Formula
                    </button>
                    <button
                      onClick={() => setBottomTab('SOURCE')}
                      className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                        bottomTab === 'SOURCE' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Rate Source & Market Ref
                    </button>
                    <button
                      onClick={() => setBottomTab('AUDIT')}
                      className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                        bottomTab === 'AUDIT' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Audit Trail ({selectedRateAnalysis.auditTrail.length})
                    </button>
                    <button
                      onClick={() => setBottomTab('OVERRIDE')}
                      className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                        bottomTab === 'OVERRIDE' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Manual Override
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    Last Modified: {new Date(selectedRateAnalysis.lastModifiedAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 text-xs bg-slate-50/50">
                  {bottomTab === 'FORMULA' && (
                    <div className="space-y-1 font-mono text-[11px] text-slate-800">
                      <div>
                        1. Direct Cost = Material (AED {selectedRateAnalysis.materialCost.toFixed(2)}) + Labour (AED {selectedRateAnalysis.labourCost.toFixed(2)}) + Equip (AED {selectedRateAnalysis.equipmentCost.toFixed(2)}) + Sub (AED {selectedRateAnalysis.subcontractCost.toFixed(2)}) + Trn (AED {selectedRateAnalysis.transportCost.toFixed(2)}) = <strong>AED {selectedRateAnalysis.directCost.toFixed(2)}</strong>
                      </div>
                      <div>
                        2. Overhead ({selectedRateAnalysis.overheadPercent}%) = AED {selectedRateAnalysis.directCost.toFixed(2)} × {selectedRateAnalysis.overheadPercent}% = <strong>AED {selectedRateAnalysis.overheadAmount.toFixed(2)}</strong>
                      </div>
                      <div>
                        3. Profit ({selectedRateAnalysis.profitPercent}%) = (AED {selectedRateAnalysis.directCost.toFixed(2)} + AED {selectedRateAnalysis.overheadAmount.toFixed(2)}) × {selectedRateAnalysis.profitPercent}% = <strong>AED {selectedRateAnalysis.profitAmount.toFixed(2)}</strong>
                      </div>
                      {selectedRateAnalysis.taxEnabled && (
                        <div>
                          4. Tax / VAT ({selectedRateAnalysis.taxRatePercent}%) = (AED {(selectedRateAnalysis.directCost + selectedRateAnalysis.overheadAmount + selectedRateAnalysis.profitAmount).toFixed(2)}) × {selectedRateAnalysis.taxRatePercent}% = <strong>AED {selectedRateAnalysis.taxAmount.toFixed(2)}</strong>
                        </div>
                      )}
                      <div className="pt-1 text-slate-900 font-bold border-t border-slate-200">
                        Final Unit Rate = Direct + OH + Profit + Tax = <strong>AED {selectedRateAnalysis.finalRate.toFixed(2)} / {selectedRateAnalysis.rateUnit}</strong>
                      </div>
                    </div>
                  )}

                  {bottomTab === 'SOURCE' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase">Rate Source:</span>
                        <strong className="text-slate-900">{selectedRateAnalysis.rateSource || 'Rate Database'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase">Validity Window:</span>
                        <span className="font-mono text-slate-700">{selectedRateAnalysis.validityFrom} to {selectedRateAnalysis.validityTo}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase">Location:</span>
                        <span className="text-slate-700">{selectedRateAnalysis.location}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase">Status:</span>
                        <span className="text-emerald-700 font-bold uppercase">{selectedRateAnalysis.status}</span>
                      </div>
                    </div>
                  )}

                  {bottomTab === 'AUDIT' && (
                    <div className="space-y-1.5">
                      {selectedRateAnalysis.auditTrail.map((audit) => (
                        <div key={audit.id} className="text-[11px] flex items-center justify-between border-b border-slate-100 pb-1">
                          <div>
                            <strong className="text-slate-900 font-mono">{audit.action}</strong> by{' '}
                            <span className="text-slate-600 font-medium">{audit.user}</span>:{' '}
                            <span className="text-slate-700 italic">{audit.reason}</span>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">{new Date(audit.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {bottomTab === 'OVERRIDE' && (
                    <div className="space-y-2">
                      {selectedRateAnalysis.isUserOverridden ? (
                        <div className="flex items-center justify-between bg-amber-50 p-2 rounded-lg border border-amber-200">
                          <div>
                            <span className="font-bold text-amber-900">Active Manual Rate Override: AED {selectedRateAnalysis.finalRate.toFixed(2)}</span>
                            <p className="text-amber-800 text-[11px]">Justification: {selectedRateAnalysis.overrideReason}</p>
                          </div>
                          <button
                            onClick={handleRevertOverride}
                            className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded border border-amber-300 text-xs"
                          >
                            Revert to Calculated
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyOverride} className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="New override rate (AED)..."
                            value={overrideInputRate}
                            onChange={(e) => setOverrideInputRate(e.target.value)}
                            className="w-36 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded font-mono font-bold"
                          />
                          <input
                            type="text"
                            placeholder="Engineering justification note (Required)..."
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded text-xs transition-colors shrink-0"
                          >
                            Apply Override
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              Select a BOQ item on the left to review and price its rate build-up.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANE: RATE SUMMARY & COMMERCIAL MARKUPS */}
        {/* ========================================================================= */}
        <div className="w-80 bg-white flex flex-col justify-between shrink-0 overflow-y-auto">
          {selectedRateAnalysis && selectedBoq ? (
            <div className="p-4 space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider border-b border-slate-100 pb-2">
                Commercial Summary & Markup
              </h4>

              {/* Direct Cost Breakdown */}
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-100 text-xs font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Material Cost:</span>
                  <span className="font-mono text-slate-800">AED {selectedRateAnalysis.materialCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Labour Cost:</span>
                  <span className="font-mono text-slate-800">AED {selectedRateAnalysis.labourCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipment Cost:</span>
                  <span className="font-mono text-slate-800">AED {selectedRateAnalysis.equipmentCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subcontract:</span>
                  <span className="font-mono text-slate-800">AED {selectedRateAnalysis.subcontractCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Transport:</span>
                  <span className="font-mono text-slate-800">AED {selectedRateAnalysis.transportCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold">
                  <span className="text-slate-900">Total Direct Cost:</span>
                  <span className="font-mono text-slate-900 font-black">AED {selectedRateAnalysis.directCost.toFixed(2)}</span>
                </div>
              </div>

              {/* Markups Settings */}
              <div className="space-y-3 text-xs">
                {/* Overhead */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Overhead Markup</span>
                    <span className="font-mono text-slate-900 font-bold">+AED {selectedRateAnalysis.overheadAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={selectedRateAnalysis.overheadPercent}
                      onChange={(e) =>
                        handleUpdateCurrentRateAnalysis((prev) => ({
                          ...prev,
                          overheadPercent: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-20 px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded font-mono font-bold text-right"
                    />
                    <span className="text-slate-500 text-[11px]">% of Direct Cost</span>
                  </div>
                </div>

                {/* Profit */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Profit Margin</span>
                    <span className="font-mono text-emerald-700 font-bold">+AED {selectedRateAnalysis.profitAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={selectedRateAnalysis.profitPercent}
                      onChange={(e) =>
                        handleUpdateCurrentRateAnalysis((prev) => ({
                          ...prev,
                          profitPercent: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-20 px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded font-mono font-bold text-right"
                    />
                    <span className="text-slate-500 text-[11px]">% on Direct + Overhead</span>
                  </div>
                </div>

                {/* Tax */}
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRateAnalysis.taxEnabled}
                        onChange={(e) =>
                          handleUpdateCurrentRateAnalysis((prev) => ({
                            ...prev,
                            taxEnabled: e.target.checked,
                          }))
                        }
                        className="rounded text-indigo-600"
                      />
                      <span className="font-bold text-slate-700">Tax / VAT</span>
                    </label>
                    <span className="font-mono text-slate-700">
                      {selectedRateAnalysis.taxEnabled ? `+AED ${selectedRateAnalysis.taxAmount.toFixed(2)}` : 'Exempt'}
                    </span>
                  </div>
                  {selectedRateAnalysis.taxEnabled && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={selectedRateAnalysis.taxRatePercent}
                        onChange={(e) =>
                          handleUpdateCurrentRateAnalysis((prev) => ({
                            ...prev,
                            taxRatePercent: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-20 px-2 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded font-mono font-bold text-right"
                      />
                      <span className="text-slate-500 text-[11px]">% Statutory Tax</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Final Unit Rate Hero Block */}
              <div className="bg-slate-900 text-white rounded-xl p-4 text-center shadow-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                  FINAL UNIT RATE PER {selectedRateAnalysis.rateUnit}
                </span>
                <div className="text-2xl font-black font-mono text-emerald-400">
                  AED {selectedRateAnalysis.finalRate.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  All direct costs + markups + tax
                </div>
              </div>

              {/* Total BOQ Amount */}
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                  Item BOQ Amount (Qty × Rate)
                </span>
                <div className="text-lg font-black font-mono text-emerald-950">
                  AED {(selectedBoq.finalQuantity * selectedRateAnalysis.finalRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  Formula: {selectedBoq.finalQuantity} {selectedBoq.unit} × AED {selectedRateAnalysis.finalRate.toFixed(2)}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-slate-400 text-xs">
              No item selected
            </div>
          )}

          {/* Bottom Lock Status */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Quantity: Read-Only</span>
            </span>
            <span className="font-mono font-bold text-slate-700">
              {rateAnalyses.filter((r) => r.status === 'PRICED').length}/{unifiedBoqItems.length} Priced
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Master Rate Database Modal */}
      <RateDatabaseModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
        rateDatabase={rateDatabase}
        exchangeRates={exchangeRates}
        onSaveItem={(item) =>
          setRateDatabase((prev) => {
            const exists = prev.some((i) => i.id === item.id);
            return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [item, ...prev];
          })
        }
        onDeleteItem={(id) => setRateDatabase((prev) => prev.filter((i) => i.id !== id))}
        onDuplicateItem={(item) => {
          const dup: RateDatabaseItem = {
            ...item,
            id: `RDB-${Date.now()}`,
            code: `${item.code}-COPY`,
            name: `${item.name} (Copy)`,
          };
          setRateDatabase((prev) => [dup, ...prev]);
        }}
        onUpdateExchangeRate={(rate) =>
          setExchangeRates((prev) =>
            prev.map((r) => (r.targetCurrency === rate.targetCurrency ? rate : r))
          )
        }
      />

      {/* Supplier Quotes Register Modal */}
      <SupplierQuotesModal
        isOpen={showQuotesModal}
        onClose={() => setShowQuotesModal(false)}
        quotes={supplierQuotes}
        onSelectQuote={(quoteId) => {
          setSupplierQuotes((prev) =>
            prev.map((q) => ({
              ...q,
              isSelectedForRateAnalysis: q.id === quoteId,
            }))
          );
        }}
        onAddQuote={(quote) => setSupplierQuotes((prev) => [quote, ...prev])}
      />

      {/* Pricing Scenarios & Value Engineering Modal */}
      <PricingScenarioModal
        isOpen={showScenariosModal}
        onClose={() => setShowScenariosModal(false)}
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelectScenario={(id) => setActiveScenarioId(id)}
        onUpdateScenario={(sc) =>
          setScenarios((prev) => prev.map((s) => (s.id === sc.id ? sc : s)))
        }
        veProposals={veProposals}
        onUpdateVeProposal={(ve) =>
          setVeProposals((prev) => prev.map((p) => (p.id === ve.id ? ve : p)))
        }
        boqItems={unifiedBoqItems}
        rateAnalyses={rateAnalyses}
      />

      {/* Tender Summary Executive Modal */}
      <TenderSummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        summaryReport={tenderSummary}
        onExportExcel={handleExportExcel}
        onOpenPrintModal={() => setShowPrintModal(true)}
        onFreezePricing={handleFreezePricing}
        pricingRevisions={pricingRevisions}
      />

      {/* Pre-Flight Pricing Quality Gate Modal */}
      <PricingQualityGateModal
        isOpen={showQualityGateModal}
        onClose={() => setShowQualityGateModal(false)}
        qaReport={qaReport}
        onSelectIssueItem={(itemCode) => {
          const target = unifiedBoqItems.find((b) => b.itemCode === itemCode);
          if (target) setSelectedBoqId(target.id);
        }}
      />

      {/* Printable Sheet Modal */}
      <RateAnalysisPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        selectedItem={selectedRateAnalysis}
        selectedBoq={selectedBoq}
        summaryReport={tenderSummary}
        project={project}
      />

      {/* 30-Rule Test Suite Modal */}
      <RateAnalysisTestSuiteModal
        isOpen={showTestSuiteModal}
        onClose={() => setShowTestSuiteModal(false)}
      />
    </div>
  );
};
