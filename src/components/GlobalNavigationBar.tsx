import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Home, 
  ChevronRight, 
  Menu, 
  FolderKanban, 
  Plus, 
  ChevronDown, 
  ShieldAlert, 
  Download, 
  CheckCircle2, 
  Building2, 
  FileText,
  AlertCircle,
  Sparkles,
  Save,
  RotateCw,
  History,
  FolderArchive,
  AlertOctagon,
  AlertTriangle
} from 'lucide-react';
import { ActiveNavTab, BreadcrumbItem } from '../types/navigation';
import { ProjectRecord } from '../types';

export interface GlobalNavigationBarProps {
  activeTab: ActiveNavTab;
  breadcrumbs: BreadcrumbItem[];
  canGoBack: boolean;
  onGoBack: () => void;
  onGoHome: () => void;
  onToggleMobileSidebar: () => void;
  activeProject: ProjectRecord | null;
  allProjects: ProjectRecord[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  saveStatus?: 'SAVED' | 'SAVING' | 'FAILED' | 'OFFLINE';
  lastSavedTime?: string;
  saveErrorMessage?: string;
  onManualSave?: () => void;
  onOpenVersions?: () => void;
  onOpenBackup?: () => void;
  onOpenExportCenter?: () => void;
  onOpenValidation?: () => void;
  validationIssueCount?: number;
  onOpenPhase17Intake?: () => void;
}

export const GlobalNavigationBar: React.FC<GlobalNavigationBarProps> = ({
  activeTab,
  breadcrumbs,
  canGoBack,
  onGoBack,
  onGoHome,
  onToggleMobileSidebar,
  activeProject,
  allProjects,
  onSelectProject,
  onCreateProject,
  saveStatus = 'SAVED',
  lastSavedTime,
  saveErrorMessage,
  onManualSave,
  onOpenVersions,
  onOpenBackup,
  onOpenExportCenter,
  onOpenValidation,
  validationIssueCount = 0,
  onOpenPhase17Intake,
}) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isHomeActive = activeTab === 'dashboard';

  return (
    <header
      id="global-application-topbar"
      className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs select-none"
    >
      {/* Top Banner Row */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Left Section: Mobile Menu Button + [ ← BACK ] + [ HOME ] + Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Mobile hamburger menu */}
          <button
            type="button"
            id="mobile-sidebar-toggle-btn"
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global [ ← BACK ] Button */}
          <button
            type="button"
            id="global-back-btn"
            onClick={onGoBack}
            disabled={!canGoBack}
            title={canGoBack ? 'Return to previous screen' : 'No previous history'}
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
              canGoBack
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 active:scale-95'
                : 'opacity-40 bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">[ ← BACK ]</span>
            <span className="sm:hidden">BACK</span>
          </button>

          {/* Global [ HOME ] Button */}
          <button
            type="button"
            id="global-home-btn"
            onClick={onGoHome}
            title="Return to Project Home"
            className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
              isHomeActive
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 ring-2 ring-indigo-200/50'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 active:scale-95'
            }`}
          >
            <Home className={`w-4 h-4 ${isHomeActive ? 'text-indigo-600' : 'text-slate-600'}`} />
            <span className="hidden sm:inline">[ HOME ]</span>
            <span className="sm:hidden">HOME</span>
          </button>

          <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Global Breadcrumb Navigation */}
          <nav
            id="global-breadcrumbs-trail"
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap py-1 scrollbar-none"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.id || idx}>
                  {idx > 0 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  )}
                  {crumb.onClick && !isLast ? (
                    <button
                      type="button"
                      onClick={crumb.onClick}
                      className="hover:text-indigo-600 hover:underline font-medium text-slate-600 truncate max-w-[140px] sm:max-w-[220px] transition-colors cursor-pointer"
                      title={crumb.label}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span
                      className={`truncate max-w-[160px] sm:max-w-[260px] ${
                        isLast
                          ? 'font-black text-slate-900'
                          : 'font-medium text-slate-600'
                      }`}
                      title={crumb.label}
                    >
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Persistence Status + Project Switcher + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Persistence Status Badge */}
          {activeProject && (
            <div className="hidden md:flex items-center">
              {saveStatus === 'SAVING' && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full animate-pulse">
                  <RotateCw className="w-3 h-3 animate-spin text-blue-600" />
                  Saving...
                </span>
              )}
              {saveStatus === 'SAVED' && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
                  title="Persistent state active (IndexedDB + Cloud Sync)"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Saved {lastSavedTime ? `• ${lastSavedTime}` : ''}</span>
                </span>
              )}
              {saveStatus === 'OFFLINE' && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-full"
                  title="Changes preserved in local persistent storage"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Cached Locally
                </span>
              )}
              {saveStatus === 'FAILED' && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full"
                  title={saveErrorMessage || 'Failed to persist project data'}
                >
                  <AlertOctagon className="w-3 h-3 text-rose-600" />
                  Save Failed
                </span>
              )}
            </div>
          )}

          {/* Manual Save Button */}
          {onManualSave && activeProject && (
            <button
              type="button"
              id="topbar-manual-save-btn"
              onClick={onManualSave}
              title="Force full project persistence & create snapshot"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black transition-all shadow-2xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>SAVE</span>
            </button>
          )}

          {/* Versions Checkpoint Modal Trigger */}
          {onOpenVersions && activeProject && (
            <button
              type="button"
              id="topbar-versions-btn"
              onClick={onOpenVersions}
              title="Project Version Checkpoints & Rollback"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              <History className="w-3.5 h-3.5 text-indigo-600" />
              <span>Versions</span>
            </button>
          )}

          {/* Project Backup Trigger */}
          {onOpenBackup && activeProject && (
            <button
              type="button"
              id="topbar-backup-btn"
              onClick={onOpenBackup}
              title="Export or Import Project Backup Package"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
            >
              <FolderArchive className="w-3.5 h-3.5 text-slate-600" />
              <span>Backup</span>
            </button>
          )}

          {/* Project Switcher Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              id="project-switcher-dropdown-btn"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer max-w-[180px] sm:max-w-[240px]"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <div className="text-left truncate">
                <span className="text-[10px] text-slate-400 block font-normal leading-tight">Project:</span>
                <span className="truncate block leading-tight font-black">
                  {activeProject ? activeProject.project?.name || activeProject.id : 'Select Project'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />
            </button>

            {/* Dropdown Menu */}
            {isProjectDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Project
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {allProjects.map((p) => {
                    const isSelected = activeProject?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectProject(p.id);
                          setIsProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="font-bold truncate">{p.project?.name || 'Unnamed Project'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.id}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProjectDropdownOpen(false);
                      onCreateProject();
                    }}
                    className="w-full p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ CREATE NEW PROJECT</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Action: Drawing Intake */}
          {onOpenPhase17Intake && activeProject && (
            <button
              type="button"
              id="topbar-phase17-intake-btn"
              onClick={onOpenPhase17Intake}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black transition-all shadow-2xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>INTAKE</span>
            </button>
          )}

          {/* Quick Action: Validation Badge */}
          {onOpenValidation && (
            <button
              type="button"
              id="topbar-validation-btn"
              onClick={onOpenValidation}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
              title="QA Validation Gate"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-600" />
              <span>QA Gate</span>
              {validationIssueCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-mono">
                  {validationIssueCount}
                </span>
              )}
            </button>
          )}

          {/* Quick Action: Export Center */}
          {onOpenExportCenter && (
            <button
              type="button"
              id="topbar-export-btn"
              onClick={onOpenExportCenter}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Open Export Center"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">EXPORT</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
