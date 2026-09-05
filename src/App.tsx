import React, { useState, useEffect } from 'react';
import { 
  ProjectRecord, 
  DrawingRecord, 
  DetectedElement, 
  BoqItem, 
  BbsBarRecord, 
  OpenItem, 
  DrawingConflict, 
  RevisionComparison,
  BoundingBox
} from './types';
import { 
  SAMPLE_TEST_PROJECT_DATA, 
  SAMPLE_TEST_DRAWINGS, 
  SAMPLE_TEST_ELEMENTS, 
  SAMPLE_TEST_BOQ_ITEMS, 
  SAMPLE_TEST_BBS_RECORDS, 
  SAMPLE_TEST_OPEN_ITEMS, 
  SAMPLE_TEST_CONFLICTS, 
  SAMPLE_TEST_REVISIONS 
} from './data/initialData';
import { ProjectApiService } from './services/projectApi';
import { ProjectPersistenceService } from './services/projectPersistenceService';
import { recalculateElementDependencies } from './engine/dependencyEngine';
import { validateProjectDataset } from './engine/validationEngine';
import { TopBar, ActiveTab } from './components/TopBar';
import { GlobalNavigationBar } from './components/GlobalNavigationBar';
import { GlobalSidebar } from './components/GlobalSidebar';
import { UnsavedChangesModal } from './components/UnsavedChangesModal';
import { ReportsWorkspace } from './components/ReportsWorkspace';
import { SettingsWorkspace } from './components/SettingsWorkspace';
import { ActiveNavTab, BreadcrumbItem } from './types/navigation';
import { ProjectDashboard } from './components/ProjectDashboard';
import { ProjectList } from './components/ProjectList';
import { ProjectSetupModal } from './components/ProjectSetupModal';
import { ProjectVersionModal } from './components/ProjectVersionModal';
import { ProjectBackupModal } from './components/ProjectBackupModal';
import { ProjectDuplicateModal } from './components/ProjectDuplicateModal';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import { DrawingManager } from './components/DrawingManager';
import { BoqTable } from './components/BoqTable';
import { BbsViewer } from './components/BbsViewer';
import { RccBbsEngineWorkspace } from './components/RccBbsEngineWorkspace';
import { ClarificationWorkspace } from './components/ClarificationWorkspace';
import { RevisionManager } from './components/RevisionManager';
import { DrawingAnalysisWorkspace } from './components/DrawingAnalysisWorkspace';
import { TakeoffWorkspace } from './components/TakeoffWorkspace';
import { SteelRoofWorkspace } from './components/SteelRoofWorkspace';
import { ArchitecturalTakeoffWorkspace } from './components/ArchitecturalTakeoffWorkspace';
import { MasonryFinishesEngineWorkspace } from './components/MasonryFinishesEngineWorkspace';
import { MEPTakeoffWorkspace } from './components/MEPTakeoffWorkspace';
import { UnifiedBoqWorkspace } from './components/UnifiedBoqWorkspace';
import { RateAnalysisWorkspace } from './components/RateAnalysisWorkspace';
import { TenderWorkspace } from './components/TenderWorkspace';
import { DrawingIntelligenceWorkspace } from './components/DrawingIntelligenceWorkspace';
import { MeasurementEngineWorkspace } from './components/MeasurementEngineWorkspace';
import { RateAnalysisEngine } from './engine/rateAnalysisEngine';
import { INITIAL_PRICING_SCENARIOS } from './data/rateDatabaseInitialData';
import { DocumentStorageService } from './services/documentStorage';
import { ShowMeWhyModal } from './components/ShowMeWhyModal';
import { ValidationAlertsModal } from './components/ValidationAlertsModal';
import { AiScanModal } from './components/AiScanModal';
import { exportComprehensiveTenderWorkbook } from './engine/excelExport';
import { Building2, Plus, AlertCircle, FolderKanban, ShieldCheck } from 'lucide-react';
import { TakeoffValidationModal } from './components/TakeoffValidationModal';
import { ReviewQueueModal } from './components/ReviewQueueModal';
import { EndToEndTestModal } from './components/EndToEndTestModal';
import { TakeoffErrorReportModal } from './components/TakeoffErrorReportModal';
import { ExportCenterModal } from './components/ExportCenterModal';
import { ExportTestSuiteModal } from './components/ExportTestSuiteModal';
import { Phase16MasterIntegrationModal } from './components/Phase16MasterIntegrationModal';
import { Phase17DrawingIntakeCenter } from './components/Phase17DrawingIntakeCenter';
import { INITIAL_UNIFIED_BOQ_ITEMS } from './data/unifiedBoqInitialData';

export function App() {
  // Project list & active project state
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectRecord | null>(null);
  const [projectDocuments, setProjectDocuments] = useState<import('./types').ProjectDocument[]>([]);
  const [analysisTargetDocId, setAnalysisTargetDocId] = useState<string | undefined>(undefined);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // App navigation
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [navHistory, setNavHistory] = useState<ActiveNavTab[]>(['dashboard']);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingNavTab, setPendingNavTab] = useState<ActiveNavTab | null>(null);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);

  // Navigation handlers with history tracking & unsaved changes guard
  const handleNavigate = (targetTab: ActiveNavTab) => {
    if (targetTab === activeTab) return;
    if (hasUnsavedChanges) {
      setPendingNavTab(targetTab);
      setIsUnsavedModalOpen(true);
      return;
    }
    setNavHistory((prev) => [...prev, targetTab]);
    setActiveTab(targetTab);
    setIsSidebarOpen(false); // Close mobile drawer if open
  };

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      setIsUnsavedModalOpen(true);
      return;
    }
    if (navHistory.length > 1) {
      const updated = [...navHistory];
      updated.pop(); // Remove current screen
      const previous = updated[updated.length - 1];
      setNavHistory(updated);
      setActiveTab(previous);
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleGoHome = () => {
    if (hasUnsavedChanges) {
      setPendingNavTab('dashboard');
      setIsUnsavedModalOpen(true);
      return;
    }
    if (activeTab !== 'dashboard') {
      setNavHistory((prev) => [...prev, 'dashboard']);
      setActiveTab('dashboard');
    }
  };

  const handleConfirmLeave = () => {
    setHasUnsavedChanges(false);
    setIsUnsavedModalOpen(false);
    if (pendingNavTab) {
      setNavHistory((prev) => [...prev, pendingNavTab]);
      setActiveTab(pendingNavTab);
      setPendingNavTab(null);
    } else if (navHistory.length > 1) {
      const updated = [...navHistory];
      updated.pop();
      const previous = updated[updated.length - 1];
      setNavHistory(updated);
      setActiveTab(previous);
    }
  };

  const handleCancelLeave = () => {
    setIsUnsavedModalOpen(false);
    setPendingNavTab(null);
  };

  // Build breadcrumb items based on current context
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        id: 'crumb-home',
        label: 'Home',
        onClick: activeTab !== 'dashboard' ? handleGoHome : undefined,
      },
    ];

    if (activeProject) {
      items.push({
        id: 'crumb-project',
        label: activeProject.project?.name || activeProject.id,
        onClick: activeTab !== 'dashboard' ? handleGoHome : undefined,
      });
    }

    const tabLabels: Record<string, string> = {
      'dashboard': 'Overview',
      'projects-list': 'Projects Directory',
      'drawings': 'Drawings Register',
      'intelligence': 'AI Drawing Intelligence',
      'takeoff': 'Takeoff Engine',
      'measurement-engine': 'Calculations & Measurement',
      'workspace': 'RCC Takeoff Canvas',
      'steel': 'Structural Steel Takeoff',
      'roofing': 'Roofing & Sheeting Takeoff',
      'architectural': 'Architectural & Finishes',
      'mep': 'MEP Takeoff Suites',
      'bbs': 'RCC & BBS Rebar Schedule',
      'boq': 'Unified BOQ Schedule',
      'rate-analysis': 'Rate Analysis & Pricing',
      'tender': 'Tender Management Package',
      'open-items': 'Open Items & Clarifications',
      'conflicts': 'Drawing Conflicts Log',
      'revisions': 'Revision History & Addenda',
      'reports': 'Reports Center',
      'exports': 'Exports Center',
      'settings': 'Project & Engineering Settings',
    };

    if (activeTab !== 'dashboard') {
      items.push({
        id: `crumb-${activeTab}`,
        label: tabLabels[activeTab] || activeTab,
        isCurrent: true,
      });
    }

    return items;
  };

  // Drawing & Takeoff data (empty for new projects)
  const [drawings, setDrawings] = useState<DrawingRecord[]>([]);
  const [elements, setElements] = useState<DetectedElement[]>([]);
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [bbsRecords, setBbsRecords] = useState<BbsBarRecord[]>([]);
  const [openItems, setOpenItems] = useState<OpenItem[]>([]);
  const [conflicts, setConflicts] = useState<DrawingConflict[]>([]);
  const [revisions, setRevisions] = useState<RevisionComparison[]>([]);

  // Selected State
  const [activeDrawingId, setActiveDrawingId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Project Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<ProjectRecord | null>(null);

  // Modals
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [showMeWhyElement, setShowMeWhyElement] = useState<DetectedElement | null>(null);
  const [showMeWhyBoqItem, setShowMeWhyBoqItem] = useState<BoqItem | null>(null);
  const [isShowMeWhyOpen, setIsShowMeWhyOpen] = useState(false);

  // Phase 10 Validation Modals
  const [isValidationDashboardOpen, setIsValidationDashboardOpen] = useState(false);
  const [isReviewQueueOpen, setIsReviewQueueOpen] = useState(false);
  const [isE2ETestOpen, setIsE2ETestOpen] = useState(false);
  const [isErrorReportOpen, setIsErrorReportOpen] = useState(false);

  // Phase 11 Export Center Modals
  const [isExportCenterOpen, setIsExportCenterOpen] = useState(false);
  const [isExportTestOpen, setIsExportTestOpen] = useState(false);

  // Phase 16 Master Integration Modal
  const [isPhase16ModalOpen, setIsPhase16ModalOpen] = useState(false);

  // Phase 17A Real Drawing Intake & Processing Modal
  const [isPhase17ModalOpen, setIsPhase17ModalOpen] = useState(false);

  // Persistence & Versioning State
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'FAILED' | 'OFFLINE'>('SAVED');
  const [lastSavedTime, setLastSavedTime] = useState<string | undefined>(undefined);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | undefined>(undefined);
  const [isHydratingState, setIsHydratingState] = useState<boolean>(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState<boolean>(false);
  const [selectedVersionProjectId, setSelectedVersionProjectId] = useState<string | undefined>(undefined);
  const [projectToDuplicate, setProjectToDuplicate] = useState<ProjectRecord | null>(null);

  // Full Project State Rehydration Function
  const rehydrateProjectState = async (project: ProjectRecord) => {
    setIsHydratingState(true);
    setSaveStatus('SAVING');
    try {
      const persistedState = await ProjectPersistenceService.getProjectState(project.id);
      if (persistedState) {
        setDrawings(persistedState.drawings || []);
        setElements(persistedState.elements || []);
        setBoqItems(persistedState.boqItems || []);
        setBbsRecords(persistedState.bbsRecords || []);
        setOpenItems(persistedState.openItems || []);
        setConflicts(persistedState.conflicts || []);
        setRevisions(persistedState.revisions || []);
        setActiveDrawingId(persistedState.drawings?.[0]?.id || null);
        setSelectedElementId(persistedState.elements?.[0]?.id || null);
      } else if (project.isTestProject) {
        // Fallback for sample test project
        setDrawings(SAMPLE_TEST_DRAWINGS);
        setElements(SAMPLE_TEST_ELEMENTS);
        setBoqItems(SAMPLE_TEST_BOQ_ITEMS);
        setBbsRecords(SAMPLE_TEST_BBS_RECORDS);
        setOpenItems(SAMPLE_TEST_OPEN_ITEMS);
        setConflicts(SAMPLE_TEST_CONFLICTS);
        setRevisions(SAMPLE_TEST_REVISIONS);
        setActiveDrawingId(SAMPLE_TEST_DRAWINGS[0]?.id || null);
        setSelectedElementId(SAMPLE_TEST_ELEMENTS[0]?.id || null);
      } else {
        // Fresh brand new project - strictly clean state
        setDrawings([]);
        setElements([]);
        setBoqItems([]);
        setBbsRecords([]);
        setOpenItems([]);
        setConflicts([]);
        setRevisions([]);
        setActiveDrawingId(null);
        setSelectedElementId(null);
      }
      setSaveStatus('SAVED');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setSaveErrorMessage(undefined);
    } catch (err: any) {
      console.error('Failed to rehydrate project state:', err);
      setSaveStatus('FAILED');
      setSaveErrorMessage(err.message || 'Failed to load project records');
    } finally {
      setIsHydratingState(false);
    }
  };

  // Load all projects on initial mount from persistent storage
  useEffect(() => {
    async function loadProjects() {
      setIsLoadingProjects(true);
      try {
        const list = await ProjectApiService.getAllProjects();
        setProjects(list);

        const storedActiveId = ProjectApiService.getActiveProjectId();
        let targetProject: ProjectRecord | null = null;
        if (storedActiveId) {
          const match = list.find((p) => p.id === storedActiveId);
          if (match) {
            targetProject = match;
          } else if (list.length > 0) {
            targetProject = list[0];
          }
        } else if (list.length > 0) {
          targetProject = list[0];
        }

        if (targetProject) {
          setActiveProject(targetProject);
          ProjectApiService.setActiveProjectId(targetProject.id);
          await rehydrateProjectState(targetProject);
        }
      } catch (err) {
        console.error('Failed to load projects:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    }
    loadProjects();
  }, []);

  // Continuous Auto-Save Engine with Debouncing
  useEffect(() => {
    if (!activeProject?.id || isHydratingState || isLoadingProjects) {
      return;
    }

    const timer = setTimeout(async () => {
      setSaveStatus('SAVING');
      try {
        const currentState = {
          projectId: activeProject.id,
          version: 1,
          updatedAt: new Date().toISOString(),
          drawings,
          elements,
          boqItems,
          bbsRecords,
          openItems,
          conflicts,
          revisions,
        };

        const result = await ProjectPersistenceService.saveProjectState(activeProject.id, currentState, false);

        if (result.success) {
          setSaveStatus('SAVED');
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setSaveErrorMessage(undefined);
        } else {
          setSaveStatus('FAILED');
          setSaveErrorMessage(result.error || 'Failed to save project records');
        }
      } catch (err: any) {
        console.error('Auto-save failed:', err);
        setSaveStatus('FAILED');
        setSaveErrorMessage(err.message || 'Auto-save failed');
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [
    activeProject?.id,
    drawings,
    elements,
    boqItems,
    bbsRecords,
    openItems,
    conflicts,
    revisions,
    isHydratingState,
    isLoadingProjects,
  ]);

  // Load project documents when active project changes
  useEffect(() => {
    async function loadDocs() {
      if (activeProject?.id) {
        try {
          const docs = await DocumentStorageService.getDocumentsByProject(activeProject.id);
          setProjectDocuments(docs);
        } catch (err) {
          console.error('Failed to load project documents:', err);
        }
      } else {
        setProjectDocuments([]);
      }
    }
    loadDocs();
  }, [activeProject?.id]);

  // Validation issues count
  const validationIssues = validateProjectDataset(elements, boqItems, bbsRecords, drawings);

  // Select project
  const handleSelectProject = async (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (target) {
      setActiveProject(target);
      ProjectApiService.setActiveProjectId(target.id);
      setActiveTab('dashboard');
      await rehydrateProjectState(target);
    }
  };

  // Manual Force Save Handler
  const handleManualSave = async () => {
    if (!activeProject?.id) return;
    setSaveStatus('SAVING');
    try {
      const currentState = {
        projectId: activeProject.id,
        version: 1,
        updatedAt: new Date().toISOString(),
        drawings,
        elements,
        boqItems,
        bbsRecords,
        openItems,
        conflicts,
        revisions,
      };

      const result = await ProjectPersistenceService.saveProjectState(
        activeProject.id,
        currentState,
        true,
        `Manual Checkpoint (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
      );

      if (result.success) {
        setSaveStatus('SAVED');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setSaveErrorMessage(undefined);
      } else {
        setSaveStatus('FAILED');
        setSaveErrorMessage(result.error || 'Manual save failed');
      }
    } catch (err: any) {
      console.error('Manual save failed:', err);
      setSaveStatus('FAILED');
      setSaveErrorMessage(err.message || 'Manual save failed');
    }
  };

  // Open Version History Modal
  const handleOpenVersionsModal = (projectId?: string) => {
    setSelectedVersionProjectId(projectId || activeProject?.id);
    setIsVersionsModalOpen(true);
  };

  // Rollback to specific version checkpoint
  const handleRollbackVersion = async (versionId: string) => {
    const projId = selectedVersionProjectId || activeProject?.id;
    if (!projId) return;

    try {
      setSaveStatus('SAVING');
      const restored = await ProjectPersistenceService.restoreProjectFromVersion(projId, versionId);
      if (restored.success && restored.state) {
        setDrawings(restored.state.drawings || []);
        setElements(restored.state.elements || []);
        setBoqItems(restored.state.boqItems || []);
        setBbsRecords(restored.state.bbsRecords || []);
        setOpenItems(restored.state.openItems || []);
        setConflicts(restored.state.conflicts || []);
        setRevisions(restored.state.revisions || []);
        setActiveDrawingId(restored.state.drawings?.[0]?.id || null);
        setSelectedElementId(restored.state.elements?.[0]?.id || null);

        setSaveStatus('SAVED');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err: any) {
      console.error('Version rollback failed:', err);
      setSaveStatus('FAILED');
      setSaveErrorMessage(err.message || 'Rollback failed');
    }
  };

  // Open Backup & Export/Import Modal
  const handleOpenBackupModal = (projectId?: string) => {
    if (projectId) {
      const match = projects.find((p) => p.id === projectId);
      if (match) setSelectedVersionProjectId(projectId);
    } else {
      setSelectedVersionProjectId(activeProject?.id);
    }
    setIsBackupModalOpen(true);
  };

  // Import Backup Package
  const handleImportBackup = async (pkg: any) => {
    try {
      const pkgStr = typeof pkg === 'string' ? pkg : JSON.stringify(pkg);
      const result = await ProjectPersistenceService.importProjectBackup(pkgStr);
      if (result.success && result.project) {
        setProjects((prev) => [...prev.filter((p) => p.id !== result.project!.id), result.project!]);
        setActiveProject(result.project);
        ProjectApiService.setActiveProjectId(result.project.id);
        await rehydrateProjectState(result.project);
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error('Failed to import backup package:', err);
    }
  };

  // Open Project Duplication Modal
  const handleOpenDuplicateModal = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId) || activeProject;
    if (target) {
      setProjectToDuplicate(target);
      setIsDuplicateModalOpen(true);
    }
  };

  // Confirm Project Duplication
  const handleConfirmDuplicate = async (newProjectConfig: ProjectRecord) => {
    if (!projectToDuplicate) return;
    try {
      const cloned = await ProjectPersistenceService.duplicateProject(
        projectToDuplicate.id,
        newProjectConfig.project?.name || `${projectToDuplicate.project?.name || 'Project'} (Copy)`
      );
      if (cloned) {
        setProjects((prev) => [...prev, cloned]);
        setActiveProject(cloned);
        ProjectApiService.setActiveProjectId(cloned.id);
        await rehydrateProjectState(cloned);
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error('Failed to duplicate project:', err);
    }
  };

  // Open Create Project Modal
  const handleOpenCreateModal = () => {
    setProjectToEdit(null);
    setIsProjectModalOpen(true);
  };

  // Open Edit Project Modal
  const handleOpenEditModal = (project?: ProjectRecord) => {
    setProjectToEdit(project || activeProject);
    setIsProjectModalOpen(true);
  };

  // Save Project Handler
  const handleSaveProject = async (projectData: ProjectRecord, openImmediately: boolean) => {
    let saved: ProjectRecord;
    if (projectData.id && projects.some((p) => p.id === projectData.id)) {
      // Update existing
      saved = await ProjectApiService.updateProject(projectData.id, projectData);
      setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
      if (activeProject?.id === saved.id) {
        setActiveProject(saved);
      }
    } else {
      // Create new
      saved = await ProjectApiService.createProject(projectData);
      setProjects((prev) => [...prev.filter((p) => p.id !== saved.id), saved]);
      if (openImmediately || !activeProject) {
        setActiveProject(saved);
        ProjectApiService.setActiveProjectId(saved.id);
        setActiveTab('dashboard');
      }
    }

    if (openImmediately) {
      setActiveProject(saved);
      ProjectApiService.setActiveProjectId(saved.id);
      setActiveTab('dashboard');
    }
  };

  // Toggle Archive
  const handleToggleArchive = async (projectId: string) => {
    const updated = await ProjectApiService.toggleArchiveProject(projectId);
    if (updated) {
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      if (activeProject?.id === updated.id) {
        setActiveProject(updated);
      }
    }
  };

  // Delete Project
  const handleDeleteProject = async (projectId: string) => {
    await ProjectApiService.deleteProject(projectId);
    const updatedList = projects.filter((p) => p.id !== projectId);
    setProjects(updatedList);
    if (activeProject?.id === projectId) {
      const nextActive = updatedList.length > 0 ? updatedList[0] : null;
      setActiveProject(nextActive);
      ProjectApiService.setActiveProjectId(nextActive?.id || null);
    }
  };

  // Explicitly Load Sample Data for Testing / Demonstration
  const handleLoadTestData = async () => {
    const testProject = await ProjectApiService.createProject({
      ...SAMPLE_TEST_PROJECT_DATA,
      isTestProject: true,
    });
    setProjects((prev) => [...prev.filter((p) => p.id !== testProject.id), testProject]);
    setActiveProject(testProject);
    ProjectApiService.setActiveProjectId(testProject.id);
    setDrawings(SAMPLE_TEST_DRAWINGS);
    setElements(SAMPLE_TEST_ELEMENTS);
    setBoqItems(SAMPLE_TEST_BOQ_ITEMS);
    setBbsRecords(SAMPLE_TEST_BBS_RECORDS);
    setOpenItems(SAMPLE_TEST_OPEN_ITEMS);
    setConflicts(SAMPLE_TEST_CONFLICTS);
    setRevisions(SAMPLE_TEST_REVISIONS);
    setActiveDrawingId(SAMPLE_TEST_DRAWINGS[0]?.id || null);
    setSelectedElementId(SAMPLE_TEST_ELEMENTS[0]?.id || null);
    setActiveTab('dashboard');
  };

  // Handle Element Update with cascading dependency engine
  const handleUpdateElement = (updatedElement: DetectedElement) => {
    const updatedElements = elements.map((e) => (e.id === updatedElement.id ? updatedElement : e));
    const { updatedElements: finalElements, updatedBoqItems } = recalculateElementDependencies(
      updatedElements,
      boqItems
    );
    setElements(finalElements);
    setBoqItems(updatedBoqItems);
  };

  // Add new manual bounding box / element
  const handleAddNewElement = (box: BoundingBox) => {
    const activeDwg = drawings.find((d) => d.id === activeDrawingId) || drawings[0];
    if (!activeDwg) return;

    const newId = `E-MANUAL-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const newEl: DetectedElement = {
      id: newId,
      name: `Added Member (${newId})`,
      category: 'beam',
      discipline: activeDwg.discipline,
      level: activeDwg.level,
      gridLocation: 'Grid Custom',
      drawingId: activeDwg.id,
      drawingNumber: activeDwg.drawingNumber,
      drawingRevision: activeDwg.revision,
      boundingBox: box,
      dimensions: {
        length: 5.0,
        width: 0.3,
        depthOrThickness: 0.5,
        count: 1,
        unit: 'm³',
      },
      deductions: [],
      specification: { concreteGrade: 'C35/45' },
      calculation: {
        formula: 'Length × Width × Depth × Count',
        expressionWithValues: '5.00m × 0.30m × 0.50m × 1 = 0.750 m³',
        grossQuantity: 0.75,
        deductionsTotal: 0,
        netQuantity: 0.75,
        unit: 'm³',
        formworkAreaM2: 6.5,
        auditSteps: [
          {
            stepNumber: 1,
            label: 'Volume calculation',
            expression: '5.0m × 0.3m × 0.5m × 1',
            subtotal: 0.75,
            unit: 'm³',
          },
        ],
        lastCalculatedAt: new Date().toISOString(),
      },
      confidence: 1.0,
      status: 'user_input',
      linkedBoqItemIds: ['BOQ-04-02'],
      linkedBbsMarks: [],
    };

    const updatedElements = [...elements, newEl];
    const { updatedElements: finalElements, updatedBoqItems } = recalculateElementDependencies(
      updatedElements,
      boqItems
    );
    setElements(finalElements);
    setBoqItems(updatedBoqItems);
    setSelectedElementId(newId);
  };

  // Add drawing
  const handleAddDrawing = (newDwg: DrawingRecord) => {
    setDrawings((prev) => [newDwg, ...prev]);
    setActiveDrawingId(newDwg.id);
  };

  // Delete drawing
  const handleDeleteDrawing = (id: string) => {
    setDrawings((prev) => prev.filter((d) => d.id !== id));
    if (activeDrawingId === id) {
      const remaining = drawings.filter((d) => d.id !== id);
      setActiveDrawingId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Resolve Open Item
  const handleResolveOpenItem = (id: string, note: string, userVal?: number) => {
    setOpenItems((prev) =>
      prev.map((oi) =>
        oi.id === id
          ? {
              ...oi,
              status: 'resolved',
              resolutionNote: note,
              resolvedAt: new Date().toISOString(),
              resolvedBy: 'Lead Estimator',
            }
          : oi
      )
    );

    if (userVal !== undefined) {
      const updatedElements = elements.map((e) => {
        if (e.id === 'BM-204' || e.dimensions.depthOrThickness === 0.45) {
          return {
            ...e,
            dimensions: {
              ...e.dimensions,
              depthOrThickness: userVal / 1000,
            },
            status: 'verified' as const,
          };
        }
        return e;
      });
      const { updatedElements: finalElements, updatedBoqItems } = recalculateElementDependencies(
        updatedElements,
        boqItems
      );
      setElements(finalElements);
      setBoqItems(updatedBoqItems);
    }
  };

  // Resolve Conflict
  const handleResolveConflict = (conflictId: string, choice: 'A' | 'B' | 'custom', customValue?: string, note?: string) => {
    setConflicts((prev) =>
      prev.map((c) =>
        c.id === conflictId
          ? {
              ...c,
              resolution: 'resolved',
              chosenSource: choice,
              resolutionNote: note || `Resolved by selecting Source ${choice}`,
              resolvedAt: new Date().toISOString(),
            }
          : c
      )
    );
  };

  // Approve Revision
  const handleApproveRevision = (revisionId: string) => {
    setRevisions((prev) =>
      prev.map((r) => (r.id === revisionId ? { ...r, status: 'approved' as const } : r))
    );
  };

  // Import AI scan results
  const handleImportExtractedData = (newElements: DetectedElement[], newOpenItems: OpenItem[]) => {
    const combinedElements = [...elements, ...newElements];
    const { updatedElements, updatedBoqItems } = recalculateElementDependencies(
      combinedElements,
      boqItems
    );
    setElements(updatedElements);
    setBoqItems(updatedBoqItems);
    setOpenItems((prev) => [...prev, ...newOpenItems]);
    if (newElements && newElements.length > 0 && newElements[0]) {
      setSelectedElementId(newElements[0].id);
      setActiveTab('workspace');
    }
  };

  // Trigger Show Me Why modal
  const handleTriggerShowMeWhy = (element: DetectedElement) => {
    setShowMeWhyElement(element);
    setShowMeWhyBoqItem(null);
    setIsShowMeWhyOpen(true);
  };

  const handleTriggerShowMeWhyBoq = (item: BoqItem) => {
    setShowMeWhyBoqItem(item);
    setShowMeWhyElement(null);
    setIsShowMeWhyOpen(true);
  };

  // Export Excel
  const handleExportExcel = () => {
    if (!activeProject) {
      setIsProjectModalOpen(true);
      return;
    }
    exportComprehensiveTenderWorkbook({
      projectData: activeProject,
      drawings,
      elements,
      boqItems,
      bbsRecords,
      openItems,
      revisions,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
      {/* Phase 17C: Global Navigation & Breadcrumb Header */}
      <GlobalNavigationBar
        activeTab={activeTab}
        breadcrumbs={getBreadcrumbs()}
        canGoBack={navHistory.length > 1}
        onGoBack={handleGoBack}
        onGoHome={handleGoHome}
        onToggleMobileSidebar={() => setIsSidebarOpen((prev) => !prev)}
        activeProject={activeProject}
        allProjects={projects}
        onSelectProject={handleSelectProject}
        onCreateProject={handleOpenCreateModal}
        saveStatus={saveStatus}
        lastSavedTime={lastSavedTime}
        saveErrorMessage={saveErrorMessage}
        onManualSave={handleManualSave}
        onOpenVersions={() => handleOpenVersionsModal(activeProject?.id)}
        onOpenBackup={() => handleOpenBackupModal(activeProject?.id)}
        onOpenExportCenter={() => setIsExportCenterOpen(true)}
        onOpenValidation={() => setIsValidationOpen(true)}
        validationIssueCount={validationIssues.length}
        onOpenPhase17Intake={() => setIsPhase17ModalOpen(true)}
      />

      {/* Main Body with Collapsible Global Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <GlobalSidebar
          activeTab={activeTab}
          onNavigate={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          isMobileOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          activeProject={activeProject}
          counts={{
            drawings: drawings.length,
            openItems: openItems.filter((o) => o.status === 'open').length,
            conflicts: conflicts.filter((c) => c.resolution === 'pending').length,
            boqItems: boqItems.length,
            validationIssues: validationIssues.length,
            revisions: revisions.length,
          }}
        />

        {/* Main Tab Routing Area */}
        <main className="flex-1 flex flex-col overflow-y-auto min-w-0 bg-[#F8FAFC]">
          {/* If user is specifically on projects directory tab */}
          {activeTab === 'projects-list' && (
            <ProjectList
              projects={projects}
              activeProjectId={activeProject?.id || null}
              onSelectProject={handleSelectProject}
              onCreateNewProject={handleOpenCreateModal}
              onEditProject={(proj) => handleOpenEditModal(proj)}
              onToggleArchive={handleToggleArchive}
              onDeleteProject={handleDeleteProject}
              onDuplicateProject={handleOpenDuplicateModal}
              onExportProject={handleOpenBackupModal}
              onImportProject={() => handleOpenBackupModal()}
              onOpenVersions={handleOpenVersionsModal}
              onLoadSampleProject={handleLoadTestData}
            />
          )}

          {/* If no project is active, display strict "No project created" empty state */}
          {activeTab !== 'projects-list' && !activeProject && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-3xl mx-auto text-center my-auto py-16">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs mb-6">
                <Building2 className="w-8 h-8" />
              </div>

              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Initial Workspace State
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
                No project created
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
                No project information has been entered yet. Create a new project record to set up company details, client specifications, tender parameters, and engineering measurement settings.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={handleOpenCreateModal}
                  className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ CREATE NEW PROJECT</span>
                </button>

                {projects.length > 0 && (
                  <button
                    onClick={() => handleNavigate('projects-list')}
                    className="px-5 py-3 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-2xs flex items-center gap-2 cursor-pointer"
                  >
                    <FolderKanban className="w-4 h-4 text-slate-500" />
                    <span>Browse Projects Directory ({projects.length})</span>
                  </button>
                )}

                <button
                  onClick={handleLoadTestData}
                  className="px-4 py-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
                  title="Load sample template for testing"
                >
                  Load Sample Template (Test)
                </button>
              </div>
            </div>
          )}

          {/* If project is active and activeTab is 'dashboard' */}
          {activeTab === 'dashboard' && activeProject && (
            <ProjectDashboard
              project={activeProject}
              onEditProject={() => handleOpenEditModal(activeProject)}
              onOpenProjectList={() => handleNavigate('projects-list')}
              onCreateNewProject={handleOpenCreateModal}
              onToggleArchive={() => handleToggleArchive(activeProject.id)}
              onOpenVersions={() => handleOpenVersionsModal(activeProject.id)}
              onOpenBackup={() => handleOpenBackupModal(activeProject.id)}
              onManualSave={handleManualSave}
              onNavigateToProjectInfo={() => handleOpenEditModal(activeProject)}
              onNavigateToDrawings={() => handleNavigate('drawings')}
              onNavigateToIntelligence={() => handleNavigate('intelligence')}
              onNavigateToTakeoff={() => handleNavigate('takeoff')}
              onNavigateToMeasurementEngine={() => handleNavigate('measurement-engine')}
              onNavigateToWorkspace={() => handleNavigate('workspace')}
              onNavigateToSteel={() => handleNavigate('steel')}
              onNavigateToRoofing={() => handleNavigate('roofing')}
              onNavigateToArchitectural={() => handleNavigate('architectural')}
              onNavigateToMep={() => handleNavigate('mep')}
              onNavigateToBoq={() => handleNavigate('boq')}
              onNavigateToRateAnalysis={() => handleNavigate('rate-analysis')}
              onNavigateToTender={() => handleNavigate('tender')}
              onNavigateToBbs={() => handleNavigate('bbs')}
              onNavigateToOpenItems={() => handleNavigate('open-items')}
              onNavigateToConflicts={() => handleNavigate('conflicts')}
              onNavigateToRevisions={() => handleNavigate('revisions')}
              onNavigateToReports={() => handleNavigate('reports')}
              onNavigateToExports={() => handleNavigate('exports')}
              onNavigateToSettings={() => handleNavigate('settings')}
              onOpenPhase16Integration={() => setIsPhase16ModalOpen(true)}
            />
          )}

          {/* Drawings Register */}
          {activeTab === 'drawings' && activeProject && (
            <DrawingManager
              activeProject={activeProject}
              drawings={drawings}
              activeDrawingId={activeDrawingId}
              onSelectDrawing={(id) => {
                setActiveDrawingId(id);
                handleNavigate('workspace');
              }}
              onOpenAnalysisWorkspace={(docId) => {
                setAnalysisTargetDocId(docId);
                handleNavigate('intelligence');
              }}
              onAddDrawing={handleAddDrawing}
              onDeleteDrawing={handleDeleteDrawing}
              onOpenAiScan={() => setIsAiScanOpen(true)}
              onOpenPhase17DrawingIntake={() => setIsPhase17ModalOpen(true)}
            />
          )}

          {/* Phase 14A: Drawing Intelligence Core */}
          {activeTab === 'intelligence' && activeProject && (
            <DrawingIntelligenceWorkspace />
          )}

          {/* Phase 4: Engineering Quantity Takeoff & Calculation Engine */}
          {activeTab === 'takeoff' && activeProject && (
            <TakeoffWorkspace
              project={activeProject}
              documents={projectDocuments}
              onOpenDrawingViewer={(docId) => {
                setAnalysisTargetDocId(docId);
                handleNavigate('intelligence');
              }}
              onNavigateToBoq={() => handleNavigate('boq')}
            />
          )}

          {/* Phase 15A: Professional Measurement & Calculation Engine */}
          {activeTab === 'measurement-engine' && activeProject && (
            <MeasurementEngineWorkspace
              onViewDrawing={(dwgNum) => {
                const match = drawings.find((d) => d.drawingNumber === dwgNum || d.id === dwgNum);
                if (match) {
                  setActiveDrawingId(match.id);
                  handleNavigate('workspace');
                } else {
                  handleNavigate('intelligence');
                }
              }}
            />
          )}

          {/* CAD & RCC Takeoff Canvas */}
          {activeTab === 'workspace' && activeProject && (
            <WorkspaceLayout
              drawings={drawings}
              activeDrawingId={activeDrawingId}
              onSelectDrawing={setActiveDrawingId}
              elements={elements}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onAddNewElement={handleAddNewElement}
              boqItems={boqItems}
              openItems={openItems}
              projectData={activeProject}
              onResolveOpenItem={handleResolveOpenItem}
              onTriggerShowMeWhy={handleTriggerShowMeWhy}
              onTriggerAiScan={() => setIsAiScanOpen(true)}
            />
          )}

          {/* Phase 6: Steel Structure & Roofing Takeoff Engine */}
          {(activeTab === 'steel' || activeTab === 'roofing') && activeProject && (
            <SteelRoofWorkspace
              drawings={drawings}
              onOpenDrawing={(dwgNum) => {
                const match = drawings.find((d) => d.drawingNumber === dwgNum || d.id === dwgNum);
                if (match) {
                  setActiveDrawingId(match.id);
                  handleNavigate('workspace');
                } else {
                  handleNavigate('intelligence');
                }
              }}
              onExportExcel={handleExportExcel}
            />
          )}

          {/* Phase 15C: Architectural, Masonry, DPC, Openings & Finishes Takeoff Engine */}
          {activeTab === 'architectural' && activeProject && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <MasonryFinishesEngineWorkspace />
            </div>
          )}

          {/* Phase 8: Complete MEP Quantity Takeoff Engine */}
          {activeTab === 'mep' && activeProject && (
            <MEPTakeoffWorkspace onBackToDashboard={handleGoHome} />
          )}

          {/* Phase 15B: RCC + Reinforcement + Professional BBS Engine */}
          {activeTab === 'bbs' && activeProject && (
            <div className="p-6 max-w-7xl mx-auto w-full">
              <RccBbsEngineWorkspace
                onNavigateToDrawing={(dwgNum, page) => {
                  const match = drawings.find((d) => d.drawingNumber === dwgNum || d.id === dwgNum);
                  if (match) {
                    setActiveDrawingId(match.id);
                    handleNavigate('workspace');
                  } else {
                    handleNavigate('intelligence');
                  }
                }}
              />
            </div>
          )}

          {/* BOQ Table / Phase 9: Unified BOQ Assembly Engine */}
          {activeTab === 'boq' && activeProject && (
            <UnifiedBoqWorkspace
              onBackToDashboard={handleGoHome}
            />
          )}

          {/* Phase 12: Rate Analysis & Tender Pricing Engine */}
          {activeTab === 'rate-analysis' && activeProject && (
            <RateAnalysisWorkspace
              project={activeProject}
              unifiedBoqItems={INITIAL_UNIFIED_BOQ_ITEMS}
            />
          )}

          {/* Phase 13: Professional Tender Management & Final Bid Submission Package */}
          {activeTab === 'tender' && activeProject && (
            <TenderWorkspace
              project={activeProject}
              unifiedBoqItems={INITIAL_UNIFIED_BOQ_ITEMS}
              rateAnalyses={RateAnalysisEngine.initializeRateAnalyses(INITIAL_UNIFIED_BOQ_ITEMS)}
              activeScenario={INITIAL_PRICING_SCENARIOS[0]}
              onNavigateToBoq={() => handleNavigate('boq')}
              onNavigateToRateAnalysis={() => handleNavigate('rate-analysis')}
            />
          )}

          {/* Clarification Workspace & Conflicts */}
          {(activeTab === 'open-items' || activeTab === 'conflicts') && activeProject && (
            <ClarificationWorkspace
              openItems={openItems}
              conflicts={conflicts}
              drawings={drawings}
              onResolveOpenItem={handleResolveOpenItem}
              onResolveConflict={handleResolveConflict}
              onNavigateToDrawing={(dwgId) => {
                setActiveDrawingId(dwgId);
                handleNavigate('workspace');
              }}
            />
          )}

          {/* Revision Manager */}
          {activeTab === 'revisions' && activeProject && (
            <RevisionManager
              revisions={revisions}
              elements={elements}
              boqItems={boqItems}
              projectData={activeProject}
              onApproveRevision={handleApproveRevision}
            />
          )}

          {/* Reports Center & Exports Center */}
          {(activeTab === 'reports' || activeTab === 'exports') && activeProject && (
            <ReportsWorkspace
              project={activeProject}
              onNavigateToSection={handleNavigate}
            />
          )}

          {/* Settings Workspace */}
          {activeTab === 'settings' && activeProject && (
            <SettingsWorkspace
              project={activeProject}
              onSaveProject={(updated) => {
                setActiveProject(updated);
                setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              }}
            />
          )}
        </main>
      </div>

      {/* Project Setup & Edit Modal */}
      <ProjectSetupModal
        isOpen={isProjectModalOpen}
        initialProject={projectToEdit}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleSaveProject}
      />

      {/* AI Drawing Scan Modal */}
      <AiScanModal
        isOpen={isAiScanOpen}
        onClose={() => setIsAiScanOpen(false)}
        drawings={drawings}
        activeDrawing={drawings.find((d) => d.id === activeDrawingId) || (drawings.length > 0 ? drawings[0] : null)}
        onImportExtractedData={handleImportExtractedData}
      />

      {/* Show Me Why / Formula Audit Modal */}
      <ShowMeWhyModal
        isOpen={isShowMeWhyOpen}
        onClose={() => setIsShowMeWhyOpen(false)}
        element={showMeWhyElement}
        boqItem={showMeWhyBoqItem}
        bbsRecords={bbsRecords}
        allElements={elements}
        projectData={activeProject}
      />

      {/* QA Validation Modal */}
      <ValidationAlertsModal
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        issues={validationIssues}
        onNavigateToElement={(elId) => {
          setSelectedElementId(elId);
          setActiveTab('workspace');
          setIsValidationOpen(false);
        }}
      />

      {/* Phase 10: Takeoff Validation Dashboard */}
      {isValidationDashboardOpen && (
        <TakeoffValidationModal
          isOpen={isValidationDashboardOpen}
          onClose={() => setIsValidationDashboardOpen(false)}
          boqItems={INITIAL_UNIFIED_BOQ_ITEMS}
          onInspectCalculation={() => {
            setActiveTab('boq');
            setIsValidationDashboardOpen(false);
          }}
          onInspectDrawing={() => {
            setActiveTab('intelligence');
            setIsValidationDashboardOpen(false);
          }}
        />
      )}

      {/* Phase 10: Review Queue Modal */}
      {isReviewQueueOpen && (
        <ReviewQueueModal
          isOpen={isReviewQueueOpen}
          onClose={() => setIsReviewQueueOpen(false)}
          onInspectDrawing={() => {
            setActiveTab('intelligence');
            setIsReviewQueueOpen(false);
          }}
        />
      )}

      {/* Phase 10: End-to-End Test Suite Modal */}
      {isE2ETestOpen && (
        <EndToEndTestModal
          isOpen={isE2ETestOpen}
          onClose={() => setIsE2ETestOpen(false)}
        />
      )}

      {/* Phase 10: Takeoff Error Report Modal */}
      {isErrorReportOpen && (
        <TakeoffErrorReportModal
          isOpen={isErrorReportOpen}
          onClose={() => setIsErrorReportOpen(false)}
        />
      )}

      {/* Phase 11: Professional Export Center Modal */}
      {isExportCenterOpen && (
        <ExportCenterModal
          isOpen={isExportCenterOpen}
          onClose={() => setIsExportCenterOpen(false)}
          projectData={activeProject}
          drawings={drawings}
          boqItems={INITIAL_UNIFIED_BOQ_ITEMS}
          elements={elements}
          bbsRecords={bbsRecords}
          openItems={openItems}
          conflicts={conflicts}
          assumptions={[]}
          exclusions={[]}
          revisions={revisions}
          onOpenTestRunner={() => setIsExportTestOpen(true)}
        />
      )}

      {/* Phase 11: 35-Rule Export Test Suite Modal */}
      {isExportTestOpen && (
        <ExportTestSuiteModal
          isOpen={isExportTestOpen}
          onClose={() => setIsExportTestOpen(false)}
        />
      )}

      {/* Phase 16: Master Full System Integration & E2E Verification Center Modal */}
      {isPhase16ModalOpen && (
        <Phase16MasterIntegrationModal
          isOpen={isPhase16ModalOpen}
          onClose={() => setIsPhase16ModalOpen(false)}
          projectData={activeProject}
          boqItems={INITIAL_UNIFIED_BOQ_ITEMS}
          onNavigateToTab={(tabKey) => {
            if (tabKey) {
              setActiveTab(tabKey as ActiveTab);
              setIsPhase16ModalOpen(false);
            }
          }}
          onOpenDrawingPreview={(dwgNum) => {
            setActiveTab('intelligence');
            setIsPhase16ModalOpen(false);
          }}
        />
      )}

      {/* Phase 17A: Real Drawing Intake + Processing Pipeline Center */}
      {isPhase17ModalOpen && (
        <Phase17DrawingIntakeCenter
          isOpen={isPhase17ModalOpen}
          onClose={() => setIsPhase17ModalOpen(false)}
          activeProject={activeProject}
          onStartTakeoff={(processedDrawings) => {
            setActiveTab('measurement-engine');
            setIsPhase17ModalOpen(false);
          }}
          onNavigateToTab={(tabKey) => {
            if (tabKey) {
              setActiveTab(tabKey as ActiveTab);
              setIsPhase17ModalOpen(false);
            }
          }}
        />
      )}
      {/* Phase 17C: Unsaved Changes Navigation Guard Modal */}
      <UnsavedChangesModal
        isOpen={isUnsavedModalOpen}
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
        targetSectionName={pendingNavTab ? pendingNavTab.toUpperCase() : undefined}
      />

      {/* Persistence: Project Version History Checkpoints Modal */}
      {isVersionsModalOpen && (
        <ProjectVersionModal
          isOpen={isVersionsModalOpen}
          onClose={() => setIsVersionsModalOpen(false)}
          projectId={selectedVersionProjectId || activeProject?.id || ''}
          projectName={
            projects.find((p) => p.id === (selectedVersionProjectId || activeProject?.id))?.project?.name ||
            activeProject?.project?.name ||
            'Project'
          }
          onRollbackSuccess={handleRollbackVersion}
        />
      )}

      {/* Persistence: Project Full Backup Export / Import Modal */}
      {isBackupModalOpen && (
        <ProjectBackupModal
          isOpen={isBackupModalOpen}
          onClose={() => setIsBackupModalOpen(false)}
          projectId={selectedVersionProjectId || activeProject?.id}
          projectName={
            projects.find((p) => p.id === (selectedVersionProjectId || activeProject?.id))?.project?.name ||
            activeProject?.project?.name
          }
          onImportSuccess={handleImportBackup}
        />
      )}

      {/* Persistence: Project Duplication / Cloning Modal */}
      {isDuplicateModalOpen && projectToDuplicate && (
        <ProjectDuplicateModal
          isOpen={isDuplicateModalOpen}
          onClose={() => {
            setIsDuplicateModalOpen(false);
            setProjectToDuplicate(null);
          }}
          sourceProject={projectToDuplicate}
          onDuplicateConfirm={handleConfirmDuplicate}
        />
      )}
    </div>
  );
}

export default App;

