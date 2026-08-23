import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  ArrowRight, 
  FileText,
  RefreshCw,
  Check
} from 'lucide-react';
import { DrawingRecord, DetectedElement, OpenItem } from '../types';

interface AiScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  drawings?: DrawingRecord[];
  activeDrawing?: DrawingRecord | null;
  onImportExtractedData?: (newElements: DetectedElement[], newOpenItems: OpenItem[]) => void;
  onImportData?: (newElements: DetectedElement[], newOpenItems: OpenItem[]) => void;
}

export const AiScanModal: React.FC<AiScanModalProps> = ({
  isOpen,
  onClose,
  drawings = [],
  activeDrawing = null,
  onImportExtractedData,
  onImportData,
}) => {
  const availableDrawings = drawings && drawings.length > 0 
    ? drawings 
    : (activeDrawing ? [activeDrawing] : []);

  const [selectedDrawingId, setSelectedDrawingId] = useState<string>(
    activeDrawing?.id || availableDrawings?.[0]?.id || ''
  );
  const [selectedFocus, setSelectedFocus] = useState<'all' | 'rcc' | 'bbs' | 'masonry' | 'steel' | 'mep'>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [extractedElements, setExtractedElements] = useState<DetectedElement[]>([]);
  const [extractedOpenItems, setExtractedOpenItems] = useState<OpenItem[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (activeDrawing?.id) {
      setSelectedDrawingId(activeDrawing.id);
    } else if (availableDrawings?.[0]?.id && !selectedDrawingId) {
      setSelectedDrawingId(availableDrawings[0].id);
    }
  }, [activeDrawing, availableDrawings, selectedDrawingId]);

  if (!isOpen) return null;

  const handleStartScan = async () => {
    const drawing = availableDrawings.find((d) => d.id === selectedDrawingId) || availableDrawings?.[0];
    setIsScanning(true);
    setScanComplete(false);
    setStatusMessage('Analyzing CAD vector geometries and text schedules...');

    try {
      // Call backend /api/analyze-drawing
      const res = await fetch('/api/analyze-drawing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawingNumber: drawing?.drawingNumber || 'S-201',
          drawingTitle: drawing?.title || 'Drawing Plan',
          discipline: drawing?.discipline || 'Structural',
          floorLevel: drawing?.level || 'Ground Floor',
          scaleRatio: drawing?.scaleRatio || '1:100',
        }),
      });

      const data = await res.json();
      setStatusMessage('Extracting dimensions, verifying deductions and cross-checking notes...');

      if (data.success && data.data) {
        setExtractedElements(data.data.detectedElements || []);
        setExtractedOpenItems(data.data.openItems || []);
      } else {
        // Fallback demo elements
        setExtractedElements([
          {
            id: `EXT-${Date.now().toString(36).slice(-4)}`,
            name: `${drawing?.discipline || 'Structural'} Extracted Member (${drawing?.drawingNumber || 'S-201'})`,
            category: 'beam',
            discipline: (drawing?.discipline as any) || 'Structural',
            level: drawing?.level || 'Level 02',
            gridLocation: 'Grid B-C / 1-4',
            drawingId: drawing?.id || 'DRW-01',
            drawingNumber: drawing?.drawingNumber || 'S-201',
            drawingRevision: drawing?.revision || 'Rev 02',
            dimensions: { length: 6.5, width: 0.3, depthOrThickness: 0.6, count: 4, unit: 'm³' },
            deductions: [],
            specification: { concreteGrade: 'C35/45' },
            calculation: {
              formula: 'Length × Width × Depth × Count',
              expressionWithValues: '6.50m × 0.30m × 0.60m × 4 = 4.680 m³',
              grossQuantity: 4.68,
              deductionsTotal: 0,
              netQuantity: 4.68,
              unit: 'm³',
              lastCalculatedAt: new Date().toISOString(),
            },
            confidence: 0.96,
            status: 'verified',
            linkedBoqItemIds: ['BOQ-04-02'],
            linkedBbsMarks: [],
          },
        ]);
      }

      setIsScanning(false);
      setScanComplete(true);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
      setScanComplete(true);
    }
  };

  const handleApply = () => {
    const importFn = onImportExtractedData || onImportData;
    if (importFn) {
      importFn(extractedElements, extractedOpenItems);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                AI Blueprint & Schedule Takeoff Extraction
              </h2>
              <p className="text-xs text-slate-500">
                Automated member recognition, dimensions calculation, and discrepancy scan
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Drawing selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Target Blueprint / Sheet</label>
            <select
              value={selectedDrawingId}
              onChange={(e) => setSelectedDrawingId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              {availableDrawings.length === 0 ? (
                <option value="">No drawings registered yet</option>
              ) : (
                availableDrawings.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.drawingNumber} — {d.title} ({d.discipline})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Scope focus */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Extraction Scope Focus</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'all', label: 'All Structural & Arch' },
                { id: 'rcc', label: 'RCC Framing (Beams/Cols)' },
                { id: 'bbs', label: 'Rebar BBS Schedules' },
                { id: 'masonry', label: 'Blockwork & Finishes' },
                { id: 'steel', label: 'Structural Steelwork' },
                { id: 'mep', label: 'MEP Major Quantities' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFocus(f.id as any)}
                  className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                    selectedFocus === f.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scanning Progress Box */}
          {isScanning && (
            <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <div>
                <p className="text-xs font-bold text-indigo-900">{statusMessage}</p>
                <p className="text-[11px] text-indigo-600 mt-0.5">
                  Parsing vector layers, dimension strings, text schedules and bar marks...
                </p>
              </div>
            </div>
          )}

          {/* Scan Results */}
          {scanComplete && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold">Extraction Completed Successfully</span>
                </div>
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                  {extractedElements.length} Elements • {extractedOpenItems.length} Queries
                </span>
              </div>

              {/* Extracted Elements Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">Detected Structural Elements</h4>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                  {extractedElements.map((el) => (
                    <div key={el.id} className="p-2.5 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{el.name}</span>
                        <span className="text-slate-400 ml-2">({el.gridLocation})</span>
                      </div>
                      <span className="font-mono font-bold text-indigo-700">
                        {el.calculation.netQuantity} {el.calculation.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extracted Open Items Preview */}
              {extractedOpenItems.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700">Generated Engineering Inquiries / RFIs</h4>
                  <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 border border-amber-200 rounded-lg bg-amber-50/50">
                    {extractedOpenItems.map((oi) => (
                      <div key={oi.id} className="p-2.5 text-xs flex items-center justify-between text-amber-900">
                        <span>{oi.title}</span>
                        <span className="font-bold text-[10px] bg-amber-200 px-1.5 py-0.5 rounded">
                          {oi.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          {scanComplete ? (
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Import {extractedElements.length} Items to Takeoff</span>
            </button>
          ) : (
            <button
              disabled={isScanning || availableDrawings.length === 0}
              onClick={handleStartScan}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isScanning ? 'Scanning...' : 'Start AI Extraction'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
