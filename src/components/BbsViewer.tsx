import React, { useState, useMemo } from 'react';
import {
  Scale,
  Plus,
  Filter,
  Download,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Eye,
  Edit3,
  RotateCcw,
  ShieldCheck,
  Search,
  Layers,
  Settings2,
  GitCompare,
  AlertOctagon,
  FileSpreadsheet,
  TrendingUp,
  Table as TableIcon,
  PieChart,
  ListOrdered,
  History,
  Sparkles,
  Info
} from 'lucide-react';
import {
  RccRebarRegisterItem,
  RccElementRegisterItem,
  BbsSummaryData,
  BbsRevisionDelta,
  RebarConflictRecord,
  RccElementCategory,
  BbsVerificationStatus
} from '../types';
import {
  calculateBbsSummary,
  getInitialRccElements,
  getInitialRccRebarRegister,
  getInitialBbsRevisions,
  getInitialRebarConflicts,
  recalculateRebarItem,
  calculateRebarUnitWeight
} from '../engine/rccReinforcementEngine';
import { BbsEditModal } from './BbsEditModal';
import { BbsReviewModal } from './BbsReviewModal';
import { BbsTestSuiteModal } from './BbsTestSuiteModal';
import { BbsRulesModal } from './BbsRulesModal';
import { BbsRevisionDiffModal } from './BbsRevisionDiffModal';
import { BbsConflictModal } from './BbsConflictModal';

interface BbsViewerProps {
  projectId: string;
  onNavigateToDrawing?: (documentId: string, page: number) => void;
  onOpenItemCreate?: (item: any) => void;
}

export const BbsViewer: React.FC<BbsViewerProps> = ({
  projectId,
  onNavigateToDrawing,
  onOpenItemCreate,
}) => {
  // Main state
  const [elements, setElements] = useState<RccElementRegisterItem[]>(() => getInitialRccElements(projectId));
  const [rebarList, setRebarList] = useState<RccRebarRegisterItem[]>(() => getInitialRccRebarRegister(projectId));
  const [revisions, setRevisions] = useState<BbsRevisionDelta[]>(() => getInitialBbsRevisions());
  const [conflicts, setConflicts] = useState<RebarConflictRecord[]>(() => getInitialRebarConflicts());

  // Active view tab
  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'BY_DIAMETER' | 'BY_ELEMENT' | 'RCC_ELEMENTS' | 'AUDIT_LOG'>('SCHEDULE');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDiameter, setSelectedDiameter] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal states
  const [editingBar, setEditingBar] = useState<RccRebarRegisterItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isTestRunnerOpen, setIsTestRunnerOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);

  // Summary calculation
  const summary: BbsSummaryData = useMemo(() => {
    return calculateBbsSummary(rebarList, 2.5);
  }, [rebarList]);

  // Filtered rebar items
  const filteredRebar = useMemo(() => {
    return rebarList.filter((r) => {
      const matchQuery =
        r.barMark.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.memberDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.elementMark.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.rawNotation.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQuery) return false;
      if (selectedCategory !== 'ALL' && r.elementType !== selectedCategory) return false;
      if (selectedDiameter !== 'ALL' && r.barDiameterMm !== Number(selectedDiameter)) return false;
      if (selectedStatus === 'BLOCKED' && !r.isBlocked) return false;
      if (selectedStatus === 'VERIFIED' && r.verificationStatus !== 'USER VERIFIED' && r.verificationStatus !== 'FINAL') return false;
      if (selectedStatus === 'NEEDS_REVIEW' && (r.verificationStatus === 'USER VERIFIED' || r.verificationStatus === 'FINAL' || r.isBlocked)) return false;

      return true;
    });
  }, [rebarList, searchQuery, selectedCategory, selectedDiameter, selectedStatus]);

  // Handlers
  const handleSaveBar = (updated: RccRebarRegisterItem) => {
    const recalculated = recalculateRebarItem(updated);
    setRebarList((prev) => prev.map((item) => (item.id === recalculated.id ? recalculated : item)));
  };

  const handleApproveBar = (id: string) => {
    setRebarList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const audit = {
            id: `AUD-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: 'Senior QS Engineer',
            action: 'VERIFIED' as const,
            previousValue: item.totalWeightKg,
            newValue: item.totalWeightKg,
            reason: 'User verified without geometric changes',
          };
          return {
            ...item,
            verificationStatus: 'USER VERIFIED' as BbsVerificationStatus,
            isBlocked: false,
            blockedReason: null,
            auditTrail: [audit, ...item.auditTrail],
          };
        }
        return item;
      })
    );
  };

  const handleResetToSource = (id: string) => {
    const initialList = getInitialRccRebarRegister(projectId);
    const initialBar = initialList.find((i) => i.id === id);
    if (initialBar) {
      const resetAudit = {
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        user: 'Engineer',
        action: 'RESET_TO_SOURCE' as const,
        previousValue: rebarList.find((r) => r.id === id)?.totalWeightKg || 0,
        newValue: initialBar.totalWeightKg,
        reason: 'Restored original AI extracted values from source drawing',
      };
      setRebarList((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...initialBar,
                auditTrail: [resetAudit, ...item.auditTrail],
              }
            : item
        )
      );
    }
  };

  const handleResolveConflict = (conflictId: string, chosenDrawing: 'A' | 'B', note: string) => {
    setConflicts((prev) =>
      prev.map((c) =>
        c.id === conflictId
          ? {
              ...c,
              status: 'RESOLVED',
              resolvedDrawing: chosenDrawing,
              resolutionNote: note,
              resolvedAt: new Date().toISOString(),
              resolvedBy: 'Project Lead Structural Engineer',
            }
          : c
      )
    );
    setIsConflictModalOpen(false);
  };

  const handleMarkRevisionReviewed = (id: string) => {
    setRevisions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, reviewed: true } : r))
    );
  };

  // CSV / Excel Export Handler
  const handleExportCsv = () => {
    const headers = [
      'Bar Mark',
      'Element',
      'Category',
      'Level',
      'Grid',
      'Dia (mm)',
      'Shape Code',
      'Cut Length (m)',
      'Total Bars',
      'Unit Wt (kg/m)',
      'Total Wt (kg)',
      'Status',
      'Drawing No',
      'Raw Notation',
    ];

    const rows = rebarList.map((r) => [
      r.barMark,
      `"${r.memberDescription.replace(/"/g, '""')}"`,
      r.elementType,
      r.level,
      r.grid,
      r.barDiameterMm,
      r.shapeCode,
      r.cuttingLengthM.toFixed(3),
      r.totalBars,
      r.unitWeightKgM.toFixed(3),
      r.totalWeightKg.toFixed(2),
      r.verificationStatus,
      r.sourceDrawing.drawingNumber,
      `"${r.rawNotation.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BBS_Schedule_Project_${projectId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Flatten all audit records for Tab 5
  const allAuditRecords = useMemo(() => {
    const records: Array<{
      barMark: string;
      elementMark: string;
      timestamp: string;
      user: string;
      action: string;
      previousValue: any;
      newValue: any;
      reason: string;
    }> = [];

    rebarList.forEach((r) => {
      r.auditTrail.forEach((a) => {
        records.push({
          barMark: r.barMark,
          elementMark: r.elementMark,
          timestamp: a.timestamp,
          user: a.user,
          action: a.action,
          previousValue: a.previousValue,
          newValue: a.newValue,
          reason: a.reason,
        });
      });
    });

    return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [rebarList]);

  return (
    <div className="space-y-6">
      {/* Top Header Card & KPIs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                PHASE 5
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                RCC Reinforcement Engine & Professional BBS
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Strict deterministic rebar calculation engine adhering to BS 8666:2020 / IS 2502. Reinforcement is never guessed; missing parameters create Open Items.
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Review BBS</span>
              {(summary.requiresReviewCount > 0 || summary.blockedCount > 0) && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-900/60 text-white text-[10px] font-mono">
                  {summary.requiresReviewCount + summary.blockedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsTestRunnerOpen(true)}
              className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>18-Test Engine Suite</span>
            </button>

            <button
              onClick={() => setIsRevisionModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <GitCompare className="w-4 h-4" />
              <span>Revision Diff</span>
            </button>

            {conflicts.length > 0 && (
              <button
                onClick={() => setIsConflictModalOpen(true)}
                className="px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
              >
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>Conflicts ({conflicts.filter((c) => c.status === 'OPEN').length})</span>
              </button>
            )}

            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings2 className="w-4 h-4 text-slate-500" />
              <span>BBS Rules</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV/Excel</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Panels */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* 1. Net Calculated Steel Weight */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Net Rebar Weight
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-indigo-950">
                {summary.totalWeightTonnes.toFixed(3)}
              </span>
              <span className="text-xs font-bold text-slate-600">Tonnes</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {summary.totalWeightKg.toLocaleString()} kg calculated
            </p>
          </div>

          {/* 2. Commercial Wastage & Tender Weight */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tender Weight (+2.5% Wastage)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">
                {summary.wastage.tenderWeightTonnes.toFixed(3)}
              </span>
              <span className="text-xs font-bold text-slate-600">Tonnes</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              +{summary.wastage.wastageWeightKg.toFixed(1)} kg cutting lap scrap
            </p>
          </div>

          {/* 3. Total Commercial Bars & Length */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Bar Count & Length
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-900">
                {summary.totalBarsCount}
              </span>
              <span className="text-xs font-bold text-slate-600">Bars</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {summary.totalLengthMeters.toLocaleString()} m linear length
            </p>
          </div>

          {/* 4. Verification & Quality Assurance */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Verification Health
            </span>
            <div className="flex items-center gap-2 pt-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {summary.verifiedCount} Verified
              </span>
              {summary.blockedCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  {summary.blockedCount} Blocked
                </span>
              )}
              {summary.requiresReviewCount > 0 && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  {summary.requiresReviewCount} Review
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Rule 45: Zero guesswork release policy
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('SCHEDULE')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'SCHEDULE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Bar Bending Schedule (BBS)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
              {rebarList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('BY_DIAMETER')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'BY_DIAMETER'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Summary by Diameter</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
              {summary.byDiameter.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('BY_ELEMENT')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'BY_ELEMENT'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Summary by Element Category</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
              {summary.byElementType.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('RCC_ELEMENTS')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'RCC_ELEMENTS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>RCC Element Register</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
              {elements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT_LOG')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'AUDIT_LOG'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Calculation Audit Ledger</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700">
              {allAuditRecords.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DETAILED REBAR SCHEDULE (BBS) */}
      {/* ========================================================================= */}
      {activeTab === 'SCHEDULE' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
          {/* Table Filters Toolbar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="ALL">All Categories</option>
                <option value="Footings">Footings</option>
                <option value="Columns">Columns</option>
                <option value="Beams">Beams</option>
                <option value="Slabs">Slabs</option>
                <option value="Walls">Walls</option>
                <option value="Stairs">Stairs</option>
                <option value="Ground Beams">Ground Beams</option>
                <option value="Pedestals">Pedestals</option>
                <option value="Retaining Walls">Retaining Walls</option>
              </select>

              {/* Diameter Filter */}
              <select
                value={selectedDiameter}
                onChange={(e) => setSelectedDiameter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
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

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">User Verified</option>
                <option value="NEEDS_REVIEW">Requires Review</option>
                <option value="BLOCKED">Blocked (Open Item)</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search bar mark, member, raw text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Schedule Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Bar Mark</th>
                  <th className="py-3 px-3">Member & Position</th>
                  <th className="py-3 px-3">Raw Notation</th>
                  <th className="py-3 px-2 text-center">Dia</th>
                  <th className="py-3 px-2 text-center">Shape</th>
                  <th className="py-3 px-3">Cutting Length Formula</th>
                  <th className="py-3 px-2 text-right">Cut L (m)</th>
                  <th className="py-3 px-2 text-center">No. Bars</th>
                  <th className="py-3 px-2 text-right">Unit Wt</th>
                  <th className="py-3 px-3 text-right">Total Wt (kg)</th>
                  <th className="py-3 px-3 text-center">Drawing</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRebar.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-400">
                      <Scale className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-semibold text-slate-700">No rebar records match the current filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRebar.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        r.isBlocked ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {r.isBlocked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" />
                            <span>BLOCKED</span>
                          </span>
                        ) : r.verificationStatus === 'USER VERIFIED' || r.verificationStatus === 'FINAL' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>VERIFIED</span>
                          </span>
                        ) : r.verificationStatus === 'USER CORRECTED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 w-max">
                            <span>CORRECTED</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1 w-max">
                            <span>REVIEW</span>
                          </span>
                        )}
                      </td>

                      {/* Bar Mark */}
                      <td className="py-3 px-3 font-mono font-bold text-indigo-700 whitespace-nowrap">
                        {r.barMark}
                      </td>

                      {/* Member & Level */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-semibold text-slate-900">{r.memberDescription}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {r.elementType} • {r.level} • {r.grid}
                        </div>
                        {r.blockedReason && (
                          <div className="text-[10px] text-rose-600 font-bold mt-0.5 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{r.blockedReason}</span>
                          </div>
                        )}
                      </td>

                      {/* Raw Notation (Immutable provenance) */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700 block max-w-xs truncate" title={r.rawNotation}>
                          {r.rawNotation}
                        </span>
                      </td>

                      {/* Diameter */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-900">
                        Ø{r.barDiameterMm}
                      </td>

                      {/* Shape Code */}
                      <td className="py-3 px-2 text-center font-mono text-slate-700 font-semibold">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                          {r.shapeCode}
                        </span>
                      </td>

                      {/* Cutting Length Formula Display */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-mono text-[11px] text-indigo-950 font-bold">
                          {r.cuttingFormula}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {r.cuttingFormulaWithValues}
                        </div>
                      </td>

                      {/* Cut Length (m) */}
                      <td className="py-3 px-2 text-right font-mono font-bold text-slate-900">
                        {r.cuttingLengthM.toFixed(3)}
                      </td>

                      {/* Total Bars */}
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-800">
                        {r.totalBars}
                      </td>

                      {/* Unit Weight */}
                      <td className="py-3 px-2 text-right font-mono text-slate-600 text-[11px]">
                        {r.unitWeightKgM.toFixed(3)}
                      </td>

                      {/* Total Weight */}
                      <td className="py-3 px-3 text-right font-mono font-black text-indigo-700 text-xs">
                        {r.totalWeightKg.toFixed(2)}
                      </td>

                      {/* Source Drawing Link */}
                      <td className="py-3 px-3 text-center">
                        {onNavigateToDrawing ? (
                          <button
                            onClick={() => onNavigateToDrawing(r.sourceDrawing.documentId, r.sourceDrawing.page)}
                            className="font-mono text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{r.sourceDrawing.drawingNumber}</span>
                          </button>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-500">
                            {r.sourceDrawing.drawingNumber}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.verificationStatus !== 'USER VERIFIED' && r.verificationStatus !== 'FINAL' && !r.isBlocked && (
                            <button
                              onClick={() => handleApproveBar(r.id)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                              title="Approve Rebar Item"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setEditingBar(r)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 transition-colors cursor-pointer"
                            title="Edit Geometry & Calculate"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleResetToSource(r.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
                            title="Reset to Source Drawing"
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUMMARY BY DIAMETER (T8, T10, T12, T16, T20, T25, T32, T40) */}
      {/* ========================================================================= */}
      {activeTab === 'BY_DIAMETER' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Steel Summary by Bar Diameter
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated procurement tonnage and linear cut meterage broken down by nominal bar diameter.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Diameter (mm)</th>
                  <th className="py-3 px-4 text-center">Unit Weight (kg/m)</th>
                  <th className="py-3 px-4 text-center">Total Bar Count</th>
                  <th className="py-3 px-4 text-right">Total Cut Length (m)</th>
                  <th className="py-3 px-4 text-right">Total Net Weight (kg)</th>
                  <th className="py-3 px-4 text-right">Tonnage (Tonnes)</th>
                  <th className="py-3 px-4 text-right">% of Total Steel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.byDiameter.map((d) => {
                  const percentOfTotal = summary.totalWeightKg > 0 ? (d.totalWeightKg / summary.totalWeightKg) * 100 : 0;
                  return (
                    <tr key={d.diameterMm} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 text-sm">
                        Ø{d.diameterMm} mm
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">
                        {d.unitWeightKgM.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {d.totalBars}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {d.totalLengthM.toLocaleString()} m
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {d.totalWeightKg.toLocaleString()} kg
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-indigo-950 text-sm">
                        {d.totalWeightTonnes.toFixed(3)} T
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${percentOfTotal}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-slate-700 text-xs w-12 text-right">
                            {percentOfTotal.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/90 font-bold border-t-2 border-slate-300">
                <tr>
                  <td className="py-3 px-4 text-slate-900">TOTAL NET STEEL</td>
                  <td className="py-3 px-4 text-center text-slate-500">-</td>
                  <td className="py-3 px-4 text-center font-mono font-bold">{summary.totalBarsCount}</td>
                  <td className="py-3 px-4 text-right font-mono">{summary.totalLengthMeters.toLocaleString()} m</td>
                  <td className="py-3 px-4 text-right font-mono">{summary.totalWeightKg.toLocaleString()} kg</td>
                  <td className="py-3 px-4 text-right font-mono text-indigo-950 text-base">
                    {summary.totalWeightTonnes.toFixed(3)} T
                  </td>
                  <td className="py-3 px-4 text-right font-mono">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SUMMARY BY ELEMENT CATEGORY */}
      {/* ========================================================================= */}
      {activeTab === 'BY_ELEMENT' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Steel Summary by Structural Element Category
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Reinforcement consumption by structural classification (Footings, Columns, Beams, Slabs, Walls, Stairs).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Structural Element Category</th>
                  <th className="py-3 px-4 text-center">Total Bar Count</th>
                  <th className="py-3 px-4 text-right">Total Rebar Length (m)</th>
                  <th className="py-3 px-4 text-right">Weight (kg)</th>
                  <th className="py-3 px-4 text-right">Tonnage (Tonnes)</th>
                  <th className="py-3 px-4 text-right">% of Building Steel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.byElementType.map((el) => {
                  const percentOfTotal = summary.totalWeightKg > 0 ? (el.totalWeightKg / summary.totalWeightKg) * 100 : 0;
                  return (
                    <tr key={el.elementType} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                        {el.elementType}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                        {el.totalBars}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {el.totalLengthM.toLocaleString()} m
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {el.totalWeightKg.toLocaleString()} kg
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-indigo-950 text-sm">
                        {el.totalWeightTonnes.toFixed(3)} T
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-600 h-full rounded-full"
                              style={{ width: `${percentOfTotal}%` }}
                            ></div>
                          </div>
                          <span className="font-mono font-bold text-slate-700 text-xs w-12 text-right">
                            {percentOfTotal.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RCC ELEMENT REGISTER */}
      {/* ========================================================================= */}
      {activeTab === 'RCC_ELEMENTS' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              RCC Structural Element Register
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic linking between 3D structural geometry, concrete grade, cover, and reinforcement schedule.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Mark</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Level & Grid</th>
                  <th className="py-3 px-4">Dimensions (L × W × D)</th>
                  <th className="py-3 px-4 text-center">Concrete Grade</th>
                  <th className="py-3 px-4 text-center">Cover (mm)</th>
                  <th className="py-3 px-4 text-center">Rebar Layers</th>
                  <th className="py-3 px-4 text-right">Steel Weight (kg)</th>
                  <th className="py-3 px-4 text-center">Drawing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {elements.map((el) => (
                  <tr
                    key={el.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      el.isBlocked ? 'bg-rose-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {el.isBlocked ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3 h-3" />
                          <span>BLOCKED</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>VERIFIED</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-indigo-700 text-sm">
                      {el.mark}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {el.elementType}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{el.level}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{el.grid}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-800">
                      {el.lengthMm} × {el.widthMm} × {el.depthMm || el.thicknessMm} mm
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {el.concreteGrade}
                    </td>

                    <td className="py-3 px-4 text-center font-mono">
                      {el.coverMm !== null ? (
                        `${el.coverMm} mm`
                      ) : (
                        <span className="text-rose-600 font-bold">MISSING</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      {el.rebarCount}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-indigo-700">
                      {el.totalRebarWeightKg.toFixed(2)} kg
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-slate-600">
                      {el.drawingNumber} Rev {el.revision}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CALCULATION AUDIT LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'AUDIT_LOG' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                BBS Calculation Audit Trail & Modification Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every calculation change, user verification, and parameter override is permanently logged with timestamps.
              </p>
            </div>
            <span className="font-mono text-xs text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200">
              {allAuditRecords.length} Total Audit Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Bar Mark</th>
                  <th className="py-3 px-4">User / Agent</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Previous Value</th>
                  <th className="py-3 px-4">New Value</th>
                  <th className="py-3 px-4">Audit Reason & Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allAuditRecords.map((a, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(a.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                      {a.barMark}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {a.user}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                        {a.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {a.previousValue !== null && a.previousValue !== undefined
                        ? `${a.previousValue} kg`
                        : 'None'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-950">
                      {a.newValue !== null && a.newValue !== undefined ? `${a.newValue} kg` : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {a.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}
      {editingBar && (
        <BbsEditModal
          rebarItem={editingBar}
          isOpen={Boolean(editingBar)}
          onClose={() => setEditingBar(null)}
          onSave={handleSaveBar}
          onResetToSource={handleResetToSource}
          onViewSourceDrawing={onNavigateToDrawing}
        />
      )}

      <BbsReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        rebarList={rebarList}
        onApproveBar={handleApproveBar}
        onEditBar={(item) => {
          setIsReviewModalOpen(false);
          setEditingBar(item);
        }}
        onViewSourceDrawing={onNavigateToDrawing}
      />

      <BbsTestSuiteModal
        isOpen={isTestRunnerOpen}
        onClose={() => setIsTestRunnerOpen(false)}
      />

      <BbsRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      <BbsRevisionDiffModal
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        revisions={revisions}
        onMarkReviewed={handleMarkRevisionReviewed}
      />

      <BbsConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflicts={conflicts}
        onResolveConflict={handleResolveConflict}
      />
    </div>
  );
};
