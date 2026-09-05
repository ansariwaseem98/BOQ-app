import React from 'react';
import { 
  Home, 
  FolderKanban, 
  FolderOpen, 
  Calculator, 
  Layers, 
  HelpCircle, 
  AlertTriangle, 
  Building2, 
  Sparkles, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Settings, 
  History, 
  DollarSign, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  X,
  Umbrella,
  Grid
} from 'lucide-react';
import { ActiveNavTab } from '../types/navigation';
import { ProjectRecord } from '../types';

export interface GlobalSidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab?: (tab: ActiveNavTab) => void;
  onNavigate?: (tab: ActiveNavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activeProject: ProjectRecord | null;
  openItemsCount?: number;
  conflictsCount?: number;
  counts?: {
    drawings?: number;
    openItems?: number;
    conflicts?: number;
    boqItems?: number;
    validationIssues?: number;
    revisions?: number;
  };
  onOpenExportCenter?: () => void;
}

export const GlobalSidebar: React.FC<GlobalSidebarProps> = ({
  activeTab,
  onSelectTab,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  activeProject,
  openItemsCount,
  conflictsCount,
  counts,
  onOpenExportCenter,
}) => {
  const triggerNavigation = (tab: ActiveNavTab) => {
    if (onNavigate) {
      onNavigate(tab);
    } else if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  const effectiveOpenItemsCount = counts?.openItems ?? openItemsCount ?? 0;
  const effectiveConflictsCount = counts?.conflicts ?? conflictsCount ?? 0;
  const hasProject = Boolean(activeProject && activeProject.id);

  const navItems: { 
    id: ActiveNavTab; 
    label: string; 
    icon: any; 
    badge?: string | number; 
    badgeColor?: string;
    sectionCategory?: string;
    requiresProject?: boolean;
  }[] = [
    { id: 'dashboard', label: 'PROJECT HOME', icon: Home, sectionCategory: 'Overview' },
    { id: 'projects-list', label: 'ALL PROJECTS', icon: FolderKanban, sectionCategory: 'Overview' },
    
    { id: 'drawings', label: 'DRAWINGS', icon: FolderOpen, sectionCategory: 'Engineering & Intake', requiresProject: true },
    { id: 'intelligence', label: 'AI VISION INTELLIGENCE', icon: Sparkles, sectionCategory: 'Engineering & Intake', requiresProject: true },
    
    { id: 'takeoff', label: 'TAKEOFF DASHBOARD', icon: Calculator, sectionCategory: 'Measurement Engines', requiresProject: true },
    { id: 'measurement-engine', label: 'CALCULATIONS', icon: Calculator, sectionCategory: 'Measurement Engines', requiresProject: true },
    { id: 'workspace', label: 'RCC CANVAS', icon: Layers, sectionCategory: 'Measurement Engines', requiresProject: true },
    { id: 'bbs', label: 'REBAR / BBS', icon: ShieldCheck, sectionCategory: 'Measurement Engines', requiresProject: true },
    { id: 'steel', label: 'STRUCTURAL STEEL', icon: Building2, sectionCategory: 'Measurement Engines', requiresProject: true },
    { id: 'roofing', label: 'ROOFING', icon: Umbrella, sectionCategory: 'Measurement Engines', requiresProject: true },
    { id: 'architectural', label: 'ARCHITECTURAL', icon: Grid, sectionCategory: 'Measurement Engines', requiresProject: true },
    { id: 'mep', label: 'MEP', icon: Layers, sectionCategory: 'Measurement Engines', requiresProject: true },
    
    { id: 'boq', label: 'BOQ SCHEDULE', icon: FileSpreadsheet, sectionCategory: 'Commercial & Tenders', requiresProject: true },
    { id: 'rate-analysis', label: 'RATE ANALYSIS', icon: DollarSign, sectionCategory: 'Commercial & Tenders', requiresProject: true },
    { id: 'tender', label: 'TENDER PACKAGE', icon: FileSpreadsheet, sectionCategory: 'Commercial & Tenders', requiresProject: true },
    
    { id: 'open-items', label: 'OPEN ITEMS', icon: HelpCircle, badge: effectiveOpenItemsCount > 0 ? effectiveOpenItemsCount : undefined, badgeColor: 'bg-amber-500 text-white', sectionCategory: 'Quality & Governance', requiresProject: true },
    { id: 'conflicts', label: 'CONFLICTS', icon: AlertTriangle, badge: effectiveConflictsCount > 0 ? effectiveConflictsCount : undefined, badgeColor: 'bg-rose-500 text-white', sectionCategory: 'Quality & Governance', requiresProject: true },
    { id: 'revisions', label: 'REVISION HISTORY', icon: History, sectionCategory: 'Quality & Governance', requiresProject: true },
    
    { id: 'reports', label: 'REPORTS', icon: FileText, sectionCategory: 'Outputs & Config', requiresProject: true },
    { id: 'exports', label: 'EXPORTS', icon: Download, sectionCategory: 'Outputs & Config', requiresProject: true },
    { id: 'settings', label: 'SETTINGS', icon: Settings, sectionCategory: 'Outputs & Config', requiresProject: true },
  ];

  const handleItemClick = (item: typeof navItems[0]) => {
    if (item.id === 'exports' && onOpenExportCenter) {
      onOpenExportCenter();
      onCloseMobile();
      return;
    }
    if (item.id === 'roofing') {
      triggerNavigation('steel');
    } else if (item.id === 'conflicts') {
      triggerNavigation('open-items');
    } else {
      triggerNavigation(item.id);
    }
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="global-application-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col transition-all duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen shrink-0 select-none ${
          isCollapsed ? 'w-18' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header / Project Badge */}
        <div className="h-16 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-inner shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <span className="text-xs font-black text-white tracking-wider block uppercase truncate">
                  AI BOQ ESTIMATOR
                </span>
                <span className="text-[10px] text-indigo-400 font-mono block truncate">
                  {hasProject ? activeProject?.id : 'READY'}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop Collapse Toggle */}
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="hidden lg:flex w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 items-center justify-center transition-colors cursor-pointer"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-700">
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            const isTabActive = 
              activeTab === item.id || 
              (item.id === 'roofing' && activeTab === 'steel') ||
              (item.id === 'conflicts' && activeTab === 'open-items');

            const isDisabled = item.requiresProject && !hasProject;

            return (
              <button
                key={item.id}
                type="button"
                id={`sidebar-nav-${item.id}`}
                disabled={isDisabled}
                onClick={() => handleItemClick(item)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  isTabActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/30'
                    : isDisabled
                    ? 'opacity-40 cursor-not-allowed text-slate-600'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className={`shrink-0 transition-transform ${isTabActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                  <Icon className={`w-4 h-4 ${isTabActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                </div>

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between truncate text-left">
                    <span className="truncate tracking-tight">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${item.badgeColor || 'bg-indigo-500 text-white'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info strip */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-[10px] text-slate-500 shrink-0">
            <div className="truncate font-mono">Project: {activeProject?.project?.name || 'No Project'}</div>
            <div className="text-[9px] text-slate-600">Global Navigation v17C</div>
          </div>
        )}
      </aside>
    </>
  );
};
