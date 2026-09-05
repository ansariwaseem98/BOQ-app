import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Box,
  Download,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
  Calendar,
  HardDrive,
  Info,
  Clock,
  Eye,
  GitCompare,
  HelpCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ProjectDocument, ProjectRecord } from '../types';
import { DocumentStorageService } from '../services/documentStorage';
import { Phase18DrawingAnalysisModal } from './Phase18DrawingAnalysisModal';
import { AutoCAD2021Modal } from './AutoCAD2021Modal';
import { AutoCAD2021IntegrationEngine } from '../engine/autocad2021IntegrationEngine';
import { Phase18AnalysisStorage } from '../services/phase18AnalysisStorage';
import { Phase18RealDrawingAnalysisEngine } from '../engine/phase18RealDrawingAnalysisEngine';
import { DrawingAnalysisMasterRecord, AnalysisProcessingStage, AnalysisProcessingStatus } from '../types/phase18AnalysisTypes';

interface DrawingDetailsModalProps {
  document: ProjectDocument | null;
  project?: ProjectRecord;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUpdated?: (updatedDoc: ProjectDocument) => void;
  onUpdateDocument?: (updatedDoc: ProjectDocument) => void;
}

export const DrawingDetailsModal: React.FC<DrawingDetailsModalProps> = ({
  document: doc,
  project,
  isOpen,
  onClose,
  onDocumentUpdated,
  onUpdateDocument,
}) => {
  const triggerUpdate = (updated: ProjectDocument) => {
    if (onDocumentUpdated) onDocumentUpdated(updated);
    if (onUpdateDocument) onUpdateDocument(updated);
  };
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<AnalysisProcessingStage>('IDLE');
  const [stageProgressMessage, setStageProgressMessage] = useState<string | null>(null);
  const [processMessage, setProcessMessage] = useState<string | null>(null);
  const [processError, setProcessError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [analysisRecord, setAnalysisRecord] = useState<DrawingAnalysisMasterRecord | null>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState<boolean>(false);
  const [isAutoCADModalOpen, setIsAutoCADModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!doc) return;

    setZoomLevel(100);
    setCurrentPage(1);
    setProcessMessage(null);
    setProcessError(null);
    setCurrentStage('IDLE');
    setStageProgressMessage(null);

    // Retrieve original binary blob from IndexedDB for preview
    let isMounted = true;
    DocumentStorageService.getDocumentOriginalBlob(doc.id).then((blob) => {
      if (!isMounted) return;
      if (blob) {
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
      } else if (doc.previewDataUrl) {
        setBlobUrl(doc.previewDataUrl);
      }
    });

    // Load Phase 18A analysis record if exists
    Phase18AnalysisStorage.getAnalysisRecord(doc.id).then((record) => {
      if (isMounted && record) {
        setAnalysisRecord(record);
      }
    });

    return () => {
      isMounted = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [doc?.id]);

  if (!isOpen || !doc) return null;

  const totalPages = doc.pageCount || 1;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoomLevel(100);

  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));

  const handleProcessDrawing = async () => {
    setIsProcessing(true);
    setProcessMessage(null);
    setProcessError(null);
    setCurrentStage('Reading File');

    try {
      const activeProject: ProjectRecord = project || {
        id: doc.projectId || 'PRJ-DEFAULT',
        name: 'Active Project',
        description: '',
        status: 'Active',
        lastModified: new Date().toISOString(),
        takeoffProgress: 0,
        unresolvedClarifications: 0,
        currency: 'AED',
        unitSystem: 'Metric'
      };

      const record = await Phase18RealDrawingAnalysisEngine.analyzeDocument(
        doc,
        activeProject,
        (stage, stageNum, total, message) => {
          setCurrentStage(stage);
          setStageProgressMessage(`[Stage ${stageNum}/${total}] ${message}`);
        }
      );

      await Phase18AnalysisStorage.saveAnalysisRecord(record);
      setAnalysisRecord(record);
      setProcessMessage(`Extraction complete: ${record.elements.length} elements detected, ${record.openItems.length} open items identified.`);

      // Also update document status in storage
      const updatedDoc = await DocumentStorageService.getDocumentById(doc.id);
      if (updatedDoc) {
        updatedDoc.status = record.status === 'ANALYZED' ? 'PROCESSED' : 'PROCESSING';
        updatedDoc.detectedElementsCount = record.elements.length;
        updatedDoc.openItemsCount = record.openItems.length;
        triggerUpdate(updatedDoc);
      }
    } catch (err: any) {
      console.error('Process error:', err);
      setProcessError(err?.message || 'Unexpected failure during drawing analysis.');
      setCurrentStage('FAILED');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    DocumentStorageService.downloadOriginalFile(doc);
  };

  const handleOpenInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  const getAnalysisStatusBadge = () => {
    const status: AnalysisProcessingStatus = isProcessing 
      ? 'ANALYZING' 
      : (analysisRecord?.status || (doc.status === 'PROCESSED' ? 'ANALYZED' : 'NOT ANALYZED'));

    switch (status) {
      case 'ANALYZED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ANALYZED</span>
          </span>
        );
      case 'REVIEW REQUIRED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>REVIEW REQUIRED</span>
          </span>
        );
      case 'ANALYZING':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
            <span>ANALYZING...</span>
          </span>
        );
      case 'PARTIALLY ANALYZED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>PARTIALLY ANALYZED</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>FAILED</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>NOT ANALYZED</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-inner">
              {doc.fileFormat === 'PDF' ? (
                <FileText className="w-5 h-5" />
              ) : doc.fileFormat === 'Image' || doc.fileFormat === 'Sketch' ? (
                <ImageIcon className="w-5 h-5" />
              ) : (
                <Box className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight uppercase truncate max-w-lg">
                  {doc.title || doc.sourceFileName}
                </h2>
                <span className="text-xs font-mono font-bold bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700">
                  {doc.drawingNumber || doc.id}
                </span>
                {getAnalysisStatusBadge()}
              </div>
              <p className="text-xs text-slate-400">
                Project: <strong className="text-slate-200">{doc.projectId}</strong> • {doc.discipline} • {doc.revision} • {totalPages} Page(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoCADModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm border border-rose-500 transition-all cursor-pointer"
              title="Open drawing in Autodesk AutoCAD 2021"
            >
              <span className="w-3.5 h-3.5 rounded bg-white/20 flex items-center justify-center text-[9px] font-black">A</span>
              <span>AutoCAD 2021</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              title="Download original uploaded file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Preview (70%) + Right Details Panel (30%) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Live Preview Canvas / PDF Viewer */}
          <div className="flex-1 bg-slate-950/95 flex flex-col border-r border-slate-800 relative">
            
            {/* Viewport Toolbar */}
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] w-12 text-center">{zoomLevel}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold"
                >
                  Reset
                </button>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[11px]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenInNewTab}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                  title="Open drawing in new browser window"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Fullscreen</span>
                </button>
              </div>
            </div>

            {/* Drawing Preview Area */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-900/50">
              {blobUrl ? (
                doc.fileFormat === 'PDF' ? (
                  <div
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
                    className="w-full h-full flex items-center justify-center transition-transform duration-100"
                  >
                    <iframe
                      src={`${blobUrl}#toolbar=0&page=${currentPage}`}
                      title={doc.title}
                      className="w-full h-full rounded-lg bg-white shadow-2xl border border-slate-700 min-h-[500px]"
                    />
                  </div>
                ) : (
                  <div
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
                    className="transition-transform duration-100 max-w-full max-h-full flex items-center justify-center"
                  >
                    <img
                      src={blobUrl}
                      alt={doc.title}
                      className="max-w-full max-h-[600px] object-contain rounded-lg shadow-2xl border border-slate-700"
                    />
                  </div>
                )
              ) : (
                <div className="text-center text-slate-500 space-y-2">
                  <Box className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">Binary Document Preview</p>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {doc.fileFormat === 'DWG' || doc.fileFormat === 'IFC'
                      ? 'CAD/BIM container file stored in IndexedDB. Use [ Process Drawing ] to run parser.'
                      : 'Rendering document buffer...'}
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT: Document Inspector & Process Controls (340px) */}
          <div className="w-84 bg-white flex flex-col overflow-y-auto p-5 space-y-5">
            
            {/* Primary Action: Process Drawing */}
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Drawing Analysis</span>
                </span>
                {getAnalysisStatusBadge()}
              </div>

              <p className="text-xs text-indigo-950 leading-relaxed">
                Run Phase 18A OCR, grid extraction, level detection, schedules, and cross-drawing validation.
              </p>

              {/* Progress Stage Indicator during active analysis */}
              {isProcessing && (
                <div className="p-2.5 bg-indigo-100/70 border border-indigo-200 rounded-lg text-xs space-y-1">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Stage: {currentStage}</span>
                  </div>
                  {stageProgressMessage && (
                    <p className="text-[11px] text-indigo-800 font-mono">{stageProgressMessage}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={handleProcessDrawing}
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-black tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>ANALYZING DRAWING...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>[ ANALYZE DRAWING ]</span>
                    </>
                  )}
                </button>

                {analysisRecord && (
                  <button
                    onClick={() => setIsAnalysisModalOpen(true)}
                    className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-50 border border-indigo-300 text-indigo-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>[ OPEN ANALYSIS WORKSPACE ]</span>
                  </button>
                )}
              </div>

              {/* Success / Parser Notice Message */}
              {processMessage && !isProcessing && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Analysis Complete</span>
                  </div>
                  <p className="text-[11px] text-emerald-800">{processMessage}</p>
                </div>
              )}

              {/* Error Message & Retry */}
              {processError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>ANALYSIS FAILED</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-snug">{processError}</p>
                  <button
                    onClick={handleProcessDrawing}
                    className="w-full py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors cursor-pointer"
                  >
                    Retry Analysis
                  </button>
                </div>
              )}
            </div>

            {/* Technical Information Sheet */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-600" />
                <span>Technical Specifications</span>
              </h3>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Document ID</span>
                  <span className="font-mono font-bold text-slate-800">{doc.id}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Source File</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[160px]" title={doc.sourceFileName}>
                    {doc.sourceFileName}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">File Format</span>
                  <span className="font-mono font-bold text-indigo-700">{doc.fileFormat} ({doc.fileExtension.toUpperCase()})</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">File Size</span>
                  <span className="font-mono text-slate-700">{Math.round(doc.fileSize / 1024)} KB</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Total Pages</span>
                  <span className="font-bold text-slate-800">{totalPages}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Discipline</span>
                  <span className="font-semibold text-slate-800">{doc.discipline}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Revision</span>
                  <span className="font-mono font-bold text-slate-800">{doc.revision}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="text-slate-500">Floor / Level</span>
                  <span className="text-slate-800">{doc.level || 'Not Specified'}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Upload Date</span>
                  <span className="text-slate-700">{doc.uploadDate?.split('T')[0] || '-'}</span>
                </div>
              </div>
            </div>

            {/* Extracted Analytics Stats */}
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Extracted Intelligence
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-lg font-black text-indigo-700 block">
                    {analysisRecord?.summary.elementsDetected || doc.detectedElementsCount || 0}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Elements</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-lg font-black text-amber-600 block">
                    {analysisRecord?.summary.openItemsCount || doc.openItemsCount || 0}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Open Items</span>
                </div>
              </div>
            </div>

            {/* Notes & Scope */}
            {doc.notes && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                  Processing & Scope Notes
                </span>
                <p className="text-xs text-amber-950 whitespace-pre-line leading-relaxed">
                  {doc.notes}
                </p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Phase 18A Full Drawing Analysis Workspace Modal */}
      {isAnalysisModalOpen && (
        <Phase18DrawingAnalysisModal
          document={doc}
          project={project || {
            id: doc.projectId || 'PRJ-DEFAULT',
            name: 'Active Project',
            description: '',
            status: 'Active',
            lastModified: new Date().toISOString(),
            takeoffProgress: 0,
            unresolvedClarifications: 0,
            currency: 'AED',
            unitSystem: 'Metric'
          }}
          isOpen={isAnalysisModalOpen}
          onClose={() => setIsAnalysisModalOpen(false)}
          onAnalysisComplete={(updatedRecord) => {
            setAnalysisRecord(updatedRecord);
          }}
        />
      )}

      {/* AutoCAD 2021 Integration Modal */}
      {doc && (
        <AutoCAD2021Modal
          isOpen={isAutoCADModalOpen}
          onClose={() => setIsAutoCADModalOpen(false)}
          config={AutoCAD2021IntegrationEngine.fromProjectDocument(doc)}
        />
      )}
    </div>
  );
};
