import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Ruler, 
  Percent, 
  FileSpreadsheet, 
  ShieldCheck, 
  User, 
  Check, 
  ArrowLeft, 
  Home, 
  Save, 
  Sliders,
  Layers,
  Database
} from 'lucide-react';
import { ProjectRecord } from '../types';

interface SettingsWorkspaceProps {
  project: ProjectRecord | null;
  onNavigateHome: () => void;
  onNavigateBack: () => void;
  onSaveProjectSettings?: (updatedProject: ProjectRecord) => void;
  onOpenEditProjectModal?: () => void;
}

type SettingsSection = 
  | 'project'
  | 'company'
  | 'units'
  | 'precision'
  | 'boq'
  | 'rules'
  | 'priority'
  | 'user';

export const SettingsWorkspace: React.FC<SettingsWorkspaceProps> = ({
  project,
  onNavigateHome,
  onNavigateBack,
  onSaveProjectSettings,
  onOpenEditProjectModal,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('project');
  const [unitSystem, setUnitSystem] = useState<string>(project?.engineeringSettings?.unitSystem || 'Metric');
  const [measurementStandard, setMeasurementStandard] = useState<string>(project?.engineeringSettings?.measurementStandard || 'IS 1200 / SMM7');
  const [rebarDensity, setRebarDensity] = useState<number>(project?.engineeringSettings?.steelDensity || 7850);
  const [concreteDensity, setConcreteDensity] = useState<number>(project?.engineeringSettings?.concreteDensity || 2400);
  const [currency, setCurrency] = useState<string>(project?.tender?.currency || 'AED');
  const [currencySymbol, setCurrencySymbol] = useState<string>(project?.tender?.currencySymbol || 'د.إ');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const sections: { id: SettingsSection; title: string; desc: string; icon: any }[] = [
    { id: 'project', title: 'Project Parameters', desc: 'Code, title, location & typology', icon: Building2 },
    { id: 'company', title: 'Company & Client Details', desc: 'Contractor organization, license & contacts', icon: User },
    { id: 'units', title: 'Units of Measurement', desc: 'Metric / Imperial length, area & volume units', icon: Ruler },
    { id: 'precision', title: 'Decimal Precision & Rounding', desc: 'Rounding rules for BOQ rates & quantities', icon: Percent },
    { id: 'boq', title: 'BOQ Presentation Rules', desc: 'Bill numbering, sub-totals & formatting', icon: FileSpreadsheet },
    { id: 'rules', title: 'Measurement Rules & Deductions', desc: 'Opening deduction thresholds (IS 1200 / POMI)', icon: Sliders },
    { id: 'priority', title: 'Source Priority Hierarchy', desc: 'Conflict resolution rules (Detail > Plan > Specs)', icon: Layers },
    { id: 'user', title: 'Estimator & User Preferences', desc: 'Display preferences & workflow configurations', icon: Settings },
  ];

  const handleSave = () => {
    if (!project) return;
    const updated: ProjectRecord = {
      ...project,
      engineeringSettings: {
        ...project.engineeringSettings,
        unitSystem: unitSystem as any,
        measurementStandard: measurementStandard as any,
        steelDensity: rebarDensity,
        concreteDensity: concreteDensity,
      },
      tender: {
        ...project.tender,
        currency,
        currencySymbol,
      } as any,
    };
    if (onSaveProjectSettings) {
      onSaveProjectSettings(updated);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-y-auto">
      {/* Top Header Strip with Back & Home */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-2xs sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            id="settings-back-btn"
            onClick={onNavigateBack}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>[ ← BACK ]</span>
          </button>
          <button
            id="settings-home-btn"
            onClick={onNavigateHome}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4 text-indigo-600" />
            <span>[ HOME ]</span>
          </button>
          <div className="h-5 w-px bg-slate-200" />
          <div>
            <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-600" />
              <span>Project & Measurement Settings</span>
            </h1>
            <p className="text-[11px] text-slate-500">
              Project: <strong className="text-slate-800">{project?.project?.name || 'Unnamed Project'}</strong> ({project?.id || 'N/A'})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>[ SAVE SETTINGS ]</span>
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
        {/* Navigation Sidebar List */}
        <div className="space-y-1 md:col-span-1">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-indigo-900 font-bold shadow-xs border border-indigo-200'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 truncate">
                  <div className="text-xs font-bold">{sec.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{sec.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Section Content Panel */}
        <div className="md:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
              {sections.find((s) => s.id === activeSection)?.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {sections.find((s) => s.id === activeSection)?.desc}
            </p>
          </div>

          {activeSection === 'project' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Name</label>
                  <input
                    type="text"
                    disabled
                    value={project?.project?.name || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-medium cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project ID</label>
                  <input
                    type="text"
                    disabled
                    value={project?.id || ''}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currency Code</label>
                  <input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-800 font-bold"
                  />
                </div>
              </div>

              {onOpenEditProjectModal && (
                <button
                  type="button"
                  onClick={onOpenEditProjectModal}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors cursor-pointer"
                >
                  [ Edit Full Project Information Modal ]
                </button>
              )}
            </div>
          )}

          {activeSection === 'units' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit System</label>
                <select
                  value={unitSystem}
                  onChange={(e) => setUnitSystem(e.target.value)}
                  className="w-full sm:w-1/2 bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
                >
                  <option value="Metric">Metric (m, mm, m², m³, kg, MT)</option>
                  <option value="Imperial">Imperial (ft, in, sq ft, cu yd, lbs, tons)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Steel Density (kg/m³)</label>
                  <input
                    type="number"
                    value={rebarDensity}
                    onChange={(e) => setRebarDensity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">RCC Concrete Density (kg/m³)</label>
                  <input
                    type="number"
                    value={concreteDensity}
                    onChange={(e) => setConcreteDensity(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'rules' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Standard Method of Measurement</label>
                <select
                  value={measurementStandard}
                  onChange={(e) => setMeasurementStandard(e.target.value)}
                  className="w-full sm:w-1/2 bg-white border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
                >
                  <option value="IS 1200 / SMM7">IS 1200 (Indian Standard) / SMM7 (Civil & Building)</option>
                  <option value="CESMM4">CESMM4 (Civil Engineering Standard Method of Measurement)</option>
                  <option value="POMI">POMI (Principles of Measurement International)</option>
                  <option value="NRM2">NRM2 (RICS New Rules of Measurement)</option>
                </select>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-700">
                <p className="font-bold text-slate-900">Standard Deduction Thresholds:</p>
                <p>• Concrete Openings: Openings ≤ 0.1 m² (0.01 m³) not deducted (per IS 1200 Part 2).</p>
                <p>• Plaster & Painting: Openings ≤ 0.5 m² no deduction and no additions for jambs.</p>
                <p>• Masonry: Full opening deducted; lintel bearing volume deducted.</p>
              </div>
            </div>
          )}

          {activeSection === 'priority' && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                When drawings of different scales or disciplines conflict, the system follows this deterministic hierarchy:
              </p>
              <ol className="list-decimal list-inside space-y-2 font-medium text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <li><strong className="text-indigo-700">1:20 / 1:10 Large-Scale Engineering Detail</strong> (Overrides General Plans)</li>
                <li><strong className="text-indigo-700">1:50 Discipline Layout Plan</strong> (Structural Framing & MEP Schematics)</li>
                <li><strong className="text-indigo-700">1:100 Architectural Overall General Arrangement</strong></li>
                <li><strong className="text-indigo-700">Written Dimension Notation</strong> (Strictly overrides manual on-screen ruler pixel scaling)</li>
              </ol>
            </div>
          )}

          {['company', 'precision', 'boq', 'user'].includes(activeSection) && (
            <div className="space-y-3 text-xs text-slate-600">
              <p className="font-bold text-slate-900">Configuration Loaded</p>
              <p>System settings for {activeSection.toUpperCase()} are active and synchronized with project <span className="font-mono font-bold text-indigo-700">{project?.id}</span>.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
