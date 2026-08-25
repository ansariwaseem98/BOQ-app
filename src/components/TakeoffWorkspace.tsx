import React, { useState, useEffect, useMemo } from 'react';
import {
  ProjectRecord,
  ProjectDocument,
  TakeoffItemRecord,
  TakeoffCategoryKey,
  ConstructionSequenceStage,
  ProjectEngineeringRules
} from '../types';
import {
  TakeoffStorageService
} from '../services/takeoffStorage';
import {
  TAKEOFF_CATEGORIES,
  CONSTRUCTION_SEQUENCE_STEPS,
  TakeoffCalculationEngine
} from '../engine/takeoffCalculationEngine';
import { FormulaEditModal } from './FormulaEditModal';
import { EngineeringRulesModal } from './EngineeringRulesModal';
import { BulkEditModal } from './BulkEditModal';
import { TakeoffTestSuiteModal } from './TakeoffTestSuiteModal';
import {
  Calculator,
  Layers,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Edit3,
  RotateCcw,
  Maximize2,
  Eye,
  ArrowUpRight,
  ArrowDown,
  Sparkles,
  ShieldCheck,
  Building,
  Hammer,
  FileText,
  Clock,
  ChevronDown,
  ChevronUp,
  Download,
  Plus,
  Play,
  CheckSquare,
  Square,
  ZoomIn,
  ZoomOut,
  Crosshair
} from 'lucide-react';

interface TakeoffWorkspaceProps {
  project: ProjectRecord;
  documents: ProjectDocument[];
  onOpenDrawingViewer?: (docId: string, page?: number) => void;
  onNavigateToBoq?: () => void;
}

export const TakeoffWorkspace: React.FC<TakeoffWorkspaceProps> = ({
  project,
  documents,
  onOpenDrawingViewer,
  onNavigateToBoq
}) => {
  // 1. Engineering Rules & Takeoff Data
  const [rules, setRules] = useState<ProjectEngineeringRules>(() =>
    TakeoffStorageService.getEngineeringRules(project.id)
  );
  const [takeoffItems, setTakeoffItems] = useState<TakeoffItemRecord[]>(() =>
    TakeoffStorageService.bootstrapInitialTakeoff(project, documents)
  );

  // 2. Selection & Navigation state
  const [selectedItemId, setSelectedItemId] = useState<string>(() =>
    takeoffItems[0]?.id || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<TakeoffCategoryKey | 'ALL'>('ALL');
  const [selectedSequenceStage, setSelectedSequenceStage] = useState<ConstructionSequenceStage | 'ALL'>('ALL');
  const [activeLeftTab, setActiveLeftTab] = useState<'CATEGORIES' | 'SEQUENCE'>('CATEGORIES');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BLOCKED' | 'UNVERIFIED' | 'VERIFIED'>('ALL');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // 3. Modals state
  const [isFormulaEditOpen, setIsFormulaEditOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [isTestSuiteOpen, setIsTestSuiteOpen] = useState(false);
  const [isBottomRegisterExpanded, setIsBottomRegisterExpanded] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Quick Open Item resolution state in right panel
  const [quickResolveParam, setQuickResolveParam] = useState<string>('');
  const [quickResolveVal, setQuickResolveVal] = useState<string>('');
  const [quickResolveUnit, setQuickResolveUnit] = useState<string>('m');

  // Active selected Takeoff Item
  const activeItem = useMemo(() => {
    return takeoffItems.find(i => i.id === selectedItemId) || takeoffItems[0] || null;
  }, [takeoffItems, selectedItemId]);

  // Sync quick resolve fields when active item changes
  useEffect(() => {
    if (activeItem && activeItem.calculation.isBlockedByOpenItem) {
      const missing = activeItem.calculation.inputs.find(inp => inp.isMissing);
      if (missing) {
        setQuickResolveParam(missing.name);
        setQuickResolveUnit(missing.unit || 'm');
        setQuickResolveVal('');
      }
    }
  }, [activeItem]);

  // Filtered Takeoff Items list
  const filteredItems = useMemo(() => {
    return takeoffItems.filter(item => {
      // Category filter
      if (activeLeftTab === 'CATEGORIES' && selectedCategory !== 'ALL') {
        if (item.category !== selectedCategory) return false;
      }
      // Sequence filter
      if (activeLeftTab === 'SEQUENCE' && selectedSequenceStage !== 'ALL') {
        if (item.sequenceStage !== selectedSequenceStage) return false;
      }
      // Status filter
      if (statusFilter === 'BLOCKED' && item.status !== 'BLOCKED') return false;
      if (statusFilter === 'UNVERIFIED' && item.verificationStatus !== 'UNVERIFIED') return false;
      if (statusFilter === 'VERIFIED' && item.verificationStatus === 'UNVERIFIED') return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.id.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.elementType.toLowerCase().includes(q) ||
          item.drawingNumber.toLowerCase().includes(q) ||
          item.sourceLocation.toLowerCase().includes(q) ||
          (item.boqItemId && item.boqItemId.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [takeoffItems, activeLeftTab, selectedCategory, selectedSequenceStage, statusFilter, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    takeoffItems.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [takeoffItems]);

  // Sequence stage counts
  const sequenceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    takeoffItems.forEach(item => {
      counts[item.sequenceStage] = (counts[item.sequenceStage] || 0) + 1;
    });
    return counts;
  }, [takeoffItems]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = takeoffItems.length;
    const verified = takeoffItems.filter(i => i.verificationStatus === 'USER_VERIFIED' || i.verificationStatus === 'USER_CORRECTED').length;
    const blocked = takeoffItems.filter(i => i.status === 'BLOCKED').length;
    const unverified = takeoffItems.filter(i => i.verificationStatus === 'UNVERIFIED' && i.status !== 'BLOCKED').length;
    return { total, verified, blocked, unverified };
  }, [takeoffItems]);

  // Handlers
  const handleSaveItem = (updatedItem: TakeoffItemRecord, reason: string) => {
    const saved = TakeoffStorageService.saveTakeoffItem(project.id, updatedItem, 'INPUT_MODIFIED', reason);
    const updatedList = takeoffItems.map(i => (i.id === saved.id ? saved : i));
    setTakeoffItems(updatedList);
    setIsFormulaEditOpen(false);
  };

  const handleVerifyActiveItem = () => {
    if (!activeItem || activeItem.status === 'BLOCKED') return;
    const updatedItem: TakeoffItemRecord = {
      ...activeItem,
      verificationStatus: 'USER_VERIFIED',
      status: 'USER_VERIFIED'
    };
    const saved = TakeoffStorageService.saveTakeoffItem(
      project.id,
      updatedItem,
      'VERIFIED',
      'Verified and approved by Lead Quantity Surveyor for final BOQ inclusion'
    );
    const updatedList = takeoffItems.map(i => (i.id === saved.id ? saved : i));
    setTakeoffItems(updatedList);
  };

  const handleQuickResolveOpenItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !quickResolveParam || !quickResolveVal) return;
    const num = parseFloat(quickResolveVal);
    if (isNaN(num)) return;

    const saved = TakeoffStorageService.resolveOpenItem(
      project.id,
      activeItem.id,
      quickResolveParam,
      num,
      quickResolveUnit,
      'Confirmed by engineer in Quick Open Item Inspector'
    );
    if (saved) {
      const updatedList = takeoffItems.map(i => (i.id === saved.id ? saved : i));
      setTakeoffItems(updatedList);
    }
  };

  const handleSaveRules = (updatedRules: ProjectEngineeringRules) => {
    TakeoffStorageService.saveEngineeringRules(updatedRules);
    setRules(updatedRules);
    const recomputed = TakeoffStorageService.recalculateAll(project.id);
    setTakeoffItems(recomputed);
    setIsRulesModalOpen(false);
  };

  const handleApplyBulkEdit = (changes: any, reason: string) => {
    const updated = TakeoffStorageService.massEditTakeoffItems(project.id, selectedItemIds, changes, reason);
    const updatedMap = new Map(updated.map(i => [i.id, i]));
    const merged = takeoffItems.map(i => updatedMap.get(i.id) || i);
    setTakeoffItems(merged);
    setSelectedItemIds([]);
    setIsBulkEditOpen(false);
  };

  const handleRecalculateAll = () => {
    const recomputed = TakeoffStorageService.recalculateAll(project.id);
    setTakeoffItems(recomputed);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItemIds(filteredItems.map(i => i.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExportRegisterCsv = () => {
    const headers = [
      'Takeoff ID',
      'BOQ Code',
      'Description',
      'Category',
      'Sequence Stage',
      'Element Type',
      'Drawing Number',
      'Formula Expression',
      'Net Measured Qty',
      'Unit',
      'Wastage %',
      'Tender Qty',
      'Status',
      'Verification'
    ];
    const rows = takeoffItems.map(item => [
      item.id,
      item.boqItemId || '',
      `"${item.description.replace(/"/g, '""')}"`,
      item.category,
      item.sequenceStage,
      item.elementType,
      item.drawingNumber,
      `"${item.calculation.evaluatedExpression.replace(/"/g, '""')}"`,
      item.measuredQuantity,
      item.unit,
      item.wastagePercent,
      item.tenderQuantity,
      item.status,
      item.verificationStatus
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Takeoff_Register_${project.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950/80 border border-indigo-700/50 rounded-lg text-indigo-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Engineering Quantity Takeoff & Calculation Engine
              </h1>
              <span className="text-[11px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/40">
                Phase 4
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Deterministic Mathematical Engine • Strict AI-Calculation Separation • Ground to Roof Sequence
            </p>
          </div>
        </div>

        {/* Top Actions & Quick Stats */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* Quick Metrics Pills */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">Items: <strong className="text-slate-200">{metrics.total}</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">Verified: {metrics.verified}</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400">Draft: {metrics.unverified}</span>
            {metrics.blocked > 0 && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  Blocked: {metrics.blocked}
                </span>
              </>
            )}
          </div>

          <button
            onClick={() => setIsTestSuiteOpen(true)}
            className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
            <span>TEST SUITE (20)</span>
          </button>

          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-indigo-400" />
            <span>RULES & STANDARDS</span>
          </button>

          <button
            onClick={handleRecalculateAll}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>RECALCULATE ALL</span>
          </button>

          {selectedItemIds.length > 0 && (
            <button
              onClick={() => setIsBulkEditOpen(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg animate-pulse"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>MASS EDIT ({selectedItemIds.length})</span>
            </button>
          )}

          <button
            onClick={handleExportRegisterCsv}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export CSV Takeoff Register"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">EXPORT</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Studio Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* ZONE 1: LEFT PANEL - CATEGORIES (A-R) & SEQUENCE (1-25)   */}
        {/* ========================================================= */}
        <div className="w-80 border-r border-slate-800 bg-slate-900/60 flex flex-col shrink-0">
          {/* Tabs: Categories vs Construction Sequence */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/80">
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveLeftTab('CATEGORIES')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeLeftTab === 'CATEGORIES'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Categories (A–R)</span>
              </button>
              <button
                onClick={() => setActiveLeftTab('SEQUENCE')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeLeftTab === 'SEQUENCE'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Sequence (1–25)</span>
              </button>
            </div>

            {/* Search & Status Filter */}
            <div className="mt-2 space-y-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter elements, codes, drawings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    statusFilter === 'ALL' ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-800' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('BLOCKED')}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    statusFilter === 'BLOCKED' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Blocked ({metrics.blocked})
                </button>
                <button
                  onClick={() => setStatusFilter('UNVERIFIED')}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    statusFilter === 'UNVERIFIED' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Draft ({metrics.unverified})
                </button>
                <button
                  onClick={() => setStatusFilter('VERIFIED')}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    statusFilter === 'VERIFIED' ? 'bg-emerald-950 text-emerald-300 font-bold border border-emerald-800' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Verified ({metrics.verified})
                </button>
              </div>
            </div>
          </div>

          {/* List: 18 Categories A-R OR 25 Sequence Steps */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {activeLeftTab === 'CATEGORIES' ? (
              <>
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`w-full px-3 py-2 text-xs font-bold rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${
                    selectedCategory === 'ALL'
                      ? 'bg-indigo-950/80 border border-indigo-700/50 text-indigo-200'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span>All Categories ({takeoffItems.length})</span>
                  <span className="text-[10px] font-mono text-slate-500">SHOW ALL</span>
                </button>

                {TAKEOFF_CATEGORIES.map(cat => {
                  const count = categoryCounts[cat.key] || 0;
                  const isSelected = selectedCategory === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`w-full px-3 py-2 text-xs rounded-lg text-left transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-950/90 border-indigo-700 text-indigo-100 shadow-sm'
                          : count > 0
                          ? 'bg-slate-900/40 border-slate-800/80 text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
                          : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs font-mono font-bold text-indigo-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                            {cat.code}
                          </span>
                          <span className="font-semibold truncate">{cat.label}</span>
                        </div>
                        <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                          count > 0 ? 'bg-slate-800 text-slate-200 font-bold' : 'text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </>
            ) : (
              <>
                <div className="p-2 mb-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Vertical Flow: Ground to Roof</span>
                  <button
                    onClick={() => setSelectedSequenceStage('ALL')}
                    className="text-indigo-400 hover:underline text-[10px] font-bold"
                  >
                    View All
                  </button>
                </div>

                {CONSTRUCTION_SEQUENCE_STEPS.map(step => {
                  const count = sequenceCounts[step.stage] || 0;
                  const isSelected = selectedSequenceStage === step.stage;
                  return (
                    <button
                      key={step.stage}
                      onClick={() => setSelectedSequenceStage(step.stage)}
                      className={`w-full px-3 py-2 text-xs rounded-lg text-left transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-indigo-950/90 border-indigo-700 text-indigo-100 shadow-sm'
                          : count > 0
                          ? 'bg-slate-900/40 border-slate-800/80 text-slate-200 hover:bg-slate-800/60'
                          : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-900/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-1 py-0.5 rounded">
                            {step.order.toString().padStart(2, '0')}
                          </span>
                          <span className="font-semibold truncate">{step.name}</span>
                        </div>
                        <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                          count > 0 ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-800' : 'text-slate-600'
                        }`}>
                          {count}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 truncate pl-6">
                        {step.elevationDescription}
                      </p>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* ZONE 2: CENTER PANEL - DRAWING / SPATIAL MODEL VIEWER     */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
          {/* Viewer Toolbar */}
          <div className="h-10 border-b border-slate-800 bg-slate-900/50 px-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Sheet:</span>
              <span className="font-mono font-bold text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {activeItem?.drawingNumber || documents[0]?.drawingNumber || 'S-201'} ({activeItem?.revisionId || 'Rev 01'})
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 truncate max-w-xs">
                Location: <strong className="text-indigo-300">{activeItem?.sourceLocation || 'Plot Axis Grid'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono text-slate-400 w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(250, prev + 10))}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>

              {onOpenDrawingViewer && (
                <button
                  onClick={() => onOpenDrawingViewer(activeItem?.drawingId || documents[0]?.id, activeItem?.page || 1)}
                  className="ml-2 px-2.5 py-1 bg-indigo-950 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-[11px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>VIEW FULL DRAWING</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Architectural / Structural Vector Canvas */}
          <div className="flex-1 relative overflow-auto p-6 flex items-center justify-center bg-slate-950">
            <div
              className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl transition-transform duration-200"
              style={{
                width: `${Math.round(760 * (zoomLevel / 100))}px`,
                height: `${Math.round(480 * (zoomLevel / 100))}px`
              }}
            >
              {/* CAD Grid Lines */}
              <div className="absolute inset-0 pointer-events-none opacity-30">
                {/* Vertical Axes 1, 2, 3, 4 */}
                <div className="absolute left-[15%] top-0 bottom-0 border-r border-dashed border-indigo-400" />
                <div className="absolute left-[40%] top-0 bottom-0 border-r border-dashed border-indigo-400" />
                <div className="absolute left-[65%] top-0 bottom-0 border-r border-dashed border-indigo-400" />
                <div className="absolute left-[90%] top-0 bottom-0 border-r border-dashed border-indigo-400" />

                {/* Horizontal Axes A, B, C */}
                <div className="absolute top-[20%] left-0 right-0 border-b border-dashed border-indigo-400" />
                <div className="absolute top-[50%] left-0 right-0 border-b border-dashed border-indigo-400" />
                <div className="absolute top-[80%] left-0 right-0 border-b border-dashed border-indigo-400" />
              </div>

              {/* Grid Axis Callout Bubbles */}
              <div className="absolute top-2 left-[15%] -translate-x-1/2 bg-indigo-950 border border-indigo-600 text-indigo-300 text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center">
                1
              </div>
              <div className="absolute top-2 left-[40%] -translate-x-1/2 bg-indigo-950 border border-indigo-600 text-indigo-300 text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center">
                2
              </div>
              <div className="absolute top-2 left-[65%] -translate-x-1/2 bg-indigo-950 border border-indigo-600 text-indigo-300 text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center">
                3
              </div>
              <div className="absolute top-2 left-[90%] -translate-x-1/2 bg-indigo-950 border border-indigo-600 text-indigo-300 text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center">
                4
              </div>

              <div className="absolute top-[20%] left-2 -translate-y-1/2 bg-indigo-950 border border-indigo-600 text-indigo-300 text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center">
                A
              </div>
              <div className="absolute top-[50%] left-2 -translate-y-1/2 bg-indigo-950 border border-indigo-600 text-indigo-300 text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center">
                B
              </div>
              <div className="absolute top-[80%] left-2 -translate-y-1/2 bg-indigo-950 border border-indigo-600 text-indigo-300 text-[10px] font-mono font-bold w-5 h-5 rounded-full flex items-center justify-center">
                C
              </div>

              {/* Spatial Element Bounding Box for Active Takeoff Item */}
              {activeItem?.boundingBox ? (
                <div
                  className="absolute rounded border-2 transition-all duration-300 animate-pulse flex flex-col justify-between p-2 shadow-2xl"
                  style={{
                    left: `${activeItem.boundingBox.x}%`,
                    top: `${activeItem.boundingBox.y}%`,
                    width: `${activeItem.boundingBox.width}%`,
                    height: `${activeItem.boundingBox.height}%`,
                    borderColor: activeItem.boundingBox.color || '#3b82f6',
                    backgroundColor: `${activeItem.boundingBox.color || '#3b82f6'}22`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-white shadow-md"
                      style={{ backgroundColor: activeItem.boundingBox.color || '#3b82f6' }}
                    >
                      {activeItem.id} • {activeItem.elementType}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-100 bg-slate-950/80 px-1.5 py-0.5 rounded">
                      {activeItem.measuredQuantity} {activeItem.unit}
                    </span>
                  </div>

                  <div className="text-[9px] text-slate-300 bg-slate-950/90 p-1 rounded font-mono truncate">
                    {activeItem.calculation.evaluatedExpression}
                  </div>
                </div>
              ) : (
                <div className="absolute inset-20 border-2 border-dashed border-indigo-500/40 rounded-lg flex items-center justify-center text-xs text-indigo-400">
                  <span>Selected Element: {activeItem?.description || 'No item selected'}</span>
                </div>
              )}

              {/* Drawing Title Block Stamp */}
              <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-slate-700 p-2.5 rounded-lg text-[10px] font-mono space-y-0.5 text-right pointer-events-none">
                <div className="font-bold text-slate-200">{project.project.name}</div>
                <div className="text-slate-400">Sheet: {activeItem?.drawingNumber || 'S-201'} | Rev: {activeItem?.revisionId || '01'}</div>
                <div className="text-indigo-400 font-bold">SCALE: 1:100 @ A1 (VERIFIED CAD)</div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ZONE 3: RIGHT PANEL - SELECTED ITEM CALCULATION BREAKDOWN */}
        {/* ========================================================= */}
        <div className="w-96 border-l border-slate-800 bg-slate-900/70 flex flex-col shrink-0 overflow-y-auto">
          {activeItem ? (
            <div className="p-4 space-y-5">
              {/* Item Header Banner */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                      {activeItem.id}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {activeItem.boqItemId || 'Unmapped BOQ'}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded border ${
                      activeItem.status === 'BLOCKED'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : activeItem.verificationStatus === 'USER_VERIFIED'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : activeItem.verificationStatus === 'USER_CORRECTED'
                        ? 'bg-purple-950 text-purple-300 border-purple-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}
                  >
                    {activeItem.verificationStatus}
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-100 leading-snug">
                  {activeItem.description}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Sheet: <strong className="text-slate-200">{activeItem.drawingNumber}</strong></span>
                  <span>Confidence: <strong className="text-indigo-400">{Math.round(activeItem.confidence * 100)}%</strong></span>
                </div>
              </div>

              {/* BLOCKED Alert / Open Item Required Banner */}
              {activeItem.status === 'BLOCKED' && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-700/80 rounded-xl text-rose-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>OPEN ITEM REQUIRED (CALCULATION BLOCKED)</span>
                  </div>
                  <p className="text-[11px] text-rose-300">
                    {activeItem.blockedReason || 'Missing mandatory dimensional parameter. Final BOQ quantity cannot be calculated without confirmation.'}
                  </p>

                  {/* Quick Resolve Input Form */}
                  <form onSubmit={handleQuickResolveOpenItem} className="pt-2 border-t border-rose-800/60 space-y-2">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                      Confirm Parameter: {quickResolveParam || 'Dimension'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        placeholder="Enter value..."
                        value={quickResolveVal}
                        onChange={(e) => setQuickResolveVal(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                        required
                      />
                      <span className="px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-400">
                        {quickResolveUnit}
                      </span>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                      >
                        RESOLVE
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* DETERMINISTIC FORMULA BREAKDOWN (MANDATORY MANDATE) */}
              <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Calculator className="w-4 h-4 text-indigo-400" />
                    <span>DETERMINISTIC FORMULA</span>
                  </div>
                  <button
                    onClick={() => setIsFormulaEditOpen(true)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>EDIT CALCULATION</span>
                  </button>
                </div>

                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 font-mono space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500 font-sans">Formula: </span>
                    <span className="text-indigo-300 font-bold">{activeItem.calculation.formula}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-sans">Inputs: </span>
                    <span className="text-amber-300 font-bold">{activeItem.calculation.evaluatedExpression}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400 font-sans">Net Measured Qty:</span>
                    <span className="text-base font-black text-emerald-400">
                      {activeItem.measuredQuantity} {activeItem.unit}
                    </span>
                  </div>
                  {activeItem.wastageQuantity > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Tender Qty (+{activeItem.wastagePercent}% waste):</span>
                      <span className="text-indigo-300 font-bold">
                        {activeItem.tenderQuantity} {activeItem.unit}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dimensional Inputs Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Engineering Input Parameters
                </h4>
                <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold text-[10px] uppercase">
                        <th className="p-2">Input</th>
                        <th className="p-2">Value</th>
                        <th className="p-2">Unit</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                      {activeItem.calculation.inputs.map(inp => (
                        <tr key={inp.id || inp.name} className={inp.isMissing ? 'bg-rose-950/20' : ''}>
                          <td className="p-2 font-sans font-medium text-slate-200">
                            {inp.label || inp.name}
                          </td>
                          <td className={`p-2 font-bold ${inp.isMissing ? 'text-rose-400' : 'text-slate-100'}`}>
                            {inp.value !== null && inp.value !== undefined ? inp.value : 'MISSING'}
                          </td>
                          <td className="p-2 text-slate-500">{inp.unit}</td>
                          <td className="p-2 text-[10px] font-sans">
                            {inp.isMissing ? (
                              <span className="text-rose-400 font-bold">Open Item</span>
                            ) : inp.isUserOverridden ? (
                              <span className="text-purple-400 font-bold">Corrected</span>
                            ) : (
                              <span className="text-emerald-400">Extracted</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deductions Breakdown */}
              {activeItem.calculation.deductions && activeItem.calculation.deductions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>Opening Deductions</span>
                    <span className="text-purple-400 font-mono">
                      −{activeItem.calculation.totalDeductions} {activeItem.unit}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-2 text-xs">
                    {activeItem.calculation.deductions.map(ded => (
                      <div key={ded.id} className="p-2 bg-slate-900 rounded border border-slate-800">
                        <div className="flex items-center justify-between font-bold text-slate-200">
                          <span>{ded.openingElementName}</span>
                          <span className="text-rose-400 font-mono">
                            −{ded.deductionVolumeM3 !== undefined && activeItem.unit === 'm³' ? ded.deductionVolumeM3.toFixed(3) : ded.deductionAreaM2.toFixed(2)} {activeItem.unit}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {ded.widthM}m × {ded.heightOrLengthM}m × {ded.count} Nr
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {activeItem.verificationStatus !== 'USER_VERIFIED' && activeItem.status !== 'BLOCKED' && (
                  <button
                    onClick={handleVerifyActiveItem}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>VERIFY QUANTITY FOR BOQ</span>
                  </button>
                )}

                <button
                  onClick={() => setIsFormulaEditOpen(true)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>EDIT INPUT PARAMETERS</span>
                </button>
              </div>

              {/* Audit Trail History */}
              {activeItem.calculation.auditTrail && activeItem.calculation.auditTrail.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Calculation Audit Trail ({activeItem.calculation.auditTrail.length})</span>
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {activeItem.calculation.auditTrail.map(aud => (
                      <div key={aud.id} className="p-2 bg-slate-950 rounded border border-slate-800 text-[11px] space-y-0.5">
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-bold text-slate-300">{aud.action}</span>
                          <span className="font-mono text-[10px]">{new Date(aud.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-400">{aud.reason}</p>
                        <p className="text-[10px] font-mono text-indigo-400">
                          Val: {aud.previousValue !== null ? `${aud.previousValue} → ` : ''}{aud.newValue}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              Select an item from the register below to view calculation steps.
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ZONE 4: BOTTOM PANEL - TAKEOFF REGISTER DATA GRID         */}
      {/* ========================================================= */}
      <div className={`border-t border-slate-800 bg-slate-950 flex flex-col transition-all duration-200 shrink-0 ${
        isBottomRegisterExpanded ? 'h-64' : 'h-10'
      }`}>
        {/* Register Header Bar */}
        <div className="h-10 px-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span className="font-bold uppercase tracking-wider text-slate-200">
                Takeoff Register ({filteredItems.length} items)
              </span>
            </div>
            {selectedItemIds.length > 0 && (
              <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                {selectedItemIds.length} selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBottomRegisterExpanded(!isBottomRegisterExpanded)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title={isBottomRegisterExpanded ? 'Collapse Register' : 'Expand Register'}
            >
              {isBottomRegisterExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Register Table */}
        {isBottomRegisterExpanded && (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.length > 0 && selectedItemIds.length === filteredItems.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-slate-700 cursor-pointer"
                    />
                  </th>
                  <th className="p-2.5">Takeoff ID</th>
                  <th className="p-2.5">BOQ Code</th>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Element</th>
                  <th className="p-2.5">Drawing</th>
                  <th className="p-2.5">Formula Expression</th>
                  <th className="p-2.5 text-right">Net Qty</th>
                  <th className="p-2.5">Unit</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Verification</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {filteredItems.map(item => {
                  const isSelected = selectedItemId === item.id;
                  const isChecked = selectedItemIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-950/60 text-slate-100 font-medium'
                          : 'hover:bg-slate-900/70 text-slate-300'
                      }`}
                    >
                      <td className="p-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectItem(item.id)}
                          className="rounded border-slate-700 cursor-pointer"
                        />
                      </td>
                      <td className="p-2.5 font-bold text-indigo-400">
                        {item.id}
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {item.boqItemId || '—'}
                      </td>
                      <td className="p-2.5 font-sans font-medium text-slate-200 max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="p-2.5 font-sans text-slate-400">
                        {item.category.split('_')[0]}
                      </td>
                      <td className="p-2.5 font-sans text-slate-300">
                        {item.elementType}
                      </td>
                      <td className="p-2.5 text-slate-400">
                        {item.drawingNumber}
                      </td>
                      <td className="p-2.5 text-amber-300/90 max-w-sm truncate">
                        {item.calculation.evaluatedExpression}
                      </td>
                      <td className="p-2.5 text-right font-black text-emerald-400">
                        {item.measuredQuantity}
                      </td>
                      <td className="p-2.5 text-slate-400 font-sans">
                        {item.unit}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans uppercase ${
                            item.status === 'BLOCKED'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-slate-900 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-2.5 font-sans">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.verificationStatus === 'USER_VERIFIED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : item.verificationStatus === 'USER_CORRECTED'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {item.verificationStatus}
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedItemId(item.id);
                            setIsFormulaEditOpen(true);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isFormulaEditOpen && activeItem && (
        <FormulaEditModal
          isOpen={isFormulaEditOpen}
          item={activeItem}
          rules={rules}
          onClose={() => setIsFormulaEditOpen(false)}
          onSave={handleSaveItem}
        />
      )}

      {isRulesModalOpen && (
        <EngineeringRulesModal
          isOpen={isRulesModalOpen}
          rules={rules}
          onClose={() => setIsRulesModalOpen(false)}
          onSave={handleSaveRules}
        />
      )}

      {isBulkEditOpen && (
        <BulkEditModal
          isOpen={isBulkEditOpen}
          selectedItems={takeoffItems.filter(i => selectedItemIds.includes(i.id))}
          onClose={() => setIsBulkEditOpen(false)}
          onApply={handleApplyBulkEdit}
        />
      )}

      {isTestSuiteOpen && (
        <TakeoffTestSuiteModal
          isOpen={isTestSuiteOpen}
          onClose={() => setIsTestSuiteOpen(false)}
        />
      )}
    </div>
  );
};
