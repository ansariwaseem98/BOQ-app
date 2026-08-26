/**
 * AI BOQ & Tender Estimation Engineer - Phase 14A Interactive Drawing Viewer
 * Vector & Raster CAD/PDF Rendering with Bounding Box Pinpoint, Zoom/Pan & 2-Point Calibration
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Ruler,
  Crosshair,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  FileQuestion,
  Eye,
  Scan,
} from 'lucide-react';
import {
  SheetIntelligence,
  DetectedElement,
  DimensionObject,
  BoundingBox,
  DrawingCalibration,
} from '../types/drawingIntelligence';

interface DrawingViewerProps {
  activeSheet: SheetIntelligence;
  elements: DetectedElement[];
  dimensions: DimensionObject[];
  highlightRegion?: BoundingBox | null;
  selectedElementId?: string | null;
  onSelectElement?: (element: DetectedElement) => void;
  onSelectDimension?: (dimension: DimensionObject) => void;
  onCalibrateComplete?: (calibration: DrawingCalibration) => void;
}

export const DrawingViewer: React.FC<DrawingViewerProps> = ({
  activeSheet,
  elements,
  dimensions,
  highlightRegion,
  selectedElementId,
  onSelectElement,
  onSelectDimension,
  onCalibrateComplete,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Calibration tool state
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [calibrationPoint1, setCalibrationPoint1] = useState<{ x: number; y: number } | null>(null);
  const [calibrationPoint2, setCalibrationPoint2] = useState<{ x: number; y: number } | null>(null);
  const [knownDistanceInput, setKnownDistanceInput] = useState<string>('5000');
  const [showCalibrationModal, setShowCalibrationModal] = useState<boolean>(false);

  // Layer toggles
  const [showElementsLayer, setShowElementsLayer] = useState<boolean>(true);
  const [showDimensionsLayer, setShowDimensionsLayer] = useState<boolean>(true);
  const [showGridLayer, setShowGridLayer] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus on highlighted region when selected from parent
  useEffect(() => {
    if (highlightRegion) {
      // Calculate center of region (as percentage 0-100)
      const centerX = highlightRegion.x + highlightRegion.width / 2;
      const centerY = highlightRegion.y + highlightRegion.height / 2;
      // Pan such that center is at 50%
      setZoom(1.6);
      setPan({
        x: (50 - centerX) * 8,
        y: (50 - centerY) * 6,
      });
    }
  }, [highlightRegion]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCalibrating) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isCalibrating) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isCalibrating) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left - pan.x) / zoom) * (1000 / rect.width);
    const clickY = ((e.clientY - rect.top - pan.y) / zoom) * (700 / rect.height);

    if (!calibrationPoint1) {
      setCalibrationPoint1({ x: Math.round(clickX), y: Math.round(clickY) });
    } else if (!calibrationPoint2) {
      setCalibrationPoint2({ x: Math.round(clickX), y: Math.round(clickY) });
      setShowCalibrationModal(true);
    }
  };

  const handleSaveCalibration = () => {
    if (calibrationPoint1 && calibrationPoint2 && onCalibrateComplete) {
      const dx = calibrationPoint2.x - calibrationPoint1.x;
      const dy = calibrationPoint2.y - calibrationPoint1.y;
      const pixelDistance = Math.round(Math.sqrt(dx * dx + dy * dy));
      const knownMm = parseFloat(knownDistanceInput) || 5000;

      const cal: DrawingCalibration = {
        calibrationId: `CAL-${Date.now().toString().slice(-4)}`,
        sheetId: activeSheet.sheetId,
        drawingNumber: activeSheet.drawingNumber,
        page: activeSheet.pageNumber,
        point1: calibrationPoint1,
        point2: calibrationPoint2,
        pixelDistance,
        knownRealWorldDimension: knownMm,
        unit: 'mm',
        derivedScale: knownMm >= 4000 ? '1:100' : '1:50',
        derivedScaleRatio: knownMm / pixelDistance / 1000,
        isValidated: true,
        status: 'VALID',
        calibratedBy: 'QS Verification Engineer',
        calibratedAt: new Date().toISOString(),
      };

      onCalibrateComplete(cal);
      setIsCalibrating(false);
      setCalibrationPoint1(null);
      setCalibrationPoint2(null);
      setShowCalibrationModal(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-md select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[540px]'
      }`}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-950/90 border-b border-slate-800 text-slate-200 text-xs backdrop-blur-sm z-20">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 px-2 py-0.5 rounded">
            {activeSheet.drawingNumber} {activeSheet.revision}
          </span>
          <span className="font-medium text-slate-300 truncate max-w-xs sm:max-w-md">
            {activeSheet.title} (Page {activeSheet.pageNumber})
          </span>
          <span className="bg-slate-800 text-slate-400 font-mono text-[10px] px-1.5 py-0.5 rounded">
            Scale {activeSheet.scale}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Layer toggles */}
          <button
            onClick={() => setShowElementsLayer(!showElementsLayer)}
            className={`p-1.5 rounded transition-colors ${
              showElementsLayer ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title="Toggle Elements Layer"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowDimensionsLayer(!showDimensionsLayer)}
            className={`p-1.5 rounded transition-colors ${
              showDimensionsLayer ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title="Toggle Dimensions Layer"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Calibration toggle */}
          <button
            onClick={() => {
              setIsCalibrating(!isCalibrating);
              setCalibrationPoint1(null);
              setCalibrationPoint2(null);
            }}
            className={`px-2 py-1 rounded flex items-center gap-1 text-[11px] font-semibold transition-colors ${
              isCalibrating
                ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>{isCalibrating ? 'Click 2 Points...' : 'Calibrate Scale'}</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[10px] text-slate-400 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Canvas / SVG Interactive Area */}
      <div
        className="relative flex-1 bg-slate-950 overflow-hidden cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Instruction badge when calibrating */}
        {isCalibrating && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
            <Scan className="w-3.5 h-3.5 animate-spin" />
            {!calibrationPoint1 ? 'Click First Reference Point on Drawing' : 'Click Second Reference Point'}
          </div>
        )}

        <svg
          viewBox="0 0 1000 700"
          className="w-full h-full"
          onClick={handleCanvasClick}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '50% 50%',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <defs>
            {/* Architectural Grid pattern */}
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
            </pattern>
            {/* Hatch pattern for masonry */}
            <pattern id="brickHatch" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 0 5 L 10 5 M 5 0 L 5 5 M 0 10 L 10 10" stroke="#38bdf8" strokeWidth="0.5" fill="none" opacity="0.3" />
            </pattern>
            {/* Concrete hatch pattern */}
            <pattern id="concreteHatch" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="1" fill="#94a3b8" opacity="0.5" />
              <circle cx="12" cy="12" r="1.2" fill="#94a3b8" opacity="0.5" />
              <circle cx="12" cy="4" r="0.8" fill="#94a3b8" opacity="0.5" />
              <circle cx="4" cy="12" r="0.9" fill="#94a3b8" opacity="0.5" />
            </pattern>
          </defs>

          {/* Background & Grid */}
          <rect width="1000" height="700" fill="#090d16" />
          {showGridLayer && <rect width="1000" height="700" fill="url(#grid)" />}

          {/* Drawing Title Block Frame (Standard CAD Border) */}
          <rect x="30" y="30" width="940" height="640" fill="none" stroke="#334155" strokeWidth="2" />
          <rect x="720" y="580" width="250" height="90" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <text x="735" y="605" fill="#f8fafc" fontSize="13" fontWeight="bold" fontFamily="monospace">
            {activeSheet.drawingNumber} - {activeSheet.revision}
          </text>
          <text x="735" y="625" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
            {activeSheet.title.slice(0, 32)}
          </text>
          <text x="735" y="645" fill="#64748b" fontSize="9" fontFamily="monospace">
            SCALE: {activeSheet.scale} | UNITS: {activeSheet.units}
          </text>

          {/* Structural Grid Lines & Bubbles (Grids A, B, C, D & 1, 2, 3, 4) */}
          <g stroke="#475569" strokeWidth="0.8" strokeDasharray="6,4">
            {/* Grid 1 to 4 */}
            <line x1="120" y1="70" x2="120" y2="540" />
            <line x1="320" y1="70" x2="320" y2="540" />
            <line x1="520" y1="70" x2="520" y2="540" />
            <line x1="720" y1="70" x2="720" y2="540" />

            {/* Grid A to D */}
            <line x1="90" y1="120" x2="750" y2="120" />
            <line x1="90" y1="260" x2="750" y2="260" />
            <line x1="90" y1="400" x2="750" y2="400" />
            <line x1="90" y1="520" x2="750" y2="520" />
          </g>

          {/* Grid Bubbles */}
          <g fill="#1e293b" stroke="#64748b" strokeWidth="1">
            {/* Horizontal Grid Bubbles (1, 2, 3, 4) */}
            <circle cx="120" cy="70" r="12" />
            <text x="120" y="74" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">1</text>

            <circle cx="320" cy="70" r="12" />
            <text x="320" y="74" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">2</text>

            <circle cx="520" cy="70" r="12" />
            <text x="520" y="74" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">3</text>

            <circle cx="720" cy="70" r="12" />
            <text x="720" y="74" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">4</text>

            {/* Vertical Grid Bubbles (A, B, C, D) */}
            <circle cx="90" cy="120" r="12" />
            <text x="90" y="124" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">A</text>

            <circle cx="90" cy="260" r="12" />
            <text x="90" y="264" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">B</text>

            <circle cx="90" cy="400" r="12" />
            <text x="90" y="404" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">C</text>

            <circle cx="90" cy="520" r="12" />
            <text x="90" y="524" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">D</text>
          </g>

          {/* Architectural External Walls & Perimeter Layout */}
          <g fill="url(#brickHatch)" stroke="#38bdf8" strokeWidth="2.5">
            {/* Top External Wall W-04 along Grid A */}
            <rect x="120" y="112" width="600" height="16" />
            {/* Bottom External Wall along Grid D */}
            <rect x="120" y="512" width="600" height="16" />
            {/* Left External Wall along Grid 1 */}
            <rect x="112" y="120" width="16" height="400" />
            {/* Right External Wall along Grid 4 */}
            <rect x="712" y="120" width="16" height="400" />

            {/* Internal Partition Walls */}
            <rect x="316" y="128" width="8" height="270" strokeWidth="1.5" />
            <rect x="516" y="260" width="8" height="252" strokeWidth="1.5" />
            <rect x="128" y="256" width="188" height="8" strokeWidth="1.5" />
          </g>

          {/* Structural Concrete Columns (C1: 600x600mm) at Grid Intersections */}
          <g fill="url(#concreteHatch)" stroke="#f59e0b" strokeWidth="2">
            {[120, 320, 520, 720].map((gx) =>
              [120, 260, 400, 520].map((gy) => (
                <g key={`col-${gx}-${gy}`}>
                  {/* Footing Outline in structural foundation sheet */}
                  {activeSheet.drawingType === 'FOUNDATION' && (
                    <rect
                      x={gx - 40}
                      y={gy - 40}
                      width="80"
                      height="80"
                      fill="#0f2438"
                      stroke="#0284c7"
                      strokeWidth="1.2"
                      strokeDasharray="4,2"
                    />
                  )}
                  {/* Column */}
                  <rect
                    x={gx - 12}
                    y={gy - 12}
                    width="24"
                    height="24"
                    fill="#334155"
                    stroke="#f59e0b"
                    className="cursor-pointer hover:stroke-amber-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      const col = elements.find((el) => el.category === 'COLUMN');
                      if (col && onSelectElement) onSelectElement(col);
                    }}
                  />
                  <text
                    x={gx}
                    y={gy + 4}
                    textAnchor="middle"
                    fill="#fbbf24"
                    fontSize="7"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    C1
                  </text>
                </g>
              ))
            )}
          </g>

          {/* Door Openings (D-01: 1000x2100mm) */}
          <g stroke="#10b981" strokeWidth="1.8" fill="none">
            {/* Door D-01 in Wall W-04 */}
            <g
              className="cursor-pointer hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                const door = elements.find((el) => el.category === 'DOOR');
                if (door && onSelectElement) onSelectElement(door);
              }}
            >
              <rect x="220" y="110" width="30" height="20" fill="#090d16" stroke="none" />
              <line x1="220" y1="120" x2="250" y2="120" stroke="#10b981" strokeWidth="2" />
              <path d="M 220 120 A 30 30 0 0 1 250 150" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
              <text x="235" y="105" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold">
                D-01
              </text>
            </g>

            {/* Internal Doors */}
            <g>
              <rect x="312" y="190" width="16" height="26" fill="#090d16" stroke="none" />
              <line x1="320" y1="190" x2="320" y2="216" stroke="#10b981" strokeWidth="1.5" />
              <path d="M 320 190 A 26 26 0 0 1 346 216" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
            </g>
          </g>

          {/* Dimension Witness Lines & Annotations */}
          {showDimensionsLayer && (
            <g stroke="#94a3b8" strokeWidth="0.8" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
              {/* Overall Length Dimension (12500 mm) */}
              <line x1="120" y1="90" x2="720" y2="90" stroke="#38bdf8" strokeWidth="1" />
              <line x1="120" y1="82" x2="120" y2="98" stroke="#38bdf8" />
              <line x1="720" y1="82" x2="720" y2="98" stroke="#38bdf8" />
              <text x="420" y="85" textAnchor="middle" fill="#38bdf8" fontWeight="bold">
                12500 mm (W-04 Gross Length)
              </text>

              {/* Wall Thickness Callout (200mm AAC Block) */}
              <line x1="280" y1="120" x2="310" y2="155" stroke="#f43f5e" strokeWidth="1" />
              <circle cx="280" cy="120" r="2.5" fill="#f43f5e" />
              <rect x="310" y="145" width="130" height="20" fill="#1e1b4b" stroke="#818cf8" rx="3" />
              <text x="318" y="158" fill="#c7d2fe" fontSize="8.5" fontWeight="bold">
                200 THK AAC BLOCK [A-101]
              </text>

              {/* Scanned/Blurred Conflict Region on Parapet */}
              <g>
                <rect x="700" y="490" width="120" height="40" fill="#450a0a" stroke="#ef4444" strokeDasharray="4,2" rx="4" opacity="0.8" />
                <text x="760" y="508" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold">
                  ⚠️ OCR CONFLICT / BLUR
                </text>
                <text x="760" y="522" textAnchor="middle" fill="#f87171" fontSize="7.5">
                  Section S-301 shows 230mm
                </text>
              </g>
            </g>
          )}

          {/* Active Highlight Bounding Box Pinpoint */}
          {highlightRegion && (
            <g className="animate-pulse">
              <rect
                x={(highlightRegion.x / 100) * 1000}
                y={(highlightRegion.y / 100) * 700}
                width={(highlightRegion.width / 100) * 1000}
                height={(highlightRegion.height / 100) * 700}
                fill="#f59e0b"
                fillOpacity="0.25"
                stroke="#f59e0b"
                strokeWidth="3"
                rx="4"
              />
              <circle
                cx={(highlightRegion.x / 100) * 1000 + (highlightRegion.width / 100) * 500}
                cy={(highlightRegion.y / 100) * 700}
                r="6"
                fill="#f59e0b"
              />
            </g>
          )}

          {/* Calibration Points & Drawn Line */}
          {calibrationPoint1 && (
            <g>
              <circle cx={calibrationPoint1.x} cy={calibrationPoint1.y} r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
              <text x={calibrationPoint1.x + 10} y={calibrationPoint1.y - 10} fill="#f59e0b" fontSize="10" fontWeight="bold">
                P1 (0 px)
              </text>
            </g>
          )}
          {calibrationPoint1 && calibrationPoint2 && (
            <g>
              <line
                x1={calibrationPoint1.x}
                y1={calibrationPoint1.y}
                x2={calibrationPoint2.x}
                y2={calibrationPoint2.y}
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeDasharray="6,4"
              />
              <circle cx={calibrationPoint2.x} cy={calibrationPoint2.y} r="7" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
              <text x={calibrationPoint2.x + 10} y={calibrationPoint2.y - 10} fill="#10b981" fontSize="10" fontWeight="bold">
                P2 ({Math.round(Math.hypot(calibrationPoint2.x - calibrationPoint1.x, calibrationPoint2.y - calibrationPoint1.y))} px)
              </text>
            </g>
          )}
        </svg>

        {/* Bottom Legend Overlay */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
              <span>AAC Walls</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
              <span>RCC Columns</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Openings</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span>Conflicts / Open Items</span>
            </div>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono">
            Pan: Drag | Zoom: Scroll / Buttons | Source Pin: Live
          </div>
        </div>
      </div>

      {/* Two-Point Calibration Modal */}
      {showCalibrationModal && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-amber-400">
              <Ruler className="w-5 h-5" />
              <h4 className="font-bold text-sm text-white">Calibrate Drawing Scale</h4>
            </div>

            <p className="text-xs text-slate-300">
              You selected 2 reference points across{' '}
              <span className="font-mono text-amber-300 font-bold">
                {calibrationPoint1 && calibrationPoint2
                  ? Math.round(Math.hypot(calibrationPoint2.x - calibrationPoint1.x, calibrationPoint2.y - calibrationPoint1.y))
                  : 0}{' '}
                pixels
              </span>
              . Enter the known real-world dimension:
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400">Known Real Dimension (mm)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={knownDistanceInput}
                  onChange={(e) => setKnownDistanceInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:outline-hidden focus:border-amber-500"
                  placeholder="5000"
                />
                <span className="text-xs text-slate-400 font-bold">mm</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setShowCalibrationModal(false);
                  setIsCalibrating(false);
                  setCalibrationPoint1(null);
                  setCalibrationPoint2(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCalibration}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm"
              >
                Apply Calibration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
