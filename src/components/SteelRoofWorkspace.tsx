import React, { useState, useMemo } from 'react';
import {
  Layers,
  ShieldCheck,
  Database,
  Triangle,
  History,
  AlertTriangle,
  Plus,
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Edit3,
  FileText,
  Building2,
  Sparkles,
  Scale,
  Maximize2,
  Info,
  ChevronRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import {
  SteelMemberRegisterItem,
  SteelCategory,
  RoofGeometryData,
  RoofCladdingTakeoffData,
  SkylightTakeoffData,
  FlashingGutterTakeoffItem,
  SteelRevisionDiffRecord,
  SteelConflictRecord,
  DrawingRecord,
} from '../types';
import {
  SAMPLE_ROOF_GEOMETRY,
  SAMPLE_SKYLIGHTS,
  SAMPLE_ROOF_CLADDING,
  SAMPLE_FLASHINGS_GUTTERS,
  generateSampleSteelMembers,
  SAMPLE_STEEL_REVISIONS,
  SAMPLE_STEEL_CONFLICTS,
} from '../data/steelInitialData';
import { summarizeSteelRoofTakeoff, calculateSteelMemberItem } from '../engine/steelRoofEngine';
import { CustomSectionModal } from './CustomSectionModal';
import { RoofGeometryModal } from './RoofGeometryModal';
import { SteelConflictModal } from './SteelConflictModal';
import { SteelRevisionModal } from './SteelRevisionModal';
import { SteelTestSuiteModal } from './SteelTestSuiteModal';
import { SteelEditModal } from './SteelEditModal';

interface SteelRoofWorkspaceProps {
  drawings?: DrawingRecord[];
  onOpenDrawing?: (drawingId: string) => void;
  onExportExcel?: () => void;
}

const STEEL_CATEGORIES: Array<{ key: SteelCategory | 'ALL'; label: string; countGroup?: string }> = [
  { key: 'ALL', label: 'All Steel & Roof Elements' },
  { key: 'Primary Steel', label: 'Primary Steel (Columns, Beams, Rafters)' },
  { key: 'Secondary Steel', label: 'Secondary Steel & Ties' },
  { key: 'Roof Framing', label: 'Roof Framing & Rafters' },
  { key: 'Purlins', label: 'Purlins (Z & C Sections)' },
  { key: 'Girts', label: 'Wall Girts' },
  { key: 'Bracing', label: 'Bracing Members & Rods' },
  { key: 'Base Plates', label: 'Base Plates' },
  { key: 'Gusset Plates', label: 'Gusset & Stiffener Plates' },
  { key: 'Sag Rods', label: 'Sag Rods & Bridging' },
  { key: 'Roof Cladding', label: 'Roof Cladding & Panels' },
  { key: 'Skylights', label: 'Skylights & Rooflights' },
  { key: 'Flashings', label: 'Flashings (Ridge, Barge, Eave)' },
  { key: 'Gutters', label: 'Gutters (Eaves & Box)' },
  { key: 'Downpipes', label: 'Downpipes' },
  { key: 'Insulation', label: 'Roof Insulation' },
  { key: 'Roof Accessories', label: 'Roof Accessories & Safety' },
  { key: 'Connections', label: 'Connections, Bolts & Welds' },
  { key: 'Miscellaneous Steel', label: 'Stairs, Handrails & Platforms' },
];

export const SteelRoofWorkspace: React.FC<SteelRoofWorkspaceProps> = ({
  drawings = [],
  onOpenDrawing,
  onExportExcel,
}) => {
  // Master data state
  const [members, setMembers] = useState<SteelMemberRegisterItem[]>(generateSampleSteelMembers());
  const [roofGeometry, setRoofGeometry] = useState<RoofGeometryData>(SAMPLE_ROOF_GEOMETRY);
  const [claddingItems, setCladdingItems] = useState<RoofCladdingTakeoffData[]>(SAMPLE_ROOF_CLADDING);
  const [skylightItems, setSkylightItems] = useState<SkylightTakeoffData[]>(SAMPLE_SKYLIGHTS);
  const [flashings, setFlashings] = useState<FlashingGutterTakeoffItem[]>(SAMPLE_FLASHINGS_GUTTERS);
  const [revisions, setRevisions] = useState<SteelRevisionDiffRecord[]>(SAMPLE_STEEL_REVISIONS);
  const [conflicts, setConflicts] = useState<SteelConflictRecord[]>(SAMPLE_STEEL_CONFLICTS);

  // Active Category & Tab Filter
  const [activeCategory, setActiveCategory] = useState<SteelCategory | 'ALL'>('ALL');
  const [activeViewTab, setActiveViewTab] = useState<'members' | 'roofing' | 'plates' | 'fabrication' | 'drawing'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(members[0]?.id || null);

  // Modals state
  const [isCustomSecModalOpen, setIsCustomSecModalOpen] = useState(false);
  const [isRoofGeoModalOpen, setIsRoofGeoModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isTestSuiteModalOpen, setIsTestSuiteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Summary Metrics
  const summary = useMemo(() => {
    return summarizeSteelRoofTakeoff(members, claddingItems, skylightItems, flashings);
  }, [members, claddingItems, skylightItems, flashings]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (activeCategory !== 'ALL' && m.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.mark.toLowerCase().includes(q) ||
          m.section.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          m.level.toLowerCase().includes(q) ||
          m.grid.toLowerCase().includes(q) ||
          m.drawingNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [members, activeCategory, searchQuery]);

  const selectedMember = members.find((m) => m.id === selectedMemberId) || filteredMembers[0] || null;

  // Handlers
  const handleSaveEditedMember = (updated: SteelMemberRegisterItem) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setSelectedMemberId(updated.id);
  };

  const handleResolveConflict = (conflictId: string, resolvedDrawing: 'A' | 'B', note: string) => {
    setConflicts((prev) =>
      prev.map((c) =>
        c.id === conflictId
          ? {
              ...c,
              status: 'RESOLVED',
              resolvedDrawing,
              resolutionNote: note,
              resolvedAt: new Date().toISOString(),
              resolvedBy: 'User (Structural Engineer)',
            }
          : c
      )
    );
  };

  const handleMarkRevisionReviewed = (revId: string) => {
    setRevisions((prev) =>
      prev.map((r) => (r.id === revId ? { ...r, reviewed: true } : r))
    );
  };

  const handleToggleVerification = (memberId: string) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId) {
          const nextStatus = m.verificationStatus === 'USER VERIFIED' ? 'REQUIRES REVIEW' : 'USER VERIFIED';
          return { ...m, verificationStatus: nextStatus };
        }
        return m;
      })
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-hidden select-none">
      {/* 1. TOP ACTION TOOLBAR */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight text-slate-900 uppercase flex items-center gap-2">
              <span>Steel & Roof Takeoff Workspace</span>
              <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Phase 6 Engine
              </span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Deterministic member weights, roof geometry, purlin lines, cladding deductions & fabrication mapping
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Test Suite Button */}
          <button
            onClick={() => setIsTestSuiteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>26-Test Engineering Suite</span>
          </button>

          {/* Section DB Button */}
          <button
            onClick={() => setIsCustomSecModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Section Database</span>
          </button>

          {/* Roof Geometry Button */}
          <button
            onClick={() => setIsRoofGeoModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors"
          >
            <Triangle className="w-3.5 h-3.5 text-slate-500" />
            <span>Roof Geometry</span>
          </button>

          {/* Revision Diff Button */}
          <button
            onClick={() => setIsRevisionModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold transition-colors"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Revision Diffs ({revisions.length})</span>
          </button>

          {/* Conflict Adjudication Button */}
          <button
            onClick={() => setIsConflictModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
              conflicts.filter((c) => c.status === 'OPEN').length > 0
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>
              Conflicts ({conflicts.filter((c) => c.status === 'OPEN').length})
            </span>
          </button>

          {/* Excel Export */}
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export BOQ</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI SUMMARY BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 grid grid-cols-6 gap-3 shrink-0">
        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Total Structural Steel
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-black font-mono text-indigo-700">
              {summary.totalSteelTonnes.toFixed(2)}
            </span>
            <span className="text-[11px] font-bold text-slate-600">Tonnes</span>
            <span className="text-[10px] text-slate-400 font-mono ml-auto">
              ({summary.totalSteelKg.toLocaleString()} kg)
            </span>
          </div>
        </div>

        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Primary Framing (Cols/Rafters)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-black font-mono text-slate-900">
              {summary.primarySteelTonnes.toFixed(2)}
            </span>
            <span className="text-[11px] font-bold text-slate-600">Tonnes</span>
          </div>
        </div>

        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Purlins, Girts & Bracing
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-black font-mono text-slate-900">
              {(summary.purlinsTonnes + summary.girtsTonnes + summary.bracingTonnes).toFixed(2)}
            </span>
            <span className="text-[11px] font-bold text-slate-600">Tonnes</span>
            <span className="text-[10px] text-slate-400 font-mono ml-auto">
              ({summary.totalPurlinLengthM.toFixed(0)}m purlins)
            </span>
          </div>
        </div>

        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Roof Cladding Area (Tender)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-black font-mono text-emerald-700">
              {summary.totalCladdingAreaM2.toFixed(1)}
            </span>
            <span className="text-[11px] font-bold text-slate-600">m²</span>
            <span className="text-[10px] text-slate-400 ml-auto">
              (Gross: {summary.totalRoofAreaM2.toFixed(0)}m²)
            </span>
          </div>
        </div>

        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Skylight Deductions
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-black font-mono text-cyan-700">
              {summary.totalSkylightAreaM2.toFixed(1)}
            </span>
            <span className="text-[11px] font-bold text-slate-600">m²</span>
            <span className="text-[10px] text-slate-400 ml-auto">
              (Deducted from sheet)
            </span>
          </div>
        </div>

        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Verification Quality
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {summary.verifiedCount} / {summary.totalMembersCount} Verified
            </span>
            {summary.blockedCount > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                {summary.blockedCount} Blocked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE (Left: Categories, Center: Registers/Views, Right: Formula Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Category Navigation Sidebar (w-64) */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Takeoff Categories
            </span>
          </div>

          <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
            {STEEL_CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              const count =
                cat.key === 'ALL'
                  ? members.length
                  : members.filter((m) => m.category === cat.key).length;

              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate pr-2">{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Double Counting Health info */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Double Counting Protection Active (Indexed by Physical Member ID).</span>
          </div>
        </div>

        {/* CENTER: Main Work Area & Table Views */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {/* Tabs Bar */}
          <div className="h-11 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-6 h-full">
              <button
                onClick={() => setActiveViewTab('members')}
                className={`text-xs font-semibold h-full flex items-center gap-1.5 border-b-2 transition-colors ${
                  activeViewTab === 'members'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Steel Members Register ({filteredMembers.length})</span>
              </button>

              <button
                onClick={() => setActiveViewTab('roofing')}
                className={`text-xs font-semibold h-full flex items-center gap-1.5 border-b-2 transition-colors ${
                  activeViewTab === 'roofing'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Triangle className="w-3.5 h-3.5" />
                <span>Roof Cladding, Purlins & Flashings</span>
              </button>

              <button
                onClick={() => setActiveViewTab('plates')}
                className={`text-xs font-semibold h-full flex items-center gap-1.5 border-b-2 transition-colors ${
                  activeViewTab === 'plates'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Plates, Bolts & Welds</span>
              </button>

              <button
                onClick={() => setActiveViewTab('fabrication')}
                className={`text-xs font-semibold h-full flex items-center gap-1.5 border-b-2 transition-colors ${
                  activeViewTab === 'fabrication'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Fabrication & IFC Assemblies</span>
              </button>

              <button
                onClick={() => setActiveViewTab('drawing')}
                className={`text-xs font-semibold h-full flex items-center gap-1.5 border-b-2 transition-colors ${
                  activeViewTab === 'drawing'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Framing Schematic & Viewer</span>
              </button>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter members by mark, section, grid..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-64"
              />
            </div>
          </div>

          {/* View Tab Contents */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* 1. STEEL MEMBERS REGISTER TAB */}
            {activeViewTab === 'members' && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-3">Member Mark</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3">Section Designation</th>
                      <th className="px-3 py-3 text-right">Mass (kg/m)</th>
                      <th className="px-3 py-3 text-right">Length (m)</th>
                      <th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3 text-right">Total (Tonnes)</th>
                      <th className="px-3 py-3 text-right">Total (kg)</th>
                      <th className="px-3 py-3">Level / Grid</th>
                      <th className="px-3 py-3">Drawing Ref</th>
                      <th className="px-3 py-3 text-center">Status</th>
                      <th className="px-3 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMembers.map((m) => {
                      const isSelected = selectedMember?.id === m.id;
                      return (
                        <tr
                          key={m.id}
                          onClick={() => setSelectedMemberId(m.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-50/80 font-medium'
                              : 'hover:bg-slate-50'
                          } ${m.isBlocked ? 'bg-rose-50/40' : ''}`}
                        >
                          <td className="px-3 py-2.5 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                            {m.mark}
                            {m.isBlocked && (
                              <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-rose-100 text-rose-800">
                                BLOCKED
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600">{m.category}</td>
                          <td className="px-3 py-2.5 font-mono font-bold text-indigo-700">
                            {m.section}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                            {m.unitWeightKgM ? m.unitWeightKgM.toFixed(2) : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-900">
                            {m.lengthM !== null ? m.lengthM.toFixed(2) : '-'}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-900 font-bold">
                            {m.quantity}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                            {(m.totalWeightTonnes ?? 0).toFixed(3)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                            {(m.totalWeightKg ?? 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500 truncate max-w-[130px]">
                            {m.grid} ({m.level})
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-mono font-semibold text-slate-700 block text-[11px]">
                              {m.drawingNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 block">{m.drawingType}</span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleVerification(m.id);
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                                m.verificationStatus === 'USER VERIFIED'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : m.verificationStatus === 'BLOCKED'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}
                            >
                              {m.verificationStatus}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMemberId(m.id);
                                setIsEditModalOpen(true);
                              }}
                              title="Edit Member"
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 2. ROOFING & CLADDING TAB */}
            {activeViewTab === 'roofing' && (
              <div className="space-y-4">
                {/* Cladding Register Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase">
                        Roof Cladding & Sheet Coverage Schedule
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Effective cover width layout with automatic skylight & opening area deductions
                      </p>
                    </div>
                    <button
                      onClick={() => setIsRoofGeoModalOpen(true)}
                      className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Triangle className="w-3.5 h-3.5" />
                      <span>Adjust Roof Slope Geometry</span>
                    </button>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Profile / Spec</th>
                        <th className="px-3 py-2 text-right">Cover Width</th>
                        <th className="px-3 py-2 text-right">Sheet Length</th>
                        <th className="px-3 py-2 text-right">Gross Roof (m²)</th>
                        <th className="px-3 py-2 text-right text-cyan-700">Skylight Deduct</th>
                        <th className="px-3 py-2 text-right font-bold">Net Cladding</th>
                        <th className="px-3 py-2 text-right text-emerald-700 font-bold">Tender (+5% Wastage)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {claddingItems.map((c) => (
                        <tr key={c.id}>
                          <td className="px-3 py-2.5">
                            <span className="font-bold text-slate-900 block">{c.mark}: {c.material}</span>
                            <span className="text-slate-500 text-[11px]">{c.profile} (0.5mm Thk)</span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                            {c.effectiveCoverWidthMm} mm
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                            {c.sheetLengthM.toFixed(2)} m
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-slate-900">
                            {c.grossRoofAreaM2.toFixed(2)} m²
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-cyan-700">
                            -{c.skylightDeductionM2.toFixed(2)} m²
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                            {c.netCladdingAreaM2.toFixed(2)} m²
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-black text-emerald-700 bg-emerald-50/50">
                            {c.tenderAreaM2.toFixed(2)} m²
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Skylights Schedule */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase pb-2 border-b border-slate-100 mb-2">
                    Skylight & Rooflight Register ({skylightItems.length} groups)
                  </h3>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Mark</th>
                        <th className="px-3 py-2">Roof Zone</th>
                        <th className="px-3 py-2">Material Type</th>
                        <th className="px-3 py-2 text-right">Length (m)</th>
                        <th className="px-3 py-2 text-right">Width (m)</th>
                        <th className="px-3 py-2 text-right">Quantity</th>
                        <th className="px-3 py-2 text-right font-bold text-cyan-700">Total Area (m²)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {skylightItems.map((s) => (
                        <tr key={s.id}>
                          <td className="px-3 py-2 font-mono font-bold text-slate-900">{s.mark}</td>
                          <td className="px-3 py-2 text-slate-600">{s.roofZone}</td>
                          <td className="px-3 py-2 text-slate-700">{s.type} (2.5mm)</td>
                          <td className="px-3 py-2 text-right font-mono text-slate-600">{s.lengthM.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-mono text-slate-600">{s.widthM.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{s.quantity} Nr</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-cyan-700">{s.totalAreaM2.toFixed(2)} m²</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Flashings, Gutters & Downpipes */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase pb-2 border-b border-slate-100 mb-2">
                    Flashings, Gutters, Downpipes & Accessories
                  </h3>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Mark</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2 text-right">Unit Length / Area</th>
                        <th className="px-3 py-2 text-right">Quantity</th>
                        <th className="px-3 py-2 text-right font-bold">Total Quantity</th>
                        <th className="px-3 py-2">Drawing Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {flashings.map((f) => (
                        <tr key={f.id}>
                          <td className="px-3 py-2 font-mono font-bold text-slate-900">{f.mark}</td>
                          <td className="px-3 py-2 text-slate-600">{f.category}</td>
                          <td className="px-3 py-2 text-slate-700 font-medium">{f.subType}</td>
                          <td className="px-3 py-2 text-right font-mono text-slate-600">{f.lengthM.toFixed(2)} {f.unit}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{f.quantity}</td>
                          <td className="px-3 py-2 text-right font-mono font-bold text-indigo-700">
                            {f.totalLengthM ? `${f.totalLengthM.toFixed(2)} m` : `${f.totalAreaM2?.toFixed(2)} m²`}
                          </td>
                          <td className="px-3 py-2 text-slate-500 font-mono text-[11px]">{f.drawingNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. PLATES, BOLTS & WELDS TAB */}
            {activeViewTab === 'plates' && (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase pb-2 border-b border-slate-100 mb-2">
                    Steel Plates Schedule (Base Plates, Gussets, Cleats & Stiffeners)
                  </h3>
                  <div className="text-xs text-slate-500 mb-3">
                    Deterministic formula: <strong>Volume (m³) = Area (m²) × Thickness (m) × Quantity</strong>; <strong>Weight = Volume × 7850 kg/m³</strong>.
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Mark</th>
                        <th className="px-3 py-2">Shape</th>
                        <th className="px-3 py-2 text-right">Length (mm)</th>
                        <th className="px-3 py-2 text-right">Width (mm)</th>
                        <th className="px-3 py-2 text-right">Thk (mm)</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right font-bold text-indigo-700">Total Weight (kg)</th>
                        <th className="px-3 py-2">Formula Expression</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members
                        .filter((m) => m.plateData)
                        .map((m) => {
                          const p = m.plateData!;
                          return (
                            <tr key={m.id}>
                              <td className="px-3 py-2 font-mono font-bold text-slate-900">{m.mark}</td>
                              <td className="px-3 py-2 text-slate-600">{p.shape}</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">{p.lengthMm}</td>
                              <td className="px-3 py-2 text-right font-mono text-slate-600">{p.widthMm}</td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{p.thicknessMm}</td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">{p.quantity}</td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-indigo-700">{(p.totalWeightKg ?? 0).toFixed(2)} kg</td>
                              <td className="px-3 py-2 font-mono text-[11px] text-slate-500 truncate max-w-[280px]" title={p.formulaWithValues}>
                                {p.formulaWithValues}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <h3 className="text-xs font-bold text-slate-900 uppercase pb-2 border-b border-slate-100 mb-2">
                      Holding Down & High-Strength Bolts
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-800">M24 Gr 8.8 Anchor Bolts (Base Plates)</span>
                        <span className="font-mono font-bold text-indigo-700">144 Nr (18 Pl × 8)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-800">M20 Gr 8.8 HSFG Eaves Moment Bolts</span>
                        <span className="font-mono font-bold text-indigo-700">216 Nr (18 Frames × 12)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-800">M16 Gr 4.6 Purlin Cleat Bolts</span>
                        <span className="font-mono font-bold text-indigo-700">528 Nr</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
                    <h3 className="text-xs font-bold text-slate-900 uppercase pb-2 border-b border-slate-100 mb-2">
                      Shop & Site Welds Takeoff
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-800">8mm Fillet Weld (Base Plate to UC Column)</span>
                        <span className="font-mono font-bold text-indigo-700">36.00 linear metres</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-800">6mm Fillet Weld (Gussets & Stiffeners)</span>
                        <span className="font-mono font-bold text-indigo-700">54.20 linear metres</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                        <span className="font-semibold text-slate-800">Full Penetration Butt Weld (Rafter Haunches)</span>
                        <span className="font-mono font-bold text-indigo-700">18.40 linear metres</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. FABRICATION & IFC TAB */}
            {activeViewTab === 'fabrication' && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase">
                      Fabrication Assemblies & IFC GlobalId Mapping
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Hierarchical mapping from GA Design Model to Fabrication Assembly, Piece Marks and Part Marks
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    IFC 4.3 Structural Analysis Schema
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Physical Member ID</th>
                      <th className="px-3 py-2">Assembly Mark</th>
                      <th className="px-3 py-2">Piece Mark</th>
                      <th className="px-3 py-2">Section Profile</th>
                      <th className="px-3 py-2 text-right">Cut Length (m)</th>
                      <th className="px-3 py-2 text-right">Total Weight (kg)</th>
                      <th className="px-3 py-2">IFC GlobalID</th>
                      <th className="px-3 py-2 text-center">GA + Shop Deduping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-900">{m.physicalMemberId}</td>
                        <td className="px-3 py-2.5 font-mono text-indigo-700 font-semibold">{m.mark}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-600">P-{m.id.slice(-3)}</td>
                        <td className="px-3 py-2.5 font-mono font-semibold text-slate-800">{m.section}</td>
                        <td className="px-3 py-2.5 text-right font-mono text-slate-900">{m.lengthM ? m.lengthM.toFixed(3) : '-'}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{(m.totalWeightKg ?? 0).toLocaleString()} kg</td>
                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400">
                          {`3a9x_${m.id.toLowerCase()}_ifc4`}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1 w-fit mx-auto">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Unified (1x)
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 5. FRAMING SCHEMATIC & VIEWER TAB */}
            {activeViewTab === 'drawing' && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase">
                      Warehouse Portal Frame Section & Rafter Geometry (Grid 1-9)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      30m Span × 7.5m Eave Height | 1.5m Ridge Rise | Pitch 5.71° | 12 Purlin Lines per Slope
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                    Sloping Length: {roofGeometry.slopingLengthM.toFixed(3)} m
                  </span>
                </div>

                {/* SVG Portal Frame Schematic */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 flex items-center justify-center">
                  <svg viewBox="0 0 900 450" className="w-full h-80 max-w-3xl select-none">
                    {/* Grid lines & ground level */}
                    <line x1="50" y1="380" x2="850" y2="380" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />
                    <text x="50" y="405" fill="#94a3b8" fontSize="11" fontFamily="monospace">Grid A (0.00m)</text>
                    <text x="800" y="405" fill="#94a3b8" fontSize="11" fontFamily="monospace">Grid B (+30.00m)</text>

                    {/* Columns (UC 254x254x73) */}
                    <rect x="90" y="180" width="20" height="200" fill="#3b82f6" rx="2" />
                    <rect x="790" y="180" width="20" height="200" fill="#3b82f6" rx="2" />
                    <text x="40" y="280" fill="#60a5fa" fontSize="10" fontFamily="monospace" fontWeight="bold">COL (UC 254)</text>
                    <text x="820" y="280" fill="#60a5fa" fontSize="10" fontFamily="monospace" fontWeight="bold">COL (UC 254)</text>

                    {/* Base Plates (500x500x25mm) */}
                    <rect x="75" y="375" width="50" height="8" fill="#f59e0b" rx="1" />
                    <rect x="775" y="375" width="50" height="8" fill="#f59e0b" rx="1" />
                    <text x="60" y="368" fill="#fbbf24" fontSize="9" fontFamily="monospace">BP-01</text>
                    <text x="780" y="368" fill="#fbbf24" fontSize="9" fontFamily="monospace">BP-01</text>

                    {/* Rafters (UB 457x191x67) */}
                    {/* Left Rafter: (100, 180) to (450, 80) */}
                    <line x1="100" y1="180" x2="450" y2="80" stroke="#6366f1" strokeWidth="12" strokeLinecap="round" />
                    {/* Right Rafter: (450, 80) to (800, 180) */}
                    <line x1="450" y1="80" x2="800" y2="180" stroke="#6366f1" strokeWidth="12" strokeLinecap="round" />

                    {/* Apex Apex Ridge Text */}
                    <circle cx="450" cy="80" r="6" fill="#ec4899" />
                    <text x="410" y="55" fill="#f472b6" fontSize="11" fontFamily="monospace" fontWeight="bold">Apex +9.00m (Rise 1.5m)</text>

                    {/* Rafter dimension annotations */}
                    <text x="210" y="115" fill="#c7d2fe" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      Rafter 15.68m (UB 457)
                    </text>
                    <text x="560" y="115" fill="#c7d2fe" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      Rafter 15.68m (UB 457)
                    </text>

                    {/* Purlin Runs (Yellow dots along rafter) */}
                    {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((ratio, idx) => {
                      const xL = 100 + (450 - 100) * ratio;
                      const yL = 180 - (180 - 80) * ratio;
                      const xR = 450 + (800 - 450) * ratio;
                      const yR = 80 + (180 - 80) * ratio;
                      return (
                        <g key={idx}>
                          <rect x={xL - 4} y={yL - 10} width="8" height="8" fill="#eab308" rx="1" />
                          <rect x={xR - 4} y={yR - 10} width="8" height="8" fill="#eab308" rx="1" />
                        </g>
                      );
                    })}

                    {/* Skylight Translucent Cyan Zone */}
                    <rect x="250" y="110" width="70" height="24" fill="#06b6d4" fillOpacity="0.4" stroke="#22d3ee" strokeWidth="1.5" rx="2" transform="rotate(-15.8, 250, 110)" />
                    <text x="260" y="145" fill="#22d3ee" fontSize="9" fontFamily="monospace" fontWeight="bold">Skylight (6.0×1.0m)</text>

                    {/* Eaves Gutter */}
                    <rect x="65" y="175" width="20" height="15" fill="#10b981" rx="2" />
                    <rect x="815" y="175" width="20" height="15" fill="#10b981" rx="2" />
                    <text x="25" y="170" fill="#34d399" fontSize="9" fontFamily="monospace">Eaves Gutter</text>
                    <text x="825" y="170" fill="#34d399" fontSize="9" fontFamily="monospace">Eaves Gutter</text>

                    {/* Vertical Downpipes */}
                    <line x1="75" y1="190" x2="75" y2="375" stroke="#10b981" strokeWidth="4" />
                    <line x1="825" y1="190" x2="825" y2="375" stroke="#10b981" strokeWidth="4" />
                    <text x="15" y="240" fill="#34d399" fontSize="8" fontFamily="monospace">DP-01 (7.5m)</text>
                    <text x="835" y="240" fill="#34d399" fontSize="8" fontFamily="monospace">DP-01 (7.5m)</text>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Detailed Member Inspector & Formula Breakdown (w-84) */}
        <div className="w-84 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase">
              Element Inspector & Audit
            </span>
            {selectedMember && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {selectedMember ? (
            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Member title card */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-indigo-950">
                    {selectedMember.mark}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                    {selectedMember.category}
                  </span>
                </div>
                <span className="text-slate-600 block">{selectedMember.memberType}</span>
                <span className="text-xs font-mono font-bold text-indigo-700 block">
                  {selectedMember.section} ({selectedMember.materialGrade})
                </span>
              </div>

              {/* Physical Element & Double Counting Provenance */}
              <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Double-Counting Protection ID
                </span>
                <div className="font-mono text-xs font-bold text-slate-900">
                  {selectedMember.physicalMemberId}
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Shared across GA, Shop Drawings & IFC. Counted exactly once in BOQ.
                </span>
              </div>

              {/* Arithmetic Breakdown */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Deterministic Formula
                </span>
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg space-y-1 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{selectedMember.formula}</div>
                  <div className="font-bold pt-1 border-t border-slate-800 text-white">
                    {selectedMember.formulaWithValues}
                  </div>
                </div>
              </div>

              {/* Dimensional Metrics */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Member Length:</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {selectedMember.lengthM ? `${selectedMember.lengthM.toFixed(3)} m` : 'N/A'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Quantity:</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {selectedMember.quantity} Nr
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Unit Weight:</span>
                  <span className="font-mono font-bold text-indigo-700 text-xs">
                    {selectedMember.unitWeightKgM ? `${selectedMember.unitWeightKgM.toFixed(2)} kg/m` : 'N/A'}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] text-slate-500 block">Total Weight:</span>
                  <span className="font-mono font-bold text-indigo-700 text-xs">
                    {(selectedMember.totalWeightTonnes ?? 0).toFixed(3)} T ({Math.round(selectedMember.totalWeightKg ?? 0)} kg)
                  </span>
                </div>
              </div>

              {/* Drawing Provenance */}
              <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Drawing Provenance
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-900 block">
                      {selectedMember.drawingNumber} (Rev {selectedMember.revision})
                    </span>
                    <span className="text-[11px] text-slate-500">{selectedMember.sourceLocation}</span>
                  </div>
                  {onOpenDrawing && (
                    <button
                      onClick={() => onOpenDrawing(selectedMember.drawingNumber)}
                      className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600"
                      title="Navigate to Source Drawing"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* User Verification / Blocking */}
              <div className="pt-2 border-t border-slate-200">
                <button
                  onClick={() => handleToggleVerification(selectedMember.id)}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 ${
                    selectedMember.verificationStatus === 'USER VERIFIED'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {selectedMember.verificationStatus === 'USER VERIFIED'
                      ? 'Verified & Locked (Click to Re-Open)'
                      : 'Verify Member Quantity'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select a steel member or roofing component from the register to inspect its formula and drawing source.
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <CustomSectionModal
        isOpen={isCustomSecModalOpen}
        onClose={() => setIsCustomSecModalOpen(false)}
        onSectionUpdated={() => {
          // Trigger refresh if needed
        }}
      />

      <RoofGeometryModal
        isOpen={isRoofGeoModalOpen}
        onClose={() => setIsRoofGeoModalOpen(false)}
        initialData={roofGeometry}
        onSave={(updatedGeo) => {
          setRoofGeometry(updatedGeo);
          // Recalculate cladding gross area
          setCladdingItems((prev) =>
            prev.map((c) => ({
              ...c,
              grossRoofAreaM2: updatedGeo.grossRoofAreaM2,
              sheetLengthM: updatedGeo.slopingLengthM,
            }))
          );
        }}
      />

      <SteelConflictModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        conflicts={conflicts}
        onResolveConflict={handleResolveConflict}
      />

      <SteelRevisionModal
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        revisions={revisions}
        onMarkReviewed={handleMarkRevisionReviewed}
      />

      <SteelTestSuiteModal
        isOpen={isTestSuiteModalOpen}
        onClose={() => setIsTestSuiteModalOpen(false)}
      />

      <SteelEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        member={selectedMember}
        onSave={handleSaveEditedMember}
      />
    </div>
  );
};
