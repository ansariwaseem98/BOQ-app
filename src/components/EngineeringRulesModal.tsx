import React, { useState } from 'react';
import { ProjectEngineeringRules } from '../types';
import {
  X,
  Settings,
  Save,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getDefaultEngineeringRules } from '../engine/takeoffCalculationEngine';

interface EngineeringRulesModalProps {
  isOpen: boolean;
  rules: ProjectEngineeringRules;
  onClose: () => void;
  onSave: (updatedRules: ProjectEngineeringRules) => void;
}

export const EngineeringRulesModal: React.FC<EngineeringRulesModalProps> = ({
  isOpen,
  rules,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  const [localRules, setLocalRules] = useState<ProjectEngineeringRules>(
    JSON.parse(JSON.stringify(rules))
  );

  const handleResetDefaults = () => {
    setLocalRules(getDefaultEngineeringRules(rules.projectId));
  };

  const handleSave = () => {
    onSave(localRules);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-950/80 border border-indigo-700/50 rounded-lg text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Project Engineering Rules & Standards
              </h2>
              <p className="text-xs text-slate-400">
                Configure measurement rules, deduction thresholds, rounding precision & reinforcement conventions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Rounding Precision */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>1. Rounding Rules & Decimal Precision</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Concrete Volume (m³)
                </label>
                <select
                  value={localRules.rounding.concreteVolumeDecimals}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      rounding: {
                        ...localRules.rounding,
                        concreteVolumeDecimals: parseInt(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                >
                  <option value="2">2 Decimals (0.00 m³)</option>
                  <option value="3">3 Decimals (0.000 m³) — Standard</option>
                  <option value="4">4 Decimals (0.0000 m³)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Surface Area (m²)
                </label>
                <select
                  value={localRules.rounding.areaDecimals}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      rounding: {
                        ...localRules.rounding,
                        areaDecimals: parseInt(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                >
                  <option value="1">1 Decimal (0.0 m²)</option>
                  <option value="2">2 Decimals (0.00 m²) — Standard</option>
                  <option value="3">3 Decimals (0.000 m²)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Linear Length (m)
                </label>
                <select
                  value={localRules.rounding.linearLengthDecimals}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      rounding: {
                        ...localRules.rounding,
                        linearLengthDecimals: parseInt(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                >
                  <option value="2">2 Decimals (0.00 m)</option>
                  <option value="3">3 Decimals (0.000 m)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Steel Weight (Tonnes / kg)
                </label>
                <select
                  value={localRules.rounding.steelWeightDecimals}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      rounding: {
                        ...localRules.rounding,
                        steelWeightDecimals: parseInt(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                >
                  <option value="2">2 Decimals (0.00 kg)</option>
                  <option value="3">3 Decimals (0.000 Tonnes)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Deduction Threshold Rules */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>2. Deductions & Openings Standards (IS 1200 / POMI / NRM2)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Concrete Opening Threshold
                </label>
                <select
                  value={localRules.deductions.concreteOpeningThresholdM2}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      deductions: {
                        ...localRules.deductions,
                        concreteOpeningThresholdM2: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                >
                  <option value="0">Deduct All Openings (&gt; 0.0 m²)</option>
                  <option value="0.1">Deduct Openings &gt; 0.10 m² (IS 1200 / POMI)</option>
                  <option value="0.5">Deduct Openings &gt; 0.50 m²</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Masonry Opening Threshold
                </label>
                <select
                  value={localRules.deductions.masonryOpeningThresholdM2}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      deductions: {
                        ...localRules.deductions,
                        masonryOpeningThresholdM2: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                >
                  <option value="0.1">Deduct Openings &gt; 0.10 m²</option>
                  <option value="0.5">Deduct Openings &gt; 0.50 m²</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Plaster & Paint Opening Threshold
                </label>
                <select
                  value={localRules.deductions.plasterOpeningThresholdM2}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      deductions: {
                        ...localRules.deductions,
                        plasterOpeningThresholdM2: parseFloat(e.target.value),
                        paintOpeningThresholdM2: parseFloat(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                >
                  <option value="0.5">Deduct Openings &gt; 0.50 m² (Standard)</option>
                  <option value="3.0">Deduct Openings &gt; 3.00 m² (IS 1200 Part 12)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Reinforcement Standards */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>3. Reinforcement Calculation Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Unit Weight Formula
                </label>
                <select
                  value={localRules.reinforcement.unitWeightFormula}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      reinforcement: {
                        ...localRules.reinforcement,
                        unitWeightFormula: e.target.value as any
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                >
                  <option value="STANDARD_D2_162">d² / 162.2 kg/m (Metric Theoretical)</option>
                  <option value="BS4449_TABLE">BS 4449 Nominal Mass Table</option>
                  <option value="ASTM_A615_TABLE">ASTM A615 Standard Table</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Bar Count Along Span Rule
                </label>
                <select
                  value={localRules.reinforcement.spacingRule}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      reinforcement: {
                        ...localRules.reinforcement,
                        spacingRule: e.target.value as any
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                >
                  <option value="CEIL_PLUS_ONE">ceil(Span / Spacing) + 1 (Conservative)</option>
                  <option value="EXACT_RATIO">round(Span / Spacing)</option>
                  <option value="FLOOR_PLUS_ONE">floor(Span / Spacing) + 1</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Default Lap Length Multiplier
                </label>
                <select
                  value={localRules.reinforcement.defaultLapMultiplier}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      reinforcement: {
                        ...localRules.reinforcement,
                        defaultLapMultiplier: parseInt(e.target.value)
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                >
                  <option value="40">40 × Bar Diameter (d)</option>
                  <option value="48">48 × Bar Diameter (d)</option>
                  <option value="50">50 × Bar Diameter (d) — Standard</option>
                  <option value="60">60 × Bar Diameter (d)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Default Wastage Percentages */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>4. Default Wastage Percentages for Tender Quantities</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Concrete (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={localRules.wastageRates.concretePct}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      wastageRates: {
                        ...localRules.wastageRates,
                        concretePct: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Masonry Blocks (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={localRules.wastageRates.masonryBlocksPct}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      wastageRates: {
                        ...localRules.wastageRates,
                        masonryBlocksPct: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Tiles & Finishes (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={localRules.wastageRates.tilesFinishesPct}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      wastageRates: {
                        ...localRules.wastageRates,
                        tilesFinishesPct: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Roof Sheets (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={localRules.wastageRates.roofSheetsPct}
                  onChange={(e) =>
                    setLocalRules({
                      ...localRules,
                      wastageRates: {
                        ...localRules.wastageRates,
                        roofSheetsPct: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Standard Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>SAVE & RECALCULATE ENTIRE TAKEOFF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
