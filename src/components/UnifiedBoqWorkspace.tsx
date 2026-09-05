import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  ShieldCheck,
  Lock,
  Unlock,
  GitCommit,
  Layers,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Search,
  Filter,
  Calculator,
  Edit3,
  FileText,
  Download,
  Plus,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  History,
  FileCheck,
  FileCheck2,
  CheckSquare,
  Sparkles,
  Scale,
  Building2,
  Boxes,
  RefreshCw,
  TrendingUp,
  X
} from 'lucide-react';

import {
  BOQItemObject,
  BOQSectionDefinition,
  BOQNumberingStyle
} from '../types/boqAssemblyTypes';

import { BoqAssemblyEngine } from '../engine/boqAssemblyEngine';
import {
  STANDARD_BOQ_SECTIONS,
  INITIAL_PHASE15F_BOQ_ITEMS,
  INITIAL_BOQ_SIGNOFF
} from '../data/boqAssemblyInitialData';

import { BoqAssembly35ExcelModal } from './BoqAssembly35ExcelModal';
import { BoqReconciliationDashboardModal } from './BoqReconciliationDashboardModal';
import { BoqInputImpactModal } from './BoqInputImpactModal';
import { BoqDescriptionGeneratorModal } from './BoqDescriptionGeneratorModal';
import { BoqDeductionInspectorModal } from './BoqDeductionInspectorModal';
import { BoqCriticalTestSuiteModal } from './BoqCriticalTestSuiteModal';
import { DrawingToBoqAutoPipelineModal } from './DrawingToBoqAutoPipelineModal';
import { CalculationProofModal } from './CalculationProofModal';
import { AutoCAD2021Modal } from './AutoCAD2021Modal';
import { GeneratedBoqTakeoffItem } from '../engine/drawingToBoqPipelineEngine';

interface UnifiedBoqWorkspaceProps {
  onBackToDashboard?: () => void;
}

export const UnifiedBoqWorkspace: React.FC<UnifiedBoqWorkspaceProps> = ({ onBackToDashboard }) => {
  // Master Phase 15F BOQ State (Hydrated from cache or standard initial data)
  const [boqItems, setBoqItems] = useState<BOQItemObject[]>(() => {
    try {
      const stored = localStorage.getItem('ai_boq_phase15f_items_active');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached BOQ items:', e);
    }
    return INITIAL_PHASE15F_BOQ_ITEMS;
  });
  const [sections, setSections] = useState<BOQSectionDefinition[]>(STANDARD_BOQ_SECTIONS);
  const [numberingStyle, setNumberingStyle] = useState<BOQNumberingStyle>('ALPHANUMERIC');
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const [activeRevision, setActiveRevision] = useState<string>('BOQ Rev 02');

  // Selected item & view tabs
  const [selectedBoqId, setSelectedBoqId] = useState<string>(boqItems[0]?.boqId || '');
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<
    'SCHEDULE' | 'TRADE_SUMMARY' | 'LEVEL_SUMMARY' | 'MATERIAL_SCHEDULE' | 'BBS_SCHEDULE' | 'STEEL_MEMBERS' | 'ROOF_SKYLIGHT' | 'MEP_SYSTEMS' | 'QUALITY_GATE'
  >('SCHEDULE');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionCode, setSelectedSectionCode] = useState<string>('ALL');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal States
  const [show35ExcelModal, setShow35ExcelModal] = useState(false);
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [showTestSuiteModal, setShowTestSuiteModal] = useState(false);
  const [showDrawingToBoqModal, setShowDrawingToBoqModal] = useState(false);
  const [selectedProofItem, setSelectedProofItem] = useState<GeneratedBoqTakeoffItem | null>(null);
  const [autocadItem, setAutocadItem] = useState<BOQItemObject | null>(null);

  // Selected item object
  const selectedItem = useMemo(() => {
    return boqItems.find(i => i.boqId === selectedBoqId) || boqItems[0] || null;
  }, [boqItems, selectedBoqId]);

  // Apply Numbering Style
  const formattedItems = useMemo(() => {
    return BoqAssemblyEngine.applyNumberingStyle(boqItems, numberingStyle);
  }, [boqItems, numberingStyle]);

  // Filtered BOQ Items
  const filteredItems = useMemo(() => {
    return formattedItems.filter(item => {
      if (item.isVoid) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.itemCode.toLowerCase().includes(q) ||
          item.itemNumber.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q) ||
          item.sourceDrawing.toLowerCase().includes(q) ||
          (item.location && item.location.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Section Filter
      if (selectedSectionCode !== 'ALL' && item.sectionCode !== selectedSectionCode) {
        return false;
      }

      // Discipline Filter
      if (selectedDiscipline !== 'ALL' && item.discipline !== selectedDiscipline) {
        return false;
      }

      // Level Filter
      if (selectedLevel !== 'ALL') {
        if (!item.level || !item.level.toLowerCase().includes(selectedLevel.toLowerCase())) {
          return false;
        }
      }

      // Status Filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [formattedItems, searchQuery, selectedSectionCode, selectedDiscipline, selectedLevel, selectedStatus]);

  // Master Totals & Quality Report
  const masterTotals = useMemo(() => BoqAssemblyEngine.computeBoqTotals(boqItems), [boqItems]);
  const qualityReport = useMemo(() => BoqAssemblyEngine.evaluateQualityGate(boqItems), [boqItems]);

  // Multi-Perspective Summaries
  const tradeSummary = useMemo(() => BoqAssemblyEngine.generateTradeSummary(boqItems, sections), [boqItems, sections]);
  const levelSummary = useMemo(() => BoqAssemblyEngine.generateLevelSummary(boqItems), [boqItems]);
  const materialSummary = useMemo(() => BoqAssemblyEngine.generateMaterialSummary(boqItems), [boqItems]);
  const bbsSummary = useMemo(() => BoqAssemblyEngine.generateBbsSummary(boqItems), [boqItems]);
  const steelSummary = useMemo(() => BoqAssemblyEngine.generateSteelSummary(boqItems), [boqItems]);
  const roofSummary = useMemo(() => BoqAssemblyEngine.generateRoofSummary(boqItems), [boqItems]);
  const mepSummary = useMemo(() => BoqAssemblyEngine.generateMepSummary(boqItems), [boqItems]);

  // Handlers for In-line and Modal updates
  const handleUpdateItem = (updated: BOQItemObject) => {
    setBoqItems(prev => prev.map(i => (i.boqId === updated.boqId ? updated : i)));
  };

  const handleQuickEditQuantity = (boqId: string, newQtyStr: string) => {
    const item = boqItems.find(i => i.boqId === boqId);
    if (!item || isNaN(Number(newQtyStr))) return;
    const updated = BoqAssemblyEngine.editQuantity(item, Number(newQtyStr), 'Senior QS', 'Quick in-line quantity adjustment');
    handleUpdateItem(updated);
  };

  const handleQuickEditRate = (boqId: string, newRateStr: string) => {
    const item = boqItems.find(i => i.boqId === boqId);
    if (!item || isNaN(Number(newRateStr))) return;
    const updated = BoqAssemblyEngine.updateRate(item, Number(newRateStr));
    handleUpdateItem(updated);
  };

  const handleToggleVerify = (boqId: string) => {
    setBoqItems(prev =>
      prev.map(i => {
        if (i.boqId === boqId) {
          const newStatus = i.status === 'VERIFIED' ? 'REVIEW REQUIRED' : 'VERIFIED';
          return { ...i, status: newStatus };
        }
        return i;
      })
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. MASTER TOPBAR: PHASE 15F GOVERNANCE, ENGINES & EXCEL EXPORT */}
      {/* ========================================================================= */}
      <header className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 shrink-0 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Brand & Project Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-mono text-emerald-400 font-bold">
                  PHASE 15F — MASTER BOQ ASSEMBLY & 35-SHEET EXCEL ENGINE
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                    isFrozen
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {isFrozen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {isFrozen ? 'FROZEN (Locked)' : 'EDITABLE DRAFT'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  {activeRevision}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Apex Commercial & Industrial Logistics Facility — Unified Bill of Quantities
              </h1>
            </div>
          </div>

          {/* Action Engine Tools */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Quality Gate Status */}
            <button
              onClick={() => setActiveWorkspaceTab('QUALITY_GATE')}
              className={`px-3 py-1.5 rounded-lg border font-mono font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                qualityReport.finalAcceptanceStatus === 'PROFESSIONAL BOQ VERIFIED & APPROVED'
                  ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-amber-900/40 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
              }`}
              title="View Quality Control Gate & Completeness Audit"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Score: {qualityReport.overallCompletenessScore}%</span>
              <span className="text-[10px] opacity-75">
                ({qualityReport.finalAcceptanceStatus === 'PROFESSIONAL BOQ VERIFIED & APPROVED' ? 'PASSED' : 'REVIEW'})
              </span>
            </button>

            {/* Reconciliation Engine */}
            <button
              onClick={() => setShowReconciliationModal(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-600/50 font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Open Cross-Discipline Reconciliation Engine (RCC, Rebar, Steel, Roof, MEP)"
            >
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <span>Reconciliation Matrix</span>
            </button>

            {/* Input Impact Simulator */}
            <button
              onClick={() => setShowImpactModal(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-600/50 font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Simulate Parameter Variations (Wall thickness, Beam depth, Rebar size)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Impact Simulator</span>
            </button>

            {/* 10 Critical Tests Suite */}
            <button
              onClick={() => setShowTestSuiteModal(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-600/50 font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Run 10 Critical Acceptance Tests"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              <span>10 Critical Tests</span>
            </button>

            {/* Autonomous Drawing-to-BOQ Pipeline */}
            <button
              onClick={() => setShowDrawingToBoqModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              title="Upload DWG or PDF Drawing to Auto-Generate Real BOQ with Proof of Calculation"
            >
              <Calculator className="w-4 h-4 text-slate-950" />
              <span>UPLOAD DRAWING TO BOQ</span>
            </button>

            {/* 35-Sheet Master Excel Export Button */}
            <button
              onClick={() => setShow35ExcelModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Generate 35-Sheet Master Professional Excel Workbook (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>35-SHEET EXCEL EXPORT</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. PERSPECTIVE VIEW TABS */}
      {/* ========================================================================= */}
      <div className="bg-slate-800 text-slate-300 px-4 flex items-center justify-between border-b border-slate-700 overflow-x-auto shrink-0 text-xs">
        <div className="flex items-center gap-1 py-1.5">
          {[
            { id: 'SCHEDULE', label: 'Master Detailed BOQ (A-AA)', icon: FileSpreadsheet },
            { id: 'TRADE_SUMMARY', label: 'Trade Summary (27 Sec)', icon: Layers },
            { id: 'LEVEL_SUMMARY', label: 'Level Breakdown', icon: Building2 },
            { id: 'MATERIAL_SCHEDULE', label: 'Material Schedule', icon: Boxes },
            { id: 'BBS_SCHEDULE', label: 'Rebar BBS Schedule', icon: Calculator },
            { id: 'STEEL_MEMBERS', label: 'Structural Steel', icon: Briefcase },
            { id: 'ROOF_SKYLIGHT', label: 'Roof & Skylights', icon: ShieldCheck },
            { id: 'MEP_SYSTEMS', label: 'MEP Multi-Trade', icon: Sparkles },
            { id: 'QUALITY_GATE', label: 'Quality Control Gate', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeWorkspaceTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveWorkspaceTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'hover:bg-slate-700 text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Numbering Style Selector */}
        <div className="flex items-center gap-2 pl-4 py-1.5 border-l border-slate-700">
          <span className="text-[11px] text-slate-400 uppercase font-bold">Numbering:</span>
          <select
            value={numberingStyle}
            onChange={e => setNumberingStyle(e.target.value as BOQNumberingStyle)}
            className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-0.5 text-xs font-mono font-semibold"
          >
            <option value="ALPHANUMERIC">Alphanumeric (A-01, B-01...)</option>
            <option value="NUMERIC">Numeric (1, 2, 3...)</option>
            <option value="DECIMAL">Decimal (A.1, B.1...)</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE CONTAINER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* LEFT COLUMN: SECTION SELECTOR & FILTERS */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search BOQ items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Section Selector (A to AA) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Sections A through AA (27 Standards)
            </div>

            <button
              onClick={() => setSelectedSectionCode('ALL')}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                selectedSectionCode === 'ALL'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>All Sections (A-AA)</span>
              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
                {boqItems.length}
              </span>
            </button>

            {sections.map(sec => {
              const count = boqItems.filter(i => !i.isVoid && (i.sectionCode === sec.code || i.section.startsWith(sec.code + '.'))).length;
              return (
                <button
                  key={sec.code}
                  onClick={() => setSelectedSectionCode(sec.code)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    selectedSectionCode === sec.code
                      ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate pr-1">
                    <strong className="font-mono text-emerald-700">{sec.code}.</strong> {sec.name}
                  </span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER COLUMN: ACTIVE PERSPECTIVE VIEW */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {activeWorkspaceTab === 'SCHEDULE' && (
            <>
              {/* Table Controls & Summary Stats */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Master BOQ Items Schedule
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-semibold">
                    {filteredItems.length} Items Listed
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-500">Verified Amount: </span>
                    <strong className="text-emerald-700 font-bold">AED {masterTotals.verifiedTotalAmount.toLocaleString()}</strong>
                  </div>
                  <div className="border-l border-slate-300 pl-3">
                    <span className="text-slate-500">Grand Total: </span>
                    <strong className="text-slate-900 font-bold">AED {masterTotals.grandTotalAmount.toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              {/* Scrollable Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100/90 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200 shadow-xs">
                    <tr>
                      <th className="py-2.5 px-3 w-20">Item No</th>
                      <th className="py-2.5 px-3 w-24">Code</th>
                      <th className="py-2.5 px-3">Description & Specification</th>
                      <th className="py-2.5 px-3 text-center w-14">Unit</th>
                      <th className="py-2.5 px-3 text-right w-24">Quantity</th>
                      <th className="py-2.5 px-3 text-right w-20">Rate (AED)</th>
                      <th className="py-2.5 px-3 text-right w-24">Amount (AED)</th>
                      <th className="py-2.5 px-3 text-center w-24">Drawing Ref</th>
                      <th className="py-2.5 px-3 text-center w-24">Status</th>
                      <th className="py-2.5 px-3 text-right w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-sans">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          No BOQ items match the selected section or search query.
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map(item => {
                        const isSelected = selectedBoqId === item.boqId;
                        return (
                          <tr
                            key={item.boqId}
                            onClick={() => setSelectedBoqId(item.boqId)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-50/70 font-medium' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2.5 px-3 align-top font-mono font-bold text-emerald-800">
                              {item.itemNumber}
                            </td>
                            <td className="py-2.5 px-3 align-top font-mono text-slate-700">
                              {item.itemCode}
                            </td>
                            <td className="py-2.5 px-3 align-top">
                              <div className="text-slate-900 font-semibold leading-snug">{item.description}</div>
                              {item.specification && (
                                <div className="text-[11px] text-slate-500 mt-1 italic">
                                  <span className="font-semibold text-slate-600 font-mono">SPEC: </span>
                                  {item.specification}
                                </div>
                              )}
                              {item.deductions && item.deductions.length > 0 && (
                                <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-700 font-mono">
                                  <span className="px-1.5 py-0.2 rounded bg-rose-50 border border-rose-200 font-semibold">
                                    {item.deductions.length} Openings Deducted (-{item.deductionsTotal} {item.unit})
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center align-top font-mono font-bold text-blue-700">
                              {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right align-top font-mono font-bold text-slate-900">
                              {item.quantity.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right align-top font-mono text-slate-700">
                              AED {(item.rate || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right align-top font-mono font-bold text-slate-900">
                              AED {(item.amount || (item.quantity * (item.rate || 0))).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-center align-top">
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-indigo-700 font-semibold">
                                {item.sourceDrawing}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center align-top">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleVerify(item.boqId);
                                }}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase transition-all ${
                                  item.status === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : item.status === 'USER CORRECTED'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                    : item.status === 'CONFLICT'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                                }`}
                              >
                                {item.status}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right align-top">
                              <div className="flex items-center justify-end gap-1">
                                {/* AutoCAD 2021 Direct CAD Big Launch Hook */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAutocadItem(item);
                                  }}
                                  className="px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-mono font-bold flex items-center gap-0.5 transition-colors"
                                  title="Open in CAD Big (Suggested: AutoCAD 2021 v24.0 AC1032)"
                                >
                                  <span>CAD</span>
                                  <span className="text-[9px] text-rose-600 font-extrabold">2021</span>
                                </button>

                                {/* Proof of Calculation Modal trigger if item has proof */}
                                {(item as any).proof && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProofItem((item as any).proof);
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold flex items-center gap-0.5 transition-colors"
                                    title="Inspect Step-by-Step Proof of Calculation"
                                  >
                                    <span>Proof</span>
                                  </button>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBoqId(item.boqId);
                                    setShowDeductionModal(true);
                                  }}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title="Inspect Deduction & Calculation Math"
                                >
                                  <Calculator className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBoqId(item.boqId);
                                    setShowDescriptionModal(true);
                                  }}
                                  className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                  title="Edit Professional Description & View Audit Trail"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeWorkspaceTab === 'TRADE_SUMMARY' && (
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Trade-Wise BOQ Summary (Sections A to AA)</h3>
                  <p className="text-xs text-slate-500">27 Standard Work Categories Aggregated with Verification Counts</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Total Budget: AED {tradeSummary.reduce((a, b) => a + b.totalAmount, 0).toLocaleString()}
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Sec</th>
                      <th className="py-3 px-4">Trade Name / Scope</th>
                      <th className="py-3 px-4">Discipline</th>
                      <th className="py-3 px-4 text-center">Items</th>
                      <th className="py-3 px-4 text-center">Verified</th>
                      <th className="py-3 px-4 text-right">Total Qty</th>
                      <th className="py-3 px-4 text-center">Unit</th>
                      <th className="py-3 px-4 text-right">Trade Amount (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {tradeSummary.map(t => (
                      <tr key={t.sectionCode} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-800">{t.sectionCode}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{t.sectionName}</td>
                        <td className="py-3 px-4 text-slate-600">{t.discipline}</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold">{t.itemCount}</td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-700 font-bold">{t.verifiedCount}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold">{t.totalQuantity.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center font-mono text-blue-700 font-bold">{t.primaryUnit}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">AED {t.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'LEVEL_SUMMARY' && (
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Building Level-Wise Cost & Quantity Breakdown</h3>
                  <p className="text-xs text-slate-500">Spatial Cost Distribution from Substructure to Roof Level</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Building Level</th>
                      <th className="py-3 px-4 text-right">Civil (AED)</th>
                      <th className="py-3 px-4 text-right">RCC (AED)</th>
                      <th className="py-3 px-4 text-right">Rebar (AED)</th>
                      <th className="py-3 px-4 text-right">Steel (AED)</th>
                      <th className="py-3 px-4 text-right">Arch (AED)</th>
                      <th className="py-3 px-4 text-right">MEP (AED)</th>
                      <th className="py-3 px-4 text-right">Total Amount (AED)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {levelSummary.map((lvl, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{lvl.level}</td>
                        <td className="py-3.5 px-4 text-right font-mono">AED {lvl.civilAmount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-mono">AED {lvl.rccAmount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-mono">AED {lvl.rebarAmount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-mono">AED {lvl.steelAmount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-mono">AED {lvl.archAmount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-mono">AED {lvl.mepAmount.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">AED {lvl.totalAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'MATERIAL_SCHEDULE' && (
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Procurement & Material Schedule (With Scrap Factors)</h3>
                  <p className="text-xs text-slate-500">Verified Quantities vs Recommended Procurement Orders</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Material / Product Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Specification Tag</th>
                      <th className="py-3 px-4 text-center">Unit</th>
                      <th className="py-3 px-4 text-right">Verified Qty</th>
                      <th className="py-3 px-4 text-right">Procurement Order Qty</th>
                      <th className="py-3 px-4">Source Drawing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {materialSummary.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{m.material}</td>
                        <td className="py-3.5 px-4 text-slate-600">{m.category}</td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{m.specification}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-700">{m.unit}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold">{m.verifiedQuantity.toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">{m.procurementQuantity.toLocaleString()}</td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-indigo-700">{m.sourceSummary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'BBS_SCHEDULE' && (
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900">BBS Steel Reinforcement Schedule (Diameter Breakdown)</h3>
                  <p className="text-xs text-slate-500">100% Reconciled to Section E BOQ Item E-01 (13.50 Tonnes)</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Total Rebar: 13,500.0 kg (13.50 Tonnes)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {bbsSummary.map(bar => (
                  <div key={bar.diameterMm} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-base text-slate-900">Dia Ø{bar.diameterMm}mm</span>
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {bar.grade}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Length:</span>
                        <strong>{bar.totalLengthM} m</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Weight:</span>
                        <strong className="text-slate-900">{bar.totalWeightKg.toLocaleString()} kg</strong>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-slate-100">
                        <span>Metric Tonnes:</span>
                        <span>{bar.totalWeightTonne} t</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 pt-1">
                      Members: {bar.memberTypes.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'STEEL_MEMBERS' && (
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Structural Steel Members & Plates Register</h3>
                  <p className="text-xs text-slate-500">Universal Columns, Rafters and Connection Plates</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Total Steel: 5.000 Tonnes (Grade S355JR)
                </span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Member Section Designation</th>
                      <th className="py-3 px-4">Type / Function</th>
                      <th className="py-3 px-4 text-center">Count</th>
                      <th className="py-3 px-4 text-right">Length (m)</th>
                      <th className="py-3 px-4 text-right">Weight (kg)</th>
                      <th className="py-3 px-4 text-right">Weight (Tonnes)</th>
                      <th className="py-3 px-4 text-center">Steel Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {steelSummary.map((s, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{s.sectionName}</td>
                        <td className="py-3.5 px-4 text-slate-700">{s.sectionType}</td>
                        <td className="py-3.5 px-4 text-center font-mono font-semibold">{s.quantityCount}</td>
                        <td className="py-3.5 px-4 text-right font-mono">{s.totalLengthM} m</td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold">{s.totalWeightKg.toLocaleString()} kg</td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">{s.totalWeightTonne} t</td>
                        <td className="py-3.5 px-4 text-center font-mono text-blue-700 font-bold">{s.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'ROOF_SKYLIGHT' && (
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Roofing Cladding & Skylights Deduction Architecture</h3>
                  <p className="text-xs text-slate-500">Gross Roof Area - Skylight Openings = Net Insulated Cladding</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Reconciliation: 100% Reconciled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 text-center">
                  <span className="text-xs font-bold uppercase text-slate-500">1. Gross Roof Envelope</span>
                  <div className="text-2xl font-mono font-bold text-slate-900">{roofSummary.grossRoofAreaM2.toLocaleString()} m²</div>
                  <span className="text-[11px] text-slate-500">Source: DWG-ARC-05</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2 text-center">
                  <span className="text-xs font-bold uppercase text-rose-600">2. Skylights Deduction</span>
                  <div className="text-2xl font-mono font-bold text-rose-700">-{roofSummary.skylightAreaM2.toLocaleString()} m²</div>
                  <span className="text-[11px] text-slate-500">Section L Polycarbonate Panels</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-emerald-300 bg-emerald-50/50 shadow-xs space-y-2 text-center">
                  <span className="text-xs font-bold uppercase text-emerald-800">3. Net Roof Cladding</span>
                  <div className="text-2xl font-mono font-bold text-emerald-900">{roofSummary.netCladdingAreaM2.toLocaleString()} m²</div>
                  <span className="text-[11px] text-emerald-700 font-bold">Section K BOQ Item K-01</span>
                </div>
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'MEP_SYSTEMS' && (
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900">MEP Multi-Discipline Aggregation Matrix</h3>
                  <p className="text-xs text-slate-500">Electrical, HVAC, Plumbing, Fire Fighting and ELV Schedules</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Total MEP Budget: AED {mepSummary.totalMepAmount.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { name: 'Electrical Power & Lighting', items: mepSummary.electricalCount, amt: mepSummary.electricalAmount, code: 'Section X' },
                  { name: 'HVAC Air Handling & VRF', items: mepSummary.hvacCount, amt: mepSummary.hvacAmount, code: 'Section V' },
                  { name: 'Plumbing & Drainage', items: mepSummary.plumbingCount, amt: mepSummary.plumbingAmount, code: 'Section U' },
                  { name: 'Fire Fighting Sprinklers', items: mepSummary.fireCount, amt: mepSummary.fireAmount, code: 'Section W' },
                  { name: 'ELV, CCTV & Alarm', items: mepSummary.elvCount, amt: mepSummary.elvAmount, code: 'Section Y' }
                ].map((mep, idx) => (
                  <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {mep.code}
                    </span>
                    <h4 className="font-bold text-xs text-slate-900">{mep.name}</h4>
                    <div className="text-base font-mono font-bold text-slate-900">AED {mep.amt.toLocaleString()}</div>
                    <span className="text-[11px] text-slate-500">{mep.items} Line Items Scheduled</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeWorkspaceTab === 'QUALITY_GATE' && (
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Quality Control Gate & Completeness Audit Report</h3>
                  <p className="text-xs text-slate-500">6 Mathematical & Governance Checks required for Final Tender Certification</p>
                </div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                    qualityReport.finalAcceptanceStatus === 'PROFESSIONAL BOQ VERIFIED & APPROVED'
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                      : 'bg-amber-100 border-amber-300 text-amber-900'
                  }`}
                >
                  {qualityReport.finalAcceptanceStatus}
                </span>
              </div>

              {/* Quality Checks Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {qualityReport.qualityChecks.map(check => (
                  <div key={check.checkId} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-slate-500">{check.checkId}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          check.status === 'PASS'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : 'bg-rose-100 border-rose-300 text-rose-800'
                        }`}
                      >
                        {check.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900">{check.checkName}</h4>
                    <p className="text-xs text-slate-600">{check.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* RIGHT COLUMN: SELECTED ITEM DETAILS & AUDIT */}
        {selectedItem && (
          <aside className="w-full md:w-80 bg-slate-50 border-l border-slate-200 flex flex-col overflow-y-auto p-4 space-y-4 shrink-0">
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-emerald-700">{selectedItem.itemNumber}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {selectedItem.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedItem.description}</h3>
              <span className="text-[11px] text-slate-500 block mt-0.5">{selectedItem.section}</span>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowDeductionModal(true)}
                className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-colors shadow-xs"
              >
                <Calculator className="w-4 h-4 text-indigo-600 mb-1" />
                <span className="font-bold text-xs text-slate-900 block">Deduction Math</span>
                <span className="text-[10px] text-slate-500">Inspect Voids & Derivation</span>
              </button>

              <button
                onClick={() => setShowDescriptionModal(true)}
                className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-left transition-colors shadow-xs"
              >
                <Edit3 className="w-4 h-4 text-emerald-600 mb-1" />
                <span className="font-bold text-xs text-slate-900 block">Description QS</span>
                <span className="text-[10px] text-slate-500">Generate & Audit History</span>
              </button>
            </div>

            {/* Spatial Location */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Spatial Location & Provenance
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Level</span>
                  <span className="font-semibold text-slate-800">{selectedItem.level || 'All Levels'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Zone</span>
                  <span className="font-semibold text-slate-800">{selectedItem.zone || 'Core Building'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Drawing</span>
                  <span className="font-semibold text-indigo-700">{selectedItem.sourceDrawing}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Revision</span>
                  <span className="font-semibold text-slate-800">{selectedItem.revision}</span>
                </div>
              </div>
            </div>

            {/* Quantity Card */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Quantity Summary</div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-300">Final Net Quantity:</span>
                <span className="font-mono text-lg font-bold text-emerald-400">
                  {selectedItem.quantity.toLocaleString()} {selectedItem.unit}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-800 text-slate-400">
                <div>
                  <span>Gross: </span>
                  <span className="text-white font-semibold">{selectedItem.grossQuantity}</span>
                </div>
                <div className="text-right">
                  <span>Deductions: </span>
                  <span className="text-rose-400 font-semibold">-{selectedItem.deductionsTotal || 0}</span>
                </div>
              </div>
            </div>

            {/* Formula Expression */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Calculation Derivation
              </span>
              <div className="font-mono text-[11px] text-indigo-700 font-semibold">{selectedItem.formula}</div>
            </div>
          </aside>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS & SUB-ENGINES */}
      {/* ========================================================================= */}
      <BoqAssembly35ExcelModal
        isOpen={show35ExcelModal}
        onClose={() => setShow35ExcelModal(false)}
        items={boqItems}
      />

      <BoqReconciliationDashboardModal
        isOpen={showReconciliationModal}
        onClose={() => setShowReconciliationModal(false)}
        items={boqItems}
      />

      <BoqInputImpactModal
        isOpen={showImpactModal}
        onClose={() => setShowImpactModal(false)}
        items={boqItems}
        onApplyChanges={(updated) => setBoqItems(updated)}
      />

      <BoqDescriptionGeneratorModal
        isOpen={showDescriptionModal}
        onClose={() => setShowDescriptionModal(false)}
        item={selectedItem}
        onSave={handleUpdateItem}
      />

      <BoqDeductionInspectorModal
        isOpen={showDeductionModal}
        onClose={() => setShowDeductionModal(false)}
        item={selectedItem}
      />

      <BoqCriticalTestSuiteModal
        isOpen={showTestSuiteModal}
        onClose={() => setShowTestSuiteModal(false)}
        items={boqItems}
      />

      {/* Autonomous Drawing to Real BOQ Pipeline Modal */}
      {showDrawingToBoqModal && (
        <DrawingToBoqAutoPipelineModal
          isOpen={showDrawingToBoqModal}
          onClose={() => setShowDrawingToBoqModal(false)}
          project={null}
          onApplySuccess={(result) => {
            try {
              const updatedStr = localStorage.getItem('ai_boq_phase15f_items_active');
              if (updatedStr) {
                const parsed = JSON.parse(updatedStr);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  setBoqItems(parsed);
                }
              }
            } catch (e) {
              console.error('Failed to reload updated BOQ items:', e);
            }
          }}
        />
      )}

      {/* Proof of Calculation Modal */}
      {selectedProofItem && (
        <CalculationProofModal
          item={selectedProofItem}
          onClose={() => setSelectedProofItem(null)}
        />
      )}

      {/* AutoCAD 2021 Launch and Suggestion Modal */}
      {autocadItem && (
        <AutoCAD2021Modal
          isOpen={autocadItem !== null}
          onClose={() => setAutocadItem(null)}
          config={{
            drawingNumber: autocadItem.sourceDrawing || 'A-101',
            drawingTitle: autocadItem.description.split('.')[0] || 'Architectural & Structural Section',
            filename: `${autocadItem.sourceDrawing || 'DWG-001'}.dwg`,
            fileFormat: 'DWG',
            elementTag: autocadItem.category || autocadItem.sectionCode,
            itemCode: autocadItem.itemCode || autocadItem.boqId,
            category: autocadItem.sectionName || autocadItem.discipline,
            quantity: autocadItem.quantity,
            unit: autocadItem.unit,
            unitRateAed: autocadItem.rate,
            totalAmountAed: autocadItem.amount || (autocadItem.quantity * (autocadItem.rate || 0)),
            scale: '1:100',
          }}
        />
      )}
    </div>
  );
};
