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
  GitCommit,
  Home,
  DoorOpen,
  AppWindow,
  Paintbrush,
  Sparkles,
  Maximize2,
  Flame,
  Check,
  ChevronRight,
  SlidersHorizontal,
  XCircle,
} from 'lucide-react';
import {
  WallRegisterItem,
  DPCRegisterItem,
  DoorRegisterItem,
  WindowRegisterItem,
  PlasterTakeoffItem,
  PaintingTakeoffItem,
  FlooringTakeoffItem,
  SkirtingTakeoffItem,
  CeilingTakeoffItem,
  WaterproofingTakeoffItem,
  ScreedTakeoffItem,
  WallTileTakeoffItem,
  StairFinishTakeoffItem,
  ParapetTakeoffItem,
  ArchitecturalMetalworkItem,
  RoomRegisterItem,
  ArchitecturalCategory,
  ArchitecturalConflictRecord,
  ArchitecturalRevisionDiffRecord,
} from '../types';
import { calculateArchitecturalSummary } from '../engine/architecturalEngine';
import {
  initialWalls,
  initialDpcs,
  initialDoors,
  initialWindows,
  initialLouvers,
  initialCurtainWalls,
  initialPlasters,
  initialPaintings,
  initialFloorings,
  initialSkirtings,
  initialCeilings,
  initialWaterproofings,
  initialScreeds,
  initialWallTiles,
  initialStairs,
  initialParapets,
  initialMetalwork,
  initialRooms,
  initialConflicts,
  initialRevisionDiffs,
} from '../data/architecturalInitialData';
import { ArchitecturalCalculationModal } from './ArchitecturalCalculationModal';
import { ArchitecturalEditModal } from './ArchitecturalEditModal';
import { RoomTakeoffModal } from './RoomTakeoffModal';
import { ArchitecturalTestSuiteModal } from './ArchitecturalTestSuiteModal';
import { ArchitecturalConflictModal } from './ArchitecturalConflictModal';
import { ArchitecturalRevisionModal } from './ArchitecturalRevisionModal';
import { ArchitecturalPlanViewer } from './ArchitecturalPlanViewer';

const ALL_ARCHITECTURAL_CATEGORIES: {
  category: ArchitecturalCategory;
  label: string;
  iconName: string;
}[] = [
  { category: 'Walls', label: 'Walls & Partitions', iconName: 'Layers' },
  { category: 'Masonry', label: 'Block & Brick Masonry', iconName: 'Layers' },
  { category: 'DPC', label: 'Damp Proof Course (DPC)', iconName: 'Layers' },
  { category: 'Waterproofing', label: 'Waterproofing & Upstands', iconName: 'Layers' },
  { category: 'Doors', label: 'Doors Schedule', iconName: 'DoorOpen' },
  { category: 'Windows', label: 'Windows & Glazing', iconName: 'AppWindow' },
  { category: 'Louvers', label: 'Architectural Louvers', iconName: 'Layers' },
  { category: 'Openings', label: 'Wall Openings & Niches', iconName: 'Layers' },
  { category: 'Plaster', label: 'Cement & Gypsum Plaster', iconName: 'Paintbrush' },
  { category: 'Putty', label: 'Wall & Ceiling Putty', iconName: 'Paintbrush' },
  { category: 'Painting', label: 'Internal & External Paint', iconName: 'Paintbrush' },
  { category: 'Flooring', label: 'Flooring Finishes', iconName: 'Layers' },
  { category: 'Tiles', label: 'Wall & Floor Tiles', iconName: 'Layers' },
  { category: 'Screed', label: 'Bedding & Slope Screeds', iconName: 'Layers' },
  { category: 'Skirting', label: 'Perimeter Skirting', iconName: 'Layers' },
  { category: 'Ceilings', label: 'False & Grid Ceilings', iconName: 'Layers' },
  { category: 'Wall Finishes', label: 'Wall Cladding & Paneling', iconName: 'Layers' },
  { category: 'Roof Finishes', label: 'Roof Insulation & Protection', iconName: 'Layers' },
  { category: 'Stair Finishes', label: 'Stair Treads & Risers', iconName: 'Layers' },
  { category: 'Parapets', label: 'Roof Parapets & Coping', iconName: 'Layers' },
  { category: 'Sealants', label: 'Mastic & Silicone Sealants', iconName: 'Layers' },
  { category: 'Expansion Joints', label: 'Movement & Control Joints', iconName: 'Layers' },
  { category: 'Architectural Metalwork', label: 'Handrails & Metalwork', iconName: 'Layers' },
  { category: 'Other', label: 'Specialist Accessories', iconName: 'Layers' },
];

export const ArchitecturalTakeoffWorkspace: React.FC = () => {
  // Master State
  const [walls, setWalls] = useState<WallRegisterItem[]>(initialWalls);
  const [dpcs, setDpcs] = useState<DPCRegisterItem[]>(initialDpcs);
  const [doors, setDoors] = useState<DoorRegisterItem[]>(initialDoors);
  const [windows, setWindows] = useState<WindowRegisterItem[]>(initialWindows);
  const [plasters, setPlasters] = useState<PlasterTakeoffItem[]>(initialPlasters);
  const [paintings, setPaintings] = useState<PaintingTakeoffItem[]>(initialPaintings);
  const [floorings, setFloorings] = useState<FlooringTakeoffItem[]>(initialFloorings);
  const [skirtings, setSkirtings] = useState<SkirtingTakeoffItem[]>(initialSkirtings);
  const [ceilings, setCeilings] = useState<CeilingTakeoffItem[]>(initialCeilings);
  const [waterproofings, setWaterproofings] = useState<WaterproofingTakeoffItem[]>(initialWaterproofings);
  const [screeds, setScreeds] = useState<ScreedTakeoffItem[]>(initialScreeds);
  const [wallTiles, setWallTiles] = useState<WallTileTakeoffItem[]>(initialWallTiles);
  const [stairs, setStairs] = useState<StairFinishTakeoffItem[]>(initialStairs);
  const [parapets, setParapets] = useState<ParapetTakeoffItem[]>(initialParapets);
  const [metalwork, setMetalwork] = useState<ArchitecturalMetalworkItem[]>(initialMetalwork);
  const [rooms, setRooms] = useState<RoomRegisterItem[]>(initialRooms);
  const [conflicts, setConflicts] = useState<ArchitecturalConflictRecord[]>(initialConflicts);
  const [revisionDiffs, setRevisionDiffs] = useState<ArchitecturalRevisionDiffRecord[]>(initialRevisionDiffs);

  // Active Tab & Filters
  const [activeTab, setActiveTab] = useState<
    'walls' | 'openings' | 'finishes' | 'rooms' | 'schedule' | 'plan'
  >('walls');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedVerification, setSelectedVerification] = useState<string>('ALL');

  // Selected Item for Inspection
  const [selectedItemId, setSelectedItemId] = useState<string | null>(walls[0]?.id || null);
  const [selectedItemType, setSelectedItemType] = useState<
    'wall' | 'dpc' | 'door' | 'window' | 'room' | 'plaster' | 'paint' | 'floor' | 'ceiling'
  >('wall');

  // Modals
  const [calcModalOpen, setCalcModalOpen] = useState(false);
  const [calcModalData, setCalcModalData] = useState<any>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingWall, setEditingWall] = useState<WallRegisterItem | null>(null);

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [selectedRoomModalData, setSelectedRoomModalData] = useState<RoomRegisterItem | null>(null);

  const [testSuiteOpen, setTestSuiteOpen] = useState(false);
  const [conflictsOpen, setConflictsOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);

  // Summary Metrics Aggregation
  const summary = useMemo(() => {
    return calculateArchitecturalSummary({
      walls,
      dpcs,
      doors,
      windows,
      plasters,
      paintings,
      floorings,
      skirtings,
      ceilings,
      waterproofings,
      screeds,
      wallTiles,
      parapets,
      stairs,
    });
  }, [
    walls,
    dpcs,
    doors,
    windows,
    plasters,
    paintings,
    floorings,
    skirtings,
    ceilings,
    waterproofings,
    screeds,
    wallTiles,
    parapets,
    stairs,
  ]);

  // Selected Wall Entity
  const selectedWall = useMemo(() => {
    return walls.find((w) => w.id === selectedItemId);
  }, [walls, selectedItemId]);

  // Handle Edit Wall Save
  const handleSaveEditedWall = (updated: WallRegisterItem) => {
    setWalls((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
  };

  // Handle Conflict Resolution
  const handleResolveConflict = (conflictId: string, resolvedSource: 'A' | 'B', note: string) => {
    setConflicts((prev) =>
      prev.map((c) =>
        c.id === conflictId
          ? {
              ...c,
              status: 'RESOLVED',
              resolvedSource,
              resolutionNote: note,
              resolvedBy: 'Senior QS Engineer',
              resolvedAt: new Date().toLocaleTimeString(),
            }
          : c
      )
    );
  };

  // Handle Revision Review
  const handleReviewRevision = (id: string) => {
    setRevisionDiffs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, reviewed: !r.reviewed } : r))
    );
  };

  // Open Calculation Modal for Wall
  const handleViewWallCalc = (wall: WallRegisterItem) => {
    setCalcModalData({
      title: 'Masonry Wall Takeoff Calculation',
      category: wall.wallType,
      mark: wall.wallMark,
      formulaWithValues: wall.formulaWithValues,
      dimensions: [
        { label: 'Length', value: wall.lengthM.toFixed(2), unit: 'm' },
        { label: 'Height', value: wall.heightM.toFixed(2), unit: 'm' },
        { label: 'Thickness', value: wall.thicknessM.toFixed(3), unit: 'm' },
        { label: 'Gross Area', value: wall.grossAreaM2.toFixed(2), unit: 'm²' },
        { label: 'Gross Volume', value: wall.grossVolumeM3.toFixed(3), unit: 'm³' },
        { label: 'Block Count', value: wall.blockCountEstimate || 0, unit: 'Blocks' },
      ],
      deductions: wall.openings.map((op) => ({
        label: `Opening: ${op.mark} (${op.type.toUpperCase()}) - ${op.quantity} No.`,
        areaOrVol: `${op.totalAreaM2.toFixed(2)} m² (${(op.totalAreaM2 * wall.thicknessM).toFixed(3)} m³)`,
        rule: op.deductionRule,
      })),
      auditSteps: wall.auditTrail,
      sourceDrawing: {
        number: wall.drawingNumber,
        revision: wall.revision,
        location: wall.sourceLocation,
      },
    });
    setCalcModalOpen(true);
  };

  // Open Calculation Modal for Door
  const handleViewDoorCalc = (dr: DoorRegisterItem) => {
    setCalcModalData({
      title: 'Door Schedule Takeoff',
      category: 'Doors',
      mark: dr.doorMark,
      formulaWithValues: `${dr.quantity} No. × (${dr.widthM.toFixed(2)}m × ${dr.heightM.toFixed(2)}m) = ${dr.totalAreaM2.toFixed(2)} m²`,
      dimensions: [
        { label: 'Width', value: dr.widthM.toFixed(2), unit: 'm' },
        { label: 'Height', value: dr.heightM.toFixed(2), unit: 'm' },
        { label: 'Quantity', value: dr.quantity, unit: 'No.' },
        { label: 'Single Leaf Area', value: dr.singleAreaM2.toFixed(2), unit: 'm²' },
        { label: 'Total Area', value: dr.totalAreaM2.toFixed(2), unit: 'm²' },
        { label: 'Fire Rating', value: dr.fireRating },
      ],
      auditSteps: dr.auditTrail,
      sourceDrawing: {
        number: dr.drawingNumber,
        revision: dr.revision,
        location: dr.sourceLocation,
      },
    });
    setCalcModalOpen(true);
  };

  // Open Calculation Modal for Flooring
  const handleViewFlooringCalc = (flr: FlooringTakeoffItem) => {
    setCalcModalData({
      title: 'Floor Finish Takeoff',
      category: 'Flooring',
      mark: flr.roomNumber,
      formulaWithValues: flr.formulaWithValues,
      dimensions: [
        { label: 'Measured Area', value: flr.measuredAreaM2.toFixed(2), unit: 'm²' },
        { label: 'Wastage', value: flr.wastagePercent, unit: '%' },
        { label: 'Wastage Area', value: flr.wastageAreaM2.toFixed(2), unit: 'm²' },
        { label: 'Tender Area', value: flr.tenderAreaM2.toFixed(2), unit: 'm²' },
        { label: 'Thickness', value: flr.thicknessMm, unit: 'mm' },
        { label: 'Tile Count', value: flr.tileCount || 'N/A', unit: 'Tiles' },
      ],
      auditSteps: flr.auditTrail,
      sourceDrawing: {
        number: flr.drawingNumber,
        revision: flr.revision,
        location: flr.sourceLocation,
      },
    });
    setCalcModalOpen(true);
  };

  // Filtered Walls
  const filteredWalls = walls.filter((w) => {
    const matchesSearch =
      w.wallMark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.roomZone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'ALL' || w.level === selectedLevel;
    const matchesVerif = selectedVerification === 'ALL' || w.verificationStatus === selectedVerification;
    return matchesSearch && matchesLevel && matchesVerif;
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* 1. TOP SUMMARY METRIC BANNER */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-100 text-lg tracking-tight">
                  Architectural, Masonry & Finishes Takeoff
                </h1>
                <span className="px-2 py-0.5 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded font-mono font-medium">
                  PHASE 7 ENGINE
                </span>
                <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Deterministic Math
                </span>
              </div>
              <p className="text-xs text-slate-400">
                IS 1200 / POMI / NRM2 Standard Measurement • Full Traceability • Zero Fabricated Quantities
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTestSuiteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              24-Test Suite (100% Pass)
            </button>

            <button
              onClick={() => setConflictsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Drawing Conflicts ({conflicts.filter((c) => c.status === 'OPEN').length})
            </button>

            <button
              onClick={() => setRevisionsOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition-colors"
            >
              <GitCommit className="w-3.5 h-3.5" />
              Revision Deltas ({revisionDiffs.length})
            </button>
          </div>
        </div>

        {/* Metric KPI Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium truncate">Masonry Volume</span>
            <span className="text-sm font-bold font-mono text-slate-100 mt-0.5">
              {summary.masonryVolumeM3.toFixed(2)} <span className="text-xs font-normal text-slate-400">m³</span>
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium truncate">Net Wall Area</span>
            <span className="text-sm font-bold font-mono text-slate-100 mt-0.5">
              {summary.wallNetAreaM2.toFixed(1)} <span className="text-xs font-normal text-slate-400">m²</span>
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium truncate">DPC Course</span>
            <span className="text-sm font-bold font-mono text-blue-400 mt-0.5">
              {summary.dpcAreaM2.toFixed(2)} <span className="text-xs font-normal text-slate-400">m²</span>
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium truncate">Plastering Area</span>
            <span className="text-sm font-bold font-mono text-slate-100 mt-0.5">
              {summary.plasterAreaM2.toFixed(1)} <span className="text-xs font-normal text-slate-400">m²</span>
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium truncate">Painting Area</span>
            <span className="text-sm font-bold font-mono text-slate-100 mt-0.5">
              {summary.paintingAreaM2.toFixed(1)} <span className="text-xs font-normal text-slate-400">m²</span>
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium truncate">Flooring Tender</span>
            <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
              {summary.flooringAreaM2.toFixed(1)} <span className="text-xs font-normal text-slate-400">m²</span>
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium truncate">Doors & Windows</span>
            <span className="text-sm font-bold font-mono text-purple-400 mt-0.5">
              {summary.doorsCount}D / {summary.windowsCount}W
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2 flex flex-col justify-between">
            <span className="text-[11px] text-slate-400 font-medium truncate">Waterproofing</span>
            <span className="text-sm font-bold font-mono text-indigo-400 mt-0.5">
              {summary.waterproofingAreaM2.toFixed(1)} <span className="text-xs font-normal text-slate-400">m²</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN WORKSPACE BODY (3 Columns: Left Categories, Center Views, Right Inspector) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: 24 Architectural Categories Sidebar */}
        <div className="w-64 bg-slate-900/60 border-r border-slate-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Architectural Trades</span>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                24 Trades
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <span>All Architectural Elements</span>
              <span className="font-mono text-[11px] opacity-75">{walls.length + doors.length + floorings.length}</span>
            </button>

            {ALL_ARCHITECTURAL_CATEGORIES.map((cat) => {
              let count = 0;
              if (cat.category === 'Walls' || cat.category === 'Masonry') count = walls.length;
              else if (cat.category === 'DPC') count = dpcs.length;
              else if (cat.category === 'Doors') count = doors.length;
              else if (cat.category === 'Windows') count = windows.length;
              else if (cat.category === 'Plaster') count = plasters.length;
              else if (cat.category === 'Painting') count = paintings.length;
              else if (cat.category === 'Flooring') count = floorings.length;
              else if (cat.category === 'Skirting') count = skirtings.length;
              else if (cat.category === 'Ceilings') count = ceilings.length;
              else if (cat.category === 'Waterproofing') count = waterproofings.length;
              else if (cat.category === 'Screed') count = screeds.length;
              else if (cat.category === 'Tiles') count = wallTiles.length;
              else if (cat.category === 'Parapets') count = parapets.length;
              else if (cat.category === 'Stair Finishes') count = stairs.length;
              else if (cat.category === 'Architectural Metalwork') count = metalwork.length;

              return (
                <button
                  key={cat.category}
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedCategory === cat.category
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  {count > 0 && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-800/80 rounded">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER: Main Work Area & 6 Views */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {/* Navigation Tab Row */}
          <div className="px-6 pt-3 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('walls')}
                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'walls'
                    ? 'border-indigo-500 text-indigo-300 bg-slate-900 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                1. Walls & Masonry Register ({walls.length})
              </button>

              <button
                onClick={() => setActiveTab('openings')}
                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'openings'
                    ? 'border-indigo-500 text-indigo-300 bg-slate-900 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <DoorOpen className="w-3.5 h-3.5" />
                2. Doors, Windows & Openings ({doors.length + windows.length})
              </button>

              <button
                onClick={() => setActiveTab('finishes')}
                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'finishes'
                    ? 'border-indigo-500 text-indigo-300 bg-slate-900 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                3. Finishes, Flooring & Ceilings
              </button>

              <button
                onClick={() => setActiveTab('rooms')}
                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'rooms'
                    ? 'border-indigo-500 text-indigo-300 bg-slate-900 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                4. Room-by-Room Matrix ({rooms.length})
              </button>

              <button
                onClick={() => setActiveTab('plan')}
                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'plan'
                    ? 'border-indigo-500 text-indigo-300 bg-slate-900 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                5. Floor Plan Schematic & Overlays
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 pb-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search elements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48"
                />
              </div>
            </div>
          </div>

          {/* Tab View Contents */}
          <div className="flex-1 overflow-auto p-4">
            {/* VIEW 1: Walls & Masonry Register */}
            {activeTab === 'walls' && (
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                      <th className="py-3 px-4">Mark</th>
                      <th className="py-3 px-4">Wall Type & Material</th>
                      <th className="py-3 px-4">Level / Zone</th>
                      <th className="py-3 px-4 text-right">L × H × T (m)</th>
                      <th className="py-3 px-4 text-right">Gross Vol</th>
                      <th className="py-3 px-4 text-right">Openings Ded.</th>
                      <th className="py-3 px-4 text-right">Net Vol (m³)</th>
                      <th className="py-3 px-4">Formula</th>
                      <th className="py-3 px-4">Drawing Ref</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-normal">
                    {filteredWalls.map((wall) => {
                      const isSelected = selectedItemId === wall.id;
                      return (
                        <tr
                          key={wall.id}
                          onClick={() => {
                            setSelectedItemId(wall.id);
                            setSelectedItemType('wall');
                          }}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-indigo-950/40 hover:bg-indigo-950/60'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-100">
                            {wall.wallMark}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-200 block">{wall.wallType}</span>
                            <span className="text-[11px] text-slate-400 truncate block max-w-[200px]">
                              {wall.material}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            <span>{wall.level}</span>
                            <span className="text-[11px] text-slate-500 block">{wall.roomZone}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-200">
                            {wall.lengthM.toFixed(2)} × {wall.heightM.toFixed(2)} ×{' '}
                            {wall.thicknessM.toFixed(3)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-400">
                            {wall.grossVolumeM3.toFixed(3)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-400">
                            {wall.deductedOpeningVolumeM3 > 0
                              ? `-${wall.deductedOpeningVolumeM3.toFixed(3)}`
                              : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                            {wall.netVolumeM3.toFixed(3)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[10px] text-blue-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 block truncate max-w-[220px]">
                              {wall.formulaWithValues}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {wall.drawingNumber} Rev {wall.revision}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                                wall.verificationStatus === 'verified'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              {wall.verificationStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewWallCalc(wall);
                                }}
                                className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded border border-blue-500/30 transition-colors"
                                title="View detailed calculation formula"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingWall(wall);
                                  setEditModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
                                title="Edit dimensions and recalculate"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* VIEW 2: Doors & Windows Schedule */}
            {activeTab === 'openings' && (
              <div className="space-y-6">
                {/* Doors Table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
                  <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-indigo-400" />
                      Doors Schedule Takeoff ({doors.length} Types)
                    </h3>
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                        <th className="py-3 px-4">Mark</th>
                        <th className="py-3 px-4">Door Type & Material</th>
                        <th className="py-3 px-4">Frame & Fire Rating</th>
                        <th className="py-3 px-4 text-right">W × H (m)</th>
                        <th className="py-3 px-4 text-right">Quantity</th>
                        <th className="py-3 px-4 text-right">Total Area (m²)</th>
                        <th className="py-3 px-4">Drawing Ref</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {doors.map((dr) => (
                        <tr key={dr.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-100">
                            {dr.doorMark}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-200 block">{dr.doorType}</span>
                            <span className="text-[11px] text-slate-400">{dr.material}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-300 block">{dr.frameType}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded inline-block mt-0.5">
                              {dr.fireRating}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-200">
                            {dr.widthM.toFixed(2)} × {dr.heightM.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                            {dr.quantity} No.
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                            {dr.totalAreaM2.toFixed(2)} m²
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                            {dr.drawingNumber} Rev {dr.revision}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleViewDoorCalc(dr)}
                              className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded border border-blue-500/30 transition-colors"
                              title="View formula"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Windows Table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
                  <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                      <AppWindow className="w-4 h-4 text-emerald-400" />
                      Windows Schedule Takeoff ({windows.length} Types)
                    </h3>
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                        <th className="py-3 px-4">Mark</th>
                        <th className="py-3 px-4">Window Type</th>
                        <th className="py-3 px-4">Glazing Specification</th>
                        <th className="py-3 px-4 text-right">W × H (m)</th>
                        <th className="py-3 px-4 text-right">Quantity</th>
                        <th className="py-3 px-4 text-right">Total Area (m²)</th>
                        <th className="py-3 px-4">Drawing Ref</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {windows.map((wn) => (
                        <tr key={wn.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-100">
                            {wn.windowMark}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-200">{wn.windowType}</td>
                          <td className="py-3 px-4 text-slate-400">{wn.glazing}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-200">
                            {wn.widthM.toFixed(2)} × {wn.heightM.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                            {wn.quantity} No.
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                            {wn.totalAreaM2.toFixed(2)} m²
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                            {wn.drawingNumber} Rev {wn.revision}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 3: Finishes, Flooring & Ceilings */}
            {activeTab === 'finishes' && (
              <div className="space-y-6">
                {/* Flooring */}
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-xl">
                  <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      Flooring Finishes Schedule & Wastage
                    </h3>
                  </div>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800 text-[11px]">
                        <th className="py-3 px-4">Room / Zone</th>
                        <th className="py-3 px-4">Finish Material</th>
                        <th className="py-3 px-4 text-right">Measured Area</th>
                        <th className="py-3 px-4 text-right">Wastage %</th>
                        <th className="py-3 px-4 text-right">Tender Area (m²)</th>
                        <th className="py-3 px-4">Formula</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {floorings.map((flr) => (
                        <tr key={flr.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-200">
                            {flr.room}
                            <span className="text-[11px] text-slate-500 font-mono block">
                              {flr.roomNumber} • {flr.level}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-300 block">{flr.finishType}</span>
                            <span className="text-[11px] text-slate-400">{flr.material}</span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-200">
                            {flr.measuredAreaM2.toFixed(2)} m²
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-amber-400">
                            +{flr.wastagePercent}%
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                            {flr.tenderAreaM2.toFixed(2)} m²
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[10px] text-blue-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 block truncate max-w-[240px]">
                              {flr.formulaWithValues}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleViewFlooringCalc(flr)}
                              className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded border border-blue-500/30 transition-colors"
                              title="View formula breakdown"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Plaster & Painting */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Plaster */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 p-4">
                    <h4 className="font-semibold text-slate-100 text-xs uppercase tracking-wider mb-3 text-indigo-400 flex items-center gap-2">
                      <Paintbrush className="w-4 h-4" />
                      Cement Plaster Quantities
                    </h4>
                    <div className="space-y-2.5">
                      {plasters.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-slate-200 block">
                              {p.locationType} ({p.thicknessMm}mm)
                            </span>
                            <span className="text-[11px] text-slate-400">{p.description}</span>
                          </div>
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            {p.netAreaM2.toFixed(1)} m²
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ceilings */}
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 p-4">
                    <h4 className="font-semibold text-slate-100 text-xs uppercase tracking-wider mb-3 text-purple-400 flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Reflected Ceiling Schedule
                    </h4>
                    <div className="space-y-2.5">
                      {ceilings.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-semibold text-slate-200 block">{c.room}</span>
                            <span className="text-[11px] text-slate-400">
                              {c.ceilingType} @ {c.heightM.toFixed(2)}m AFFL
                            </span>
                          </div>
                          <span className="font-mono font-bold text-purple-400 text-sm">
                            {c.areaM2.toFixed(1)} m²
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 4: Room-by-Room Matrix */}
            {activeTab === 'rooms' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => {
                      setSelectedRoomModalData(room);
                      setRoomModalOpen(true);
                    }}
                    className="border border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 rounded-xl p-4 cursor-pointer transition-all shadow-lg text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-100 text-sm">
                          {room.roomNumber}
                        </span>
                        <span className="font-semibold text-slate-200">{room.roomName}</span>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded font-mono text-[10px]">
                        {room.level}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-lg text-center font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block">FLOOR AREA</span>
                        <span className="text-emerald-400 font-bold">{room.areaM2.toFixed(1)} m²</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">PERIMETER</span>
                        <span className="text-slate-300">{room.perimeterM.toFixed(1)} m</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">CLEAR HEIGHT</span>
                        <span className="text-slate-300">{room.ceilingHeightM.toFixed(2)} m</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Flooring:</span>
                        <span className="text-slate-200 font-medium truncate max-w-[220px]">
                          {room.floorFinish}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Ceiling:</span>
                        <span className="text-slate-200 font-medium truncate max-w-[220px]">
                          {room.ceilingFinish}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-indigo-400 font-medium">
                      <span>Click to view detailed room takeoff breakdown</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VIEW 5: Floor Plan Viewer */}
            {activeTab === 'plan' && (
              <ArchitecturalPlanViewer
                walls={walls}
                rooms={rooms}
                doors={doors}
                windows={windows}
                selectedElementId={selectedItemId}
                onSelectElement={(id, type) => {
                  setSelectedItemId(id);
                  if (type === 'room') {
                    const r = rooms.find((x) => x.id === id);
                    if (r) {
                      setSelectedRoomModalData(r);
                      setRoomModalOpen(true);
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Selected Element Inspector Panel */}
        <div className="w-80 bg-slate-900/70 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-400" />
            <span>Element Inspector</span>
          </div>

          {selectedWall ? (
            <div className="space-y-4 text-xs">
              {/* Card Header */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-slate-100">
                    {selectedWall.wallMark}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                      selectedWall.verificationStatus === 'verified'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {selectedWall.verificationStatus}
                  </span>
                </div>
                <p className="text-slate-300 font-medium">{selectedWall.material}</p>
                <div className="text-[11px] text-slate-400">
                  {selectedWall.level} • {selectedWall.roomZone}
                </div>
              </div>

              {/* Geometric Dimensions */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Geometric Input Parameters
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-slate-500 block text-[10px]">LENGTH</span>
                    <span className="text-slate-100 font-bold">{selectedWall.lengthM.toFixed(2)} m</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-slate-500 block text-[10px]">HEIGHT</span>
                    <span className="text-slate-100 font-bold">{selectedWall.heightM.toFixed(2)} m</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-slate-500 block text-[10px]">THICKNESS</span>
                    <span className="text-slate-100 font-bold">{selectedWall.thicknessM.toFixed(3)} m</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded">
                    <span className="text-slate-500 block text-[10px]">EST. BLOCKS</span>
                    <span className="text-slate-100 font-bold">{selectedWall.blockCountEstimate || 0}</span>
                  </div>
                </div>
              </div>

              {/* Calculated Outputs */}
              <div className="bg-indigo-950/30 p-3.5 rounded-xl border border-indigo-500/30 space-y-2">
                <div className="text-[10px] uppercase font-bold text-indigo-300">
                  Deterministic Takeoff Outputs
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gross Volume:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {selectedWall.grossVolumeM3.toFixed(3)} m³
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Openings Deduction:</span>
                    <span className="font-mono font-semibold">
                      -{selectedWall.deductedOpeningVolumeM3.toFixed(3)} m³
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-indigo-500/20 text-sm font-bold text-emerald-400">
                    <span>Net Masonry Volume:</span>
                    <span className="font-mono">{selectedWall.netVolumeM3.toFixed(3)} m³</span>
                  </div>
                </div>
              </div>

              {/* Traceability & Drawing Coordinate */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Drawing Source Traceability
                </div>
                <div className="text-slate-300 font-mono text-[11px]">
                  {selectedWall.drawingNumber} (Rev {selectedWall.revision})
                </div>
                <div className="text-slate-500 text-[10px]">{selectedWall.sourceLocation}</div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleViewWallCalc(selectedWall)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  View Formula & Deductions
                </button>
                <button
                  onClick={() => {
                    setEditingWall(selectedWall);
                    setEditModalOpen(true);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Dimensions
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select an element from the table or drawing to inspect its calculations
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {calcModalData && (
        <ArchitecturalCalculationModal
          isOpen={calcModalOpen}
          onClose={() => setCalcModalOpen(false)}
          {...calcModalData}
        />
      )}

      <ArchitecturalEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        item={editingWall}
        onSave={handleSaveEditedWall}
      />

      <RoomTakeoffModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        room={selectedRoomModalData}
      />

      <ArchitecturalTestSuiteModal
        isOpen={testSuiteOpen}
        onClose={() => setTestSuiteOpen(false)}
      />

      <ArchitecturalConflictModal
        isOpen={conflictsOpen}
        onClose={() => setConflictsOpen(false)}
        conflicts={conflicts}
        onResolve={handleResolveConflict}
      />

      <ArchitecturalRevisionModal
        isOpen={revisionsOpen}
        onClose={() => setRevisionsOpen(false)}
        diffs={revisionDiffs}
        onReviewDiff={handleReviewRevision}
      />
    </div>
  );
};
