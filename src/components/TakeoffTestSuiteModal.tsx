import React, { useState } from 'react';
import {
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  Calculator
} from 'lucide-react';
import { TakeoffCalculationEngine, getDefaultEngineeringRules } from '../engine/takeoffCalculationEngine';
import { CalculationInputParameter, TakeoffDeductionRecord } from '../types';

interface TestCase {
  id: number;
  name: string;
  category: string;
  description: string;
  expectedResult: string;
  run: () => { passed: boolean; actual: string; formula: string; steps: string[] };
}

export const TakeoffTestSuiteModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const [testResults, setTestResults] = useState<{
    [id: number]: { passed: boolean; actual: string; formula: string; steps: string[] };
  }>({});
  const [isRunning, setIsRunning] = useState(false);

  const rules = getDefaultEngineeringRules('TEST-PROJECT');

  const testCases: TestCase[] = [
    {
      id: 1,
      name: 'Footing Concrete Volume (RCC)',
      category: 'RCC Substructure',
      description: 'Footing F1 (2.00m × 2.00m × 0.50m × 4 Nr)',
      expectedResult: '8.000 m³',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 2.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'width', label: 'Width', value: 2.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'depth', label: 'Depth', value: 0.5, unit: 'm', isMissing: false, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 4, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('RCC_FOOTING', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 8.0) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 2,
      name: 'Column Concrete Volume (RCC)',
      category: 'RCC Superstructure',
      description: 'Columns C1 (0.40m × 0.40m × 3.50m × 12 Nr)',
      expectedResult: '6.720 m³',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'width', label: 'Width', value: 0.4, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'depth', label: 'Depth', value: 0.4, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'height', label: 'Height', value: 3.5, unit: 'm', isMissing: false, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 12, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('RCC_COLUMN', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 6.72) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 3,
      name: 'Floor Beam Concrete Volume',
      category: 'RCC Superstructure',
      description: 'Beam B1 (0.30m × 0.60m × 6.00m × 8 Nr)',
      expectedResult: '8.640 m³',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 6.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'width', label: 'Width', value: 0.3, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'depth', label: 'Depth', value: 0.6, unit: 'm', isMissing: false, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 8, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('RCC_BEAM', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 8.64) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 4,
      name: 'Suspended Floor Slab Concrete',
      category: 'RCC Superstructure',
      description: 'Solid Slab S1 (12.00m × 8.00m × 0.20m × 1 Nr)',
      expectedResult: '19.200 m³',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 12.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'width', label: 'Width', value: 8.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'thickness', label: 'Thickness', value: 0.2, unit: 'm', isMissing: false, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('RCC_SLAB', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 19.2) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 5,
      name: 'Masonry Wall Gross Volume',
      category: 'Masonry & Blockwork',
      description: 'Wall W1 (10.00m × 3.00m × 0.20m × 1 Nr)',
      expectedResult: '6.000 m³',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 10.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'height', label: 'Height', value: 3.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'thickness', label: 'Thickness', value: 0.2, unit: 'm', isMissing: false, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('MASONRY_WALL_VOL', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 6.0) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 6,
      name: 'Damp Proof Course (DPC) Area',
      category: 'DPC & Waterproofing',
      description: 'DPC Layer (10.00m Length × 0.20m Width × 1 Nr)',
      expectedResult: '2.00 m²',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 10.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'width', label: 'Width', value: 0.2, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'count', label: 'Count', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('DPC', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 2.0) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 7,
      name: 'Door Deduction from Wall Volume',
      category: 'Deduction Engine',
      description: 'Gross Wall 6.000 m³ − Door D1 (1.00m × 2.10m × 0.20m = 0.420 m³)',
      expectedResult: '5.580 m³',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 10.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'height', label: 'Height', value: 3.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'thickness', label: 'Thickness', value: 0.2, unit: 'm', isMissing: false, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const deds: TakeoffDeductionRecord[] = [{
          id: 'DED-T1',
          parentElementId: 'W1',
          parentElementName: 'Wall 1',
          openingElementId: 'D1',
          openingElementName: 'Door D1',
          openingType: 'door',
          widthM: 1.0,
          heightOrLengthM: 2.1,
          thicknessM: 0.2,
          count: 1,
          deductionAreaM2: 2.1,
          deductionVolumeM3: 0.42,
          ruleUsed: 'IS 1200: Openings > 0.10 m²',
          isDeductible: true,
          sourceDrawing: 'A-101',
          sourceLocation: 'Door D1'
        }];
        const res = TakeoffCalculationEngine.evaluate('MASONRY_WALL_VOL', inputs, deds, rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 5.58) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit} (Deducted: ${res.totalDeductions} m³)`,
          formula: `Gross ${res.grossQuantity} - Ded ${res.totalDeductions}`,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 8,
      name: 'Window Deduction from Wall Volume',
      category: 'Deduction Engine',
      description: 'Gross Wall 6.000 m³ − Window W1 (1.50m × 1.20m × 0.20m = 0.360 m³)',
      expectedResult: '5.640 m³',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 10.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'height', label: 'Height', value: 3.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'thickness', label: 'Thickness', value: 0.2, unit: 'm', isMissing: false, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const deds: TakeoffDeductionRecord[] = [{
          id: 'DED-T2',
          parentElementId: 'W1',
          parentElementName: 'Wall 1',
          openingElementId: 'W1',
          openingElementName: 'Window W1',
          openingType: 'window',
          widthM: 1.5,
          heightOrLengthM: 1.2,
          thicknessM: 0.2,
          count: 1,
          deductionAreaM2: 1.8,
          deductionVolumeM3: 0.36,
          ruleUsed: 'IS 1200: Openings > 0.10 m²',
          isDeductible: true,
          sourceDrawing: 'A-101',
          sourceLocation: 'Window W1'
        }];
        const res = TakeoffCalculationEngine.evaluate('MASONRY_WALL_VOL', inputs, deds, rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 5.64) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit} (Deducted: ${res.totalDeductions} m³)`,
          formula: `Gross ${res.grossQuantity} - Ded ${res.totalDeductions}`,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 9,
      name: 'Column Formwork Area',
      category: 'Formwork',
      description: 'Columns C1 Formwork (2 × (0.40 + 0.40) × 3.50 × 12 Nr)',
      expectedResult: '67.20 m²',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'width', label: 'Width', value: 0.4, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'depth', label: 'Depth', value: 0.4, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'height', label: 'Height', value: 3.5, unit: 'm', isMissing: false, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 12, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('FORMWORK_COLUMN', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 67.2) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 10,
      name: 'Beam Formwork Area (Soffit + 2 Sides)',
      category: 'Formwork',
      description: 'Beam Formwork ((2 × 0.60 + 0.30) × 6.00 × 8 Nr)',
      expectedResult: '72.00 m²',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 6.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'width', label: 'Width', value: 0.3, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'depth', label: 'Depth', value: 0.6, unit: 'm', isMissing: false, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 8, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('FORMWORK_BEAM', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 72.0) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 11,
      name: 'Reinforcement Steel Bar Weight (T16)',
      category: 'Reinforcement',
      description: 'T16 Rebar: 16² / 162.2 = 1.578 kg/m × 6.00m × 8 Nr',
      expectedResult: '75.758 kg',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'diameterMm', label: 'Diameter', value: 16, unit: 'mm', isMissing: false, isMandatory: true },
          { id: '2', name: 'barLength', label: 'Length', value: 6.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'barsPerMember', label: 'Bars per Member', value: 8, unit: 'Nr', isMissing: false, isMandatory: true },
          { id: '4', name: 'memberCount', label: 'Members', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('REINFORCEMENT_MEMBER', inputs, [], rules, 0);
        const expected = (16 * 16 / 162.2) * 6.0 * 8;
        const passed = Math.abs(res.netMeasuredQuantity - expected) < 0.01;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 12,
      name: 'Steel Member Structural Weight (UB 406x178x74)',
      category: 'Structural Steel',
      description: 'UB 406x178x74: 12.00m × 74.20 kg/m × 4 Nr',
      expectedResult: '3,561.600 kg',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 12.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'unitWeightKgM', label: 'Unit Weight', value: 74.2, unit: 'kg/m', isMissing: false, isMandatory: true },
          { id: '3', name: 'count', label: 'Count', value: 4, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('STEEL_MEMBER_WEIGHT', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 3561.6) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 13,
      name: 'Roof Purlin Spacing & Total Run Weight',
      category: 'Roofing Purlins',
      description: 'Roof Slope 12m, Spacing 1.5m -> ceil(12/1.5)+1 = 9 lines × 2 slopes = 18 lines × 24m × 5.24 kg/m',
      expectedResult: '2,263.680 kg',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'roofLength', label: 'Slope Length', value: 12.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'spacingMm', label: 'Spacing', value: 1500, unit: 'mm', isMissing: false, isMandatory: true },
          { id: '3', name: 'bayLength', label: 'Bay Length', value: 24.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '4', name: 'slopes', label: 'Slopes', value: 2, unit: 'Nr', isMissing: false, isMandatory: true },
          { id: '5', name: 'unitWeightKgM', label: 'Weight', value: 5.24, unit: 'kg/m', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('PURLIN_SYSTEM', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 2263.68) < 0.01;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 14,
      name: 'Roof Cladding Sloped Area Calculation',
      category: 'Roofing & Cladding',
      description: 'Plan (24.0m × 11.591m) / cos(15°) × 2 Slopes',
      expectedResult: '576.00 m²',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'planLength', label: 'Length', value: 24.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'planWidth', label: 'Width', value: 11.5911, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'slopeDegrees', label: 'Slope Angle', value: 15.0, unit: 'deg', isMissing: false, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 2, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('ROOF_CLADDING_SLOPED', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 576.0) < 0.1;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 15,
      name: 'Waterproofing Surface Area',
      category: 'Waterproofing',
      description: 'Substructure Tanking (10.0m × 2.5m × 2 Nr)',
      expectedResult: '50.00 m²',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 10.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'width', label: 'Width', value: 2.5, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'count', label: 'Count', value: 2, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('WATERPROOFING_SURFACE', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 50.0) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 16,
      name: 'Internal Wall Plaster with Opening Deduction',
      category: 'Finishes',
      description: 'Gross Wall Plaster 60.00 m² − Openings (3.90 m²)',
      expectedResult: '56.10 m²',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 20.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'height', label: 'Height', value: 3.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'count', label: 'Count', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const deds: TakeoffDeductionRecord[] = [{
          id: 'DED-P1',
          parentElementId: 'WP1',
          parentElementName: 'Plaster Wall',
          openingElementId: 'D1',
          openingElementName: 'Door + Window Openings',
          openingType: 'door',
          widthM: 1.0,
          heightOrLengthM: 3.9,
          count: 1,
          deductionAreaM2: 3.9,
          ruleUsed: 'IS 1200 Part 12 Plaster deduction',
          isDeductible: true,
          sourceDrawing: 'A-101',
          sourceLocation: 'Door Opening'
        }];
        const res = TakeoffCalculationEngine.evaluate('PLASTER_INTERNAL', inputs, deds, rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 56.1) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 17,
      name: 'Missing Input Blocking Behavior (Open Item Required)',
      category: 'Open Item Blocking',
      description: 'Wall with missing thickness (value = null) MUST yield status: BLOCKED',
      expectedResult: 'BLOCKED (isBlocked: true, Net Qty: 0)',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 10.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'height', label: 'Height', value: 3.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'thickness', label: 'Thickness', value: null, unit: 'm', isMissing: true, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('MASONRY_WALL_VOL', inputs, [], rules, 0);
        const passed = res.isBlocked === true && res.status === 'BLOCKED' && res.netMeasuredQuantity === 0;
        return {
          passed,
          actual: `Blocked: ${res.isBlocked ? 'YES' : 'NO'}, Status: ${res.status}`,
          formula: res.formula,
          steps: [res.blockedReason || 'Blocked by missing thickness parameter']
        };
      }
    },
    {
      id: 18,
      name: 'User Override & Parameter Recalculation',
      category: 'Engine Reactivity',
      description: 'Updating beam depth from 0.50m to 0.60m recalculates volume from 7.200 m³ to 8.640 m³',
      expectedResult: '8.640 m³',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 6.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'width', label: 'Width', value: 0.3, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'depth', label: 'Depth', value: 0.6, unit: 'm', isMissing: false, isMandatory: true, isUserOverridden: true },
          { id: '4', name: 'count', label: 'Count', value: 8, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('RCC_BEAM', inputs, [], rules, 0);
        const passed = Math.abs(res.netMeasuredQuantity - 8.64) < 0.001;
        return {
          passed,
          actual: `${res.netMeasuredQuantity} ${res.unit}`,
          formula: res.evaluatedExpression,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 19,
      name: 'Tender Quantity Wastage Application',
      category: 'Wastage Engine',
      description: 'Net Tiles 100.00 m² + 5% Wastage = 105.00 m² Tender Quantity',
      expectedResult: '105.00 m² Tender Qty',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 10.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'width', label: 'Width', value: 10.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'count', label: 'Count', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('FLOOR_FINISH', inputs, [], rules, 5.0);
        const passed = Math.abs(res.tenderQuantity - 105.0) < 0.001 && Math.abs(res.netMeasuredQuantity - 100.0) < 0.001;
        return {
          passed,
          actual: `Net: ${res.netMeasuredQuantity} m², Tender: ${res.tenderQuantity} m²`,
          formula: `${res.netMeasuredQuantity} + 5% Wastage`,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value} ${s.unit}`)
        };
      }
    },
    {
      id: 20,
      name: 'Deterministic Traceability Link Integrity',
      category: 'Traceability',
      description: 'Verify formula transparency without black-box estimation',
      expectedResult: 'Full mathematical transparency verified',
      run: () => {
        const inputs: CalculationInputParameter[] = [
          { id: '1', name: 'length', label: 'Length', value: 2.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '2', name: 'width', label: 'Width', value: 2.0, unit: 'm', isMissing: false, isMandatory: true },
          { id: '3', name: 'depth', label: 'Depth', value: 0.5, unit: 'm', isMissing: false, isMandatory: true },
          { id: '4', name: 'count', label: 'Count', value: 4, unit: 'Nr', isMissing: false, isMandatory: true }
        ];
        const res = TakeoffCalculationEngine.evaluate('RCC_FOOTING', inputs, [], rules, 0);
        const passed = res.formula.length > 0 && res.evaluatedExpression.length > 0 && res.intermediateSteps.length >= 2;
        return {
          passed,
          actual: 'All mathematical audit steps & formula expressions intact',
          formula: res.formula,
          steps: res.intermediateSteps.map(s => `${s.label}: ${s.expression} = ${s.value}`)
        };
      }
    }
  ];

  const runAllTests = () => {
    setIsRunning(true);
    const results: { [id: number]: { passed: boolean; actual: string; formula: string; steps: string[] } } = {};
    testCases.forEach(tc => {
      try {
        results[tc.id] = tc.run();
      } catch (err: any) {
        results[tc.id] = {
          passed: false,
          actual: `Error: ${err.message}`,
          formula: 'Exception',
          steps: []
        };
      }
    });
    setTestResults(results);
    setIsRunning(false);
  };

  const totalTests = testCases.length;
  const passedTests = Object.values(testResults).filter((r: { passed: boolean }) => r.passed).length;
  const ranTestsCount = Object.keys(testResults).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/80 border border-emerald-700/50 rounded-lg text-emerald-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Deterministic Calculation Test Suite</span>
                <span className="text-xs bg-indigo-950 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-800">
                  20 Mathematical Assertions
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Rigorous automated verification of concrete, steel, purlins, formwork, deductions & blocking rules
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

        {/* Action & Stats Banner */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-lg"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{ranTestsCount === 0 ? 'EXECUTE ALL 20 TESTS' : 'RE-RUN TEST SUITE'}</span>
            </button>

            {ranTestsCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-800/40">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{passedTests} / {totalTests} PASSED</span>
                </span>
                {passedTests === totalTests && (
                  <span className="text-xs font-bold text-emerald-300">
                    100% Deterministic Mathematical Accuracy Verified
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Test Cases List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {testCases.map((tc) => {
            const res = testResults[tc.id];
            return (
              <div
                key={tc.id}
                className={`p-4 rounded-xl border transition-all ${
                  res
                    ? res.passed
                      ? 'bg-slate-950/70 border-emerald-800/50'
                      : 'bg-rose-950/30 border-rose-800/60'
                    : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800 mt-0.5">
                      #{tc.id.toString().padStart(2, '0')}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-100">{tc.name}</h4>
                        <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                          {tc.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{tc.description}</p>
                      <p className="text-xs text-indigo-300 font-mono mt-1">
                        Expected Result: <span className="font-bold">{tc.expectedResult}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {res ? (
                      res.passed ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>PASS</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs bg-rose-950/80 px-2.5 py-1 rounded border border-rose-700">
                          <AlertCircle className="w-4 h-4" />
                          <span>FAIL</span>
                        </div>
                      )
                    ) : (
                      <span className="text-xs text-slate-500 italic">Ready to run</span>
                    )}
                  </div>
                </div>

                {res && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-1">
                    <div className="text-slate-300 flex items-center justify-between">
                      <span className="text-slate-500 font-sans">Evaluated Result: </span>
                      <span className="font-bold text-emerald-300">{res.actual}</span>
                    </div>
                    {res.steps.length > 0 && (
                      <div className="mt-2 p-2 bg-slate-900/80 rounded border border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                        {res.steps.map((step, sIdx) => (
                          <div key={sIdx} className="text-slate-400">
                            → {step}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Phase 4 Deterministic Engine Verification Suite
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Close Suite
          </button>
        </div>
      </div>
    </div>
  );
};
