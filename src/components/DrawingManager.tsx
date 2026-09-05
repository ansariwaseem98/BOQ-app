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
  FolderKanban,
  Loader2,
  LayoutGrid,
  List,
  Ruler,
  GitCompare,
  Link,
  MessageSquare,
  FileCode,
  CheckCircle,
  HelpCircle,
  FileCheck,
  Calculator
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
import { extractFileTechnicalMetadata, generateDocumentId, DocumentStorageService } from '../services/documentStorage';
import { UploadDocumentModal } from './UploadDocumentModal';
import { DrawingUploadCenterModal } from './DrawingUploadCenterModal';
import { DrawingDetailsModal } from './DrawingDetailsModal';
import { RevisionWarningModal, RevisionConflictData } from './RevisionWarningModal';
import { FullScreenViewerModal } from './FullScreenViewerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { Phase18DrawingAnalysisModal } from './Phase18DrawingAnalysisModal';
import { DrawingScaleCalibrationModal } from './DrawingScaleCalibrationModal';
import { DrawingComparisonModal } from './DrawingComparisonModal';
import { DrawingToBoqAutoPipelineModal } from './DrawingToBoqAutoPipelineModal';

interface DrawingManagerProps {
  activeProject: ProjectRecord | null;
  onNavigateToDashboard?: () => void;
  onNavigateToAllProjects?: () => void;
  onOpenAnalysisWorkspace?: (docId?: string) => void;
  // Legacy / integration props for backward compatibility
  drawings?: DrawingRecord[];
  activeDrawingId?: string | null;
  onSelectDrawing?: (id: string) => void;
  onSelectDrawingForViewer?: (drawing: DrawingRecord) => void;
  onAddDrawing?: (drawing: DrawingRecord) => void;
  onDeleteDrawing?: (id: string) => void;
  onOpenAiScan?: () => void;
  onOpenPhase17DrawingIntake?: () => void;
}

type SortField = 'drawingNumber' | 'title' | 'revision' | 'drawingDate' | 'uploadDate' | 'discipline' | 'status' | 'fileSize';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'table' | 'cards';

export const DrawingManager: React.FC<DrawingManagerProps> = ({
  activeProject,
  onNavigateToDashboard,
  onNavigateToAllProjects,
  onOpenAnalysisWorkspace,
  onSelectDrawing,
}) => {
  const projectId = activeProject?.id || '';
  const projectName = activeProject?.project?.name || activeProject?.name || 'Current Project';

  // State: Documents belonging strictly to this project
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // View Mode: Table vs Cards
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('All');
  const [selectedDocType, setSelectedDocType] = useState<string>('All');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [selectedFormat, setSelectedFormat] = useState<string>('All');
  const [statusView, setStatusView] = useState<'Active' | 'Archived' | 'All'>('Active');
  const [selectedAnalysisStatus, setSelectedAnalysisStatus] = useState<string>('All');

  // Direct Upload Progress & Drag-and-Drop
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isDirectUploading, setIsDirectUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>('');
  const [directUploadError, setDirectUploadError] = useState<string | null>(null);

  // Hidden File Pickers
  const directFileInputRef = useRef<HTMLInputElement>(null);
  const cadFileInputRef = useRef<HTMLInputElement>(null);
  const ifcFileInputRef = useRef<HTMLInputElement>(null);
  const sketchFileInputRef = useRef<HTMLInputElement>(null);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('drawingNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modals & Inspectors
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isHandSketchModalOpen, setIsHandSketchModalOpen] = useState<boolean>(false);
  const [isRealUploadCenterOpen, setIsRealUploadCenterOpen] = useState<boolean>(false);
  const [isRealHandSketchCenterOpen, setIsRealHandSketchCenterOpen] = useState<boolean>(false);
  const [inspectingDoc, setInspectingDoc] = useState<ProjectDocument | null>(null);
  const [calibratingDoc, setCalibratingDoc] = useState<ProjectDocument | null>(null);
  const [comparingDoc, setComparingDoc] = useState<ProjectDocument | null>(null);
  const [phase18AnalysisDoc, setPhase18AnalysisDoc] = useState<ProjectDocument | null>(null);
  const [processingDocIds, setProcessingDocIds] = useState<Set<string>>(new Set());
  const [isFullScreenOpen, setIsFullScreenOpen] = useState<boolean>(false);
  const [conflictData, setConflictData] = useState<RevisionConflictData | null>(null);
  const [deleteTargetDoc, setDeleteTargetDoc] = useState<ProjectDocument | null>(null);
  const [isPermanentDelete, setIsPermanentDelete] = useState<boolean>(false);
  const [isBoqPipelineModalOpen, setIsBoqPipelineModalOpen] = useState<boolean>(false);
  const [boqPipelineTargetDocs, setBoqPipelineTargetDocs] = useState<ProjectDocument[] | undefined>(undefined);

  // Right Panel: Tab (Preview, Metadata, Revisions, Traceability, Notes)
  const [rightPanelTab, setRightPanelTab] = useState<'preview' | 'metadata' | 'revisions' | 'traceability' | 'notes'>('preview');

  // Right Panel: In-line editable metadata form
  const [editingMetadata, setEditingMetadata] = useState<Partial<ProjectDocument>>({});
  const [isSavingMeta, setIsSavingMeta] = useState<boolean>(false);
  const [metaSaveSuccessToast, setMetaSaveSuccessToast] = useState<boolean>(false);

  // Notes in Right Panel
  const [newNoteText, setNewNoteText] = useState<string>('');

  // Preview interactive controls state
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [previewRotation, setPreviewRotation] = useState<number>(0);
  const [previewCadDark, setPreviewCadDark] = useState<boolean>(true);
  const [previewGrid, setPreviewGrid] = useState<boolean>(true);

  // Disciplines list for left sidebar and filter pills
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
    'Architectural',
    'Structural',
    'RCC',
    'Rebar',
    'Structural Steel',
    'Shop Drawing',
    'IFC / BIM',
    'MEP',
    'Electrical',
    'Mechanical',
    'Plumbing',
    'Fire Fighting',
    'Roofing',
    'Cladding',
    'Landscape',
    'Civil',
    'Survey',
    'Tender Drawing',
    'Construction Drawing',
    'Fabrication Drawing',
    'As-Built Drawing',
    'Consultant Drawing',
    'Specification',
    'Schedule',
    'Hand Sketch',
    'Markup',
    'Other',
  ];

  // Load documents strictly for current active project
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
        const list = await DocumentStorageService.getDocumentsByProject(projectId, true);

        if (isMounted) {
          setDocuments(list);
          // Select first active document if available
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
  }, [projectId]);

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
    }
  }, [selectedDocId, selectedDoc?.id]);

  // Handle direct file upload via real system file picker or drag & drop
  const handleDirectFiles = async (files: FileList | File[] | null, forceDocType?: DocumentTypeOption) => {
    if (!files || !projectId) return;
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;

    setIsDirectUploading(true);
    setUploadProgress(10);
    setUploadStatusText(`Preparing ${fileArr.length} drawing file(s)...`);
    setDirectUploadError(null);

    try {
      const existingDocs = await DocumentStorageService.getDocumentsByProject(projectId, true);
      const createdDocs: ProjectDocument[] = [];

      for (let i = 0; i < fileArr.length; i++) {
        const file = fileArr[i];
        const progressPct = Math.round(15 + ((i + 1) / fileArr.length) * 80);
        setUploadProgress(progressPct);
        setUploadStatusText(`Uploading ${file.name} (${i + 1}/${fileArr.length})...`);

        const technicalMeta = await extractFileTechnicalMetadata(file);
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const dwgMatch = baseName.match(/^([A-Z]{1,4}-\d{1,4})/i);
        const tentativeDwgNo = dwgMatch ? dwgMatch[1].toUpperCase() : '';

        const newDocId = generateDocumentId([...existingDocs, ...createdDocs]);
        const seriesId = tentativeDwgNo || `SERIES-${newDocId}`;

        // Determine discipline & type from filename or format
        let disc: DocumentDisciplineOption = 'Structural';
        let docType: DocumentTypeOption = forceDocType || 'Construction Drawing';

        if (forceDocType === 'Hand Sketch' || ['png', 'jpg', 'jpeg'].includes(ext)) {
          if (forceDocType === 'Hand Sketch') docType = 'Hand Sketch';
        }
        if (ext === 'ifc') {
          docType = 'IFC / BIM';
          disc = 'Structural';
        } else if (file.name.toLowerCase().startsWith('a-') || file.name.toLowerCase().includes('arch')) {
          disc = 'Architectural';
          docType = 'Architectural';
        } else if (file.name.toLowerCase().startsWith('s-') || file.name.toLowerCase().includes('struct')) {
          disc = 'Structural';
          docType = 'Structural';
        } else if (file.name.toLowerCase().startsWith('m-') || file.name.toLowerCase().includes('mep')) {
          disc = 'MEP';
          docType = 'MEP';
        } else if (file.name.toLowerCase().startsWith('e-') || file.name.toLowerCase().includes('elec')) {
          disc = 'Electrical';
          docType = 'Electrical';
        } else if (file.name.toLowerCase().startsWith('p-') || file.name.toLowerCase().includes('plumb')) {
          disc = 'Plumbing';
          docType = 'Plumbing';
        }

        const newDoc: ProjectDocument = {
          id: newDocId,
          projectId,
          drawingSeriesId: seriesId,
          drawingNumber: tentativeDwgNo || '',
          title: baseName,
          documentType: docType,
          discipline: disc,
          revision: 'Rev 01',
          isCurrentRevision: true,
          drawingDate: new Date().toISOString().split('T')[0],
          level: 'Typical Floor',
          status: technicalMeta.fileFormat === 'DWG' || technicalMeta.fileFormat === 'IFC' ? 'PARSER_REQUIRED' : 'UPLOADED',
          analysisStatus: 'NOT_ANALYZED',
          sourceFileName: file.name,
          fileExtension: technicalMeta.fileExtension,
          fileFormat: technicalMeta.fileFormat,
          fileSize: technicalMeta.fileSize,
          uploadDate: technicalMeta.uploadDate,
          pageCount: technicalMeta.pageCount || 1,
          imageDimensions: technicalMeta.imageDimensions,
          cadFormat: technicalMeta.cadFormat,
          ifcMetadata: technicalMeta.ifcMetadata,
          previewDataUrl: technicalMeta.previewDataUrl,
          previewType: technicalMeta.previewType,
          isVector: technicalMeta.isVector,
          detectedElementsCount: 0,
          openItemsCount: 0,
          isArchived: false,
          version: 1,
          uploadedBy: 'Estimator',
          scaleRatio: '1:100',
        };

        const saved = await DocumentStorageService.saveDocument(newDoc, file);
        createdDocs.push(saved);
      }

      setUploadProgress(100);
      setUploadStatusText(`Upload complete! Successfully added ${createdDocs.length} drawing(s).`);

      setTimeout(() => {
        setIsDirectUploading(false);
        setUploadProgress(0);
        setUploadStatusText('');
      }, 1000);

      // Refresh documents
      const freshList = await DocumentStorageService.getDocumentsByProject(projectId, true);
      setDocuments(freshList);
      if (createdDocs.length > 0) {
        setSelectedDocId(createdDocs[0].id);
        if (onSelectDrawing) onSelectDrawing(createdDocs[0].id);
      }
    } catch (err: any) {
      console.error('Direct drawing upload error:', err);
      setDirectUploadError(err?.message || 'Failed to upload drawing files.');
      setIsDirectUploading(false);
      setUploadProgress(0);
    } finally {
      // Clear native picker value
      if (directFileInputRef.current) directFileInputRef.current.value = '';
      if (cadFileInputRef.current) cadFileInputRef.current.value = '';
      if (ifcFileInputRef.current) ifcFileInputRef.current.value = '';
      if (sketchFileInputRef.current) sketchFileInputRef.current.value = '';
    }
  };

  // Drag and drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleDirectFiles(e.dataTransfer.files);
    }
  };

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
        let valA: any = '';
        let valB: any = '';

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
        } else if (sortField === 'fileSize') {
          valA = a.fileSize || 0;
          valB = b.fileSize || 0;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
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

  // Discipline & Category Counters for Badge Pills
  const counts = useMemo(() => {
    const activeDocs = documents.filter((d) => !d.isArchived);
    return {
      total: activeDocs.length,
      architectural: activeDocs.filter((d) => d.discipline === 'Architectural' || d.documentType === 'Architectural').length,
      structural: activeDocs.filter((d) => d.discipline === 'Structural' || d.documentType === 'Structural').length,
      rcc: activeDocs.filter((d) => d.documentType === 'RCC' || d.title.toLowerCase().includes('rcc') || d.title.toLowerCase().includes('concrete')).length,
      rebar: activeDocs.filter((d) => d.documentType === 'Rebar' || d.title.toLowerCase().includes('rebar') || d.title.toLowerCase().includes('bbs')).length,
      steel: activeDocs.filter((d) => d.discipline === 'Steel' || d.documentType === 'Structural Steel' || d.title.toLowerCase().includes('steel')).length,
      mep: activeDocs.filter((d) => ['MEP', 'HVAC', 'Electrical', 'Plumbing', 'Fire Fighting'].includes(d.discipline) || d.documentType === 'MEP').length,
      shop: activeDocs.filter((d) => d.documentType === 'Shop Drawing').length,
      ifc: activeDocs.filter((d) => d.fileFormat === 'IFC' || d.documentType === 'IFC' || d.documentType === 'IFC / BIM').length,
      sketch: activeDocs.filter((d) => d.documentType === 'Hand Sketch' || d.fileFormat === 'Sketch').length,
      other: activeDocs.filter((d) => d.documentType === 'Other' || d.discipline === 'Other').length,
    };
  }, [documents]);

  const uniqueLevels = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.level && d.level.trim()) set.add(d.level.trim());
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

  // Sort Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectDoc = (doc: ProjectDocument) => {
    setSelectedDocId(doc.id);
    if (onSelectDrawing) onSelectDrawing(doc.id);
  };

  const handleOpenDrawingDetails = (doc: ProjectDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setInspectingDoc(doc);
  };

  const handleOpenFullScreen = (doc: ProjectDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedDocId(doc.id);
    setIsFullScreenOpen(true);
  };

  // Toggle Archive Status
  const handleToggleArchive = async (doc: ProjectDocument) => {
    try {
      const newArchivedState = !doc.isArchived;
      await DocumentStorageService.archiveDocument(doc.id, newArchivedState);
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, isArchived: newArchivedState, status: newArchivedState ? 'ARCHIVED' : 'READY' } : d))
      );
    } catch (err) {
      console.error('Failed to update archive status:', err);
    }
  };

  // Permanent Delete modal triggers
  const handleRequestPermanentDelete = (doc: ProjectDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTargetDoc(doc);
    setIsPermanentDelete(true);
  };

  const handleConfirmDeleteModal = async () => {
    if (!deleteTargetDoc) return;
    try {
      await DocumentStorageService.deleteDocumentPermanently(deleteTargetDoc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== deleteTargetDoc.id));
      if (selectedDocId === deleteTargetDoc.id) {
        const remaining = documents.filter((d) => d.id !== deleteTargetDoc.id);
        setSelectedDocId(remaining[0]?.id || null);
      }
      setDeleteTargetDoc(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Save metadata changes
  const handleSaveMetadataChanges = async () => {
    if (!selectedDoc) return;
    setIsSavingMeta(true);
    try {
      const updated = await DocumentStorageService.updateDocumentMetadata(selectedDoc.id, editingMetadata);
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setMetaSaveSuccessToast(true);
      setTimeout(() => setMetaSaveSuccessToast(false), 3000);
    } catch (err) {
      console.error('Failed to save metadata:', err);
    } finally {
      setIsSavingMeta(false);
    }
  };

  // Add a Note to Selected Document
  const handleAddNote = async () => {
    if (!selectedDoc || !newNoteText.trim()) return;
    const newNoteObj = {
      id: `NOTE-${Date.now()}`,
      user: 'Lead Estimator',
      timestamp: new Date().toISOString(),
      note: newNoteText.trim(),
    };
    const updatedNotesList = [...(selectedDoc.notesList || []), newNoteObj];
    try {
      const updated = await DocumentStorageService.updateDocumentMetadata(selectedDoc.id, {
        notesList: updatedNotesList,
      });
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setNewNoteText('');
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  // Delete a Note from Selected Document
  const handleDeleteNote = async (noteId: string) => {
    if (!selectedDoc) return;
    const updatedNotesList = (selectedDoc.notesList || []).filter((n) => n.id !== noteId);
    try {
      const updated = await DocumentStorageService.updateDocumentMetadata(selectedDoc.id, {
        notesList: updatedNotesList,
      });
      setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Switch Current Active Revision
  const handleSetAsCurrentRevision = async (targetDoc: ProjectDocument) => {
    if (!targetDoc.drawingSeriesId) return;
    try {
      await DocumentStorageService.setCurrentRevision(projectId, targetDoc.drawingSeriesId, targetDoc.id);
      const updatedList = await DocumentStorageService.getDocumentsByProject(projectId, true);
      setDocuments(updatedList);
    } catch (err) {
      console.error('Failed to switch current revision:', err);
    }
  };

  // Run AI / Parser Extraction on Drawing
  const handleRowProcessDrawing = async (doc: ProjectDocument, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setProcessingDocIds((prev) => new Set(prev).add(doc.id));

    try {
      const res = await DocumentStorageService.processDrawingWithAI(doc.id);
      const updatedDoc = await DocumentStorageService.getDocumentById(doc.id);
      if (updatedDoc) {
        setDocuments((prev) => prev.map((d) => (d.id === doc.id ? updatedDoc : d)));
      }
    } catch (err) {
      console.error('Processing error:', err);
    } finally {
      setProcessingDocIds((prev) => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
    }
  };

  // Export Excel register
  const handleExportExcel = () => {
    DocumentStorageService.exportDrawingRegisterExcel(documents, projectName, projectId);
  };

  const handleUploadSuccess = (createdDocs: ProjectDocument[]) => {
    setDocuments((prev) => {
      const map = new Map<string, ProjectDocument>();
      prev.forEach((d) => map.set(d.id, d));
      createdDocs.forEach((d) => map.set(d.id, d));
      return Array.from(map.values());
    });
    if (createdDocs.length > 0) {
      setSelectedDocId(createdDocs[0].id);
      if (onSelectDrawing) onSelectDrawing(createdDocs[0].id);
    }
  };

  const handleRevisionConflictDetected = (data: RevisionConflictData) => {
    setConflictData(data);
  };

  const handleMakeRevisionCurrent = async () => {
    if (!conflictData) return;
    const { file, technicalMeta, drawingNumber, newRevision, seriesId, docForm } = conflictData;
    const newDocId = generateDocumentId(documents);

    const newDoc: ProjectDocument = {
      id: newDocId,
      projectId,
      drawingSeriesId: seriesId || `SERIES-${newDocId}`,
      drawingNumber: drawingNumber || '',
      title: docForm.title || file.name.replace(/\.[^/.]+$/, ''),
      documentType: docForm.documentType || 'Construction Drawing',
      discipline: docForm.discipline || 'Structural',
      revision: newRevision || 'Rev 02',
      isCurrentRevision: true,
      drawingDate: docForm.drawingDate || new Date().toISOString().split('T')[0],
      level: docForm.level || 'Typical Floor',
      status: technicalMeta.fileFormat === 'DWG' || technicalMeta.fileFormat === 'IFC' ? 'PARSER_REQUIRED' : 'UPLOADED',
      analysisStatus: 'NOT_ANALYZED',
      sourceFileName: file.name,
      fileExtension: technicalMeta.fileExtension,
      fileFormat: technicalMeta.fileFormat,
      fileSize: technicalMeta.fileSize,
      uploadDate: technicalMeta.uploadDate,
      pageCount: technicalMeta.pageCount || 1,
      previewDataUrl: technicalMeta.previewDataUrl,
      previewType: technicalMeta.previewType,
      isVector: technicalMeta.isVector,
      detectedElementsCount: 0,
      openItemsCount: 0,
      isArchived: false,
      version: 1,
      uploadedBy: 'Estimator',
    };

    const saved = await DocumentStorageService.saveDocument(newDoc, file);
    await handleUploadSuccess([saved]);
    await handleSetAsCurrentRevision(saved);
    setConflictData(null);
  };

  const handleKeepRevisionAsDraft = async () => {
    if (!conflictData) return;
    const { file, technicalMeta, drawingNumber, newRevision, seriesId, docForm } = conflictData;
    const newDocId = generateDocumentId(documents);

    const draftDoc: ProjectDocument = {
      id: newDocId,
      projectId,
      drawingSeriesId: seriesId || `SERIES-${newDocId}`,
      drawingNumber: drawingNumber || '',
      title: docForm.title || file.name.replace(/\.[^/.]+$/, ''),
      documentType: docForm.documentType || 'Construction Drawing',
      discipline: docForm.discipline || 'Structural',
      revision: newRevision || 'Rev 02',
      isCurrentRevision: false,
      drawingDate: docForm.drawingDate || new Date().toISOString().split('T')[0],
      level: docForm.level || 'Typical Floor',
      status: 'READY',
      analysisStatus: 'NOT_ANALYZED',
      sourceFileName: file.name,
      fileExtension: technicalMeta.fileExtension,
      fileFormat: technicalMeta.fileFormat,
      fileSize: technicalMeta.fileSize,
      uploadDate: technicalMeta.uploadDate,
      pageCount: technicalMeta.pageCount || 1,
      previewDataUrl: technicalMeta.previewDataUrl,
      previewType: technicalMeta.previewType,
      isVector: technicalMeta.isVector,
      detectedElementsCount: 0,
      openItemsCount: 0,
      isArchived: false,
      version: 1,
      uploadedBy: 'Estimator',
    };

    const saved = await DocumentStorageService.saveDocument(draftDoc, file);
    await handleUploadSuccess([saved]);
    setConflictData(null);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDiscipline('All');
    setSelectedDocType('All');
    setSelectedLevel('All');
    setSelectedFormat('All');
    setSelectedAnalysisStatus('All');
    setStatusView('Active');
  };

  const activeFiltersCount = [
    selectedDiscipline !== 'All',
    selectedDocType !== 'All',
    selectedLevel !== 'All',
    selectedFormat !== 'All',
    selectedAnalysisStatus !== 'All',
    searchQuery.trim().length > 0,
  ].filter(Boolean).length;

  const currentSeriesRevisions = useMemo(() => {
    if (!selectedDoc) return [];
    const seriesId = selectedDoc.drawingSeriesId || selectedDoc.drawingNumber;
    if (!seriesId) return [selectedDoc];
    return documents.filter(
      (d) => d.drawingSeriesId === seriesId || (d.drawingNumber && d.drawingNumber === selectedDoc.drawingNumber)
    );
  }, [selectedDoc, documents]);

  return (
    <div 
      className="flex-1 flex flex-col h-full bg-[#F8FAFC] text-slate-800 select-none overflow-hidden font-sans relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden Native File Pickers */}
      <input
        ref={directFileInputRef}
        type="file"
        multiple
        accept=".pdf,.dwg,.dxf,.ifc,.png,.jpg,.jpeg,.zip,.svg,.webp,.tif,.tiff"
        onChange={(e) => handleDirectFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={cadFileInputRef}
        type="file"
        multiple
        accept=".dwg,.dxf"
        onChange={(e) => handleDirectFiles(e.target.files, 'Tender Drawing')}
        className="hidden"
      />
      <input
        ref={ifcFileInputRef}
        type="file"
        multiple
        accept=".ifc"
        onChange={(e) => handleDirectFiles(e.target.files, 'IFC / BIM')}
        className="hidden"
      />
      <input
        ref={sketchFileInputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp,.pdf"
        onChange={(e) => handleDirectFiles(e.target.files, 'Hand Sketch')}
        className="hidden"
      />

      {/* Global Drag Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-indigo-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white border-4 border-dashed border-indigo-400 rounded-xl pointer-events-none">
          <Upload className="w-16 h-16 text-indigo-300 animate-bounce mb-4" />
          <h2 className="text-2xl font-black tracking-wide">Drop Drawings Here to Upload</h2>
          <p className="text-sm text-indigo-200 mt-1">Supports PDF, DWG, DXF, IFC, JPG, PNG, and ZIP</p>
        </div>
      )}

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
            <span>Drawings ({documents.filter((d) => !d.isArchived).length})</span>
          </span>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 mr-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table Register View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Cards & Thumbnails Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Export full drawing register to Excel spreadsheet"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">EXPORT REGISTER</span>
          </button>

          <button
            onClick={() => cadFileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-white border border-sky-300 hover:bg-sky-50 text-sky-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Import AutoCAD DWG or DXF files"
          >
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden md:inline">IMPORT CAD</span>
          </button>

          <button
            onClick={() => ifcFileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-white border border-teal-300 hover:bg-teal-50 text-teal-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Import IFC BIM Model"
          >
            <Box className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden md:inline">IMPORT IFC</span>
          </button>

          <button
            onClick={() => setIsRealHandSketchCenterOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            title="Upload Hand Sketch or Site Photo"
          >
            <PenTool className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">+ UPLOAD HAND SKETCH</span>
          </button>

          {/* Primary Upload Drawing Button (Opens real native file picker) */}
          <button
            onClick={() => directFileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ring-2 ring-indigo-300/40 cursor-pointer"
            title="Open system file browser to select drawing files"
          >
            <Plus className="w-4 h-4 text-indigo-200" />
            <span>+ ADD DRAWING</span>
          </button>

          {/* Upload Drawings Center Modal */}
          <button
            onClick={() => setIsRealUploadCenterOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            title="Open Drawing Upload Center Modal"
          >
            <Upload className="w-3.5 h-3.5 text-slate-300" />
            <span>UPLOAD DRAWINGS</span>
          </button>

          {/* Autonomous Real BOQ Generator Button */}
          <button
            onClick={() => {
              setBoqPipelineTargetDocs(documents.length > 0 ? documents : undefined);
              setIsBoqPipelineModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Upload DWG or PDF Drawing to Auto-Generate Real BOQ with Proof of Calculation"
          >
            <Calculator className="w-3.5 h-3.5 text-slate-950" />
            <span>AUTO-GENERATE REAL BOQ</span>
          </button>
        </div>
      </div>

      {/* Direct Upload Progress Banner */}
      {isDirectUploading && (
        <div className="bg-indigo-900 text-white px-6 py-2.5 flex items-center justify-between text-xs font-semibold shadow-md animate-in fade-in">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-indigo-300 animate-spin" />
            <span>{uploadStatusText}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48 bg-indigo-950 rounded-full h-2 overflow-hidden border border-indigo-700">
              <div
                className="bg-indigo-400 h-full transition-all duration-200 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="font-mono text-indigo-200">{uploadProgress}%</span>
          </div>
        </div>
      )}

      {directUploadError && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2 text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{directUploadError}</span>
          </div>
          <button onClick={() => setDirectUploadError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Category Counter Pills Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0 text-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Categories:</span>
        <button
          onClick={() => setSelectedDiscipline('All')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            selectedDiscipline === 'All'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>All Drawings</span>
          <span className={`text-[10px] px-1.5 rounded-full ${selectedDiscipline === 'All' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.total}
          </span>
        </button>

        <button
          onClick={() => setSelectedDiscipline('Architectural')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            selectedDiscipline === 'Architectural'
              ? 'bg-blue-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Architectural</span>
          <span className={`text-[10px] px-1.5 rounded-full ${selectedDiscipline === 'Architectural' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.architectural}
          </span>
        </button>

        <button
          onClick={() => setSelectedDiscipline('Structural')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            selectedDiscipline === 'Structural'
              ? 'bg-indigo-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Structural</span>
          <span className={`text-[10px] px-1.5 rounded-full ${selectedDiscipline === 'Structural' ? 'bg-indigo-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.structural}
          </span>
        </button>

        <button
          onClick={() => setSelectedDocType('RCC')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            selectedDocType === 'RCC'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>RCC</span>
          <span className={`text-[10px] px-1.5 rounded-full ${selectedDocType === 'RCC' ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.rcc}
          </span>
        </button>

        <button
          onClick={() => setSelectedDocType('Rebar')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            selectedDocType === 'Rebar'
              ? 'bg-amber-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Rebar</span>
          <span className={`text-[10px] px-1.5 rounded-full ${selectedDocType === 'Rebar' ? 'bg-amber-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.rebar}
          </span>
        </button>

        <button
          onClick={() => setSelectedDiscipline('Steel')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            selectedDiscipline === 'Steel'
              ? 'bg-slate-800 text-white font-bold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Steel</span>
          <span className={`text-[10px] px-1.5 rounded-full ${selectedDiscipline === 'Steel' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.steel}
          </span>
        </button>

        <button
          onClick={() => setSelectedDiscipline('MEP')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            selectedDiscipline === 'MEP'
              ? 'bg-purple-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>MEP</span>
          <span className={`text-[10px] px-1.5 rounded-full ${selectedDiscipline === 'MEP' ? 'bg-purple-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.mep}
          </span>
        </button>

        <button
          onClick={() => setSelectedDocType('Shop Drawing')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            selectedDocType === 'Shop Drawing'
              ? 'bg-cyan-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Shop</span>
          <span className={`text-[10px] px-1.5 rounded-full ${selectedDocType === 'Shop Drawing' ? 'bg-cyan-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.shop}
          </span>
        </button>

        <button
          onClick={() => setSelectedFormat('IFC')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            selectedFormat === 'IFC'
              ? 'bg-teal-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>IFC BIM</span>
          <span className={`text-[10px] px-1.5 rounded-full ${selectedFormat === 'IFC' ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.ifc}
          </span>
        </button>

        <button
          onClick={() => setSelectedDocType('Hand Sketch')}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            selectedDocType === 'Hand Sketch'
              ? 'bg-orange-600 text-white font-bold shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <span>Hand Sketch</span>
          <span className={`text-[10px] px-1.5 rounded-full ${selectedDocType === 'Hand Sketch' ? 'bg-orange-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {counts.sketch}
          </span>
        </button>
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
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Active ({documents.filter((d) => !d.isArchived).length})
              </button>
              <button
                onClick={() => setStatusView('Archived')}
                className={`py-1 rounded-md transition-all cursor-pointer ${
                  statusView === 'Archived'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
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
              Discipline Register
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
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
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
                className="w-full bg-slate-50 border border-slate-200 rounded-md p-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
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
          {/* Prominent Real Drawing Intake Banner Dropzone */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-indigo-100 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                  <span>REAL DRAWING INGESTION & PARSER PIPELINE</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                    {projectName}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Upload PDF, DWG, DXF, IFC, JPG, PNG, and ZIP drawings. Files are persistently stored in IndexedDB.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => directFileInputRef.current?.click()}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ring-2 ring-indigo-300/40"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ADD DRAWING</span>
              </button>
            </div>
          </div>

          {/* Top Search & Filter Bar */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by drawing number, DRW-XXXX, title, filename, discipline..."
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

            <div className="text-xs text-slate-500 font-mono flex items-center gap-3">
              <span>
                Showing <strong>{filteredDocuments.length}</strong> of {documents.length} drawings
              </span>
            </div>
          </div>

          {/* REGISTER VIEW: TABLE OR CARDS */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                <p className="text-sm font-semibold text-slate-700">Loading project drawings from storage...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              /* EMPTY STATE: PROMINENT DRAG & DROP ZONE */
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-full max-w-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/30 rounded-2xl p-8 transition-all flex flex-col items-center justify-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                    <FolderOpen className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">
                      NO DRAWINGS UPLOADED
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      {documents.length === 0
                        ? 'No drawing files associated with this project yet. Drag files below or click to select.'
                        : 'No drawings match the current filter criteria.'}
                    </p>
                  </div>

                  {/* Drag & Drop Graphic Box */}
                  <div className="w-full max-w-sm border border-indigo-200 bg-white rounded-xl p-5 shadow-xs flex flex-col items-center justify-center space-y-3">
                    <Upload className="w-8 h-8 text-indigo-500 animate-pulse" />
                    <p className="text-xs font-bold text-slate-700">Drag drawing files here</p>
                    <span className="text-[10px] text-slate-400 font-mono">or</span>
                    <button
                      onClick={() => directFileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>[ + ADD FIRST DRAWING ]</span>
                    </button>
                    <p className="text-[10px] text-slate-400 font-mono pt-1">
                      PDF / DWG / DXF / IFC / JPG / PNG / ZIP
                    </p>
                  </div>

                  {activeFiltersCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-xs font-semibold rounded-lg text-slate-700 cursor-pointer"
                    >
                      Clear Active Filters
                    </button>
                  )}
                </div>
              </div>
            ) : viewMode === 'table' ? (
              /* TABLE VIEW */
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10 border-b border-slate-200 select-none">
                  <tr>
                    <th
                      onClick={() => handleSort('drawingNumber')}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-1">
                        <span>Drawing ID / No.</span>
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
                        <span>File Name / Title</span>
                        {sortField === 'title' && (
                          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />
                        )}
                      </div>
                    </th>

                    <th className="py-2.5 px-2">Type</th>
                    <th
                      onClick={() => handleSort('discipline')}
                      className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors"
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

                    <th className="py-2.5 px-2 text-center">Viewer</th>
                    <th className="py-2.5 px-2 text-center">Process</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredDocuments.map((doc) => {
                    const isSelected = doc.id === selectedDocId;
                    const isProcessing = processingDocIds.has(doc.id);
                    const isProcessed = doc.status === 'PROCESSED' || doc.analysisStatus === 'ANALYZED';

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
                        {/* Drawing ID & Number */}
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-indigo-700">
                              {doc.id}
                            </span>
                            {doc.drawingNumber && (
                              <span className="text-[10px] font-mono text-slate-500">
                                ({doc.drawingNumber})
                              </span>
                            )}
                            {doc.isCurrentRevision && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {doc.level || 'All Floors'}
                          </span>
                        </td>

                        {/* File Name & Title */}
                        <td className="py-2.5 px-3 max-w-xs">
                          <p className="font-semibold text-slate-900 line-clamp-1">
                            {doc.title || doc.sourceFileName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate font-mono">
                            {doc.sourceFileName} {doc.fileSize ? `• ${(doc.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
                          </p>
                        </td>

                        {/* Document Type */}
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {doc.documentType}
                          </span>
                        </td>

                        {/* Discipline */}
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          <span className="text-xs text-slate-700 font-medium">{doc.discipline}</span>
                        </td>

                        {/* Revision */}
                        <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                          {doc.revision}
                        </td>

                        {/* Format */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {doc.fileFormat}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              doc.isArchived
                                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                                : doc.status === 'PROCESSED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : doc.status === 'PROCESSING' || isProcessing
                                ? 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                                : doc.status === 'PARSER_REQUIRED'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : doc.status === 'FAILED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {isProcessing ? 'PROCESSING...' : doc.status}
                          </span>
                        </td>

                        {/* Preview / Open button */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenFullScreen(doc, e)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1 mx-auto transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                            title="Open Drawing in Full Viewer"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                            <span>OPEN</span>
                          </button>
                        </td>

                        {/* Process button */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {isProcessing ? (
                            <button
                              disabled
                              className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-bold flex items-center gap-1 mx-auto cursor-not-allowed"
                            >
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Processing...</span>
                            </button>
                          ) : isProcessed ? (
                            <button
                              onClick={(e) => handleRowProcessDrawing(doc, e)}
                              className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 mx-auto border border-emerald-200 transition-colors cursor-pointer"
                              title="Re-run AI extraction"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>Re-Process</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => handleRowProcessDrawing(doc, e)}
                              className="px-2.5 py-1 rounded bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[10px] font-black flex items-center gap-1 mx-auto shadow-2xs transition-all cursor-pointer"
                              title="Run AI extraction on this drawing"
                            >
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>PROCESS</span>
                            </button>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBoqPipelineTargetDocs([doc]);
                                setIsBoqPipelineModalOpen(true);
                              }}
                              className="p-1 rounded text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Auto-Generate Real BOQ with Proof of Calculation"
                            >
                              <Calculator className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => handleOpenDrawingDetails(doc, e)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              title="Inspect Details"
                            >
                              <Info className="w-3.5 h-3.5" />
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
                              onClick={(e) => handleRequestPermanentDelete(doc, e)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* CARDS / GRID VIEW (Requirement 12) */
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocuments.map((doc) => {
                  const isSelected = doc.id === selectedDocId;
                  const isProcessing = processingDocIds.has(doc.id);

                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`bg-white rounded-xl border transition-all overflow-hidden flex flex-col cursor-pointer shadow-xs hover:shadow-md ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Card Thumbnail / Preview */}
                      <div className="h-40 bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-slate-200">
                        {doc.previewDataUrl ? (
                          <img
                            src={doc.previewDataUrl}
                            alt={doc.title}
                            className="max-h-full max-w-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-slate-500 text-center p-4">
                            {doc.fileFormat === 'PDF' && <FileText className="w-12 h-12 mx-auto text-indigo-400 mb-1" />}
                            {['DWG', 'DXF'].includes(doc.fileFormat) && <Layers className="w-12 h-12 mx-auto text-sky-400 mb-1" />}
                            {doc.fileFormat === 'IFC' && <Box className="w-12 h-12 mx-auto text-teal-400 mb-1" />}
                            {doc.fileFormat === 'Image' && <Eye className="w-12 h-12 mx-auto text-amber-400 mb-1" />}
                            <span className="text-[11px] font-mono block">{doc.sourceFileName}</span>
                          </div>
                        )}

                        {/* Top Badges */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/90 text-indigo-300 border border-slate-700">
                            {doc.id}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900/90 text-white border border-slate-700">
                            {doc.revision}
                          </span>
                        </div>

                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              doc.status === 'PROCESSED'
                                ? 'bg-emerald-500 text-white'
                                : doc.status === 'PARSER_REQUIRED'
                                ? 'bg-purple-600 text-white'
                                : 'bg-indigo-600 text-white'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                              {doc.discipline} • {doc.documentType}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : ''}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 line-clamp-1" title={doc.title}>
                            {doc.title || doc.sourceFileName}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                            {doc.sourceFileName}
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 gap-1.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleOpenFullScreen(doc, e)}
                              className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>OPEN</span>
                            </button>

                            <button
                              onClick={(e) => handleRowProcessDrawing(doc, e)}
                              disabled={isProcessing}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>ANALYZE</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleOpenDrawingDetails(doc, e)}
                              className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                              title="Edit / Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleRequestPermanentDelete(doc, e)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. RIGHT COLUMN: PREVIEW / TRACEABILITY / METADATA PANEL */}
        {/* ========================================================================= */}
        <div className="w-96 bg-white flex flex-col shrink-0 overflow-hidden">
          {selectedDoc ? (
            <>
              {/* Top Tabs */}
              <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs font-semibold overflow-x-auto">
                  <button
                    onClick={() => setRightPanelTab('preview')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      rightPanelTab === 'preview'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => setRightPanelTab('traceability')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      rightPanelTab === 'traceability'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Links
                  </button>
                  <button
                    onClick={() => setRightPanelTab('metadata')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      rightPanelTab === 'metadata'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Metadata
                  </button>
                  <button
                    onClick={() => setRightPanelTab('revisions')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      rightPanelTab === 'revisions'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Revs ({currentSeriesRevisions.length})
                  </button>
                  <button
                    onClick={() => setRightPanelTab('notes')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      rightPanelTab === 'notes'
                        ? 'bg-white text-slate-900 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Notes
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
                        onClick={() => setCalibratingDoc(selectedDoc)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-indigo-950 hover:text-indigo-300 text-slate-300 text-[10px] font-bold border border-slate-700 flex items-center gap-1"
                        title="Calibrate Drawing Scale"
                      >
                        <Ruler className="w-3 h-3 text-indigo-400" />
                        <span>Calibrate</span>
                      </button>

                      <button
                        onClick={() => setComparingDoc(selectedDoc)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-blue-950 hover:text-blue-300 text-slate-300 text-[10px] font-bold border border-slate-700 flex items-center gap-1"
                        title="Compare Revision Versions"
                      >
                        <GitCompare className="w-3 h-3 text-blue-400" />
                        <span>Compare</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Canvas */}
                  <div className="flex-1 overflow-auto flex items-center justify-center p-4 relative bg-[#0B0F19]">
                    {selectedDoc.previewDataUrl ? (
                      <div
                        style={{
                          transform: `scale(${previewZoom / 100}) rotate(${previewRotation}deg)`,
                          transformOrigin: 'center center',
                        }}
                        className="max-w-full max-h-full flex items-center justify-center"
                      >
                        <img
                          src={selectedDoc.previewDataUrl}
                          alt={selectedDoc.title}
                          className="max-h-64 rounded shadow-md object-contain border border-slate-700"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-400 space-y-2">
                        <FileText className="w-10 h-10 mx-auto text-indigo-400 mb-1" />
                        <p className="font-bold text-white text-xs">{selectedDoc.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{selectedDoc.sourceFileName}</p>
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setIsFullScreenOpen(true)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>FULL VIEWER</span>
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenAnalysisWorkspace) {
                          onOpenAnalysisWorkspace(selectedDoc.id);
                        } else {
                          setPhase18AnalysisDoc(selectedDoc);
                        }
                      }}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>[ ANALYZE DRAWING ]</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TRACEABILITY & LINKED DATA (Requirements 21, 22, 23, 24, 25) */}
              {rightPanelTab === 'traceability' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div className="border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Link className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Traceability & Links</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Cross-module linking from {selectedDoc.id} to Elements, BOQ, and Calculations.
                    </p>
                  </div>

                  {/* Linked Elements */}
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-800 text-xs">Linked Elements ({selectedDoc.detectedElementsCount || 0})</strong>
                      <span className="text-[10px] font-mono text-indigo-600 font-bold">Automatic Link</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Reinforced concrete columns, footings, and structural beams detected in this drawing.
                    </p>
                    <button
                      onClick={() => setIsFullScreenOpen(true)}
                      className="w-full py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-bold text-slate-800 transition-colors"
                    >
                      [ VIEW LINKED ELEMENTS ]
                    </button>
                  </div>

                  {/* Linked BOQ Items */}
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-800 text-xs">Linked BOQ Takeoffs</strong>
                      <span className="text-[10px] font-mono text-emerald-600 font-bold">IS1200 / POMI</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Bill of Quantities line items referencing {selectedDoc.drawingNumber || selectedDoc.id} as source provenance.
                    </p>
                    <button
                      onClick={() => setIsFullScreenOpen(true)}
                      className="w-full py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-bold text-slate-800 transition-colors"
                    >
                      [ VIEW LINKED BOQ ]
                    </button>
                  </div>

                  {/* Linked Calculations & Deductions */}
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-800 text-xs">Linked Calculations & Audits</strong>
                      <span className="text-[10px] font-mono text-blue-600 font-bold">100% Traceable</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Concrete volume arithmetic, deduction bounds, and rebar BBS formulas derived from this sheet.
                    </p>
                    <button
                      onClick={() => setIsFullScreenOpen(true)}
                      className="w-full py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-bold text-slate-800 transition-colors"
                    >
                      [ VIEW LINKED CALCULATIONS ]
                    </button>
                  </div>

                  {/* BIM / IFC Integration */}
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-800 text-xs">3D BIM Model Links</strong>
                      <span className="text-[10px] font-mono text-teal-600 font-bold">IFC4 GUID</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Spatial floor association: {selectedDoc.level || 'Typical Floor'}.
                    </p>
                    <button
                      onClick={() => setIsFullScreenOpen(true)}
                      className="w-full py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-bold text-slate-800 transition-colors"
                    >
                      [ VIEW BIM ELEMENTS ]
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: EDITABLE METADATA FORM */}
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
                      <span className="text-slate-400">Drawing ID:</span>
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
                      <span className="text-slate-400">Scale Ratio:</span>
                      <span>{selectedDoc.scaleRatio || '1:100'}</span>
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
                        value={editingMetadata.documentType || 'Construction Drawing'}
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
                      placeholder="e.g. Foundation Level, Typical Floor"
                      className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-xs text-slate-800"
                    />
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

              {/* TAB 4: REVISION HISTORY */}
              {rightPanelTab === 'revisions' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">
                      Revision Series: <span className="font-mono text-indigo-700">{selectedDoc.drawingSeriesId || selectedDoc.drawingNumber || selectedDoc.id}</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      All uploaded revisions remain permanently accessible.
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

              {/* TAB 5: NOTES & ANNOTATIONS */}
              {rightPanelTab === 'notes' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Drawing Notes & Clarifications</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Collaborative engineering notes associated with this drawing.
                    </p>
                  </div>

                  {/* Add Note Input */}
                  <div className="space-y-2">
                    <textarea
                      rows={2}
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Add an engineering note or site observation..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={!newNoteText.trim()}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      + Add Note
                    </button>
                  </div>

                  {/* Notes List */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {selectedDoc.notesList && selectedDoc.notesList.length > 0 ? (
                      selectedDoc.notesList.map((note) => (
                        <div key={note.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-bold text-slate-700">{note.user}</span>
                            <div className="flex items-center gap-2">
                              <span>{note.timestamp ? note.timestamp.split('T')[0] : ''}</span>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed">{note.note}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-4">
                        No notes added to this drawing yet.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-2">
              <FolderOpen className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No Document Selected</p>
              <p className="text-[11px] text-slate-400">
                Select a drawing from the register to preview and inspect metadata.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Real Drawing Upload Center Modal */}
      <DrawingUploadCenterModal
        projectId={projectId}
        projectName={projectName}
        activeProject={activeProject}
        isOpen={isRealUploadCenterOpen}
        onClose={() => setIsRealUploadCenterOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Real Hand Sketch Upload Center Modal */}
      <DrawingUploadCenterModal
        projectId={projectId}
        projectName={projectName}
        activeProject={activeProject}
        isOpen={isRealHandSketchCenterOpen}
        onClose={() => setIsRealHandSketchCenterOpen(false)}
        onUploadSuccess={handleUploadSuccess}
        initialDocumentType="Hand Sketch"
        isHandSketchMode={true}
      />

      {/* Real Drawing Details & Inspector Modal */}
      <DrawingDetailsModal
        document={inspectingDoc}
        project={activeProject || undefined}
        isOpen={inspectingDoc !== null}
        onClose={() => setInspectingDoc(null)}
        onUpdateDocument={(updated) => {
          setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
          setInspectingDoc(updated);
        }}
      />

      {/* Scale Calibration Modal */}
      {calibratingDoc && (
        <DrawingScaleCalibrationModal
          doc={calibratingDoc}
          onClose={() => setCalibratingDoc(null)}
          onCalibrated={(updated) => {
            setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
            setCalibratingDoc(null);
          }}
        />
      )}

      {/* Revision Comparison Modal */}
      {comparingDoc && (
        <DrawingComparisonModal
          currentDoc={comparingDoc}
          allRevisions={documents.filter(
            (d) => d.drawingSeriesId === (comparingDoc.drawingSeriesId || comparingDoc.drawingNumber)
          )}
          onClose={() => setComparingDoc(null)}
        />
      )}

      {/* Phase 18A Real Drawing Analysis Modal */}
      {phase18AnalysisDoc && (
        <Phase18DrawingAnalysisModal
          document={phase18AnalysisDoc}
          project={activeProject || {
            id: phase18AnalysisDoc.projectId || 'PRJ-DEFAULT',
            name: 'Active Project',
            description: '',
            status: 'Active',
            lastModified: new Date().toISOString(),
            takeoffProgress: 0,
            unresolvedClarifications: 0,
            currency: 'AED',
            unitSystem: 'Metric'
          }}
          isOpen={phase18AnalysisDoc !== null}
          onClose={() => setPhase18AnalysisDoc(null)}
          onAnalysisComplete={(updatedRecord) => {
            setDocuments((prev) =>
              prev.map((d) =>
                d.id === updatedRecord.documentId
                  ? {
                      ...d,
                      status: updatedRecord.status === 'ANALYZED' ? 'PROCESSED' : 'PROCESSING',
                      detectedElementsCount: updatedRecord.elements.length,
                      openItemsCount: updatedRecord.openItems.length
                    }
                  : d
              )
            );
          }}
        />
      )}

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

      {/* Autonomous Real BOQ Generator Modal */}
      {isBoqPipelineModalOpen && (
        <DrawingToBoqAutoPipelineModal
          isOpen={isBoqPipelineModalOpen}
          onClose={() => {
            setIsBoqPipelineModalOpen(false);
            setBoqPipelineTargetDocs(undefined);
          }}
          project={activeProject || null}
          documents={boqPipelineTargetDocs || (documents.length > 0 ? documents : undefined)}
          onApplySuccess={() => {
            setIsBoqPipelineModalOpen(false);
            setBoqPipelineTargetDocs(undefined);
          }}
        />
      )}
    </div>
  );
};
