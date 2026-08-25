import React from 'react';
import { X, Home, CheckCircle2, ShieldCheck, Layers, FileText, ArrowRight } from 'lucide-react';
import { RoomRegisterItem } from '../types';

interface RoomTakeoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomRegisterItem | null;
}

export const RoomTakeoffModal: React.FC<RoomTakeoffModalProps> = ({ isOpen, onClose, room }) => {
  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-lg">{room.roomName}</h3>
                <span className="px-2 py-0.5 text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  {room.roomNumber}
                </span>
                <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-300 rounded font-mono">
                  {room.level}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete room-by-room architectural takeoff aggregation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Geometric Dimensions Card */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Length</span>
              <span className="text-sm font-semibold font-mono text-slate-100 mt-0.5 block">
                {room.lengthM.toFixed(2)} m
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Width</span>
              <span className="text-sm font-semibold font-mono text-slate-100 mt-0.5 block">
                {room.widthM.toFixed(2)} m
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Perimeter</span>
              <span className="text-sm font-semibold font-mono text-emerald-400 mt-0.5 block">
                {room.perimeterM.toFixed(2)} m
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400 block">Floor Area</span>
              <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                {room.areaM2.toFixed(2)} m²
              </span>
            </div>
          </div>

          {/* Finish Schedule Breakdown Matrix */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>Assigned Architectural Finishes</span>
            </h4>
            <div className="space-y-2.5">
              {/* Floor */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200">Flooring Finish</span>
                  <p className="text-xs text-slate-400 mt-0.5">{room.floorFinish}</p>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-100 px-2.5 py-1 bg-slate-800 rounded">
                  {room.areaM2.toFixed(2)} m²
                </span>
              </div>

              {/* Skirting */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200">Skirting Finish</span>
                  <p className="text-xs text-slate-400 mt-0.5">{room.skirtingFinish}</p>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-100 px-2.5 py-1 bg-slate-800 rounded">
                  ~{(room.perimeterM - (room.doors.length * 1.0)).toFixed(2)} m net
                </span>
              </div>

              {/* Walls & Wall Tile */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200">Wall Finish & Paint</span>
                  <p className="text-xs text-slate-400 mt-0.5">{room.wallFinish}</p>
                  {room.wallTileHeightM && (
                    <span className="inline-block mt-1 text-[11px] text-amber-300 font-mono">
                      Dado Wall Tiles up to {room.wallTileHeightM.toFixed(2)}m Height
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs font-semibold text-slate-100 px-2.5 py-1 bg-slate-800 rounded">
                  ~{(room.perimeterM * room.heightM).toFixed(2)} m² gross
                </span>
              </div>

              {/* Ceiling */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200">Ceiling Finish</span>
                  <p className="text-xs text-slate-400 mt-0.5">{room.ceilingFinish}</p>
                  <span className="text-[11px] text-slate-400">
                    Clear Height: {room.ceilingHeightM.toFixed(2)}m AFFL
                  </span>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-100 px-2.5 py-1 bg-slate-800 rounded">
                  {room.areaM2.toFixed(2)} m²
                </span>
              </div>

              {/* Waterproofing (if any) */}
              {room.waterproofingType && (
                <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-blue-300">Waterproofing Membrane</span>
                    <p className="text-xs text-slate-400 mt-0.5">{room.waterproofingType}</p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-blue-200 px-2.5 py-1 bg-blue-900/40 rounded border border-blue-500/30">
                    {(room.areaM2 + room.perimeterM * 0.3).toFixed(2)} m²
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Openings Linked */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Associated Openings
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400 block">Doors</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {room.doors.map((dr, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 rounded font-mono text-xs"
                    >
                      {dr}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-xs text-slate-400 block">Windows</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {room.windows.map((wn, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-200 rounded font-mono text-xs"
                    >
                      {wn}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Provenance */}
          <div className="bg-slate-800/40 border border-slate-700/80 rounded-lg p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">
                Drawing {room.drawingNumber} (Rev {room.revision}) • {room.sourceLocation}
              </span>
            </div>
            <span className="text-emerald-400 font-medium">Verified</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
