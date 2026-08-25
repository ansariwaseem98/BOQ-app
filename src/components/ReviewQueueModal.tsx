import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  UploadCloud,
  FileImage,
  ArrowRight,
  ShieldCheck,
  Edit3,
  Filter,
  Search,
  Eye,
  History,
  Check
} from 'lucide-react';
import { ReviewQueueItem, SmartReviewPriorityType } from '../types';
import { EndToEndValidationEngine } from '../engine/endToEndValidationSuite';

interface ReviewQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInspectDrawing?: (drawingNumber: string) => void;
}

export const ReviewQueueModal: React.FC<ReviewQueueModalProps> = ({
  isOpen,
  onClose,
  onInspectDrawing,
}) => {
  const [items, setItems] = useState<ReviewQueueItem[]>(() =>
    EndToEndValidationEngine.getReviewQueueItems()
  );
  const [selectedItem, setSelectedItem] = useState<ReviewQueueItem | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Correction input state
  const [correctedValue, setCorrectedValue] = useState('');
  const [correctionNote, setCorrectionNote] = useState('');

  // Hand sketch attachment state
  const [sketchName, setSketchName] = useState('');
  const [sketchDimension, setSketchDimension] = useState('');
  const [sketchNotes, setSketchNotes] = useState('');
  const [isUploadingSketch, setIsUploadingSketch] = useState(false);

  if (!isOpen) return null;

  // Filtered queue items
  const filteredQueue = items.filter((item) => {
    if (priorityFilter !== 'ALL' && item.smartPriority !== priorityFilter) return false;
    if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.drawingNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = items.filter((i) => i.status === 'PENDING' || i.status === 'OPEN_ITEM' || i.status === 'CONFLICT').length;
  const verifiedCount = items.filter((i) => i.status === 'VERIFIED' || i.status === 'CORRECTED').length;

  // Action: Verify
  const handleVerify = (itemId: string) => {
    const updated = items.map((i) => {
      if (i.id === itemId) {
        const newHistory = [
          ...i.auditHistory,
          {
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            user: 'Lead Estimator (Verified)',
            action: 'Marked USER VERIFIED after visual and formula review.',
          },
        ];
        return {
          ...i,
          status: 'VERIFIED' as const,
          auditHistory: newHistory,
        };
      }
      return i;
    });
    setItems(updated);
    if (selectedItem?.id === itemId) {
      setSelectedItem(updated.find((x) => x.id === itemId) || null);
    }
  };

  // Action: User Correction
  const handleSaveCorrection = () => {
    if (!selectedItem || !correctedValue.trim()) return;

    const updated = items.map((i) => {
      if (i.id === selectedItem.id) {
        const newHistory = [
          ...i.auditHistory,
          {
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            user: 'Lead Estimator (Correction)',
            action: `Overrode value from "${i.currentValue}" to "${correctedValue}". Recalculated BOQ.`,
            note: correctionNote || 'Engineer verified dimension from site coordination.',
          },
        ];
        return {
          ...i,
          status: 'CORRECTED' as const,
          currentValue: correctedValue,
          auditHistory: newHistory,
        };
      }
      return i;
    });
    setItems(updated);
    setSelectedItem(updated.find((x) => x.id === selectedItem.id) || null);
    setCorrectedValue('');
    setCorrectionNote('');
  };

  // Action: Attach Hand Sketch
  const handleAttachHandSketch = () => {
    if (!selectedItem || !sketchDimension.trim()) return;

    const updated = items.map((i) => {
      if (i.id === selectedItem.id) {
        const newHistory = [
          ...i.auditHistory,
          {
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
            user: 'Site Engineer (Hand Sketch)',
            action: `Attached hand sketch "${sketchName || 'Site_Markup.jpg'}" with verified dimension: ${sketchDimension}.`,
            note: sketchNotes,
          },
        ];
        return {
          ...i,
          status: 'CORRECTED' as const,
          currentValue: sketchDimension,
          handSketchAttached: true,
          handSketchData: {
            sketchName: sketchName || 'Site_AsBuilt_Sketch.jpg',
            uploadedAt: new Date().toISOString().slice(0, 16),
            uploadedBy: 'Site Engineer',
            dimensionProvided: sketchDimension,
            notes: sketchNotes,
          },
          auditHistory: newHistory,
        };
      }
      return i;
    });
    setItems(updated);
    setSelectedItem(updated.find((x) => x.id === selectedItem.id) || null);
    setIsUploadingSketch(false);
    setSketchName('');
    setSketchDimension('');
    setSketchNotes('');
  };

  // Helper for priority badges
  const renderPriorityBadge = (priority: SmartReviewPriorityType) => {
    switch (priority) {
      case 'MISSING_DIMENSION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            1. Missing Dimension
          </span>
        );
      case 'CONFLICTING_DIMENSION':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            2. Conflicting Dimension
          </span>
        );
      case 'LOW_CONFIDENCE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            3. Low Confidence
          </span>
        );
      case 'LARGE_QUANTITY_CHANGE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            4. Large Quantity Shift
          </span>
        );
      case 'DUPLICATE_CANDIDATE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            5. Duplicate Candidate
          </span>
        );
      case 'MISSING_SOURCE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
            6. Missing Source Link
          </span>
        );
      case 'UNVERIFIED_BOQ':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            7. Unverified Item
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Human Verification & Smart Review Queue</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  SMART RISK RANKING
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Prioritized queue sorting highest-risk queries (missing dimensions, conflicts, unverified items) for engineer sign-off.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Priority Filter Strip */}
        <div className="px-6 py-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Pending Review:</span>
              <span className="text-sm font-bold text-amber-700">{pendingCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-600">Verified / Corrected:</span>
              <span className="text-sm font-bold text-emerald-700">{verifiedCount}</span>
            </div>
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search issues, drawings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs w-48 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Smart Priorities</option>
              <option value="MISSING_DIMENSION">1. Missing Dimensions</option>
              <option value="CONFLICTING_DIMENSION">2. Conflicting Dimensions</option>
              <option value="LOW_CONFIDENCE">3. Low Confidence</option>
              <option value="LARGE_QUANTITY_CHANGE">4. Large Quantity Changes</option>
              <option value="DUPLICATE_CANDIDATE">5. Duplicate Candidates</option>
              <option value="MISSING_SOURCE">6. Missing Sources</option>
              <option value="UNVERIFIED_BOQ">7. Unverified Items</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>
          </div>
        </div>

        {/* Master-Detail Split Workspace */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: Prioritized List */}
          <div className="w-1/2 border-r border-slate-200 overflow-y-auto divide-y divide-slate-100">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic text-xs">
                No review queue items match the active filters.
              </div>
            ) : (
              filteredQueue.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isDone = item.status === 'VERIFIED' || item.status === 'CORRECTED';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                        : isDone
                        ? 'bg-slate-50/50 hover:bg-slate-50 opacity-80'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {renderPriorityBadge(item.smartPriority)}
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            item.severity === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : item.severity === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 font-bold">
                        {item.drawingNumber}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 mb-1">{item.title}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">{item.description}</p>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                      <span className="text-slate-500">
                        Current: <strong className="text-slate-800 font-mono">{item.currentValue}</strong>
                      </span>
                      <span
                        className={`font-bold uppercase text-[10px] ${
                          isDone ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Interactive Review & Action Panel */}
          <div className="w-1/2 overflow-y-auto p-6 bg-slate-50/50 flex flex-col">
            {selectedItem ? (
              <div className="space-y-4 flex-1 flex flex-col">
                
                {/* Header Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderPriorityBadge(selectedItem.smartPriority)}
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {selectedItem.drawingNumber}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        selectedItem.status === 'VERIFIED' || selectedItem.status === 'CORRECTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedItem.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{selectedItem.title}</h3>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedItem.description}</p>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <span className="font-bold text-slate-600 block mb-0.5 text-[10px] uppercase">Recommended Action:</span>
                    <p className="text-slate-800">{selectedItem.suggestedAction}</p>
                  </div>
                </div>

                {/* Hand Sketch Evidence Card (If Attached) */}
                {selectedItem.handSketchAttached && selectedItem.handSketchData && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <FileImage className="w-4 h-4 text-emerald-700" />
                        <span>Hand Sketch / As-Built Evidence Attached</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        {selectedItem.handSketchData.uploadedAt}
                      </span>
                    </div>
                    <div className="text-xs text-emerald-800 space-y-1">
                      <p>
                        <strong>File:</strong> {selectedItem.handSketchData.sketchName} | <strong>Provided Dim:</strong>{' '}
                        <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-300">
                          {selectedItem.handSketchData.dimensionProvided}
                        </span>
                      </p>
                      {selectedItem.handSketchData.notes && (
                        <p className="italic text-[11px] text-emerald-700">Notes: {selectedItem.handSketchData.notes}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Box 1: Quick Actions */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Human Verification Actions</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleVerify(selectedItem.id)}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>[VERIFY AS ACCURATE]</span>
                    </button>

                    {onInspectDrawing && (
                      <button
                        onClick={() => onInspectDrawing(selectedItem.drawingNumber)}
                        className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>[VIEW SOURCE DRAWING]</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Box 2: Enter Correction */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Enter Corrected Dimension / Quantity</span>
                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="e.g. 230 mm / 105.00 m³"
                      value={correctedValue}
                      onChange={(e) => setCorrectedValue(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="Reason / Reference (e.g. Checked with Structural Engineer Rev 02)"
                      value={correctionNote}
                      onChange={(e) => setCorrectionNote(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden"
                    />
                    <button
                      onClick={handleSaveCorrection}
                      disabled={!correctedValue.trim()}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      [APPLY CORRECTION & RECALCULATE BOQ]
                    </button>
                  </div>
                </div>

                {/* Action Box 3: Attach Hand Sketch */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Upload Hand Sketch / Markup Evidence</span>
                    <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  {!isUploadingSketch ? (
                    <button
                      onClick={() => setIsUploadingSketch(true)}
                      className="w-full py-2 border border-dashed border-slate-300 hover:border-indigo-400 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>+ Attach Hand Sketch Markup</span>
                    </button>
                  ) : (
                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in duration-100">
                      <input
                        type="text"
                        placeholder="Sketch file name (e.g. Site_Wall_Sketch_D4.jpg)"
                        value={sketchName}
                        onChange={(e) => setSketchName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Verified Dimension (e.g. 230 mm)"
                        value={sketchDimension}
                        onChange={(e) => setSketchDimension(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                      <textarea
                        placeholder="Markup notes / As-built justification..."
                        rows={2}
                        value={sketchNotes}
                        onChange={(e) => setSketchNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs resize-none"
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => setIsUploadingSketch(false)}
                          className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAttachHandSketch}
                          disabled={!sketchDimension.trim()}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded text-xs font-bold"
                        >
                          Save & Attach Evidence
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Audit Trail Drawer */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>Immutable Audit History</span>
                  </div>
                  <div className="space-y-2 divide-y divide-slate-100 text-xs">
                    {selectedItem.auditHistory.map((h, i) => (
                      <div key={i} className="pt-2 first:pt-0 space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <strong className="text-slate-800">{h.user}</strong>
                          <span className="font-mono">{h.timestamp}</span>
                        </div>
                        <p className="text-slate-700 text-[11px]">{h.action}</p>
                        {h.note && <p className="italic text-[10px] text-slate-500">Note: {h.note}</p>}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 p-8 text-center">
                <ShieldCheck className="w-12 h-12 text-slate-300 stroke-1" />
                <p className="text-xs">Select an item from the review queue to inspect details and execute verification actions.</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>AI Confidence is NOT verification. Human sign-off is mandatory for all quantities before freeze.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
