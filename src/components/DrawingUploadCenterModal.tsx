import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Box, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Info,
  PenTool,
  Trash2,
  FolderOpen,
  Eye,
  RefreshCw,
  Clock,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { 
  DocumentTypeOption, 
  DocumentDisciplineOption, 
  ProjectDocument,
  ProjectRecord
} from '../types';
import { extractFileTechnicalMetadata, generateDocumentId, DocumentStorageService } from '../services/documentStorage';
import { DrawingToBoqAutoPipelineModal } from './DrawingToBoqAutoPipelineModal';

export interface QueuedUploadFile {
  id: string;
  file: File;
  name: string;
  type: string;
  extension: string;
  size: number;
  formattedSize: string;
  format: 'PDF' | 'DWG' | 'DXF' | 'IFC' | 'Image' | 'Sketch' | 'Other';
  status: 'SELECTED' | 'UPLOADING' | 'UPLOADED' | 'FAILED';
  selectedTime: string;
  errorMessage?: string;
  discipline: DocumentDisciplineOption;
  revision: string;
  level: string;
  pageCount?: number;
  previewUrl?: string;
  requiresParser?: boolean;
  isDuplicate?: boolean;
  duplicateMessage?: string;
  fileHash?: string;
}

export interface DrawingUploadCenterModalProps {
  projectId?: string;
  projectName?: string;
  activeProject?: ProjectRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (createdDocs: ProjectDocument[]) => void;
  initialMode?: 'standard' | 'hand-sketch';
  initialDocumentType?: DocumentTypeOption;
  isHandSketchMode?: boolean;
}

export const DrawingUploadCenterModal: React.FC<DrawingUploadCenterModalProps> = ({
  projectId: propProjectId,
  projectName: propProjectName,
  activeProject,
  isOpen,
  onClose,
  onUploadSuccess,
  initialMode = 'standard',
  initialDocumentType,
  isHandSketchMode: propIsHandSketchMode = false,
}) => {
  const [isHandSketchMode, setIsHandSketchMode] = useState<boolean>(
    propIsHandSketchMode || initialMode === 'hand-sketch' || initialDocumentType === 'Hand Sketch'
  );
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [queue, setQueue] = useState<QueuedUploadFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [recentlyUploadedDocs, setRecentlyUploadedDocs] = useState<ProjectDocument[]>([]);
  const [uploadCompleted, setUploadCompleted] = useState<boolean>(false);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState<boolean>(false);
  const [showBoqPipelineModal, setShowBoqPipelineModal] = useState<boolean>(false);
  const [autoGenerateBoq, setAutoGenerateBoq] = useState<boolean>(true);

  // Default common metadata
  const [commonDiscipline, setCommonDiscipline] = useState<DocumentDisciplineOption>('Structural');
  const [commonRevision, setCommonRevision] = useState<string>('Rev 01');
  const [commonLevel, setCommonLevel] = useState<string>('Typical Floor');
  const [commonDocType, setCommonDocType] = useState<DocumentTypeOption>(
    initialDocumentType || (propIsHandSketchMode || initialMode === 'hand-sketch' ? 'Hand Sketch' : 'Tender Drawing')
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync mode props when modal opens
  useEffect(() => {
    if (isOpen) {
      const isSketch = propIsHandSketchMode || initialMode === 'hand-sketch' || initialDocumentType === 'Hand Sketch';
      setIsHandSketchMode(isSketch);
      if (isSketch) {
        setCommonDocType('Hand Sketch');
      } else if (initialDocumentType) {
        setCommonDocType(initialDocumentType);
      }
      setValidationError(null);
      setUploadError(null);
      setUploadCompleted(false);
      setRecentlyUploadedDocs([]);
      setShowUnsavedPrompt(false);
    }
  }, [isOpen, propIsHandSketchMode, initialMode, initialDocumentType]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      queue.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [queue]);

  if (!isOpen) return null;

  const effectiveProjectId = propProjectId || activeProject?.id || activeProject?.project?.id || '';
  const effectiveProjectName = propProjectName || activeProject?.project?.name || activeProject?.name || effectiveProjectId || '';
  const hasProject = Boolean(effectiveProjectId && effectiveProjectId.trim().length > 0);

  const disciplines: DocumentDisciplineOption[] = [
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

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const allowedStandardExtensions = ['pdf', 'dwg', 'dxf', 'ifc', 'png', 'jpg', 'jpeg', 'webp'];
  const allowedSketchExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
  const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024; // 150MB

  const handleFilesSelected = async (files: FileList | File[]) => {
    setUploadError(null);
    setValidationError(null);
    setUploadCompleted(false);

    const allowedExtensions = isHandSketchMode ? allowedSketchExtensions : allowedStandardExtensions;
    const newItems: QueuedUploadFile[] = [];
    const rejectedFiles: string[] = [];

    // Fetch existing documents for duplicate checking
    let existingProjectDocs: ProjectDocument[] = [];
    if (effectiveProjectId) {
      try {
        existingProjectDocs = await DocumentStorageService.getDocumentsByProject(effectiveProjectId, true);
      } catch (err) {
        console.warn('Could not fetch existing docs for duplicate check:', err);
      }
    }

    const fileListArray = Array.from(files);

    for (const file of fileListArray) {
      console.log('[Drawing Upload Center] Selected file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });

      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (!allowedExtensions.includes(ext)) {
        rejectedFiles.push(`${file.name} (unsupported .${ext || 'unknown'})`);
        continue;
      }

      if (file.size === 0) {
        rejectedFiles.push(`${file.name} (file is 0 bytes - empty file)`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejectedFiles.push(`${file.name} (exceeds allowable limit of 150MB)`);
        continue;
      }

      let format: QueuedUploadFile['format'] = 'Other';
      let requiresParser = false;
      let previewUrl: string | undefined = undefined;

      if (ext === 'pdf') {
        format = 'PDF';
        try {
          previewUrl = URL.createObjectURL(file);
        } catch (e) {
          console.warn('PDF blob url creation:', e);
        }
      } else if (['dwg', 'dxf'].includes(ext)) {
        format = ext === 'dwg' ? 'DWG' : 'DXF';
        requiresParser = true;
      } else if (ext === 'ifc') {
        format = 'IFC';
        requiresParser = true;
      } else if (['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff'].includes(ext)) {
        format = isHandSketchMode ? 'Sketch' : 'Image';
        try {
          previewUrl = URL.createObjectURL(file);
        } catch (e) {
          console.warn('Image blob url creation:', e);
        }
      }

      // Check for possible duplicate in the existing project documents
      const duplicateDoc = existingProjectDocs.find(
        (doc) => doc.sourceFileName === file.name || (doc.sourceFileName.toLowerCase() === file.name.toLowerCase() && doc.fileSize === file.size)
      );

      const isDuplicate = Boolean(duplicateDoc);
      const duplicateMessage = isDuplicate
        ? `Possible duplicate drawing detected: "${file.name}" matches an existing drawing in this project.`
        : undefined;

      newItems.push({
        id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        type: file.type || ext.toUpperCase(),
        extension: ext,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        format,
        status: 'SELECTED',
        selectedTime: new Date().toLocaleTimeString(),
        discipline: commonDiscipline,
        revision: commonRevision,
        level: commonLevel,
        previewUrl,
        requiresParser,
        isDuplicate,
        duplicateMessage,
      });
    }

    if (rejectedFiles.length > 0) {
      setValidationError(
        `File Validation Notice: ${rejectedFiles.join('; ')}.`
      );
    }

    if (newItems.length > 0) {
      setQueue((prev) => [...prev, ...newItems]);
    }

    // Reset native input value so selecting the SAME filename again triggers onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue((prev) => {
      const itemToRemove = prev.find((item) => item.id === id);
      if (itemToRemove?.previewUrl && itemToRemove.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(itemToRemove.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });

    // Reset input value to allow re-selecting the exact same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeepDuplicate = (id: string) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isDuplicate: false, duplicateMessage: undefined } : item))
    );
  };

  const handleClearQueue = () => {
    queue.forEach((item) => {
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setQueue([]);
    setUploadError(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttemptClose = () => {
    if (isUploading) return;
    const hasUnsaved = queue.some((item) => item.status === 'SELECTED');
    if (hasUnsaved) {
      setShowUnsavedPrompt(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    handleClearQueue();
    setShowUnsavedPrompt(false);
    onClose();
  };

  const handleExecuteUpload = async () => {
    if (!hasProject) {
      setUploadError('Please create or select a project first.');
      return;
    }

    if (queue.length === 0) {
      setUploadError('Please select or drop at least one file into the queue before uploading.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setValidationError(null);

    const createdDocuments: ProjectDocument[] = [];
    let hasAnyFailure = false;
    let firstFailureError = '';

    try {
      console.log(`[Drawing Upload Center] Starting real upload for project: ${effectiveProjectId}, total files: ${queue.length}`);
      const existingDocs = await DocumentStorageService.getDocumentsByProject(effectiveProjectId, true);

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];

        // Update item status in UI
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'UPLOADING' } : q))
        );

        try {
          // Extract technical metadata from the actual uploaded binary
          const technicalMeta = await extractFileTechnicalMetadata(item.file);

          const baseName = item.file.name.replace(/\.[^/.]+$/, '');
          const dwgMatch = baseName.match(/^([A-Z]{1,4}-\d{1,4})/i);
          const tentativeDwgNo = dwgMatch ? dwgMatch[1].toUpperCase() : '';

          const newDocId = generateDocumentId([...existingDocs, ...createdDocuments]);
          const seriesId = tentativeDwgNo || `SERIES-${newDocId}`;

          const newDoc: ProjectDocument = {
            id: newDocId,
            projectId: effectiveProjectId,
            drawingSeriesId: seriesId,
            drawingNumber: tentativeDwgNo || '', // Real number or empty
            title: baseName,
            description: isHandSketchMode ? 'Hand sketch uploaded for site coordination' : undefined,
            documentType: isHandSketchMode ? 'Hand Sketch' : commonDocType,
            discipline: item.discipline,
            revision: item.revision,
            isCurrentRevision: true,
            drawingDate: new Date().toISOString().split('T')[0],
            level: item.level,
            status: item.requiresParser ? 'PARSER_REQUIRED' : 'READY',
            analysisStatus: 'NOT_ANALYZED',
            preparedBy: undefined,
            source: isHandSketchMode ? 'Site Sketch' : 'Consultant Issue',
            notes: item.requiresParser
              ? 'File uploaded successfully, but this file type requires a compatible parser before quantity extraction.'
              : undefined,
            sourceFileName: item.file.name,
            fileExtension: technicalMeta.fileExtension,
            fileFormat: technicalMeta.fileFormat,
            fileSize: technicalMeta.fileSize,
            uploadDate: technicalMeta.uploadDate,
            pageCount: technicalMeta.pageCount || 1,
            imageDimensions: technicalMeta.imageDimensions,
            cadFormat: technicalMeta.cadFormat,
            ifcMetadata: technicalMeta.ifcMetadata,
            previewDataUrl: technicalMeta.previewDataUrl || item.previewUrl,
            previewType: technicalMeta.previewType,
            isVector: technicalMeta.isVector,
            detectedElementsCount: 0,
            openItemsCount: 0,
            isArchived: false,
          };

          // Save both metadata and binary blob to IndexedDB
          const savedDoc = await DocumentStorageService.saveDocument(newDoc, item.file);
          createdDocuments.push(savedDoc);

          console.log(`[Drawing Upload Center] Upload success for doc:`, {
            id: savedDoc.id,
            fileName: savedDoc.sourceFileName,
            fileSize: savedDoc.fileSize,
            projectId: savedDoc.projectId,
          });

          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { 
                    ...q, 
                    status: 'UPLOADED', 
                    pageCount: technicalMeta.pageCount || 1, 
                    previewUrl: technicalMeta.previewDataUrl || item.previewUrl 
                  }
                : q
            )
          );
        } catch (itemErr: any) {
          console.error(`[Drawing Upload Center] Failed to upload ${item.name}:`, itemErr);
          hasAnyFailure = true;
          firstFailureError = itemErr?.message || 'Binary save failed';
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? { ...q, status: 'FAILED', errorMessage: itemErr?.message || 'Upload failed' }
                : q
            )
          );
        }
      }

      if (createdDocuments.length > 0) {
        setRecentlyUploadedDocs(createdDocuments);
        setUploadCompleted(true);
        onUploadSuccess(createdDocuments);
      }

      if (hasAnyFailure) {
        setUploadError(`One or more files failed to upload: ${firstFailureError}`);
      }
    } catch (err: any) {
      console.error('[Drawing Upload Center] Batch upload error:', err);
      setUploadError(err?.message || 'An unexpected error occurred during drawing upload.');
    } finally {
      setIsUploading(false);
      // Reset input value so subsequent uploads work seamlessly
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleOpenNativePicker = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[Drawing Upload Center] Browse Files clicked, triggering native picker...');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div 
      id="drawing-upload-center-modal"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/90 text-white flex items-center justify-center shadow-inner">
              {isHandSketchMode ? <PenTool className="w-5 h-5 text-amber-300" /> : <Upload className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight uppercase">
                  {isHandSketchMode ? 'Hand Sketch Upload Center' : 'Drawing Upload Center'}
                </h2>
                <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/30">
                  REAL BROWSER INTAKE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {hasProject ? (
                  <span>
                    Current Project: <strong className="text-white">{effectiveProjectName}</strong> (ID: <span className="font-mono text-indigo-200">{effectiveProjectId}</span>)
                  </span>
                ) : (
                  <span className="text-rose-300 font-bold">Please create or select a project first.</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <button
              type="button"
              onClick={() => {
                setIsHandSketchMode(!isHandSketchMode);
                setCommonDocType(!isHandSketchMode ? 'Hand Sketch' : 'Tender Drawing');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border cursor-pointer ${
                isHandSketchMode
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>{isHandSketchMode ? 'Standard Drawings Mode' : 'Hand Sketch Mode'}</span>
            </button>

            <button
              id="upload-modal-close-btn"
              type="button"
              onClick={handleAttemptClose}
              disabled={isUploading}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Project Validation Gate Warning */}
        {!hasProject && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-semibold shrink-0">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Please create or select a project first.</p>
              <p className="text-[11px] text-rose-700">Every drawing must be associated with an active Project ID.</p>
            </div>
          </div>
        )}

        {/* Unsaved Files Discard Prompt Overlay */}
        {showUnsavedPrompt && (
          <div className="p-4 bg-amber-50 border-b border-amber-300 flex items-center justify-between gap-4 text-amber-900 text-xs font-semibold shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">Selected files have not been uploaded. Do you want to discard them?</p>
                <p className="text-[11px] text-amber-800">You have files pending in the upload queue.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUnsavedPrompt(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                [ STAY ]
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                [ DISCARD & LEAVE ]
              </button>
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Top Dropzone */}
          <div
            id="drawing-file-dropzone"
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={hasProject ? handleOpenNativePicker : undefined}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
              !hasProject
                ? 'opacity-50 pointer-events-none bg-slate-50 border-slate-200'
                : dragActive
                ? 'border-indigo-500 bg-indigo-50/70 scale-[0.99] ring-4 ring-indigo-200/50'
                : 'border-indigo-200 hover:border-indigo-500 bg-slate-50/70 hover:bg-indigo-50/30'
            }`}
          >
            {/* Real Native HTML File Input */}
            <input
              ref={fileInputRef}
              id="real-native-drawing-file-input"
              type="file"
              multiple
              accept={
                isHandSketchMode
                  ? '.pdf,.png,.jpg,.jpeg,.webp'
                  : '.pdf,.dwg,.dxf,.ifc,.png,.jpg,.jpeg,.webp'
              }
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesSelected(e.target.files);
                }
              }}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto flex items-center justify-center mb-3 shadow-inner pointer-events-none">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-1 pointer-events-none">
              Drag & Drop drawing files here or click [ BROWSE FILES ]
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-lg mx-auto pointer-events-none">
              {isHandSketchMode
                ? 'Supports PDF, PNG, JPG, JPEG, WEBP for site sketches'
                : 'Supports PDF (Priority 1), DWG, DXF, IFC, PNG, JPG, JPEG, WEBP. Multi-file selection supported.'}
            </p>

            <button
              id="browse-drawing-files-btn"
              type="button"
              disabled={!hasProject}
              onClick={handleOpenNativePicker}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-black tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" />
              <span>[ BROWSE FILES ]</span>
            </button>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center gap-2.5 text-amber-900 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="flex-1">{validationError}</div>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-amber-700 hover:text-amber-900 font-bold text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Common Metadata Strip */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Batch Metadata Defaults</span>
              </span>
              <span className="text-[11px] text-slate-500">Applied automatically to uploaded drawings</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Discipline</label>
                <select
                  value={commonDiscipline}
                  onChange={(e) => setCommonDiscipline(e.target.value as DocumentDisciplineOption)}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {disciplines.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Revision</label>
                <input
                  type="text"
                  value={commonRevision}
                  onChange={(e) => setCommonRevision(e.target.value)}
                  placeholder="e.g. Rev 01"
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Floor / Level</label>
                <input
                  type="text"
                  value={commonLevel}
                  onChange={(e) => setCommonLevel(e.target.value)}
                  placeholder="e.g. Typical Floor"
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Auto-generate BOQ Toggle */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">
                    Auto-Generate Real BOQ with Proof of Calculation
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Extracts layout dimensions, opening deductions, and UAE rate analysis in AED automatically.
                  </span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                <input
                  type="checkbox"
                  checked={autoGenerateBoq}
                  onChange={(e) => setAutoGenerateBoq(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 cursor-pointer"
                />
                <span className="text-[11px] font-bold text-indigo-900">Auto-Extract BOQ</span>
              </label>
            </div>
          </div>

          {/* Upload Queue Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Selected Files Queue ({queue.length})
                </h4>
                {queue.some((q) => q.requiresParser) && (
                  <span className="text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded">
                    CAD/IFC Parser Notice
                  </span>
                )}
              </div>

              {queue.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearQueue}
                  disabled={isUploading}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer disabled:opacity-50"
                >
                  Clear Queue
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-400 text-xs">
                No files selected yet. Drag drawings above or click <strong className="text-slate-700">[ BROWSE FILES ]</strong>.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">File Name</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Selected Time</th>
                      <th className="py-2.5 px-3">Preview</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {queue.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              {item.format === 'PDF' ? (
                                <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                              ) : item.format === 'Image' || item.format === 'Sketch' ? (
                                <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Box className="w-4 h-4 text-indigo-500 shrink-0" />
                              )}
                              <span className="truncate max-w-xs font-semibold">{item.name}</span>
                            </div>
                            {item.requiresParser && (
                              <p className="text-[10px] text-purple-700 mt-0.5">
                                Status on upload: UPLOADED — PARSER REQUIRED
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[11px] text-slate-700">
                            {item.format}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                            {item.formattedSize}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                            {item.selectedTime || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.previewUrl && (item.format === 'Image' || item.format === 'Sketch') ? (
                              <div className="w-10 h-10 rounded border border-slate-200 overflow-hidden bg-slate-100">
                                <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            ) : item.format === 'PDF' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                PDF Doc
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">
                                CAD Layout
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.status === 'SELECTED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                                SELECTED
                              </span>
                            )}
                            {item.status === 'UPLOADING' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-1 w-fit">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Uploading...</span>
                              </span>
                            )}
                            {item.status === 'UPLOADED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>UPLOADED</span>
                              </span>
                            )}
                            {item.status === 'FAILED' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                FAILED
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromQueue(item.id)}
                              disabled={isUploading}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-semibold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                              title="Remove file from queue"
                            >
                              [ REMOVE ]
                            </button>
                          </td>
                        </tr>
                        {item.isDuplicate && (
                          <tr className="bg-amber-50/80 border-b border-amber-200">
                            <td colSpan={7} className="px-3 py-2">
                              <div className="flex items-center justify-between gap-2 text-xs text-amber-900">
                                <div className="flex items-center gap-1.5 font-medium">
                                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                  <span>{item.duplicateMessage || `Possible duplicate drawing detected: "${item.name}" matches an existing drawing in this project.`}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleKeepDuplicate(item.id)}
                                    className="px-2.5 py-1 rounded bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-[11px] transition-colors cursor-pointer"
                                  >
                                    [ KEEP BOTH ]
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromQueue(item.id)}
                                    className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] transition-colors cursor-pointer"
                                  >
                                    [ REMOVE ]
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upload Error Banner */}
          {uploadError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>UPLOAD FAILED:</strong> {uploadError}
                </span>
              </div>
              <button
                type="button"
                onClick={handleExecuteUpload}
                className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                [ RETRY ]
              </button>
            </div>
          )}

          {/* Upload Successful Detailed Results */}
          {uploadCompleted && recentlyUploadedDocs.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between text-emerald-900 font-bold text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-sm font-black uppercase tracking-tight">UPLOAD SUCCESSFUL</span>
                </div>
                <span className="text-[11px] font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">
                  {recentlyUploadedDocs.length} Drawing(s) Registered
                </span>
              </div>

              <div className="border border-emerald-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-emerald-100/60 text-emerald-900 font-bold text-[10px] uppercase border-b border-emerald-200">
                    <tr>
                      <th className="py-2 px-3">Drawing ID</th>
                      <th className="py-2 px-3">Filename</th>
                      <th className="py-2 px-3">Project ID</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Upload Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 font-mono text-[11px]">
                    {recentlyUploadedDocs.map((doc) => (
                      <tr key={doc.id} className="hover:bg-emerald-50/50">
                        <td className="py-2 px-3 font-bold text-indigo-700">{doc.id}</td>
                        <td className="py-2 px-3 font-sans text-slate-800 font-semibold">{doc.sourceFileName}</td>
                        <td className="py-2 px-3 text-slate-600">{doc.projectId}</td>
                        <td className="py-2 px-3 text-slate-700">{doc.fileFormat} ({doc.documentType})</td>
                        <td className="py-2 px-3 text-slate-600">{doc.fileSize ? formatFileSize(doc.fileSize) : '-'}</td>
                        <td className="py-2 px-3 text-slate-500">{new Date(doc.uploadDate || Date.now()).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Banner to Auto-Generate Real BOQ */}
              <div className="p-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white rounded-xl flex items-center justify-between border border-indigo-700/50 shadow-lg animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-tight text-amber-300">
                      Auto-Extract Real BOQ from Uploaded Drawing(s)
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Run autonomous quantity takeoff with step-by-step mathematical proof of calculation & Dubai Municipality 2021 standards (AED).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBoqPipelineModal(true)}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Generate Real BOQ Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {queue.length} file(s) selected • IndexedDB Persistent Binary Storage
          </div>

          <div className="flex items-center gap-3">
            <button
              id="upload-modal-cancel-btn"
              type="button"
              onClick={handleAttemptClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              [ CANCEL ]
            </button>

            <button
              id="upload-files-action-btn"
              type="button"
              onClick={handleExecuteUpload}
              disabled={!hasProject || queue.length === 0 || isUploading}
              className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-black tracking-wide shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading Files...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>[ UPLOAD FILES ]</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Real Drawing to BOQ Pipeline Modal */}
      {showBoqPipelineModal && (
        <DrawingToBoqAutoPipelineModal
          isOpen={showBoqPipelineModal}
          onClose={() => setShowBoqPipelineModal(false)}
          project={activeProject || null}
          documents={recentlyUploadedDocs.length > 0 ? recentlyUploadedDocs : undefined}
          onApplySuccess={() => {
            setShowBoqPipelineModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
