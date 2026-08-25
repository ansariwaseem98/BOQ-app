import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ProjectDocument,
  ProjectRecord,
  AnalysisRunLog,
  ExtractedElementItem,
  ExtractedDimension,
  ExtractedLevel,
  ExtractedGrid,
  ExtractedReinforcementItem,
  ExtractedSteelItem,
  ExtractedRoofItem,
  ExtractedMepItem,
  ExtractedCandidateRule,
  IntelligenceOpenItem,
  IntelligenceConflict,
  DrawingClassificationType,
  IntelligenceVerificationStatus,
  DrawingBoundingBox,
  Discipline
} from '../types';
import { DrawingIntelligenceEngine, AnalysisOptions } from '../engine/drawingIntelligenceEngine';
import { IntelligenceStorageService, DocumentAnalysisDataset } from '../services/intelligenceStorage';
import { AnalyzeOptionsModal } from './AnalyzeOptionsModal';
import { ElementEditModal } from './ElementEditModal';
import { OpenItemDetailModal } from './OpenItemDetailModal';
import { ConflictResolverModal } from './ConflictResolverModal';
import { ProjectAnalysisQueueModal } from './ProjectAnalysisQueueModal';
import {
  Cpu,
  Play,
  Layers,
  Search,
  Filter,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize,
  RotateCcw,
  Crop,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  Building2,
  Ruler,
  TrendingUp,
  FileText,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Edit3,
  MapPin,
  HelpCircle,
  Hash,
  Activity,
  Maximize2,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Compass,
  FileCheck2,
  Check,
  X
} from 'lucide-react';

interface DrawingAnalysisWorkspaceProps {
  project: ProjectRecord;
  documents: ProjectDocument[];
  initialDocumentId?: string;
  onClose?: () => void;
  onNavigateToDocumentManager?: () => void;
}

type TabType =
  | 'elements'
  | 'dimensions'
  | 'levels_grids'
  | 'reinforcement'
  | 'steel_mep'
  | 'rules'
  | 'open_items'
  | 'conflicts';

export const DrawingAnalysisWorkspace: React.FC<DrawingAnalysisWorkspaceProps> = ({
  project,
  documents,
  initialDocumentId,
  onClose,
  onNavigateToDocumentManager,
}) => {
  // Active selected document state
  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialDocumentId || (documents.length > 0 ? documents[0].id : '')
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [disciplineFilter, setDisciplineFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Active Tab in Right Inspector Panel
  const [activeTab, setActiveTab] = useState<TabType>('elements');

  // Loaded Dataset for Current Selected Document
  const [dataset, setDataset] = useState<DocumentAnalysisDataset>({
    runs: [],
    elements: [],
    dimensions: [],
    levels: [],
    grids: [],
    reinforcement: [],
    steel: [],
    roof: [],
    mep: [],
    candidateRules: [],
    openItems: [],
    conflicts: []
  });
  const [latestRun, setLatestRun] = useState<AnalysisRunLog | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ stage: string; percent: number } | null>(null);

  // Canvas Viewport Pan & Zoom State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Interactive Area Selection Mode
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectionBox, setSelectionBox] = useState<DrawingBoundingBox | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Layer Visibility Toggles
  const [layerVisibility, setLayerVisibility] = useState({
    elements: true,
    dimensions: true,
    levels: true,
    grids: true,
    reinforcement: true,
    steel: true,
    mep: true,
    rules: true,
    openItems: true
  });

  // Highlighted / Active item on canvas
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // Modals state
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState<boolean>(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState<boolean>(false);
  const [editingElement, setEditingElement] = useState<ExtractedElementItem | null>(null);
  const [resolvingOpenItem, setResolvingOpenItem] = useState<IntelligenceOpenItem | null>(null);
  const [resolvingConflict, setResolvingConflict] = useState<IntelligenceConflict | null>(null);

  // Current selected document object
  const currentDoc = useMemo(() => {
    return documents.find((d) => d.id === selectedDocId) || documents[0] || null;
  }, [documents, selectedDocId]);

  // Load Analysis data whenever selected document changes
  const loadAnalysisData = async (docId: string) => {
    if (!docId) return;
    setIsLoading(true);
    try {
      const data = await IntelligenceStorageService.getAnalysisDataForDocument(project.id, docId);
      setDataset(data);
      if (data.runs.length > 0) {
        setLatestRun(data.runs[data.runs.length - 1]);
      } else {
        setLatestRun(null);
      }
    } catch (err) {
      console.error('Failed to load drawing analysis data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDocId) {
      loadAnalysisData(selectedDocId);
      setCurrentPage(1);
      resetView();
    }
  }, [selectedDocId]);

  // Reset Pan & Zoom
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHighlightedId(null);
  };

  // Zoom to a target bounding box on the drawing canvas
  const zoomToBoundingBox = (bbox?: DrawingBoundingBox) => {
    if (!bbox) return;
    // Calculate center of box in percentage coordinates
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;

    // Apply zoom
    setZoom(1.8);
    // Pan so center is in view
    setPan({
      x: (50 - centerX) * 8,
      y: (50 - centerY) * 8
    });
  };

  // Run Analysis Engine
  const handleStartAnalysis = async (options: AnalysisOptions) => {
    if (!currentDoc) return;
    setAnalysisProgress({ stage: 'Starting analysis...', percent: 5 });

    try {
      const { log, dataset: newDataset } = await DrawingIntelligenceEngine.analyzeDocument(
        project,
        currentDoc,
        options,
        (stage, percent) => {
          setAnalysisProgress({ stage, percent });
        }
      );

      setLatestRun(log);
      setDataset(newDataset);
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Drawing analysis encountered an error. Please try again.');
    } finally {
      setAnalysisProgress(null);
      setIsSelectionMode(false);
      setSelectionBox(null);
    }
  };

  // Handle User Element Correction Save
  const handleSaveElementCorrection = async (
    elementId: string,
    updatedValues: Parameters<typeof IntelligenceStorageService.updateUserCorrectionForElement>[1]
  ) => {
    const updated = await IntelligenceStorageService.updateUserCorrectionForElement(
      elementId,
      updatedValues
    );
    if (updated) {
      setDataset((prev) => ({
        ...prev,
        elements: prev.elements.map((e) => (e.id === elementId ? updated : e))
      }));
    }
  };

  // Handle Open Item Resolution
  const handleResolveOpenItem = async (
    openItemId: string,
    response: Parameters<typeof IntelligenceStorageService.resolveOpenItem>[1]
  ) => {
    const updated = await IntelligenceStorageService.resolveOpenItem(openItemId, response);
    if (updated) {
      setDataset((prev) => ({
        ...prev,
        openItems: prev.openItems.map((oi) => (oi.id === openItemId ? updated : oi))
      }));
    }
  };

  // Handle Conflict Resolution
  const handleResolveConflict = async (
    conflictId: string,
    resolution: 'use_source_a' | 'use_source_b' | 'custom_value',
    customValue?: string,
    decisionNote?: string,
    decidedBy?: string
  ) => {
    const updated = await IntelligenceStorageService.resolveConflict(
      conflictId,
      resolution,
      customValue,
      decisionNote,
      decidedBy
    );
    if (updated) {
      setDataset((prev) => ({
        ...prev,
        conflicts: prev.conflicts.map((c) => (c.id === conflictId ? updated : c))
      }));
    }
  };

  // Handle Candidate Rule Confirmation
  const handleRuleStatusChange = async (
    ruleId: string,
    status: 'CONFIRMED_BY_USER' | 'REJECTED'
  ) => {
    const updated = await IntelligenceStorageService.updateCandidateRuleStatus(
      ruleId,
      status,
      'Senior Quantity Surveyor'
    );
    if (updated) {
      setDataset((prev) => ({
        ...prev,
        candidateRules: prev.candidateRules.map((r) => (r.id === ruleId ? updated : r))
      }));
    }
  };

  // Filtered documents for left panel
  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      const matchesDisc = disciplineFilter === 'All' || d.discipline === disciplineFilter;
      const matchesSearch =
        !searchTerm ||
        d.drawingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.title?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDisc && matchesSearch;
    });
  }, [documents, disciplineFilter, searchTerm]);

  // Stepper: Review Next Open Item
  const unreviewedOpenItems = useMemo(() => {
    return dataset.openItems.filter((oi) => oi.status === 'open' || oi.status === 'under_review');
  }, [dataset.openItems]);

  const handleReviewNextOpenItem = () => {
    if (unreviewedOpenItems.length === 0) return;
    const nextItem = unreviewedOpenItems[0];
    setActiveTab('open_items');
    setHighlightedId(nextItem.id);
    zoomToBoundingBox(nextItem.boundingBox);
    setResolvingOpenItem(nextItem);
  };

  // Canvas Mouse Event Handlers for Pan & Marquee Box
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
      setSelectionStart({ x: xPercent, y: yPercent });
      setSelectionBox({ x: xPercent, y: yPercent, width: 0, height: 0 });
      setIsSelecting(true);
    } else {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isSelectionMode && isSelecting) {
      const rect = canvasContainerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const currentX = ((e.clientX - rect.left) / rect.width) * 100;
      const currentY = ((e.clientY - rect.top) / rect.height) * 100;

      const x = Math.min(selectionStart.x, currentX);
      const y = Math.min(selectionStart.y, currentY);
      const width = Math.abs(currentX - selectionStart.x);
      const height = Math.abs(currentY - selectionStart.y);

      setSelectionBox({ x, y, width, height });
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    if (isSelectionMode && isSelecting) {
      setIsSelecting(false);
    }
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.5), 5));
  };

  // Elements on current page
  const pageElements = useMemo(() => {
    return dataset.elements.filter((e) => e.pageNumber === currentPage);
  }, [dataset.elements, currentPage]);

  const pageDimensions = useMemo(() => {
    return dataset.dimensions.filter((d) => d.pageNumber === currentPage);
  }, [dataset.dimensions, currentPage]);

  const pageLevels = useMemo(() => {
    return dataset.levels.filter((l) => l.pageNumber === currentPage);
  }, [dataset.levels, currentPage]);

  const pageGrids = useMemo(() => {
    return dataset.grids.filter((g) => g.pageNumber === currentPage);
  }, [dataset.grids, currentPage]);

  const pageReinforcement = useMemo(() => {
    return dataset.reinforcement.filter((r) => r.pageNumber === currentPage);
  }, [dataset.reinforcement, currentPage]);

  const pageSteel = useMemo(() => {
    return dataset.steel.filter((s) => s.pageNumber === currentPage);
  }, [dataset.steel, currentPage]);

  const pageRoof = useMemo(() => {
    return dataset.roof.filter((ro) => ro.pageNumber === currentPage);
  }, [dataset.roof, currentPage]);

  const pageMep = useMemo(() => {
    return dataset.mep.filter((m) => m.pageNumber === currentPage);
  }, [dataset.mep, currentPage]);

  const pageOpenItems = useMemo(() => {
    return dataset.openItems.filter((oi) => oi.pageNumber === currentPage);
  }, [dataset.openItems, currentPage]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-900 text-slate-100 overflow-hidden select-none">
      {/* Top Utility Bar */}
      <div className="h-13 bg-slate-950 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-indigo-950/80 text-indigo-300 border border-indigo-700/60 px-3 py-1 rounded-lg">
            <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider">
              Drawing Intelligence Workspace
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {currentDoc && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {currentDoc.drawingNumber}
              </span>
              <span className="text-xs font-semibold text-slate-300 truncate max-w-xs">
                {currentDoc.title}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Rev {currentDoc.revision} • {currentDoc.discipline}
              </span>
            </div>
          )}
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          {unreviewedOpenItems.length > 0 && (
            <button
              type="button"
              onClick={handleReviewNextOpenItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg transition-all shadow-md animate-bounce"
            >
              <AlertTriangle className="w-3.5 h-3.5 fill-slate-950" />
              <span>Review Next Open Item ({unreviewedOpenItems.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAnalyzeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>[ ANALYZE DRAWING ]</span>
          </button>

          <button
            type="button"
            onClick={() => setIsQueueModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Project Batch Queue</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Workspace"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main 3-Panel Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* PANEL 1 (LEFT): DRAWINGS & PAGES NAVIGATOR */}
        {/* ========================================================================= */}
        <div className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
          {/* Filter & Search */}
          <div className="p-3 border-b border-slate-800 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search sheets, marks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold text-slate-400 scrollbar-none">
              {['All', 'Structural', 'Architectural', 'Steel', 'HVAC', 'Plumbing'].map((disc) => (
                <button
                  key={disc}
                  onClick={() => setDisciplineFilter(disc)}
                  className={`px-2 py-1 rounded whitespace-nowrap transition-colors ${
                    disciplineFilter === disc
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {disc}
                </button>
              ))}
            </div>
          </div>

          {/* Drawings List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900/60 p-2 space-y-1">
            {filteredDocs.map((doc) => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`p-2.5 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/80 border border-indigo-600/70 text-white shadow-xs'
                      : 'hover:bg-slate-900/80 text-slate-400 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-200">
                      {doc.drawingNumber}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        doc.analysisStatus === 'ANALYZED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : doc.analysisStatus === 'REQUIRES_REVIEW'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {doc.analysisStatus || 'Pending'}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium truncate mt-0.5 text-slate-300">
                    {doc.title}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>{doc.discipline} • Rev {doc.revision}</span>
                    <span className="font-mono">
                      {doc.detectedElementsCount || 0} elms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Page Selector Strip */}
          {currentDoc && (currentDoc.pageCount || 1) > 1 && (
            <div className="p-3 border-t border-slate-800 bg-slate-900/50">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-2">
                <span>Drawing Pages ({currentDoc.pageCount})</span>
                <span className="text-indigo-400">Page {currentPage}</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {Array.from({ length: currentDoc.pageCount || 1 }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`w-8 h-8 rounded text-xs font-bold transition-colors shrink-0 ${
                      currentPage === p
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PANEL 2 (CENTER): INTERACTIVE DRAWING CANVAS & VECTOR VIEWER */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
          {/* Canvas Floating Toolbar */}
          <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 p-1 rounded-lg shadow-xl">
            <button
              onClick={() => setZoom((prev) => Math.min(prev * 1.25, 4))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((prev) => Math.max(prev / 1.25, 0.5))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-700 mx-0.5" />
            <span className="font-mono text-[11px] font-bold text-indigo-300 px-1">
              {Math.round(zoom * 100)}%
            </span>
            <div className="h-4 w-px bg-slate-700 mx-0.5" />
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                setSelectionBox(null);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${
                isSelectionMode
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
              title="Select Area to Analyze"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>{isSelectionMode ? 'Cancel Box' : 'Analyze Box'}</span>
            </button>
          </div>

          {/* Layer Visibility Quick Toggles Bar */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur-xs border border-slate-700/80 p-1 rounded-lg text-[10px] font-bold shadow-xl">
            <span className="text-slate-500 px-1.5 uppercase tracking-wider">Layers:</span>
            {[
              { key: 'elements', label: 'Elements', color: 'text-purple-400' },
              { key: 'dimensions', label: 'Dims', color: 'text-blue-400' },
              { key: 'levels', label: 'Levels', color: 'text-emerald-400' },
              { key: 'grids', label: 'Grids', color: 'text-slate-300' },
              { key: 'reinforcement', label: 'Rebar', color: 'text-indigo-400' },
              { key: 'openItems', label: 'Open Items', color: 'text-red-400' }
            ].map((layer) => {
              const active = (layerVisibility as any)[layer.key];
              return (
                <button
                  key={layer.key}
                  onClick={() =>
                    setLayerVisibility((prev) => ({
                      ...prev,
                      [layer.key]: !(prev as any)[layer.key]
                    }))
                  }
                  className={`px-2 py-0.5 rounded transition-colors ${
                    active
                      ? `bg-slate-800 ${layer.color} border border-slate-700`
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {layer.label}
                </button>
              );
            })}
          </div>

          {/* Analysis Progress Overlay Banner */}
          {analysisProgress && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-slate-900 border border-indigo-500/80 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3">
              <Cpu className="w-4 h-4 text-indigo-400 animate-spin" />
              <div>
                <div className="text-xs font-bold text-white">{analysisProgress.stage}</div>
                <div className="w-48 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${analysisProgress.percent}%` }}
                  />
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-indigo-400">
                {analysisProgress.percent}%
              </span>
            </div>
          )}

          {/* Drawing Canvas Viewport */}
          <div
            ref={canvasContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center bg-slate-950"
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isPanning || isSelecting ? 'none' : 'transform 0.15s ease-out'
              }}
              className="relative w-[900px] h-[620px] bg-slate-900 rounded-lg shadow-2xl border border-slate-800 overflow-hidden"
            >
              {/* Vector Grid & Structural Schematic Background */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                <defs>
                  <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="rgba(148, 163, 184, 0.1)"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#gridPattern)" />

                {/* Simulated Structural GA Grid Lines */}
                <line x1="15%" y1="10%" x2="15%" y2="90%" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="33%" y1="10%" x2="33%" y2="90%" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="51%" y1="10%" x2="51%" y2="90%" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="69%" y1="10%" x2="69%" y2="90%" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="87%" y1="10%" x2="87%" y2="90%" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />

                <line x1="10%" y1="20%" x2="90%" y2="20%" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="10%" y1="36%" x2="90%" y2="36%" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="10%" y1="52%" x2="90%" y2="52%" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="10%" y1="68%" x2="90%" y2="68%" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
                <line x1="10%" y1="84%" x2="90%" y2="84%" stroke="#475569" strokeDasharray="4 4" strokeWidth="1" />
              </svg>

              {/* Title Block Box in Bottom-Right */}
              <div className="absolute bottom-4 right-4 w-72 bg-slate-950/90 border border-slate-700 p-2.5 rounded text-[10px] space-y-1 font-mono">
                <div className="flex justify-between border-b border-slate-800 pb-1 text-indigo-400 font-bold">
                  <span>PROJECT: {project.project.name}</span>
                  <span>{currentDoc?.drawingNumber}</span>
                </div>
                <div className="text-slate-300 font-bold truncate">{currentDoc?.title}</div>
                <div className="flex justify-between text-slate-500 text-[9px]">
                  <span>SCALE: {currentDoc?.scaleRatio || '1:100'}</span>
                  <span>REV: {currentDoc?.revision}</span>
                  <span>DATE: {currentDoc?.drawingDate}</span>
                </div>
              </div>

              {/* LAYER 1: Structural Grids Overlay */}
              {layerVisibility.grids &&
                pageGrids.map((g) => (
                  <div
                    key={g.id}
                    style={{
                      left: `${g.coordPercent?.x || g.boundingBox?.x || 10}%`,
                      top: `${g.coordPercent?.y || g.boundingBox?.y || 10}%`
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800/90 border border-slate-500 text-slate-200 flex items-center justify-center font-mono font-black text-[11px] shadow-md pointer-events-none"
                  >
                    {g.label}
                  </div>
                ))}

              {/* LAYER 2: Elevation Level Markers */}
              {layerVisibility.levels &&
                pageLevels.map((lvl) => (
                  <div
                    key={lvl.id}
                    onClick={() => {
                      setActiveTab('levels_grids');
                      setHighlightedId(lvl.id);
                    }}
                    style={{
                      left: `${lvl.boundingBox?.x || 80}%`,
                      top: `${lvl.boundingBox?.y || 50}%`
                    }}
                    className={`absolute z-10 px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-all border ${
                      highlightedId === lvl.id
                        ? 'bg-emerald-500 text-slate-950 border-white shadow-lg scale-110'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60 hover:bg-emerald-900'
                    }`}
                  >
                    ▲ {lvl.rawText}
                  </div>
                ))}

              {/* LAYER 3: Extracted Dimensions Lines & Badges */}
              {layerVisibility.dimensions &&
                pageDimensions.map((dim) => {
                  const isHighlighted = highlightedId === dim.id;
                  return (
                    <div
                      key={dim.id}
                      onClick={() => {
                        setActiveTab('dimensions');
                        setHighlightedId(dim.id);
                      }}
                      style={{
                        left: `${dim.boundingBox.x}%`,
                        top: `${dim.boundingBox.y}%`,
                        width: `${dim.boundingBox.width}%`,
                        height: `${dim.boundingBox.height}%`
                      }}
                      className={`absolute z-10 border rounded flex items-center justify-center cursor-pointer transition-all ${
                        isHighlighted
                          ? 'border-blue-400 bg-blue-500/30 text-white shadow-lg scale-105 ring-2 ring-blue-400'
                          : dim.confidence < 80
                          ? 'border-red-500/80 bg-red-950/60 text-red-300'
                          : 'border-blue-600/60 bg-blue-950/40 text-blue-300 hover:bg-blue-900/60'
                      }`}
                    >
                      <span className="font-mono text-[9px] font-bold px-1 py-0.5 rounded bg-slate-950/80 truncate">
                        {dim.rawText}
                      </span>
                    </div>
                  );
                })}

              {/* LAYER 4: Detected Elements Bounding Boxes */}
              {layerVisibility.elements &&
                pageElements.map((elm) => {
                  const isHighlighted = highlightedId === elm.id;
                  return (
                    <div
                      key={elm.id}
                      onClick={() => {
                        setActiveTab('elements');
                        setHighlightedId(elm.id);
                      }}
                      style={{
                        left: `${elm.boundingBox.x}%`,
                        top: `${elm.boundingBox.y}%`,
                        width: `${elm.boundingBox.width}%`,
                        height: `${elm.boundingBox.height}%`
                      }}
                      className={`absolute z-10 border-2 rounded flex flex-col justify-between p-1 cursor-pointer transition-all ${
                        isHighlighted
                          ? 'border-indigo-400 bg-indigo-500/30 shadow-xl scale-105 ring-2 ring-indigo-400'
                          : elm.status === 'USER VERIFIED' || elm.status === 'USER CORRECTED'
                          ? 'border-emerald-500/80 bg-emerald-950/30'
                          : elm.status === 'REQUIRES REVIEW'
                          ? 'border-amber-500/80 bg-amber-950/30'
                          : 'border-purple-500/70 bg-purple-950/30 hover:bg-purple-900/50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[9px] font-black text-white bg-slate-950/90 px-1 py-0.5 rounded">
                        <span>{elm.mark}</span>
                        <span className="text-[8px] opacity-75">{elm.type}</span>
                      </div>
                      <div className="text-[8px] font-mono text-purple-200 truncate bg-slate-950/80 px-1 rounded">
                        {elm.rawDimensionsText}
                      </div>
                    </div>
                  );
                })}

              {/* LAYER 5: Open Items High-Visibility Alert Markers */}
              {layerVisibility.openItems &&
                pageOpenItems.map((oi) => {
                  const isHighlighted = highlightedId === oi.id;
                  return (
                    <div
                      key={oi.id}
                      onClick={() => {
                        setActiveTab('open_items');
                        setHighlightedId(oi.id);
                        setResolvingOpenItem(oi);
                      }}
                      style={{
                        left: `${oi.boundingBox?.x || 50}%`,
                        top: `${oi.boundingBox?.y || 50}%`
                      }}
                      className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-lg font-mono text-[10px] font-black cursor-pointer shadow-2xl flex items-center gap-1.5 animate-pulse ${
                        isHighlighted
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-white scale-125'
                          : 'bg-red-600 text-white border border-red-300 hover:bg-red-500'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 fill-current" />
                      <span>{oi.id}</span>
                    </div>
                  );
                })}

              {/* Interactive Marquee Drag Box */}
              {isSelectionMode && selectionBox && (
                <div
                  style={{
                    left: `${selectionBox.x}%`,
                    top: `${selectionBox.y}%`,
                    width: `${selectionBox.width}%`,
                    height: `${selectionBox.height}%`
                  }}
                  className="absolute z-30 border-2 border-amber-400 bg-amber-400/20 pointer-events-none rounded"
                >
                  <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1 rounded">
                    Selected Area
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Marquee Prompt Bar */}
          {isSelectionMode && selectionBox && selectionBox.width > 2 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900 border border-amber-400 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3">
              <span className="text-xs font-bold text-amber-300">
                Area selected ({Math.round(selectionBox.width)}% × {Math.round(selectionBox.height)}%)
              </span>
              <button
                type="button"
                onClick={() =>
                  handleStartAnalysis({
                    mode: 'SELECTION',
                    selectedArea: selectionBox
                  })
                }
                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-lg transition-colors shadow-xs"
              >
                Analyze This Selected Area
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PANEL 3 (RIGHT): STRUCTURED ENGINEERING DATA INSPECTOR */}
        {/* ========================================================================= */}
        <div className="w-[420px] bg-slate-950 border-l border-slate-800 flex flex-col shrink-0">
          {/* Classification & Confidence Header Card */}
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Classification & Provenance
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                {latestRun?.classificationStatus || 'AI SUGGESTED'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {latestRun?.classification || currentDoc?.documentType || 'Structural GA'}
              </h3>
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{latestRun?.classificationConfidence || 95}% Conf.</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
              <span>Scale: {latestRun?.scaleDetected || currentDoc?.scaleRatio || '1:100'}</span>
              <span>Engine: Quantum-Takeoff v3.4</span>
            </div>
          </div>

          {/* Inspector Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/40 text-[11px] font-bold overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('elements')}
              className={`px-3 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'elements'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Elements ({dataset.elements.length})
            </button>
            <button
              onClick={() => setActiveTab('dimensions')}
              className={`px-3 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'dimensions'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Dims ({dataset.dimensions.length})
            </button>
            <button
              onClick={() => setActiveTab('levels_grids')}
              className={`px-3 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'levels_grids'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Levels & Grids
            </button>
            <button
              onClick={() => setActiveTab('reinforcement')}
              className={`px-3 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'reinforcement'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Rebar ({dataset.reinforcement.length})
            </button>
            <button
              onClick={() => setActiveTab('steel_mep')}
              className={`px-3 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'steel_mep'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Steel & MEP
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'rules'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Rules ({dataset.candidateRules.length})
            </button>
            <button
              onClick={() => setActiveTab('open_items')}
              className={`px-3 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'open_items'
                  ? 'border-red-500 text-red-300 bg-red-950/40'
                  : 'border-transparent text-red-400 hover:text-red-300'
              }`}
            >
              Open Items ({dataset.openItems.length})
            </button>
            {dataset.conflicts.length > 0 && (
              <button
                onClick={() => setActiveTab('conflicts')}
                className={`px-3 py-2.5 whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === 'conflicts'
                    ? 'border-amber-500 text-amber-300 bg-amber-950/40'
                    : 'border-transparent text-amber-400 hover:text-amber-300'
                }`}
              >
                Conflicts ({dataset.conflicts.length})
              </button>
            )}
          </div>

          {/* Inspector Content Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* TAB 1: ELEMENTS */}
            {activeTab === 'elements' && (
              <div className="space-y-2.5">
                {dataset.elements.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No elements extracted yet. Click <strong>[ ANALYZE DRAWING ]</strong> to begin.
                  </div>
                ) : (
                  dataset.elements.map((elm) => {
                    const isSelected = highlightedId === elm.id;
                    return (
                      <div
                        key={elm.id}
                        onClick={() => {
                          setHighlightedId(elm.id);
                          zoomToBoundingBox(elm.boundingBox);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/80 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                            : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black text-white bg-slate-800 px-2 py-0.5 rounded">
                              {elm.mark}
                            </span>
                            <span className="text-xs font-bold text-indigo-300">{elm.type}</span>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              elm.status === 'USER VERIFIED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : elm.status === 'USER CORRECTED'
                                ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                : elm.confidence >= 95
                                ? 'bg-slate-800 text-slate-300'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {elm.status}
                          </span>
                        </div>

                        <div className="mt-2 text-xs space-y-1 text-slate-300">
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>Location: {elm.gridLocation}</span>
                            <span>{elm.level}</span>
                          </div>
                          <div className="font-mono font-bold text-white bg-slate-950/60 p-1.5 rounded border border-slate-800/80">
                            {elm.rawDimensionsText}
                          </div>
                          {elm.material && (
                            <div className="text-[11px] text-slate-400 truncate">
                              Spec: {elm.material}
                            </div>
                          )}
                          {elm.reinforcementNotation && (
                            <div className="text-[11px] text-indigo-300 truncate font-mono">
                              Rebar: {elm.reinforcementNotation}
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              zoomToBoundingBox(elm.boundingBox);
                              setHighlightedId(elm.id);
                            }}
                            className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Locate</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingElement(elm);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold border border-slate-700 transition-colors"
                          >
                            <Edit3 className="w-3 h-3 text-indigo-400" />
                            <span>Correct / Verify</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: DIMENSIONS */}
            {activeTab === 'dimensions' && (
              <div className="space-y-2">
                {dataset.dimensions.map((dim) => (
                  <div
                    key={dim.id}
                    onClick={() => {
                      setHighlightedId(dim.id);
                      zoomToBoundingBox(dim.boundingBox);
                    }}
                    className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-300">{dim.rawText}</span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {dim.dimensionType}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Normalized: {dim.normalizedValue} {dim.unit}</span>
                      <span className="font-mono">{dim.confidence}% Conf.</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{dim.sourceLocation}</div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: LEVELS & GRIDS */}
            {activeTab === 'levels_grids' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Elevation Level Register
                  </h4>
                  <div className="space-y-1.5">
                    {dataset.levels.map((lvl) => (
                      <div
                        key={lvl.id}
                        onClick={() => {
                          setHighlightedId(lvl.id);
                          zoomToBoundingBox(lvl.boundingBox);
                        }}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs cursor-pointer hover:border-slate-700"
                      >
                        <div>
                          <div className="font-bold text-white">{lvl.name}</div>
                          <div className="text-[10px] text-slate-500">{lvl.sourceLocation}</div>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-800">
                          {lvl.rawText}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Structural Grids & Axes
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {dataset.grids.map((g) => (
                      <div
                        key={g.id}
                        className="p-2 rounded bg-slate-900 border border-slate-800 text-center font-mono"
                      >
                        <div className="text-xs font-bold text-white">Axis {g.label}</div>
                        <div className="text-[9px] text-slate-500">{g.axis} Grid</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: REINFORCEMENT & RCC */}
            {activeTab === 'reinforcement' && (
              <div className="space-y-2">
                {dataset.reinforcement.map((rb) => (
                  <div
                    key={rb.id}
                    onClick={() => {
                      setHighlightedId(rb.id);
                      zoomToBoundingBox(rb.boundingBox);
                    }}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{rb.member}</span>
                      <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/80 px-1.5 py-0.5 rounded">
                        {rb.barMark || 'Rebar'}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-indigo-300 bg-slate-950 p-1.5 rounded">
                      {rb.rawNotation}
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Concrete Grade: {rb.concreteGrade || 'C30/37'}</span>
                      <span>Cover: {rb.coverMm || 40} mm</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 5: STEEL & MEP */}
            {activeTab === 'steel_mep' && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Structural Steel Members
                  </h4>
                  <div className="space-y-1.5">
                    {dataset.steel.map((st) => (
                      <div
                        key={st.id}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex justify-between font-bold text-white">
                          <span>{st.element} ({st.mark})</span>
                          <span className="text-amber-400 font-mono">{st.rawSectionText}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">Grade: {st.steelGrade}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    MEP & Building Services
                  </h4>
                  <div className="space-y-1.5">
                    {dataset.mep.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex justify-between font-bold text-white">
                          <span>{m.system} — {m.elementType}</span>
                          <span className="text-cyan-400 font-mono text-[11px]">
                            {m.sizeSpecification}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{m.location}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: RULES */}
            {activeTab === 'rules' && (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-950/50 border border-indigo-800/80 rounded-lg text-xs text-indigo-200">
                  <strong className="font-bold">Candidate Rules Engine:</strong> General Notes extracted from drawing sheets are placed in candidate state and never applied globally until confirmed by the engineer.
                </div>
                {dataset.candidateRules.map((cr) => (
                  <div
                    key={cr.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {cr.targetCategory} • {cr.scope}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          cr.status === 'CONFIRMED_BY_USER'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : cr.status === 'REJECTED'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {cr.status}
                      </span>
                    </div>
                    <div className="font-bold text-white">{cr.extractedRule}</div>
                    <p className="text-[11px] text-slate-400 italic">"{cr.rawNote}"</p>

                    {cr.status === 'CANDIDATE_RULE' && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleRuleStatusChange(cr.id, 'REJECTED')}
                          className="px-2.5 py-1 rounded border border-red-800/80 text-red-400 hover:bg-red-950 text-[11px] font-bold transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRuleStatusChange(cr.id, 'CONFIRMED_BY_USER')}
                          className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors shadow-2xs"
                        >
                          Confirm for Project
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB 7: OPEN ITEMS */}
            {activeTab === 'open_items' && (
              <div className="space-y-3">
                {dataset.openItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    No open items or unreadable queries. All parameters structured cleanly.
                  </div>
                ) : (
                  dataset.openItems.map((oi) => {
                    const isSelected = highlightedId === oi.id;
                    return (
                      <div
                        key={oi.id}
                        onClick={() => {
                          setHighlightedId(oi.id);
                          zoomToBoundingBox(oi.boundingBox);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-950/80 border-amber-400 shadow-xl'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700">
                            {oi.id}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              oi.status === 'resolved'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-red-950 text-red-300 border border-red-800'
                            }`}
                          >
                            {oi.status}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white mt-2">{oi.title}</h4>
                        <p className="text-[11px] text-slate-300 mt-1">{oi.questionToUser}</p>

                        {oi.detectedText && (
                          <div className="mt-2 text-[11px] font-mono text-amber-300 bg-slate-950 p-1.5 rounded border border-slate-800">
                            Detected OCR: <span className="underline">{oi.detectedText}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              zoomToBoundingBox(oi.boundingBox);
                              setHighlightedId(oi.id);
                            }}
                            className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 font-semibold"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Locate</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResolvingOpenItem(oi);
                            }}
                            className="flex items-center gap-1 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition-colors"
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>[ Resolve / Enter Value ]</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 8: CONFLICTS */}
            {activeTab === 'conflicts' && (
              <div className="space-y-3">
                {dataset.conflicts.map((cnf) => (
                  <div
                    key={cnf.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                        {cnf.id}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                        {cnf.status}
                      </span>
                    </div>
                    <div className="font-bold text-white">{cnf.title}</div>
                    <div className="text-[11px] text-slate-400">
                      Affected Element: {cnf.elementName}
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setResolvingConflict(cnf)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>Side-by-Side Compare & Resolve</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Audit Summary Counters */}
          <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
            <div className="flex items-center gap-3">
              <span>Elms: <strong className="text-white">{dataset.elements.length}</strong></span>
              <span>Dims: <strong className="text-white">{dataset.dimensions.length}</strong></span>
              <span>Lvls: <strong className="text-white">{dataset.levels.length}</strong></span>
            </div>
            <div className="flex items-center gap-3">
              <span>Open: <strong className="text-amber-400">{dataset.openItems.length}</strong></span>
              <span>Cnfl: <strong className="text-red-400">{dataset.conflicts.length}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AnalyzeOptionsModal
        isOpen={isAnalyzeModalOpen}
        onClose={() => setIsAnalyzeModalOpen(false)}
        document={currentDoc}
        currentPage={currentPage}
        onStartAnalysis={handleStartAnalysis}
      />

      <ProjectAnalysisQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
        project={project}
        documents={documents}
        onDocumentAnalyzed={() => {
          if (selectedDocId) loadAnalysisData(selectedDocId);
        }}
      />

      <ElementEditModal
        isOpen={!!editingElement}
        onClose={() => setEditingElement(null)}
        element={editingElement}
        onSave={handleSaveElementCorrection}
      />

      <OpenItemDetailModal
        isOpen={!!resolvingOpenItem}
        onClose={() => setResolvingOpenItem(null)}
        openItem={resolvingOpenItem}
        onResolve={handleResolveOpenItem}
        onLocateOnDrawing={(item) => zoomToBoundingBox(item.boundingBox)}
      />

      <ConflictResolverModal
        isOpen={!!resolvingConflict}
        onClose={() => setResolvingConflict(null)}
        conflict={resolvingConflict}
        onResolve={handleResolveConflict}
      />
    </div>
  );
};
