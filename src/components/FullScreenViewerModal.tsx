import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  Sun, 
  Moon, 
  FileText, 
  Layers, 
  Box, 
  EyeOff,
  Move,
  Info,
  Scale,
  ExternalLink,
  Zap
} from 'lucide-react';
import { ProjectDocument } from '../types';
import { DocumentStorageService } from '../services/documentStorage';
import { AutoCAD2021Modal } from './AutoCAD2021Modal';
import { AutoCAD2021IntegrationEngine } from '../engine/autocad2021IntegrationEngine';

interface FullScreenViewerModalProps {
  document: ProjectDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FullScreenViewerModal: React.FC<FullScreenViewerModalProps> = ({
  document: doc,
  isOpen,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCadDarkMode, setIsCadDarkMode] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoadingBlob, setIsLoadingBlob] = useState<boolean>(false);
  const [isAutoCADModalOpen, setIsAutoCADModalOpen] = useState<boolean>(false);
  const [showCadBigSuggestion, setShowCadBigSuggestion] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !doc) {
      setBlobUrl(null);
      return;
    }

    setZoomLevel(100);
    setRotation(0);
    setCurrentPage(1);
    setPanOffset({ x: 0, y: 0 });
    setShowCadBigSuggestion(true);

    let isMounted = true;
    setIsLoadingBlob(true);

    DocumentStorageService.getDocumentOriginalBlob(doc.id)
      .then((blob) => {
        if (!isMounted) return;
        if (blob) {
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        } else if (doc.previewDataUrl) {
          setBlobUrl(doc.previewDataUrl);
        }
      })
      .catch((err) => {
        console.error('Failed to load drawing blob:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingBlob(false);
        }
      });

    return () => {
      isMounted = false;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [isOpen, doc?.id]);

  if (!isOpen || !doc) return null;

  const totalPages = doc.pageCount || 1;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 400));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 25));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && doc.fileFormat !== 'PDF') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleDownload = () => {
    DocumentStorageService.downloadOriginalFile(doc);
  };

  const handleOpenInNewWindow = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col select-none text-white animate-in fade-in duration-150">
      {/* Top Navigation Bar */}
      <div className="h-14 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between shrink-0">
        {/* Left: Document info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
            {doc.fileFormat === 'PDF' && <FileText className="w-4 h-4" />}
            {['DWG', 'DXF'].includes(doc.fileFormat) && <Layers className="w-4 h-4" />}
            {doc.fileFormat === 'IFC' && <Box className="w-4 h-4" />}
            {['Image', 'Sketch'].includes(doc.fileFormat) && <FileText className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-indigo-400">{doc.drawingNumber || doc.id}</span>
              <span className="text-xs font-bold text-slate-200 truncate">{doc.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold border border-slate-700">
                {doc.revision}
              </span>
              {doc.isCurrentRevision && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">
                  CURRENT
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              {doc.sourceFileName} • {Math.round(doc.fileSize / 1024)} KB • {doc.level}
            </p>
          </div>
        </div>

        {/* Center: Controls Toolbar */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out (-25%)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs text-slate-300 px-1 w-12 text-center">
            {zoomLevel}%
          </span>

          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Zoom In (+25%)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-[11px] font-semibold rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Reset Zoom & Pan"
          >
            Reset
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          <button
            onClick={handleRotate}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {['DWG', 'DXF'].includes(doc.fileFormat) && (
            <>
              <button
                onClick={() => setIsCadDarkMode(!isCadDarkMode)}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Toggle CAD Background (Dark/Light)"
              >
                {isCadDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-1.5 rounded hover:bg-slate-700 transition-colors cursor-pointer ${
                  showGrid ? 'text-indigo-400' : 'text-slate-500'
                }`}
                title="Toggle Drawing Grid"
              >
                <Grid className="w-4 h-4" />
              </button>
            </>
          )}

          {doc.pageCount && doc.pageCount > 1 && (
            <>
              <div className="w-px h-4 bg-slate-700 mx-1" />
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-slate-300">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* AutoCAD 2021 Direct Integration Action */}
          <button
            onClick={() => setIsAutoCADModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm border border-rose-500 transition-all cursor-pointer"
            title="Open drawing in Autodesk AutoCAD 2021 (v24.0 / AC1032)"
          >
            <span className="w-4 h-4 rounded bg-white/20 flex items-center justify-center text-[10px] font-black">A</span>
            <span className="hidden sm:inline">Open in</span>
            <span>AutoCAD 2021</span>
          </button>

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Original</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Close Full Screen (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-hidden relative flex items-center justify-center cursor-grab active:cursor-grabbing ${
          doc.fileFormat === 'DWG' || doc.fileFormat === 'DXF'
            ? isCadDarkMode
              ? 'bg-[#12151D]'
              : 'bg-[#F1F5F9]'
            : 'bg-slate-950'
        }`}
      >
        {/* AutoCAD 2021 CAD Big Suggestion Banner */}
        {showCadBigSuggestion && (
          <div className="absolute top-4 z-40 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-rose-500/60 rounded-xl px-4 py-2.5 shadow-2xl flex items-center gap-3 text-xs max-w-2xl animate-in slide-in-from-top duration-300">
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
              A
            </div>
            <div className="text-slate-200 flex-1">
              <div className="font-bold text-white flex items-center gap-2">
                <span>Large CAD Drawing View</span>
                <span className="px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 text-[10px] font-mono border border-rose-500/40 font-semibold">
                  AC1032 Format
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Suggested application for large CAD inspection: <strong className="text-rose-300">Autodesk AutoCAD 2021</strong>
              </p>
            </div>
            <button
              onClick={() => setIsAutoCADModalOpen(true)}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-rose-200" />
              <span>Launch AutoCAD 2021</span>
            </button>
            <button
              onClick={() => setShowCadBigSuggestion(false)}
              className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer shrink-0"
              title="Dismiss suggestion"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {/* Render PDF Preview */}
        {doc.fileFormat === 'PDF' && (
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
            className="w-full max-w-5xl h-full max-h-[88vh] bg-white rounded-lg shadow-2xl p-2 flex flex-col text-slate-900 overflow-hidden border border-slate-700 relative"
          >
            {isLoadingBlob ? (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 text-slate-300 p-8">
                <FileText className="w-12 h-12 text-indigo-400 animate-pulse mb-3" />
                <p className="text-sm font-bold text-white">Loading Drawing PDF from Storage...</p>
                <p className="text-xs text-slate-400 mt-1 font-mono">{doc.sourceFileName}</p>
              </div>
            ) : blobUrl ? (
              <iframe
                src={`${blobUrl}#toolbar=0&page=${currentPage}`}
                title={doc.title || doc.sourceFileName}
                className="w-full h-full rounded bg-white border-0 min-h-[650px]"
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 text-slate-300 p-8 text-center">
                <FileText className="w-12 h-12 text-indigo-400 mb-3" />
                <h3 className="text-base font-bold text-white mb-1">{doc.title || doc.sourceFileName}</h3>
                <p className="text-xs text-slate-400 max-w-md mb-4">
                  Original PDF is registered in project storage. You can inspect or download the original file.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Original PDF</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Render Images / Hand Sketches */}
        {(doc.fileFormat === 'Image' || doc.fileFormat === 'Sketch') && (
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
            className="max-w-4xl max-h-[85vh] flex items-center justify-center p-4"
          >
            {doc.previewDataUrl ? (
              <img
                src={doc.previewDataUrl}
                alt={doc.title}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-slate-700 pointer-events-none"
              />
            ) : (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center text-slate-300">
                <FileText className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">{doc.title}</h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">{doc.sourceFileName}</p>
              </div>
            )}
          </div>
        )}

        {/* Render CAD (DWG / DXF) Vector Linework Representation */}
        {(doc.fileFormat === 'DWG' || doc.fileFormat === 'DXF') && (
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
            className="w-full max-w-5xl h-full max-h-[85vh] flex items-center justify-center p-4 relative"
          >
            <svg
              viewBox="0 0 1000 700"
              className={`w-full h-full rounded-lg shadow-2xl border ${
                isCadDarkMode ? 'border-slate-800 bg-[#0E1117]' : 'border-slate-300 bg-white'
              }`}
            >
              {showGrid && (
                <defs>
                  <pattern id="fullCadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke={isCadDarkMode ? '#1E293B' : '#E2E8F0'}
                      strokeWidth="0.8"
                    />
                  </pattern>
                </defs>
              )}

              {showGrid && <rect width="100%" height="100%" fill="url(#fullCadGrid)" />}

              {/* Vector Structural Linework */}
              <g stroke={isCadDarkMode ? '#38BDF8' : '#0284C7'} strokeWidth="2" fill="none">
                {/* Structural Framing Outline */}
                <rect x="150" y="100" width="700" height="500" strokeWidth="3" />
                <line x1="150" y1="266" x2="850" y2="266" strokeDasharray="8,4" />
                <line x1="150" y1="433" x2="850" y2="433" strokeDasharray="8,4" />
                <line x1="383" y1="100" x2="383" y2="600" strokeDasharray="8,4" />
                <line x1="616" y1="100" x2="616" y2="600" strokeDasharray="8,4" />
              </g>

              {/* Steel Truss Rafters representation */}
              <g stroke={isCadDarkMode ? '#F59E0B' : '#D97706'} strokeWidth="2.5">
                <line x1="150" y1="350" x2="500" y2="120" />
                <line x1="850" y1="350" x2="500" y2="120" />
                <line x1="500" y1="120" x2="500" y2="350" />
                <line x1="266" y1="275" x2="266" y2="350" />
                <line x1="383" y1="200" x2="383" y2="350" />
                <line x1="616" y1="200" x2="616" y2="350" />
                <line x1="733" y1="275" x2="733" y2="350" />
              </g>

              {/* Columns & Anchor details */}
              <g fill={isCadDarkMode ? '#E2E8F0' : '#1E293B'}>
                <rect x="135" y="340" width="30" height="260" />
                <rect x="835" y="340" width="30" height="260" />
                <rect x="120" y="590" width="60" height="20" fill="#64748B" />
                <rect x="820" y="590" width="60" height="20" fill="#64748B" />
              </g>

              {/* CAD Text Labels */}
              <text
                x="500"
                y="80"
                textAnchor="middle"
                fill={isCadDarkMode ? '#F8FAFC' : '#0F172A'}
                fontSize="16"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {doc.title.toUpperCase()} (CAD {doc.cadFormat || 'DWG'} VECTOR)
              </text>
            </svg>
          </div>
        )}

        {/* Render IFC BIM Metadata & Hierarchy Inspector */}
        {doc.fileFormat === 'IFC' && (
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
            className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl text-slate-200 space-y-6 select-none"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">IFC BIM Coordination Model</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Schema: {doc.ifcMetadata?.schema || 'IFC4'} • Source: {doc.sourceFileName}
                  </p>
                </div>
              </div>

              <span className="px-3 py-1 rounded bg-indigo-950 text-indigo-300 font-mono font-bold text-xs border border-indigo-800">
                IFC BIM Level 2
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[10px] text-indigo-400 font-bold uppercase block">Spatial Hierarchy</span>
                <p>Project: <strong className="text-white">{doc.ifcMetadata?.projectName || 'Tender Commercial Building'}</strong></p>
                <p>Site: <strong className="text-white">{doc.ifcMetadata?.site || 'Plot 108 Sector 4'}</strong></p>
                <p>Building: <strong className="text-white">{doc.ifcMetadata?.building || 'Main Tower Structure'}</strong></p>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[10px] text-emerald-400 font-bold uppercase block">Storeys & Elements</span>
                <p>Storeys: <strong className="text-white">{doc.ifcMetadata?.storeys?.join(', ') || 'All Floor Storeys'}</strong></p>
                <p>Status: <strong className="text-emerald-400">READY FOR SUBSEQUENT TAKEOFF PHASES</strong></p>
              </div>
            </div>

            {/* 3D Wireframe Representation */}
            <div className="h-56 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
              <svg viewBox="0 0 400 200" className="w-full h-full opacity-80">
                {/* Isometric Cube Grid representation */}
                <polygon points="200,30 320,80 200,130 80,80" fill="#1E293B" stroke="#6366F1" strokeWidth="1.5" />
                <polygon points="80,80 200,130 200,180 80,130" fill="#0F172A" stroke="#6366F1" strokeWidth="1.5" />
                <polygon points="200,130 320,80 320,130 200,180" fill="#1E293B" stroke="#6366F1" strokeWidth="1.5" />

                <line x1="200" y1="130" x2="200" y2="50" stroke="#38BDF8" strokeWidth="2" strokeDasharray="4,3" />
                <circle cx="200" cy="50" r="4" fill="#38BDF8" />
              </svg>
              <span className="absolute bottom-3 text-[10px] text-slate-500 font-mono">
                Full BIM Geometry Takeoff Engine scheduled for subsequent phase
              </span>
            </div>
          </div>
        )}

        {/* Unsupported Formats */}
        {doc.previewType === 'unsupported' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
              <EyeOff className="w-7 h-7" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">PREVIEW NOT AVAILABLE</h4>
              <p className="text-xs text-slate-400 mt-1">
                Direct in-browser visualization is not supported for <strong>.{doc.fileExtension}</strong> files.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg text-left text-xs font-mono space-y-1 text-slate-300">
              <p>File: <span className="text-white font-bold">{doc.sourceFileName}</span></p>
              <p>Size: {Math.round(doc.fileSize / 1024)} KB</p>
              <p>Format: {doc.fileFormat}</p>
            </div>

            <p className="text-[11px] text-slate-500">
              The original file is safely stored and intact. You can download it anytime.
            </p>

            <button
              onClick={handleDownload}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4" />
              <span>Download Original File</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar with keyboard shortcuts info */}
      <div className="h-10 bg-slate-900/90 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
        <div className="flex items-center gap-3">
          <span>Click & Drag to Pan</span>
          <span>•</span>
          <span>Zoom: {zoomLevel}%</span>
          <span>•</span>
          <span>Rotation: {rotation}°</span>
        </div>

        <div className="flex items-center gap-2">
          <span>Esc to Exit Full Screen</span>
        </div>
      </div>

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
