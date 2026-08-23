import React, { useState, useRef } from 'react';
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
  PenTool
} from 'lucide-react';
import { 
  DocumentTypeOption, 
  DocumentDisciplineOption, 
  ProjectDocument 
} from '../types';
import { extractFileTechnicalMetadata, generateDocumentId, DocumentStorageService } from '../services/documentStorage';

interface UploadDocumentModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (createdDocs: ProjectDocument[]) => void;
  onRevisionConflictDetected: (conflictInfo: {
    file: File;
    technicalMeta: any;
    drawingNumber: string;
    newRevision: string;
    existingCurrentDoc?: ProjectDocument;
    seriesId: string;
    docForm: Partial<ProjectDocument>;
  }) => void;
  initialDocumentType?: DocumentTypeOption;
  isHandSketchMode?: boolean;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  projectId,
  isOpen,
  onClose,
  onUploadSuccess,
  onRevisionConflictDetected,
  initialDocumentType,
  isHandSketchMode = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Common metadata inputs (applied to uploaded batch or customized per file)
  const [formDiscipline, setFormDiscipline] = useState<DocumentDisciplineOption>(
    isHandSketchMode ? 'Structural' : 'Structural'
  );
  const [formDocumentType, setFormDocumentType] = useState<DocumentTypeOption>(
    initialDocumentType || (isHandSketchMode ? 'Hand Sketch' : 'Tender Drawing')
  );
  const [formLevel, setFormLevel] = useState<string>('Typical Floor');
  const [formPreparedBy, setFormPreparedBy] = useState<string>('');
  const [formSource, setFormSource] = useState<string>(
    isHandSketchMode ? 'Site Engineering Sketch' : 'Consultant Issue'
  );
  const [formRevision, setFormRevision] = useState<string>('Rev 01');
  const [formNotes, setFormNotes] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

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

  const documentTypes: DocumentTypeOption[] = [
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
      setSelectedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      setErrorMsg('Please select or drop at least one document to upload.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const existingDocs = await DocumentStorageService.getDocumentsByProject(projectId, true);
      const createdDocs: ProjectDocument[] = [];

      for (const file of selectedFiles) {
        const technicalMeta = await extractFileTechnicalMetadata(file);

        // Raw drawing number extraction: we do NOT invent fake numbers.
        // We look if user uploaded a file like "S-203_Rev02.pdf" to suggest series, or leave blank.
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const dwgMatch = baseName.match(/^([A-Z]{1,4}-\d{1,4})/i);
        const tentativeDwgNo = dwgMatch ? dwgMatch[1].toUpperCase() : '';

        // Check revision conflict if tentative drawing number found
        if (tentativeDwgNo) {
          const conflictCheck = await DocumentStorageService.checkRevisionConflict(
            projectId,
            tentativeDwgNo,
            formRevision
          );

          if (conflictCheck.hasConflict) {
            // Trigger revision warning flow
            onRevisionConflictDetected({
              file,
              technicalMeta,
              drawingNumber: tentativeDwgNo,
              newRevision: formRevision,
              existingCurrentDoc: conflictCheck.existingCurrentDoc,
              seriesId: conflictCheck.seriesId,
              docForm: {
                discipline: formDiscipline,
                documentType: formDocumentType,
                level: formLevel,
                preparedBy: formPreparedBy,
                source: formSource,
                notes: formNotes,
              },
            });
            setIsProcessing(false);
            onClose();
            return;
          }
        }

        const newDocId = generateDocumentId([...existingDocs, ...createdDocs]);
        const seriesId = tentativeDwgNo || `SERIES-${newDocId}`;

        const newDoc: ProjectDocument = {
          id: newDocId,
          projectId,
          drawingSeriesId: seriesId,
          drawingNumber: tentativeDwgNo || '', // Empty if not explicit (never auto-invented)
          title: baseName, // Use uploaded filename base as default title
          description: isHandSketchMode ? 'Hand sketch uploaded for project review' : undefined,
          documentType: formDocumentType,
          discipline: formDiscipline,
          revision: formRevision,
          isCurrentRevision: true,
          drawingDate: new Date().toISOString().split('T')[0],
          level: formLevel,
          status: technicalMeta.previewType === 'unsupported' ? 'UPLOADED' : 'READY',
          analysisStatus: 'NOT_ANALYZED',
          preparedBy: formPreparedBy || undefined,
          source: formSource || undefined,
          notes: formNotes || undefined,
          sourceFileName: file.name,
          fileExtension: technicalMeta.fileExtension,
          fileFormat: technicalMeta.fileFormat,
          fileSize: technicalMeta.fileSize,
          uploadDate: technicalMeta.uploadDate,
          pageCount: technicalMeta.pageCount,
          imageDimensions: technicalMeta.imageDimensions,
          cadFormat: technicalMeta.cadFormat,
          ifcMetadata: technicalMeta.ifcMetadata,
          previewDataUrl: technicalMeta.previewDataUrl,
          previewType: technicalMeta.previewType,
          isVector: technicalMeta.isVector,
          detectedElementsCount: 0,
          openItemsCount: 0,
          isArchived: false,
        };

        const saved = await DocumentStorageService.saveDocument(newDoc, file);
        createdDocs.push(saved);
      }

      onUploadSuccess(createdDocs);
      onClose();
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(err?.message || 'An error occurred during file upload.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              {isHandSketchMode ? <PenTool className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isHandSketchMode ? 'Upload Hand Sketch / Site Photo' : 'Upload Drawings & Documents'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Supports CAD (DWG, DXF), BIM (IFC), PDF, and high-res Images. Originals are preserved.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={
                isHandSketchMode
                  ? '.jpg,.jpeg,.png,.webp,.bmp,.tiff,.pdf'
                  : '.pdf,.dwg,.dxf,.ifc,.jpg,.jpeg,.png,.webp,.tiff,.tif,.docx,.xlsx'
              }
              className="hidden"
              onChange={handleFileInputChange}
            />

            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>

            <p className="text-sm font-bold text-slate-800">
              Drag & drop drawing files here, or <span className="text-indigo-600 underline">browse</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              DWG, DXF, IFC, PDF, PNG, JPG, TIFF up to 250MB per file
            </p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-600 font-semibold text-[11px]">
                <span>Selected Files ({selectedFiles.length})</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-rose-600 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200 text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Preset for this Batch */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>Initial Document Metadata (Editable anytime)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Document Type *</label>
                <select
                  value={formDocumentType}
                  onChange={(e) => setFormDocumentType(e.target.value as DocumentTypeOption)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Discipline *</label>
                <select
                  value={formDiscipline}
                  onChange={(e) => setFormDiscipline(e.target.value as DocumentDisciplineOption)}
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                >
                  {disciplines.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Floor Level / Zone</label>
                <input
                  type="text"
                  value={formLevel}
                  onChange={(e) => setFormLevel(e.target.value)}
                  placeholder="e.g. Ground Floor, L02-L08, Roof"
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Revision Code</label>
                <input
                  type="text"
                  value={formRevision}
                  onChange={(e) => setFormRevision(e.target.value)}
                  placeholder="e.g. Rev 01, Rev 00"
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Prepared By / Designer</label>
                <input
                  type="text"
                  value={formPreparedBy}
                  onChange={(e) => setFormPreparedBy(e.target.value)}
                  placeholder="e.g. Eng. Sterling"
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Issuing Source / Consultant</label>
                <input
                  type="text"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  placeholder="e.g. Arup Structural Engineering"
                  className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Notes / Scope Description</label>
              <input
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="e.g. Tender addendum drawing package"
                className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {selectedFiles.length} file(s) ready to upload
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0 || isProcessing}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Document{selectedFiles.length > 1 ? 's' : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
