/**
 * AI BOQ & Tender Estimation Engineer - Phase 15A Professional Measurement & Calculation Engine Workspace
 */

import React, { useState, useMemo } from 'react';
import {
  CalculationObject,
  ProjectMeasurementSettings,
  CalculationTestResult,
  EngineeringTemplate,
} from '../types/measurementEngine';
import {
  ENGINEERING_TEMPLATES,
  ProfessionalCalculationEngine,
  BoqAggregationEngine,
  UnitConversionEngine,
  SafeFormulaEngine,
  RoundingEngine,
} from '../engine/measurementEngine';
import { MeasurementTestSuite } from '../engine/measurementTestSuite';
import { INITIAL_CALCULATIONS, INITIAL_PROJECT_MEASUREMENT_SETTINGS } from '../data/measurementInitialData';
import { EditCalculationModal } from './EditCalculationModal';
import { CalculationTraceModal } from './CalculationTraceModal';
import { ProjectMeasurementSettingsModal } from './ProjectMeasurementSettingsModal';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Search,
  Plus,
  Settings,
  Play,
  RotateCcw,
  Download,
  Eye,
  Edit3,
  GitBranch,
  Layers,
  FileSpreadsheet,
  Activity,
  History,
  Tag,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Maximize2,
  Sparkles,
  BookOpen,
  Scale,
  ShieldCheck,
} from 'lucide-react';

interface MeasurementEngineWorkspaceProps {
  onViewDrawing?: (drawingNumber: string, page?: number) => void;
}

export const MeasurementEngineWorkspace: React.FC<MeasurementEngineWorkspaceProps> = ({
  onViewDrawing,
}) => {
  // Master state
  const [calculations, setCalculations] = useState<CalculationObject[]>(INITIAL_CALCULATIONS);
  const [settings, setSettings] = useState<ProjectMeasurementSettings>(INITIAL_PROJECT_MEASUREMENT_SETTINGS);
  const [activeTab, setActiveTab] = useState<
    'REGISTER' | 'TRACE_VIEW' | 'DEPENDENCY_GRAPH' | 'TEMPLATES' | 'UNIT_CONVERTER' | 'TEST_RUNNER' | 'BOQ_SCHEDULE' | 'AUDIT_LOG'
  >('REGISTER');

  // Modals state
  const [selectedCalcForEdit, setSelectedCalcForEdit] = useState<CalculationObject | null>(null);
  const [selectedCalcForTrace, setSelectedCalcForTrace] = useState<CalculationObject | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Interactive Test Runner State
  const [testSuiteResults, setTestSuiteResults] = useState<{
    results: CalculationTestResult[];
    totalTests: number;
    passedCount: number;
    failedCount: number;
    passRate: number;
    totalDurationMs: number;
    criticalTest86Passed: boolean;
    criticalTest87Passed: boolean;
    criticalTest88Passed: boolean;
    criticalTest89Passed: boolean;
  }>(() => MeasurementTestSuite.runAllTests());

  // Interactive Unit Converter State
  const [convValue, setConvValue] = useState<number>(6000);
  const [convUnit, setConvUnit] = useState<string>('mm');
  const [convType, setConvType] = useState<'LENGTH' | 'AREA' | 'VOLUME' | 'WEIGHT'>('LENGTH');

  // Interactive Template Sandbox State
  const [selectedTemplate, setSelectedTemplate] = useState<EngineeringTemplate>(ENGINEERING_TEMPLATES[3]); // Masonry default
  const [templateInputs, setTemplateInputs] = useState<Record<string, number>>({
    Length: 6.0,
    Height: 3.0,
    Thickness: 0.23,
  });

  // Rates for BOQ aggregation
  const boqRates: Record<string, number> = {
    'BOQ-MAS-01': 145.0, // $145/m³
    'BOQ-CONC-COL': 280.0, // $280/m³
    'BOQ-CONC-FTG': 240.0, // $240/m³
    'BOQ-STL-01': 3.2, // $3.20/kg
    'BOQ-MEP-01': 48.0, // $48.0/m²
  };

  // Recompute BOQ Aggregation
  const boqSchedule = useMemo(() => {
    return BoqAggregationEngine.aggregateCalculations(calculations, boqRates);
  }, [calculations]);

  // Filtered calculations list
  const filteredCalculations = useMemo(() => {
    return calculations.filter((calc) => {
      if (filterCategory !== 'ALL' && calc.category !== filterCategory) return false;
      if (filterStatus !== 'ALL' && calc.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          calc.calculationId.toLowerCase().includes(q) ||
          calc.description.toLowerCase().includes(q) ||
          calc.elementId.toLowerCase().includes(q) ||
          calc.boqItemId.toLowerCase().includes(q) ||
          calc.drawingId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [calculations, filterCategory, filterStatus, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = calculations.length;
    const verifiedCount = calculations.filter((c) => c.status === 'VERIFIED').length;
    const conflictCount = calculations.filter((c) => c.status === 'CONFLICT').length;
    const missingCount = calculations.filter((c) => c.status === 'MISSING_INPUT').length;
    const reviewCount = calculations.filter((c) => c.status === 'REVIEW_REQUIRED' || c.status === 'DRAFT').length;

    const totalBoqValue = boqSchedule
      .filter((b) => b.status === 'VERIFIED_READY')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    return {
      totalCount,
      verifiedCount,
      conflictCount,
      missingCount,
      reviewCount,
      totalBoqValue,
    };
  }, [calculations, boqSchedule]);

  // Handlers
  const handleSaveCalculation = (updated: CalculationObject) => {
    setCalculations((prev) =>
      prev.map((c) => (c.calculationId === updated.calculationId ? updated : c))
    );
  };

  const handleVerifyCalculation = (calc: CalculationObject) => {
    const updated: CalculationObject = {
      ...calc,
      status: 'VERIFIED',
      auditTrail: [
        ...calc.auditTrail,
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: 'Lead Estimator',
          fieldChanged: 'Status',
          beforeValue: calc.status,
          afterValue: 'VERIFIED',
          reason: 'Manual engineering sign-off and verification',
          source: 'User Action',
        },
      ],
    };
    handleSaveCalculation(updated);
  };

  const handleCreateRevision = (calc: CalculationObject) => {
    const nextRev = String(parseInt(calc.revision || '0') + 1).padStart(2, '0');
    const { oldSupersededCalc, newRevisionCalc } = ProfessionalCalculationEngine.createRevision(
      calc,
      nextRev,
      'Lead Estimator'
    );
    setCalculations((prev) => [
      ...prev.map((c) => (c.calculationId === oldSupersededCalc.calculationId ? oldSupersededCalc : c)),
      newRevisionCalc,
    ]);
  };

  const handleRunTests = () => {
    const res = MeasurementTestSuite.runAllTests();
    setTestSuiteResults(res);
  };

  const handleExportCalculationDetails = () => {
    const rows = [
      ['CALCULATION_ID', 'BOQ_ITEM_ID', 'ELEMENT_TAG', 'DESCRIPTION', 'CATEGORY', 'FORMULA', 'SUBSTITUTION', 'GROSS_QTY', 'DEDUCTIONS', 'NET_QTY', 'UNIT', 'STATUS', 'CONFIDENCE', 'DRAWING_REF'],
      ...calculations.map((c) => [
        c.calculationId,
        c.boqItemId,
        c.elementId,
        `"${c.description.replace(/"/g, '""')}"`,
        c.category,
        `"${c.formula.replace(/"/g, '""')}"`,
        `"${c.substitution.replace(/"/g, '""')}"`,
        c.grossResult.toFixed(3),
        c.totalDeduction.toFixed(3),
        c.displayedResult.toFixed(3),
        c.unit,
        c.status,
        c.confidence,
        c.drawingId,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CALCULATION_DETAILS_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Convert unit live
  const normalizedLive = useMemo(() => {
    if (convType === 'LENGTH') return UnitConversionEngine.normalizeLength(convValue, convUnit);
    if (convType === 'AREA') return UnitConversionEngine.normalizeArea(convValue, convUnit);
    if (convType === 'VOLUME') return UnitConversionEngine.normalizeVolume(convValue, convUnit);
    return UnitConversionEngine.normalizeWeight(convValue, convUnit);
  }, [convValue, convUnit, convType]);

  // Sandbox calculation
  const sandboxResult = useMemo(() => {
    try {
      const evalRes = SafeFormulaEngine.evaluate(selectedTemplate.formula, templateInputs);
      const sub = SafeFormulaEngine.generateSubstitution(selectedTemplate.formula, templateInputs, 3);
      return { result: evalRes.result, substitution: sub, error: evalRes.error };
    } catch (e: any) {
      return { result: 0, substitution: 'Error evaluating', error: e.message };
    }
  }, [selectedTemplate, templateInputs]);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 min-h-screen overflow-hidden">
      {/* Top Banner / Metrics Overview */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span>Deterministic Measurement & Calculation Engine</span>
                  <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                    Phase 15A Core
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Strict Mathematical Determinism • No AI Arithmetic • Source Traceability • Dependency Impact Graphs
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Project Rules</span>
            </button>

            <button
              onClick={handleExportCalculationDetails}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setActiveTab('TEST_RUNNER')}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-bold text-indigo-300 rounded-lg transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Test Suite: {testSuiteResults.passedCount}/{testSuiteResults.totalTests}</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
          <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-lg">
            <span className="text-[11px] text-slate-400 block font-medium">Total Calculations</span>
            <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">{metrics.totalCount}</div>
          </div>

          <div className="bg-slate-950/70 border border-emerald-900/40 p-3 rounded-lg">
            <span className="text-[11px] text-emerald-400 block font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified in BOQ
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{metrics.verifiedCount}</div>
          </div>

          <div className="bg-slate-950/70 border border-rose-900/40 p-3 rounded-lg">
            <span className="text-[11px] text-rose-400 block font-medium flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" />
              Source Conflicts
            </span>
            <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">{metrics.conflictCount}</div>
          </div>

          <div className="bg-slate-950/70 border border-amber-900/40 p-3 rounded-lg">
            <span className="text-[11px] text-amber-400 block font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Missing Inputs
            </span>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">{metrics.missingCount}</div>
          </div>

          <div className="bg-slate-950/70 border border-indigo-900/40 p-3 rounded-lg">
            <span className="text-[11px] text-indigo-400 block font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              25-Test Engine
            </span>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-0.5">
              {testSuiteResults.passRate.toFixed(0)}% PASS
            </div>
          </div>

          <div className="bg-slate-950/70 border border-emerald-800/40 p-3 rounded-lg">
            <span className="text-[11px] text-slate-400 block font-medium flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" />
              Tender Value
            </span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              ${metrics.totalBoqValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-6 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('REGISTER')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'REGISTER'
              ? 'border-indigo-500 text-indigo-400 bg-slate-850/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Calculations Register ({calculations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('BOQ_SCHEDULE')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'BOQ_SCHEDULE'
              ? 'border-indigo-500 text-indigo-400 bg-slate-850/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>BOQ Schedule Aggregation</span>
        </button>

        <button
          onClick={() => setActiveTab('DEPENDENCY_GRAPH')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DEPENDENCY_GRAPH'
              ? 'border-indigo-500 text-indigo-400 bg-slate-850/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Dependency & Impact Graph</span>
        </button>

        <button
          onClick={() => setActiveTab('TEMPLATES')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'TEMPLATES'
              ? 'border-indigo-500 text-indigo-400 bg-slate-850/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Engineering Templates ({ENGINEERING_TEMPLATES.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('UNIT_CONVERTER')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'UNIT_CONVERTER'
              ? 'border-indigo-500 text-indigo-400 bg-slate-850/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Unit Normalizer</span>
        </button>

        <button
          onClick={() => setActiveTab('TEST_RUNNER')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'TEST_RUNNER'
              ? 'border-indigo-500 text-indigo-400 bg-slate-850/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>25-Test Automated Suite</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOG')}
          className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'AUDIT_LOG'
              ? 'border-indigo-500 text-indigo-400 bg-slate-850/50'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* ========================================================================= */}
        {/* TAB 1: CALCULATIONS REGISTER */}
        {/* ========================================================================= */}
        {activeTab === 'REGISTER' && (
          <div className="space-y-4">
            {/* Search & Filtering Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search calculations by ID, element tag, BOQ code, or description..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-hidden"
                >
                  <option value="ALL">All Disciplines</option>
                  <option value="MASONRY">Masonry</option>
                  <option value="RCC">RCC Concrete</option>
                  <option value="STEEL">Structural Steel</option>
                  <option value="DUCT">HVAC Ducting</option>
                  <option value="EARTHWORK">Earthwork</option>
                  <option value="PLASTER">Plaster</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-semibold focus:outline-hidden"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified (Green)</option>
                  <option value="CALCULATED">Calculated</option>
                  <option value="CONFLICT">Conflict (Red)</option>
                  <option value="MISSING_INPUT">Missing Input (Amber)</option>
                  <option value="SUPERSEDED">Superseded</option>
                </select>
              </div>
            </div>

            {/* Calculations Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Calculation ID / Rev</th>
                      <th className="py-3.5 px-4">Element / Item</th>
                      <th className="py-3.5 px-4">Formula & Substitution</th>
                      <th className="py-3.5 px-4 text-right">Gross Qty</th>
                      <th className="py-3.5 px-4 text-right">Deductions</th>
                      <th className="py-3.5 px-4 text-right">Net Displayed Qty</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredCalculations.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">
                          No measurement calculations found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredCalculations.map((calc) => (
                        <tr
                          key={calc.calculationId}
                          className={`hover:bg-slate-850/50 transition-colors ${
                            calc.isSuperseded ? 'opacity-50 bg-slate-950/30' : ''
                          }`}
                        >
                          {/* ID & Drawing */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="font-bold text-slate-200">{calc.calculationId}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>Rev {calc.revision}</span>
                              <span>•</span>
                              <span>{calc.drawingId}</span>
                            </div>
                          </td>

                          {/* Element & Description */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-semibold text-slate-200 truncate">{calc.description}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="bg-slate-800 px-1.5 py-0.2 rounded font-mono text-slate-300">
                                {calc.elementId}
                              </span>
                              <span>BOQ: {calc.boqItemId}</span>
                            </div>
                          </td>

                          {/* Formula & Substitution */}
                          <td className="py-3.5 px-4 font-mono max-w-sm">
                            <div className="text-indigo-400 font-semibold truncate">{calc.formula}</div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {calc.substitution || 'No substitution'}
                            </div>
                          </td>

                          {/* Gross Qty */}
                          <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                            {calc.grossResult > 0 ? `${calc.grossResult.toFixed(3)} ${calc.unit}` : '—'}
                          </td>

                          {/* Deductions */}
                          <td className="py-3.5 px-4 text-right font-mono">
                            {calc.totalDeduction > 0 ? (
                              <span className="text-rose-400">-{calc.totalDeduction.toFixed(3)} {calc.unit}</span>
                            ) : (
                              <span className="text-slate-500">0.000</span>
                            )}
                          </td>

                          {/* Net Qty */}
                          <td className="py-3.5 px-4 text-right font-mono">
                            <span className="text-sm font-bold text-emerald-400">
                              {calc.status === 'MISSING_INPUT' || calc.status === 'CONFLICT'
                                ? '—'
                                : `${RoundingEngine.formatDisplay(calc.displayedResult, calc.roundingRule)} ${calc.unit}`}
                            </span>
                            {calc.instances > 1 && (
                              <span className="text-[10px] text-slate-500 block">({calc.instances} units)</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider inline-block ${
                                calc.status === 'VERIFIED'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : calc.status === 'CONFLICT'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : calc.status === 'MISSING_INPUT'
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : calc.status === 'SUPERSEDED'
                                  ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                  : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              }`}
                            >
                              {calc.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedCalcForTrace(calc)}
                                title="Inspect Mathematical Trace"
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedCalcForEdit(calc)}
                                title="Edit & Recalculate Inputs"
                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {calc.status !== 'VERIFIED' && (
                                <button
                                  type="button"
                                  onClick={() => handleVerifyCalculation(calc)}
                                  title="Sign-off and Verify for BOQ"
                                  className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleCreateRevision(calc)}
                                title="Create Revision (Rev Next)"
                                className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BOQ SCHEDULE AGGREGATION */}
        {/* ========================================================================= */}
        {activeTab === 'BOQ_SCHEDULE' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Aggregated BOQ Schedule (Verified Quantities)</h3>
                <p className="text-xs text-slate-400">
                  Only verified calculations are included in official tender sums. Conflicted and missing items are strictly isolated.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded border border-emerald-800">
                Total Verified BOQ: ${metrics.totalBoqValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4">Item Code / ID</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4 text-center">Calcs Count</th>
                    <th className="py-3.5 px-4 text-right">Aggregated Quantity</th>
                    <th className="py-3.5 px-4 text-right">Unit Rate ($)</th>
                    <th className="py-3.5 px-4 text-right">Total Amount ($)</th>
                    <th className="py-3.5 px-4 text-center">BOQ Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {boqSchedule.map((boq) => (
                    <tr key={boq.boqItemId} className="hover:bg-slate-850/50">
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {boq.itemCode}
                        <span className="text-[10px] text-slate-500 block font-normal">{boq.boqItemId}</span>
                      </td>
                      <td className="py-3.5 px-4 font-sans font-medium text-slate-200 max-w-sm">
                        {boq.description}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-300">
                        {boq.calculationsCount} items
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                        {boq.totalQuantity.toFixed(3)} {boq.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-300">
                        ${boq.unitRate?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-100">
                        ${boq.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            boq.status === 'VERIFIED_READY'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {boq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: DEPENDENCY & IMPACT GRAPH */}
        {/* ========================================================================= */}
        {activeTab === 'DEPENDENCY_GRAPH' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400" />
                Live Dependency & Downstream Ripple Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Modifying an input dimension (e.g. Wall Thickness) automatically traces and recalculates only dependent downstream quantities (plaster, masonry, paint) while keeping unrelated structural footings untouched.
              </p>
            </div>

            {/* Visual Flow diagram */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                  1. Drawing Input Dimensions
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-200 font-semibold block">Wall Length</span>
                    <span className="font-mono text-emerald-400">6.000 m</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-200 font-semibold block">Wall Height</span>
                    <span className="font-mono text-emerald-400">3.000 m</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-indigo-700/60 bg-indigo-950/20">
                    <span className="text-indigo-300 font-semibold block">Wall Thickness (Master Input)</span>
                    <span className="font-mono text-indigo-400">0.230 m</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  2. Downstream Calculations
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-200 font-semibold block">Gross Masonry</span>
                    <span className="font-mono text-slate-300">4.140 m³</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-200 font-semibold block">Door D1 Opening Deduction</span>
                    <span className="font-mono text-rose-400">-0.435 m³</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-emerald-800/60 bg-emerald-950/20">
                    <span className="text-emerald-300 font-semibold block">Net Brickwork Quantity</span>
                    <span className="font-mono text-emerald-400 font-bold">3.705 m³</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  3. Linked Finishing Trades
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-200 font-semibold block">Internal Cement Plaster</span>
                    <span className="font-mono text-slate-300">32.220 m²</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-200 font-semibold block">Emulsion Paint 2-Coats</span>
                    <span className="font-mono text-slate-300">32.220 m²</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  4. BOQ & Tender Value
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-200 font-semibold block">BOQ-MAS-01 @ $145/m³</span>
                    <span className="font-mono text-emerald-400 font-bold">$537.23</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="text-slate-200 font-semibold block">BOQ-PLAS-01 @ $18/m²</span>
                    <span className="font-mono text-emerald-400 font-bold">$579.96</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: ENGINEERING TEMPLATES & SANDBOX */}
        {/* ========================================================================= */}
        {activeTab === 'TEMPLATES' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Template Catalog */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Standard Item Templates ({ENGINEERING_TEMPLATES.length})
              </span>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {ENGINEERING_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.templateId}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(tmpl);
                      const initInputs: Record<string, number> = {};
                      tmpl.standardInputs.forEach((inp) => {
                        initInputs[inp.name] = inp.defaultVal;
                      });
                      setTemplateInputs(initInputs);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all text-xs ${
                      selectedTemplate.templateId === tmpl.templateId
                        ? 'bg-indigo-950/60 border-indigo-500/60 text-slate-100'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{tmpl.name}</span>
                      <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-800">
                        {tmpl.unit}
                      </span>
                    </div>
                    <code className="font-mono text-[11px] text-emerald-400 block mt-1">{tmpl.formula}</code>
                    <p className="text-[10px] text-slate-400 mt-1">{tmpl.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Live Interactive Sandbox */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    {selectedTemplate.templateId}
                  </span>
                  <h3 className="text-base font-bold text-slate-100">{selectedTemplate.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedTemplate.description}</p>
              </div>

              {/* Template Inputs Sandbox */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Template Parameter Inputs (Live Arithmetic Sandbox)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTemplate.standardInputs.map((inp) => (
                    <div key={inp.name} className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-200">{inp.name}</label>
                        <span className="text-[10px] font-mono text-slate-400">{inp.unit}</span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={templateInputs[inp.name] ?? inp.defaultVal}
                        onChange={(e) =>
                          setTemplateInputs({
                            ...templateInputs,
                            [inp.name]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono font-bold text-emerald-400 focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Formula & Live Result */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div>
                  <span className="text-xs text-slate-400 block">Algebraic Formula:</span>
                  <code className="font-mono text-sm font-bold text-indigo-300 block mt-0.5">
                    {selectedTemplate.formula}
                  </code>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">Parameter Substitution:</span>
                  <code className="font-mono text-xs text-emerald-400 block mt-0.5 bg-slate-900 p-2 rounded border border-slate-800">
                    {sandboxResult.substitution}
                  </code>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Deterministic Calculated Quantity:</span>
                  <div className="text-2xl font-mono font-black text-emerald-400">
                    {sandboxResult.result.toFixed(3)} {selectedTemplate.unit}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: UNIT NORMALIZER */}
        {/* ========================================================================= */}
        {activeTab === 'UNIT_CONVERTER' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-400" />
                  Deterministic Engineering Unit Normalizer
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ensures all drawing inputs (mm, cm, ft, in, etc.) are converted to standard base units (m, m², m³, kg) without loss of precision.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Measurement Type</label>
                  <select
                    value={convType}
                    onChange={(e) => {
                      const t = e.target.value as any;
                      setConvType(t);
                      if (t === 'LENGTH') setConvUnit('mm');
                      if (t === 'AREA') setConvUnit('mm²');
                      if (t === 'VOLUME') setConvUnit('mm³');
                      if (t === 'WEIGHT') setConvUnit('g');
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-hidden"
                  >
                    <option value="LENGTH">Length</option>
                    <option value="AREA">Area</option>
                    <option value="VOLUME">Volume</option>
                    <option value="WEIGHT">Weight</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Input Value</label>
                  <input
                    type="number"
                    step="any"
                    value={convValue}
                    onChange={(e) => setConvValue(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Source Unit</label>
                  <select
                    value={convUnit}
                    onChange={(e) => setConvUnit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-hidden"
                  >
                    {convType === 'LENGTH' && (
                      <>
                        <option value="mm">Millimeters (mm)</option>
                        <option value="cm">Centimeters (cm)</option>
                        <option value="m">Meters (m)</option>
                        <option value="km">Kilometers (km)</option>
                        <option value="in">Inches (in)</option>
                        <option value="ft">Feet (ft)</option>
                        <option value="yd">Yards (yd)</option>
                      </>
                    )}
                    {convType === 'AREA' && (
                      <>
                        <option value="mm²">Square Millimeters (mm²)</option>
                        <option value="cm²">Square Centimeters (cm²)</option>
                        <option value="m²">Square Meters (m²)</option>
                        <option value="ft²">Square Feet (ft²)</option>
                        <option value="sqft">Sq Ft</option>
                      </>
                    )}
                    {convType === 'VOLUME' && (
                      <>
                        <option value="mm³">Cubic Millimeters (mm³)</option>
                        <option value="m³">Cubic Meters (m³)</option>
                        <option value="ft³">Cubic Feet (ft³)</option>
                        <option value="l">Liters (L)</option>
                      </>
                    )}
                    {convType === 'WEIGHT' && (
                      <>
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="tonne">Metric Tonnes (t)</option>
                        <option value="lb">Pounds (lb)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Conversion Result */}
              <div className="p-4 bg-slate-950 rounded-xl border border-indigo-900/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Normalized Base Output:</span>
                  <div className="text-2xl font-mono font-black text-emerald-400 mt-0.5">
                    {normalizedLive.normalizedValue.toFixed(6)} {normalizedLive.normalizedUnit}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400 font-mono">
                  <div>Source: {convValue} {convUnit}</div>
                  <div className="text-emerald-400 font-bold mt-1">Factor: ×{normalizedLive.conversionFactor}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: 25-TEST AUTOMATED SUITE */}
        {/* ========================================================================= */}
        {activeTab === 'TEST_RUNNER' && (
          <div className="space-y-6">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Phase 15A 25-Point Measurement Automated Test Suite
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated verification of Unit Conversion, Deductions, Missing Inputs, Conflicts, Dependencies, Revisions & Precisions.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunTests}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-lg shadow-md transition-all flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>[RE-RUN ALL 25 TESTS]</span>
              </button>
            </div>

            {/* Critical Test Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div
                className={`p-3 rounded-lg border text-xs ${
                  testSuiteResults.criticalTest86Passed
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                <span className="font-bold block">Critical Test 86</span>
                <p className="text-[11px] text-slate-300 mt-1">Masonry Opening Deduction (4.14 - 0.4347 = 3.7053 m³)</p>
                <span className="font-mono text-xs font-bold mt-2 inline-block">
                  {testSuiteResults.criticalTest86Passed ? 'PASSED ✓' : 'FAILED ✗'}
                </span>
              </div>

              <div
                className={`p-3 rounded-lg border text-xs ${
                  testSuiteResults.criticalTest87Passed
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                <span className="font-bold block">Critical Test 87</span>
                <p className="text-[11px] text-slate-300 mt-1">Dependency Recalculation (Thickness 0.23m → 0.25m)</p>
                <span className="font-mono text-xs font-bold mt-2 inline-block">
                  {testSuiteResults.criticalTest87Passed ? 'PASSED ✓' : 'FAILED ✗'}
                </span>
              </div>

              <div
                className={`p-3 rounded-lg border text-xs ${
                  testSuiteResults.criticalTest88Passed
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                <span className="font-bold block">Critical Test 88</span>
                <p className="text-[11px] text-slate-300 mt-1">Missing Input Safety (Unknown Height → Open Item)</p>
                <span className="font-mono text-xs font-bold mt-2 inline-block">
                  {testSuiteResults.criticalTest88Passed ? 'PASSED ✓' : 'FAILED ✗'}
                </span>
              </div>

              <div
                className={`p-3 rounded-lg border text-xs ${
                  testSuiteResults.criticalTest89Passed
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                <span className="font-bold block">Critical Test 89</span>
                <p className="text-[11px] text-slate-300 mt-1">Conflicting Input (Plan 200mm vs Section 230mm)</p>
                <span className="font-mono text-xs font-bold mt-2 inline-block">
                  {testSuiteResults.criticalTest89Passed ? 'PASSED ✓' : 'FAILED ✗'}
                </span>
              </div>
            </div>

            {/* Test Results Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-850 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">Test Name & Description</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 font-mono text-right">Expected</th>
                    <th className="py-3.5 px-4 font-mono text-right">Actual Result</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {testSuiteResults.results.map((t) => (
                    <tr key={t.testNumber} className="hover:bg-slate-850/50">
                      <td className="py-3 px-4 text-center text-slate-500 font-bold">{t.testNumber}</td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-slate-200">{t.name}</div>
                        <div className="text-[11px] text-slate-400">{t.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                          {t.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-300">{String(t.expected)}</td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-bold">{String(t.actual)}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            t.passed
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}
                        >
                          {t.passed ? 'PASS ✓' : 'FAIL ✗'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: MASTER AUDIT TRAIL */}
        {/* ========================================================================= */}
        {activeTab === 'AUDIT_LOG' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-400" />
                Master Engineering Measurement Audit Trail
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Every calculation change, human override, status transition, and formula modification is recorded with timestamp, user, and justification.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              {calculations.flatMap((c) => c.auditTrail.map((a) => ({ ...a, calcId: c.calculationId, desc: c.description }))).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">No audit logs recorded yet.</div>
              ) : (
                calculations.flatMap((c) => c.auditTrail.map((a) => ({ ...a, calcId: c.calculationId, desc: c.description }))).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-indigo-400">{log.calcId}</span>
                        <span className="font-bold text-slate-200">{log.fieldChanged}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1">Reason: <span className="italic">{log.reason}</span></p>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-slate-400">
                        {String(log.beforeValue)} → <strong className="text-emerald-400">{String(log.afterValue)}</strong>
                      </span>
                      <span className="text-[10px] text-slate-500 block">User: {log.user} ({log.source})</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedCalcForEdit && (
        <EditCalculationModal
          isOpen={true}
          onClose={() => setSelectedCalcForEdit(null)}
          calculation={selectedCalcForEdit}
          allCalculations={calculations}
          settings={settings}
          onSaveCalculation={handleSaveCalculation}
          onViewDrawing={onViewDrawing}
        />
      )}

      {selectedCalcForTrace && (
        <CalculationTraceModal
          isOpen={true}
          onClose={() => setSelectedCalcForTrace(null)}
          calculation={selectedCalcForTrace}
          onOpenEdit={() => {
            setSelectedCalcForEdit(selectedCalcForTrace);
          }}
          onViewDrawing={onViewDrawing}
        />
      )}

      {isSettingsOpen && (
        <ProjectMeasurementSettingsModal
          isOpen={true}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          onSaveSettings={(newSettings) => setSettings(newSettings)}
        />
      )}
    </div>
  );
};
