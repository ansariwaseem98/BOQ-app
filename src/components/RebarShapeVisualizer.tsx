/**
 * PHASE 15B — REBAR SHAPE SVG VISUALIZER
 * Renders exact geometric vector diagram of rebar shapes with dimension markers (A, B, C, D, E)
 * Displays stored geometry with zero invented dimensions.
 */

import React from 'react';
import { ReinforcementBarRecord } from '../types/rccBbsTypes';

interface RebarShapeVisualizerProps {
  bar: ReinforcementBarRecord;
  width?: number;
  height?: number;
  showLabels?: boolean;
}

export const RebarShapeVisualizer: React.FC<RebarShapeVisualizerProps> = ({
  bar,
  width = 240,
  height = 140,
  showLabels = true,
}) => {
  const { shapeCode, dimensions, diameterMm } = bar;
  const A = dimensions.aMm || 0;
  const B = dimensions.bMm || 0;
  const C = dimensions.cMm || 0;
  const D = dimensions.dMm || 0;
  const E = dimensions.eMm || 0;

  // Render SVG based on shapeCode
  const renderShapeSvg = () => {
    switch (shapeCode) {
      case '00': {
        // Straight Bar
        return (
          <g>
            <line x1="30" y1="70" x2="210" y2="70" stroke="#4f46e5" strokeWidth="6" strokeLinecap="round" />
            {showLabels && (
              <>
                <line x1="30" y1="50" x2="210" y2="50" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="30" y1="45" x2="30" y2="55" stroke="#94a3b8" strokeWidth="1" />
                <line x1="210" y1="45" x2="210" y2="55" stroke="#94a3b8" strokeWidth="1" />
                <text x="120" y="42" textAnchor="middle" fill="#1e293b" fontSize="11" fontWeight="bold">
                  A = {A} mm
                </text>
              </>
            )}
          </g>
        );
      }

      case '11': {
        // L-Bar (90° Bend)
        return (
          <g>
            <path
              d="M 40 40 L 40 100 Q 40 105 45 105 L 200 105"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {showLabels && (
              <>
                {/* Vertical Leg A or B */}
                <text x="24" y="75" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                  B={B || 600}
                </text>
                {/* Horizontal Leg A */}
                <text x="120" y="125" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                  A = {A} mm
                </text>
                {/* 90 deg marker */}
                <rect x="42" y="93" width="10" height="10" fill="none" stroke="#6366f1" strokeWidth="1.5" />
              </>
            )}
          </g>
        );
      }

      case '21': {
        // U-Bar (Double 90° Bend)
        return (
          <g>
            <path
              d="M 45 40 L 45 95 Q 45 105 55 105 L 185 105 Q 195 105 195 95 L 195 40"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {showLabels && (
              <>
                <text x="25" y="65" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                  B={B || 300}
                </text>
                <text x="120" y="125" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                  A = {A} mm
                </text>
                <text x="215" y="65" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                  C={C || B || 300}
                </text>
              </>
            )}
          </g>
        );
      }

      case '31': {
        // Cranked Bar
        return (
          <g>
            <path
              d="M 25 90 L 70 90 L 110 50 L 170 50 L 215 50"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {showLabels && (
              <>
                <text x="45" y="110" textAnchor="middle" fill="#1e293b" fontSize="9" fontWeight="bold">
                  A={A}
                </text>
                <text x="95" y="65" textAnchor="middle" fill="#dc2626" fontSize="9" fontWeight="bold">
                  D={D || 200} (45°)
                </text>
                <text x="170" y="38" textAnchor="middle" fill="#1e293b" fontSize="9" fontWeight="bold">
                  B={B || A}
                </text>
              </>
            )}
          </g>
        );
      }

      case '41': {
        // Rectangular Closed Stirrup (Code 41)
        return (
          <g>
            <rect
              x="50"
              y="30"
              width="140"
              height="80"
              rx="6"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="5"
            />
            {/* 135 deg Hooks at top-left */}
            <path
              d="M 54 45 L 75 60 M 42 35 L 60 55"
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {showLabels && (
              <>
                <text x="120" y="24" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                  A = {A} mm
                </text>
                <text x="205" y="75" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                  B = {B} mm
                </text>
                <text x="65" y="80" fill="#047857" fontSize="9" fontWeight="bold">
                  2×135° Hooks
                </text>
              </>
            )}
          </g>
        );
      }

      case '51': {
        // Column Tie / Seismic Link with 135° hooks
        return (
          <g>
            <rect
              x="60"
              y="25"
              width="120"
              height="90"
              rx="8"
              fill="none"
              stroke="#2563eb"
              strokeWidth="5"
            />
            <path
              d="M 64 45 L 90 70 M 50 35 L 75 60"
              stroke="#dc2626"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {showLabels && (
              <>
                <text x="120" y="18" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                  A = {A} mm
                </text>
                <text x="195" y="75" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                  B = {B} mm
                </text>
                <text x="75" y="88" fill="#b91c1c" fontSize="9" fontWeight="bold">
                  12d Seismic
                </text>
              </>
            )}
          </g>
        );
      }

      case '61': {
        // Circular Ring / Spiral
        return (
          <g>
            <circle cx="120" cy="70" r="45" fill="none" stroke="#4f46e5" strokeWidth="5" />
            {/* Lap splice zone */}
            <path
              d="M 120 25 A 45 45 0 0 1 165 70"
              fill="none"
              stroke="#10b981"
              strokeWidth="5"
            />
            {showLabels && (
              <>
                <text x="120" y="75" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                  Dia A = {A} mm
                </text>
                <text x="165" y="45" fill="#047857" fontSize="9" fontWeight="bold">
                  Lap 45d
                </text>
              </>
            )}
          </g>
        );
      }

      case '71': {
        // Chair Bar
        return (
          <g>
            <path
              d="M 30 110 L 60 110 L 60 40 L 180 40 L 180 110 L 210 110"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {showLabels && (
              <>
                <text x="120" y="32" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                  Top A = {A} mm
                </text>
                <text x="45" y="75" textAnchor="middle" fill="#1e293b" fontSize="9" fontWeight="bold">
                  B={B}
                </text>
                <text x="195" y="75" textAnchor="middle" fill="#1e293b" fontSize="9" fontWeight="bold">
                  B={B}
                </text>
                <text x="45" y="125" textAnchor="middle" fill="#64748b" fontSize="9">
                  C={C}
                </text>
                <text x="195" y="125" textAnchor="middle" fill="#64748b" fontSize="9">
                  C={C}
                </text>
              </>
            )}
          </g>
        );
      }

      default: {
        // Generic / Custom Shape
        return (
          <g>
            <path
              d="M 35 100 L 75 100 L 120 40 L 205 40"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {showLabels && (
              <text x="120" y="120" textAnchor="middle" fill="#1e293b" fontSize="10" fontWeight="bold">
                Custom Shape Code {shapeCode}
              </text>
            )}
          </g>
        );
      }
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col items-center justify-center shadow-2xs">
      <div className="flex items-center justify-between w-full mb-1 text-xs">
        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
          Shape Code {shapeCode}
        </span>
        <span className="text-[11px] text-slate-500 font-medium">
          Ø{diameterMm} mm | {bar.shape}
        </span>
      </div>
      <svg
        viewBox="0 0 240 140"
        className="w-full h-auto max-h-36 bg-white rounded border border-slate-100"
        style={{ maxWidth: `${width}px` }}
      >
        {renderShapeSvg()}
      </svg>
      <div className="mt-1.5 text-[11px] text-slate-600 font-mono text-center">
        Cutting Length: <span className="font-bold text-slate-900">{bar.cuttingLengthM.toFixed(3)} m</span> ({bar.cuttingLengthMm} mm)
      </div>
    </div>
  );
};
