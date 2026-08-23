import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FolderOpen, 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  Sparkles, 
  Plus, 
  Trash2, 
  Archive, 
  RotateCcw, 
  Download, 
  Maximize2, 
  Edit3, 
  CheckCircle2, 
  Layers, 
  Box, 
  PenTool, 
  X, 
  FileSpreadsheet, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  AlertTriangle, 
  EyeOff, 
  Sun, 
  Moon, 
  Grid, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Building2,
  FolderKanban
} from 'lucide-react';
import { 
  ProjectRecord, 
  ProjectDocument, 
  DocumentTypeOption, 
  DocumentDisciplineOption, 
  DocumentStatus, 
  DocumentAnalysisStatus,
  FileFormat,
  DrawingRecord
} from '../types';
import { DocumentStorageService } from '../services/documentStorage';
import { UploadDocumentModal } from './UploadDocumentModal';
import { RevisionWarningModal, RevisionConflictData } from './RevisionWarningModal';
import { FullScreenViewerModal } from './FullScreenViewerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface DrawingManagerProps {
  activeProject: ProjectRecord | null;
  onNavigateToDashboard?: () => void;
  onNavigateToAllProjects?: () => void;
  // Legacy / integration props for backward compatibility
  drawings?: DrawingRecord[];
  activeDrawingId?: string | null;
  onSelectDrawing?: (id: string) => void;
  onSelectDrawingForViewer?: (drawing: DrawingRecord) => void;
}

type SortField = 'drawingNumber' | 'title' | 'revision' | 'drawingDate' | 'uploadDate' | 'discipline' | 'status';
type SortOrder = 'asc' | 'desc';

export const DrawingManager: React.FC<DrawingManagerProps> = ({
  activeProject,
  onNavigateToDashboard,
  onNavigateToAllProjects,
  onSelectDrawing,
}) => {
  const projectId = activeProject?.id || '';
  const projectName = activeProject?.project?.name || 'Current Project';

  // State: Documents belonging strictly to this project
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [selectedDocType, setSelectedDocType] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedFormat, setSelectedFormat] = useState<string>('All');
  const [statusView, setStatusView] = useState<'Active' | 'Archived' | 'All'>('Active');
  const [selectedAnalysisStatus, setSelectedAnalysisStatus] = useState<string>('All');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('drawingNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isHandSketchModalOpen, setIsHandSketchModalOpen] = useState<boolean>(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState<boolean>(false);
  const [conflictData, setConflictData] = useState<RevisionConflictData | null>(null);
  const [deleteTargetDoc, setDeleteTargetDoc] = useState<ProjectDocument | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState<boolean>(false);

  // Right Panel: Tab (Preview vs Metadata Edit)
  const [rightPanelTab, setRightPanelTab] = useState<'preview' | 'metadata' | 'revisions'>('preview');

  // Right Panel: In-line editable metadata form
  const [editingMetadata, setEditingMetadata] = useState<Partial<ProjectDocument>>({});
  const [isSavingMeta, setIsSavingMeta] = useState<boolean>(false);
  const [metaSaveSuccessToast, setMetaSaveSuccessToast] = useState<boolean>(false);

  // Preview interactive controls state
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [previewRotation, setPreviewRotation] = useState<number>(0);
  const [previewCadDark, setPreviewCadDark] = useState<boolean>(true);
  const [previewGrid, setPreviewGrid] = useState<boolean>(true);
  const [previewPage, setPreviewPage] = useState<number>(1);

  // Disciplines list for left sidebar
  const disciplinesList: (DocumentDisciplineOption | 'All')[] = [
    'All',
    'Architectural',
    'Structural',
    'Civil',
    'Steel',
    'HVAC',
    'Electrical',
    'Plumbing',
    'Fire Fighting',
    'MEP',
    'Roofing',
    'Cladding',
    'General',
    'Other',
  ];

  const docTypesList: DocumentTypeOption[] = [
    'Tender Drawing',
    'Construction Drawing',
    'Shop Drawing',
    'Fabrication Drawing',
    'As-Built Drawing',
    'IFC / BIM',
    'Consultant Drawing',
    'Architectural',
    'Structural',
    'MEP',
    'Specification',
    'Schedule',
    'Hand Sketch',
    'Markup',
    'Other',
  ];

  // Load documents for current active project
  useEffect(() => {
    let isMounted = true;

    async function loadProjectDocuments() {
      if (!projectId) {
        setDocuments([]);
        setSelectedDocId(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        let list = await DocumentStorageService.getDocumentsByProject(projectId, true);

        // If this is the sample test fixture project and it has 0 documents, seed initial test drawings
        if (list.length === 0 && activeProject?.isTestProject) {
          list = await DocumentStorageService.seedInitialTestDocuments(projectId);
        }

        if (isMounted) {
          setDocuments(list);
          // Set first active document if available
          const firstActive = list.find((d) => !d.isArchived) || list[0];
          if (firstActive) {
            setSelectedDocId(firstActive.id);
            setEditingMetadata({ ...firstActive });
            if (onSelectDrawing) onSelectDrawing(firstActive.id);
          } else {
            setSelectedDocId(null);
            setEditingMetadata({});
          }
        }
      } catch (err) {
        console.error('Failed to load project documents:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProjectDocuments();

    return () => {
      isMounted = false;
    };
  }, [projectId, activeProject?.isTestProject]);

  // Active Selected Document
  const selectedDoc = useMemo(() => {
    return documents.find((d) => d.id === selectedDocId) || null;
  }, [documents, selectedDocId]);

  // Synchronize editing form when selected doc changes
  useEffect(() => {
    if (selectedDoc) {
      setEditingMetadata({ ...selectedDoc });
      setPreviewZoom(100);
      setPreviewRotation(0);
      setPreviewPage(1);
    }
  }, [selectedDocId, selectedDoc?.id]);

  // Filter & Search Pipeline
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        // Status filter
        if (statusView === 'Active' && doc.isArchived) return false;
        if (statusView === 'Archived' && !doc.isArchived) return false;

        // Discipline filter
        if (selectedDiscipline !== 'All' && doc.discipline !== selectedDiscipline) return false;

        // Document Type filter
        if (selectedDocType !== 'All' && doc.documentType !== selectedDocType) return false;

        // Level filter
        if (selectedLevel !== 'All' && doc.level !== selectedLevel) return false;

        // Format filter
        if (selectedFormat !== 'All' && doc.fileFormat !== selectedFormat) return false;

        // Analysis Status filter
        if (selectedAnalysisStatus !== 'All' && doc.analysisStatus !== selectedAnalysisStatus) return false;

        // Global search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNumber = (doc.drawingNumber || '').toLowerCase().includes(q);
          const matchId = (doc.id || '').toLowerCase().includes(q);
          const matchTitle = (doc.title || '').toLowerCase().includes(q);
          const matchDesc = (doc.description || '').toLowerCase().includes(q);
          const matchRev = (doc.revision || '').toLowerCase().includes(q);
          const matchDisc = (doc.discipline || '').toLowerCase().includes(q);
          const matchLevel = (doc.level || '').toLowerCase().includes(q);
          const matchFile = (doc.sourceFileName || '').toLowerCase().includes(q);
          const matchType = (doc.documentType || '').toLowerCase().includes(q);

          if (
            !matchNumber &&
            !matchId &&
            !matchTitle &&
            !matchDesc &&
            !matchRev &&
            !matchDisc &&
            !matchLevel &&
            !matchFile &&
            !matchType
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let valA: string = '';
        let valB: string = '';

        if (sortField === 'drawingNumber') {
          valA = a.drawingNumber || a.id;
          valB = b.drawingNumber || b.id;
        } else if (sortField === 'title') {
          valA = a.title || '';
          valB = b.title || '';
        } else if (sortField === 'revision') {
          valA = a.revision || '';
          valB = b.revision || '';
        } else if (sortField === 'drawingDate') {
          valA = a.drawingDate || '';
          valB = b.drawingDate || '';
        } else if (sortField === 'uploadDate') {
          valA = a.uploadDate || '';
          valB = b.uploadDate || '';
        } else if (sortField === 'discipline') {
          valA = a.discipline || '';
          valB = b.discipline || '';
        } else if (sortField === 'status') {
          valA = a.status || '';
          valB = b.status || '';
        }

        const cmp = valA.localeCompare(valB, undefined, { numeric: true });
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [
    documents,
    statusView,
    selectedDiscipline,
    selectedDocType,
    selectedLevel,
    selectedFormat,
    selectedAnalysisStatus,
    searchQuery,
    sortField,
    sortOrder,
  ]);

  // Unique lists for dropdown filters
  const uniqueLevels = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.level) set.add(d.level);
    });
    return Array.from(set);
  }, [documents]);

  const uniqueFormats = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.fileFormat) set.add(d.fileFormat);
    });
    return Array.from(set);
  }, [documents]);

  // Active filter count
  const activeFiltersCount =
    (selectedDiscipline !== 'All' ? 1 : 0) +
    (selectedDocType !== 'All' ? 1 : 0) +
    (selectedLevel !== 'All' ? 1 : 0) +
    (selectedFormat !== 'All' ? 1 : 0) +
    (selectedAnalysisStatus !== 'All' ? 1 : 0) +
    (statusView !== 'Active' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const handleClearFilters = () => {
    setSelectedDiscipline('All');
    setSelectedDocType('All');
    setSelectedLevel('All');
    setSelectedFormat('All');
    setSelectedAnalysisStatus('All');
    setStatusView('Active');
    setSearchQuery('');
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Document selection
  const handleSelectDoc = (doc: ProjectDocument) => {
    setSelectedDocId(doc.id);
    if (onSelectDrawing) onSelectDrawing(doc.id);
  };

  // Upload completed callback
  const handleUploadSuccess = (createdDocs: ProjectDocument[]) => {
    setDocuments((prev) => [...createdDocs, ...prev]);
    if (createdDocs.length > 0) {
      setSelectedDocId(createdDocs[0].id);
      if (onSelectDrawing) onSelectDrawing(createdDocs[0].id);
    }
  };

  // Revision conflict detected handler
  const handleRevisionConflictDetected = (conflict: RevisionConflictData) => {
    setConflictData(conflict);
  };

  // Revision Conflict Action: Make Current
  const handleMakeRevisionCurrent = async () => {
    if (!conflictData) return;

    try {
      const existingDocs = await DocumentStorageService.getDocumentsByProject(projectId, true);
      const newDocId = DocumentStorageService.generateDocumentId(existingDocs);

      const newDoc: ProjectDocument = {
        id: newDocId,
        projectId,
        drawingSeriesId: conflictData.seriesId,
        drawingNumber: conflictData.drawingNumber,
        title: conflictData.file.name.replace(/\.[^/.]+$/, ''),
        documentType: (conflictData.docForm.documentType as DocumentTypeOption) || 'Tender Drawing',
        discipline: (conflictData.docForm.discipline as DocumentDisciplineOption) || 'Structural',
        revision: conflictData.newRevision,
        isCurrentRevision: true, // Mark as current
        drawingDate: new Date().toISOString().split('T')[0],
        level: conflictData.docForm.level || 'Typical Floor',
        status: 'READY',
        analysisStatus: 'NOT_ANALYZED',
        preparedBy: conflictData.docForm.preparedBy,
        source: conflictData.docForm.source,
        notes: conflictData.docForm.notes,
        sourceFileName: conflictData.file.name,
        fileExtension: conflictData.technicalMeta.fileExtension,
        fileFormat: conflictData.technicalMeta.fileFormat,
        fileSize: conflictData.technicalMeta.fileSize,
        uploadDate: conflictData.technicalMeta.uploadDate,
        pageCount: conflictData.technicalMeta.pageCount,
        imageDimensions: conflictData.technicalMeta.imageDimensions,
        cadFormat: conflictData.technicalMeta.cadFormat,
        ifcMetadata: conflictData.technicalMeta.ifcMetadata,
        previewDataUrl: conflictData.technicalMeta.previewDataUrl,
        previewType: conflictData.technicalMeta.previewType,
        isVector: conflictData.technicalMeta.isVector,
        detectedElementsCount: 0,
        openItemsCount: 0,
        isArchived: false,
      };

      const saved = await DocumentStorageService.saveDocument(newDoc, conflictData.file);
      setDocuments((prev) => [
        saved,
        ...prev.map((d) =>
          d.drawingSeriesId === conflictData.seriesId ? { ...d, isCurrentRevision: false } : d
        ),
      ]);
      setSelectedDocId(saved.id);
      setConflictData(null);
    } catch (err) {
      console.error('Failed to make revision current:', err);
    }
  };

  // Revision Conflict Action: Keep As Draft
  const handleKeepRevisionAsDraft = async () => {
    if (!conflictData) return;

    try {
      const existingDocs = await DocumentStorageService.getDocumentsByProject(projectId, true);
      const newDocId = DocumentStorageService.generateDocumentId(existingDocs);

      const newDoc: ProjectDocument = {
        id: newDocId,
        projectId,
        drawingSeriesId: conflictData.seriesId,
        drawingNumber: conflictData.drawingNumber,
        title: conflictData.file.name.replace(/\.[^/.]+$/, ''),
        documentType: (conflictData.docForm.documentType as DocumentTypeOption) || 'Tender Drawing',
        discipline: (conflictData.docForm.discipline as DocumentDisciplineOption) || 'Structural',
        revision: conflictData.newRevision,
        isCurrentRevision: false, // Keep as draft / non-current
        drawingDate: new Date().toISOString().split('T')[0],
        level: conflictData.docForm.level || 'Typical Floor',
        status: 'READY',
        analysisStatus: 'NOT_ANALYZED',
        preparedBy: conflictData.docForm.preparedBy,
        source: conflictData.docForm.source,
        notes: conflictData.docForm.notes,
        sourceFileName: conflictData.file.name,
        fileExtension: conflictData.technicalMeta.fileExtension,
        fileFormat: conflictData.technicalMeta.fileFormat,
        fileSize: conflictData.technicalMeta.fileSize,
        uploadDate: conflictData.technicalMeta.uploadDate,
        pageCount: conflictData.technicalMeta.pageCount,
        imageDimensions: conflictData.technicalMeta.imageDimensions,
        cadFormat: conflictData.technicalMeta.cadFormat,
        ifcMetadata: conflictData.technicalMeta.ifcMetadata,
        previewDataUrl: conflictData.technicalMeta.previewDataUrl,
        previewType: conflictData.technicalMeta.previewType,
        isVector: conflictData.technicalMeta.isVector,
        detectedElementsCount: 0,
        openItemsCount: 0,
        isArchived: false,
      };

      const saved = await DocumentStorageService.saveDocument(newDoc, conflictData.file);
      setDocuments((prev) => [saved, ...prev]);
      setSelectedDocId(saved.id);
      setConflictData(null);
    } catch (err) {
      console.error('Failed to save draft revision:', err);
    }
  };

  // Set Current Revision for series from UI
  const handleSetAsCurrentRevision = async (doc: ProjectDocument) => {
    try {
      await DocumentStorageService.setCurrentRevision(projectId, doc.drawingSeriesId || doc.drawingNumber, doc.id);
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.drawingSeriesId === doc.drawingSeriesId || d.drawingNumber === doc.drawingNumber) {
            return { ...d, isCurrentRevision: d.id === doc.id };
          }
          return d;
        })
      );
    } catch (err) {
      console.error('Failed to set current revision:', err);
    }
  };

  // Save metadata changes
  const handleSaveMetadataChanges = async () => {
    if (!selectedDoc) return;
    setIsSavingMeta(true);

    try {
      const updated = await DocumentStorageService.updateDocumentMetadata(selectedDoc.id, {
        drawingNumber: editingMetadata.drawingNumber || '',
        title: editingMetadata.title || '',
        description: editingMetadata.description || '',
        documentType: editingMetadata.documentType || 'Tender Drawing',
        discipline: editingMetadata.discipline || 'Structural',
        revision: editingMetadata.revision || 'Rev 01',
        drawingDate: editingMetadata.drawingDate || '',
        level: editingMetadata.level || '',
        status: editingMetadata.status || 'READY',
        preparedBy: editingMetadata.preparedBy || '',
        checkedBy: editingMetadata.checkedBy || '',
        approvedBy: editingMetadata.approvedBy || '',
        source: editingMetadata.source || '',
        notes: editingMetadata.notes || '',
      });

      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setMetaSaveSuccessToast(true);
      setTimeout(() => setMetaSaveSuccessToast(false), 3000);
    } catch (err) {
      console.error('Failed to save metadata:', err);
    } finally {
      setIsSavingMeta(false);
    }
  };

  // Archive or Restore
  const handleToggleArchive = (doc: ProjectDocument) => {
    if (doc.isArchived) {
      // Direct Restore
      DocumentStorageService.archiveDocument(doc.id, false).then(() => {
        setDocuments((prev) =>
          prev.map((d) => (d.id === doc.id ? { ...d, isArchived: false, status: 'READY' } : d))
        );
      });
    } else {
      // Trigger confirmation modal
      setDeleteTargetDoc(doc);
      setIsPermanentDelete(false);
    }
  };

  // Permanent Delete Trigger
  const handleRequestPermanentDelete = (doc: ProjectDocument) => {
    setDeleteTargetDoc(doc);
    setIsPermanentDelete(true);
  };

  // Confirm Archive / Delete from modal
  const handleConfirmDeleteModal = async () => {
    if (!deleteTargetDoc) return;

    if (isPermanentDelete) {
      await DocumentStorageService.deleteDocumentPermanently(deleteTargetDoc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTargetDoc.id));
      if (selectedDocId === deleteTargetDoc.id) {
        const remaining = documents.filter((d) => d.id !== deleteTargetDoc.id);
        setSelectedDocId(remaining[0]?.id || null);
      }
    } else {
      await DocumentStorageService.archiveDocument(deleteTargetDoc.id, true);
      setDocuments((prev) =>
        prev.map((d) => (d.id === deleteTargetDoc.id ? { ...d, isArchived: true, status: 'ARCHIVED' } : d))
      );
    }

    setDeleteTargetDoc(null);
  };

  // Export to Excel
  const handleExportExcel = () => {
    DocumentStorageService.exportDrawingRegisterExcel(documents, projectName, projectId);
  };

  // Revisions stack for current selected document
  const currentSeriesRevisions = useMemo(() => {
    if (!selectedDoc) return [];
    const seriesId = selectedDoc.drawingSeriesId || selectedDoc.drawingNumber;
    if (!seriesId) return [selectedDoc];
    return documents.filter(
      (d) => d.drawingSeriesId === seriesId || (d.drawingNumber && d.drawingNumber === selectedDoc.drawingNumber)
    );
  }, [selectedDoc, documents]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] text-slate-800 select-none overflow-hidden font-sans">
      {/* Top Header & Breadcrumb Bar */}
      <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-2xs">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={onNavigateToAllProjects}
            className="text-slate-500 hover:text-slate-900 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
            <span>Projects</span>
          </button>
          <span className="text-slate-300">/</span>
          <button
            onClick={onNavigateToDashboard}
            className="font-bold text-slate-700 hover:text-indigo-600 transition-colors line-clamp-1 max-w-xs cursor-pointer"
          >
            {projectName}
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
            <FolderOpen className="w-3 h-3" />
            <span>Drawings & Documents</span>
          </span>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Export full drawing register to Excel spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>EXPORT REGISTER</span>
          </button>

          <button
            onClick={() => setIsHandSketchModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <PenTool className="w-3.5 h-3.5 text-amber-600" />
            <span>+ UPLOAD HAND SKETCH</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ UPLOAD DRAWINGS / DOCUMENTS</span>
          </button>
        </div>
      </div>

      {/* 3-COLUMN MAIN LAYOUT */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* 1. LEFT COLUMN: CATEGORIES & FILTERS */}
        {/* ========================================================================= */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Disciplines & Filters</span>
            </h3>

            {activeFiltersCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-[11px] text-indigo-600 hover:underline font-bold cursor-pointer"
              >
                Clear ({activeFiltersCount})
              </button>
            )}
          </div>

          {/* Active / Archive Toggle Tabs */}
          <div className="p-3 border-b border-slate-100">
            <div className="grid grid-cols-2 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setStatusView('Active')}
                className={`py-1 rounded-md transition-all cursor-pointer ${
                  statusView === 'Active'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Active ({documents.filter((d) => !d.isArchived).length})
              </button>
              <button
                onClick={() => setStatusView('Archived')}
                className={`py-1 rounded-md transition-all cursor-pointer ${
                  statusView === 'Archived'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Archived ({documents.filter((d) => d.isArchived).length})
              </button>
            </div>
          </div>

          {/* Discipline Categories List */}
          <div className="p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase text-slate-400 px-2 block mb-1">
              Discipline Categories
            </span>
            {disciplinesList.map((disc) => {
              const count =
                disc === 'All'
                  ? documents.filter((d) => (statusView === 'Active' ? !d.isArchived : d.isArchived)).length
                  : documents.filter(
                      (d) =>
                        d.discipline === disc &&
                        (statusView === 'Active' ? !d.isArchived : d.isArchived)
                    ).length;

              const isSelected = selectedDiscipline === disc;

              return (
                <button
                  key={disc}
                  onClick={() => setSelectedDiscipline(disc)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{disc === 'All' ? 'All Documents' : disc}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detailed Filter Dropdowns */}
          <div className="p-3 border-t border-slate-100 space-y-3 text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">
              Additional Filters
            </span>

            {/* Document Type */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">Document Type</label>
              <select
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800"
              >
                <option value="All">All Types</option>
                {docTypesList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Floor Level */}
            {uniqueLevels.length > 0 && (
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">Floor Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800"
                >
                  <option value="All">All Levels</option>
                  {uniqueLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* File Format */}
            {uniqueFormats.length > 0 && (
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">File Format</label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800"
                >
                  <option value="All">All Formats</option>
                  {uniqueFormats.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Analysis Status */}
            <div>
              <label className="text-[11px] text-slate-600 font-semibold block mb-1">Analysis Status</label>
              <select
                value={selectedAnalysisStatus}
                onChange={(e) => setSelectedAnalysisStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800"
              >
                <option value="All">All Analysis Statuses</option>
                <option value="NOT_ANALYZED">Not Analyzed</option>
                <option value="ANALYZED">Analyzed</option>
                <option value="REQUIRES_REVIEW">Requires Review</option>
                <option value="PARTIALLY_ANALYZED">Partially Analyzed</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CENTER COLUMN: DRAWING / DOCUMENT REGISTER */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white border-r border-slate-200">
          {/* Top Search Toolbar */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search drawing number, document ID, title, level, filename..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-mono">
              Showing <strong>{filteredDocuments.length}</strong> of {documents.length} documents
            </div>
          </div>

          {/* Register Table View */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-200 select-none">
                <tr>
                  <th
                    onClick={() => handleSort('drawingNumber')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Drawing No.</span>
                      {sortField === 'drawingNumber' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('title')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Title</span>
                      {sortField === 'title' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      )}
                    </div>
                  </th>

                  <th className="py-2.5 px-3">Type</th>
                  <th
                    onClick={() => handleSort('discipline')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Discipline</span>
                      {sortField === 'discipline' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('revision')}
                    className="py-2.5 px-2 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Rev</span>
                      {sortField === 'revision' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      )}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('drawingDate')}
                    className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      {sortField === 'drawingDate' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      )}
                    </div>
                  </th>

                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-2 text-center">Format</th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-2.5 px-2 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Status</span>
                      {sortField === 'status' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                      )}
                    </div>
                  </th>

                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      Loading project drawings...
                    </td>
                  </tr>
                ) : filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400 space-y-3">
                      <FolderOpen className="w-10 h-10 mx-auto text-slate-300" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">No documents found</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {documents.length === 0
                            ? 'Upload project drawings or hand sketches using the buttons above.'
                            : 'No documents match the current filter criteria.'}
                        </p>
                      </div>
                      {activeFiltersCount > 0 && (
                        <button
                          onClick={handleClearFilters}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded text-slate-700"
                        >
                          Clear Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => {
                    const isSelected = doc.id === selectedDocId;

                    return (
                      <tr
                        key={doc.id}
                        onClick={() => handleSelectDoc(doc)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600 font-medium'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Drawing Number */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-indigo-700">
                              {doc.drawingNumber || <span className="text-slate-400 italic">Unassigned</span>}
                            </span>
                            {doc.isCurrentRevision && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {doc.id}
                          </span>
                        </td>

                        {/* Title */}
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-slate-900 line-clamp-1">{doc.title}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-xs font-mono">
                            {doc.sourceFileName}
                          </p>
                        </td>

                        {/* Document Type */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {doc.documentType}
                          </span>
                        </td>

                        {/* Discipline */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-xs text-slate-700 font-medium">{doc.discipline}</span>
                        </td>

                        {/* Revision */}
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                          {doc.revision}
                        </td>

                        {/* Drawing Date */}
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {doc.drawingDate || '-'}
                        </td>

                        {/* Level */}
                        <td className="py-2.5 px-3 text-slate-700 text-xs whitespace-nowrap">
                          {doc.level || '-'}
                        </td>

                        {/* Format */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-50 text-slate-700 border border-slate-200">
                            {doc.fileFormat}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.isArchived
                                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                : doc.status === 'READY'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                handleSelectDoc(doc);
                                setIsFullScreenOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              title="Full Screen Viewer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => DocumentStorageService.downloadOriginalFile(doc)}
                              className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="Download Original File"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleArchive(doc)}
                              className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-slate-100 transition-colors"
                              title={doc.isArchived ? 'Restore Document' : 'Archive Document'}
                            >
                              {doc.isArchived ? (
                                <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Archive className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => handleRequestPermanentDelete(doc)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. RIGHT COLUMN: PREVIEW / DOCUMENT INFORMATION PANEL */}
        {/* ========================================================================= */}
        <div className="w-96 bg-white flex flex-col shrink-0 overflow-hidden">
          {selectedDoc ? (
            <>
              {/* Top Tabs */}
              <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs font-semibold">
                  <button
                    onClick={() => setRightPanelTab('preview')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      rightPanelTab === 'preview'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setRightPanelTab('metadata')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      rightPanelTab === 'metadata'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Metadata
                  </button>
                  <button
                    onClick={() => setRightPanelTab('revisions')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      rightPanelTab === 'revisions'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Revisions ({currentSeriesRevisions.length})
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsFullScreenOpen(true)}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    title="Open Full Screen"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => DocumentStorageService.downloadOriginalFile(selectedDoc)}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                    title="Download Original"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TAB 1: INTERACTIVE PREVIEW */}
              {rightPanelTab === 'preview' && (
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-900 text-white relative">
                  {/* Preview Toolbar */}
                  <div className="p-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewZoom((z) => Math.max(z - 25, 25))}
                        className="p-1 rounded hover:bg-slate-800 text-slate-300"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-[11px] text-slate-400 w-9 text-center">
                        {previewZoom}%
                      </span>
                      <button
                        onClick={() => setPreviewZoom((z) => Math.min(z + 25, 300))}
                        className="p-1 rounded hover:bg-slate-800 text-slate-300"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewRotation((r) => (r + 90) % 360)}
                        className="p-1 rounded hover:bg-slate-800 text-slate-300"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>

                      {['DWG', 'DXF'].includes(selectedDoc.fileFormat) && (
                        <button
                          onClick={() => setPreviewCadDark(!previewCadDark)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-300"
                          title="Toggle CAD theme"
                        >
                          {previewCadDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preview Canvas */}
                  <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative bg-[#0B0F19]">
                    {/* PDF Preview */}
                    {selectedDoc.fileFormat === 'PDF' && (
                      <div
                        style={{
                          transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)`,
                          transformOrigin: 'center center',
                        }}
                        className="w-full max-w-sm bg-white rounded shadow-lg p-3 text-slate-900 text-xs select-none pointer-events-none"
                      >
                        <div className="border-b border-slate-300 pb-1 mb-2 flex justify-between">
                          <span className="font-bold text-[10px] text-indigo-700">{selectedDoc.drawingNumber || selectedDoc.id}</span>
                          <span className="text-[10px] font-mono text-slate-500">{selectedDoc.revision}</span>
                        </div>
                        <p className="font-bold text-[11px] text-slate-800 line-clamp-1">{selectedDoc.title}</p>
                        <div className="h-44 border border-dashed border-slate-200 rounded my-2 flex items-center justify-center bg-slate-50 relative overflow-hidden">
                          <svg viewBox="0 0 400 300" className="w-full h-full p-2 opacity-80">
                            <rect x="50" y="50" width="300" height="200" fill="none" stroke="#2563EB" strokeWidth="2" />
                            <line x1="50" y1="150" x2="350" y2="150" stroke="#94A3B8" strokeDasharray="4,4" />
                            <line x1="200" y1="50" x2="200" y2="250" stroke="#94A3B8" strokeDasharray="4,4" />
                            <rect x="40" y="40" width="20" height="20" fill="#1E293B" />
                            <rect x="190" y="40" width="20" height="20" fill="#1E293B" />
                            <rect x="340" y="40" width="20" height="20" fill="#1E293B" />
                            <rect x="40" y="140" width="20" height="20" fill="#1E293B" />
                            <rect x="190" y="140" width="20" height="20" fill="#1E293B" />
                            <rect x="340" y="140" width="20" height="20" fill="#1E293B" />
                          </svg>
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono">Scale: {selectedDoc.scaleRatio || '1:100'} • {selectedDoc.level}</p>
                      </div>
                    )}

                    {/* Image / Hand Sketch Preview */}
                    {(selectedDoc.fileFormat === 'Image' || selectedDoc.fileFormat === 'Sketch') && (
                      <div
                        style={{
                          transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)`,
                          transformOrigin: 'center center',
                        }}
                        className="max-w-full max-h-full flex items-center justify-center"
                      >
                        {selectedDoc.previewDataUrl ? (
                          <img
                            src={selectedDoc.previewDataUrl}
                            alt={selectedDoc.title}
                            className="max-h-64 rounded shadow-md object-contain border border-slate-700"
                          />
                        ) : (
                          <div className="p-6 text-center text-slate-400">
                            <FileText className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
                            <p className="font-bold text-white text-xs">{selectedDoc.title}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CAD Preview */}
                    {(selectedDoc.fileFormat === 'DWG' || selectedDoc.fileFormat === 'DXF') && (
                      <div
                        style={{
                          transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)`,
                          transformOrigin: 'center center',
                        }}
                        className="w-full h-56 rounded border border-slate-800 bg-[#0E1117] flex items-center justify-center p-2 relative overflow-hidden"
                      >
                        <svg viewBox="0 0 500 350" className="w-full h-full">
                          <rect x="50" y="50" width="400" height="250" fill="none" stroke="#38BDF8" strokeWidth="2" />
                          <line x1="50" y1="175" x2="450" y2="175" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4,4" />
                          <line x1="250" y1="50" x2="250" y2="300" stroke="#38BDF8" strokeWidth="1" strokeDasharray="4,4" />
                          <line x1="50" y1="175" x2="250" y2="60" stroke="#F59E0B" strokeWidth="2" />
                          <line x1="450" y1="175" x2="250" y2="60" stroke="#F59E0B" strokeWidth="2" />
                        </svg>
                      </div>
                    )}

                    {/* IFC BIM Preview */}
                    {selectedDoc.fileFormat === 'IFC' && (
                      <div className="w-full bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Box className="w-4 h-4" />
                          <span className="font-bold">IFC BIM Model</span>
                        </div>
                        <p className="text-slate-300">Schema: {selectedDoc.ifcMetadata?.schema || 'IFC4'}</p>
                        <p className="text-slate-400">Storeys: {selectedDoc.ifcMetadata?.storeys?.join(', ') || 'All Storeys'}</p>
                      </div>
                    )}

                    {/* Unsupported Preview */}
                    {selectedDoc.previewType === 'unsupported' && (
                      <div className="p-6 text-center text-slate-400 space-y-2">
                        <EyeOff className="w-8 h-8 mx-auto text-slate-500" />
                        <p className="font-bold text-white text-xs">PREVIEW NOT AVAILABLE</p>
                        <p className="text-[11px] text-slate-400">
                          File .{selectedDoc.fileExtension} is preserved for download.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Open Full Screen Button */}
                  <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
                    <button
                      onClick={() => setIsFullScreenOpen(true)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>OPEN FULL SCREEN</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: EDITABLE METADATA FORM */}
              {rightPanelTab === 'metadata' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                  {metaSaveSuccessToast && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Metadata updated successfully!</span>
                    </div>
                  )}

                  {/* Read-Only System Details */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Document ID:</span>
                      <strong className="text-indigo-700">{selectedDoc.id}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Source File:</span>
                      <span className="truncate max-w-[180px] font-bold text-slate-800">{selectedDoc.sourceFileName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">File Size:</span>
                      <span>{Math.round(selectedDoc.fileSize / 1024)} KB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Upload Date:</span>
                      <span>{selectedDoc.uploadDate ? selectedDoc.uploadDate.split('T')[0] : '-'}</span>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Drawing Sheet Number</label>
                    <input
                      type="text"
                      value={editingMetadata.drawingNumber || ''}
                      onChange={(e) => setEditingMetadata({ ...editingMetadata, drawingNumber: e.target.value })}
                      placeholder="e.g. S-203"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono font-bold text-indigo-900"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Title</label>
                    <input
                      type="text"
                      value={editingMetadata.title || ''}
                      onChange={(e) => setEditingMetadata({ ...editingMetadata, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Revision</label>
                      <input
                        type="text"
                        value={editingMetadata.revision || ''}
                        onChange={(e) => setEditingMetadata({ ...editingMetadata, revision: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Drawing Date</label>
                      <input
                        type="date"
                        value={editingMetadata.drawingDate || ''}
                        onChange={(e) => setEditingMetadata({ ...editingMetadata, drawingDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Document Type</label>
                      <select
                        value={editingMetadata.documentType || 'Tender Drawing'}
                        onChange={(e) =>
                          setEditingMetadata({ ...editingMetadata, documentType: e.target.value as DocumentTypeOption })
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800"
                      >
                        {docTypesList.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Discipline</label>
                      <select
                        value={editingMetadata.discipline || 'Structural'}
                        onChange={(e) =>
                          setEditingMetadata({ ...editingMetadata, discipline: e.target.value as DocumentDisciplineOption })
                        }
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800"
                      >
                        {disciplinesList
                          .filter((d) => d !== 'All')
                          .map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Floor Level</label>
                    <input
                      type="text"
                      value={editingMetadata.level || ''}
                      onChange={(e) => setEditingMetadata({ ...editingMetadata, level: e.target.value })}
                      placeholder="e.g. Foundation Level, Typical Office Floors"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Prepared By</label>
                      <input
                        type="text"
                        value={editingMetadata.preparedBy || ''}
                        onChange={(e) => setEditingMetadata({ ...editingMetadata, preparedBy: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Source / Consultant</label>
                      <input
                        type="text"
                        value={editingMetadata.source || ''}
                        onChange={(e) => setEditingMetadata({ ...editingMetadata, source: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Notes / Scope Description</label>
                    <textarea
                      rows={3}
                      value={editingMetadata.notes || ''}
                      onChange={(e) => setEditingMetadata({ ...editingMetadata, notes: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs"
                      placeholder="Engineering notes..."
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSaveMetadataChanges}
                      disabled={isSavingMeta}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isSavingMeta ? 'Saving Changes...' : 'Save Metadata Changes'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: REVISION HISTORY STACK */}
              {rightPanelTab === 'revisions' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Revision Series: <span className="font-mono text-indigo-700">{selectedDoc.drawingSeriesId || selectedDoc.drawingNumber || selectedDoc.id}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      All uploaded revisions remain permanently accessible. Switch the current active revision anytime.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {currentSeriesRevisions.map((revDoc) => (
                      <div
                        key={revDoc.id}
                        onClick={() => handleSelectDoc(revDoc)}
                        className={`p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                          revDoc.id === selectedDoc.id
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{revDoc.revision}</span>
                            {revDoc.isCurrentRevision ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                CURRENT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                                Historical
                              </span>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400 font-mono">
                            {revDoc.uploadDate ? revDoc.uploadDate.split('T')[0] : '-'}
                          </span>
                        </div>

                        <p className="text-[11px] font-medium text-slate-700 mt-1 line-clamp-1">
                          {revDoc.title}
                        </p>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100">
                          <span className="text-[10px] text-slate-500 font-mono">
                            {Math.round(revDoc.fileSize / 1024)} KB • {revDoc.fileFormat}
                          </span>

                          {!revDoc.isCurrentRevision && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetAsCurrentRevision(revDoc);
                              }}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Make Current
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
              <FolderOpen className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No Document Selected</p>
              <p className="text-[11px] text-slate-400">
                Select a document from the register to preview and inspect metadata.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        projectId={projectId}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        onRevisionConflictDetected={handleRevisionConflictDetected}
      />

      {/* Hand Sketch Upload Modal */}
      <UploadDocumentModal
        projectId={projectId}
        isOpen={isHandSketchModalOpen}
        onClose={() => setIsHandSketchModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        onRevisionConflictDetected={handleRevisionConflictDetected}
        initialDocumentType="Hand Sketch"
        isHandSketchMode={true}
      />

      {/* Revision Conflict Warning Modal */}
      <RevisionWarningModal
        conflictData={conflictData}
        isOpen={conflictData !== null}
        onMakeCurrent={handleMakeRevisionCurrent}
        onKeepAsDraft={handleKeepRevisionAsDraft}
        onCancel={() => setConflictData(null)}
      />

      {/* Full Screen Viewer Modal */}
      <FullScreenViewerModal
        document={selectedDoc}
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
      />

      {/* Archive / Delete Confirmation Modal */}
      <ConfirmDeleteModal
        document={deleteTargetDoc}
        isOpen={deleteTargetDoc !== null}
        isPermanent={isPermanentDelete}
        onConfirm={handleConfirmDeleteModal}
        onClose={() => setDeleteTargetDoc(null)}
      />
    </div>
  );
};
