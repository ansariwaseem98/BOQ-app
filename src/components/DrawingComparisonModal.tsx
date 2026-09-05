import React, { useState } from 'react';
import { Layers, X, ArrowLeftRight, Check, AlertCircle, FileText } from 'lucide-react';
import { ProjectDocument } from '../types';

interface DrawingComparisonModalProps {
  currentDoc: ProjectDocument;
  allRevisions: ProjectDocument[];
  onClose: () => void;
}

export const DrawingComparisonModal: React.FC<DrawingComparisonModalProps> = ({
  currentDoc,
  allRevisions,
  onClose,
}) => {
  const [compareDocId, setCompareDocId] = useState<string>(
    allRevisions.find((d) => d.id !== currentDoc.id)?.id || allRevisions[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'split' | 'overlay'>('split');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(50);

  const compareDoc = allRevisions.find((d) => d.id === compareDocId) || null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Drawing Revision Comparison</h3>
              <p className="text-xs text-slate-400 font-mono">
                Compare Drawing Series: {currentDoc.drawingNumber || currentDoc.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setViewMode('split')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Side-by-Side
              </button>
              <button
                onClick={() => setViewMode('overlay')}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  viewMode === 'overlay' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Overlay Diff
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Base:</span>
              <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {currentDoc.revision} ({currentDoc.sourceFileName})
              </span>
            </div>
            <span className="text-slate-300">vs</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Compare With:</span>
              <select
                value={compareDocId}
                onChange={(e) => setCompareDocId(e.target.value)}
                className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs font-semibold text-slate-800"
              >
                {allRevisions.map((rev) => (
                  <option key={rev.id} value={rev.id}>
                    {rev.revision} • {rev.drawingDate || rev.uploadDate.split('T')[0]} ({rev.sourceFileName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {viewMode === 'overlay' && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-semibold">Overlay Opacity:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseInt(e.target.value, 10))}
                className="w-28 accent-blue-600"
              />
              <span className="font-mono text-xs font-bold text-slate-700">{overlayOpacity}%</span>
            </div>
          )}
        </div>

        {/* Comparison Stage */}
        <div className="flex-1 bg-slate-950 p-4 relative overflow-auto min-h-[400px] flex items-center justify-center">
          {viewMode === 'split' ? (
            <div className="grid grid-cols-2 gap-4 w-full h-full">
              {/* Left: Base */}
              <div className="flex flex-col border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
                <div className="px-3 py-1.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold text-emerald-400">Primary: {currentDoc.revision}</span>
                  <span className="font-mono text-[11px] text-slate-400">{currentDoc.uploadDate.split('T')[0]}</span>
                </div>
                <div className="flex-1 p-2 flex items-center justify-center overflow-auto">
                  {currentDoc.previewDataUrl ? (
                    <img
                      src={currentDoc.previewDataUrl}
                      alt="Primary revision"
                      className="max-h-[50vh] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center text-slate-500 p-6">
                      <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p className="text-xs">{currentDoc.sourceFileName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Compare */}
              <div className="flex flex-col border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
                <div className="px-3 py-1.5 bg-slate-800 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-bold text-amber-400">Compare: {compareDoc?.revision || 'None'}</span>
                  <span className="font-mono text-[11px] text-slate-400">{compareDoc?.uploadDate.split('T')[0]}</span>
                </div>
                <div className="flex-1 p-2 flex items-center justify-center overflow-auto">
                  {compareDoc?.previewDataUrl ? (
                    <img
                      src={compareDoc.previewDataUrl}
                      alt="Compare revision"
                      className="max-h-[50vh] object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="text-center text-slate-500 p-6">
                      <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p className="text-xs">{compareDoc?.sourceFileName || 'No preview available'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Overlay Diff Mode */
            <div className="relative border border-slate-800 rounded-lg overflow-hidden bg-slate-900 p-2 max-w-full max-h-full flex items-center justify-center">
              {currentDoc.previewDataUrl && (
                <img
                  src={currentDoc.previewDataUrl}
                  alt="Base"
                  className="max-h-[60vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
              {compareDoc?.previewDataUrl && (
                <img
                  src={compareDoc.previewDataUrl}
                  alt="Overlay"
                  className="max-h-[60vh] object-contain absolute inset-0 m-auto mix-blend-difference"
                  style={{ opacity: overlayOpacity / 100 }}
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            {allRevisions.length} total revision(s) in drawing series{' '}
            <strong className="font-mono text-slate-800">{currentDoc.drawingNumber || currentDoc.id}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
