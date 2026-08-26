/**
 * AI BOQ & Tender Estimation Engineer - Phase 15A Project Measurement Settings Modal
 */

import React, { useState } from 'react';
import {
  ProjectMeasurementSettings,
  RoundingRule,
} from '../types/measurementEngine';
import {
  Settings,
  Sliders,
  CheckCircle2,
  X,
  Lock,
  Globe,
  Hash,
  Scale,
} from 'lucide-react';

interface ProjectMeasurementSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ProjectMeasurementSettings;
  onSaveSettings: (updated: ProjectMeasurementSettings) => void;
}

export const ProjectMeasurementSettingsModal: React.FC<ProjectMeasurementSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<ProjectMeasurementSettings>({ ...settings });

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">[PROJECT MEASUREMENT SETTINGS]</h2>
              <p className="text-xs text-slate-400">Define deterministic engineering rules, precision, and standards</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Unit System */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              Standard Project Units
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Length Unit</label>
                <select
                  value={formData.lengthUnit}
                  onChange={(e) => setFormData({ ...formData, lengthUnit: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="m">Meters (m)</option>
                  <option value="mm">Millimeters (mm)</option>
                  <option value="ft">Feet (ft)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Area Unit</label>
                <select
                  value={formData.areaUnit}
                  onChange={(e) => setFormData({ ...formData, areaUnit: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="m²">Square Meters (m²)</option>
                  <option value="ft²">Square Feet (ft²)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Volume Unit</label>
                <select
                  value={formData.volumeUnit}
                  onChange={(e) => setFormData({ ...formData, volumeUnit: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="m³">Cubic Meters (m³)</option>
                  <option value="ft³">Cubic Feet (ft³)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Weight Unit</label>
                <select
                  value={formData.weightUnit}
                  onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="tonne">Metric Tonne (t)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Precision & Rounding */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              Precision & Rounding Rules
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Quantity Display Decimals</label>
                <select
                  value={formData.quantityPrecision}
                  onChange={(e) => setFormData({ ...formData, quantityPrecision: parseInt(e.target.value) as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value={2}>2 Decimals (e.g. 3.21)</option>
                  <option value={3}>3 Decimals (e.g. 3.208)</option>
                  <option value={4}>4 Decimals (e.g. 3.2085)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Rounding Rule</label>
                <select
                  value={formData.roundingRule}
                  onChange={(e) => setFormData({ ...formData, roundingRule: e.target.value as RoundingRule })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="DECIMAL_3">Standard Engineering (3 Decimals)</option>
                  <option value="DECIMAL_2">Standard Tender (2 Decimals)</option>
                  <option value="DECIMAL_4">High Precision (4 Decimals)</option>
                  <option value="INTEGER">Nearest Whole Integer</option>
                  <option value="CEIL_INTEGER">Ceiling (Round Up to Next Whole)</option>
                  <option value="NONE">No Display Rounding (Raw)</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 italic">
              Note: The calculation engine always maintains full internal raw precision; rounding is applied exclusively to final BOQ displays.
            </p>
          </div>

          {/* Measurement Standard & Deductions */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-4 space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              Measurement Rules & Standard
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Measurement Standard Framework</label>
                <select
                  value={formData.measurementStandard}
                  onChange={(e) => setFormData({ ...formData, measurementStandard: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="Custom">Custom / Project-Specific Rules</option>
                  <option value="IS1200">IS 1200 (Method of Measurement of Building Works)</option>
                  <option value="POMI">POMI (Principles of Measurement International)</option>
                  <option value="NRM2">NRM 2 (RICS New Rules of Measurement)</option>
                  <option value="CESMM4">CESMM 4 (Civil Engineering Standard Method)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Deduction Rule</label>
                <select
                  value={formData.deductionRule}
                  onChange={(e) => setFormData({ ...formData, deductionRule: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-semibold focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="STRICT_FULL_DEDUCTION">Strict Full Deduction (All openings deducted)</option>
                  <option value="STANDARD_IS1200">Standard Threshold (&gt; 0.1 m² / &gt; 0.1 m³)</option>
                  <option value="CUSTOM">Custom Engineering Rule</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div>
                <label className="text-slate-400 block mb-1">Currency Code</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-semibold focus:outline-hidden focus:border-indigo-500"
                  placeholder="USD, EUR, AED, SAR, INR"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Default Waste Allowance (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.wasteRule}
                  onChange={(e) => setFormData({ ...formData, wasteRule: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 font-semibold focus:outline-hidden focus:border-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-850 border-t border-slate-700 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>[SAVE PROJECT SETTINGS]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
