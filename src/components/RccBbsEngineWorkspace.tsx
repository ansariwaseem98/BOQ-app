/**
 * PHASE 15B — PROFESSIONAL RCC + REINFORCEMENT + BBS MASTER WORKSPACE
 * Deterministic Engineering Engine complying with IS 456 / BS 8666 / SP 34
 * Features:
 * 1. RCC Element Breakdown (3D volumes, openings deductions, beam web deductions, stepped footings, stair components)
 * 2. Professional BBS Master Table (Shapes, Hooks, Bends, Laps, Anchorage, d²/162 weight formula)
 * 3. Summaries by Diameter & Member Category with Rebar Density (kg/m³)
 * 4. 25-Point Automated Verification Suite (including all 11 Critical Tests)
 * 5. Open Item & Conflict Engine (Zero Guesswork, Plan vs Schedule Conflict Resolver)
 * 6. Revision Delta Impact Analysis
 * 7. Interactive Shape Visualizer & Provenance Source Viewer
 * 8. Comprehensive Excel / CSV Export
 */

import React, { useState, useMemo } from 'react';
import {
  RccElementObject,
  ReinforcementBarRecord,
  RccBbsOpenItem,
  RccBbsConflict,
  BbsRevisionRecord,
  RccBbsProjectSettings,
  RebarShapeCode
} from '../types/rccBbsTypes';
import {
  DEFAULT_RCC_BBS_SETTINGS,
  calculateRebarUnitWeight,
  calculateBarCountFromSpacing,
  calculateCuttingLength,
  calculateRccElementVolume,
  recalculateRebarRecord,
  generateRebarSummaryByDiameter,
  generateRebarSummaryByMember,
  generateRccQuantitySummary,
  getInitialRccElements,
  getInitialReinforcementBars,
  getInitialRccBbsOpenItems,
  getInitialRccBbsConflicts,
  getInitialBbsRevisions
} from '../engine/rccBbsEngine';
import { runRccBbsTestSuite, RccBbsTestCaseResult } from '../engine/rccBbsTestSuite';
import { RebarShapeVisualizer } from './RebarShapeVisualizer';
import { RccBbsEditModal } from './RccBbsEditModal';
import {
  Scale,
  Calculator,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Eye,
  Edit3,
  Search,
  Filter,
  Download,
  Info,
  ShieldCheck,
  History,
  AlertOctagon,
  TrendingUp,
  Settings2,
  Maximize2,
  Check,
  X,
  FileText,
  ArrowRight
} from 'lucide-react';

interface RccBbsEngineWorkspaceProps {
  onNavigateToDrawing?: (drawingNumber: string, page: number) => void;
}

export const RccBbsEngineWorkspace: React.FC<RccBbsEngineWorkspaceProps> = ({
  onNavigateToDrawing,
}) => {
  // Master State
  const [projectSettings, setProjectSettings] = useState<RccBbsProjectSettings>(DEFAULT_RCC_BBS_SETTINGS);
  const [elements, setElements] = useState<RccElementObject[]>(() => getInitialRccElements());
  const [rebarRecords, setRebarRecords] = useState<ReinforcementBarRecord[]>(() => getInitialReinforcementBars());
  const [openItems, setOpenItems] = useState<RccBbsOpenItem[]>(() => getInitialRccBbsOpenItems());
  const [conflicts, setConflicts] = useState<RccBbsConflict[]>(() => getInitialRccBbsConflicts());
  const [revisions, setRevisions] = useState<BbsRevisionRecord[]>(() => getInitialBbsRevisions());

  // Active View Tab
  const [activeTab, setActiveTab] = useState<
    'BBS_SCHEDULE' | 'RCC_ELEMENTS' | 'BY_DIAMETER' | 'BY_MEMBER' | 'TEST_SUITE' | 'OPEN_ITEMS' | 'REVISIONS'
  >('BBS_SCHEDULE');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDiameter, setSelectedDiameter] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [editingBar, setEditingBar] = useState<ReinforcementBarRecord | null>(null);
  const [previewingBar, setPreviewingBar] = useState<ReinforcementBarRecord | null>(null);
  const [selectedSourceBar, setSelectedSourceBar] = useState<ReinforcementBarRecord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Test Suite Execution State
  const [testResults, setTestResults] = useState<ReturnType<typeof runRccBbsTestSuite> | null>(() => runRccBbsTestSuite());

  // Summaries
  const diameterSummary = useMemo(() => generateRebarSummaryByDiameter(rebarRecords), [rebarRecords]);
  const memberSummary = useMemo(() => generateRebarSummaryByMember(elements, rebarRecords), [elements, rebarRecords]);
  const rccSummary = useMemo(() => generateRccQuantitySummary(elements), [elements]);

  const totalRebarWeightKg = useMemo(() => {
    return rebarRecords.reduce((sum, r) => sum + (r.isBlocked ? 0 : r.totalWeightKg), 0);
  }, [rebarRecords]);

  const totalRebarWeightTonnes = useMemo(() => {
    return Number((totalRebarWeightKg / 1000).toFixed(3));
  }, [totalRebarWeightKg]);

  const totalConcreteVolumeM3 = rccSummary.totalConcreteVolumeM3;
  const overallRebarRatio = totalConcreteVolumeM3 > 0 ? Number((totalRebarWeightKg / totalConcreteVolumeM3).toFixed(1)) : 0;

  // Filtered Rebar
  const filteredRebar = useMemo(() => {
    return rebarRecords.filter((r) => {
      const matchQuery =
        r.barMark.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.member.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.rawNotation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.shapeDescription.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQuery) return false;
      if (selectedCategory !== 'ALL' && r.elementType !== selectedCategory) return false;
      if (selectedDiameter !== 'ALL' && r.diameterMm !== Number(selectedDiameter)) return false;
      if (selectedStatus === 'BLOCKED' && !r.isBlocked) return false;
      if (selectedStatus === 'VERIFIED' && r.status !== 'Verified') return false;
      if (selectedStatus === 'OPEN_ITEMS' && r.associatedOpenItemIds.length === 0) return false;

      return true;
    });
  }, [rebarRecords, searchQuery, selectedCategory, selectedDiameter, selectedStatus]);

  // Handlers
  const handleSaveBar = (updatedBar: ReinforcementBarRecord, reason: string) => {
    const recalculated = recalculateRebarRecord(updatedBar, projectSettings);
    
    // Append correction log
    const correctionEntry = {
      id: `CORR-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      user: 'Senior Structural Engineer',
      fieldChanged: 'BBS Geometric & Quantity Parameters',
      originalValue: `${editingBar?.cuttingLengthM.toFixed(3)}m / ${editingBar?.totalWeightKg.toFixed(2)}kg`,
      correctedValue: `${recalculated.cuttingLengthM.toFixed(3)}m / ${recalculated.totalWeightKg.toFixed(2)}kg`,
      reason: reason,
      source: 'Manual Engineer Override in BBS Edit Modal',
    };

    recalculated.corrections = [correctionEntry, ...(recalculated.corrections || [])];

    setRebarRecords((prev) => prev.map((item) => (item.id === recalculated.id ? recalculated : item)));
  };

  const handleVerifyBar = (id: string) => {
    setRebarRecords((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: 'Verified',
            isBlocked: false,
            blockedReason: null,
          };
        }
        return item;
      })
    );
  };

  const handleRunTests = () => {
    const results = runRccBbsTestSuite();
    setTestResults(results);
  };

  const handleResolveConflict = (conflictId: string, resolutionNote: string) => {
    setConflicts((prev) =>
      prev.map((c) =>
        c.id === conflictId
          ? {
              ...c,
              status: 'RESOLVED',
              resolvedBy: 'Lead Structural QA',
              resolvedAt: new Date().toISOString().slice(0, 10),
              resolutionNote: resolutionNote,
            }
          : c
      )
    );
  };

  // CSV / Excel Export
  const handleExportCsv = () => {
    const headers = [
      'Bar Mark',
      'Member',
      'Element Type',
      'Level',
      'Steel Grade',
      'Dia (mm)',
      'Shape Code',
      'Shape Description',
      'Cutting Length (m)',
      'Bars/Member',
      'Members',
      'Total Bars',
      'Total Length (m)',
      'Unit Wt (kg/m)',
      'Total Weight (kg)',
      'Total Weight (t)',
      'Status',
      'Primary Drawing',
      'Page',
      'Raw Notation',
    ];

    const rows = rebarRecords.map((r) => [
      r.barMark,
      `"${r.member.replace(/"/g, '""')}"`,
      r.elementType,
      r.level,
      r.grade,
      r.diameterMm,
      r.shapeCode,
      `"${r.shapeDescription}"`,
      r.cuttingLengthM.toFixed(3),
      r.numberOfBarsPerMember,
      r.numberOfMembers,
      r.totalNumberOfBars,
      r.totalLengthM.toFixed(3),
      r.unitWeightKgM.toFixed(3),
      r.totalWeightKg.toFixed(2),
      r.totalWeightTonnes.toFixed(3),
      r.status,
      r.primarySource.drawingNumber,
      r.primarySource.pageNumber,
      `"${r.rawNotation.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        '# PHASE 15B PROFESSIONAL BAR BENDING SCHEDULE (BBS) EXPORT',
        `# Total Rebar Weight: ${totalRebarWeightKg.toFixed(2)} kg (${totalRebarWeightTonnes.toFixed(3)} Tonnes) | Total Concrete: ${totalConcreteVolumeM3.toFixed(2)} m³ | Overall Density: ${overallRebarRatio} kg/m³`,
        headers.join(','),
        ...rows.map((e) => e.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Professional_BBS_Master_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  RCC & Professional BBS Engine (Phase 15B)
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Deterministic Core Active
                </span>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                  IS 456 / BS 8666
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                Zero guesswork arithmetic core. Unit weights evaluated via exact formula (d²/162 = 1.580 kg/m for Ø16).
                Missing laps, covers, or grades trigger blocking Open Items. Conflicting annotations are isolated without silent assumptions.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRunTests}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>RUN 25-POINT TEST SUITE</span>
              {testResults && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[10px]">
                  {testResults.passedTests}/{testResults.totalTests}
                </span>
              )}
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>EXPORT BBS (CSV/EXCEL)</span>
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Project BBS Rules & Unit Weight Formulas"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Rebar Weight</span>
            <div className="text-lg font-black text-indigo-900 mt-0.5">
              {totalRebarWeightKg.toFixed(2)} <span className="text-xs font-semibold text-slate-600">kg</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-600">({totalRebarWeightTonnes.toFixed(3)} Tonnes)</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Concrete Vol</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {totalConcreteVolumeM3.toFixed(2)} <span className="text-xs font-semibold text-slate-600">m³</span>
            </div>
            <span className="text-[10px] text-slate-500">{elements.length} RCC Elements</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rebar Density Ratio</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {overallRebarRatio} <span className="text-xs font-semibold text-slate-600">kg/m³</span>
            </div>
            <span className="text-[10px] text-slate-500">Global Structural Ratio</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Rebar Master Items</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">
              {rebarRecords.length} <span className="text-xs font-semibold text-slate-600">Bars</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">100% Deduplicated</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Open Queries (RFI)</span>
            <div className={`text-lg font-black mt-0.5 ${openItems.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {openItems.length} <span className="text-xs font-semibold text-slate-600">Items</span>
            </div>
            <span className="text-[10px] text-amber-700 font-semibold">Zero Guesswork</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Conflicts Isolated</span>
            <div className={`text-lg font-black mt-0.5 ${conflicts.filter(c => c.status === 'OPEN').length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {conflicts.filter(c => c.status === 'OPEN').length} <span className="text-xs font-semibold text-slate-600">Open</span>
            </div>
            <span className="text-[10px] text-slate-500">Plan vs Schedule</span>
          </div>
        </div>
      </div>

      {/* Main View Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 overflow-x-auto text-xs font-bold">
        {[
          { id: 'BBS_SCHEDULE', label: '1. Master BBS Rebar Register', count: rebarRecords.length },
          { id: 'RCC_ELEMENTS', label: '2. RCC Concrete Volume Takeoff', count: elements.length },
          { id: 'BY_DIAMETER', label: '3. Summary by Diameter', count: diameterSummary.length },
          { id: 'BY_MEMBER', label: '4. Summary by Member & Density', count: memberSummary.length },
          { id: 'TEST_SUITE', label: '5. 25-Point Verification Suite', count: '25 Tests', isBadge: true },
          { id: 'OPEN_ITEMS', label: '6. Open Items & Conflicts', count: openItems.length + conflicts.length, isWarning: (openItems.length + conflicts.length) > 0 },
          { id: 'REVISIONS', label: '7. Revision Delta Impact', count: revisions.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3.5 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  tab.isBadge
                    ? 'bg-indigo-600 text-white'
                    : tab.isWarning
                    ? 'bg-amber-100 text-amber-800 font-bold'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB CONTENT AREAS */}

      {/* TAB 1: MASTER BBS SCHEDULE */}
      {activeTab === 'BBS_SCHEDULE' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bar mark, member, notation, shape..."
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">All Member Types</option>
                <option value="Footing">Footing</option>
                <option value="Column">Column</option>
                <option value="Beam">Beam</option>
                <option value="Slab">Slab</option>
                <option value="RCC Wall">RCC Wall</option>
                <option value="Staircase">Staircase</option>
              </select>

              <select
                value={selectedDiameter}
                onChange={(e) => setSelectedDiameter(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 font-mono"
              >
                <option value="ALL">All Diameters</option>
                <option value="8">Ø8 mm</option>
                <option value="10">Ø10 mm</option>
                <option value="12">Ø12 mm</option>
                <option value="16">Ø16 mm</option>
                <option value="20">Ø20 mm</option>
                <option value="25">Ø25 mm</option>
                <option value="32">Ø32 mm</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">Verified Only</option>
                <option value="BLOCKED">Blocked Only</option>
                <option value="OPEN_ITEMS">Has Open Items</option>
              </select>
            </div>
          </div>

          {/* BBS Master Data Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-3">Mark</th>
                  <th className="py-3 px-3">Member Ref</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Grade</th>
                  <th className="py-3 px-2 font-mono">Dia</th>
                  <th className="py-3 px-3">Shape & Diagram</th>
                  <th className="py-3 px-2 font-mono">Cutting L (m)</th>
                  <th className="py-3 px-2 font-mono text-center">No/Memb</th>
                  <th className="py-3 px-2 font-mono text-center">Memb</th>
                  <th className="py-3 px-2 font-mono text-center font-black text-indigo-950">Total</th>
                  <th className="py-3 px-2 font-mono text-right">Tot L (m)</th>
                  <th className="py-3 px-2 font-mono text-right">Unit Wt (kg/m)</th>
                  <th className="py-3 px-3 font-mono text-right font-black text-indigo-900">Total Wt (kg)</th>
                  <th className="py-3 px-2 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRebar.map((bar) => (
                  <tr
                    key={bar.id}
                    className={`hover:bg-indigo-50/30 transition-colors ${
                      bar.isBlocked ? 'bg-red-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-mono font-bold text-indigo-900 whitespace-nowrap">
                      {bar.barMark}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{bar.member}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{bar.rawNotation}</div>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {bar.elementType}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-700">{bar.grade}</td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-900">Ø{bar.diameterMm}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          Code {bar.shapeCode}
                        </span>
                        <button
                          onClick={() => setPreviewingBar(bar)}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Shape</span>
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                        {bar.shapeDescription}
                      </div>
                    </td>
                    <td className="py-3 px-2 font-mono font-bold text-slate-900">
                      {bar.cuttingLengthM.toFixed(3)}
                    </td>
                    <td className="py-3 px-2 font-mono text-center text-slate-700">
                      {bar.numberOfBarsPerMember}
                    </td>
                    <td className="py-3 px-2 font-mono text-center text-slate-700">
                      {bar.numberOfMembers}
                    </td>
                    <td className="py-3 px-2 font-mono text-center font-black text-indigo-900 bg-indigo-50/40 rounded">
                      {bar.totalNumberOfBars}
                    </td>
                    <td className="py-3 px-2 font-mono text-right text-slate-800">
                      {bar.totalLengthM.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 font-mono text-right text-slate-600" title={bar.unitWeightFormula}>
                      {bar.unitWeightKgM.toFixed(3)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-right text-indigo-900 bg-indigo-50/30">
                      {bar.totalWeightKg.toFixed(2)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          bar.status === 'Verified'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : bar.isBlocked
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {bar.status === 'Verified' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {bar.isBlocked && <AlertTriangle className="w-3 h-3 text-red-600" />}
                        {bar.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setEditingBar(bar)}
                          className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Edit Bar Geometry & Parameters"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedSourceBar(bar)}
                          className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="View Source Drawing & Provenance"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        {bar.status !== 'Verified' && (
                          <button
                            onClick={() => handleVerifyBar(bar.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Verify Bar Takeoff"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RCC CONCRETE ELEMENT VOLUMES */}
      {activeTab === 'RCC_ELEMENTS' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">RCC Concrete Elements Schedule</h3>
              <p className="text-xs text-slate-500">
                Exact geometry formulas with monolithic slab deductions, stair component breakdowns, and opening deductions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-3">Mark</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-2">Level & Grid</th>
                  <th className="py-3 px-2 font-mono">Dimensions (m)</th>
                  <th className="py-3 px-2 font-mono text-center">Qty</th>
                  <th className="py-3 px-2 font-mono text-right">Gross Vol (m³)</th>
                  <th className="py-3 px-2 font-mono text-right text-amber-700">Deductions (m³)</th>
                  <th className="py-3 px-3 font-mono text-right font-black text-indigo-900">Net Vol (m³)</th>
                  <th className="py-3 px-2">Grade</th>
                  <th className="py-3 px-3">Calculation Formula</th>
                  <th className="py-3 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {elements.map((el) => (
                  <tr key={el.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-900">{el.memberMark}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{el.elementType}</span>
                      <span className="text-[10px] text-slate-500 block">({el.subtype})</span>
                    </td>
                    <td className="py-3 px-2 text-slate-600">
                      <div>{el.level}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{el.zone}</div>
                    </td>
                    <td className="py-3 px-2 font-mono text-slate-700">
                      {el.diameterMm ? (
                        <span>Dia Ø{el.diameterMm}mm × {el.heightM}m</span>
                      ) : (
                        <span>{el.lengthM} × {el.widthM} × {el.depthM || el.thicknessM}m</span>
                      )}
                    </td>
                    <td className="py-3 px-2 font-mono text-center font-bold text-slate-800">{el.quantity}</td>
                    <td className="py-3 px-2 font-mono text-right text-slate-600">{el.grossVolumeM3.toFixed(3)}</td>
                    <td className="py-3 px-2 font-mono text-right text-amber-700">
                      {el.deductionsVolumeM3 > 0 ? `−${el.deductionsVolumeM3.toFixed(3)}` : '0.000'}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-right text-indigo-900 bg-indigo-50/30">
                      {el.netVolumeM3.toFixed(3)}
                    </td>
                    <td className="py-3 px-2 font-semibold text-slate-700">{el.concreteGrade}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                      <div className="truncate max-w-xs" title={el.calculationFormulaWithValues}>
                        {el.calculationFormulaWithValues}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {el.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUMMARY BY DIAMETER */}
      {activeTab === 'BY_DIAMETER' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Rebar Weight Distribution by Diameter</h3>
            <p className="text-xs text-slate-500">
              Master rollup aggregating total linear metres, exact unit weights (d²/162), and total tonnage for procurement.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Bar Diameter</th>
                  <th className="py-3 px-4 font-mono text-right">Unit Wt (kg/m)</th>
                  <th className="py-3 px-4 font-mono text-center">Total Bars</th>
                  <th className="py-3 px-4 font-mono text-right">Total Length (m)</th>
                  <th className="py-3 px-4 font-mono text-right font-black text-indigo-900">Total Weight (kg)</th>
                  <th className="py-3 px-4 font-mono text-right font-bold text-slate-900">Total (Tonnes)</th>
                  <th className="py-3 px-4 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {diameterSummary.map((item) => (
                  <tr key={item.diameterMm} className="hover:bg-indigo-50/20">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        Ø{item.diameterMm} mm
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600">{item.unitWeightKgM.toFixed(3)}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{item.totalBarsCount}</td>
                    <td className="py-3 px-4 text-right text-slate-800">{item.totalLengthM.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {item.totalWeightKg.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {item.totalWeightTonnes.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right font-sans text-xs">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, item.percentageOfTotal)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">{item.percentageOfTotal}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-indigo-50/60 border-t-2 border-indigo-200 font-mono font-black text-xs text-indigo-950">
                  <td className="py-3 px-4">Grand Total</td>
                  <td className="py-3 px-4 text-right">-</td>
                  <td className="py-3 px-4 text-center">{diameterSummary.reduce((s, i) => s + i.totalBarsCount, 0)}</td>
                  <td className="py-3 px-4 text-right">{diameterSummary.reduce((s, i) => s + i.totalLengthM, 0).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">{totalRebarWeightKg.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">{totalRebarWeightTonnes.toFixed(3)} t</td>
                  <td className="py-3 px-4 text-right font-sans">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUMMARY BY MEMBER & DENSITY */}
      {activeTab === 'BY_MEMBER' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Rebar Consumption & Density Ratio by Member Category</h3>
            <p className="text-xs text-slate-500">
              Correlates concrete volumes with rebar weight to calculate accurate structural consumption ratios (kg/m³).
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Member Category</th>
                  <th className="py-3 px-4 font-mono text-center">Element Count</th>
                  <th className="py-3 px-4 font-mono text-right">Concrete Vol (m³)</th>
                  <th className="py-3 px-4 font-mono text-center">Total Bars</th>
                  <th className="py-3 px-4 font-mono text-right">Rebar Length (m)</th>
                  <th className="py-3 px-4 font-mono text-right font-black text-indigo-900">Rebar Weight (kg)</th>
                  <th className="py-3 px-4 font-mono text-right font-bold text-slate-900">Tonnes</th>
                  <th className="py-3 px-4 font-mono text-right font-black text-emerald-800">Density (kg/m³)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {memberSummary.map((item) => (
                  <tr key={item.memberCategory} className="hover:bg-indigo-50/20">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">{item.memberCategory}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{item.memberCount}</td>
                    <td className="py-3 px-4 text-right text-slate-800">{item.concreteVolumeM3.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{item.totalBarsCount}</td>
                    <td className="py-3 px-4 text-right text-slate-800">{item.totalLengthM.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-900 bg-indigo-50/30">
                      {item.totalWeightKg.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{item.totalWeightTonnes.toFixed(3)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-800 bg-emerald-50/30">
                      {item.rebarDensityKgM3.toFixed(1)} kg/m³
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: 25-POINT AUTOMATED VERIFICATION SUITE */}
      {activeTab === 'TEST_SUITE' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Phase 15B Automated Verification Engine</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {testResults?.passedTests} / {testResults?.totalTests} PASSED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Executes all 11 Critical Tests and 14 comprehensive boundary checks with pure deterministic math.
              </p>
            </div>
            <button
              onClick={handleRunTests}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>RE-RUN TEST SUITE</span>
            </button>
          </div>

          <div className="space-y-3">
            {testResults?.results.map((t) => (
              <div
                key={t.testId}
                className={`p-4 rounded-xl border transition-all ${
                  t.passed
                    ? 'bg-white border-slate-200 hover:border-emerald-300'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        t.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {t.passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-700">{t.testId}</span>
                        <h4 className="text-xs font-bold text-slate-900">{t.name}</h4>
                        {t.isCritical && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            CRITICAL TEST
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-500 block text-[10px]">EXPECTED:</span>
                          <span className="text-slate-800 font-bold">{t.expected}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">ACTUAL:</span>
                          <span className="text-emerald-700 font-bold">{t.actual}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0">
                    {t.executionTimeMs} ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: OPEN ITEMS & CONFLICTS */}
      {activeTab === 'OPEN_ITEMS' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Zero Guesswork Governance & Drawing Conflicts</h3>
            <p className="text-xs text-slate-500">
              Missing bar data automatically generates Open Items. Conflicts between plan views, sections, and bar schedules are formally tracked without automatic assumption.
            </p>
          </div>

          {/* Conflicts Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Drawing & Schedule Conflicts ({conflicts.length})
            </h4>
            {conflicts.map((c) => (
              <div key={c.id} className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-mono text-xs font-bold text-amber-900">{c.id}</span>
                    <span className="text-xs font-bold text-slate-900">{c.title}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-700">{c.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded border border-amber-200">
                    <span className="text-[10px] font-bold text-slate-500 block">SOURCE A ({c.sourceA.drawing}):</span>
                    <span className="font-mono font-bold text-slate-800">{c.sourceA.value}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-amber-200">
                    <span className="text-[10px] font-bold text-slate-500 block">SOURCE B ({c.sourceB.drawing}):</span>
                    <span className="font-mono font-bold text-slate-800">{c.sourceB.value}</span>
                  </div>
                </div>
                {c.status === 'OPEN' && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleResolveConflict(c.id, 'Resolved as per Structural RFI 14')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Resolve Conflict (Record Note)
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Open Items Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Open Items & Missing Specifications ({openItems.length})
            </h4>
            {openItems.map((oi) => (
              <div key={oi.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700">{oi.id}</span>
                    <span className="text-xs font-bold text-slate-900">{oi.title}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                    {oi.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{oi.description}</p>
                <div className="text-[11px] text-indigo-900 bg-indigo-50/70 p-2 rounded border border-indigo-100">
                  <span className="font-bold">Suggested RFI Resolution: </span>
                  {oi.suggestedResolution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: REVISIONS */}
      {activeTab === 'REVISIONS' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">BBS Revision Register & Addendum Weight Delta</h3>
            <p className="text-xs text-slate-500">
              Maintains full audit history of BBS revisions, drawing addenda, and cost/weight impact.
            </p>
          </div>

          <div className="space-y-4">
            {revisions.map((rev) => (
              <div key={rev.revisionId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-lg">
                      {rev.revisionId}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{rev.description}</span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      rev.status === 'CURRENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-2.5 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">TOTAL REBAR WEIGHT:</span>
                    <span className="font-bold text-indigo-950 text-sm">{rev.totalRebarWeightKg.toFixed(2)} kg</span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">WEIGHT DELTA:</span>
                    <span className={`font-bold text-sm ${rev.weightDeltaKg > 0 ? 'text-amber-700' : 'text-slate-700'}`}>
                      {rev.weightDeltaKg > 0 ? `+${rev.weightDeltaKg.toFixed(2)}` : rev.weightDeltaKg.toFixed(2)} kg
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">DRAWING SET REF:</span>
                    <span className="font-bold text-slate-800">{rev.drawingRevisionRef}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">REVISION DATE:</span>
                    <span className="font-bold text-slate-800">{rev.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHAPE PREVIEW MODAL */}
      {previewingBar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Shape Diagram: Mark {previewingBar.barMark} ({previewingBar.member})
              </h3>
              <button onClick={() => setPreviewingBar(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <RebarShapeVisualizer bar={previewingBar} width={360} height={200} />
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 font-mono">
              <div>Formula: {previewingBar.cuttingFormula}</div>
              <div>Values: {previewingBar.cuttingFormulaWithValues}</div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewingBar(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOURCE PROVENANCE MODAL */}
      {selectedSourceBar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Drawing Source Provenance: {selectedSourceBar.barMark}
              </h3>
              <button onClick={() => setSelectedSourceBar(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1.5">
                <div className="flex justify-between font-bold text-indigo-950">
                  <span>Drawing: {selectedSourceBar.primarySource.drawingNumber}</span>
                  <span>Page {selectedSourceBar.primarySource.pageNumber}</span>
                </div>
                <div className="text-slate-700">Region / Detail: {selectedSourceBar.primarySource.region}</div>
                <div className="text-[11px] font-mono bg-white p-2 rounded border border-indigo-100">
                  Raw Callout: {selectedSourceBar.rawNotation}
                </div>
              </div>

              {selectedSourceBar.sources && selectedSourceBar.sources.length > 1 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800">Additional Linked Sources (Master Deduplication):</h4>
                  {selectedSourceBar.sources.map((s, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] font-mono flex justify-between">
                      <span>{s.sourceType}: {s.drawingNumber} (p.{s.pageNumber})</span>
                      <span className="text-slate-500">{s.region}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  if (onNavigateToDrawing) {
                    onNavigateToDrawing(selectedSourceBar.primarySource.drawingNumber, selectedSourceBar.primarySource.pageNumber);
                  }
                  setSelectedSourceBar(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Open in Drawing Viewer
              </button>
              <button
                onClick={() => setSelectedSourceBar(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BBS EDIT MODAL */}
      {editingBar && (
        <RccBbsEditModal
          bar={editingBar}
          isOpen={true}
          onClose={() => setEditingBar(null)}
          onSave={handleSaveBar}
        />
      )}
    </div>
  );
};
