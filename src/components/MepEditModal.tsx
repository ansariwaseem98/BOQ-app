import React, { useState } from 'react';
import { GeneralMEPElement, MEPAuditRecord } from '../types';
import { MEPEngine } from '../engine/mepEngine';

interface MepEditModalProps {
  element: GeneralMEPElement;
  onClose: () => void;
  onSave: (updatedElement: GeneralMEPElement) => void;
}

export const MepEditModal: React.FC<MepEditModalProps> = ({
  element,
  onClose,
  onSave,
}) => {
  const [tag, setTag] = useState(element.tag);
  const [description, setDescription] = useState(element.description);
  const [size, setSize] = useState(element.size || '');
  const [material, setMaterial] = useState(element.material || '');
  const [ratingOrCapacity, setRatingOrCapacity] = useState(element.ratingOrCapacity || '');
  const [lengthM, setLengthM] = useState<number>(element.lengthM || 0);
  const [quantity, setQuantity] = useState<number>(element.quantity || 1);
  const [unit, setUnit] = useState(element.unit);
  const [reason, setReason] = useState('Senior QS adjustment based on site coordination');

  // Allowances state
  const [panelAllowance, setPanelAllowance] = useState<number>(
    element.allowanceBreakdown?.find(a => a.label.includes('Panel'))?.value || 0
  );
  const [equipAllowance, setEquipAllowance] = useState<number>(
    element.allowanceBreakdown?.find(a => a.label.includes('Equipment') || a.label.includes('Sub-DB'))?.value || 0
  );
  const [verticalAllowance, setVerticalAllowance] = useState<number>(
    element.allowanceBreakdown?.find(a => a.label.includes('Vertical'))?.value || 0
  );
  const [slackAllowance, setSlackAllowance] = useState<number>(
    element.allowanceBreakdown?.find(a => a.label.includes('Slack'))?.value || 0
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let updatedLength = lengthM;
    let updatedFormula = element.formulaWithValues;
    let allowances = element.allowanceBreakdown;

    if (element.discipline === 'Electrical' && element.subSystem.includes('Cable')) {
      const calc = MEPEngine.calculateCableLength({
        baseRouteLengthM: lengthM,
        panelTerminationAllowanceM: panelAllowance,
        equipmentTerminationAllowanceM: equipAllowance,
        verticalRiseDropAllowanceM: verticalAllowance,
        slackAllowanceM: slackAllowance,
      });
      updatedLength = calc.totalLengthM;
      updatedFormula = calc.formulaWithValues;
      allowances = calc.allowances;
    } else if (element.discipline === 'HVAC' && element.unit === 'm²' && size.includes('x')) {
      const parts = size.replace(/mm/g, '').split('x').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const calc = MEPEngine.calculateRectangularDuctArea({
          widthMm: parts[0],
          heightMm: parts[1],
          lengthM: lengthM,
        });
        updatedFormula = calc.formulaWithValues;
        updatedLength = calc.surfaceAreaM2;
      }
    } else {
      updatedFormula = `User Override: ${lengthM > 0 ? `${lengthM} ${unit}` : `${quantity} ${unit}`} (${reason})`;
    }

    const auditEntry: MEPAuditRecord = {
      id: `AUD-MOD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Lead Estimator (User Override)',
      action: 'MODIFIED',
      previousValue: element.lengthM || element.quantity,
      newValue: updatedLength || quantity,
      newFormula: updatedFormula,
      reason,
    };

    const updatedElement: GeneralMEPElement = {
      ...element,
      tag,
      description,
      size,
      material,
      ratingOrCapacity,
      lengthM: updatedLength > 0 ? updatedLength : undefined,
      quantity,
      unit,
      formulaWithValues: updatedFormula,
      allowanceBreakdown: allowances,
      verificationStatus: 'user_input',
      isBlocked: false,
      blockedReason: undefined,
      auditTrail: [auditEntry, ...(element.auditTrail || [])],
    };

    onSave(updatedElement);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-mono font-bold rounded-md">
              EDIT MEP
            </span>
            <div>
              <h3 className="text-base font-bold font-mono">
                {element.tag} ({element.discipline})
              </h3>
              <p className="text-xs text-slate-300">
                Update parameters & recalculate takeoff
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Element Tag
              </label>
              <input
                type="text"
                value={tag}
                onChange={e => setTag(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Size / Diameter
              </label>
              <input
                type="text"
                value={size}
                onChange={e => setSize(e.target.value)}
                placeholder="e.g. DN100, 800x400mm, 4C x 35mm²"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Specification Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Length (m) / Base Route
              </label>
              <input
                type="number"
                step="0.01"
                value={lengthM}
                onChange={e => setLengthM(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Discrete Quantity (No.)
              </label>
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={e => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500"
              >
                <option value="m">m (Running Length)</option>
                <option value="m²">m² (Surface Area)</option>
                <option value="No.">No. (Count)</option>
                <option value="Set">Set (Assembly)</option>
                <option value="Lot">Lot (Lump Sum)</option>
              </select>
            </div>
          </div>

          {/* Allowances section for cables & piping */}
          {element.discipline === 'Electrical' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                Cable Termination & Route Allowances (m)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Panel Term.</label>
                  <input
                    type="number"
                    step="0.1"
                    value={panelAllowance}
                    onChange={e => setPanelAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Equip Term.</label>
                  <input
                    type="number"
                    step="0.1"
                    value={equipAllowance}
                    onChange={e => setEquipAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Vertical Rise</label>
                  <input
                    type="number"
                    step="0.1"
                    value={verticalAllowance}
                    onChange={e => setVerticalAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Route Slack</label>
                  <input
                    type="number"
                    step="0.1"
                    value={slackAllowance}
                    onChange={e => setSlackAllowance(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-mono font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Material Specification
              </label>
              <input
                type="text"
                value={material}
                onChange={e => setMaterial(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Rating / Capacity / Duty
              </label>
              <input
                type="text"
                value={ratingOrCapacity}
                onChange={e => setRatingOrCapacity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Reason for Modification (Audit Log Rationale)
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 border border-amber-300 bg-amber-50/50 rounded-lg text-xs text-amber-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="bg-slate-50 px-6 py-3 -mx-6 -mb-6 mt-6 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 shadow-xs transition-colors"
            >
              Save & Recalculate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
