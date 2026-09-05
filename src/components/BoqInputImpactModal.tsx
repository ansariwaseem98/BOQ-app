import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Layers,
  X,
  Sparkles,
  RefreshCw,
  FileText
} from 'lucide-react';
import { BOQItemObject } from '../types/boqAssemblyTypes';
import { BoqAssemblyEngine } from '../engine/boqAssemblyEngine';

interface BoqInputImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BOQItemObject[];
  onApplyChanges: (updatedItems: BOQItemObject[]) => void;
}

export const BoqInputImpactModal: React.FC<BoqInputImpactModalProps> = ({
  isOpen,
  onClose,
  items,
  onApplyChanges
}) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('WALL_THICKNESS');
  const [oldValue, setOldValue] = useState<number>(230);
  const [newValue, setNewValue] = useState<number>(250);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'WALL_THICKNESS',
      name: 'Wall Thickness Parameter (mm)',
      inputKey: 'wallThicknessMm',
      defaultOld: 230,
      defaultNew: 250,
      unit: 'mm',
      desc: 'Change exterior & interior wall thickness from 230mm to 250mm. Masonry volume scales while plaster surface and structural steel remain intact.'
    },
    {
      id: 'BEAM_DEPTH',
      name: 'Primary Beam Depth (m)',
      inputKey: 'beamDepthM',
      defaultOld: 0.60,
      defaultNew: 0.70,
      unit: 'm',
      desc: 'Increase primary suspended beam depth from 0.60m to 0.70m. Suspended concrete volume scales accordingly.'
    },
    {
      id: 'REBAR_DIAMETER',
      name: 'Main Column Rebar Diameter (mm)',
      inputKey: 'rebarDiameterMm',
      defaultOld: 20,
      defaultNew: 25,
      unit: 'mm',
      desc: 'Upgrade main column longitudinal rebar diameter from 20mm to 25mm (d² weight factor).'
    }
  ];

  const handleScenarioChange = (id: string) => {
    setSelectedScenario(id);
    const scen = scenarios.find(s => s.id === id);
    if (scen) {
      setOldValue(scen.defaultOld);
      setNewValue(scen.defaultNew);
    }
  };

  const currentScen = scenarios.find(s => s.id === selectedScenario) || scenarios[0];
  const impact = BoqAssemblyEngine.simulateInputImpact(items, currentScen.inputKey, oldValue, newValue);

  const handleApply = () => {
    const updated = items.map(item => {
      const affected = impact.affectedBoqItems.find(a => a.boqId === item.boqId);
      if (affected) {
        return BoqAssemblyEngine.editQuantity(
          item,
          affected.newQuantity,
          'Engineering Simulator (Lead QS)',
          `Simulated change: ${currentScen.name} from ${oldValue} to ${newValue} ${currentScen.unit}`
        );
      }
      return item;
    });

    onApplyChanges(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-6 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-amber-700 via-orange-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-600/60 rounded-xl border border-amber-400/40">
              <SlidersHorizontal className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Phase 15F — Interactive Input Impact Analysis Engine</h2>
              <p className="text-xs text-amber-200 mt-0.5 font-medium">
                Simulate Drawing or Design Parameter Variations and Observe Cascading Quantity Effects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-amber-200 hover:text-white hover:bg-amber-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {/* Preset Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Select Design Parameter Scenario:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {scenarios.map(scen => (
                <button
                  key={scen.id}
                  type="button"
                  onClick={() => handleScenarioChange(scen.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    selectedScenario === scen.id
                      ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-900 block mb-1">{scen.name}</span>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{scen.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Sliders */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Adjust Parameter Values ({currentScen.unit}):
              </h3>
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Delta: {((newValue - oldValue) / (oldValue || 1) * 100).toFixed(1)}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="text-xs font-semibold text-slate-600">Original Baseline Value:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={oldValue}
                    onChange={e => setOldValue(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-3 py-1.5 font-mono text-sm font-bold text-slate-800"
                  />
                  <span className="text-xs font-bold text-slate-500">{currentScen.unit}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200 space-y-2">
                <span className="text-xs font-semibold text-amber-900">Simulated Revised Value:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newValue}
                    onChange={e => setNewValue(Number(e.target.value))}
                    className="w-full bg-white border border-amber-300 rounded px-3 py-1.5 font-mono text-sm font-bold text-amber-900"
                  />
                  <span className="text-xs font-bold text-amber-700">{currentScen.unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Results Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Affected BOQ Line Items ({impact.affectedBoqItems.length})
              </h4>
              <span className="text-[11px] font-medium text-slate-500">Live Mathematical Projection</span>
            </div>

            {impact.affectedBoqItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No BOQ line items are dependent on this specific parameter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/75 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200">
                      <th className="py-2.5 px-4">Item Code</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-right">Baseline Qty</th>
                      <th className="py-2.5 px-4 text-right">Simulated Qty</th>
                      <th className="py-2.5 px-4 text-center">Unit</th>
                      <th className="py-2.5 px-4 text-right">Delta (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {impact.affectedBoqItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.itemCode}</td>
                        <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{item.description}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">{item.oldQuantity.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">{item.newQuantity.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">{item.unit}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold">
                          <span className={item.difference > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                            {item.difference > 0 ? `+${item.percentChange}%` : `${item.percentChange}%`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Unaffected Disciplines Proof Card */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Independent Disciplines Retained Intact (100% Isolated)
              </h4>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Discipline engines for <strong>Structural Steel, Roofing & Skylights, Substructure Earthwork, Electrical, Plumbing, HVAC, and Fire Protection</strong> remain completely unaffected and preserved.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel Simulation
          </button>
          <button
            onClick={handleApply}
            disabled={impact.affectedBoqItems.length === 0}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Simulated Quantities to BOQ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
