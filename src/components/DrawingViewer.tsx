import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  RotateCcw, 
  Ruler, 
  Square, 
  Crosshair, 
  Layers, 
  Sparkles,
  MousePointer,
  AlertCircle
} from 'lucide-react';
import { DrawingRecord, DetectedElement, OpenItem, BoundingBox } from '../types';

interface DrawingViewerProps {
  drawing?: DrawingRecord | null;
  elements?: DetectedElement[];
  openItems?: OpenItem[];
  selectedElementId?: string | null;
  onSelectElement: (element: DetectedElement) => void;
  onSelectOpenItem?: (openItem: OpenItem) => void;
  onAddElementBoundingBox?: (box: BoundingBox) => void;
  onCalibrateScale?: (metersPerUnit: number) => void;
}

export const DrawingViewer: React.FC<DrawingViewerProps> = ({
  drawing,
  elements = [],
  openItems = [],
  selectedElementId = null,
  onSelectElement,
  onSelectOpenItem,
  onAddElementBoundingBox,
  onCalibrateScale,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  // Tools: 'select' | 'measure' | 'box' | 'pan'
  const [activeTool, setActiveTool] = useState<'select' | 'measure' | 'box' | 'pan'>('select');
  
  // Layer visibility toggles
  const [showGrids, setShowGrids] = useState(true);
  const [showElements, setShowElements] = useState(true);
  const [showOpenItems, setShowOpenItems] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);

  // Measurement tool state
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);
  const [measuredDistanceM, setMeasuredDistanceM] = useState<number | null>(null);
  
  // Box creation state
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<BoundingBox | null>(null);

  // Filter elements & open items for this drawing
  const drawingElements = elements.filter(
    (e) => e.drawingId === drawing.id || e.drawingNumber === drawing.drawingNumber
  );
  const drawingOpenItems = openItems.filter(
    (oi) => oi.drawingId === drawing.id || oi.drawingNumber === drawing.drawingNumber
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === 'pan' || e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (activeTool === 'measure') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;

      if (measurePoints.length === 0 || measurePoints.length === 2) {
        setMeasurePoints([{ x, y }]);
        setMeasuredDistanceM(null);
      } else if (measurePoints.length === 1) {
        const p1 = measurePoints[0];
        const p2 = { x, y };
        setMeasurePoints([p1, p2]);
        const pixelDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const scale = drawing.calibrationScale || 28.5; // pixels per meter
        const distM = Number((pixelDist / scale).toFixed(3));
        setMeasuredDistanceM(distM);
      }
    } else if (activeTool === 'box') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Normalised coordinates (0-100%)
      const contentWidth = 900;
      const contentHeight = 600;
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      const normX = Math.max(0, Math.min(100, (rawX / contentWidth) * 100));
      const normY = Math.max(0, Math.min(100, (rawY / contentHeight) * 100));
      setBoxStart({ x: normX, y: normY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (activeTool === 'box' && boxStart) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const contentWidth = 900;
      const contentHeight = 600;
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      const normX = Math.max(0, Math.min(100, (rawX / contentWidth) * 100));
      const normY = Math.max(0, Math.min(100, (rawY / contentHeight) * 100));

      const x = Math.min(boxStart.x, normX);
      const y = Math.min(boxStart.y, normY);
      const width = Math.abs(normX - boxStart.x);
      const height = Math.abs(normY - boxStart.y);

      setCurrentBox({ x, y, width, height, label: 'New Element' });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (activeTool === 'box' && currentBox && currentBox.width > 2 && currentBox.height > 2) {
      if (onAddElementBoundingBox) {
        onAddElementBoundingBox(currentBox);
      }
      setBoxStart(null);
      setCurrentBox(null);
      setActiveTool('select');
    } else {
      setBoxStart(null);
      setCurrentBox(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom((prev) => Math.min(Math.max(0.4, prev * zoomFactor), 6.0));
  };

  const resetView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setMeasurePoints([]);
    setMeasuredDistanceM(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#1E293B] select-none overflow-hidden relative">
      {/* Top Toolbar */}
      <div className="h-11 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-10 text-xs text-slate-300 shrink-0">
        {/* Left: Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTool('select')}
            title="Select & Inspect Element"
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'select'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveTool('pan')}
            title="Pan View"
            className={`p-1.5 rounded transition-colors ${
              activeTool === 'pan'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setActiveTool('measure');
              setMeasurePoints([]);
              setMeasuredDistanceM(null);
            }}
            title="Measure Dimension / Calibrate Scale"
            className={`px-2 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTool === 'measure'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Measure</span>
          </button>
          <button
            onClick={() => setActiveTool('box')}
            title="Draw New Element Box"
            className={`px-2 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTool === 'box'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium">Add Box</span>
          </button>
        </div>

        {/* Center: Active Drawing Info */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-indigo-400 font-bold">{drawing.drawingNumber}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-200 font-sans font-medium truncate max-w-[260px]">{drawing.title}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
            {drawing.revision}
          </span>
        </div>

        {/* Right: Layers & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* Layer toggles */}
          <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-1 rounded border border-slate-800 text-[10px]">
            <button
              onClick={() => setShowGrids(!showGrids)}
              className={`px-2 py-0.5 rounded font-medium ${showGrids ? 'bg-indigo-600/30 text-indigo-300' : 'text-slate-500'}`}
            >
              Grids
            </button>
            <button
              onClick={() => setShowElements(!showElements)}
              className={`px-2 py-0.5 rounded font-medium ${showElements ? 'bg-emerald-600/30 text-emerald-300' : 'text-slate-500'}`}
            >
              Elements ({drawingElements.length})
            </button>
            <button
              onClick={() => setShowOpenItems(!showOpenItems)}
              className={`px-2 py-0.5 rounded font-medium ${showOpenItems ? 'bg-amber-600/30 text-amber-300' : 'text-slate-500'}`}
            >
              Open Items ({drawingOpenItems.length})
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] text-slate-400 w-9 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(6.0, z + 0.2))}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              title="Reset View"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white ml-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Indicators on Top Left of Blueprint (Sleek Theme Design) */}
      <div className="absolute top-14 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded shadow-sm text-[10px] font-bold text-slate-800 border border-slate-200">
          SCALE: {drawing.scaleRatio || '1:100 (A1)'}
        </div>
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded shadow-sm text-[10px] font-bold text-indigo-600 border border-slate-200 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
          AI ANALYSIS ACTIVE
        </div>
      </div>

      {/* Measurement readout bar if active */}
      {activeTool === 'measure' && (
        <div className="absolute top-14 left-72 z-20 bg-slate-900/90 border border-emerald-500/40 rounded-lg px-3 py-1.5 text-xs text-slate-200 shadow-xl backdrop-blur-xs flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <Ruler className="w-4 h-4" />
            <span className="font-semibold">CAD Measurement Tool:</span>
          </div>
          {measurePoints.length === 0 && <span>Click first point on drawing</span>}
          {measurePoints.length === 1 && <span>Click second point to measure span</span>}
          {measuredDistanceM !== null && (
            <div className="flex items-center gap-3">
              <span className="font-mono text-emerald-300 font-bold text-sm bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                {measuredDistanceM.toFixed(3)} m ({Math.round(measuredDistanceM * 1000)} mm)
              </span>
              <button
                onClick={() => {
                  setMeasurePoints([]);
                  setMeasuredDistanceM(null);
                }}
                className="text-[10px] text-slate-400 hover:text-white underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interactive CAD Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 w-full h-full relative cursor-${
          activeTool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : activeTool === 'measure' ? 'crosshair' : activeTool === 'box' ? 'crosshair' : 'default'
        }`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'top left',
            transition: isPanning ? 'none' : 'transform 0.05s ease-out',
          }}
          className="w-[900px] h-[600px] absolute top-8 left-8 bg-[#0e1626] border border-slate-700 shadow-2xl rounded"
        >
          {/* Vector Blueprint CAD Drawing SVG */}
          <svg className="w-full h-full" viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cad-grid-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
              <pattern id="concrete-hatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="#334155" strokeWidth="1" />
              </pattern>
              <pattern id="blockwork-hatch" width="8" height="8" patternTransform="rotate(0 0 0)" patternUnits="userSpaceOnUse">
                <rect width="8" height="4" fill="none" stroke="#3b4252" strokeWidth="0.5" />
                <rect y="4" width="8" height="4" fill="none" stroke="#3b4252" strokeWidth="0.5" />
              </pattern>
            </defs>

            {/* Grid background */}
            <rect width="900" height="600" fill="url(#cad-grid-pattern)" />

            {/* Drawing Border & Title Block */}
            <rect x="15" y="15" width="870" height="570" fill="none" stroke="#334155" strokeWidth="1.5" />
            <rect x="620" y="490" width="265" height="95" fill="#0b1120" stroke="#334155" strokeWidth="1" />
            <text x="635" y="515" fill="#64748b" fontSize="9" fontFamily="monospace">PROJECT: MARINA BAY COMMERCIAL TOWER</text>
            <text x="635" y="532" fill="#94a3b8" fontSize="11" fontWeight="bold" fontFamily="monospace">{drawing.title.toUpperCase()}</text>
            <text x="635" y="550" fill="#38bdf8" fontSize="10" fontFamily="monospace">DWG NO: {drawing.drawingNumber}  |  REV: {drawing.revision}</text>
            <text x="635" y="568" fill="#64748b" fontSize="9" fontFamily="monospace">CONSULTANT: ARUP / KPF JV  |  SCALE: {drawing.scaleRatio || '1:100'}</text>

            {/* Structural Grids (A to F, 1 to 7) */}
            {showGrids && (
              <g id="cad-grids" stroke="#475569" strokeDasharray="6,4" strokeWidth="0.8">
                {/* Horizontal Grids A-F */}
                {[90, 160, 230, 300, 370, 440].map((y, idx) => {
                  const label = String.fromCharCode(65 + idx);
                  return (
                    <g key={label}>
                      <line x1="60" y1={y} x2="600" y2={y} />
                      <circle cx="45" cy={y} r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" strokeDasharray="none" />
                      <text x="45" y={y + 3.5} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">{label}</text>
                      <circle cx="615" cy={y} r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" strokeDasharray="none" />
                      <text x="615" y={y + 3.5} fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">{label}</text>
                    </g>
                  );
                })}

                {/* Vertical Grids 1-7 */}
                {[90, 175, 260, 345, 430, 515, 600].map((x, idx) => {
                  const label = String(idx + 1);
                  return (
                    <g key={label}>
                      <line x1={x} y1="60" x2={x} y2="470" />
                      <circle cx={x} cy="45" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" strokeDasharray="none" />
                      <text x={x} y="48.5" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">{label}</text>
                      <circle cx={x} cy="485" r="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" strokeDasharray="none" />
                      <text x={x} y="488.5" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" stroke="none">{label}</text>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Raft & Slab Outline */}
            <rect x="90" y="90" width="510" height="350" fill="#1e293b" fillOpacity="0.3" stroke="#60a5fa" strokeWidth="1.5" />
            
            {/* Beams Layout */}
            <g stroke="#38bdf8" strokeWidth="1.8" fill="none">
              {/* Perimeter beams */}
              <rect x="90" y="90" width="510" height="350" />
              {/* Internal grid beams */}
              <line x1="90" y1="160" x2="600" y2="160" />
              <line x1="90" y1="230" x2="600" y2="230" />
              <line x1="90" y1="300" x2="600" y2="300" />
              <line x1="90" y1="370" x2="600" y2="370" />
              <line x1="175" y1="90" x2="175" y2="440" />
              <line x1="260" y1="90" x2="260" y2="440" />
              <line x1="345" y1="90" x2="345" y2="440" />
              <line x1="430" y1="90" x2="430" y2="440" />
              <line x1="515" y1="90" x2="515" y2="440" />
            </g>

            {/* Core Elevator Shaft & Shear Walls */}
            <g>
              <rect x="310" y="200" width="110" height="130" fill="#0f172a" stroke="#f43f5e" strokeWidth="2.5" />
              {/* Lift Sump / Openings */}
              <line x1="310" y1="200" x2="420" y2="330" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="4,4" />
              <line x1="420" y1="200" x2="310" y2="330" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="4,4" />
              <text x="365" y="270" fill="#fda4af" fontSize="10" fontWeight="bold" textAnchor="middle">LIFT CORE SW-01 (300mm)</text>
            </g>

            {/* Columns on Grids */}
            <g fill="#10b981" stroke="#047857" strokeWidth="1">
              {[90, 175, 260, 430, 515, 600].flatMap((x) =>
                [90, 160, 230, 300, 370, 440].map((y) => (
                  <rect key={`${x}-${y}`} x={x - 8} y={y - 8} width="16" height="16" />
                ))
              )}
              {/* Circular entrance columns */}
              {[175, 260, 345, 430].map((x) => (
                <circle key={`circ-${x}`} cx={x} cy="440" r="10" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.5" />
              ))}
            </g>

            {/* HVAC Duct Overlay if drawing is MEP */}
            {drawing.discipline === 'HVAC' && (
              <g stroke="#f59e0b" strokeWidth="4" fill="none" opacity="0.85">
                <path d="M 120 130 L 560 130 L 560 380 L 120 380" />
                <rect x="120" y="115" width="440" height="30" fill="#f59e0b" fillOpacity="0.1" stroke="#f59e0b" strokeWidth="1" />
                <text x="280" y="135" fill="#fde68a" fontSize="10" fontFamily="monospace">SUPPLY AIR DUCT 800x400 (22G)</text>
              </g>
            )}

            {/* Steel Rafters Overlay if drawing is Steel */}
            {drawing.discipline === 'Steel' && (
              <g stroke="#a855f7" strokeWidth="2.5" fill="none">
                {[120, 190, 260, 330, 400, 470, 540].map((x) => (
                  <line key={`rafter-${x}`} x1={x} y1="90" x2={x} y2="440" />
                ))}
                <text x="330" y="80" fill="#d8b4fe" fontSize="11" fontWeight="bold" textAnchor="middle">UB 457x191x67 MAIN RAFTERS @ 6.0m C/C</text>
              </g>
            )}

            {/* Dimension Lines */}
            {showDimensions && (
              <g stroke="#94a3b8" strokeWidth="0.8" fill="none">
                {/* Horizontal overall dimension */}
                <line x1="90" y1="25" x2="600" y2="25" />
                <line x1="90" y1="20" x2="90" y2="30" />
                <line x1="600" y1="20" x2="600" y2="30" />
                <text x="345" y="20" fill="#cbd5e1" fontSize="10" fontFamily="monospace" textAnchor="middle">51,000 mm (51.00 m)</text>

                {/* Vertical overall dimension */}
                <line x1="25" y1="90" x2="25" y2="440" />
                <line x1="20" y1="90" x2="30" y2="90" />
                <line x1="20" y1="440" x2="30" y2="440" />
                <text x="20" y="270" fill="#cbd5e1" fontSize="10" fontFamily="monospace" textAnchor="middle" transform="rotate(-90 20 270)">35,000 mm (35.00 m)</text>
              </g>
            )}

            {/* Interactive Bounding Boxes for Detected Elements */}
            {showElements &&
              drawingElements.map((el) => {
                if (!el.boundingBox) return null;
                const isSelected = selectedElementId === el.id;
                // Convert normalized percentage to SVG pixel coordinates
                const bx = (el.boundingBox.x / 100) * 900;
                const by = (el.boundingBox.y / 100) * 600;
                const bw = (el.boundingBox.width / 100) * 900;
                const bh = (el.boundingBox.height / 100) * 600;

                return (
                  <g
                    key={el.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectElement(el);
                    }}
                    className="cursor-pointer group"
                  >
                    <rect
                      x={bx}
                      y={by}
                      width={bw}
                      height={bh}
                      fill={isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(16, 185, 129, 0.08)'}
                      stroke={isSelected ? '#3b82f6' : '#10b981'}
                      strokeWidth={isSelected ? 2.5 : 1.2}
                      strokeDasharray={isSelected ? 'none' : '4,2'}
                      rx="3"
                      className="transition-all duration-150 group-hover:fill-blue-500/20 group-hover:stroke-blue-400"
                    />
                    <g transform={`translate(${bx + 4}, ${by + 14})`}>
                      <rect
                        x="0"
                        y="-10"
                        width={Math.min(bw - 8, el.name.length * 6.5 + 40)}
                        height="15"
                        fill="#0f172a"
                        fillOpacity="0.9"
                        rx="2"
                        stroke={isSelected ? '#3b82f6' : '#10b981'}
                        strokeWidth="0.5"
                      />
                      <text
                        x="4"
                        y="0"
                        fill={isSelected ? '#93c5fd' : '#6ee7b7'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {el.id} • {el.calculation.netQuantity} {el.calculation.unit}
                      </text>
                    </g>
                  </g>
                );
              })}

            {/* Interactive Bounding Boxes for Open Items / Discrepancies */}
            {showOpenItems &&
              drawingOpenItems.map((oi) => {
                if (!oi.boundingBox) return null;
                const bx = (oi.boundingBox.x / 100) * 900;
                const by = (oi.boundingBox.y / 100) * 600;
                const bw = (oi.boundingBox.width / 100) * 900;
                const bh = (oi.boundingBox.height / 100) * 600;

                return (
                  <g
                    key={oi.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectOpenItem) onSelectOpenItem(oi);
                    }}
                    className="cursor-pointer group"
                  >
                    <rect
                      x={bx}
                      y={by}
                      width={bw}
                      height={bh}
                      fill="rgba(245, 158, 11, 0.2)"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="5,3"
                      rx="3"
                      className="animate-pulse group-hover:stroke-amber-300"
                    />
                    <g transform={`translate(${bx + 4}, ${by + 14})`}>
                      <rect
                        x="0"
                        y="-10"
                        width="110"
                        height="15"
                        fill="#451a03"
                        fillOpacity="0.95"
                        rx="2"
                        stroke="#f59e0b"
                        strokeWidth="0.5"
                      />
                      <text
                        x="4"
                        y="0"
                        fill="#fcd34d"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        FLAG: {oi.id} (OPEN)
                      </text>
                    </g>
                  </g>
                );
              })}

            {/* Live Box Drawing Feedback */}
            {currentBox && (
              <rect
                x={(currentBox.x / 100) * 900}
                y={(currentBox.y / 100) * 600}
                width={(currentBox.width / 100) * 900}
                height={(currentBox.height / 100) * 600}
                fill="rgba(245, 158, 11, 0.25)"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
            )}

            {/* Measurement Line Overlay */}
            {measurePoints && measurePoints.length >= 1 && measurePoints[0] && (
              <g>
                <circle cx={measurePoints[0].x} cy={measurePoints[0].y} r="4" fill="#10b981" />
                {measurePoints.length >= 2 && measurePoints[1] && (
                  <>
                    <circle cx={measurePoints[1].x} cy={measurePoints[1].y} r="4" fill="#10b981" />
                    <line
                      x1={measurePoints[0].x}
                      y1={measurePoints[0].y}
                      x2={measurePoints[1].x}
                      y2={measurePoints[1].y}
                      stroke="#10b981"
                      strokeWidth="2"
                    />
                    <rect
                      x={(measurePoints[0].x + measurePoints[1].x) / 2 - 30}
                      y={(measurePoints[0].y + measurePoints[1].y) / 2 - 12}
                      width="60"
                      height="16"
                      fill="#064e3b"
                      rx="3"
                      stroke="#10b981"
                      strokeWidth="0.5"
                    />
                    <text
                      x={(measurePoints[0].x + measurePoints[1].x) / 2}
                      y={(measurePoints[0].y + measurePoints[1].y) / 2}
                      fill="#a7f3d0"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {measuredDistanceM !== null ? `${measuredDistanceM.toFixed(2)}m` : ''}
                    </text>
                  </>
                )}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Sleek Bottom CAD Status & Coordinate Bar */}
      <div className="h-9 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between px-4 text-[10px] text-slate-400 font-mono shrink-0 select-none z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>VECTOR CAD READY</span>
          </div>
          <span>•</span>
          <span>X: 1450.22 mm</span>
          <span>Y: 344.08 mm</span>
          <span>Z: +3.600 m</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 font-sans">
          <span className="hidden sm:inline">Active Layer: Structural Reinforcement</span>
          <span className="px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40 text-[9px] font-mono">
            {drawingElements.length} Takeoff Entities
          </span>
        </div>
      </div>
    </div>
  );
};
