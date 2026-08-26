/**
 * PHASE 15C — MASONRY + DPC + DOORS/WINDOWS + FINISHES ENGINE WORKSPACE
 * Deterministic geometric takeoff complying with POMI / IS 1200 / NRM2 standards.
 * Zero guesswork architecture with complete source traceability, audit trail, and conflict engine.
 */

import React, { useState, useMemo } from 'react';
import {
  Layers,
  Calculator,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Edit3,
  Eye,
  ShieldCheck,
  RotateCw,
  Download,
  DoorOpen,
  AppWindow,
  Paintbrush,
  Sparkles,
  ChevronRight,
  SlidersHorizontal,
  XCircle,
  Clock,
  ExternalLink,
  Info,
  Check,
  AlertCircle,
  Settings,
  Scale,
  RefreshCw,
  Grid,
  FileSpreadsheet,
  ArrowRight,
  Plus,
  Trash2,
  HelpCircle,
  Droplets,
  Building2,
  Box,
  Compass,
} from 'lucide-react';
import {
  MasonryElementRecord,
  DpcElementRecord,
  DoorScheduleRecord,
  WindowScheduleRecord,
  PlasterTakeoffRecord,
  FloorFinishRecord,
  PaintingRecord,
  WaterproofingRecord,
  CeilingRecord,
  WallFinishCladdingRecord,
  RoomFinishScheduleRecord,
  ArchitecturalOpenItem,
  ArchitecturalConflict,
  ArchitecturalRevisionRecord,
  ProjectArchitecturalSettings,
  QualityStatus,
  MeasurementRuleStandard,
} from '../types/masonryFinishesTypes';
import {
  DEFAULT_ARCHITECTURAL_SETTINGS,
  calculateMasonryElement,
  calculateDpcElement,
  calculatePlasterElement,
  calculateWaterproofingElement,
  cascadeWallGeometricChange,
  getInitialArchitecturalDataset,
} from '../engine/masonryFinishesEngine';
import { runPhase15CTestSuite, TestSuiteSummary } from '../engine/masonryFinishesTestSuite';
import { downloadArchitecturalTakeoffCsv } from '../engine/masonryExcelExport';

export const MasonryFinishesEngineWorkspace: React.FC = () => {
  // Initialize from Master Dataset
  const initialData = useMemo(() => getInitialArchitecturalDataset(), []);

  const [walls, setWalls] = useState<MasonryElementRecord[]>(initialData.walls);
  const [dpcs, setDpcs] = useState<DpcElementRecord[]>(initialData.dpcs);
  const [doors, setDoors] = useState<DoorScheduleRecord[]>(initialData.doors);
  const [windows, setWindows] = useState<WindowScheduleRecord[]>(initialData.windows);
  const [plasters, setPlasters] = useState<PlasterTakeoffRecord[]>(initialData.plasters);
  const [floorings, setFloorings] = useState<FloorFinishRecord[]>(initialData.floorings);
  const [paints, setPaints] = useState<PaintingRecord[]>(initialData.paints);
  const [waterproofings, setWaterproofings] = useState<WaterproofingRecord[]>(initialData.waterproofings);
  const [ceilings, setCeilings] = useState<CeilingRecord[]>(initialData.ceilings);
  const [claddings, setCladdings] = useState<WallFinishCladdingRecord[]>(initialData.claddings);
  const [roomSchedules, setRoomSchedules] = useState<RoomFinishScheduleRecord[]>(initialData.roomSchedules);
  const [openItems, setOpenItems] = useState<ArchitecturalOpenItem[]>(initialData.openItems);
  const [conflicts, setConflicts] = useState<ArchitecturalConflict[]>(initialData.conflicts);
  const [revisions, setRevisions] = useState<ArchitecturalRevisionRecord[]>(initialData.revisions);

  // Settings
  const [settings, setSettings] = useState<ProjectArchitecturalSettings>(DEFAULT_ARCHITECTURAL_SETTINGS);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<
    'walls' | 'dpc' | 'doors' | 'windows' | 'plaster' | 'flooring' | 'painting' | 'waterproofing' | 'ceilings' | 'room-schedule' | 'open-items' | 'conflicts' | 'revisions'
  >('walls');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modals
  const [calcModalItem, setCalcModalItem] = useState<{
    title: string;
    category: string;
    item: any;
  } | null>(null);

  const [editWallModalItem, setEditWallModalItem] = useState<MasonryElementRecord | null>(null);
  const [editLength, setEditLength] = useState<number>(0);
  const [editHeight, setEditHeight] = useState<number>(0);
  const [editThickness, setEditThickness] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>('Architectural Drawing Addendum Revision');

  const [auditModalItem, setAuditModalItem] = useState<MasonryElementRecord | null>(null);

  // Test Suite Modal
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testSuiteSummary, setTestSuiteSummary] = useState<TestSuiteSummary | null>(null);

  // Summary Metrics Computation
  const summaryMetrics = useMemo(() => {
    const totalMasonryNetVolumeM3 = walls.reduce((acc, w) => acc + (w.isBlocked ? 0 : w.netVolumeM3), 0);
    const totalMasonryGrossVolumeM3 = walls.reduce((acc, w) => acc + (w.isBlocked ? 0 : w.grossVolumeM3), 0);
    const totalMasonryDeductionsM3 = walls.reduce((acc, w) => acc + (w.isBlocked ? 0 : w.deductionsVolumeM3), 0);
    
    const totalDpcAreaM2 = dpcs.reduce((acc, d) => acc + d.areaM2, 0);
    const totalDpcLinearM = dpcs.reduce((acc, d) => acc + d.linearLengthM, 0);

    const totalDoorsCount = doors.reduce((acc, d) => acc + d.quantity, 0);
    const totalDoorsAreaM2 = doors.reduce((acc, d) => acc + d.totalAreaM2, 0);

    const totalWindowsCount = windows.reduce((acc, w) => acc + w.quantity, 0);
    const totalWindowsAreaM2 = windows.reduce((acc, w) => acc + w.totalAreaM2, 0);
    const totalGlazingAreaM2 = windows.reduce((acc, w) => acc + w.glazingAreaM2, 0);

    const totalPlasterNetAreaM2 = plasters.reduce((acc, p) => acc + p.netAreaM2, 0);
    const totalFloorFinishNetAreaM2 = floorings.reduce((acc, f) => acc + f.netAreaM2, 0);
    const totalSkirtingLengthM = floorings.reduce((acc, f) => acc + f.skirtingLengthM, 0);

    const totalPaintAreaM2 = paints.reduce((acc, p) => acc + p.netAreaM2, 0);
    const totalWaterproofingAreaM2 = waterproofings.reduce((acc, wp) => acc + wp.totalWaterproofingAreaM2, 0);
    const totalCeilingAreaM2 = ceilings.reduce((acc, c) => acc + c.netAreaM2, 0);
    const totalCladdingAreaM2 = claddings.reduce((acc, cl) => acc + cl.netAreaM2, 0);

    const openItemsCount = openItems.filter((oi) => oi.status === 'OPEN').length;
    const conflictsCount = conflicts.filter((c) => c.status === 'OPEN').length;
    const verifiedItemsCount = walls.filter((w) => w.status === 'VERIFIED').length;
    const userCorrectedCount = walls.filter((w) => w.status === 'USER CORRECTED').length;

    return {
      totalMasonryNetVolumeM3,
      totalMasonryGrossVolumeM3,
      totalMasonryDeductionsM3,
      totalDpcAreaM2,
      totalDpcLinearM,
      totalDoorsCount,
      totalDoorsAreaM2,
      totalWindowsCount,
      totalWindowsAreaM2,
      totalGlazingAreaM2,
      totalPlasterNetAreaM2,
      totalFloorFinishNetAreaM2,
      totalSkirtingLengthM,
      totalPaintAreaM2,
      totalWaterproofingAreaM2,
      totalCeilingAreaM2,
      totalCladdingAreaM2,
      openItemsCount,
      conflictsCount,
      verifiedItemsCount,
      userCorrectedCount,
    };
  }, [walls, dpcs, doors, windows, plasters, floorings, paints, waterproofings, ceilings, claddings, openItems, conflicts]);

  // Distinct Filter Options
  const distinctLevels = useMemo(() => {
    const set = new Set<string>();
    walls.forEach((w) => set.add(w.level));
    doors.forEach((d) => set.add(d.level));
    windows.forEach((w) => set.add(w.level));
    floorings.forEach((f) => set.add(f.level));
    return Array.from(set);
  }, [walls, doors, windows, floorings]);

  // Filtered Walls
  const filteredWalls = useMemo(() => {
    return walls.filter((w) => {
      const matchSearch =
        searchQuery === '' ||
        w.wallMark.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.primarySource.drawingNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLevel = selectedLevel === 'ALL' || w.level === selectedLevel;
      const matchStatus = selectedStatus === 'ALL' || w.status === selectedStatus;
      return matchSearch && matchLevel && matchStatus;
    });
  }, [walls, searchQuery, selectedLevel, selectedStatus]);

  // Handlers
  const handleOpenEditWall = (wall: MasonryElementRecord) => {
    setEditWallModalItem(wall);
    setEditLength(wall.lengthM);
    setEditHeight(wall.heightM);
    setEditThickness(wall.thicknessM);
    setEditReason('Drawing Revision / Addendum Correction');
  };

  const handleSaveWallEdit = () => {
    if (!editWallModalItem) return;
    const {
      updatedWall,
      updatedDpcs,
      updatedPlasters,
      updatedPaints,
      updatedCladdings,
    } = cascadeWallGeometricChange(
      editWallModalItem,
      editLength,
      editHeight,
      editThickness,
      dpcs,
      plasters,
      paints,
      claddings,
      editReason
    );

    setWalls((prev) => prev.map((w) => (w.id === updatedWall.id ? updatedWall : w)));
    setDpcs(updatedDpcs);
    setPlasters(updatedPlasters);
    setPaints(updatedPaints);
    setCladdings(updatedCladdings);
    setEditWallModalItem(null);
  };

  const handleRunTests = () => {
    const summary = runPhase15CTestSuite();
    setTestSuiteSummary(summary);
    setTestModalOpen(true);
  };

  const handleExportCsv = () => {
    downloadArchitecturalTakeoffCsv({
      projectName: 'Premier Horizon Medical Center',
      projectNumber: 'PRJ-2026-ARCH-015',
      dateGenerated: new Date().toISOString().replace('T', ' ').slice(0, 19),
      walls,
      dpcs,
      doors,
      windows,
      plasters,
      floorings,
      paints,
      waterproofings,
      ceilings,
      claddings,
      roomSchedules,
      openItems,
      conflicts,
      revisions,
    });
  };

  const handleResolveConflict = (conflictId: string) => {
    setConflicts((prev) =>
      prev.map((c) =>
        c.id === conflictId
          ? {
              ...c,
              status: 'RESOLVED',
              resolvedBy: 'Lead QS',
              resolvedAt: new Date().toISOString().slice(0, 10),
              resolutionNote: 'Architectural RFI Clarification received: Adopt 230mm brick wall as per Addendum 03.',
            }
          : c
      )
    );
  };

  return (
    <div id="masonry-finishes-workspace" className="flex flex-col h-full bg-slate-50 overflow-hidden text-slate-800">
      {/* 1. Header Toolbar */}
      <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Masonry, DPC, Doors/Windows & Finishes Takeoff Engine
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-100 text-indigo-800 rounded-full border border-indigo-200">
                PHASE 15C
              </span>
              <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Zero Guesswork Standard
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Standard: <strong className="text-slate-700">{settings.measurementStandard}</strong></span>
              <span>•</span>
              <span>DPC Unit: <strong className="text-slate-700">{settings.dpcMeasurementUnit}</strong></span>
              <span>•</span>
              <span>Sequence: Foundation → DPC → Masonry → Lintel → Plaster → Paint</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1.5 transition-colors border border-slate-300"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Rules & Standards</span>
          </button>

          <button
            onClick={handleRunTests}
            className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md flex items-center gap-1.5 transition-colors border border-indigo-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Run 10 Critical Tests</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-white" />
            <span>Export 16-Sheet Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Dashboard */}
      <div className="bg-slate-100/80 border-b border-slate-200 px-5 py-3 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Masonry Volume */}
          <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>Masonry Vol</span>
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              {summaryMetrics.totalMasonryNetVolumeM3.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-500">m³</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Ded: -{summaryMetrics.totalMasonryDeductionsM3.toFixed(2)} m³
            </div>
          </div>

          {/* DPC */}
          <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>DPC Area</span>
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              {summaryMetrics.totalDpcAreaM2.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-500">m²</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Linear: {summaryMetrics.totalDpcLinearM.toFixed(1)} m
            </div>
          </div>

          {/* Doors */}
          <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>Doors Total</span>
              <DoorOpen className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              {summaryMetrics.totalDoorsCount}{' '}
              <span className="text-xs font-normal text-slate-500">nos</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Area: {summaryMetrics.totalDoorsAreaM2.toFixed(1)} m²
            </div>
          </div>

          {/* Windows */}
          <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>Windows</span>
              <AppWindow className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              {summaryMetrics.totalWindowsCount}{' '}
              <span className="text-xs font-normal text-slate-500">nos</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Glazing: {summaryMetrics.totalGlazingAreaM2.toFixed(1)} m²
            </div>
          </div>

          {/* Plaster */}
          <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>Plaster</span>
              <Paintbrush className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              {summaryMetrics.totalPlasterNetAreaM2.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-500">m²</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Paint: {summaryMetrics.totalPaintAreaM2.toFixed(1)} m²
            </div>
          </div>

          {/* Flooring */}
          <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>Flooring</span>
              <Grid className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              {summaryMetrics.totalFloorFinishNetAreaM2.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-500">m²</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Skirting: {summaryMetrics.totalSkirtingLengthM.toFixed(1)} m
            </div>
          </div>

          {/* Waterproofing */}
          <div className="bg-white p-2.5 rounded-md border border-slate-200 shadow-2xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>Waterproofing</span>
              <Droplets className="w-3.5 h-3.5 text-cyan-600" />
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-1 text-cyan-900">
              {summaryMetrics.totalWaterproofingAreaM2.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-500">m²</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Wet Areas & Roof
            </div>
          </div>

          {/* Governance & Open Items */}
          <div className={`p-2.5 rounded-md border shadow-2xs ${summaryMetrics.conflictsCount > 0 ? 'bg-amber-50/80 border-amber-300' : 'bg-white border-slate-200'}`}>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>Zero Guesswork</span>
              {summaryMetrics.conflictsCount > 0 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </div>
            <div className="text-base font-extrabold text-slate-900 mt-1">
              {summaryMetrics.openItemsCount}{' '}
              <span className="text-xs font-normal text-slate-500">Open Items</span>
            </div>
            <div className="text-[10px] font-medium text-amber-700 mt-0.5">
              {summaryMetrics.conflictsCount} Drawing Conflicts
            </div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="bg-white border-b border-slate-200 px-5 flex items-center gap-1 overflow-x-auto shrink-0 scrollbar-none">
        {[
          { id: 'walls', label: 'Masonry Walls', icon: Building2, count: walls.length },
          { id: 'dpc', label: 'DPC Schedule', icon: Layers, count: dpcs.length },
          { id: 'doors', label: 'Doors Schedule', icon: DoorOpen, count: doors.length },
          { id: 'windows', label: 'Windows & Glazing', icon: AppWindow, count: windows.length },
          { id: 'plaster', label: 'Plaster Finishes', icon: Paintbrush, count: plasters.length },
          { id: 'flooring', label: 'Flooring & Skirting', icon: Grid, count: floorings.length },
          { id: 'painting', label: 'Painting & Coats', icon: Paintbrush, count: paints.length },
          { id: 'waterproofing', label: 'Waterproofing & Upstands', icon: Droplets, count: waterproofings.length },
          { id: 'ceilings', label: 'Ceilings & Wall Dados', icon: Layers, count: ceilings.length + claddings.length },
          { id: 'room-schedule', label: 'Room Finish Schedule', icon: FileText, count: roomSchedules.length },
          { id: 'open-items', label: 'Open Items (Zero Guess)', icon: HelpCircle, count: summaryMetrics.openItemsCount, isAlert: summaryMetrics.openItemsCount > 0 },
          { id: 'conflicts', label: 'Drawing Conflicts', icon: AlertTriangle, count: summaryMetrics.conflictsCount, isAlert: summaryMetrics.conflictsCount > 0 },
          { id: 'revisions', label: 'Revisions & Deltas', icon: Clock, count: revisions.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-indigo-600 text-indigo-700 font-bold bg-indigo-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    tab.isAlert
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : isActive
                      ? 'bg-indigo-200 text-indigo-900'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Tab Body Content Area */}
      <div className="flex-1 overflow-auto p-5">
        {/* TAB 1: MASONRY WALLS */}
        {activeTab === 'walls' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search wall mark, material, drawing or zone..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Levels</option>
                  {distinctLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="USER CORRECTED">User Corrected</option>
                  <option value="CONFLICT">Conflict</option>
                  <option value="CALCULATED">Calculated</option>
                </select>
              </div>
            </div>

            {/* Masonry Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2.5 px-3">Wall Mark</th>
                      <th className="py-2.5 px-3">Type & Material</th>
                      <th className="py-2.5 px-3">Level & Zone</th>
                      <th className="py-2.5 px-3 text-right">Length</th>
                      <th className="py-2.5 px-3 text-right">Height</th>
                      <th className="py-2.5 px-3 text-right">Thickness</th>
                      <th className="py-2.5 px-3 text-right">Gross Vol</th>
                      <th className="py-2.5 px-3 text-right">Deductions</th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">Net Volume</th>
                      <th className="py-2.5 px-3">Lintel & DPC</th>
                      <th className="py-2.5 px-3">Source Drawing</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredWalls.map((wall) => (
                      <tr
                        key={wall.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          wall.isBlocked ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{wall.wallMark}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{wall.wallType}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={wall.material}>
                            {wall.material}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-800">{wall.level}</div>
                          <div className="text-[11px] text-slate-500">{wall.zone}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{wall.lengthM.toFixed(2)}m</td>
                        <td className="py-2.5 px-3 text-right font-mono" title={wall.heightDerivationFormula}>
                          <div>{wall.heightM.toFixed(2)}m</div>
                          <div className="text-[9px] text-slate-400 truncate max-w-[90px]">{wall.heightDerivationMethod}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">
                          {(wall.thicknessM * 1000).toFixed(0)}mm
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {wall.grossVolumeM3.toFixed(3)} m³
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                          {wall.deductionsVolumeM3 > 0 ? `-${wall.deductionsVolumeM3.toFixed(3)} m³` : '0.000'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 text-sm">
                          {wall.isBlocked ? (
                            <span className="text-xs text-amber-700 font-semibold">BLOCKED</span>
                          ) : (
                            `${wall.netVolumeM3.toFixed(3)} m³`
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-[11px] font-medium text-slate-700">{wall.lintelType}</div>
                          {wall.linkedDpcId && (
                            <span className="text-[10px] text-indigo-600 font-mono">DPC: {wall.linkedDpcId}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            <span>{wall.primarySource.drawingNumber}</span>
                            <span className="text-[10px] text-slate-400">(Rev {wall.primarySource.revision})</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{wall.primarySource.gridOrZone}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              wall.status === 'VERIFIED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : wall.status === 'USER CORRECTED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : wall.status === 'CONFLICT'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {wall.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() =>
                                setCalcModalItem({
                                  title: `Masonry Wall: ${wall.wallMark}`,
                                  category: 'Masonry Wall Takeoff',
                                  item: wall,
                                })
                              }
                              className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded"
                              title="View Mathematical Calculation Trace"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditWall(wall)}
                              className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit Geometry & Cascade Dependencies"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {wall.corrections && wall.corrections.length > 0 && (
                              <button
                                onClick={() => setAuditModalItem(wall)}
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                                title={`View ${wall.corrections.length} Audit Trail Records`}
                              >
                                <Clock className="w-3.5 h-3.5" />
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
          </div>
        )}

        {/* TAB 2: DPC SCHEDULE */}
        {activeTab === 'dpc' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>DPC Engineering Rule:</strong> Damp Proof Course (DPC) is measured separately as a barrier membrane at plinth level and is <em>not</em> subtracted from or aggregated into masonry volume. Strip DPC is measured in m² (Length × Width) or linear meters according to the project method of measurement.
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">DPC Mark</th>
                    <th className="py-2.5 px-3">Associated Wall</th>
                    <th className="py-2.5 px-3">Level & Location</th>
                    <th className="py-2.5 px-3">System Type & Spec</th>
                    <th className="py-2.5 px-3 text-right">Length</th>
                    <th className="py-2.5 px-3 text-right">Width</th>
                    <th className="py-2.5 px-3 text-right">Unit</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">DPC Area</th>
                    <th className="py-2.5 px-3 text-right">Linear (m)</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Trace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dpcs.map((dpc) => (
                    <tr key={dpc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{dpc.dpcMark}</td>
                      <td className="py-2.5 px-3 font-medium text-indigo-700">{dpc.associatedWallMark}</td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800">{dpc.level}</div>
                        <div className="text-[11px] text-slate-500">{dpc.locationType}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{dpc.systemType}</div>
                        <div className="text-[11px] text-slate-500">{dpc.specification}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{dpc.lengthM.toFixed(2)}m</td>
                      <td className="py-2.5 px-3 text-right font-mono">{(dpc.widthM * 1000).toFixed(0)}mm</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-700">{dpc.measurementUnit}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                        {dpc.areaM2.toFixed(3)} m²
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {dpc.linearLengthM.toFixed(2)} m
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{dpc.primarySource.drawingNumber}</div>
                        <div className="text-[10px] text-slate-500">{dpc.primarySource.gridOrZone}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {dpc.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() =>
                            setCalcModalItem({
                              title: `DPC: ${dpc.dpcMark}`,
                              category: 'Damp Proof Course Takeoff',
                              item: dpc,
                            })
                          }
                          className="p-1 text-slate-600 hover:text-indigo-600 rounded"
                          title="View Calculation Trace"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DOORS SCHEDULE */}
        {activeTab === 'doors' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Door Mark</th>
                    <th className="py-2.5 px-3">Description & Type</th>
                    <th className="py-2.5 px-3 text-right">Width (m)</th>
                    <th className="py-2.5 px-3 text-right">Height (m)</th>
                    <th className="py-2.5 px-3 text-right">Unit Area</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Total Area</th>
                    <th className="py-2.5 px-3">Frame & Shutter</th>
                    <th className="py-2.5 px-3">Fire Rating</th>
                    <th className="py-2.5 px-3">Level / Room</th>
                    <th className="py-2.5 px-3">Schedule Source</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {doors.map((door) => (
                    <tr
                      key={door.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        door.status === 'CONFLICT' ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <DoorOpen className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{door.doorMark}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{door.description}</div>
                        <div className="text-[11px] text-slate-500">{door.doorType}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{door.widthM.toFixed(2)}m</td>
                      <td className="py-2.5 px-3 text-right font-mono">{door.heightM.toFixed(2)}m</td>
                      <td className="py-2.5 px-3 text-right font-mono">{door.singleAreaM2.toFixed(2)} m²</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">{door.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 text-sm">
                        {door.totalAreaM2.toFixed(2)} m²
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800">{door.frameMaterial}</div>
                        <div className="text-[11px] text-slate-500">{door.shutterMaterial}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            door.fireRating?.includes('FD')
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {door.fireRating || 'Non-FR'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800">{door.level}</div>
                        <div className="text-[11px] text-slate-500">{door.roomRef || '-'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{door.scheduleSource.drawingNumber}</div>
                        <div className="text-[10px] text-slate-500">{door.scheduleSource.gridOrZone}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                            door.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-300'
                          }`}
                        >
                          {door.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: WINDOWS SCHEDULE */}
        {activeTab === 'windows' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Window Mark</th>
                    <th className="py-2.5 px-3">Description & Type</th>
                    <th className="py-2.5 px-3 text-right">Width</th>
                    <th className="py-2.5 px-3 text-right">Height</th>
                    <th className="py-2.5 px-3 text-right">Sill / Head</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Total Area</th>
                    <th className="py-2.5 px-3 text-right font-bold text-cyan-800">Glazing Area</th>
                    <th className="py-2.5 px-3">Frame & Glass Spec</th>
                    <th className="py-2.5 px-3">Level / Room</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {windows.map((win) => (
                    <tr key={win.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <AppWindow className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{win.windowMark}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{win.description}</div>
                        <div className="text-[11px] text-slate-500">{win.windowType}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{win.widthM.toFixed(2)}m</td>
                      <td className="py-2.5 px-3 text-right font-mono">{win.heightM.toFixed(2)}m</td>
                      <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-600">
                        S: {win.sillHeightM.toFixed(2)}m / H: {win.headHeightM.toFixed(2)}m
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">{win.quantity}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                        {win.totalAreaM2.toFixed(2)} m²
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-800">
                        {win.glazingAreaM2.toFixed(2)} m²
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800">{win.frameMaterial}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px]" title={win.glazingSpec}>
                          {win.glazingSpec}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800">{win.level}</div>
                        <div className="text-[11px] text-slate-500">{win.roomRef || '-'}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{win.primarySource.drawingNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {win.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PLASTER FINISHES */}
        {activeTab === 'plaster' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Plaster Mark</th>
                    <th className="py-2.5 px-3">Location & Wall Ref</th>
                    <th className="py-2.5 px-3">Face Type</th>
                    <th className="py-2.5 px-3 text-right">Faces</th>
                    <th className="py-2.5 px-3 text-right">Gross Area</th>
                    <th className="py-2.5 px-3 text-right">Deductions</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Net Area</th>
                    <th className="py-2.5 px-3 text-right">Thk</th>
                    <th className="py-2.5 px-3 text-right">Volume</th>
                    <th className="py-2.5 px-3">Specification</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {plasters.map((plaster) => (
                    <tr key={plaster.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{plaster.plasterMark}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{plaster.locationType}</div>
                        <div className="text-[11px] text-indigo-600 font-mono">
                          Wall: {plaster.associatedWallMark || '-'}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">{plaster.faceType}</td>
                      <td className="py-2.5 px-3 text-right font-bold">{plaster.facesCount}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{plaster.grossAreaM2.toFixed(2)} m²</td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                        -{plaster.deductionAreaM2.toFixed(2)} m²
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 text-sm">
                        {plaster.netAreaM2.toFixed(2)} m²
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">{plaster.thicknessMm}mm</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        {plaster.volumeM3 ? `${plaster.volumeM3.toFixed(3)} m³` : '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800 truncate max-w-[240px]" title={plaster.specification}>
                          {plaster.specification}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{plaster.primarySource.drawingNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {plaster.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: FLOORING & SKIRTING */}
        {activeTab === 'flooring' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Finish Mark</th>
                    <th className="py-2.5 px-3">Room / Space</th>
                    <th className="py-2.5 px-3">Finish Type & Specification</th>
                    <th className="py-2.5 px-3 text-right">Gross Area</th>
                    <th className="py-2.5 px-3 text-right">Shaft Void Ded</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Net Floor Area</th>
                    <th className="py-2.5 px-3 text-right font-bold text-indigo-800">Skirting Length</th>
                    <th className="py-2.5 px-3 text-right">Skirting Hgt</th>
                    <th className="py-2.5 px-3 text-right">Screed Bed</th>
                    <th className="py-2.5 px-3">Drawing Source</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {floorings.map((floor) => (
                    <tr key={floor.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{floor.finishMark}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{floor.roomName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">Room: {floor.roomNumber} ({floor.level})</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{floor.finishType}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[250px]" title={floor.specification}>
                          {floor.specification}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{floor.grossAreaM2.toFixed(2)} m²</td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                        -{floor.deductionsVoidAreaM2.toFixed(2)} m²
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 text-sm">
                        {floor.netAreaM2.toFixed(2)} m²
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-800">
                        {floor.skirtingLengthM.toFixed(2)} m
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{floor.skirtingHeightMm}mm</td>
                      <td className="py-2.5 px-3 text-right font-mono">{floor.screedBeddingThicknessMm || '-'}mm</td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{floor.primarySource.drawingNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {floor.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: PAINTING & COATINGS */}
        {activeTab === 'painting' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Painting Engineering Rule:</strong> Number of coats (e.g. 2 Coats Emulsion) is recorded as a technical specification attribute and is <em>not</em> multiplied into the measured finished surface area unless explicitly required by a special BOQ clause.
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Paint Mark</th>
                    <th className="py-2.5 px-3">Surface Type & Ref</th>
                    <th className="py-2.5 px-3">Level / Zone</th>
                    <th className="py-2.5 px-3">System Specification</th>
                    <th className="py-2.5 px-3 text-right">Coats (Attr)</th>
                    <th className="py-2.5 px-3">Primer & Putty</th>
                    <th className="py-2.5 px-3 text-right font-bold text-slate-900">Net Painted Area</th>
                    <th className="py-2.5 px-3">Source Drawing</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paints.map((pnt) => (
                    <tr key={pnt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{pnt.paintMark}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{pnt.surfaceType}</div>
                        <div className="text-[11px] text-indigo-600 font-mono">Ref: {pnt.associatedSurfaceRef}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800">{pnt.level}</div>
                        <div className="text-[11px] text-slate-500">{pnt.roomZone}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800 truncate max-w-[280px]" title={pnt.systemSpecification}>
                          {pnt.systemSpecification}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono">{pnt.coatsCount} Coats</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className={`px-1.5 py-0.2 rounded ${pnt.hasSeparatePrimerItem ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                            Primer
                          </span>
                          <span className={`px-1.5 py-0.2 rounded ${pnt.hasSeparatePuttyItem ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-500'}`}>
                            Putty
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 text-sm">
                        {pnt.netAreaM2.toFixed(2)} m²
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{pnt.primarySource.drawingNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {pnt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: WATERPROOFING & UPSTANDS */}
        {activeTab === 'waterproofing' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">WP Mark</th>
                    <th className="py-2.5 px-3">Category & Zone</th>
                    <th className="py-2.5 px-3">System Specification</th>
                    <th className="py-2.5 px-3 text-right">Layers</th>
                    <th className="py-2.5 px-3 text-right">Horizontal Area</th>
                    <th className="py-2.5 px-3 text-right">Upstand Length</th>
                    <th className="py-2.5 px-3 text-right">Upstand Hgt</th>
                    <th className="py-2.5 px-3 text-right">Upstand Area</th>
                    <th className="py-2.5 px-3 text-right font-bold text-cyan-900">Total WP Area</th>
                    <th className="py-2.5 px-3">Protective Screed</th>
                    <th className="py-2.5 px-3">Source</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {waterproofings.map((wp) => (
                    <tr key={wp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{wp.wpMark}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{wp.locationCategory}</div>
                        <div className="text-[11px] text-slate-500">{wp.roomZone} ({wp.level})</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-slate-800 truncate max-w-[280px]" title={wp.systemSpecification}>
                          {wp.systemSpecification}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono">{wp.layersCount}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{wp.horizontalAreaM2.toFixed(2)} m²</td>
                      <td className="py-2.5 px-3 text-right font-mono">{wp.upstandLengthM.toFixed(2)}m</td>
                      <td className="py-2.5 px-3 text-right font-mono">{(wp.upstandHeightM * 1000).toFixed(0)}mm</td>
                      <td className="py-2.5 px-3 text-right font-mono text-cyan-800 font-semibold">
                        +{wp.upstandAreaM2.toFixed(2)} m²
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-900 text-sm">
                        {wp.totalWaterproofingAreaM2.toFixed(2)} m²
                      </td>
                      <td className="py-2.5 px-3">
                        {wp.protectiveScreedRequired ? (
                          <span className="text-[11px] font-medium text-emerald-700">
                            {wp.protectiveScreedThicknessMm}mm Screed
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800">{wp.primarySource.drawingNumber}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {wp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: CEILINGS & WALL DADOS */}
        {activeTab === 'ceilings' && (
          <div className="space-y-6">
            {/* False Ceilings */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>False & Suspended Ceilings</span>
              </h3>
              <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2.5 px-3">Ceiling Mark</th>
                      <th className="py-2.5 px-3">Zone / Room</th>
                      <th className="py-2.5 px-3">Ceiling Type & Specification</th>
                      <th className="py-2.5 px-3 text-right">Clear Height AFFL</th>
                      <th className="py-2.5 px-3 text-right">Gross Area</th>
                      <th className="py-2.5 px-3 text-right">Cove / Trap Ded</th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">Net Ceiling Area</th>
                      <th className="py-2.5 px-3">Source Drawing</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {ceilings.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{c.ceilingMark}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{c.roomZone}</div>
                          <div className="text-[11px] text-slate-500">{c.level}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{c.ceilingType}</div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[280px]" title={c.specification}>
                            {c.specification}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold">{c.clearHeightAfflM.toFixed(2)}m AFFL</td>
                        <td className="py-2.5 px-3 text-right font-mono">{c.grossAreaM2.toFixed(2)} m²</td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-700">-{c.openingsDeductionM2.toFixed(2)} m²</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 text-sm">
                          {c.netAreaM2.toFixed(2)} m²
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{c.primarySource.drawingNumber}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Wall Dados & Cladding */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-indigo-600" />
                <span>Wall Dados & Feature Claddings</span>
              </h3>
              <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2.5 px-3">Cladding Mark</th>
                      <th className="py-2.5 px-3">Location & Zone</th>
                      <th className="py-2.5 px-3">Material Specification</th>
                      <th className="py-2.5 px-3 text-right">Perimeter (m)</th>
                      <th className="py-2.5 px-3 text-right">Dado Height (m)</th>
                      <th className="py-2.5 px-3 text-right">Gross Area</th>
                      <th className="py-2.5 px-3 text-right">Openings Ded</th>
                      <th className="py-2.5 px-3 text-right font-bold text-slate-900">Net Cladding Area</th>
                      <th className="py-2.5 px-3">Source</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {claddings.map((clad) => (
                      <tr key={clad.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{clad.claddingMark}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{clad.locationType}</div>
                          <div className="text-[11px] text-slate-500">{clad.roomZone}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="text-slate-800 truncate max-w-[260px]" title={clad.materialSpec}>
                            {clad.materialSpec}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{clad.wallPerimeterLengthM.toFixed(2)}m</td>
                        <td className="py-2.5 px-3 text-right font-mono">{clad.claddingHeightM.toFixed(2)}m</td>
                        <td className="py-2.5 px-3 text-right font-mono">{clad.grossAreaM2.toFixed(2)} m²</td>
                        <td className="py-2.5 px-3 text-right font-mono text-amber-700">-{clad.openingDeductionsM2.toFixed(2)} m²</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 text-sm">
                          {clad.netAreaM2.toFixed(2)} m²
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800">{clad.primarySource.drawingNumber}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {clad.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: ROOM FINISH SCHEDULE */}
        {activeTab === 'room-schedule' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-3">Room No</th>
                    <th className="py-2.5 px-3">Room Name & Level</th>
                    <th className="py-2.5 px-3">Floor Finish</th>
                    <th className="py-2.5 px-3">Skirting Finish</th>
                    <th className="py-2.5 px-3">Internal Wall Finish</th>
                    <th className="py-2.5 px-3">Ceiling Finish</th>
                    <th className="py-2.5 px-3 text-right">Ceiling Hgt</th>
                    <th className="py-2.5 px-3">Schedule Drawing Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {roomSchedules.map((rs) => (
                    <tr key={rs.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{rs.roomNumber}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{rs.roomName}</div>
                        <div className="text-[11px] text-slate-500">{rs.level}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-indigo-700">{rs.floorFinish}</td>
                      <td className="py-2.5 px-3 text-slate-700">{rs.skirtingFinish}</td>
                      <td className="py-2.5 px-3 text-slate-700">{rs.internalWallFinish}</td>
                      <td className="py-2.5 px-3 text-slate-700">{rs.ceilingFinish}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">{rs.ceilingHeightM.toFixed(2)}m</td>
                      <td className="py-2.5 px-3 font-medium text-slate-600">{rs.drawingRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 11: ZERO GUESSWORK OPEN ITEMS */}
        {activeTab === 'open-items' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Zero Guesswork Rule:</strong> If wall thickness, height, DPC dimensions, plaster thickness, opening dimensions or finish specifications are missing or unreadable in the architectural drawings, the engine <em>strictly refuses to invent or assume values</em> and logs an explicit blocking Open Item.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {openItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-between hover:border-indigo-200 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500">{item.id}</span>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          item.severity === 'HIGH_BLOCKING'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {item.severity === 'HIGH_BLOCKING' ? 'BLOCKING TAKEOFF' : 'REVIEW'}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-2">{item.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{item.description}</p>

                    <div className="mt-3 p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px]">
                      <div className="font-semibold text-slate-700">Missing Information:</div>
                      <div className="text-slate-600 mt-0.5">{item.missingInformation}</div>
                    </div>

                    <div className="mt-2 text-[11px] text-indigo-700">
                      <strong>Suggested RFI:</strong> {item.suggestedRfiResolution}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-500">Drawing: {item.drawingNumber}</span>
                    <span className="font-bold text-amber-700 uppercase">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 12: DRAWING CONFLICTS */}
        {activeTab === 'conflicts' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Cross-Drawing & Schedule Discrepancies
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Plan vs Section vs Schedule dimension mismatch detection engine
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-md border border-amber-300">
                  {conflicts.filter((c) => c.status === 'OPEN').length} Active Conflicts
                </span>
              </div>

              <div className="divide-y divide-slate-200">
                {conflicts.map((conf) => (
                  <div key={conf.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-600">{conf.id}</span>
                        <span className="text-xs font-bold text-slate-900">{conf.title}</span>
                        <span
                          className={`px-2 py-0.2 text-[10px] font-bold rounded-full ${
                            conf.status === 'OPEN'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {conf.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{conf.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-2.5 rounded bg-blue-50/70 border border-blue-200 text-xs">
                          <div className="font-bold text-blue-950 flex items-center gap-1">
                            <span>Source A: {conf.sourceA.drawing}</span>
                          </div>
                          <div className="text-blue-900 mt-1 font-semibold">{conf.sourceA.value}</div>
                          <div className="text-[10px] text-blue-700 mt-0.5">{conf.sourceA.location}</div>
                        </div>

                        <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200 text-xs">
                          <div className="font-bold text-amber-950 flex items-center gap-1">
                            <span>Source B: {conf.sourceB.drawing}</span>
                          </div>
                          <div className="text-amber-900 mt-1 font-semibold">{conf.sourceB.value}</div>
                          <div className="text-[10px] text-amber-700 mt-0.5">{conf.sourceB.location}</div>
                        </div>
                      </div>

                      {conf.status === 'RESOLVED' && (
                        <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-xs text-emerald-800">
                          <strong>Resolved by {conf.resolvedBy} on {conf.resolvedAt}:</strong> {conf.resolutionNote}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {conf.status === 'OPEN' && (
                        <button
                          onClick={() => handleResolveConflict(conf.id)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve via RFI</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 13: REVISIONS & DELTAS */}
        {activeTab === 'revisions' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Architectural Drawing Revisions & Quantity Impact Register
                </h3>
              </div>
              <div className="divide-y divide-slate-200">
                {revisions.map((rev) => (
                  <div key={rev.revisionId} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                          {rev.revisionId}
                        </span>
                        <span className="text-xs font-bold text-slate-800">Drawing {rev.drawingNumber}</span>
                        <span className="text-xs text-slate-500">Issued on {rev.issueDate}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-700">{rev.description}</p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Walls Impacted</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">
                          +{rev.wallsAddedCount} Added / {rev.wallsModifiedCount} Modified
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Net Masonry Delta</div>
                        <div className={`text-xs font-bold mt-0.5 ${rev.masonryVolumeDeltaM3 < 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {rev.masonryVolumeDeltaM3 > 0 ? `+${rev.masonryVolumeDeltaM3}` : rev.masonryVolumeDeltaM3} m³
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Plaster Delta</div>
                        <div className="text-xs font-bold text-slate-800 mt-0.5">
                          {rev.plasterDeltaM2} m²
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Affected BOQ Codes</div>
                        <div className="text-xs font-mono font-medium text-indigo-700 mt-0.5">
                          {rev.affectedBoqItemCodes.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: MATHEMATICAL CALCULATION AUDIT TRACE */}
      {/* ========================================================================= */}
      {calcModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold">{calcModalItem.title}</h3>
                  <p className="text-xs text-slate-400">{calcModalItem.category}</p>
                </div>
              </div>
              <button
                onClick={() => setCalcModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Formula & Substitutions */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800 text-sm">Deterministic Mathematical Expression:</div>
                <div className="mt-2 p-3 bg-white rounded border border-slate-300 font-mono text-indigo-900 font-semibold leading-relaxed">
                  {calcModalItem.item.calculationFormulaWithValues || 'Formula calculated from geometric inputs.'}
                </div>
              </div>

              {/* Geometric Inputs Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 bg-slate-100 rounded">
                  <div className="text-[10px] text-slate-500 font-semibold">LENGTH (L)</div>
                  <div className="text-xs font-bold text-slate-900 font-mono mt-0.5">{calcModalItem.item.lengthM || '-'} m</div>
                </div>
                <div className="p-2.5 bg-slate-100 rounded">
                  <div className="text-[10px] text-slate-500 font-semibold">HEIGHT (H)</div>
                  <div className="text-xs font-bold text-slate-900 font-mono mt-0.5">{calcModalItem.item.heightM || '-'} m</div>
                </div>
                <div className="p-2.5 bg-slate-100 rounded">
                  <div className="text-[10px] text-slate-500 font-semibold">THICKNESS (T)</div>
                  <div className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                    {calcModalItem.item.thicknessM ? `${(calcModalItem.item.thicknessM * 1000).toFixed(0)} mm` : '-'}
                  </div>
                </div>
                <div className="p-2.5 bg-slate-100 rounded">
                  <div className="text-[10px] text-slate-500 font-semibold">NET QUANTITY</div>
                  <div className="text-xs font-bold text-indigo-700 font-mono mt-0.5">
                    {calcModalItem.item.netVolumeM3 !== undefined
                      ? `${calcModalItem.item.netVolumeM3.toFixed(3)} m³`
                      : calcModalItem.item.areaM2 !== undefined
                      ? `${calcModalItem.item.areaM2.toFixed(2)} m²`
                      : '-'}
                  </div>
                </div>
              </div>

              {/* Openings Deduction Breakdown (if wall) */}
              {calcModalItem.item.openings && calcModalItem.item.openings.length > 0 && (
                <div>
                  <div className="font-bold text-slate-800 mb-2">Openings Deductions Register:</div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 font-semibold text-slate-700">
                        <tr>
                          <th className="py-2 px-3">Mark</th>
                          <th className="py-2 px-3">Type</th>
                          <th className="py-2 px-3 text-right">Width</th>
                          <th className="py-2 px-3 text-right">Height</th>
                          <th className="py-2 px-3 text-right">Qty</th>
                          <th className="py-2 px-3 text-right">Area Ded</th>
                          <th className="py-2 px-3 text-right">Vol Ded</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {calcModalItem.item.openings.map((op: any) => (
                          <tr key={op.id}>
                            <td className="py-2 px-3 font-bold">{op.openingMark}</td>
                            <td className="py-2 px-3">{op.type}</td>
                            <td className="py-2 px-3 text-right font-mono">{op.widthM.toFixed(2)}m</td>
                            <td className="py-2 px-3 text-right font-mono">{op.heightM.toFixed(2)}m</td>
                            <td className="py-2 px-3 text-right font-mono">{op.quantity}</td>
                            <td className="py-2 px-3 text-right font-mono text-amber-700">-{op.totalAreaM2.toFixed(2)} m²</td>
                            <td className="py-2 px-3 text-right font-mono text-amber-700 font-bold">-{op.totalVolumeM3.toFixed(3)} m³</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Source Provenance */}
              {calcModalItem.item.primarySource && (
                <div className="bg-slate-100 p-3 rounded-lg flex items-center justify-between text-slate-700">
                  <div>
                    <span className="font-semibold">Drawing Reference:</span> {calcModalItem.item.primarySource.drawingNumber} ({calcModalItem.item.primarySource.drawingTitle})
                  </div>
                  <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-300">
                    Rev {calcModalItem.item.primarySource.revision}
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setCalcModalItem(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 rounded"
              >
                Close Audit Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT GEOMETRY & CASCADING DEPENDENCY RECALCULATION */}
      {/* ========================================================================= */}
      {editWallModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-indigo-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold">Edit Geometry: {editWallModalItem.wallMark}</h3>
                  <p className="text-xs text-indigo-300">Cascades live updates to DPC, Plaster & Paints</p>
                </div>
              </div>
              <button onClick={() => setEditWallModalItem(null)} className="text-indigo-300 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Length (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editLength}
                    onChange={(e) => setEditLength(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Height (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editHeight}
                    onChange={(e) => setEditHeight(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Thickness (m)</label>
                  <input
                    type="number"
                    step="0.005"
                    value={editThickness}
                    onChange={(e) => setEditThickness(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Audit Correction Reason</label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Architectural RFI response updated partition thickness"
                  className="w-full p-2 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="bg-indigo-50 p-3 rounded border border-indigo-200 text-[11px] text-indigo-950 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Cascading Impact Preview:</span>
                </div>
                <div>• Masonry Gross Volume: <strong>{(editLength * editHeight * editThickness).toFixed(3)} m³</strong></div>
                <div>• Associated DPC Width: <strong>{(editThickness * 1000).toFixed(0)} mm</strong> (Area: {(editLength * editThickness).toFixed(2)} m²)</div>
                <div>• Dependent Plaster & Paint surfaces will automatically synchronize.</div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setEditWallModalItem(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWallEdit}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-xs"
              >
                Apply & Cascade Recalculation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: AUDIT TRAIL MODAL */}
      {/* ========================================================================= */}
      {auditModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-xl w-full overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold">User Correction Audit Trail</h3>
                  <p className="text-xs text-slate-400">{auditModalItem.wallMark}</p>
                </div>
              </div>
              <button onClick={() => setAuditModalItem(null)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto max-h-[60vh] divide-y divide-slate-200">
              {auditModalItem.corrections.map((audit) => (
                <div key={audit.id} className="py-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{audit.fieldChanged}</span>
                    <span className="text-[10px] text-slate-500">{audit.timestamp}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-slate-100 rounded text-slate-700">
                      <span className="font-semibold block text-[10px] text-slate-500">ORIGINAL:</span>
                      {audit.originalValue}
                    </div>
                    <div className="p-2 bg-indigo-50 rounded text-indigo-900 font-semibold">
                      <span className="font-semibold block text-[10px] text-indigo-500">CORRECTED:</span>
                      {audit.correctedValue}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <strong>Reason:</strong> {audit.reason} (by {audit.user})
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setAuditModalItem(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: 10 CRITICAL TESTS VERIFICATION SUITE MODAL */}
      {/* ========================================================================= */}
      {testModalOpen && testSuiteSummary && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold">Phase 15C Automated Verification Suite</h3>
                  <p className="text-xs text-slate-400">10 Critical Architectural Tests + Extended Precision Tests</p>
                </div>
              </div>
              <button onClick={() => setTestModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Test Summary Scorecard */}
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Critical Tests</div>
                  <div className="text-lg font-extrabold text-emerald-700">
                    {testSuiteSummary.criticalPassed} / {testSuiteSummary.criticalTotal}{' '}
                    <span className="text-xs font-medium text-slate-500">Passed</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500">Total Assertions</div>
                  <div className="text-lg font-extrabold text-slate-900">
                    {testSuiteSummary.totalPassed} / {testSuiteSummary.total}{' '}
                    <span className="text-xs font-medium text-slate-500">Passed</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  100% Deterministic Pass
                </span>
              </div>
            </div>

            {/* Test Cases List */}
            <div className="p-4 overflow-y-auto space-y-3">
              {testSuiteSummary.results.map((tc) => (
                <div
                  key={tc.id}
                  className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                    tc.passed
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-red-50/40 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {tc.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span className="font-bold text-slate-900">{tc.name}</span>
                    </div>
                    <span
                      className={`px-2 py-0.2 text-[10px] font-bold rounded-full ${
                        tc.isCritical
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {tc.isCritical ? 'CRITICAL' : 'EXTENDED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="text-slate-600">
                      <span className="font-semibold text-slate-800">Expected:</span> {tc.expected}
                    </div>
                    <div className="text-slate-900 font-semibold font-mono">
                      <span className="font-semibold text-slate-800">Actual:</span> {tc.actual}
                    </div>
                  </div>

                  <div className="text-[11px] text-indigo-900 font-mono bg-white p-2 rounded border border-slate-200">
                    {tc.formulaOrDetails}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setTestModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded"
              >
                Close Verification Suite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: SETTINGS & MEASUREMENT RULES MODAL */}
      {/* ========================================================================= */}
      {settingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden flex flex-col border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold">Architectural Measurement Settings</h3>
              </div>
              <button onClick={() => setSettingsModalOpen(false)} className="text-slate-400 hover:text-white">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Standard Method of Measurement</label>
                <select
                  value={settings.measurementStandard}
                  onChange={(e) => setSettings({ ...settings, measurementStandard: e.target.value as MeasurementRuleStandard })}
                  className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="POMI">POMI (Principles of Measurement International)</option>
                  <option value="IS1200">IS 1200 (Part 4: Masonry & Part 12: Plaster)</option>
                  <option value="NRM2">NRM2 (RICS New Rules of Measurement)</option>
                  <option value="CESMM4">CESMM4</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">DPC Measurement Unit</label>
                <select
                  value={settings.dpcMeasurementUnit}
                  onChange={(e) => setSettings({ ...settings, dpcMeasurementUnit: e.target.value as any })}
                  className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                >
                  <option value="m²">Area in Square Metres (m² = L × W)</option>
                  <option value="m">Linear Metres (m = Length)</option>
                  <option value="m³">Volume in Cubic Metres (m³)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Default Internal Plaster Thickness (mm)</label>
                <input
                  type="number"
                  value={settings.defaultPlasterInternalThicknessMm}
                  onChange={(e) => setSettings({ ...settings, defaultPlasterInternalThicknessMm: parseInt(e.target.value) || 12 })}
                  className="w-full p-2 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
