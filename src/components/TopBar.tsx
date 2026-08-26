import React from 'react';
import { 
  Sparkles, 
  Settings, 
  AlertTriangle,
  FolderOpen,
  Layers,
  Scale,
  FileSpreadsheet,
  History,
  FileCheck,
  Building2,
  Plus,
  FolderKanban,
  ChevronDown,
  Calculator,
  Zap,
  ShieldCheck,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { ProjectRecord } from '../types';

export type ActiveTab = 
  | 'dashboard' 
  | 'projects-list'
  | 'drawings' 
  | 'intelligence'
  | 'takeoff'
  | 'measurement-engine'
  | 'workspace' 
  | 'steel'
  | 'architectural'
  | 'mep'
  | 'boq' 
  | 'rate-analysis'
  | 'tender'
  | 'bbs' 
  | 'open-items' 
  | 'revisions';

interface TopBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  projectData: ProjectRecord | null;
  projectsList: ProjectRecord[];
  onSelectProject: (id: string) => void;
  openItemsCount: number;
  conflictsCount: number;
  validationWarningsCount: number;
  onOpenCreateProject: () => void;
  onOpenEditProject: () => void;
  onOpenValidation: () => void;
  onExportExcel: () => void;
  onTriggerAiScan: () => void;
  onOpenValidationDashboard?: () => void;
  onOpenReviewQueue?: () => void;
  onOpenE2ETests?: () => void;
  onOpenErrorReport?: () => void;
  onOpenExportCenter?: () => void;
  onOpenExportTests?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  projectData,
  projectsList,
  onSelectProject,
  openItemsCount,
  conflictsCount,
  validationWarningsCount,
  onOpenCreateProject,
  onOpenEditProject,
  onOpenValidation,
  onExportExcel,
  onTriggerAiScan,
  onOpenValidationDashboard,
  onOpenReviewQueue,
  onOpenE2ETests,
  onOpenErrorReport,
  onOpenExportCenter,
  onOpenExportTests,
}) => {
  const totalOpenConflicts = openItemsCount + conflictsCount;
  const hasProject = Boolean(projectData && projectData.id && projectData.project?.name);

  return (
    <header className="bg-white border-b border-slate-200 shrink-0 select-none z-40 sticky top-0">
      {/* Top Brand & Actions Bar (h-16) */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        {/* Left: Brand & Active Project Context */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-xs shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-black tracking-tight text-slate-900 uppercase">
              AI BOQ & Tender Estimator
            </h1>
            <div className="flex items-center gap-2">
              {hasProject ? (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {projectData?.id}
                  </span>
                  <button
                    onClick={() => setActiveTab('projects-list')}
                    className="text-xs text-slate-800 font-bold hover:text-indigo-600 truncate max-w-[240px] text-left transition-colors"
                    title="Switch project"
                  >
                    {projectData?.project.name}
                  </button>
                  {projectData?.isTestProject && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      TEST FIXTURE
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 italic">No project created</span>
                  <button
                    onClick={onOpenCreateProject}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    + Create New Project
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {hasProject ? (
            <>
              {/* Quick Project Switcher Dropdown */}
              {projectsList.length > 1 && (
                <div className="relative hidden md:block">
                  <select
                    value={projectData?.id || ''}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        onOpenCreateProject();
                      } else {
                        onSelectProject(e.target.value);
                      }
                    }}
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 pr-7 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                  >
                    {projectsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id}: {p.project?.name ? p.project.name.slice(0, 30) : 'Unnamed'}
                      </option>
                    ))}
                    <option value="__NEW__">+ Create New Project...</option>
                  </select>
                </div>
              )}

              {/* Phase 10: Validation Dashboard */}
              {onOpenValidationDashboard && (
                <button
                  onClick={onOpenValidationDashboard}
                  title="Open Takeoff Validation Dashboard (Calculated vs Reference)"
                  className="px-2.5 py-1.5 rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Validation</span>
                </button>
              )}

              {/* Phase 10: Review Queue */}
              {onOpenReviewQueue && (
                <button
                  onClick={onOpenReviewQueue}
                  title="Open Smart Human Verification Queue"
                  className="px-2.5 py-1.5 rounded-lg text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-xs font-bold transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden lg:inline">Review Queue</span>
                </button>
              )}

              {/* Phase 10: 56 E2E Tests */}
              {onOpenE2ETests && (
                <button
                  onClick={onOpenE2ETests}
                  title="Run 56-Rule End-to-End Pipeline Test Suite"
                  className="px-2.5 py-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden lg:inline">56 Tests</span>
                </button>
              )}

              {/* Phase 11: Export Center (Primary) */}
              {onOpenExportCenter ? (
                <button
                  onClick={onOpenExportCenter}
                  title="Open Professional Excel Export Center (BOQ, BBS, Abstract, Tender)"
                  className="px-3.5 py-1.5 rounded-lg text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>EXPORT CENTER</span>
                </button>
              ) : (
                <button
                  onClick={onExportExcel}
                  title="Export Tender Package to Excel"
                  className="px-3 py-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-xs font-bold transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export</span>
                </button>
              )}

              <button
                onClick={onOpenCreateProject}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ NEW</span>
              </button>

              <button
                onClick={onOpenEditProject}
                title="Edit current project information"
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <Settings className="w-4 h-4 text-slate-600" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenCreateProject}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-2xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>+ CREATE NEW PROJECT</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Bar (h-11) */}
      <nav className="h-11 flex items-center px-6 gap-6 overflow-x-auto bg-white">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`text-xs font-semibold h-full flex items-center transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Project Dashboard
        </button>

        <button
          onClick={() => setActiveTab('projects-list')}
          className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'projects-list'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>Projects Directory ({projectsList.length})</span>
        </button>

        {hasProject && (
          <>
            <button
              onClick={() => setActiveTab('drawings')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'drawings'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Drawing Register</span>
            </button>

            <button
              onClick={() => setActiveTab('intelligence')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'intelligence'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Drawing Intelligence</span>
            </button>

            <button
              onClick={() => setActiveTab('takeoff')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'takeoff'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quantity Takeoff (Phase 4)</span>
            </button>

            <button
              onClick={() => setActiveTab('measurement-engine')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'measurement-engine'
                  ? 'text-indigo-700 border-b-2 border-indigo-600 font-black bg-indigo-50/70 px-2.5 rounded-t'
                  : 'text-indigo-900 bg-indigo-50/40 hover:bg-indigo-50 font-bold px-2 rounded-t'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-extrabold tracking-tight">CALC ENGINE (Phase 15A)</span>
            </button>

            <button
              onClick={() => setActiveTab('workspace')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'workspace'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>RCC & CAD Takeoff</span>
            </button>

            <button
              onClick={() => setActiveTab('steel')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'steel'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Steel & Roof Takeoff (Phase 6)</span>
            </button>

            <button
              onClick={() => setActiveTab('architectural')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'architectural'
                  ? 'text-indigo-700 border-b-2 border-indigo-600 font-black bg-indigo-50/70 px-2.5 rounded-t'
                  : 'text-indigo-900 bg-indigo-50/40 hover:bg-indigo-50 font-bold px-2 rounded-t'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-extrabold tracking-tight">MASONRY & FINISHES (Phase 15C)</span>
            </button>

            <button
              onClick={() => setActiveTab('mep')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'mep'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>MEP Takeoff Engine (Phase 8)</span>
            </button>

            <button
              onClick={() => setActiveTab('bbs')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'bbs'
                  ? 'text-indigo-700 border-b-2 border-indigo-600 font-black bg-indigo-50/70 px-2.5 rounded-t'
                  : 'text-indigo-900 bg-indigo-50/40 hover:bg-indigo-50 font-bold px-2 rounded-t'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-extrabold tracking-tight">RCC & BBS ENGINE (Phase 15B)</span>
            </button>

            <button
              onClick={() => setActiveTab('boq')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'boq'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>BOQ Schedule</span>
            </button>

            <button
              onClick={() => setActiveTab('rate-analysis')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'rate-analysis'
                  ? 'text-emerald-700 border-b-2 border-emerald-600 font-black bg-emerald-50/50 px-2 rounded-t'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-bold">Rate Analysis & Pricing</span>
            </button>

            <button
              onClick={() => setActiveTab('tender')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'tender'
                  ? 'text-indigo-700 border-b-2 border-indigo-600 font-black bg-indigo-50/70 px-2.5 rounded-t'
                  : 'text-indigo-900 bg-indigo-50/30 hover:bg-indigo-50 font-bold px-2 rounded-t'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-extrabold tracking-tight">TENDER (Phase 13)</span>
            </button>

            <button
              onClick={() => setActiveTab('revisions')}
              className={`text-xs font-semibold h-full flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'revisions'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Revisions</span>
            </button>

            <button
              onClick={() => setActiveTab('open-items')}
              className={`ml-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors px-2.5 py-1 rounded-full ${
                totalOpenConflicts > 0
                  ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${totalOpenConflicts > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
              <span>{totalOpenConflicts} Open Queries</span>
            </button>
          </>
        )}
      </nav>
    </header>
  );
};
