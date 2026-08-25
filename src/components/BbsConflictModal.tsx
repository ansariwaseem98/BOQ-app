import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { RebarConflictRecord } from '../types';

interface BbsConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: RebarConflictRecord[];
  onResolveConflict: (conflictId: string, chosenDrawing: 'A' | 'B', resolutionNote: string) => void;
}

export const BbsConflictModal: React.FC<BbsConflictModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolveConflict,
}) => {
  const [activeConflictId, setActiveConflictId] = useState<string>(conflicts[0]?.id || '');
  const [selectedDrawing, setSelectedDrawing] = useState<'A' | 'B'>('A');
  const [resolutionNote, setResolutionNote] = useState('');

  if (!isOpen || conflicts.length === 0) return null;

  const currentConflict = conflicts.find((c) => c.id === activeConflictId) || conflicts[0];

  const handleResolve = () => {
    if (!currentConflict) return;
    onResolveConflict(
      currentConflict.id,
      selectedDrawing,
      resolutionNote || `Resolved in favor of Drawing ${selectedDrawing === 'A' ? currentConflict.drawingA.drawingNumber : currentConflict.drawingB.drawingNumber}`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Reinforcement Drawing Conflicts ({conflicts.length})
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  Zero Guesswork Rule
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Conflicting drawing specifications must be explicitly adjudicated by the project engineer.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Conflict Selector if multiple */}
          {conflicts.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {conflicts.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConflictId(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    activeConflictId === c.id
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {c.barMark} ({c.status})
                </button>
              ))}
            </div>
          )}

          <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                {currentConflict.barMark}
              </span>
              <span className="font-bold text-rose-950 text-xs">
                Element: {currentConflict.element}
              </span>
            </div>
            <p className="text-[11px] text-rose-700">
              The AI Intake Engine detected differing reinforcement callouts between the structural framing plan and standard details. Select the governing drawing.
            </p>
          </div>

          {/* Side by Side Option Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Drawing A */}
            <div
              onClick={() => setSelectedDrawing('A')}
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                selectedDrawing === 'A'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs">Option A (Framing Plan)</span>
                <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                  Sheet {currentConflict.drawingA.drawingNumber} {currentConflict.drawingA.revision}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono font-bold text-sm text-indigo-900 mb-2">
                {currentConflict.drawingA.notation}
              </div>

              <p className="text-[11px] text-slate-500">
                Location: {currentConflict.drawingA.location}
              </p>
            </div>

            {/* Drawing B */}
            <div
              onClick={() => setSelectedDrawing('B')}
              className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                selectedDrawing === 'B'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 text-xs">Option B (Standard Schedule)</span>
                <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                  Sheet {currentConflict.drawingB.drawingNumber} {currentConflict.drawingB.revision}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono font-bold text-sm text-indigo-900 mb-2">
                {currentConflict.drawingB.notation}
              </div>

              <p className="text-[11px] text-slate-500">
                Location: {currentConflict.drawingB.location}
              </p>
            </div>
          </div>

          {/* Resolution Note */}
          <div>
            <label className="text-slate-700 font-bold block mb-1 text-xs">
              Engineer Resolution Justification & Authority Reference *
            </label>
            <input
              type="text"
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              placeholder="e.g. Specific beam framing schedule overrides standard typical notes as per RFI-042"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:bg-white focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Resolution decision is permanently stored in the BBS audit trail.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Resolution</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
