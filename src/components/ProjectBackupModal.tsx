import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck,
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import { ProjectPersistenceService, ProjectBackupPackage } from '../services/projectPersistenceService';
import { ProjectRecord } from '../types';

interface ProjectBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProjectId?: string;
  activeProjectName?: string;
  onImportSuccess: (importedProject: ProjectRecord) => void;
}

export const ProjectBackupModal: React.FC<ProjectBackupModalProps> = ({
  isOpen,
  onClose,
  activeProjectId,
  activeProjectName,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importedFileName, setImportedFileName] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExportDownload = async () => {
    if (!activeProjectId) {
      setFeedback({ type: 'error', text: 'No active project selected to export.' });
      return;
    }

    try {
      setIsExporting(true);
      const pkg = await ProjectPersistenceService.exportProjectBackup(activeProjectId);
      if (!pkg) {
        throw new Error('Failed to assemble project backup package.');
      }

      const jsonStr = JSON.stringify(pkg, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      const safeName = (activeProjectName || activeProjectId).replace(/[^a-zA-Z0-9_-]/g, '_');
      a.href = url;
      a.download = `${safeName}_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setFeedback({
        type: 'success',
        text: `Exported complete project package (${pkg.state.elements.length} BIM elements, ${pkg.state.drawings.length} drawings).`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Export failed.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setImportJsonText(content || '');
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importJsonText.trim()) {
      setFeedback({ type: 'error', text: 'Please select a backup file or paste backup JSON.' });
      return;
    }

    try {
      setIsImporting(true);
      const res = await ProjectPersistenceService.importProjectBackup(importJsonText.trim());
      if (res.success && res.project) {
        setFeedback({
          type: 'success',
          text: `Project "${res.project.project.name}" (ID: ${res.project.id}) successfully imported with all drawings, BIM elements & BOQ.`,
        });
        setTimeout(() => {
          onImportSuccess(res.project!);
          onClose();
        }, 1200);
      } else {
        setFeedback({ type: 'error', text: res.error || 'Import failed.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Invalid JSON backup format' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Project Backup Center</h2>
              <p className="text-xs text-slate-300">Complete Offline Snapshot Export & Import</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => {
              setActiveTab('export');
              setFeedback(null);
            }}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'export'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Export Backup (.json)
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setFeedback(null);
            }}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'import'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Import Backup (.json)
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-4">
              <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <FileJson className="w-8 h-8 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Full Project Export Bundle
                    </h3>
                    <p className="text-xs text-slate-600 mt-1">
                      Exports a single self-contained JSON archive of{' '}
                      <strong>{activeProjectName || activeProjectId || 'Active Project'}</strong> containing all drawings metadata, CAD layers, BIM elements, dimensions, engineer overrides, Open Items & clarifications, BOQ schedule, BBS records, and version history.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleExportDownload}
                  disabled={isExporting || !activeProjectId}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Generating JSON Package...' : 'Download Project Backup (.json)'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-6 text-center bg-slate-50/50 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">
                  {importedFileName ? `Selected: ${importedFileName}` : 'Choose a .json project backup file to import'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                  Restores complete project metadata, drawings, BIM model, and BOQ.
                </p>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold shadow-xs transition-colors">
                  <FileJson className="w-3.5 h-3.5 text-indigo-600" />
                  Browse JSON File
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Or paste JSON content directly:
                </label>
                <textarea
                  rows={4}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste JSON project backup data here..."
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleExecuteImport}
                  disabled={isImporting || !importJsonText.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
                >
                  <ArrowRight className="w-4 h-4" />
                  {isImporting ? 'Importing Project...' : 'Import & Open Project'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% data integrity verified upon import.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
