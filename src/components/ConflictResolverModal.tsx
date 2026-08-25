import React, { useState } from 'react';
import { 
  X, 
  Check, 
  GitCompare, 
  AlertTriangle, 
  Layers, 
  CheckCircle,
  FileText
} from 'lucide-react';
import { IntelligenceConflict } from '../types';

interface ConflictResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: IntelligenceConflict | null;
  onResolve: (
    conflictId: string,
    resolution: 'use_source_a' | 'use_source_b' | 'custom_value',
    customValue?: string,
    decisionNote?: string,
    decidedBy?: string
  ) => void;
}

export const ConflictResolverModal: React.FC<ConflictResolverModalProps> = ({
  isOpen,
  onClose,
  conflict,
  onResolve,
}) => {
  if (!isOpen || !conflict) return null;

  const [selectedResolution, setSelectedResolution] = useState<'use_source_a' | 'use_source_b' | 'custom_value'>('use_source_b');
  const [customValue, setCustomValue] = useState('');
  const [decisionNote, setDecisionNote] = useState('');
  const [decidedBy, setDecidedBy] = useState('Lead Structural Engineer');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedResolution === 'custom_value' && !customValue.trim()) {
      alert('Please enter the custom engineering value to adopt.');
      return;
    }
    if (!decisionNote.trim()) {
      alert('Please provide an engineering justification note for this conflict resolution.');
      return;
    }

    onResolve(
      conflict.id,
      selectedResolution,
      selectedResolution === 'custom_value' ? customValue : undefined,
      decisionNote,
      decidedBy
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-red-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-red-900 bg-red-200/80 px-2 py-0.5 rounded">
                  {conflict.id}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {conflict.category.replace(/_/g, ' ')} Conflict
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">{conflict.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
            <strong className="font-bold text-slate-900">Element Affected:</strong> {conflict.elementName}
          </div>

          {/* Side by Side Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Source A */}
            <div
              onClick={() => setSelectedResolution('use_source_a')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedResolution === 'use_source_a'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Source Drawing A
                </span>
                <input
                  type="radio"
                  name="resolutionOption"
                  checked={selectedResolution === 'use_source_a'}
                  onChange={() => setSelectedResolution('use_source_a')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-900">
                  {conflict.sourceA.drawingNumber} (Rev {conflict.sourceA.revision})
                </div>
                <div className="text-xs text-slate-500">
                  Date: {conflict.sourceA.date || 'N/A'} • Location: {conflict.sourceA.location || 'Layout'}
                </div>
                <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-xs font-bold text-indigo-900 mt-2">
                  {conflict.sourceA.value}
                </div>
                <p className="text-[11px] text-slate-600 mt-1">{conflict.sourceA.description}</p>
              </div>
            </div>

            {/* Source B */}
            <div
              onClick={() => setSelectedResolution('use_source_b')}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedResolution === 'use_source_b'
                  ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Source Drawing B
                </span>
                <input
                  type="radio"
                  name="resolutionOption"
                  checked={selectedResolution === 'use_source_b'}
                  onChange={() => setSelectedResolution('use_source_b')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-900">
                  {conflict.sourceB.drawingNumber} (Rev {conflict.sourceB.revision})
                </div>
                <div className="text-xs text-slate-500">
                  Date: {conflict.sourceB.date || 'N/A'} • Location: {conflict.sourceB.location || 'Layout'}
                </div>
                <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-xs font-bold text-indigo-900 mt-2">
                  {conflict.sourceB.value}
                </div>
                <p className="text-[11px] text-slate-600 mt-1">{conflict.sourceB.description}</p>
              </div>
            </div>
          </div>

          {/* Option 3: Custom Override Value */}
          <div
            onClick={() => setSelectedResolution('custom_value')}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedResolution === 'custom_value'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Custom Engineering Override (Adopted Value)
              </span>
              <input
                type="radio"
                name="resolutionOption"
                checked={selectedResolution === 'custom_value'}
                onChange={() => setSelectedResolution('custom_value')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
            </div>
            {selectedResolution === 'custom_value' && (
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 mt-2"
                placeholder="e.g. 250mm RCC Shear Wall with 200mm Architectural Plaster Finish"
              />
            )}
          </div>

          {/* Decision Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Engineering Decision Justification Note <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={decisionNote}
              onChange={(e) => setDecisionNote(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Structural drawing S-201 takes precedence for structural core wall thickness. Architectural finish is 20mm plaster on each face."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Resolve Conflict</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
