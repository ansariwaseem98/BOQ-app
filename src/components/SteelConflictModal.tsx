import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle2, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { SteelConflictRecord } from '../types';

interface SteelConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: SteelConflictRecord[];
  onResolveConflict: (conflictId: string, resolvedDrawing: 'A' | 'B', note: string) => void;
}

export const SteelConflictModal: React.FC<SteelConflictModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  onResolveConflict,
}) => {
  const [selectedConflictId, setSelectedConflictId] = useState<string>(
    conflicts[0]?.id || ''
  );
  const [resolutionChoice, setResolutionChoice] = useState<'A' | 'B'>('B');
  const [resolutionNote, setResolutionNote] = useState(
    'Adopt Shop Drawing assembly per Structural RFI response.'
  );

  if (!isOpen) return null;

  const currentConflict = conflicts.find((c) => c.id === selectedConflictId) || conflicts[0];

  const handleResolve = () => {
    if (!currentConflict) return;
    onResolveConflict(currentConflict.id, resolutionChoice, resolutionNote);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-amber-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Drawing Conflict Adjudication ({conflicts.length} open)
              </h2>
              <p className="text-xs text-amber-900">
                Discrepancies identified between GA Framing Plans & Shop / Fabrication Drawings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 flex gap-6">
          {/* Left Conflict List */}
          <div className="w-1/3 border-r border-slate-200 pr-4 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Discrepancy Queue
            </span>
            {conflicts.map((conf) => (
              <button
                key={conf.id}
                onClick={() => setSelectedConflictId(conf.id)}
                className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                  selectedConflictId === conf.id
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{conf.memberMark}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      conf.status === 'RESOLVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {conf.status}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px] mt-1 truncate">
                  {conf.conflictType}: {conf.drawingA.drawingNumber} vs {conf.drawingB.drawingNumber}
                </div>
              </button>
            ))}
          </div>

          {/* Right Conflict Resolution Details */}
          <div className="w-2/3 space-y-4">
            {currentConflict ? (
              <>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Member: {currentConflict.memberMark}
                    </h3>
                    <span className="text-xs text-rose-600 font-semibold">
                      Conflict Type: {currentConflict.conflictType}
                    </span>
                  </div>
                </div>

                {/* Side by side comparison */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Drawing A */}
                  <div
                    onClick={() => setResolutionChoice('A')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      resolutionChoice === 'A'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        Source Drawing A
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                        {currentConflict.drawingA.type}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div>
                        <span className="text-slate-400">Sheet: </span>
                        <strong className="font-mono">{currentConflict.drawingA.drawingNumber}</strong> (Rev {currentConflict.drawingA.revision})
                      </div>
                      <div>
                        <span className="text-slate-400">Location: </span>
                        {currentConflict.drawingA.location}
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Specified Section:</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {currentConflict.drawingA.spec}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Drawing B */}
                  <div
                    onClick={() => setResolutionChoice('B')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      resolutionChoice === 'B'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        Source Drawing B
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                        {currentConflict.drawingB.type}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div>
                        <span className="text-slate-400">Sheet: </span>
                        <strong className="font-mono">{currentConflict.drawingB.drawingNumber}</strong> (Rev {currentConflict.drawingB.revision})
                      </div>
                      <div>
                        <span className="text-slate-400">Location: </span>
                        {currentConflict.drawingB.location}
                      </div>
                      <div className="pt-2 border-t border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Specified Section:</span>
                        <span className="font-mono font-bold text-indigo-700 text-sm">
                          {currentConflict.drawingB.spec}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resolution note */}
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Resolution Note & Engineering Justification *
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Enter justification e.g. RFI #104 confirmed Drawing B..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleResolve}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Adopt Drawing {resolutionChoice} & Resolve</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No conflicts in queue. All structural drawings aligned.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
