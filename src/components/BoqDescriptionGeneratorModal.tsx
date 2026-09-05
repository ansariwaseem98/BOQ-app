import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  History,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Edit3,
  ShieldCheck
} from 'lucide-react';
import { BOQItemObject } from '../types/boqAssemblyTypes';
import { BoqAssemblyEngine } from '../engine/boqAssemblyEngine';

interface BoqDescriptionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BOQItemObject | null;
  onSave: (updatedItem: BOQItemObject) => void;
}

export const BoqDescriptionGeneratorModal: React.FC<BoqDescriptionGeneratorModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave
}) => {
  if (!isOpen || !item) return null;

  const [activeTab, setActiveTab] = useState<'GENERATOR' | 'MANUAL_EDIT' | 'AUDIT_HISTORY'>('GENERATOR');

  // Generator inputs
  const [workScope, setWorkScope] = useState('supplying and placing Reinforced Cement Concrete (RCC)');
  const [elementType, setElementType] = useState(item.description.split(' ')[2] || 'structural members');
  const [material, setMaterial] = useState('Design Mix Concrete');
  const [grade, setGrade] = useState('M35');
  const [dimensions, setDimensions] = useState('as per structural layout');
  const [location, setLocation] = useState(item.location || 'Substructure to L04');
  const [finishingOrCuring, setFinishingOrCuring] = useState('proper mechanical vibratory compaction and 14-day wet curing');
  const [standardReference, setStandardReference] = useState('IS 456:2000 / BS 8110 / Project Specs');

  // Manual Edit inputs
  const [customDescription, setCustomDescription] = useState(item.description);
  const [editReason, setEditReason] = useState('');
  const [editorName, setEditorName] = useState('Senior Quantity Surveyor');

  // Real-time generated output
  const generated = BoqAssemblyEngine.generateProfessionalDescription({
    workScope,
    elementType,
    material,
    grade,
    dimensions,
    location,
    finishingOrCuring,
    standardReference
  });

  const handleApplyGenerated = () => {
    const updated = BoqAssemblyEngine.editDescription(
      item,
      generated.description,
      editorName,
      `Standard Description Generated: ${workScope} for ${elementType}`
    );
    onSave(updated);
    onClose();
  };

  const handleApplyManualEdit = () => {
    if (!customDescription.trim()) return;
    const updated = BoqAssemblyEngine.editDescription(
      item,
      customDescription,
      editorName,
      editReason || 'Standard manual specification refinement'
    );
    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-6 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-700/60 rounded-xl border border-teal-500/40">
              <FileText className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Phase 15F — Professional Description Generator & Editor</h2>
              <p className="text-xs text-teal-200 mt-0.5 font-medium">
                Item: {item.itemCode} • Section {item.sectionCode} • Zero-Hallucination Verified Engineering Descriptions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white hover:bg-teal-800/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex gap-4">
          <button
            onClick={() => setActiveTab('GENERATOR')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'GENERATOR'
                ? 'border-teal-600 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Structured Description Generator
          </button>
          <button
            onClick={() => setActiveTab('MANUAL_EDIT')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'MANUAL_EDIT'
                ? 'border-teal-600 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Direct Editor & Justification
          </button>
          <button
            onClick={() => setActiveTab('AUDIT_HISTORY')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'AUDIT_HISTORY'
                ? 'border-teal-600 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Immutable Audit Trail ({item.descriptionEditHistory?.length || 0})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {activeTab === 'GENERATOR' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Work Scope Action:</label>
                  <input
                    type="text"
                    value={workScope}
                    onChange={e => setWorkScope(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Element Type:</label>
                  <input
                    type="text"
                    value={elementType}
                    onChange={e => setElementType(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Material Name & Mix:</label>
                  <input
                    type="text"
                    value={material}
                    onChange={e => setMaterial(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Material Grade:</label>
                  <input
                    type="text"
                    value={grade}
                    onChange={e => setGrade(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Location / Levels:</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-teal-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Standard Spec Reference:</label>
                  <input
                    type="text"
                    value={standardReference}
                    onChange={e => setStandardReference(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-teal-500"
                  />
                </div>
              </div>

              {/* Real-Time Preview Card */}
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
                  Real-Time Description Preview (Tender Quality):
                </span>
                <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-lg border border-teal-200/80">
                  {generated.description}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-teal-700 font-mono">
                  <span>Specification Tag:</span>
                  <span className="font-bold">{generated.specification}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'MANUAL_EDIT' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Item Description:</label>
                <textarea
                  rows={4}
                  value={customDescription}
                  onChange={e => setCustomDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:outline-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Author / QS Name:</label>
                  <input
                    type="text"
                    value={editorName}
                    onChange={e => setEditorName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Reason for Modification:</label>
                  <input
                    type="text"
                    placeholder="e.g. Added specific additive requirement per client addendum"
                    value={editReason}
                    onChange={e => setEditReason(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'AUDIT_HISTORY' && (
            <div className="space-y-3">
              {!item.descriptionEditHistory || item.descriptionEditHistory.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
                  No previous manual modifications. This description is currently in its original baseline state.
                </div>
              ) : (
                item.descriptionEditHistory.map(audit => (
                  <div key={audit.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{audit.user}</span>
                      <span className="font-mono text-slate-500">{audit.timestamp}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="p-2 bg-rose-50 text-rose-900 rounded border border-rose-100 line-through">
                        {audit.originalDescription}
                      </div>
                      <div className="p-2 bg-emerald-50 text-emerald-900 rounded border border-emerald-100 font-medium">
                        {audit.editedDescription}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">Justification: {audit.reason}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          {activeTab === 'GENERATOR' ? (
            <button
              onClick={handleApplyGenerated}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Apply Generated Description</span>
            </button>
          ) : activeTab === 'MANUAL_EDIT' ? (
            <button
              onClick={handleApplyManualEdit}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Description Edit</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
