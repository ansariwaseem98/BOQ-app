import React, { useState, useRef } from 'react';
import { Ruler, Check, X, Crosshair, Sparkles, AlertCircle } from 'lucide-react';
import { ProjectDocument } from '../types';
import { DocumentStorageService } from '../services/documentStorage';

interface DrawingScaleCalibrationModalProps {
  doc: ProjectDocument;
  onClose: () => void;
  onCalibrated: (updatedDoc: ProjectDocument) => void;
}

export const DrawingScaleCalibrationModal: React.FC<DrawingScaleCalibrationModalProps> = ({
  doc,
  onClose,
  onCalibrated,
}) => {
  const [point1, setPoint1] = useState<{ x: number; y: number } | null>(null);
  const [point2, setPoint2] = useState<{ x: number; y: number } | null>(null);
  const [realWorldDistance, setRealWorldDistance] = useState<string>('5.0');
  const [unit, setUnit] = useState<'m' | 'mm' | 'ft'>('m');
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string>('Click Point 1 on a known dimension line.');
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (!point1) {
      setPoint1({ x, y });
      setStatusMsg('Point 1 marked. Now click Point 2 at the other end of the dimension.');
    } else if (!point2) {
      setPoint2({ x, y });
      setStatusMsg('Points marked. Confirm the known real-world dimension below.');
    } else {
      // Reset to point 1
      setPoint1({ x, y });
      setPoint2(null);
      setStatusMsg('Point 1 re-marked. Now click Point 2.');
    }
  };

  const pixelDistance = React.useMemo(() => {
    if (!point1 || !point2) return 0;
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, [point1, point2]);

  const handleSaveCalibration = async () => {
    const distNum = parseFloat(realWorldDistance);
    if (isNaN(distNum) || distNum <= 0) {
      alert('Please enter a valid positive distance.');
      return;
    }
    if (!point1 || !point2) {
      alert('Please select both Point 1 and Point 2 on the drawing preview.');
      return;
    }

    setIsCalibrating(true);
    try {
      // Convert to meters
      const distanceInMeters = unit === 'm' ? distNum : unit === 'mm' ? distNum / 1000 : distNum * 0.3048;
      const pixelsPerMeter = pixelDistance / distanceInMeters;
      const ratioEstimate = `1:${Math.round(100 / (distNum || 1))}`;

      const updated = await DocumentStorageService.updateDocumentMetadata(doc.id, {
        calibrationScale: pixelsPerMeter,
        scaleRatio: ratioEstimate,
        scaleInfo: {
          value: ratioEstimate,
          confidence: 'User Calibrated (100%)',
          calibrated: true,
          calibrationData: {
            p1: point1,
            p2: point2,
            distance: distNum,
            unit,
          },
        },
      });

      onCalibrated(updated);
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to save scale calibration.');
    } finally {
      setIsCalibrating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Ruler className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Interactive Scale Calibration Tool</h3>
              <p className="text-xs text-slate-400 font-mono">
                {doc.drawingNumber || doc.id} • {doc.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Calibration instructions banner */}
        <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-900 font-medium">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
          {(point1 || point2) && (
            <button
              onClick={() => {
                setPoint1(null);
                setPoint2(null);
                setStatusMsg('Click Point 1 on a known dimension line.');
              }}
              className="text-xs text-indigo-600 hover:underline font-bold"
            >
              Reset Points
            </button>
          )}
        </div>

        {/* Drawing Preview Stage */}
        <div className="flex-1 bg-slate-900 p-4 relative overflow-hidden flex items-center justify-center min-h-[360px]">
          <div
            ref={containerRef}
            onClick={handleCanvasClick}
            className="relative cursor-crosshair max-w-full max-h-full border border-slate-700 bg-slate-950 flex items-center justify-center shadow-lg select-none"
          >
            {doc.previewDataUrl ? (
              <img
                src={doc.previewDataUrl}
                alt="Calibration target"
                className="max-h-[50vh] object-contain pointer-events-none"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-96 h-64 flex flex-col items-center justify-center text-slate-500 gap-2">
                <Crosshair className="w-10 h-10 text-indigo-400" />
                <span className="text-xs">Click two points to establish scale calibration</span>
              </div>
            )}

            {/* Point 1 Marker */}
            {point1 && (
              <div
                className="absolute w-4 h-4 rounded-full bg-emerald-500 border-2 border-white -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[8px] font-black text-white shadow-md pointer-events-none"
                style={{ left: `${point1.x}%`, top: `${point1.y}%` }}
              >
                1
              </div>
            )}

            {/* Point 2 Marker */}
            {point2 && (
              <div
                className="absolute w-4 h-4 rounded-full bg-amber-500 border-2 border-white -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-[8px] font-black text-white shadow-md pointer-events-none"
                style={{ left: `${point2.x}%`, top: `${point2.y}%` }}
              >
                2
              </div>
            )}

            {/* Connecting line */}
            {point1 && point2 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line
                  x1={`${point1.x}%`}
                  y1={`${point1.y}%`}
                  x2={`${point2.x}%`}
                  y2={`${point2.y}%`}
                  stroke="#6366F1"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Input & Calibration confirmation */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Known Real Distance Between Points
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={realWorldDistance}
                  onChange={(e) => setRealWorldDistance(e.target.value)}
                  className="w-28 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500"
                  placeholder="e.g. 5.0"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden"
                >
                  <option value="m">Meters (m)</option>
                  <option value="mm">Millimeters (mm)</option>
                  <option value="ft">Feet (ft)</option>
                </select>
              </div>
            </div>

            {point1 && point2 && (
              <div className="bg-indigo-100/70 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs">
                <span className="text-slate-600 block text-[10px]">Calculated Scale</span>
                <strong className="text-indigo-900 font-mono font-bold">
                  1:{Math.round(100 / (parseFloat(realWorldDistance) || 1))} (~{pixelDistance.toFixed(1)}% px span)
                </strong>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCalibration}
              disabled={!point1 || !point2 || isCalibrating}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isCalibrating ? 'Calibrating...' : 'Apply & Save Calibration'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
