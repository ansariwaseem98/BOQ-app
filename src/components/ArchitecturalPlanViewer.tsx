import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  Eye,
  CheckCircle2,
  Info,
  Compass,
} from 'lucide-react';
import { WallRegisterItem, RoomRegisterItem, DoorRegisterItem, WindowRegisterItem } from '../types';

interface ArchitecturalPlanViewerProps {
  walls: WallRegisterItem[];
  rooms: RoomRegisterItem[];
  doors: DoorRegisterItem[];
  windows: WindowRegisterItem[];
  selectedElementId: string | null;
  onSelectElement: (id: string, type: 'wall' | 'room' | 'door' | 'window') => void;
}

export const ArchitecturalPlanViewer: React.FC<ArchitecturalPlanViewerProps> = ({
  walls,
  rooms,
  doors,
  windows,
  selectedElementId,
  onSelectElement,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFinishesOverlay, setShowFinishesOverlay] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showOpenings, setShowOpenings] = useState(true);

  return (
    <div className="h-full flex flex-col bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
      {/* Top Drawing Header & Overlay Controls */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs text-slate-300">
            <span className="font-bold text-blue-400">DWG A-101</span>
            <span className="text-slate-500">•</span>
            <span>GROUND FLOOR GA & FINISH PLAN</span>
            <span className="text-slate-500">•</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px]">
              REV 01
            </span>
          </div>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFinishesOverlay(!showFinishesOverlay)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              showFinishesOverlay
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Finishes Overlay
          </button>
          <button
            onClick={() => setShowDimensions(!showDimensions)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              showDimensions
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Dimensions
          </button>
          <button
            onClick={() => setShowOpenings(!showOpenings)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
              showOpenings
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Doors/Windows
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 ml-2">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.7, prev - 0.15))}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 px-1.5">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(1.8, prev + 0.15))}
              className="p-1 text-slate-400 hover:text-slate-200"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-6 bg-slate-950 relative select-none">
        {/* North Arrow */}
        <div className="absolute top-4 right-4 bg-slate-900/80 border border-slate-800 rounded-lg p-2 flex flex-col items-center pointer-events-none z-10">
          <Compass className="w-6 h-6 text-blue-400" />
          <span className="text-[10px] font-mono font-bold text-slate-300 mt-0.5">NORTH</span>
        </div>

        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          className="transition-transform duration-150"
        >
          <svg
            width="880"
            height="560"
            viewBox="0 0 880 560"
            className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl"
          >
            {/* Structural Grid lines */}
            <g opacity="0.35" stroke="#475569" strokeWidth="0.75" strokeDasharray="4 4">
              {/* Vertical Grids */}
              <line x1="80" y1="40" x2="80" y2="520" />
              <line x1="280" y1="40" x2="280" y2="520" />
              <line x1="480" y1="40" x2="480" y2="520" />
              <line x1="680" y1="40" x2="680" y2="520" />
              <line x1="800" y1="40" x2="800" y2="520" />

              {/* Horizontal Grids */}
              <line x1="40" y1="80" x2="840" y2="80" />
              <line x1="40" y1="260" x2="840" y2="260" />
              <line x1="40" y1="480" x2="840" y2="480" />
            </g>

            {/* Grid Bubbles */}
            <g font-family="monospace" font-size="11" text-anchor="middle" fill="#94a3b8">
              <circle cx="80" cy="30" r="12" fill="#1e293b" stroke="#475569" />
              <text x="80" y="34">1</text>
              <circle cx="280" cy="30" r="12" fill="#1e293b" stroke="#475569" />
              <text x="280" y="34">2</text>
              <circle cx="480" cy="30" r="12" fill="#1e293b" stroke="#475569" />
              <text x="480" y="34">3</text>
              <circle cx="680" cy="30" r="12" fill="#1e293b" stroke="#475569" />
              <text x="680" y="34">4</text>
              <circle cx="800" cy="30" r="12" fill="#1e293b" stroke="#475569" />
              <text x="800" y="34">5</text>

              <circle cx="25" cy="80" r="12" fill="#1e293b" stroke="#475569" />
              <text x="25" y="84">A</text>
              <circle cx="25" cy="260" r="12" fill="#1e293b" stroke="#475569" />
              <text x="25" y="264">B</text>
              <circle cx="25" cy="480" r="12" fill="#1e293b" stroke="#475569" />
              <text x="25" y="484">C</text>
            </g>

            {/* Room Zones Backgrounds (Clickable) */}
            <g>
              {/* Room 1: Main Foyer */}
              <rect
                x="80"
                y="80"
                width="200"
                height="180"
                fill={
                  selectedElementId === 'ROOM-GF-01'
                    ? '#1e3a8a'
                    : showFinishesOverlay
                    ? '#172554'
                    : '#0f172a'
                }
                fillOpacity={showFinishesOverlay ? 0.45 : 0.2}
                stroke="#1e40af"
                strokeWidth="1"
                className="cursor-pointer transition-colors"
                onClick={() => onSelectElement('ROOM-GF-01', 'room')}
              />
              <text
                x="180"
                y="160"
                fill="#93c5fd"
                font-family="sans-serif"
                font-size="12"
                font-weight="bold"
                text-anchor="middle"
              >
                GRAND FOYER (R-GF-01)
              </text>
              <text
                x="180"
                y="178"
                fill="#60a5fa"
                font-family="monospace"
                font-size="10"
                text-anchor="middle"
              >
                84.00 m² • Botticino Marble
              </text>

              {/* Room 2: Open Plan Office */}
              <rect
                x="280"
                y="80"
                width="400"
                height="180"
                fill={
                  selectedElementId === 'ROOM-GF-02'
                    ? '#064e3b'
                    : showFinishesOverlay
                    ? '#064e3b'
                    : '#0f172a'
                }
                fillOpacity={showFinishesOverlay ? 0.35 : 0.2}
                stroke="#059669"
                strokeWidth="1"
                className="cursor-pointer transition-colors"
                onClick={() => onSelectElement('ROOM-GF-02', 'room')}
              />
              <text
                x="480"
                y="160"
                fill="#6ee7b7"
                font-family="sans-serif"
                font-size="12"
                font-weight="bold"
                text-anchor="middle"
              >
                OPEN PLAN OFFICES (R-GF-02)
              </text>
              <text
                x="480"
                y="178"
                fill="#34d399"
                font-family="monospace"
                font-size="10"
                text-anchor="middle"
              >
                145.00 m² • 600x600 Porcelain Tile
              </text>

              {/* Room 3: Restrooms Core */}
              <rect
                x="680"
                y="80"
                width="120"
                height="180"
                fill={
                  selectedElementId === 'ROOM-GF-03'
                    ? '#581c87'
                    : showFinishesOverlay
                    ? '#581c87'
                    : '#0f172a'
                }
                fillOpacity={showFinishesOverlay ? 0.45 : 0.2}
                stroke="#9333ea"
                strokeWidth="1"
                className="cursor-pointer transition-colors"
                onClick={() => onSelectElement('ROOM-GF-03', 'room')}
              />
              <text
                x="740"
                y="160"
                fill="#d8b4fe"
                font-family="sans-serif"
                font-size="11"
                font-weight="bold"
                text-anchor="middle"
              >
                RESTROOMS
              </text>
              <text
                x="740"
                y="176"
                fill="#c084fc"
                font-family="monospace"
                font-size="9"
                text-anchor="middle"
              >
                24.0 m² • Dado Tile
              </text>

              {/* Room 4: Main Corridor & Server */}
              <rect
                x="80"
                y="260"
                width="600"
                height="220"
                fill="#0f172a"
                fillOpacity="0.3"
                stroke="#334155"
                strokeWidth="1"
              />
              <text
                x="380"
                y="370"
                fill="#94a3b8"
                font-family="sans-serif"
                font-size="12"
                font-weight="bold"
                text-anchor="middle"
              >
                MAIN ATRIUM & CORRIDOR ZONE
              </text>
              <text
                x="380"
                y="388"
                fill="#64748b"
                font-family="monospace"
                font-size="10"
                text-anchor="middle"
              >
                230.00 m² • Acrylic Paint & Plaster
              </text>

              {/* Server Room */}
              <rect
                x="680"
                y="260"
                width="120"
                height="220"
                fill="#78350f"
                fillOpacity={showFinishesOverlay ? 0.45 : 0.2}
                stroke="#d97706"
                strokeWidth="1"
              />
              <text
                x="740"
                y="360"
                fill="#fcd34d"
                font-family="sans-serif"
                font-size="11"
                font-weight="bold"
                text-anchor="middle"
              >
                SERVER ROOM
              </text>
              <text
                x="740"
                y="376"
                fill="#fbbf24"
                font-family="monospace"
                font-size="9"
                text-anchor="middle"
              >
                32.0 m² • Anti-Static
              </text>
            </g>

            {/* Heavy Walls & Masonry (Clickable) */}
            <g stroke="#f8fafc" strokeWidth="8" strokeLinecap="square">
              {/* Outer Boundary Wall North (EW-01) */}
              <line
                x1="80"
                y1="80"
                x2="800"
                y2="80"
                stroke={selectedElementId === 'W-EXT-GF-01' ? '#38bdf8' : '#e2e8f0'}
                strokeWidth="12"
                className="cursor-pointer hover:stroke-sky-400 transition-colors"
                onClick={() => onSelectElement('W-EXT-GF-01', 'wall')}
              />
              {/* Outer Boundary Wall East (EW-02) */}
              <line
                x1="800"
                y1="80"
                x2="800"
                y2="480"
                stroke={selectedElementId === 'W-EXT-GF-02' ? '#38bdf8' : '#e2e8f0'}
                strokeWidth="12"
                className="cursor-pointer hover:stroke-sky-400 transition-colors"
                onClick={() => onSelectElement('W-EXT-GF-02', 'wall')}
              />
              {/* Outer Boundary Wall South */}
              <line x1="800" y1="480" x2="80" y2="480" stroke="#e2e8f0" strokeWidth="12" />
              {/* Outer Boundary Wall West */}
              <line x1="80" y1="480" x2="80" y2="80" stroke="#e2e8f0" strokeWidth="12" />

              {/* Internal Partition Walls */}
              {/* Divide Foyer / Office (IW-01) */}
              <line
                x1="280"
                y1="80"
                x2="280"
                y2="260"
                stroke={selectedElementId === 'W-INT-GF-01' ? '#a855f7' : '#94a3b8'}
                strokeWidth="8"
                className="cursor-pointer hover:stroke-purple-400 transition-colors"
                onClick={() => onSelectElement('W-INT-GF-01', 'wall')}
              />
              {/* Divide Office / Restrooms */}
              <line x1="680" y1="80" x2="680" y2="480" stroke="#94a3b8" strokeWidth="8" />
              {/* Horizontal Corridor Wall (IW-02) */}
              <line
                x1="80"
                y1="260"
                x2="680"
                y2="260"
                stroke={selectedElementId === 'W-INT-GF-02' ? '#a855f7' : '#94a3b8'}
                strokeWidth="7"
                className="cursor-pointer hover:stroke-purple-400 transition-colors"
                onClick={() => onSelectElement('W-INT-GF-02', 'wall')}
              />
            </g>

            {/* Openings (Doors & Windows) */}
            {showOpenings && (
              <g>
                {/* Main Entrance Door D01 */}
                <rect x="150" y="74" width="40" height="12" fill="#38bdf8" />
                <text
                  x="170"
                  y="65"
                  fill="#38bdf8"
                  font-family="monospace"
                  font-size="10"
                  font-weight="bold"
                  text-anchor="middle"
                >
                  D01 (1.8x2.4m)
                </text>

                {/* Office Windows W01 */}
                <rect x="340" y="75" width="50" height="10" fill="#34d399" />
                <text
                  x="365"
                  y="65"
                  fill="#34d399"
                  font-family="monospace"
                  font-size="9"
                  text-anchor="middle"
                >
                  W01
                </text>

                <rect x="460" y="75" width="50" height="10" fill="#34d399" />
                <text
                  x="485"
                  y="65"
                  fill="#34d399"
                  font-family="monospace"
                  font-size="9"
                  text-anchor="middle"
                >
                  W01
                </text>

                <rect x="570" y="75" width="50" height="10" fill="#34d399" />
                <text
                  x="595"
                  y="65"
                  fill="#34d399"
                  font-family="monospace"
                  font-size="9"
                  text-anchor="middle"
                >
                  W01
                </text>

                {/* Internal Doors D02 & D03 */}
                <rect x="275" y="160" width="10" height="30" fill="#fbbf24" />
                <text
                  x="260"
                  y="180"
                  fill="#fbbf24"
                  font-family="monospace"
                  font-size="9"
                  font-weight="bold"
                  text-anchor="end"
                >
                  D02
                </text>

                <rect x="380" y="255" width="30" height="10" fill="#fbbf24" />
                <text
                  x="395"
                  y="280"
                  fill="#fbbf24"
                  font-family="monospace"
                  font-size="9"
                  font-weight="bold"
                  text-anchor="middle"
                >
                  D03
                </text>
              </g>
            )}

            {/* Dimension Lines */}
            {showDimensions && (
              <g stroke="#38bdf8" strokeWidth="1" fill="#38bdf8" font-family="monospace" font-size="10">
                {/* North wall dimension */}
                <line x1="80" y1="500" x2="800" y2="500" />
                <circle cx="80" cy="500" r="2.5" />
                <circle cx="800" cy="500" r="2.5" />
                <text x="440" y="515" text-anchor="middle" font-weight="bold">
                  36.00 m (Grid 1 to 5)
                </text>

                {/* East wall dimension */}
                <line x1="820" y1="80" x2="820" y2="480" />
                <circle cx="820" cy="80" r="2.5" />
                <circle cx="820" cy="480" r="2.5" />
                <text
                  x="835"
                  y="285"
                  text-anchor="middle"
                  transform="rotate(90, 835, 285)"
                  font-weight="bold"
                >
                  24.00 m (Grid A to C)
                </text>
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Footer Info Ribbon */}
      <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-sky-400 inline-block" />
            200mm Exterior Block
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-purple-400 inline-block" />
            150mm AAC / 100mm Partition
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block" />
            Door & Window Openings
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Scale 1:100 @ A1 • Click on any wall or room to inspect takeoff formula
        </div>
      </div>
    </div>
  );
};
