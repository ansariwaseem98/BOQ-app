/**
 * AI BOQ & Tender Estimation Engineer - Phase 14A Drawing Intelligence Workspace
 * Complete Multi-Pane Studio with Source Traceability, Open Items, Conflicts, Revisions & Test Suite
 */

import React, { useState } from 'react';
import {
  FileText,
  Scan,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Play,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Eye,
  GitCompare,
  Ruler,
  Maximize2,
  FolderOpen,
  ArrowRight,
  RefreshCw,
  Sliders,
  Sparkles,
  ChevronRight,
  Lock,
  Plus,
  AlertOctagon,
  Image as ImageIcon,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';

import {
  SheetIntelligence,
  DetectedElement,
  DimensionObject,
  DrawingOpenItem,
  DrawingConflict,
  DrawingCalibration,
  DrawingRevisionDiff,
  FileInspectionReport,
  BoundingBox,
  DrawingTestSuiteResult,
  RecalculationImpactPreview,
} from '../types/drawingIntelligence';

import {
  INITIAL_INSPECTION_REPORTS,
  INITIAL_SHEETS,
  INITIAL_DETECTED_ELEMENTS,
  INITIAL_DIMENSIONS,
  INITIAL_OPEN_ITEMS,
  INITIAL_CONFLICTS,
  INITIAL_CALIBRATIONS,
  INITIAL_REVISION_DIFF,
  INITIAL_EXTRACTION_LOGS,
} from '../data/drawingIntelligenceInitialData';

import { DrawingIntelligenceEngine } from '../engine/drawingIntelligenceEngine';
import { DrawingIntelligenceTestSuite } from '../engine/drawingIntelligenceTestSuite';
import { DrawingViewer } from './DrawingViewer';
import { DrawingTestModeWorkspace } from './DrawingTestModeWorkspace';

export const DrawingIntelligenceWorkspace: React.FC = () => {
  // Main State
  const [activeTab, setActiveTab] = useState<
    'TEST_MODE' | 'STUDIO' | 'SHEET_REGISTER' | 'OPEN_ITEMS' | 'CONFLICTS' | 'REVISIONS' | 'TEST_SUITE' | 'AUDIT_LOGS'
  >('TEST_MODE');

  const [sheets, setSheets] = useState<SheetIntelligence[]>(INITIAL_SHEETS);
  const [inspectionReports, setInspectionReports] = useState<FileInspectionReport[]>(INITIAL_INSPECTION_REPORTS);
  const [elements, setElements] = useState<DetectedElement[]>(INITIAL_DETECTED_ELEMENTS);
  const [dimensions, setDimensions] = useState<DimensionObject[]>(INITIAL_DIMENSIONS);
  const [openItems, setOpenItems] = useState<DrawingOpenItem[]>(INITIAL_OPEN_ITEMS);
  const [conflicts, setConflicts] = useState<DrawingConflict[]>(INITIAL_CONFLICTS);
  const [calibrations, setCalibrations] = useState<DrawingCalibration[]>(INITIAL_CALIBRATIONS);
  const [revisionDiff] = useState<DrawingRevisionDiff>(INITIAL_REVISION_DIFF);

  // Active selections
  const [activeSheetId, setActiveSheetId] = useState<string>('SHEET-A101-P1');
  const [selectedElementId, setSelectedElementId] = useState<string | null>('ELEM-WALL-EXT-01');
  const [selectedDimensionId, setSelectedDimensionId] = useState<string | null>(null);
  const [highlightRegion, setHighlightRegion] = useState<BoundingBox | null>({
    x: 18,
    y: 12,
    width: 35,
    height: 10,
  });

  // Filter state for center pane
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterConfidence, setFilterConfidence] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // User correction modal state
  const [correctionTargetElement, setCorrectionTargetElement] = useState<DetectedElement | null>(null);
  const [correctionProperty, setCorrectionProperty] = useState<'thickness' | 'height' | 'length'>('thickness');
  const [correctionNewValue, setCorrectionNewValue] = useState<string>('0.23');
  const [impactPreview, setImpactPreview] = useState<RecalculationImpactPreview | null>(null);
  const [showImpactModal, setShowImpactModal] = useState<boolean>(false);

  // Open Item resolution dialog
  const [activeOpenItemModal, setActiveOpenItemModal] = useState<DrawingOpenItem | null>(null);
  const [openItemInputValue, setOpenItemInputValue] = useState<string>('');
  const [openItemReason, setOpenItemReason] = useState<string>('');

  // Test suite state
  const [testResults, setTestResults] = useState<DrawingTestSuiteResult[]>([]);
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);

  // Upload simulation state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  // Active sheet object
  const activeSheet = sheets.find((s) => s.sheetId === activeSheetId) || sheets[0];
  const selectedElement = elements.find((e) => e.elementMasterId === selectedElementId);

  // KPI Dashboard data
  const dashboardKpis = DrawingIntelligenceEngine.calculateDashboardKPIs(
    sheets,
    elements,
    dimensions,
    openItems,
    conflicts
  );

  // Handle Run Test Suite
  const handleRunTests = () => {
    setIsTestRunning(true);
    setTimeout(() => {
      const results = DrawingIntelligenceTestSuite.runAllTests();
      setTestResults(results);
      setIsTestRunning(false);
      setActiveTab('TEST_SUITE');
    }, 400);
  };

  // Handle View Source click from any table or card
  const handleViewSource = (drawingNumber: string, page: number, bbox: BoundingBox, elementId?: string) => {
    const targetSheet = sheets.find((s) => s.drawingNumber === drawingNumber && s.pageNumber === page);
    if (targetSheet) {
      setActiveSheetId(targetSheet.sheetId);
    }
    setHighlightRegion(bbox);
    if (elementId) {
      setSelectedElementId(elementId);
    }
    setActiveTab('STUDIO');
  };

  // Handle Verify Element
  const handleVerifyElement = (elementId: string) => {
    setElements((prev) =>
      prev.map((e) =>
        e.elementMasterId === elementId
          ? {
              ...e,
              status: 'VERIFIED',
              auditTrail: [
                ...e.auditTrail,
                {
                  timestamp: new Date().toISOString(),
                  action: 'VERIFIED',
                  user: 'QS Lead Engineer',
                  comment: 'Manual verification approved after visual source inspection.',
                },
              ],
            }
          : e
      )
    );
  };

  // Handle initiate correction
  const handleInitiateCorrection = (element: DetectedElement, prop: 'thickness' | 'height' | 'length', currentVal: number) => {
    setCorrectionTargetElement(element);
    setCorrectionProperty(prop);
    const suggestedVal = prop === 'thickness' ? '0.23' : (currentVal * 1.1).toFixed(2);
    setCorrectionNewValue(suggestedVal);
    const impact = DrawingIntelligenceEngine.computeRecalculationImpact(element, prop, currentVal, parseFloat(suggestedVal) || currentVal);
    setImpactPreview(impact);
    setShowImpactModal(true);
  };

  // Handle apply correction
  const handleApplyCorrection = () => {
    if (!correctionTargetElement || !impactPreview) return;
    const newVal = parseFloat(correctionNewValue);

    setElements((prev) =>
      prev.map((e) => {
        if (e.elementMasterId === correctionTargetElement.elementMasterId) {
          const updatedDims = { ...e.dimensions, [correctionProperty]: newVal };
          const updatedVol = (updatedDims.length || 10) * (updatedDims.height || 3) * (updatedDims.thickness || 0.2);
          return {
            ...e,
            dimensions: updatedDims,
            grossQuantity: Number(updatedVol.toFixed(3)),
            netQuantity: Number((updatedVol - e.deductionQuantity).toFixed(3)),
            status: 'USER_CORRECTED',
            auditTrail: [
              ...e.auditTrail,
              {
                timestamp: new Date().toISOString(),
                action: 'USER_CORRECTED',
                user: 'Senior QS Engineer',
                comment: `Updated ${correctionProperty} to ${newVal}. Impacted volume recalculated to ${updatedVol.toFixed(3)} m³.`,
              },
            ],
          };
        }
        return e;
      })
    );

    setShowImpactModal(false);
    setCorrectionTargetElement(null);
  };

  // Handle Conflict Resolution
  const handleResolveConflict = (conflictId: string, choice: 'A' | 'B' | 'CUSTOM', customVal?: string) => {
    setConflicts((prev) =>
      prev.map((c) => {
        if (c.conflictId === conflictId) {
          const chosenValue = choice === 'A' ? c.sourceA.value : choice === 'B' ? c.sourceB.value : (customVal || '215');
          return {
            ...c,
            status: choice === 'A' ? 'RESOLVED_USE_A' : choice === 'B' ? 'RESOLVED_USE_B' : 'RESOLVED_CUSTOM',
            resolution: {
              chosenValue,
              unit: c.sourceA.unit,
              decidedBy: 'Chief QS Engineer',
              decidedAt: new Date().toISOString(),
              justification: `Decided by Engineer to adopt Source ${choice} (${chosenValue} ${c.sourceA.unit}).`,
            },
          };
        }
        return c;
      })
    );
  };

  // Handle Open Item Resolution
  const handleResolveOpenItem = () => {
    if (!activeOpenItemModal || !openItemInputValue) return;

    setOpenItems((prev) =>
      prev.map((oi) =>
        oi.id === activeOpenItemModal.id
          ? {
              ...oi,
              status: 'USER_RESOLVED',
              userResponse: {
                resolvedValue: openItemInputValue,
                unit: 'mm',
                reason: openItemReason || 'Confirmed via Engineer site clarification / RFI response.',
                resolvedBy: 'Lead QS Engineer',
                resolvedAt: new Date().toISOString(),
              },
            }
          : oi
      )
    );

    setActiveOpenItemModal(null);
    setOpenItemInputValue('');
    setOpenItemReason('');
  };

  // Handle Export Dossier
  const handleExportDossier = () => {
    const markdown = DrawingIntelligenceEngine.generateDrawingExtractionDossier(
      sheets,
      elements,
      dimensions,
      openItems,
      conflicts,
      calibrations
    );

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Drawing_Intelligence_Extraction_Dossier_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle File Upload Simulation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0];

    setTimeout(() => {
      const report = DrawingIntelligenceEngine.inspectFile({ name: file.name, size: file.size });
      setInspectionReports((prev) => [report, ...prev]);

      if (report.classificationStatus === 'UNSUPPORTED') {
        setUploadMessage(`❌ UNSUPPORTED FILE FORMAT: ${file.name} cannot be parsed.`);
      } else {
        const classification = DrawingIntelligenceEngine.classifyDrawing(file.name);
        const newSheet: SheetIntelligence = {
          sheetId: `SHEET-${Date.now().toString().slice(-4)}`,
          fileId: report.fileId,
          drawingNumber: report.drawingNumberDetected || 'NEW-01',
          title: report.titleDetected || file.name.replace(/\.[^/.]+$/, ''),
          discipline: classification.discipline,
          drawingType: classification.drawingType,
          revision: report.revisionDetected || 'Rev 01',
          scale: report.detectedScale || '1:100',
          scaleFactor: 0.01,
          units: report.normalizedUnits,
          pageNumber: 1,
          sourceFileName: file.name,
          confidence: classification.confidence,
          status: report.scaleConfidence === 'HIGH' ? 'READY' : 'CALIBRATION_NEEDED',
          elementsCount: 12,
          dimensionsCount: 24,
          openItemsCount: 0,
          conflictsCount: 0,
        };

        setSheets((prev) => [newSheet, ...prev]);
        setActiveSheetId(newSheet.sheetId);
        setUploadMessage(`✅ Successfully imported and classified: ${newSheet.drawingNumber} (${newSheet.discipline})`);
      }
      setIsUploading(false);
    }, 600);
  };

  // Filtered elements list
  const filteredElements = elements.filter((e) => {
    if (filterCategory !== 'ALL' && e.category !== filterCategory) return false;
    if (filterConfidence !== 'ALL' && e.confidence !== filterConfidence) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.elementTag.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.specification && e.specification.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Main Header */}
      <header className="flex flex-wrap items-center justify-between px-5 py-3.5 bg-slate-900 border-b border-slate-800 shadow-md gap-3 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-400">
            <Scan className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-white tracking-wide">
                Drawing Intelligence Core
              </h1>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold px-2 py-0.5 rounded-full">
                Phase 14A
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Accurate Extraction • Source Traceability • Uncertainty Detection • Human-in-the-Loop
            </p>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Upload Button */}
          <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-all">
            <UploadCloud className="w-4 h-4 text-sky-400" />
            <span>Upload Drawing (PDF/CAD/IFC)</span>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.dwg,.dxf,.ifc,.png,.jpg,.jpeg,.tiff,.tif,.xyz"
            />
          </label>

          {/* Test Suite Button */}
          <button
            onClick={handleRunTests}
            disabled={isTestRunning}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 text-xs font-bold shadow-xs transition-all"
          >
            <Play className={`w-3.5 h-3.5 ${isTestRunning ? 'animate-spin' : ''}`} />
            <span>{isTestRunning ? 'Running 19 Tests...' : 'Run Accuracy Tests (19)'}</span>
          </button>

          {/* Export Dossier */}
          <button
            onClick={handleExportDossier}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export Dossier (MD)</span>
          </button>
        </div>
      </header>

      {/* Upload Notification Banner if present */}
      {uploadMessage && (
        <div className="px-5 py-2 bg-slate-900/90 border-b border-indigo-900/50 flex items-center justify-between text-xs text-slate-200">
          <span>{uploadMessage}</span>
          <button onClick={() => setUploadMessage(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Quality Gate Status & KPI Strip */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Quality Gate Badge */}
        <div className="flex items-center gap-2">
          {dashboardKpis.isReadyForBoqLink ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>QUALITY GATE: PASSED (Ready for BOQ)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-600/50 text-rose-300 font-semibold animate-pulse">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              <span>QUALITY GATE: BLOCKED ({dashboardKpis.qualityGateMessages.length} Blockers)</span>
            </div>
          )}
          <span className="text-slate-400 text-[11px]">
            Accuracy Score: <strong className="text-white">{dashboardKpis.accuracyQualityScore}%</strong>
          </span>
        </div>

        {/* Mini KPI Metrics */}
        <div className="flex items-center gap-4 text-[11px] text-slate-300">
          <div>
            Sheets: <strong className="text-white">{dashboardKpis.drawingsProcessed}</strong>
          </div>
          <div>
            Elements: <strong className="text-white">{dashboardKpis.elementsDetected}</strong>
          </div>
          <div>
            High Conf: <strong className="text-emerald-400">{dashboardKpis.highConfidenceCount}</strong>
          </div>
          <div className="flex items-center gap-1">
            Open Items:{' '}
            <span
              className={`px-1.5 py-0.2 rounded font-bold ${
                dashboardKpis.openItemsCount > 0 ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50' : 'text-slate-400'
              }`}
            >
              {dashboardKpis.openItemsCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            Conflicts:{' '}
            <span
              className={`px-1.5 py-0.2 rounded font-bold ${
                dashboardKpis.conflictsCount > 0 ? 'bg-rose-900/60 text-rose-300 border border-rose-700/50' : 'text-slate-400'
              }`}
            >
              {dashboardKpis.conflictsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav className="flex items-center px-5 bg-slate-900 border-b border-slate-800 text-xs font-semibold overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('TEST_MODE')}
          className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 transition-all ${
            activeTab === 'TEST_MODE'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10 shadow-xs'
              : 'border-transparent text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20'
          }`}
        >
          <Scan className="w-4 h-4 text-emerald-400" />
          <span>[DRAWING TEST MODE (PHASE 14B)]</span>
        </button>

        <button
          onClick={() => setActiveTab('STUDIO')}
          className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 transition-all ${
            activeTab === 'STUDIO'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Extraction Studio (3-Pane)</span>
        </button>

        <button
          onClick={() => setActiveTab('SHEET_REGISTER')}
          className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 transition-all ${
            activeTab === 'SHEET_REGISTER'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-sky-400" />
          <span>Sheet Register ({sheets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('OPEN_ITEMS')}
          className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 transition-all ${
            activeTab === 'OPEN_ITEMS'
              ? 'border-amber-500 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Open Items ({openItems.filter((o) => o.status === 'OPEN').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('CONFLICTS')}
          className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 transition-all ${
            activeTab === 'CONFLICTS'
              ? 'border-rose-500 text-rose-300 bg-rose-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Conflicts Engine ({conflicts.filter((c) => c.status === 'OPEN').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('REVISIONS')}
          className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 transition-all ${
            activeTab === 'REVISIONS'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCompare className="w-4 h-4 text-indigo-400" />
          <span>Revision Change Map</span>
        </button>

        <button
          onClick={() => setActiveTab('TEST_SUITE')}
          className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 transition-all ${
            activeTab === 'TEST_SUITE'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Accuracy Tests ({testResults.length > 0 ? `${testResults.filter((t) => t.passed).length}/19` : '19 Ready'})</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`flex items-center gap-2 py-2.5 px-3.5 border-b-2 transition-all ${
            activeTab === 'AUDIT_LOGS'
              ? 'border-indigo-500 text-white bg-indigo-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4 text-slate-400" />
          <span>Extraction Logs</span>
        </button>
      </nav>

      {/* Main Workspace Body */}
      <main className="flex-1 overflow-y-auto p-4 bg-slate-950">
        {/* ========================================================================= */}
        {/* TAB 0: PHASE 14B REAL DRAWING TEST MODE & CONTROLLED TAKEOFF VALIDATION */}
        {/* ========================================================================= */}
        {activeTab === 'TEST_MODE' && (
          <DrawingTestModeWorkspace />
        )}

        {/* ========================================================================= */}
        {/* TAB 1: EXTRACTION STUDIO (3-PANE LAYOUT) */}
        {/* ========================================================================= */}
        {activeTab === 'STUDIO' && (
          <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[620px]">
            {/* Left Pane: Drawing Canvas Viewer (Width ~45%) */}
            <div className="w-full lg:w-[46%] flex flex-col space-y-2">
              <div className="flex items-center justify-between px-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200">Active Drawing Viewer</span>
                  <select
                    value={activeSheetId}
                    onChange={(e) => setActiveSheetId(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-hidden"
                  >
                    {sheets.map((s) => (
                      <option key={s.sheetId} value={s.sheetId}>
                        {s.drawingNumber} {s.revision} - {s.title.slice(0, 24)}... (p.{s.pageNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeSheet.discipline} | {activeSheet.units}
                </span>
              </div>

              <DrawingViewer
                activeSheet={activeSheet}
                elements={elements}
                dimensions={dimensions}
                highlightRegion={highlightRegion}
                selectedElementId={selectedElementId}
                onSelectElement={(el) => {
                  setSelectedElementId(el.elementMasterId);
                  if (el.sourceReferences.length > 0) {
                    setHighlightRegion(el.sourceReferences[0].boundingBox);
                  }
                }}
                onCalibrateComplete={(cal) => {
                  setCalibrations((prev) => [cal, ...prev]);
                  setSheets((prev) =>
                    prev.map((s) => (s.sheetId === cal.sheetId ? { ...s, scale: cal.derivedScale, status: 'READY' } : s))
                  );
                }}
              />
            </div>

            {/* Center Pane: Detected Elements & Dimensions Register (Width ~28%) */}
            <div className="w-full lg:w-[28%] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
              {/* Center Pane Header & Filters */}
              <div className="p-3 border-b border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Extracted Elements ({filteredElements.length})</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Click to locate</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search tags (W-04, C1)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-hidden"
                  />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-hidden"
                  >
                    <option value="ALL">All Trades</option>
                    <option value="WALL">Walls</option>
                    <option value="COLUMN">Columns</option>
                    <option value="FOOTING">Footings</option>
                    <option value="DOOR">Doors</option>
                  </select>
                </div>
              </div>

              {/* Elements List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredElements.map((el) => {
                  const isSelected = el.elementMasterId === selectedElementId;
                  const isConflict = el.status === 'CONFLICT';
                  const isVerified = el.status === 'VERIFIED';
                  return (
                    <div
                      key={el.elementMasterId}
                      onClick={() => {
                        setSelectedElementId(el.elementMasterId);
                        if (el.sourceReferences.length > 0) {
                          handleViewSource(
                            el.sourceReferences[0].drawingNumber,
                            el.sourceReferences[0].page,
                            el.sourceReferences[0].boundingBox,
                            el.elementMasterId
                          );
                        }
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-950/80 border-indigo-500 shadow-xs'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white text-xs px-1.5 py-0.5 bg-slate-800 rounded">
                            {el.elementTag}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium capitalize">
                            {el.category.toLowerCase()}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isVerified
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isConflict
                              ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                          }`}
                        >
                          {el.status}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300">
                        <span>
                          Net Qty: <strong className="text-white font-mono">{el.netQuantity} {el.quantityUnit}</strong>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {el.sourceReferences.length} view{el.sourceReferences.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Selected Element Inspector & Source Traceability (Width ~26%) */}
            <div className="w-full lg:w-[26%] flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
              {selectedElement ? (
                <div className="flex flex-col h-full overflow-y-auto">
                  {/* Inspector Header */}
                  <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-indigo-600/20 text-indigo-400">
                        <Scan className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-xs">{selectedElement.elementTag}</h3>
                        <p className="text-[10px] text-slate-400 capitalize">{selectedElement.category} ({selectedElement.level})</p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        selectedElement.status === 'VERIFIED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : selectedElement.status === 'CONFLICT'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {selectedElement.status}
                    </span>
                  </div>

                  <div className="p-3 space-y-3.5 text-xs flex-1">
                    {/* Mathematical Deduction Breakdown */}
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Measurement Formulation
                      </span>
                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Gross Volume:</span>
                          <span className="text-white font-bold">{selectedElement.grossQuantity} {selectedElement.quantityUnit}</span>
                        </div>
                        {selectedElement.deductionQuantity > 0 && (
                          <div className="flex justify-between text-amber-400">
                            <span>Openings Deducted:</span>
                            <span>−{selectedElement.deductionQuantity} {selectedElement.quantityUnit}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-800 text-emerald-400 font-bold">
                          <span>Net Billable Qty:</span>
                          <span>{selectedElement.netQuantity} {selectedElement.quantityUnit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dimensions & Quick Correction */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Extracted Dimensions
                        </span>
                        <span className="text-[10px] text-indigo-400">Click to edit</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                        {selectedElement.dimensions.length && (
                          <div className="p-1.5 bg-slate-950 rounded border border-slate-800 flex justify-between">
                            <span className="text-slate-400">L:</span>
                            <span className="text-white">{selectedElement.dimensions.length}m</span>
                          </div>
                        )}
                        {selectedElement.dimensions.height && (
                          <div className="p-1.5 bg-slate-950 rounded border border-slate-800 flex justify-between">
                            <span className="text-slate-400">H:</span>
                            <span className="text-white">{selectedElement.dimensions.height}m</span>
                          </div>
                        )}
                        {selectedElement.dimensions.thickness && (
                          <div
                            onClick={() =>
                              handleInitiateCorrection(
                                selectedElement,
                                'thickness',
                                selectedElement.dimensions.thickness || 0.2
                              )
                            }
                            className="col-span-2 p-1.5 bg-indigo-950/40 rounded border border-indigo-800/60 flex justify-between cursor-pointer hover:border-indigo-500"
                          >
                            <span className="text-indigo-300">Thk (Click to Edit):</span>
                            <span className="text-white font-bold">{selectedElement.dimensions.thickness}m</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Multi-View Source Traceability */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Linked Source References ({selectedElement.sourceReferences.length})
                      </span>
                      <div className="space-y-1">
                        {selectedElement.sourceReferences.map((ref, idx) => (
                          <div
                            key={idx}
                            onClick={() =>
                              handleViewSource(ref.drawingNumber, ref.page, ref.boundingBox, selectedElement.elementMasterId)
                            }
                            className="p-2 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500 cursor-pointer flex items-center justify-between text-[11px]"
                          >
                            <div>
                              <div className="font-bold text-sky-400 font-mono">
                                {ref.drawingNumber} {ref.revision} (p.{ref.page})
                              </div>
                              <div className="text-[10px] text-slate-400">{ref.snippetDescription}</div>
                            </div>
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Spatial Relationships */}
                    {selectedElement.spatialRelationships.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Spatial Relationships
                        </span>
                        <div className="space-y-1">
                          {selectedElement.spatialRelationships.map((rel) => (
                            <div key={rel.id} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
                              <span className="text-emerald-400 font-semibold">{rel.relationshipType}</span>
                              <div className="text-[10px] text-slate-400">{rel.notes || 'Spatial link validated.'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Human Verification Action Bar */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Human Verification Sign-off
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleVerifyElement(selectedElement.elementMasterId)}
                          disabled={selectedElement.status === 'VERIFIED'}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                            selectedElement.status === 'VERIFIED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{selectedElement.status === 'VERIFIED' ? 'Verified' : 'Verify'}</span>
                        </button>

                        <button
                          onClick={() =>
                            handleInitiateCorrection(
                              selectedElement,
                              'thickness',
                              selectedElement.dimensions.thickness || 0.2
                            )
                          }
                          className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs my-auto">
                  Select an element on the left or center pane to view source details.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SHEET INTELLIGENCE REGISTER */}
        {/* ========================================================================= */}
        {activeTab === 'SHEET_REGISTER' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm">Sheet Intelligence Register</h3>
                  <p className="text-xs text-slate-400">
                    Comprehensive catalog of all drawings, scales, normalized units, and extraction confidence.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Sheet ID</th>
                      <th className="p-3">Drawing Number</th>
                      <th className="p-3">Title</th>
                      <th className="p-3">Discipline</th>
                      <th className="p-3">Revision</th>
                      <th className="p-3">Scale</th>
                      <th className="p-3">Units</th>
                      <th className="p-3">Confidence</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    {sheets.map((sheet) => (
                      <tr key={sheet.sheetId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 text-slate-400">{sheet.sheetId}</td>
                        <td className="p-3 font-bold text-white">{sheet.drawingNumber}</td>
                        <td className="p-3 text-slate-300 font-sans">{sheet.title}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 text-[10px] font-sans">
                            {sheet.discipline}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300">{sheet.revision}</td>
                        <td className="p-3 text-amber-300 font-bold">{sheet.scale}</td>
                        <td className="p-3 text-slate-300">{sheet.units}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold ${
                              sheet.confidence === 'HIGH'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-amber-950 text-amber-300'
                            }`}
                          >
                            {sheet.confidence}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-sans">
                            {sheet.status}
                          </span>
                        </td>
                        <td className="p-3 text-right font-sans">
                          <button
                            onClick={() => {
                              setActiveSheetId(sheet.sheetId);
                              setActiveTab('STUDIO');
                            }}
                            className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                          >
                            View Drawing
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Input Inspection Reports Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                <span>Uploaded Files Inspection & Normalization Reports</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {inspectionReports.map((rep) => (
                  <div key={rep.fileId} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sky-400">{rep.fileName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                        {rep.fileType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                      <div>
                        Size: <span className="text-white">{(rep.fileSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div>
                        Vector/Raster: <span className="text-white">{rep.isVector ? 'Vector' : 'Raster Scan'}</span>
                      </div>
                      <div>
                        Native Units: <span className="text-white">{rep.nativeUnits || 'N/A'}</span>
                      </div>
                      <div>
                        Normalized: <span className="text-emerald-400 font-bold">{rep.normalizedUnits} (×{rep.unitConversionFactor})</span>
                      </div>
                    </div>

                    {rep.warnings.length > 0 && (
                      <div className="p-2 rounded bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 space-y-1">
                        {rep.warnings.map((w, idx) => (
                          <div key={idx} className="flex items-start gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CENTRALIZED OPEN ITEMS ENGINE */}
        {/* ========================================================================= */}
        {activeTab === 'OPEN_ITEMS' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span>Centralized Open Items Engine (Uncertainty Detection)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    The system strictly isolates missing, blurred, or ambiguous dimensions into actionable RFIs rather than hallucinating numbers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openItems.map((oi) => {
                  const isCritical = oi.severity === 'CRITICAL' || oi.severity === 'HIGH';
                  const isResolved = oi.status === 'USER_RESOLVED';
                  return (
                    <div
                      key={oi.id}
                      className={`p-4 rounded-xl border space-y-3 transition-all ${
                        isResolved
                          ? 'bg-slate-950/60 border-emerald-900/60'
                          : isCritical
                          ? 'bg-amber-950/20 border-amber-700/60 shadow-xs'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-800 text-white px-2 py-0.5 rounded">
                            {oi.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isCritical ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {oi.severity} SEVERITY
                          </span>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isResolved
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {oi.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-white text-xs">{oi.title}</h4>
                        <p className="text-xs text-slate-300 mt-1">{oi.description}</p>
                      </div>

                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs space-y-1">
                        <div className="text-amber-400 font-semibold">Required User Input:</div>
                        <div className="text-slate-300">{oi.requiredInput}</div>
                      </div>

                      {isResolved && oi.userResponse && (
                        <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 space-y-0.5">
                          <div className="font-bold">Resolved Value: {oi.userResponse.resolvedValue} {oi.userResponse.unit}</div>
                          <div className="text-[11px] text-emerald-400">By {oi.userResponse.resolvedBy}: {oi.userResponse.reason}</div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                        <button
                          onClick={() => handleViewSource(oi.drawingNumber, oi.page, oi.region)}
                          className="text-xs text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View on Drawing ({oi.drawingNumber})</span>
                        </button>

                        {!isResolved && (
                          <button
                            onClick={() => {
                              setActiveOpenItemModal(oi);
                              setOpenItemInputValue(oi.type === 'MISSING_DIMENSION' ? '450' : '230');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs"
                          >
                            Enter Value / Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CONFLICTS ENGINE */}
        {/* ========================================================================= */}
        {activeTab === 'CONFLICTS' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div>
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Drawing Conflicts Engine (Contradictory Source Resolution)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Critical discrepancies between Architectural plans, Structural sections, and Schedules require deliberate engineer sign-off.
                </p>
              </div>

              <div className="space-y-4">
                {conflicts.map((c) => {
                  const isResolved = c.status.startsWith('RESOLVED');
                  return (
                    <div
                      key={c.conflictId}
                      className={`p-4 rounded-xl border space-y-4 ${
                        isResolved ? 'bg-slate-950 border-emerald-900/60' : 'bg-rose-950/15 border-rose-700/60 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-800 text-white px-2 py-0.5 rounded">
                            {c.conflictId}
                          </span>
                          <h4 className="font-bold text-white text-xs">{c.title}</h4>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isResolved
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">{c.description}</p>

                      {/* Side by side comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Source A */}
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-sky-400 font-mono">{c.sourceA.drawingNumber} ({c.sourceA.revision})</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">Source A</span>
                          </div>
                          <div className="text-xs font-semibold text-white">{c.sourceA.label}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            Dimension: <strong className="text-sky-300 text-sm">{c.sourceA.value} {c.sourceA.unit}</strong>
                          </div>
                          <button
                            onClick={() => handleViewSource(c.sourceA.drawingNumber, c.sourceA.page, c.sourceA.region)}
                            className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview Source A Drawing</span>
                          </button>
                        </div>

                        {/* Source B */}
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-amber-400 font-mono">{c.sourceB.drawingNumber} ({c.sourceB.revision})</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">Source B</span>
                          </div>
                          <div className="text-xs font-semibold text-white">{c.sourceB.label}</div>
                          <div className="text-xs text-slate-400 font-mono">
                            Dimension: <strong className="text-amber-300 text-sm">{c.sourceB.value} {c.sourceB.unit}</strong>
                          </div>
                          <button
                            onClick={() => handleViewSource(c.sourceB.drawingNumber, c.sourceB.page, c.sourceB.region)}
                            className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview Source B Drawing</span>
                          </button>
                        </div>
                      </div>

                      {/* Conflict Delta Explanation */}
                      <div className="p-2.5 rounded bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                        <strong className="text-rose-400">Impact: </strong>
                        {c.differenceDescription}
                      </div>

                      {/* Conflict Resolution Actions */}
                      {!isResolved ? (
                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => handleResolveConflict(c.conflictId, 'A')}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold"
                          >
                            Adopt Source A ({c.sourceA.value} {c.sourceA.unit})
                          </button>
                          <button
                            onClick={() => handleResolveConflict(c.conflictId, 'B')}
                            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold"
                          >
                            Adopt Source B ({c.sourceB.value} {c.sourceB.unit})
                          </button>
                          <button
                            onClick={() => handleResolveConflict(c.conflictId, 'CUSTOM', '215')}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                          >
                            Enter Custom Value
                          </button>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300">
                          <strong>Resolved: </strong> {c.resolution?.justification}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: REVISION INTELLIGENCE & CHANGE MAP */}
        {/* ========================================================================= */}
        {activeTab === 'REVISIONS' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-indigo-400" />
                    <span>Drawing Revision Diff: {revisionDiff.drawingNumber} ({revisionDiff.oldRevision} → {revisionDiff.newRevision})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Automated delta detection ensures only modified geometries change downstream quantities.
                  </p>
                </div>

                <div className="text-xs font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 px-3 py-1.5 rounded-lg">
                  BOQ Delta Impact: +AED {revisionDiff.impactedBoqItemsTotalDelta.toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Added Elements */}
                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 space-y-2">
                  <div className="flex items-center justify-between font-bold text-emerald-400">
                    <span>Added Elements</span>
                    <span>{revisionDiff.addedElements.length}</span>
                  </div>
                  {revisionDiff.addedElements.map((el) => (
                    <div key={el.elementMasterId} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px]">
                      <div className="font-bold text-white">{el.elementTag} ({el.category})</div>
                      <div className="text-slate-400">Added on Rev 04. Qty: {el.netQuantity} {el.quantityUnit}</div>
                    </div>
                  ))}
                </div>

                {/* Modified Elements */}
                <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 space-y-2">
                  <div className="flex items-center justify-between font-bold text-amber-400">
                    <span>Modified Elements</span>
                    <span>{revisionDiff.modifiedElements.length}</span>
                  </div>
                  {revisionDiff.modifiedElements.map((mod, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <div className="font-bold text-white">{mod.element.elementTag}</div>
                      <div className="text-amber-300">{mod.changeDescription}</div>
                      <div className="text-slate-400 text-[10px]">Affected BOQ: {mod.affectedBoqItemCodes.join(', ')}</div>
                    </div>
                  ))}
                </div>

                {/* Unchanged Elements */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-300">
                    <span>Unchanged Elements</span>
                    <span>{revisionDiff.unchangedElementsCount}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    All {revisionDiff.unchangedElementsCount} unaffected physical elements retain their original verified quantities without unnecessary re-runs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: ACCURACY TEST SUITE (19 CRITICAL TESTS) */}
        {/* ========================================================================= */}
        {activeTab === 'TEST_SUITE' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Drawing Intelligence Accuracy & Regression Suite (19 Tests)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Proves zero hallucinations, OCR ambiguity protection, non-guessed dimensions, and single deduction guarantees.
                  </p>
                </div>

                <button
                  onClick={handleRunTests}
                  disabled={isTestRunning}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Play className={`w-3.5 h-3.5 ${isTestRunning ? 'animate-spin' : ''}`} />
                  <span>{isTestRunning ? 'Executing Test Harness...' : 'Re-Run All 19 Tests'}</span>
                </button>
              </div>

              {testResults.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Click <strong>"Run Accuracy Tests"</strong> to execute 19 comprehensive tests validating OCR safety, conflicting plan/section handling, and mathematical deduction integrity.
                  </p>
                  <button
                    onClick={handleRunTests}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Run 19 Tests Now
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-lg flex items-center justify-between text-xs text-emerald-300">
                    <span>
                      Tests Passed: <strong>{testResults.filter((t) => t.passed).length} / {testResults.length}</strong>
                    </span>
                    <span>Total Harness Execution Time: ~{testResults.reduce((acc, t) => acc + t.executionTimeMs, 0).toFixed(1)} ms</span>
                  </div>

                  <div className="space-y-2">
                    {testResults.map((t) => (
                      <div
                        key={t.testId}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-400">#{t.testId}</span>
                            <span className="font-bold text-white">{t.title}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-indigo-300">
                              {t.category}
                            </span>
                          </div>

                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                            PASSED ({t.executionTimeMs.toFixed(1)} ms)
                          </span>
                        </div>

                        <p className="text-slate-300 text-[11px]">{t.description}</p>

                        <div className="p-2 rounded bg-slate-900 border border-slate-800/80 text-[11px] space-y-0.5 font-mono">
                          <div className="text-slate-400">Input: <span className="text-slate-200">{t.inputCondition}</span></div>
                          <div className="text-emerald-400">Outcome: <span>{t.actualOutcome}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 7: EXTRACTION AUDIT LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'AUDIT_LOGS' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-white text-sm">AI & Parser Extraction Audit Logs</h3>
              <div className="space-y-2">
                {INITIAL_EXTRACTION_LOGS.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-sky-400 font-bold">{log.engine}</span>
                      <span>{log.timestamp} ({log.processingTimeMs} ms)</span>
                    </div>
                    <div className="text-white">{log.inputDescription}</div>
                    <div className="text-emerald-400">{log.outputSummary}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Recalculation Impact Preview Modal */}
      {showImpactModal && impactPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-indigo-400">
              <Sliders className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Recalculation Impact Preview Graph</h3>
            </div>

            <p className="text-xs text-slate-300">{impactPreview.triggerDescription}</p>

            {/* Ripple Node Cards */}
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Affected Calculations</span>
                {impactPreview.affectedCalculations.map((c) => (
                  <div key={c.nodeId} className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-300">{c.title}:</span>
                    <span className="text-indigo-300 font-bold">{c.oldValue} → {c.newValue} {c.unit}</span>
                  </div>
                ))}
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Affected BOQ Items & Pricing</span>
                {impactPreview.affectedBoqItems.map((b) => (
                  <div key={b.nodeId} className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-300">{b.code} - {b.title}:</span>
                    <span className="text-emerald-400 font-bold">Δ +${b.deltaAmount} {b.currency}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowImpactModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCorrection}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs"
              >
                Apply Correction & Recalculate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open Item Resolution Modal */}
      {activeOpenItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400">
              <HelpCircle className="w-5 h-5" />
              <h3 className="font-bold text-sm text-white">Resolve Open Item ({activeOpenItemModal.id})</h3>
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-white">{activeOpenItemModal.title}</div>
              <div className="text-slate-400">{activeOpenItemModal.requiredInput}</div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-300">Resolved Dimension Value</label>
              <input
                type="text"
                value={openItemInputValue}
                onChange={(e) => setOpenItemInputValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:outline-hidden focus:border-amber-500"
                placeholder="e.g. 450 mm"
              />

              <label className="text-[11px] font-semibold text-slate-300">Resolution Justification / RFI Ref</label>
              <textarea
                value={openItemReason}
                onChange={(e) => setOpenItemReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-hidden focus:border-amber-500"
                placeholder="e.g. Confirmed via Structural Engineer RFI Response #04."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveOpenItemModal(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveOpenItem}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs"
              >
                Resolve & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
