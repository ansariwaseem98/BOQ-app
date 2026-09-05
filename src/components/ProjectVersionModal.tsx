import React, { useState, useEffect } from 'react';
import { 
  History, 
  RotateCcw, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  User, 
  FileText, 
  Layers, 
  AlertCircle,
  X,
  BookmarkPlus,
  ShieldAlert
} from 'lucide-react';
import { ProjectPersistenceService, ProjectVersionCheckpoint } from '../services/projectPersistenceService';

interface ProjectVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  onRollbackSuccess: (restoredVersion: ProjectVersionCheckpoint) => void;
  onCreateCheckpoint: (title: string, description: string) => Promise<void>;
}

export const ProjectVersionModal: React.FC<ProjectVersionModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  onRollbackSuccess,
  onCreateCheckpoint,
}) => {
  const [versions, setVersions] = useState<ProjectVersionCheckpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [rollbackConfirmVersion, setRollbackConfirmVersion] = useState<ProjectVersionCheckpoint | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      loadVersions();
    }
  }, [isOpen, projectId]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const list = await ProjectPersistenceService.getProjectVersions(projectId);
      setVersions(list);
    } catch (e) {
      console.error('Failed to load versions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setIsCreating(true);
      await onCreateCheckpoint(newTitle.trim(), newDescription.trim());
      setNewTitle('');
      setNewDescription('');
      setActionMessage({ type: 'success', text: 'Version checkpoint saved successfully!' });
      await loadVersions();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to save version checkpoint' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleExecuteRollback = async (version: ProjectVersionCheckpoint) => {
    try {
      setIsRollingBack(true);
      const res = await ProjectPersistenceService.restoreProjectFromVersion(projectId, version.versionId);
      if (res.success) {
        setActionMessage({ type: 'success', text: `Restored to ${version.title} (v${version.versionNumber})` });
        setRollbackConfirmVersion(null);
        onRollbackSuccess(version);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Rollback failed' });
      }
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Rollback error' });
    } finally {
      setIsRollingBack(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Project Versions & Checkpoints</h2>
              <p className="text-xs text-slate-300 font-mono">
                {projectId} • {projectName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action feedback banner */}
        {actionMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
              actionMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Create Checkpoint Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-black uppercase text-slate-700 mb-3 flex items-center gap-1.5">
              <BookmarkPlus className="w-4 h-4 text-indigo-600" />
              Save Manual Version Checkpoint
            </h3>
            <form onSubmit={handleCreateNew} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Checkpoint Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pre-Tender Submission Draft v2"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Description / Scope of Changes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Updated column B-017 depth & reconciled beam BBS"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreating || !newTitle.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  {isCreating ? 'Saving Checkpoint...' : 'Save Current State as Checkpoint'}
                </button>
              </div>
            </form>
          </div>

          {/* Rollback Confirmation Banner */}
          {rollbackConfirmVersion && (
            <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 animate-in fade-in duration-150">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-amber-900">
                    Confirm Rollback to Version {rollbackConfirmVersion.versionNumber}?
                  </h4>
                  <p className="text-xs text-amber-800 mt-1">
                    Restoring <strong>{rollbackConfirmVersion.title}</strong> will replace current workspace elements, drawings, open items, and BOQ with the snapshot from{' '}
                    {new Date(rollbackConfirmVersion.timestamp).toLocaleString()}. (An automatic safety checkpoint of your current state will be saved first).
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleExecuteRollback(rollbackConfirmVersion)}
                      disabled={isRollingBack}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {isRollingBack ? 'Restoring State...' : 'Yes, Restore this Version'}
                    </button>
                    <button
                      onClick={() => setRollbackConfirmVersion(null)}
                      className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Versions Timeline List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" />
                Saved Checkpoint History ({versions.length})
              </h3>
              <span className="text-[11px] text-slate-400">Chronologically ordered (newest first)</span>
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading version checkpoints...</div>
            ) : versions.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No version checkpoints recorded yet.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Save a checkpoint above or trigger manual saves to keep snapshots of your project evolution.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {versions.map((ver) => (
                  <div
                    key={ver.versionId}
                    className="border border-slate-200 hover:border-indigo-300 rounded-xl p-4 bg-white hover:bg-slate-50/50 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            v{ver.versionNumber}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900">{ver.title}</h4>
                        </div>
                        {ver.description && (
                          <p className="text-xs text-slate-600 mt-1">{ver.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(ver.timestamp).toLocaleDateString()} {new Date(ver.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {ver.author || 'Quantity Surveyor'}
                          </span>
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <Layers className="w-3 h-3 text-indigo-500" />
                            {ver.itemCounts?.elements || 0} BIM elements • {ver.itemCounts?.drawings || 0} drawings • {ver.itemCounts?.openItems || 0} open items • {ver.itemCounts?.boqItems || 0} BOQ lines
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setRollbackConfirmVersion(ver)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Rollback
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Project state is permanently preserved across sessions.</span>
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
