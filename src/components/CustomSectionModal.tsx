import React, { useState } from 'react';
import { X, Plus, ShieldCheck, Database, Trash2, CheckCircle2 } from 'lucide-react';
import { SteelSectionItem, SteelSectionType } from '../types';
import {
  getAllAvailableSections,
  getCustomSections,
  registerCustomSection,
  removeCustomSection,
} from '../engine/steelSectionDatabase';

interface CustomSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSectionUpdated?: () => void;
}

export const CustomSectionModal: React.FC<CustomSectionModalProps> = ({
  isOpen,
  onClose,
  onSectionUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'add'>('catalog');
  const [customList, setCustomList] = useState<SteelSectionItem[]>(getCustomSections());

  // Form State
  const [designation, setDesignation] = useState('');
  const [type, setType] = useState<SteelSectionType>('UB');
  const [standard, setStandard] = useState('Project Custom Specification');
  const [massKgM, setMassKgM] = useState<number | ''>('');
  const [depthMm, setDepthMm] = useState<number | ''>('');
  const [widthMm, setWidthMm] = useState<number | ''>('');
  const [webThkMm, setWebThkMm] = useState<number | ''>('');
  const [flangeThkMm, setFlangeThkMm] = useState<number | ''>('');
  const [source, setSource] = useState('Structural Engineer Approved Submittal / Fabricator Catalog');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!designation.trim() || !massKgM || Number(massKgM) <= 0) {
      alert('Please specify a valid section designation and positive mass (kg/m).');
      return;
    }

    const newSection: SteelSectionItem = {
      sectionId: `CUSTOM-${Date.now()}`,
      designation: designation.trim(),
      type,
      standard: standard.trim() || 'Custom',
      massKgM: Number(massKgM),
      depthMm: Number(depthMm) || 0,
      widthMm: Number(widthMm) || 0,
      webThicknessMm: Number(webThkMm) || 0,
      flangeThicknessMm: Number(flangeThkMm) || 0,
      source: source.trim() || 'User Verified',
      isCustom: true,
      notes: notes.trim(),
    };

    registerCustomSection(newSection);
    setCustomList(getCustomSections());
    setSuccessMsg(`Section "${newSection.designation}" verified and registered.`);
    setTimeout(() => setSuccessMsg(''), 4000);

    // Reset
    setDesignation('');
    setMassKgM('');
    setDepthMm('');
    setWidthMm('');
    setWebThkMm('');
    setFlangeThkMm('');
    setNotes('');
    setActiveTab('catalog');
    if (onSectionUpdated) onSectionUpdated();
  };

  const handleDelete = (sectionId: string) => {
    if (confirm('Are you sure you want to remove this custom section?')) {
      removeCustomSection(sectionId);
      setCustomList(getCustomSections());
      if (onSectionUpdated) onSectionUpdated();
    }
  };

  const allSections = getAllAvailableSections();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Certified Steel Section Database
              </h2>
              <p className="text-xs text-slate-500">
                Standard BS / EN / AISC catalogs & project-verified custom sections
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

        {/* Tab navigation */}
        <div className="flex items-center px-6 border-b border-slate-200 bg-white gap-4">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'catalog'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Catalog Directory ({allSections.length} sections)
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'add'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Register Custom Section</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {activeTab === 'catalog' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span>
                  Showing all certified structural sections. Custom sections are marked with{' '}
                  <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    CUSTOM
                  </span>
                </span>
                <span className="font-semibold text-slate-700">
                  {customList.length} Custom / {allSections.length} Total
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5">Designation</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Standard</th>
                      <th className="px-3 py-2.5 text-right">Mass (kg/m)</th>
                      <th className="px-3 py-2.5 text-right">Depth (mm)</th>
                      <th className="px-3 py-2.5 text-right">Width (mm)</th>
                      <th className="px-3 py-2.5">Source</th>
                      <th className="px-3 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allSections.map((sec) => (
                      <tr
                        key={sec.sectionId}
                        className={`hover:bg-slate-50 ${sec.isCustom ? 'bg-amber-50/40 font-medium' : ''}`}
                      >
                        <td className="px-3 py-2 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          {sec.designation}
                          {sec.isCustom && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              CUSTOM
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{sec.type}</td>
                        <td className="px-3 py-2 text-slate-500 truncate max-w-[140px]">{sec.standard}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-indigo-700">
                          {sec.massKgM.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-600">
                          {sec.depthMm ? sec.depthMm.toFixed(1) : '-'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-600">
                          {sec.widthMm ? sec.widthMm.toFixed(1) : '-'}
                        </td>
                        <td className="px-3 py-2 text-slate-500 truncate max-w-[160px]">{sec.source}</td>
                        <td className="px-3 py-2 text-center">
                          {sec.isCustom ? (
                            <button
                              onClick={() => handleDelete(sec.sectionId)}
                              title="Delete custom section"
                              className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto" title="Standard Catalog" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAdd} className="space-y-4 max-w-2xl mx-auto">
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs">
                <strong>Engineering Notice:</strong> Custom steel sections must be backed by structural engineer submittals or certified manufacturer catalog data. Do not input estimated values.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Section Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. W 18x50, Custom Box 300x200x10"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Section Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as SteelSectionType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UB">Universal Beam (UB / I-Section)</option>
                    <option value="UC">Universal Column (UC / H-Section)</option>
                    <option value="IPE">European I-Beam (IPE)</option>
                    <option value="HEA">Wide Flange (HEA / HEB)</option>
                    <option value="RHS">Rectangular Hollow Section (RHS)</option>
                    <option value="SHS">Square Hollow Section (SHS)</option>
                    <option value="CHS">Circular Hollow Section (CHS / Pipe)</option>
                    <option value="Angle">Equal / Unequal Angle (L)</option>
                    <option value="Channel">Parallel Flange Channel (PFC / C)</option>
                    <option value="Purlin">Cold-Formed Z / C Purlin</option>
                    <option value="Plate">Built-up Plate Girder / Plate</option>
                    <option value="Custom">Custom Built-up / Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Unit Mass (kg/m) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 54.10"
                    value={massKgM}
                    onChange={(e) => setMassKgM(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Depth / Height (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 402.6"
                    value={depthMm}
                    onChange={(e) => setDepthMm(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Flange Width (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 177.7"
                    value={widthMm}
                    onChange={(e) => setWidthMm(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Web Thickness (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 7.7"
                    value={webThkMm}
                    onChange={(e) => setWebThkMm(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Flange Thickness (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 10.9"
                    value={flangeThkMm}
                    onChange={(e) => setFlangeThkMm(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Source / Verification Reference *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Structural Submittal Ref ST-SUB-04, Table 3.2"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional engineer notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Section</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
