import React, { useState, useRef } from 'react';
import { 
  X, 
  Check, 
  Upload, 
  PenTool, 
  HelpCircle, 
  MapPin, 
  FileText, 
  Image as ImageIcon, 
  ShieldAlert, 
  CheckCircle,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { IntelligenceOpenItem } from '../types';

interface OpenItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  openItem: IntelligenceOpenItem | null;
  onResolve: (
    openItemId: string,
    response: {
      enteredValue?: string;
      unit?: string;
      notes?: string;
      attachedSketchDataUrl?: string;
      attachedSupportingDocId?: string;
      resolvedBy: string;
      status: 'resolved' | 'rejected' | 'under_review';
    }
  ) => void;
  onLocateOnDrawing?: (openItem: IntelligenceOpenItem) => void;
}

export const OpenItemDetailModal: React.FC<OpenItemDetailModalProps> = ({
  isOpen,
  onClose,
  openItem,
  onResolve,
  onLocateOnDrawing,
}) => {
  if (!isOpen || !openItem) return null;

  const [enteredValue, setEnteredValue] = useState(openItem.userResponse?.enteredValue || '');
  const [unit, setUnit] = useState(openItem.userResponse?.unit || 'mm');
  const [notes, setNotes] = useState(openItem.userResponse?.notes || '');
  const [sketchDataUrl, setSketchDataUrl] = useState<string | undefined>(
    openItem.userResponse?.attachedSketchDataUrl
  );
  const [engineerName, setEngineerName] = useState('Senior Estimator');
  const [activeTab, setActiveTab] = useState<'value' | 'sketch' | 'note'>('value');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simple Canvas Hand Sketching state
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setSketchDataUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#dc2626'; // Red pen
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSketchDataUrl(canvasRef.current.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSketchDataUrl(undefined);
  };

  const handleSubmit = (status: 'resolved' | 'under_review' | 'rejected') => {
    if (status === 'resolved' && !enteredValue.trim() && !sketchDataUrl && !notes.trim()) {
      alert('Please enter a confirmed value, sketch, or engineering note to resolve this query.');
      return;
    }

    onResolve(openItem.id, {
      enteredValue,
      unit,
      notes,
      attachedSketchDataUrl: sketchDataUrl,
      resolvedBy: engineerName,
      status,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center font-black">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                  {openItem.id}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {openItem.category.replace(/_/g, ' ')}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">{openItem.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Question / Uncertainty Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                Required Engineering Input
              </span>
              {onLocateOnDrawing && (
                <button
                  type="button"
                  onClick={() => {
                    onLocateOnDrawing(openItem);
                    onClose();
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 underline"
                >
                  <MapPin className="w-3 h-3" />
                  Locate on Drawing
                </button>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-900 leading-relaxed">
              {openItem.questionToUser}
            </p>
            <div className="text-[11px] text-slate-500">
              <span className="font-bold">Context:</span> {openItem.description} •{' '}
              <span className="font-bold">Location:</span> {openItem.sourceLocation} (Sheet {openItem.drawingNumber})
            </div>
            {openItem.detectedText && (
              <div className="mt-1 inline-flex items-center gap-2 px-2.5 py-1 rounded bg-amber-100/70 border border-amber-300 font-mono text-xs text-amber-950 font-bold">
                <span>Detected OCR Text:</span>
                <span className="text-red-700 underline">{openItem.detectedText}</span>
              </div>
            )}
          </div>

          {/* Action Tabs */}
          <div className="flex border-b border-slate-200 gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('value')}
              className={`pb-2 text-xs font-bold transition-colors ${
                activeTab === 'value'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              [ ENTER VALUE ]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sketch')}
              className={`pb-2 text-xs font-bold transition-colors ${
                activeTab === 'sketch'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              [ UPLOAD HAND SKETCH / DRAW ]
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('note')}
              className={`pb-2 text-xs font-bold transition-colors ${
                activeTab === 'note'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              [ ADD ENGINEERING NOTE ]
            </button>
          </div>

          {/* Tab 1: Enter Value */}
          {activeTab === 'value' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirmed Value / Clarification
                  </label>
                  <input
                    type="text"
                    value={enteredValue}
                    onChange={(e) => setEnteredValue(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 1500 (or 200mm AAC Blockwork)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="mm">mm</option>
                    <option value="m">m</option>
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="kg">kg</option>
                    <option value="Nos">Nos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Clarification Note / Source Reference
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Confirmed as 1500mm span from grid layout line and architectural detail A-301."
                />
              </div>
            </div>
          )}

          {/* Tab 2: Hand Sketch / Upload */}
          {activeTab === 'sketch' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Attach Clarification Sketch / Markup:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Interactive Canvas */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 bg-slate-50 flex flex-col items-center justify-center">
                {sketchDataUrl && !canvasRef.current?.getContext('2d') ? (
                  <div className="relative max-h-48 overflow-hidden rounded">
                    <img src={sketchDataUrl} alt="Attached sketch" className="object-contain max-h-48" />
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={180}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    className="bg-white rounded border border-slate-200 cursor-crosshair shadow-inner"
                  />
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  Draw with mouse/touch or click "Upload Image" to attach scanned hand sketch.
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: Engineering Note */}
          {activeTab === 'note' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Detailed Engineering Clarification
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter technical memo, RFI reference number, consultant communication details..."
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSubmit('rejected')}
              className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
            >
              Reject / Not Applicable
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('resolved')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-2xs"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Resolve Open Item</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
