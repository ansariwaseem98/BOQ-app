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
} from 'lucide-react';

import {
  UnifiedBoqItem,
  UnifiedBoqDiscipline,
  DrawingCoverageItem,
  ProjectAssumptionRecord,
  ProjectExclusionRecord,
  BoqRevisionRecord,
} from '../types';

import { UnifiedBoqEngine } from '../engine/unifiedBoqEngine';
import {
  INITIAL_UNIFIED_BOQ_ITEMS,
  INITIAL_DRAWING_COVERAGE,
  INITIAL_ASSUMPTIONS,
  INITIAL_EXCLUSIONS,
  INITIAL_BOQ_REVISIONS,
} from '../data/unifiedBoqInitialData';

import { BoqCalculationModal } from './BoqCalculationModal';
import { BoqEditItemModal } from './BoqEditItemModal';
import { BoqQualityDashboardModal } from './BoqQualityDashboardModal';
import { BoqRevisionModal } from './BoqRevisionModal';
import { BoqFreezeModal } from './BoqFreezeModal';
import { TenderPackageModal } from './TenderPackageModal';
import { DrawingCoverageModal } from './DrawingCoverageModal';
import { BoqTestSuiteModal } from './BoqTestSuiteModal';
import { AssumptionsExclusionsModal } from './AssumptionsExclusionsModal';
import { BoqDrawingPreviewModal } from './BoqDrawingPreviewModal';
import { TakeoffValidationModal } from './TakeoffValidationModal';
import { ReviewQueueModal } from './ReviewQueueModal';
import { EndToEndTestModal } from './EndToEndTestModal';
import { TakeoffErrorReportModal } from './TakeoffErrorReportModal';
import { ExportCenterModal } from './ExportCenterModal';
import { ExportTestSuiteModal } from './ExportTestSuiteModal';
import { SAMPLE_TEST_DRAWINGS, SAMPLE_TEST_ELEMENTS, SAMPLE_TEST_OPEN_ITEMS, SAMPLE_TEST_CONFLICTS, SAMPLE_TEST_REVISIONS, INITIAL_PROJECT } from '../data/initialData';

interface UnifiedBoqWorkspaceProps {
  onBackToDashboard?: () => void;
}

export const UnifiedBoqWorkspace: React.FC<UnifiedBoqWorkspaceProps> = ({ onBackToDashboard }) => {
  // Master State
  const [items, setItems] = useState<UnifiedBoqItem[]>(INITIAL_UNIFIED_BOQ_ITEMS);
  const [revisions, setRevisions] = useState<BoqRevisionRecord[]>(INITIAL_BOQ_REVISIONS);
  const [activeRevision, setActiveRevision] = useState<string>('BOQ Rev 00');
  const [isFrozen, setIsFrozen] = useState<boolean>(true);
  const [drawingsCoverage, setDrawingsCoverage] = useState<DrawingCoverageItem[]>(INITIAL_DRAWING_COVERAGE);
  const [assumptions, setAssumptions] = useState<ProjectAssumptionRecord[]>(INITIAL_ASSUMPTIONS);
  const [exclusions, setExclusions] = useState<ProjectExclusionRecord[]>(INITIAL_EXCLUSIONS);

  // Selected Item for Details Panel
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [calcModalItem, setCalcModalItem] = useState<UnifiedBoqItem | null>(null);
  const [editModalItem, setEditModalItem] = useState<UnifiedBoqItem | null>(null);
  const [drawingModalItem, setDrawingModalItem] = useState<UnifiedBoqItem | null>(null);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [showTenderModal, setShowTenderModal] = useState(false);
  const [showCoverageModal, setShowCoverageModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showAssumptionsModal, setShowAssumptionsModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showReviewQueueModal, setShowReviewQueueModal] = useState(false);
  const [showE2ETestModal, setShowE2ETestModal] = useState(false);
  const [showErrorReportModal, setShowErrorReportModal] = useState(false);
  const [showExportCenterModal, setShowExportCenterModal] = useState(false);
  const [showExportTestModal, setShowExportTestModal] = useState(false);

  // Calculate Quality Gate
  const qualityData = useMemo(() => {
    return UnifiedBoqEngine.evaluateQualityGate(items, drawingsCoverage);
  }, [items, drawingsCoverage]);

  // Selected Item Object
  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedItemId) || items[0] || null;
  }, [items, selectedItemId]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.itemCode.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.specification.toLowerCase().includes(q) ||
          item.section.toLowerCase().includes(q) ||
          item.primaryDrawingNumber.toLowerCase().includes(q) ||
          (item.room && item.room.toLowerCase().includes(q));
        if (!match) return false;
      }
      // Discipline filter
      if (selectedDiscipline !== 'ALL' && item.discipline !== selectedDiscipline) {
        return false;
      }
      // Level filter
      if (selectedLevel !== 'ALL') {
        if (!item.level || !item.level.toLowerCase().includes(selectedLevel.toLowerCase())) {
          return false;
        }
      }
      // Status filter
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, selectedDiscipline, selectedLevel, selectedStatus]);

  // Disciplines with counts
  const disciplineCounts = useMemo(() => {
    const map: { [d: string]: number } = {};
    items.forEach(i => {
      map[i.discipline] = (map[i.discipline] || 0) + 1;
    });
    return map;
  }, [items]);

  // Handlers
  const handleSaveItem = (updatedItem: UnifiedBoqItem) => {
    setItems(prev => prev.map(i => (i.id === updatedItem.id ? updatedItem : i)));
    setEditModalItem(null);
  };

  const handleToggleFreeze = (authorizedBy: string) => {
    setIsFrozen(prev => !prev);
    setRevisions(prev =>
      prev.map(r => (r.revisionCode === activeRevision ? { ...r, isFrozen: !isFrozen, frozenBy: authorizedBy, frozenAt: new Date().toISOString() } : r))
    );
  };

  const handleCreateRevision = (newCode: string, reason: string, basis: string) => {
    const diff = UnifiedBoqEngine.compareBoqRevisions(items, items, newCode, reason, 'Lead QS');
    diff.drawingRevisionBasis = basis;
    diff.isFrozen = false;
    setRevisions(prev => [diff, ...prev]);
    setActiveRevision(newCode);
    setIsFrozen(false);
  };

  const handleAddAssumption = (asm: ProjectAssumptionRecord) => {
    setAssumptions(prev => [asm, ...prev]);
  };

  const handleAddExclusion = (exc: ProjectExclusionRecord) => {
    setExclusions(prev => [exc, ...prev]);
  };

  const handleExportCsv = () => {
    const headers = [
      'Item Code',
      'Discipline',
      'Section',
      'Subsection',
      'Description',
      'Specification',
      'Unit',
      'Calculated Qty',
      'Final Qty',
      'Unit Rate',
      'Total Amount',
      'Drawing Ref',
      'Revision',
      'Status',
      'Formula',
    ];

    const rows = filteredItems.map(item => [
      `"${item.itemCode}"`,
      `"${item.discipline}"`,
      `"${item.section}"`,
      `"${item.subsection}"`,
      `"${item.description.replace(/"/g, '""')}"`,
      `"${item.specification.replace(/"/g, '""')}"`,
      `"${item.unit}"`,
      item.calculatedQuantity,
      item.finalQuantity,
      item.unitRate || 0,
      item.totalAmount || 0,
      `"${item.primaryDrawingNumber}"`,
      `"${item.revision}"`,
      `"${item.status}"`,
      `"${item.formula.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Unified_BOQ_${activeRevision.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Generate Tender Data
  const tenderData = useMemo(() => {
    return UnifiedBoqEngine.generateTenderPackage({
      projectName: 'Main Commercial Tower & Warehouse Facility',
      projectNumber: 'PRJ-2026-HQ-01',
      clientName: 'Apex Developments & Holdings Corp.',
      consultantName: 'Foster & Structural Engineering Partners',
      currency: 'USD',
      boqRevision: activeRevision,
      items,
      assumptions,
      exclusions,
      drawingsCount: drawingsCoverage.length,
    });
  }, [activeRevision, items, assumptions, exclusions, drawingsCoverage]);

  return (
    <div className="flex flex-col h-full bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* ========================================================================= */}
      {/* 1. TOP BAR: PROJECT INFORMATION, GOVERNANCE & QUICK ACTIONS */}
      {/* ========================================================================= */}
      <header className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 shrink-0 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Brand / Project Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-mono text-indigo-400 font-bold">
                  PHASE 9 — UNIFIED BOQ ASSEMBLY
                </span>
                <span className={`px-2 py-0.5 rounded text-2xs font-mono font-bold flex items-center gap-1 ${
                  isFrozen ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                }`}>
                  {isFrozen ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {isFrozen ? 'FROZEN (Read-Only)' : 'EDITABLE DRAFT'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-2xs">
                  {activeRevision}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Apex Commercial Tower & Warehouse Facility — Master Building BOQ
              </h1>
            </div>
          </div>

          {/* Action Tools & Governance Buttons */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Completeness Badge / Quality Gate Trigger */}
            <button
              onClick={() => setShowQualityModal(true)}
              className={`px-3 py-1.5 rounded-lg border font-mono font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                qualityData.qualityGatePassed
                  ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-rose-900/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/60'
              }`}
              title="View Quality Dashboard & Completeness Gate"
            >
              {qualityData.qualityGatePassed ? <CheckCircle2 className="w-4 h-4" /> : <AlertOctagon className="w-4 h-4" />}
              <span>Score: {qualityData.completenessScorePercent}%</span>
              <span className="text-2xs opacity-75">({qualityData.qualityGatePassed ? 'PASSED' : 'BLOCKED'})</span>
            </button>

            {/* Freeze BOQ */}
            <button
              onClick={() => setShowFreezeModal(true)}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-xs ${
                isFrozen
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isFrozen ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {isFrozen ? 'Unfreeze' : 'Freeze BOQ'}
            </button>

            {/* Revision Management */}
            <button
              onClick={() => setShowRevisionModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <GitCommit className="w-3.5 h-3.5 text-indigo-400" />
              Revisions ({revisions.length})
            </button>

            {/* Drawing Coverage Matrix */}
            <button
              onClick={() => setShowCoverageModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              Drawings Matrix ({drawingsCoverage.length})
            </button>

            {/* Assumptions & Exclusions */}
            <button
              onClick={() => setShowAssumptionsModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              Assumptions ({assumptions.length})
            </button>

            {/* Tender Package */}
            <button
              onClick={() => setShowTenderModal(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Tender Package
            </button>

            {/* Phase 10: Validation Dashboard */}
            <button
              onClick={() => setShowValidationModal(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Compare Takeoff Quantities against Ground-Truth Reference Baselines"
            >
              <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Validation Dashboard</span>
            </button>

            {/* Phase 10: Review Queue */}
            <button
              onClick={() => setShowReviewQueueModal(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/60 font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Prioritized Human Verification & Resolution Queue"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Review Queue</span>
            </button>

            {/* Phase 10: 56 End-to-End Tests */}
            <button
              onClick={() => setShowE2ETestModal(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Run 56-Rule End-to-End Pipeline & Integrity Test Suite"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>56 E2E Tests</span>
            </button>

            {/* Phase 10: Defect & Error Report */}
            <button
              onClick={() => setShowErrorReportModal(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
              title="View Takeoff Error & Review Audit Register"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Error Log</span>
            </button>

            {/* Phase 11: Export Center (Primary) */}
            <button
              onClick={() => setShowExportCenterModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold flex items-center gap-1.5 transition-all shadow-sm"
              title="Open Professional Excel Export Center (.xlsx Workbooks, BBS, Abstract)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>EXPORT CENTER</span>
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN 3-COLUMN WORKSPACE LAYOUT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: HIERARCHY TREE, DISCIPLINE SELECTOR & SPATIAL FILTERS */}
        {/* ======================================================================= */}
        <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col overflow-hidden shrink-0">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search code, desc, drawing..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Spatial / Level Filter */}
          <div className="px-3 py-2 border-b border-slate-200 bg-slate-50/50">
            <label className="text-2xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Building Level Filter
            </label>
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Levels & Zones</option>
              <option value="Substructure">Substructure & Foundations</option>
              <option value="Ground Floor">Ground Floor</option>
              <option value="Levels 01 to 06">Typical Floors (01-06)</option>
              <option value="Roof">Roof & Framing</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="px-3 py-2 border-b border-slate-200 bg-slate-50/50">
            <label className="text-2xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Verification Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-white font-medium text-slate-700"
            >
              <option value="ALL">All Verification Statuses</option>
              <option value="FINAL">FINAL (Approved)</option>
              <option value="USER_VERIFIED">USER_VERIFIED</option>
              <option value="REQUIRES_REVIEW">REQUIRES_REVIEW</option>
              <option value="OPEN_ITEM">OPEN_ITEM (Blocked)</option>
              <option value="CONFLICT">CONFLICT (Blocked)</option>
            </select>
          </div>

          {/* Disciplines Hierarchy List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-2 py-1 text-2xs font-bold text-slate-400 uppercase tracking-wider">
              Project Disciplines A — U ({items.length} Total Items)
            </div>

            <button
              onClick={() => setSelectedDiscipline('ALL')}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                selectedDiscipline === 'ALL'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <span>All Disciplines (Full BOQ)</span>
              <span className="font-mono text-2xs bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
                {items.length}
              </span>
            </button>

            {Object.keys(disciplineCounts).sort().map(disc => (
              <button
                key={disc}
                onClick={() => setSelectedDiscipline(disc)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                  selectedDiscipline === disc
                    ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="truncate pr-1">{disc}</span>
                <span className="font-mono text-2xs bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full shrink-0">
                  {disciplineCounts[disc]}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* ======================================================================= */}
        {/* CENTER COLUMN: UNIFIED BOQ TABLE */}
        {/* ======================================================================= */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Table Header Controls */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Unified BOQ Schedule
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono text-2xs font-semibold">
                {filteredItems.length} of {items.length} Items Listed
              </span>
            </div>
            <div className="text-2xs text-slate-500">
              Click any line item to inspect formulas, deductions and drawing provenance.
            </div>
          </div>

          {/* Table Scrollable Container */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/90 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200 shadow-xs">
                <tr>
                  <th className="py-2.5 px-3 w-28">Item Code</th>
                  <th className="py-2.5 px-3">Description & Technical Specification</th>
                  <th className="py-2.5 px-3 text-center w-16">Unit</th>
                  <th className="py-2.5 px-3 text-right w-24">Quantity</th>
                  <th className="py-2.5 px-3 text-center w-28">Drawing Ref</th>
                  <th className="py-2.5 px-3 text-center w-28">Status</th>
                  <th className="py-2.5 px-3 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No BOQ items match the current search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const isSelected = selectedItemId === item.id;
                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedItemId(item.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/70 font-medium'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Item Code & Subsection */}
                        <td className="py-2.5 px-3 align-top">
                          <span className="font-mono font-bold text-slate-900 block">{item.itemCode}</span>
                          <span className="text-2xs text-slate-500 truncate block max-w-[100px]">{item.subsection}</span>
                        </td>

                        {/* Description & Technical Specification */}
                        <td className="py-2.5 px-3 align-top">
                          <div className="text-slate-900 font-semibold leading-snug">{item.description}</div>
                          {item.specification && (
                            <div className="text-2xs text-slate-500 mt-1 italic leading-tight">
                              <span className="font-semibold text-slate-600 font-mono">SPEC: </span>
                              {item.specification}
                            </div>
                          )}
                          {item.deductionsList && item.deductionsList.length > 0 && (
                            <div className="mt-1 flex items-center gap-1 text-2xs text-amber-700 font-mono">
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 font-semibold">
                                {item.deductionsList.length} Voids Deducted (-{item.deductionsTotal.toFixed(2)} {item.unit})
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Unit */}
                        <td className="py-2.5 px-3 text-center align-top font-mono font-medium text-slate-600">
                          {item.unit}
                        </td>

                        {/* Quantity (Calculated / Override / Final) */}
                        <td className="py-2.5 px-3 text-right align-top font-mono font-bold text-slate-900">
                          <div>{item.finalQuantity.toLocaleString()}</div>
                          {item.isManuallyOverridden && (
                            <span className="text-2xs text-blue-600 block font-normal">(Overridden)</span>
                          )}
                        </td>

                        {/* Drawing Ref */}
                        <td className="py-2.5 px-3 text-center align-top">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDrawingModalItem(item);
                            }}
                            className="font-mono text-2xs px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-indigo-700 font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            {item.primaryDrawingNumber}
                          </button>
                          <span className="text-2xs text-slate-400 block mt-0.5">{item.revision}</span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 text-center align-top">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-2xs font-bold ${
                            item.status === 'FINAL' || item.status === 'USER_VERIFIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'REQUIRES_REVIEW'
                              ? 'bg-amber-100 text-amber-800'
                              : item.status === 'OPEN_ITEM' || item.status === 'CONFLICT'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right align-top">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCalcModalItem(item);
                              }}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="Inspect Calculation Formula"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditModalItem(item);
                              }}
                              disabled={isFrozen}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30"
                              title={isFrozen ? 'BOQ is Frozen' : 'Edit Item'}
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
        </main>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: SELECTED ITEM DETAILS & TRACEABILITY PANEL */}
        {/* ======================================================================= */}
        {selectedItem && (
          <aside className="w-full md:w-80 bg-slate-50 border-l border-slate-200 flex flex-col overflow-y-auto p-4 space-y-4 shrink-0">
            {/* Header */}
            <div className="border-b border-slate-200 pb-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600">{selectedItem.itemCode}</span>
                <span className="text-2xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {selectedItem.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedItem.description}</h3>
              <span className="text-2xs text-slate-500 block mt-0.5">{selectedItem.section}</span>
            </div>

            {/* Spatial Location */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 text-xs">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                Spatial Location
              </span>
              <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
                <div>
                  <span className="text-slate-400 block">Level</span>
                  <span className="font-semibold text-slate-800">{selectedItem.level || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Zone</span>
                  <span className="font-semibold text-slate-800">{selectedItem.zone || 'Core'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Building/Block</span>
                  <span className="font-semibold text-slate-800">{selectedItem.building || 'Main Facility'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Element Mark</span>
                  <span className="font-semibold text-indigo-600">{selectedItem.physicalElementId || '—'}</span>
                </div>
              </div>
            </div>

            {/* Technical Specification */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                  Technical Specification
                </span>
                <span className="text-2xs px-1.5 py-0.2 rounded bg-slate-100 font-semibold font-mono">
                  {selectedItem.specificationFlag || 'CONFIRMED'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {selectedItem.specification || 'Standard project specifications apply.'}
              </p>
            </div>

            {/* Quantity Breakdown Card */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-2">
              <div className="text-2xs text-slate-400 font-bold uppercase tracking-wider">Quantity Summary</div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xs text-slate-300">Final Net Quantity:</span>
                <span className="font-mono text-lg font-bold text-emerald-400">
                  {selectedItem.finalQuantity.toLocaleString()} {selectedItem.unit}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-2xs font-mono pt-2 border-t border-slate-800 text-slate-400">
                <div>
                  <span>Gross: </span>
                  <span className="text-white font-semibold">{selectedItem.grossQuantity}</span>
                </div>
                <div className="text-right">
                  <span>Deductions: </span>
                  <span className="text-amber-400 font-semibold">-{selectedItem.deductionsTotal}</span>
                </div>
              </div>
            </div>

            {/* Formula & Calculation Expression */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 text-xs">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                Calculation Derivation
              </span>
              <div className="font-mono text-2xs text-indigo-700 font-semibold">{selectedItem.formula}</div>
              <div className="font-mono text-2xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 break-all">
                {selectedItem.expressionWithValues}
              </div>
            </div>

            {/* Source Reference Link */}
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 text-xs">
              <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider block">
                Takeoff Source Reference
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xs text-slate-500">Drawing Sheet:</span>
                <button
                  onClick={() => setDrawingModalItem(selectedItem)}
                  className="font-mono text-2xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" />
                  {selectedItem.primaryDrawingNumber} ({selectedItem.revision})
                </button>
              </div>
              <div className="flex items-center justify-between text-2xs font-mono">
                <span className="text-slate-500">Module Source ID:</span>
                <span className="text-slate-800 font-semibold">{selectedItem.takeoffSourceId}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => setCalcModalItem(selectedItem)}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Calculator className="w-3.5 h-3.5" />
                Inspect Full Calculation
              </button>
              <button
                onClick={() => setEditModalItem(selectedItem)}
                disabled={isFrozen}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                {isFrozen ? 'Locked (Frozen Revision)' : 'Edit BOQ Item'}
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM LIVE FORMULA / AUDIT FOOTER */}
      {/* ========================================================================= */}
      {selectedItem && (
        <footer className="bg-slate-900 text-slate-300 px-4 py-2 border-t border-slate-800 shrink-0 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <span className="text-indigo-400 font-bold">DERIVATION:</span>
            <span className="text-slate-100 truncate">{selectedItem.expressionWithValues}</span>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-2xs text-slate-400">
            <span>SOURCE: {selectedItem.primaryDrawingNumber} ({selectedItem.revision})</span>
            <span>STATUS: <strong className="text-emerald-400">{selectedItem.status}</strong></span>
          </div>
        </footer>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {calcModalItem && (
        <BoqCalculationModal
          item={calcModalItem}
          onClose={() => setCalcModalItem(null)}
        />
      )}

      {editModalItem && (
        <BoqEditItemModal
          item={editModalItem}
          isFrozen={isFrozen}
          onSave={handleSaveItem}
          onClose={() => setEditModalItem(null)}
        />
      )}

      {drawingModalItem && (
        <BoqDrawingPreviewModal
          item={drawingModalItem}
          onClose={() => setDrawingModalItem(null)}
        />
      )}

      {showQualityModal && (
        <BoqQualityDashboardModal
          data={qualityData}
          onClose={() => setShowQualityModal(false)}
        />
      )}

      {showRevisionModal && (
        <BoqRevisionModal
          revisions={revisions}
          activeRevision={activeRevision}
          items={items}
          onCreateRevision={handleCreateRevision}
          onClose={() => setShowRevisionModal(false)}
        />
      )}

      {showFreezeModal && (
        <BoqFreezeModal
          isFrozen={isFrozen}
          activeRevision={activeRevision}
          qualityData={qualityData}
          onConfirmToggleFreeze={handleToggleFreeze}
          onClose={() => setShowFreezeModal(false)}
        />
      )}

      {showTenderModal && (
        <TenderPackageModal
          tenderData={tenderData}
          onClose={() => setShowTenderModal(false)}
        />
      )}

      {showCoverageModal && (
        <DrawingCoverageModal
          coverageList={drawingsCoverage}
          onClose={() => setShowCoverageModal(false)}
        />
      )}

      {showTestModal && (
        <BoqTestSuiteModal
          onClose={() => setShowTestModal(false)}
        />
      )}

      {showAssumptionsModal && (
        <AssumptionsExclusionsModal
          assumptions={assumptions}
          exclusions={exclusions}
          onAddAssumption={handleAddAssumption}
          onAddExclusion={handleAddExclusion}
          onClose={() => setShowAssumptionsModal(false)}
        />
      )}

      {showValidationModal && (
        <TakeoffValidationModal
          isOpen={showValidationModal}
          onClose={() => setShowValidationModal(false)}
          boqItems={items}
          onInspectCalculation={(item) => setCalcModalItem(item)}
          onInspectDrawing={(dwg) => {
            const match = items.find((i) => i.primaryDrawingNumber === dwg);
            if (match) setDrawingModalItem(match);
          }}
        />
      )}

      {showReviewQueueModal && (
        <ReviewQueueModal
          isOpen={showReviewQueueModal}
          onClose={() => setShowReviewQueueModal(false)}
          onInspectDrawing={(dwg) => {
            const match = items.find((i) => i.primaryDrawingNumber === dwg);
            if (match) setDrawingModalItem(match);
          }}
        />
      )}

      {showE2ETestModal && (
        <EndToEndTestModal
          isOpen={showE2ETestModal}
          onClose={() => setShowE2ETestModal(false)}
        />
      )}

      {showErrorReportModal && (
        <TakeoffErrorReportModal
          isOpen={showErrorReportModal}
          onClose={() => setShowErrorReportModal(false)}
        />
      )}

      {showExportCenterModal && (
        <ExportCenterModal
          isOpen={showExportCenterModal}
          onClose={() => setShowExportCenterModal(false)}
          projectData={INITIAL_PROJECT}
          drawings={SAMPLE_TEST_DRAWINGS}
          boqItems={items}
          elements={SAMPLE_TEST_ELEMENTS}
          bbsRecords={[]}
          openItems={SAMPLE_TEST_OPEN_ITEMS}
          conflicts={SAMPLE_TEST_CONFLICTS}
          assumptions={assumptions}
          exclusions={exclusions}
          revisions={SAMPLE_TEST_REVISIONS}
          onOpenTestRunner={() => setShowExportTestModal(true)}
        />
      )}

      {showExportTestModal && (
        <ExportTestSuiteModal
          isOpen={showExportTestModal}
          onClose={() => setShowExportTestModal(false)}
        />
      )}
    </div>
  );
};
