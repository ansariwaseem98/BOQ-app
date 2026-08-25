import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Layers, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Cpu, 
  ArrowRight,
  ShieldCheck,
  Pause
} from 'lucide-react';
import { ProjectDocument, ProjectRecord, Discipline } from '../types';
import { DrawingIntelligenceEngine } from '../engine/drawingIntelligenceEngine';

interface ProjectAnalysisQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectRecord;
  documents: ProjectDocument[];
  onDocumentAnalyzed: () => void;
}

const DISCIPLINE_ORDER: { [key in Discipline]?: number } = {
  Civil: 1,
  Architectural: 2,
  Structural: 3,
  Steel: 4,
  HVAC: 5,
  Electrical: 6,
  Plumbing: 7,
  'Fire Fighting': 8,
  'Shop Drawings': 9,
  'Fabrication Drawings': 10,
  'IFC/BIM': 11,
  'Hand Sketches': 12,
  Schedules: 13,
  Specifications: 14,
  'Tender Documents': 15,
  Other: 16
};

export const ProjectAnalysisQueueModal: React.FC<ProjectAnalysisQueueModalProps> = ({
  isOpen,
  onClose,
  project,
  documents,
  onDocumentAnalyzed,
}) => {
  if (!isOpen) return null;

  const [isRunning, setIsRunning] = useState(false);
  const [currentDocIndex, setCurrentDocIndex] = useState<number>(-1);
  const [statusLog, setStatusLog] = useState<string>('Ready to start batch analysis.');
  const [analyzedCount, setAnalyzedCount] = useState<number>(0);

  // Sort documents by standard engineering discipline sequence
  const sortedDocs = [...documents].sort((a, b) => {
    const orderA = DISCIPLINE_ORDER[a.discipline] || 99;
    const orderB = DISCIPLINE_ORDER[b.discipline] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return (a.drawingNumber || '').localeCompare(b.drawingNumber || '');
  });

  const handleStartQueue = async () => {
    setIsRunning(true);
    let count = 0;

    for (let i = 0; i < sortedDocs.length; i++) {
      setCurrentDocIndex(i);
      const doc = sortedDocs[i];
      setStatusLog(`Analyzing ${doc.drawingNumber} (${doc.discipline}) — ${doc.title}...`);

      try {
        await DrawingIntelligenceEngine.analyzeDocument(
          project,
          doc,
          { mode: 'DOCUMENT' },
          (stage) => {
            setStatusLog(`[${doc.drawingNumber}] ${stage}`);
          }
        );
        count++;
        setAnalyzedCount(count);
      } catch (err) {
        console.error(`Error analyzing ${doc.drawingNumber}:`, err);
      }

      await new Promise((r) => setTimeout(r, 300));
    }

    setIsRunning(false);
    setStatusLog('All project drawings analyzed successfully.');
    onDocumentAnalyzed();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Project Drawing Analysis Queue
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Sequenced multi-drawing extraction pipeline ({sortedDocs.length} Drawings)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-800">
                Discipline Order: Civil → Architectural → Structural → Steel → Roof → MEP
              </span>
            </div>
            <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {analyzedCount} / {sortedDocs.length} Completed
            </span>
          </div>

          {/* Queue List */}
          <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-72 overflow-y-auto bg-white">
            {sortedDocs.map((doc, idx) => {
              const isCurrent = idx === currentDocIndex;
              const isDone = idx < currentDocIndex || doc.analysisStatus === 'ANALYZED';

              return (
                <div
                  key={doc.id}
                  className={`p-3 flex items-center justify-between text-xs transition-colors ${
                    isCurrent
                      ? 'bg-indigo-50/70 border-l-4 border-l-indigo-600'
                      : isDone
                      ? 'bg-slate-50/40'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-400 w-6">
                      {(idx + 1).toString().padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono">
                          {doc.drawingNumber}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                          {doc.discipline}
                        </span>
                        <span className="text-slate-400 text-[11px]">Rev {doc.revision}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-sm">{doc.title}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrent ? (
                      <span className="flex items-center gap-1 text-indigo-600 font-bold text-[11px] animate-pulse">
                        <Cpu className="w-3.5 h-3.5 animate-spin" />
                        Analyzing...
                      </span>
                    ) : isDone ? (
                      <span className="flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Analyzed ({doc.detectedElementsCount} elms)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                        <Clock className="w-3.5 h-3.5" />
                        Waiting in queue
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Status Bar */}
          <div className="p-3 bg-slate-900 text-white rounded-lg font-mono text-xs flex items-center justify-between">
            <span className="truncate max-w-lg">{statusLog}</span>
            {isRunning && <span className="animate-pulse text-emerald-400 font-bold">ACTIVE</span>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors disabled:opacity-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={handleStartQueue}
            disabled={isRunning || sortedDocs.length === 0}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{isRunning ? 'Processing Pipeline...' : 'Run All Drawings in Sequence'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
