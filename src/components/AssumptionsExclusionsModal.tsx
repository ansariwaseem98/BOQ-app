import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { ProjectAssumptionRecord, ProjectExclusionRecord } from '../types';

interface AssumptionsExclusionsModalProps {
  assumptions: ProjectAssumptionRecord[];
  exclusions: ProjectExclusionRecord[];
  onAddAssumption: (asm: ProjectAssumptionRecord) => void;
  onAddExclusion: (exc: ProjectExclusionRecord) => void;
  onClose: () => void;
}

export const AssumptionsExclusionsModal: React.FC<AssumptionsExclusionsModalProps> = ({
  assumptions,
  exclusions,
  onAddAssumption,
  onAddExclusion,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ASSUMPTIONS' | 'EXCLUSIONS'>('ASSUMPTIONS');

  // Form states
  const [asmDesc, setAsmDesc] = useState('');
  const [asmReason, setAsmReason] = useState('');
  const [asmUser, setAsmUser] = useState('Senior QS Estimator');

  const [excDesc, setExcDesc] = useState('');
  const [excReason, setExcReason] = useState('');
  const [excCategory, setExcCategory] = useState<ProjectExclusionRecord['category']>('SITE_WORKS');
  const [excUser, setExcUser] = useState('Commercial Lead');

  const handleAddAsm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asmDesc) return;
    const newAsm: ProjectAssumptionRecord = {
      id: `ASM-00${assumptions.length + 1}`,
      description: asmDesc,
      reason: asmReason,
      enteredBy: asmUser,
      date: new Date().toISOString().slice(0, 10),
      status: 'ACTIVE',
    };
    onAddAssumption(newAsm);
    setAsmDesc('');
    setAsmReason('');
  };

  const handleAddExc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!excDesc) return;
    const newExc: ProjectExclusionRecord = {
      id: `EXC-00${exclusions.length + 1}`,
      description: excDesc,
      reason: excReason,
      enteredBy: excUser,
      date: new Date().toISOString().slice(0, 10),
      category: excCategory,
    };
    onAddExclusion(newExc);
    setExcDesc('');
    setExcReason('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Project Assumptions & Exclusions Registers</h3>
            <p className="text-xs text-slate-400">Explicit, human-entered contractual boundaries (No AI hallucinated assumptions)</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ASSUMPTIONS')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'ASSUMPTIONS'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            Assumptions Register ({assumptions.length})
          </button>
          <button
            onClick={() => setActiveTab('EXCLUSIONS')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'EXCLUSIONS'
                ? 'border-amber-600 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Exclusions Register ({exclusions.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'ASSUMPTIONS' ? (
            <div className="space-y-4">
              {/* Add Assumption Form */}
              <form onSubmit={handleAddAsm} className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-3">
                <h4 className="font-bold text-indigo-950 uppercase tracking-wider text-2xs">Add Explicit Assumption</h4>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assumption Description</label>
                  <input
                    type="text"
                    value={asmDesc}
                    onChange={(e) => setAsmDesc(e.target.value)}
                    placeholder="e.g. Disposal distance assumed up to 25 km municipal dumping ground..."
                    className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reason / Justification</label>
                  <input
                    type="text"
                    value={asmReason}
                    onChange={(e) => setAsmReason(e.target.value)}
                    placeholder="e.g. Specific site location not specified in Volume I..."
                    className="w-full px-3 py-1.5 border border-indigo-300 rounded-lg bg-white"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Assumption
                  </button>
                </div>
              </form>

              {/* Assumptions List */}
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                {assumptions.map((asm) => (
                  <div key={asm.id} className="p-3.5 hover:bg-slate-50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-600">{asm.id}</span>
                      <span className="text-slate-400 font-mono text-2xs">Recorded by {asm.enteredBy} on {asm.date}</span>
                    </div>
                    <p className="font-semibold text-slate-800">{asm.description}</p>
                    <p className="text-slate-500 text-2xs italic">Basis: {asm.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add Exclusion Form */}
              <form onSubmit={handleAddExc} className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
                <h4 className="font-bold text-amber-950 uppercase tracking-wider text-2xs">Add Explicit Project Exclusion</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Exclusion Description</label>
                    <input
                      type="text"
                      value={excDesc}
                      onChange={(e) => setExcDesc(e.target.value)}
                      placeholder="e.g. Loose furniture, soft landscape outside 1.5m perimeter..."
                      className="w-full px-3 py-1.5 border border-amber-300 rounded-lg bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Category</label>
                    <select
                      value={excCategory}
                      onChange={(e) => setExcCategory(e.target.value as any)}
                      className="w-full px-3 py-1.5 border border-amber-300 rounded-lg bg-white font-mono"
                    >
                      <option value="SITE_WORKS">SITE_WORKS</option>
                      <option value="UTILITIES">UTILITIES</option>
                      <option value="FURNITURE">FURNITURE</option>
                      <option value="SPECIAL_EQUIPMENT">SPECIAL_EQUIPMENT</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Commercial Reason</label>
                  <input
                    type="text"
                    value={excReason}
                    onChange={(e) => setExcReason(e.target.value)}
                    placeholder="e.g. Tendered separately under Landscape Package C..."
                    className="w-full px-3 py-1.5 border border-amber-300 rounded-lg bg-white"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Record Exclusion
                  </button>
                </div>
              </form>

              {/* Exclusions List */}
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                {exclusions.map((exc) => (
                  <div key={exc.id} className="p-3.5 hover:bg-slate-50 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-600">{exc.id}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-2xs uppercase font-semibold">
                        {exc.category}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800">{exc.description}</p>
                    <p className="text-slate-500 text-2xs italic">Commercial Reason: {exc.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Close Registers
          </button>
        </div>
      </div>
    </div>
  );
};
