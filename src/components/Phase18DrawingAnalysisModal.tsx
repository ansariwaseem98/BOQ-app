/**
 * Phase 18A: Real Drawing Analysis & Measurement Extraction Modal
 * 
 * Interactive inspection dashboard with:
 * - Real Canvas with Bounding Box Source Highlighting
 * - Stage-by-stage real progress execution
 * - Analysis Summary Dashboard
 * - Interactive Tabs: Elements, Dimensions, Grids & Levels, Schedules, Open Items, Conflicts, Audit Trail
 * - Human Correction & Verification Flow ([ ENTER VALUE ], [ VERIFY ], [ VIEW SOURCE ], [ SOURCE A ], [ SOURCE B ])
 * - Direct Excel & JSON export
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  ProjectDocument,
  ProjectRecord
} from '../types';
import {
  DrawingAnalysisMasterRecord,
  AnalysisProcessingStage,
  ExtractedElementRecord,
  AnalysisOpenItem,
  AnalysisConflictRecord,
  BoundingRegion,
  SourceLocationRef
} from '../types/phase18AnalysisTypes';
import { Phase18RealDrawingAnalysisEngine } from '../engine/phase18RealDrawingAnalysisEngine';
import { Phase18AnalysisStorage } from '../services/phase18AnalysisStorage';
import {
  X,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Layers,
  Ruler,
  Grid,
  TrendingUp,
  Table,
  HelpCircle,
  GitCompare,
  FileCheck2,
  Download,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Edit3,
  ShieldCheck,
  Building2,
  Info
} from 'lucide-react';

interface Phase18DrawingAnalysisModalProps {
  document: ProjectDocument | null;
  project: ProjectRecord;
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete?: (record: DrawingAnalysisMasterRecord) => void;
}

type TabType = 'elements' | 'dimensions' | 'grids_levels' | 'schedules' | 'open_items' | 'conflicts' | 'audit_trail';

export const Phase18DrawingAnalysisModal: React.FC<Phase18DrawingAnalysisModalProps> = ({
  document: doc,
  project,
  isOpen,
  onClose,
  onAnalysisComplete
}) => {
  if (!isOpen || !doc) return null;

  // Analysis State
  const [analysisRecord, setAnalysisRecord] = useState<DrawingAnalysisMasterRecord | null>(null);
  const [isLoadingRecord, setIsLoadingRecord] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<AnalysisProcessingStage>('IDLE');
  const [stageProgressNote, setStageProgressNote] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabType>('elements');

  // Canvas & Highlighting State
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [activeHighlightRegion, setActiveHighlightRegion] = useState<BoundingRegion | null>(null);
  const [highlightLabel, setHighlightLabel] = useState<string | null>(null);

  // Correction & Open Item Modals State
  const [editingElement, setEditingElement] = useState<ExtractedElementRecord | null>(null);
  const [editGeom, setEditGeom] = useState<{ length?: string; width?: string; depth?: string; height?: string; thickness?: string; count?: string }>({});
  const [editNote, setEditNote] = useState<string>('');
  const [resolvingOpenItem, setResolvingOpenItem] = useState<AnalysisOpenItem | null>(null);
  const [openItemResolutionVal, setOpenItemResolutionVal] = useState<string>('');
  const [openItemResolutionNote, setOpenItemResolutionNote] = useState<string>('');

  // Conflict Resolution State
  const [resolvingConflict, setResolvingConflict] = useState<AnalysisConflictRecord | null>(null);
  const [conflictCustomVal, setConflictCustomVal] = useState<string>('');
  const [conflictResolutionNote, setConflictResolutionNote] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load existing analysis on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingRecord(true);
    Phase18AnalysisStorage.getAnalysisRecord(doc.id)
      .then((record) => {
        if (isMounted) {
          setAnalysisRecord(record);
          setIsLoadingRecord(false);
        }
      })
      .catch((err) => {
        console.error('Error loading analysis record:', err);
        if (isMounted) setIsLoadingRecord(false);
      });

    return () => {
      isMounted = false;
    };
  }, [doc.id]);

  // Handle Trigger Real Analysis
  const handleStartAnalysis = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setCurrentStage('Reading File');
    setStageProgressNote('Initializing extraction engine...');

    try {
      const record = await Phase18RealDrawingAnalysisEngine.analyzeDocument(
        doc,
        project,
        (stage, stageNum, total, message) => {
          setCurrentStage(stage);
          setStageProgressNote(`[Stage ${stageNum}/${total}] ${message}`);
        }
      );

      await Phase18AnalysisStorage.saveAnalysisRecord(record);
      setAnalysisRecord(record);
      setIsAnalyzing(false);
      setCurrentStage('COMPLETED');
      showToast(`Analysis completed: ${record.elements.length} elements detected.`, 'success');
      if (onAnalysisComplete) onAnalysisComplete(record);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setIsAnalyzing(false);
      setCurrentStage('FAILED');
      showToast(`Analysis failed: ${err.message || 'Unknown engine error'}`, 'error');
    }
  };

  // Human Correction Handler
  const handleSaveCorrection = async () => {
    if (!editingElement || !analysisRecord) return;
    const numLength = editGeom.length ? parseFloat(editGeom.length) : undefined;
    const numWidth = editGeom.width ? parseFloat(editGeom.width) : undefined;
    const numDepth = editGeom.depth ? parseFloat(editGeom.depth) : undefined;
    const numHeight = editGeom.height ? parseFloat(editGeom.height) : undefined;
    const numThk = editGeom.thickness ? parseFloat(editGeom.thickness) : undefined;
    const numCount = editGeom.count ? parseInt(editGeom.count, 10) : 1;

    const updated = await Phase18AnalysisStorage.recordUserCorrection(
      analysisRecord.documentId,
      editingElement.id,
      {
        length: isNaN(numLength as number) ? undefined : numLength,
        width: isNaN(numWidth as number) ? undefined : numWidth,
        depth: isNaN(numDepth as number) ? undefined : numDepth,
        height: isNaN(numHeight as number) ? undefined : numHeight,
        thickness: isNaN(numThk as number) ? undefined : numThk,
        count: isNaN(numCount) ? 1 : numCount
      },
      editNote
    );

    if (updated) {
      setAnalysisRecord(updated);
      setEditingElement(null);
      showToast(`Measurement updated for ${editingElement.mark}.`, 'success');
    }
  };

  // Verify Element Handler
  const handleVerifyElement = async (elementId: string) => {
    if (!analysisRecord) return;
    const result = await Phase18AnalysisStorage.verifyElement(analysisRecord.documentId, elementId);
    if (result.success && result.record) {
      setAnalysisRecord(result.record);
      showToast(`Element verified successfully.`, 'success');
    } else {
      showToast(result.message || 'Verification failed.', 'error');
    }
  };

  // Resolve Open Item Handler
  const handleResolveOpenItem = async () => {
    if (!resolvingOpenItem || !analysisRecord) return;
    const updated = await Phase18AnalysisStorage.resolveOpenItem(
      analysisRecord.documentId,
      resolvingOpenItem.id,
      openItemResolutionVal,
      openItemResolutionNote
    );
    if (updated) {
      setAnalysisRecord(updated);
      setResolvingOpenItem(null);
      setOpenItemResolutionVal('');
      setOpenItemResolutionNote('');
      showToast(`Open item resolved.`, 'success');
    }
  };

  // Resolve Conflict Handler
  const handleResolveConflict = async (decision: 'USE_SOURCE_A' | 'USE_SOURCE_B' | 'CUSTOM_VALUE') => {
    if (!resolvingConflict || !analysisRecord) return;
    const updated = await Phase18AnalysisStorage.resolveConflict(
      analysisRecord.documentId,
      resolvingConflict.id,
      decision,
      conflictCustomVal,
      conflictResolutionNote
    );
    if (updated) {
      setAnalysisRecord(updated);
      setResolvingConflict(null);
      setConflictCustomVal('');
      setConflictResolutionNote('');
      showToast(`Conflict resolved (${decision}).`, 'success');
    }
  };

  // View Source Helper
  const handleViewSource = (ref: SourceLocationRef | BoundingRegion, label?: string) => {
    const region = 'region' in ref ? ref.region : ref;
    setActiveHighlightRegion(region);
    setHighlightLabel(label || ('snippetDescription' in ref ? ref.snippetDescription : 'Source Location') || 'Selected Source');
  };

  const statusBadge = () => {
    const status = isAnalyzing ? 'ANALYZING' : (analysisRecord?.status || 'NOT ANALYZED');
    switch (status) {
      case 'ANALYZED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">ANALYZED</span>;
      case 'REVIEW REQUIRED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">REVIEW REQUIRED</span>;
      case 'ANALYZING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse">ANALYZING...</span>;
      case 'PARTIALLY ANALYZED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">PARTIALLY ANALYZED</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300">FAILED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-300">NOT ANALYZED</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-hidden">
      <div className="bg-white w-full max-w-7xl h-[92vh] rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        
        {/* HEADER BAR */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">
                  {doc.drawingNumber || doc.title}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                  {doc.revision || 'Rev 01'}
                </span>
                {statusBadge()}
              </div>
              <p className="text-xs text-slate-400">
                {doc.title} • {doc.fileFormat} • Discipline: {doc.discipline || 'Architectural/Structural'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Start Analysis Button */}
            <button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ANALYZING...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>[ ANALYZE DRAWING ]</span>
                </>
              )}
            </button>

            {/* Export JSON / Excel */}
            {analysisRecord && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => Phase18AnalysisStorage.exportAnalysisExcel(analysisRecord)}
                  title="Export to Excel"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => Phase18AnalysisStorage.exportAnalysisJson(analysisRecord)}
                  title="Export to JSON"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>JSON</span>
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PROGRESS STAGE BANNER */}
        {isAnalyzing && (
          <div className="bg-indigo-50 border-b border-indigo-100 px-6 py-2.5 flex items-center justify-between text-xs text-indigo-950 shrink-0">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              <span className="font-bold uppercase tracking-wider text-indigo-700">Stage: {currentStage}</span>
              <span className="text-slate-600 text-xs">{stageProgressNote}</span>
            </div>
            <span className="text-[11px] font-mono text-indigo-600 font-bold">Strict Evidence Mode (No Hallucinations)</span>
          </div>
        )}

        {/* TOAST ALERT */}
        {toastMessage && (
          <div className={`px-6 py-2 text-xs font-bold flex items-center gap-2 shrink-0 ${
            toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-b border-emerald-200' :
            toastMessage.type === 'error' ? 'bg-rose-50 text-rose-900 border-b border-rose-200' :
            'bg-slate-100 text-slate-900 border-b border-slate-200'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* MAIN BODY: SPLIT VIEW (CANVAS LEFT, INTELLIGENCE INSPECTOR RIGHT) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: INTERACTIVE CANVAS WITH BOUNDING BOX OVERLAYS */}
          <div className="w-1/2 border-r border-slate-200 flex flex-col bg-[#0B0F19] relative select-none">
            
            {/* Canvas Toolbar */}
            <div className="p-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[11px] text-slate-400">Sheet Canvas Preview</span>
                {highlightLabel && (
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold">
                    Active: {highlightLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoom((z) => Math.max(z - 25, 50))}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[10px] w-10 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(z + 25, 300))}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-300 ml-1"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                {activeHighlightRegion && (
                  <button
                    onClick={() => {
                      setActiveHighlightRegion(null);
                      setHighlightLabel(null);
                    }}
                    className="p-1 rounded hover:bg-slate-800 text-rose-400 text-[10px] font-bold ml-2"
                  >
                    Clear Highlight
                  </button>
                )}
              </div>
            </div>

            {/* Canvas Viewport */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative">
              <div
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease'
                }}
                className="relative bg-white rounded-lg shadow-2xl max-w-full max-h-full overflow-hidden flex items-center justify-center"
              >
                {doc.previewDataUrl ? (
                  <img
                    src={doc.previewDataUrl}
                    alt={doc.title}
                    className="max-h-[600px] object-contain select-none pointer-events-none"
                  />
                ) : (
                  <div className="w-[500px] h-[360px] bg-slate-50 border border-slate-200 p-6 flex flex-col justify-between text-slate-800">
                    <div className="border-b border-slate-300 pb-2 flex justify-between">
                      <span className="font-bold text-xs text-indigo-700">{doc.drawingNumber || doc.id}</span>
                      <span className="font-mono text-xs">{doc.revision}</span>
                    </div>
                    <div className="h-44 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-xs">
                      [ CAD / Vector Sheet Preview Area ]
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                      <span>Scale: {doc.scaleRatio || '1:100'}</span>
                      <span>Level: {doc.level || 'Ground Floor'}</span>
                    </div>
                  </div>
                )}

                {/* SVG Bounding Box Highlighting Overlay */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {/* Active Selected Highlight Box */}
                  {activeHighlightRegion && (
                    <g>
                      <rect
                        x={`${activeHighlightRegion.x}%`}
                        y={`${activeHighlightRegion.y}%`}
                        width={`${activeHighlightRegion.width}%`}
                        height={`${activeHighlightRegion.height}%`}
                        fill="rgba(99, 102, 241, 0.25)"
                        stroke="#6366F1"
                        strokeWidth="3"
                        strokeDasharray="4 2"
                        className="animate-pulse"
                      />
                      <text
                        x={`${activeHighlightRegion.x}%`}
                        y={`${Math.max(activeHighlightRegion.y - 2, 4)}%`}
                        fill="#4338CA"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {highlightLabel || 'SOURCE REGION'}
                      </text>
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* Canvas Footer Status */}
            <div className="p-2.5 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Format: {doc.fileFormat}</span>
              <span>Total Pages: {doc.pageCount || 1}</span>
              <span>Source File: {doc.sourceFileName}</span>
            </div>
          </div>

          {/* RIGHT: INTELLIGENCE DASHBOARD & DATA TABS */}
          <div className="w-1/2 flex flex-col bg-slate-50 overflow-hidden">
            
            {/* SUMMARY STATS BANNER */}
            <div className="p-4 bg-white border-b border-slate-200 shrink-0">
              <div className="grid grid-cols-6 gap-2">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-base font-black text-slate-900 block">
                    {analysisRecord?.summary.pagesAnalyzed || 0}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Pages</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-base font-black text-indigo-700 block">
                    {analysisRecord?.summary.dimensionsDetected || 0}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Dims</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-base font-black text-indigo-700 block">
                    {analysisRecord?.summary.elementsDetected || 0}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Elements</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-base font-black text-amber-600 block">
                    {analysisRecord?.summary.openItemsCount || 0}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Open Items</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-base font-black text-rose-600 block">
                    {analysisRecord?.summary.conflictsCount || 0}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Conflicts</span>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-base font-black text-emerald-600 block">
                    {analysisRecord?.summary.verifiedCount || 0}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Verified</span>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR HEADER */}
            <div className="px-4 bg-white border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                onClick={() => setActiveTab('elements')}
                className={`py-3 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'elements'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Elements ({analysisRecord?.elements.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('dimensions')}
                className={`py-3 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dimensions'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Dimensions ({analysisRecord?.dimensions.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('grids_levels')}
                className={`py-3 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'grids_levels'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grids & Levels</span>
              </button>

              <button
                onClick={() => setActiveTab('schedules')}
                className={`py-3 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'schedules'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Schedules ({analysisRecord?.schedules.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('open_items')}
                className={`py-3 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'open_items'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Open Items ({analysisRecord?.openItems.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('conflicts')}
                className={`py-3 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'conflicts'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Conflicts ({analysisRecord?.conflicts.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('audit_trail')}
                className={`py-3 px-3 border-b-2 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'audit_trail'
                    ? 'border-slate-800 text-slate-900'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Audit Trail</span>
              </button>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              
              {!analysisRecord && !isAnalyzing && (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                  <Sparkles className="w-10 h-10 text-indigo-500 mx-auto" />
                  <h3 className="text-sm font-black text-slate-800">Drawing Not Analyzed Yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Click <strong>[ ANALYZE DRAWING ]</strong> to trigger multi-stage OCR, element extraction, grid detection, and schedule validation.
                  </p>
                  <button
                    onClick={handleStartAnalysis}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    [ ANALYZE DRAWING NOW ]
                  </button>
                </div>
              )}

              {/* TAB 1: ELEMENTS REGISTER */}
              {activeTab === 'elements' && analysisRecord && (
                <div className="space-y-3">
                  {analysisRecord.elements.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-xs">
                      No structural/architectural elements detected on this sheet.
                    </div>
                  ) : (
                    analysisRecord.elements.map((el) => (
                      <div
                        key={el.id}
                        className={`p-3.5 bg-white rounded-xl border transition-all ${
                          el.status === 'VERIFIED'
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : el.status === 'CONFLICT'
                            ? 'border-rose-300 bg-rose-50/30'
                            : el.status === 'REVIEW REQUIRED'
                            ? 'border-amber-300 bg-amber-50/20'
                            : 'border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {el.mark}
                            </span>
                            <span className="font-bold text-xs text-slate-800">{el.elementType}</span>
                            <span className="text-[11px] text-slate-500 font-mono">@{el.gridLocation}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              el.confidence === 'HIGH' ? 'bg-emerald-100 text-emerald-800' :
                              el.confidence === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {el.confidence} CONFIDENCE
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              el.status === 'VERIFIED' ? 'bg-emerald-600 text-white' :
                              el.status === 'CONFLICT' ? 'bg-rose-600 text-white' :
                              el.status === 'USER CORRECTED' ? 'bg-indigo-600 text-white' :
                              el.status === 'REVIEW REQUIRED' ? 'bg-amber-600 text-white' :
                              'bg-slate-200 text-slate-800'
                            }`}>
                              {el.status}
                            </span>
                          </div>
                        </div>

                        {/* Dimensions & Properties Grid */}
                        <div className="bg-slate-50 rounded-lg p-2.5 grid grid-cols-4 gap-2 text-xs font-mono mb-2.5">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Length:</span>
                            <strong className="text-slate-800">
                              {el.userCorrectedGeometry?.length ?? el.aiExtractedGeometry.length ?? 'Missing'} m
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Width:</span>
                            <strong className="text-slate-800">
                              {el.userCorrectedGeometry?.width ?? el.aiExtractedGeometry.width ?? 'Missing'} m
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Depth/Height:</span>
                            <strong className="text-slate-800">
                              {el.userCorrectedGeometry?.depth ?? el.userCorrectedGeometry?.height ?? el.aiExtractedGeometry.depth ?? el.aiExtractedGeometry.height ?? 'Missing'} m
                            </strong>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-sans">Count:</span>
                            <strong className="text-slate-800">{el.instanceCount} Nos</strong>
                          </div>
                        </div>

                        {/* Material & Specifications */}
                        <div className="text-[11px] text-slate-600 flex items-center justify-between border-t border-slate-100 pt-2">
                          <span className="truncate max-w-[260px]">
                            <strong>Mat:</strong> {el.material || 'Standard Concrete/Masonry'}
                          </span>
                          {el.userNote && (
                            <span className="text-indigo-600 italic truncate max-w-[180px]">
                              Note: {el.userNote}
                            </span>
                          )}
                        </div>

                        {/* Actions: View Source, Edit/Enter Value, Verify */}
                        <div className="flex items-center justify-end gap-2 mt-2.5 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleViewSource(el.aiExtractedGeometry.source, `Element ${el.mark}`)}
                            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>[ VIEW SOURCE ]</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingElement(el);
                              setEditGeom({
                                length: el.userCorrectedGeometry?.length?.toString() || el.aiExtractedGeometry.length?.toString() || '',
                                width: el.userCorrectedGeometry?.width?.toString() || el.aiExtractedGeometry.width?.toString() || '',
                                depth: el.userCorrectedGeometry?.depth?.toString() || el.aiExtractedGeometry.depth?.toString() || '',
                                height: el.userCorrectedGeometry?.height?.toString() || el.aiExtractedGeometry.height?.toString() || '',
                                thickness: el.userCorrectedGeometry?.thickness?.toString() || el.aiExtractedGeometry.thickness?.toString() || '',
                                count: el.instanceCount.toString()
                              });
                              setEditNote(el.userNote || '');
                            }}
                            className="px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>[ ENTER VALUE ]</span>
                          </button>

                          {el.status !== 'VERIFIED' && (
                            <button
                              onClick={() => handleVerifyElement(el.id)}
                              className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>[ VERIFY ]</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: DIMENSIONS */}
              {activeTab === 'dimensions' && analysisRecord && (
                <div className="space-y-2.5">
                  {analysisRecord.dimensions.map((dim) => (
                    <div
                      key={dim.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-indigo-300"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{dim.originalText}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-mono font-bold text-indigo-700">{dim.normalizedValueMeters} m ({dim.normalizedValueMm} mm)</span>
                          {dim.isUnitAmbiguous && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                              UNIT AMBIGUOUS
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Page {dim.pageNumber} • Status: {dim.status}</span>
                      </div>

                      <button
                        onClick={() => handleViewSource(dim.region, `Dimension "${dim.originalText}"`)}
                        className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>[ VIEW SOURCE ]</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: GRIDS & LEVELS */}
              {activeTab === 'grids_levels' && analysisRecord && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                      Structural Grids
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {analysisRecord.grids.map((grid) => (
                        <div
                          key={grid.id}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-indigo-700 block">Grid {grid.label}</span>
                            <span className="text-[10px] text-slate-400">{grid.axis} Axis</span>
                          </div>
                          <button
                            onClick={() => handleViewSource(grid.region, `Grid ${grid.label}`)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-600"
                            title="View on drawing"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                      Datum Levels & Elevations
                    </h4>
                    <div className="space-y-2">
                      {analysisRecord.levels.map((lvl) => (
                        <div
                          key={lvl.id}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800 block">{lvl.name}</span>
                            <span className="text-[11px] font-mono text-emerald-700 font-bold">
                              {lvl.elevationText} ({lvl.datumType || 'FFL'})
                            </span>
                          </div>
                          <button
                            onClick={() => handleViewSource(lvl.region, `Level ${lvl.name}`)}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>[ VIEW SOURCE ]</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SCHEDULES */}
              {activeTab === 'schedules' && analysisRecord && (
                <div className="space-y-3">
                  {analysisRecord.schedules.map((sch) => (
                    <div key={sch.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">{sch.scheduleTitle}</span>
                        <button
                          onClick={() => handleViewSource(sch.region, sch.scheduleTitle)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>[ VIEW SOURCE ]</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sch.headers.map((h, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 5: OPEN ITEMS */}
              {activeTab === 'open_items' && analysisRecord && (
                <div className="space-y-3">
                  {analysisRecord.openItems.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-xs">
                      No open items or missing clarifications.
                    </div>
                  ) : (
                    analysisRecord.openItems.map((oi) => (
                      <div
                        key={oi.id}
                        className={`p-3.5 bg-white rounded-xl border transition-all ${
                          oi.status === 'RESOLVED'
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-amber-300 bg-amber-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-amber-900">{oi.problem}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            oi.status === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                          }`}>
                            {oi.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 mb-2">
                          <strong>Required:</strong> {oi.requiredInformation}
                        </p>

                        {oi.resolvedValue && (
                          <div className="p-2 bg-emerald-100/60 rounded text-xs text-emerald-950 font-bold mb-2">
                            Resolved Value: {oi.resolvedValue} ({oi.resolutionNote || 'Verified'})
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleViewSource(oi.region, `Open Item: ${oi.category}`)}
                            className="px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>[ VIEW SOURCE ]</span>
                          </button>

                          {oi.status !== 'RESOLVED' && (
                            <button
                              onClick={() => {
                                setResolvingOpenItem(oi);
                                setOpenItemResolutionVal('');
                                setOpenItemResolutionNote('');
                              }}
                              className="px-2.5 py-1 text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              [ RESOLVE / ENTER VALUE ]
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: CONFLICTS */}
              {activeTab === 'conflicts' && analysisRecord && (
                <div className="space-y-3">
                  {analysisRecord.conflicts.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 bg-white rounded-xl border border-slate-200 text-xs">
                      No cross-drawing or schedule conflicts detected.
                    </div>
                  ) : (
                    analysisRecord.conflicts.map((c) => (
                      <div
                        key={c.id}
                        className={`p-3.5 bg-white rounded-xl border transition-all ${
                          c.status.startsWith('RESOLVED')
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-rose-300 bg-rose-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-xs text-rose-900">{c.description}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status.startsWith('RESOLVED') ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                          }`}>
                            {c.status}
                          </span>
                        </div>

                        {/* Source A vs Source B comparison cards */}
                        <div className="grid grid-cols-2 gap-2 my-2.5">
                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-slate-500 block text-[10px] uppercase">Source A (Plan)</span>
                            <p className="font-bold text-slate-800">{c.valueA}</p>
                            <button
                              onClick={() => handleViewSource(c.sourceA, `Source A: ${c.valueA}`)}
                              className="text-[10px] text-indigo-600 font-bold hover:underline block pt-1"
                            >
                              [ VIEW SOURCE A ]
                            </button>
                          </div>

                          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                            <span className="font-bold text-slate-500 block text-[10px] uppercase">Source B (Schedule)</span>
                            <p className="font-bold text-slate-800">{c.valueB}</p>
                            <button
                              onClick={() => handleViewSource(c.sourceB, `Source B: ${c.valueB}`)}
                              className="text-[10px] text-indigo-600 font-bold hover:underline block pt-1"
                            >
                              [ VIEW SOURCE B ]
                            </button>
                          </div>
                        </div>

                        {/* Resolution details if resolved */}
                        {c.resolvedValue && (
                          <div className="p-2 bg-emerald-100 text-emerald-950 rounded text-xs font-bold mb-2">
                            Decision: {c.resolutionDecision} → {c.resolvedValue}
                          </div>
                        )}

                        {/* Resolution Trigger */}
                        {!c.status.startsWith('RESOLVED') && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => setResolvingConflict(c)}
                              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                            >
                              [ RESOLVE CONFLICT ]
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 7: AUDIT TRAIL */}
              {activeTab === 'audit_trail' && analysisRecord && (
                <div className="space-y-2">
                  {analysisRecord.auditTrail.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 bg-white rounded-xl border border-slate-200 text-xs font-mono flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{entry.actionType}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-sans">
                            {entry.actor}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-sans mt-0.5">{entry.note}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        {entry.timestamp.split('T')[1]?.slice(0, 8)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* HUMAN CORRECTION SUB-MODAL */}
      {editingElement && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                [ ENTER VALUE ] • {editingElement.elementType} {editingElement.mark}
              </h3>
              <button onClick={() => setEditingElement(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Length (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editGeom.length || ''}
                  onChange={(e) => setEditGeom({ ...editGeom, length: e.target.value })}
                  placeholder="e.g. 5.20"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Width (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editGeom.width || ''}
                  onChange={(e) => setEditGeom({ ...editGeom, width: e.target.value })}
                  placeholder="e.g. 0.40"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Depth / Height (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editGeom.depth || editGeom.height || ''}
                  onChange={(e) => setEditGeom({ ...editGeom, depth: e.target.value, height: e.target.value })}
                  placeholder="e.g. 3.00"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Thickness (m)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editGeom.thickness || ''}
                  onChange={(e) => setEditGeom({ ...editGeom, thickness: e.target.value })}
                  placeholder="e.g. 0.15"
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Engineer Note / Clarification Basis</label>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Reference section A-A / architectural note #4..."
                rows={2}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingElement(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCorrection}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow"
              >
                Save Measurement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLVE OPEN ITEM SUB-MODAL */}
      {resolvingOpenItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                [ RESOLVE OPEN ITEM ]
              </h3>
              <button onClick={() => setResolvingOpenItem(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-950 space-y-1">
              <p className="font-bold">{resolvingOpenItem.problem}</p>
              <p className="text-[11px] text-amber-900">{resolvingOpenItem.requiredInformation}</p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Provided Clarification / Value</label>
              <input
                type="text"
                value={openItemResolutionVal}
                onChange={(e) => setOpenItemResolutionVal(e.target.value)}
                placeholder="e.g. 230 mm wall thickness confirmed"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-bold font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Resolution Note / Drawing Basis</label>
              <textarea
                value={openItemResolutionNote}
                onChange={(e) => setOpenItemResolutionNote(e.target.value)}
                placeholder="Verified against architectural layout sheet A-102..."
                rows={2}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setResolvingOpenItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveOpenItem}
                disabled={!openItemResolutionVal.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESOLVE CONFLICT SUB-MODAL */}
      {resolvingConflict && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-sm text-slate-900">
                [ RESOLVE DRAWING CONFLICT ]
              </h3>
              <button onClick={() => setResolvingConflict(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-rose-900 bg-rose-50 p-2.5 rounded-lg font-bold">
              {resolvingConflict.description}
            </p>

            <div className="space-y-2">
              <button
                onClick={() => handleResolveConflict('USE_SOURCE_A')}
                className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left text-xs font-bold cursor-pointer transition-colors"
              >
                <span className="text-indigo-600 block text-[10px] uppercase">Option 1: Adopt Source A</span>
                <span>{resolvingConflict.valueA}</span>
              </button>

              <button
                onClick={() => handleResolveConflict('USE_SOURCE_B')}
                className="w-full p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left text-xs font-bold cursor-pointer transition-colors"
              >
                <span className="text-indigo-600 block text-[10px] uppercase">Option 2: Adopt Source B</span>
                <span>{resolvingConflict.valueB}</span>
              </button>
            </div>

            <div className="pt-2">
              <label className="font-bold text-slate-700 block mb-1 text-xs">Or Enter Custom Engineer Override</label>
              <input
                type="text"
                value={conflictCustomVal}
                onChange={(e) => setConflictCustomVal(e.target.value)}
                placeholder="e.g. 450x450 mm as confirmed by RFI-012"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
              {conflictCustomVal && (
                <button
                  onClick={() => handleResolveConflict('CUSTOM_VALUE')}
                  className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                >
                  Apply Custom Override
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
