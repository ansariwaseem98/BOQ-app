import React, { useState } from 'react';
import { 
  X, 
  Play, 
  FileText, 
  Files, 
  Crop, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';
import { ProjectDocument } from '../types';
import { AnalysisOptions } from '../engine/drawingIntelligenceEngine';

interface AnalyzeOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ProjectDocument | null;
  currentPage: number;
  onStartAnalysis: (options: AnalysisOptions) => void;
}

export const AnalyzeOptionsModal: React.FC<AnalyzeOptionsModalProps> = ({
  isOpen,
  onClose,
  document,
  currentPage,
  onStartAnalysis,
}) => {
  if (!isOpen || !document) return null;

  const [mode, setMode] = useState<'PAGE' | 'DOCUMENT' | 'SELECTION'>('DOCUMENT');
  const [targetPage, setTargetPage] = useState<number>(currentPage || 1);

  const handleStart = () => {
    onStartAnalysis({
      mode,
      targetPage: mode === 'PAGE' ? targetPage : undefined,
    });
    onClose();
  };

  const totalPages = document.pageCount || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Analyze Construction Drawing
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate max-w-xs">
                {document.drawingNumber} — {document.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Select the extraction scope. The Intelligence Engine parses vector geometry, text streams, dimensions, structural marks, and schedules following the{' '}
            <strong className="text-slate-900 font-bold">Never Guess Rule</strong>.
          </p>

          <div className="space-y-3">
            {/* Option 1: Entire Document */}
            <label
              onClick={() => setMode('DOCUMENT')}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                mode === 'DOCUMENT'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="analysisScope"
                checked={mode === 'DOCUMENT'}
                onChange={() => setMode('DOCUMENT')}
                className="mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Files className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Analyze Entire Drawing Document ({totalPages} {totalPages === 1 ? 'Page' : 'Pages'})
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Processes all pages, sheets, schedules, and cross-references for full completeness.
                </p>
              </div>
            </label>

            {/* Option 2: Current Page */}
            <label
              onClick={() => setMode('PAGE')}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                mode === 'PAGE'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="analysisScope"
                checked={mode === 'PAGE'}
                onChange={() => setMode('PAGE')}
                className="mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Analyze Current Page Only
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  High-speed extraction targeted strictly at Page {targetPage}.
                </p>
                {mode === 'PAGE' && totalPages > 1 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-medium">Target Page:</span>
                    <select
                      value={targetPage}
                      onChange={(e) => setTargetPage(parseInt(e.target.value))}
                      className="text-xs font-bold px-2.5 py-1 bg-white border border-slate-300 rounded focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <option key={p} value={p}>
                          Page {p} of {totalPages}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </label>

            {/* Option 3: Selected Area */}
            <label
              onClick={() => setMode('SELECTION')}
              className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                mode === 'SELECTION'
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="radio"
                name="analysisScope"
                checked={mode === 'SELECTION'}
                onChange={() => setMode('SELECTION')}
                className="mt-1 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Crop className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-900">
                    Analyze Selected Area (Interactive Marquee Box)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Extracts elements, schedules, and dimensions bounded inside a custom drawn box.
                </p>
              </div>
            </label>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-[11px] text-slate-600">
              Extracted objects are strictly tagged with drawing and revision IDs. Conflicting or ambiguous notations automatically spawn Open Items for human review.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-2xs"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Analysis Engine</span>
          </button>
        </div>
      </div>
    </div>
  );
};
