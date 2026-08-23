import React, { useState, useRef } from 'react';
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
  Scale
} from 'lucide-react';
import { ProjectDocument } from '../types';
import { DocumentStorageService } from '../services/documentStorage';

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

  const containerRef = useRef<HTMLDivElement>(null);

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
    if (e.button === 0) {
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
        {/* Render PDF Preview */}
        {doc.fileFormat === 'PDF' && (
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
              transition: isPanning ? 'none' : 'transform 0.1s ease-out',
            }}
            className="w-full max-w-4xl h-full max-h-[85vh] bg-white rounded-lg shadow-2xl p-6 flex flex-col text-slate-900 overflow-hidden select-none border border-slate-700"
          >
            {/* Sheet Title Bar Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  {doc.discipline} ENGINEERING DRAWING
                </span>
                <h1 className="text-lg font-black text-slate-900">{doc.title}</h1>
                <p className="text-xs text-slate-600 font-mono">
                  Scale: {doc.scaleRatio || '1:100'} • Level: {doc.level}
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-sm font-black text-indigo-700 block">{doc.drawingNumber || doc.id}</span>
                <span className="text-xs font-bold text-slate-800">{doc.revision}</span>
              </div>
            </div>

            {/* Drawing Linework Representation */}
            <div className="flex-1 border border-slate-300 rounded relative overflow-hidden bg-slate-50 flex items-center justify-center">
              <svg viewBox="0 0 800 600" className="w-full h-full p-4 pointer-events-none">
                {/* Structural Grid lines */}
                <line x1="100" y1="50" x2="100" y2="550" stroke="#94A3B8" strokeWidth="1" strokeDasharray="6,4" />
                <line x1="300" y1="50" x2="300" y2="550" stroke="#94A3B8" strokeWidth="1" strokeDasharray="6,4" />
                <line x1="500" y1="50" x2="500" y2="550" stroke="#94A3B8" strokeWidth="1" strokeDasharray="6,4" />
                <line x1="700" y1="50" x2="700" y2="550" stroke="#94A3B8" strokeWidth="1" strokeDasharray="6,4" />

                <line x1="50" y1="100" x2="750" y2="100" stroke="#94A3B8" strokeWidth="1" strokeDasharray="6,4" />
                <line x1="50" y1="300" x2="750" y2="300" stroke="#94A3B8" strokeWidth="1" strokeDasharray="6,4" />
                <line x1="50" y1="500" x2="750" y2="500" stroke="#94A3B8" strokeWidth="1" strokeDasharray="6,4" />

                {/* Grid Bubbles */}
                <circle cx="100" cy="40" r="14" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
                <text x="100" y="44" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1E293B">A</text>
                <circle cx="300" cy="40" r="14" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
                <text x="300" y="44" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1E293B">B</text>
                <circle cx="500" cy="40" r="14" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
                <text x="500" y="44" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1E293B">C</text>
                <circle cx="700" cy="40" r="14" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
                <text x="700" y="44" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1E293B">D</text>

                <circle cx="40" cy="100" r="14" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
                <text x="40" y="104" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1E293B">1</text>
                <circle cx="40" cy="300" r="14" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
                <text x="40" y="304" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1E293B">2</text>
                <circle cx="40" cy="500" r="14" fill="#E2E8F0" stroke="#475569" strokeWidth="1.5" />
                <text x="40" y="504" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1E293B">3</text>

                {/* Slabs & Framing */}
                <rect x="100" y="100" width="600" height="400" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2.5" />
                <rect x="100" y="100" width="200" height="200" fill="none" stroke="#2563EB" strokeWidth="2" />
                <rect x="300" y="100" width="200" height="200" fill="none" stroke="#2563EB" strokeWidth="2" />
                <rect x="500" y="100" width="200" height="200" fill="none" stroke="#2563EB" strokeWidth="2" />
                <rect x="100" y="300" width="200" height="200" fill="none" stroke="#2563EB" strokeWidth="2" />
                <rect x="300" y="300" width="200" height="200" fill="none" stroke="#2563EB" strokeWidth="2" />
                <rect x="500" y="300" width="200" height="200" fill="none" stroke="#2563EB" strokeWidth="2" />

                {/* Columns */}
                {[
                  [100, 100], [300, 100], [500, 100], [700, 100],
                  [100, 300], [300, 300], [500, 300], [700, 300],
                  [100, 500], [300, 500], [500, 500], [700, 500],
                ].map(([x, y], idx) => (
                  <rect
                    key={idx}
                    x={x - 12}
                    y={y - 12}
                    width="24"
                    height="24"
                    fill="#1E293B"
                    stroke="#0F172A"
                  />
                ))}

                {/* Core Shear Wall */}
                <rect x="375" y="275" width="50" height="50" fill="#475569" stroke="#0F172A" strokeWidth="2" />
              </svg>
            </div>

            {/* Bottom Titleblock */}
            <div className="border-t-2 border-slate-900 pt-2 mt-3 flex justify-between items-center text-[10px] text-slate-600">
              <div>
                <span>Source: {doc.source || 'Tender Package'}</span> • <span>Date: {doc.drawingDate}</span>
              </div>
              <div className="font-mono font-bold">
                Sheet: {doc.drawingNumber || doc.id} | Rev: {doc.revision}
              </div>
            </div>
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
    </div>
  );
};
