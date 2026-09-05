/**
 * AI BOQ & Tender Estimation Engineer - Phase 15A Professional Measurement & Calculation Engine
 * Deterministic Safe Math Core, Unit Normalizer, Safe Formula Parser, Deduction Engine & Dependency Graph
 */

import {
  CalculationObject,
  CalculationInput,
  CalculationDeduction,
  CalculationAuditEntry,
  CalculationStatus,
  RoundingRule,
  ProjectMeasurementSettings,
  CalculationTemplate,
  DependencyNode,
  DownstreamImpactResult,
  BoqAggregatedQuantityRecord,
} from '../types/measurementEngine';

// ============================================================================
// 1. DETERMINISTIC UNIT NORMALIZER & CONVERTER
// ============================================================================

export class UnitConversionEngine {
  /**
   * Normalize any length unit to meters (m)
   */
  static normalizeLength(val: number, unit: string): { normalizedValue: number; normalizedUnit: string; error?: string } {
    const u = unit.trim().toLowerCase();
    switch (u) {
      case 'm':
      case 'meter':
      case 'meters':
      case 'metre':
      case 'metres':
        return { normalizedValue: val, normalizedUnit: 'm' };
      case 'mm':
      case 'millimeter':
      case 'millimeters':
      case 'millimetre':
        return { normalizedValue: val / 1000, normalizedUnit: 'm' };
      case 'cm':
      case 'centimeter':
      case 'centimeters':
      case 'centimetre':
        return { normalizedValue: val / 100, normalizedUnit: 'm' };
      case 'ft':
      case 'feet':
      case 'foot':
      case "'":
        return { normalizedValue: val * 0.3048, normalizedUnit: 'm' };
      case 'in':
      case 'inch':
      case 'inches':
      case '"':
        return { normalizedValue: val * 0.0254, normalizedUnit: 'm' };
      default:
        return { normalizedValue: val, normalizedUnit: unit, error: `Unknown length unit: "${unit}". Unit must not be assumed.` };
    }
  }

  /**
   * Convert normalized meter to target length unit
   */
  static fromMeters(valInMeters: number, targetUnit: string): number {
    const u = targetUnit.trim().toLowerCase();
    switch (u) {
      case 'm':
        return valInMeters;
      case 'mm':
        return valInMeters * 1000;
      case 'cm':
        return valInMeters * 100;
      case 'ft':
        return valInMeters / 0.3048;
      case 'in':
        return valInMeters / 0.0254;
      default:
        return valInMeters;
    }
  }

  /**
   * Normalize Area unit to square meters (m²)
   */
  static normalizeArea(val: number, unit: string): { normalizedValue: number; normalizedUnit: string; error?: string } {
    const u = unit.trim().toLowerCase();
    switch (u) {
      case 'm²':
      case 'm2':
      case 'sqm':
      case 'sq.m':
      case 'sq m':
        return { normalizedValue: val, normalizedUnit: 'm²' };
      case 'mm²':
      case 'mm2':
      case 'sqmm':
        return { normalizedValue: val / 1_000_000, normalizedUnit: 'm²' };
      case 'cm²':
      case 'cm2':
      case 'sqcm':
        return { normalizedValue: val / 10_000, normalizedUnit: 'm²' };
      case 'ft²':
      case 'ft2':
      case 'sqft':
      case 'sq.ft':
        return { normalizedValue: val * 0.09290304, normalizedUnit: 'm²' };
      default:
        return { normalizedValue: val, normalizedUnit: unit, error: `Unknown area unit: "${unit}". Unit must not be assumed.` };
    }
  }

  /**
   * Normalize Volume unit to cubic meters (m³)
   */
  static normalizeVolume(val: number, unit: string): { normalizedValue: number; normalizedUnit: string; error?: string } {
    const u = unit.trim().toLowerCase();
    switch (u) {
      case 'm³':
      case 'm3':
      case 'cum':
      case 'cu.m':
      case 'cu m':
        return { normalizedValue: val, normalizedUnit: 'm³' };
      case 'mm³':
      case 'mm3':
      case 'cumm':
        return { normalizedValue: val / 1_000_000_000, normalizedUnit: 'm³' };
      case 'cm³':
      case 'cm3':
      case 'cucm':
        return { normalizedValue: val / 1_000_000, normalizedUnit: 'm³' };
      case 'ft³':
      case 'ft3':
      case 'cuft':
      case 'cu.ft':
        return { normalizedValue: val * 0.028316846592, normalizedUnit: 'm³' };
      default:
        return { normalizedValue: val, normalizedUnit: unit, error: `Unknown volume unit: "${unit}". Unit must not be assumed.` };
    }
  }

  /**
   * Normalize Weight to kilograms (kg) or metric tonnes (tonne)
   */
  static normalizeWeight(val: number, unit: string): { normalizedValue: number; normalizedUnit: string; error?: string } {
    const u = unit.trim().toLowerCase();
    switch (u) {
      case 'kg':
      case 'kgs':
      case 'kilogram':
      case 'kilograms':
        return { normalizedValue: val, normalizedUnit: 'kg' };
      case 'g':
      case 'gm':
      case 'gram':
      case 'grams':
        return { normalizedValue: val / 1000, normalizedUnit: 'kg' };
      case 't':
      case 'ton':
      case 'tonne':
      case 'tonnes':
      case 'mt':
        return { normalizedValue: val * 1000, normalizedUnit: 'kg' };
      default:
        return { normalizedValue: val, normalizedUnit: unit, error: `Unknown weight unit: "${unit}". Unit must not be assumed.` };
    }
  }

  /**
   * Generic unit normalizer router
   */
  static normalizeInput(value: number, rawUnit: string): { normalizedValue: number; normalizedUnit: string; error?: string } {
    if (!rawUnit || rawUnit.trim() === '' || rawUnit.toLowerCase() === 'unknown') {
      return {
        normalizedValue: value,
        normalizedUnit: 'UNKNOWN',
        error: 'Unit is unknown. Engineering safety rules forbid assuming missing units.',
      };
    }

    const u = rawUnit.trim().toLowerCase();
    if (['mm', 'cm', 'm', 'ft', 'in', 'meter', 'millimeter', 'feet', 'inch'].includes(u)) {
      return this.normalizeLength(value, rawUnit);
    }
    if (['m²', 'm2', 'sqm', 'mm²', 'cm²', 'ft²', 'sqft'].includes(u)) {
      return this.normalizeArea(value, rawUnit);
    }
    if (['m³', 'm3', 'cum', 'mm³', 'cm³', 'ft³', 'cuft'].includes(u)) {
      return this.normalizeVolume(value, rawUnit);
    }
    if (['kg', 'g', 'tonne', 't', 'mt', 'ton'].includes(u)) {
      return this.normalizeWeight(value, rawUnit);
    }
    if (['degree', 'deg', 'rad', 'radian'].includes(u)) {
      return { normalizedValue: value, normalizedUnit: u.startsWith('deg') ? 'deg' : 'rad' };
    }
    if (['nr', 'no', 'nos', 'pcs', 'ea', 'each', 'item', 'items', 'count', 'set', 'sets'].includes(u)) {
      return { normalizedValue: value, normalizedUnit: 'nr' };
    }
    if (['%'].includes(u)) {
      return { normalizedValue: value, normalizedUnit: '%' };
    }

    // Return as-is if recognized custom
    return { normalizedValue: value, normalizedUnit: rawUnit };
  }
}

// ============================================================================
// 2. SAFE FORMULA EVALUATOR (Deterministic Recursive Descent / AST Tokenizer)
// ============================================================================

export interface Token {
  type: 'NUMBER' | 'IDENTIFIER' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'COMMA';
  value: string;
}

export class SafeFormulaEngine {
  /**
   * Tokenize mathematical expression
   */
  static tokenize(expression: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    const cleanExpr = expression.replace(/×/g, '*').replace(/÷/g, '/');

    while (i < cleanExpr.length) {
      const char = cleanExpr[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (/[0-9.]/.test(char)) {
        let numStr = '';
        while (i < cleanExpr.length && /[0-9.]/.test(cleanExpr[i])) {
          numStr += cleanExpr[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: numStr });
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let idStr = '';
        while (i < cleanExpr.length && /[a-zA-Z0-9_]/.test(cleanExpr[i])) {
          idStr += cleanExpr[i];
          i++;
        }
        tokens.push({ type: 'IDENTIFIER', value: idStr });
        continue;
      }

      if (['+', '-', '*', '/', '^', '%'].includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char });
        i++;
        continue;
      }

      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }

      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }

      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
        continue;
      }

      throw new Error(`Unsupported character in formula: "${char}" at position ${i}`);
    }

    return tokens;
  }

  /**
   * Safe recursive descent parser evaluating variables and built-in functions
   */
  static evaluate(
    expression: string,
    variables: Record<string, number> = {}
  ): { result: number; error?: string } {
    try {
      const tokens = this.tokenize(expression);
      if (tokens.length === 0) return { result: 0 };

      let pos = 0;

      const peek = (): Token | undefined => tokens[pos];
      const consume = (): Token => tokens[pos++];

      // Parser grammar hierarchy:
      // Expression = Term (( '+' | '-' ) Term)*
      // Term = Factor (( '*' | '/' | '%' ) Factor)*
      // Factor = Power ( '^' Power )*
      // Power = Unary
      // Unary = '-' Unary | Primary
      // Primary = NUMBER | IDENTIFIER | IDENTIFIER '(' args ')' | '(' Expression ')'

      function parseExpression(): number {
        let val = parseTerm();
        while (peek() && (peek()!.value === '+' || peek()!.value === '-')) {
          const op = consume().value;
          const right = parseTerm();
          if (op === '+') val += right;
          if (op === '-') val -= right;
        }
        return val;
      }

      function parseTerm(): number {
        let val = parseFactor();
        while (peek() && (peek()!.value === '*' || peek()!.value === '/' || peek()!.value === '%')) {
          const op = consume().value;
          const right = parseFactor();
          if (op === '*') val *= right;
          if (op === '/') {
            if (Math.abs(right) < 1e-15) {
              throw new Error('Division by zero encountered in formula execution');
            }
            val /= right;
          }
          if (op === '%') val %= right;
        }
        return val;
      }

      function parseFactor(): number {
        let val = parseUnary();
        while (peek() && peek()!.value === '^') {
          consume();
          const exponent = parseUnary();
          val = Math.pow(val, exponent);
        }
        return val;
      }

      function parseUnary(): number {
        if (peek() && peek()!.value === '-') {
          consume();
          return -parseUnary();
        }
        if (peek() && peek()!.value === '+') {
          consume();
          return parseUnary();
        }
        return parsePrimary();
      }

      function parsePrimary(): number {
        const token = peek();
        if (!token) throw new Error('Unexpected end of formula');

        if (token.type === 'NUMBER') {
          consume();
          const n = parseFloat(token.value);
          if (isNaN(n)) throw new Error(`Invalid number: ${token.value}`);
          return n;
        }

        if (token.type === 'LPAREN') {
          consume();
          const val = parseExpression();
          if (!peek() || peek()!.type !== 'RPAREN') {
            throw new Error('Mismatched parentheses: missing closing ")"');
          }
          consume();
          return val;
        }

        if (token.type === 'IDENTIFIER') {
          const id = consume().value;
          const upperId = id.toUpperCase();

          // Built-in Constants
          if (upperId === 'PI') return Math.PI;
          if (upperId === 'E') return Math.E;

          // Function call check: function_name '(' args ')'
          if (peek() && peek()!.type === 'LPAREN') {
            consume(); // eat '('
            const args: number[] = [];
            if (peek() && peek()!.type !== 'RPAREN') {
              args.push(parseExpression());
              while (peek() && peek()!.type === 'COMMA') {
                consume(); // eat ','
                args.push(parseExpression());
              }
            }
            if (!peek() || peek()!.type !== 'RPAREN') {
              throw new Error(`Missing closing parenthesis for function ${id}`);
            }
            consume(); // eat ')'

            switch (upperId) {
              case 'MIN':
                if (args.length === 0) throw new Error('MIN function requires at least 1 argument');
                return Math.min(...args);
              case 'MAX':
                if (args.length === 0) throw new Error('MAX function requires at least 1 argument');
                return Math.max(...args);
              case 'ABS':
                return Math.abs(args[0] ?? 0);
              case 'ROUND':
                if (args.length === 2) {
                  const p = Math.pow(10, args[1]);
                  return Math.round((args[0] ?? 0) * p) / p;
                }
                return Math.round(args[0] ?? 0);
              case 'CEILING':
              case 'CEIL':
                return Math.ceil(args[0] ?? 0);
              case 'FLOOR':
                return Math.floor(args[0] ?? 0);
              case 'SQRT':
                if ((args[0] ?? 0) < 0) throw new Error('Cannot calculate square root of a negative value');
                return Math.sqrt(args[0] ?? 0);
              case 'COS':
                return Math.cos(args[0] ?? 0);
              case 'SIN':
                return Math.sin(args[0] ?? 0);
              case 'TAN':
                return Math.tan(args[0] ?? 0);
              default:
                throw new Error(`Unsupported function: ${id}`);
            }
          }

          // Variable lookup
          // Look up in variables dictionary (case-insensitive fallback)
          if (id in variables) {
            return variables[id];
          }
          const lowerId = id.toLowerCase();
          const matchKey = Object.keys(variables).find((k) => k.toLowerCase() === lowerId);
          if (matchKey !== undefined) {
            return variables[matchKey];
          }

          throw new Error(`Required input variable "${id}" is missing or undefined`);
        }

        throw new Error(`Unexpected token "${token.value}" in formula`);
      }

      const finalVal = parseExpression();
      if (pos < tokens.length) {
        throw new Error(`Unexpected token remaining: "${tokens[pos].value}"`);
      }

      return { result: finalVal };
    } catch (err: any) {
      return { result: 0, error: err.message || 'Formula evaluation error' };
    }
  }

  /**
   * Generate human-readable formula substitution string
   */
  static generateSubstitution(
    formula: string,
    inputs: Record<string, number>,
    precision: number = 3
  ): string {
    let sub = formula;
    // Replace variable names with their formatted numbers
    const keys = Object.keys(inputs).sort((a, b) => b.length - a.length);
    for (const k of keys) {
      const val = inputs[k];
      const formatted = typeof val === 'number' ? val.toFixed(precision).replace(/\.?0+$/, '') : String(val);
      const regex = new RegExp(`\\b${k}\\b`, 'g');
      sub = sub.replace(regex, formatted);
    }
    return sub.replace(/\*/g, ' × ').replace(/\//g, ' ÷ ');
  }
}

// ============================================================================
// 3. PRECISION & ROUNDING ENGINE
// ============================================================================

export class RoundingEngine {
  static applyRounding(value: number, rule: RoundingRule): number {
    if (isNaN(value) || !isFinite(value)) return 0;

    switch (rule) {
      case 'NONE':
        return value;
      case 'DECIMAL_2':
        return Math.round((value + Number.EPSILON) * 100) / 100;
      case 'DECIMAL_3':
        return Math.round((value + Number.EPSILON) * 1000) / 1000;
      case 'DECIMAL_4':
        return Math.round((value + Number.EPSILON) * 10000) / 10000;
      case 'INTEGER':
        return Math.round(value);
      case 'CEIL_INTEGER':
        return Math.ceil(value);
      default:
        return Math.round((value + Number.EPSILON) * 1000) / 1000;
    }
  }

  static formatDisplay(value: number, rule: RoundingRule): string {
    const rounded = this.applyRounding(value, rule);
    switch (rule) {
      case 'DECIMAL_2':
        return rounded.toFixed(2);
      case 'DECIMAL_3':
        return rounded.toFixed(3);
      case 'DECIMAL_4':
        return rounded.toFixed(4);
      case 'INTEGER':
      case 'CEIL_INTEGER':
        return rounded.toFixed(0);
      case 'NONE':
      default:
        return String(rounded);
    }
  }
}

// ============================================================================
// 4. CALCULATION & DEDUCTION CORE ENGINE
// ============================================================================

export class ProfessionalCalculationEngine {
  /**
   * Execute deterministic calculation on a CalculationObject
   */
  static executeCalculation(
    calc: CalculationObject,
    settings?: ProjectMeasurementSettings
  ): CalculationObject {
    const updated = { ...calc, qualityGate: { ...calc.qualityGate } };
    const missingInputs: string[] = [];
    const warnings: string[] = [];
    const conflicts: string[] = [];
    const openItems: string[] = [];

    // Step 1: Validate Inputs
    const variableMap: Record<string, number> = {};

    for (const inp of calc.inputs) {
      if (inp.status === 'MISSING' || inp.value === undefined || isNaN(inp.value)) {
        missingInputs.push(inp.name);
        openItems.push(`Required input "${inp.name}" is missing in drawing ${calc.drawingId || 'reference'}.`);
      } else if (inp.status === 'CONFLICT') {
        conflicts.push(`Input "${inp.name}" has conflicting sources.`);
      } else if (inp.confidence === 'LOW' || inp.status === 'UNCLEAR') {
        warnings.push(`Input "${inp.name}" has low confidence OCR or unclear dimension.`);
      }

      // Check negative dimension safety
      if (inp.value < 0 && !inp.name.toLowerCase().includes('delta')) {
        warnings.push(`Dimension "${inp.name}" cannot be negative (${inp.value} ${inp.unit}).`);
      }

      variableMap[inp.name] = inp.value;
      // Also map simple lowercase / camelCase aliases
      variableMap[inp.name.toLowerCase()] = inp.value;
      variableMap[inp.name.replace(/\s+/g, '')] = inp.value;
      variableMap[inp.name.replace(/\s+/g, '_')] = inp.value;
    }

    // Step 2: If critical inputs are missing or in conflict, stop arithmetic safely
    if (missingInputs.length > 0) {
      updated.status = 'MISSING_INPUT';
      updated.qualityGate = {
        passed: false,
        missingInputs,
        warnings,
        conflicts,
        openItems,
      };
      updated.rawResult = 0;
      updated.displayedResult = 0;
      updated.grossResult = 0;
      updated.totalDeduction = 0;
      updated.substitution = `Cannot calculate: Missing [${missingInputs.join(', ')}]`;
      return updated;
    }

    if (conflicts.length > 0) {
      updated.status = 'CONFLICT';
      updated.qualityGate = {
        passed: false,
        missingInputs,
        warnings,
        conflicts,
        openItems,
      };
      return updated;
    }

    // Step 3: Evaluate Base Formula
    const evalRes = SafeFormulaEngine.evaluate(calc.formulaExpression || calc.formula, variableMap);
    if (evalRes.error) {
      updated.status = 'REVIEW_REQUIRED';
      warnings.push(`Formula evaluation error: ${evalRes.error}`);
      updated.qualityGate = {
        passed: false,
        missingInputs,
        warnings,
        conflicts,
        openItems,
      };
      return updated;
    }

    const singleGross = evalRes.result;
    const instances = calc.instances && calc.instances > 0 ? calc.instances : 1;
    const totalGross = singleGross * instances;
    updated.grossResult = totalGross;

    // Step 4: Evaluate Deductions (Generic Deduction Engine)
    let totalDeductionVal = 0;
    const updatedDeductions: CalculationDeduction[] = [];
    const seenDeductionKeys = new Set<string>();

    for (const ded of calc.deductions || []) {
      // Check for duplicate deductions
      const dedKey = `${ded.type}_${ded.name}_${JSON.stringify(ded.inputs)}`;
      const isDup = seenDeductionKeys.has(dedKey);
      seenDeductionKeys.add(dedKey);

      let dedVal = ded.grossDeduction;
      if (ded.formula && ded.inputs) {
        const dedEval = SafeFormulaEngine.evaluate(ded.formula, ded.inputs);
        if (!dedEval.error) {
          dedVal = dedEval.result;
        }
      }

      if (isDup) {
        warnings.push(`Duplicate deduction detected: "${ded.name}". Excluded from double deduction.`);
        updatedDeductions.push({ ...ded, isDuplicate: true, grossDeduction: 0 });
      } else {
        totalDeductionVal += dedVal;
        updatedDeductions.push({ ...ded, grossDeduction: dedVal, isDuplicate: false });
      }
    }

    updated.deductions = updatedDeductions;
    updated.totalDeduction = totalDeductionVal;

    // Step 5: Deduction Safety Check (Total deductions > Gross -> INVALID DEDUCTION)
    if (totalDeductionVal > totalGross && totalGross > 0) {
      warnings.push(
        `INVALID DEDUCTION: Total deductions (${totalDeductionVal.toFixed(3)}) exceed gross quantity (${totalGross.toFixed(3)}). Negative net quantity prevented.`
      );
      updated.status = 'REVIEW_REQUIRED';
    }

    // Net Result
    const rawNet = Math.max(0, totalGross - totalDeductionVal);
    updated.rawResult = rawNet;

    // Step 6: Rounding
    const rule = calc.roundingRule || settings?.roundingRule || 'DECIMAL_3';
    updated.displayedResult = RoundingEngine.applyRounding(rawNet, rule);

    // Step 7: Formatted Substitution
    const precision = settings?.quantityPrecision || 3;
    updated.substitution = SafeFormulaEngine.generateSubstitution(
      calc.formula,
      variableMap,
      precision
    );

    if (instances > 1) {
      updated.substitution += ` × ${instances} instances`;
    }
    if (totalDeductionVal > 0) {
      updated.substitution += ` - [Deductions: ${totalDeductionVal.toFixed(precision)} ${calc.unit}]`;
    }

    // Step 8: Quality Gate and Status Assignment
    const hasWarnings = warnings.length > 0;
    if (updated.status !== 'USER_CORRECTED' && updated.status !== 'SUPERSEDED') {
      if (hasWarnings) {
        updated.status = 'REVIEW_REQUIRED';
      } else if (calc.confidence === 'HIGH' && missingInputs.length === 0 && conflicts.length === 0) {
        updated.status = 'CALCULATED';
      }
    }

    updated.qualityGate = {
      passed: missingInputs.length === 0 && conflicts.length === 0 && !hasWarnings,
      missingInputs,
      warnings,
      conflicts,
      openItems,
    };

    return updated;
  }

  /**
   * Perform live input correction with audit trail & difference calculation
   */
  static updateInput(
    calc: CalculationObject,
    inputId: string,
    newValue: number,
    user: string,
    reason: string,
    settings?: ProjectMeasurementSettings
  ): { updatedCalc: CalculationObject; auditEntry: CalculationAuditEntry } {
    const inputIndex = calc.inputs.findIndex((i) => i.inputId === inputId);
    if (inputIndex === -1) {
      throw new Error(`Input ID ${inputId} not found in calculation ${calc.calculationId}`);
    }

    const oldInput = calc.inputs[inputIndex];
    const oldValue = oldInput.value;
    const diff = newValue - oldValue;
    const diffPercent = oldValue !== 0 ? (diff / oldValue) * 100 : 0;

    const updatedInputs = [...calc.inputs];
    updatedInputs[inputIndex] = {
      ...oldInput,
      value: newValue,
      normalizedValue: newValue,
      originalValue: newValue,
      status: 'USER_CORRECTED',
      source: 'USER_CORRECTED',
      lastModified: new Date().toISOString(),
    };

    const auditEntry: CalculationAuditEntry = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      user: user || 'Senior Estimator',
      fieldChanged: `Input: ${oldInput.name}`,
      beforeValue: oldValue,
      afterValue: newValue,
      difference: diff,
      differencePercent: diffPercent,
      reason: reason || 'Dimension manual verification on site drawing',
      source: `User Edit [${oldInput.name}]`,
    };

    const updatedCalc: CalculationObject = {
      ...calc,
      inputs: updatedInputs,
      status: 'USER_CORRECTED',
      modifiedBy: user,
      modifiedDate: new Date().toISOString(),
      auditTrail: [auditEntry, ...(calc.auditTrail || [])],
    };

    const recomputed = this.executeCalculation(updatedCalc, settings);
    return { updatedCalc: recomputed, auditEntry };
  }

  /**
   * Create a new calculation revision when drawing revision updates (preserves historical)
   */
  static createRevision(
    oldCalc: CalculationObject,
    newDrawingRevision: string,
    user: string
  ): { oldSupersededCalc: CalculationObject; newRevisionCalc: CalculationObject } {
    const oldSuperseded: CalculationObject = {
      ...oldCalc,
      status: 'SUPERSEDED',
      isSuperseded: true,
      modifiedBy: user,
      modifiedDate: new Date().toISOString(),
      auditTrail: [
        {
          id: `AUDIT-SUP-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user,
          fieldChanged: 'Status',
          beforeValue: oldCalc.status,
          afterValue: 'SUPERSEDED',
          reason: `Superseded by drawing revision ${newDrawingRevision}`,
          source: 'Revision Management',
        },
        ...(oldCalc.auditTrail || []),
      ],
    };

    const newRevisionCalc: CalculationObject = {
      ...oldCalc,
      calculationId: `${oldCalc.calculationId.split('-REV-')[0]}-REV-${newDrawingRevision}`,
      revision: newDrawingRevision,
      status: 'DRAFT',
      isSuperseded: false,
      createdBy: user,
      createdDate: new Date().toISOString(),
      modifiedBy: user,
      modifiedDate: new Date().toISOString(),
      auditTrail: [
        {
          id: `AUDIT-REV-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user,
          fieldChanged: 'Drawing Revision',
          beforeValue: oldCalc.revision,
          afterValue: newDrawingRevision,
          reason: `Created new calculation branch for Revision ${newDrawingRevision}`,
          source: 'Drawing Revision Bump',
        },
      ],
    };

    return { oldSupersededCalc: oldSuperseded, newRevisionCalc };
  }
}

// ============================================================================
// 5. DEPENDENCY GRAPH & DOWNSTREAM IMPACT ANALYSIS ENGINE
// ============================================================================

export class DependencyGraphEngine {
  /**
   * Build complete dependency graph for a collection of calculations
   */
  static buildGraph(calculations: CalculationObject[]): Map<string, DependencyNode> {
    const nodeMap = new Map<string, DependencyNode>();

    for (const calc of calculations) {
      const calcNodeId = `CALC_${calc.calculationId}`;
      const inputNodeIds: string[] = [];

      // Add input nodes
      for (const inp of calc.inputs) {
        const inputNodeId = `INP_${calc.calculationId}_${inp.name.replace(/\s+/g, '_')}`;
        inputNodeIds.push(inputNodeId);

        if (!nodeMap.has(inputNodeId)) {
          nodeMap.set(inputNodeId, {
            nodeId: inputNodeId,
            type: 'INPUT',
            name: `${inp.name} (${calc.description})`,
            currentValue: inp.value,
            unit: inp.unit,
            calculationId: calc.calculationId,
            dependencies: [],
            dependents: [calcNodeId],
          });
        } else {
          const existing = nodeMap.get(inputNodeId)!;
          if (!existing.dependents.includes(calcNodeId)) {
            existing.dependents.push(calcNodeId);
          }
        }
      }

      // Add calculation node
      const boqNodeId = `BOQ_${calc.boqItemId}`;
      nodeMap.set(calcNodeId, {
        nodeId: calcNodeId,
        type: 'CALCULATION',
        name: calc.description,
        currentValue: calc.displayedResult,
        unit: calc.unit,
        calculationId: calc.calculationId,
        dependencies: inputNodeIds,
        dependents: [boqNodeId],
      });

      // Add BOQ node
      if (!nodeMap.has(boqNodeId)) {
        nodeMap.set(boqNodeId, {
          nodeId: boqNodeId,
          type: 'BOQ_ITEM',
          name: `BOQ: ${calc.itemCode || calc.boqItemId}`,
          currentValue: calc.displayedResult,
          unit: calc.unit,
          dependencies: [calcNodeId],
          dependents: [`COST_${calc.boqItemId}`],
        });
      } else {
        const existingBoq = nodeMap.get(boqNodeId)!;
        if (!existingBoq.dependencies.includes(calcNodeId)) {
          existingBoq.dependencies.push(calcNodeId);
        }
      }

      // Add Cost Node
      const costNodeId = `COST_${calc.boqItemId}`;
      if (!nodeMap.has(costNodeId)) {
        nodeMap.set(costNodeId, {
          nodeId: costNodeId,
          type: 'COST',
          name: `Total Cost: ${calc.itemCode || calc.boqItemId}`,
          currentValue: 0,
          unit: 'AED',
          dependencies: [boqNodeId],
          dependents: [],
        });
      }
    }

    return nodeMap;
  }

  /**
   * Analyze downstream impact when an input changes
   */
  static analyzeDownstreamImpact(
    calculations: CalculationObject[],
    targetCalcId: string,
    inputName: string,
    newValue: number,
    unitRates: Record<string, number> = {}
  ): DownstreamImpactResult {
    const targetCalc = calculations.find((c) => c.calculationId === targetCalcId);
    if (!targetCalc) {
      throw new Error(`Calculation ${targetCalcId} not found`);
    }

    const targetInput = targetCalc.inputs.find(
      (i) => i.name.toLowerCase() === inputName.toLowerCase() || i.inputId === inputName
    );
    const oldValue = targetInput ? targetInput.value : 0;
    const inputUnit = targetInput ? targetInput.unit : '';

    // Simulate update on target calculation
    const updatedInputs = targetCalc.inputs.map((inp) =>
      inp.name.toLowerCase() === inputName.toLowerCase() || inp.inputId === inputName
        ? { ...inp, value: newValue, normalizedValue: newValue }
        : inp
    );

    const simulatedTarget = ProfessionalCalculationEngine.executeCalculation({
      ...targetCalc,
      inputs: updatedInputs,
    });

    // Find any other calculations that share this element / wall thickness dependency
    const affectedCalculations: DownstreamImpactResult['affectedCalculations'] = [
      {
        calculationId: targetCalc.calculationId,
        description: targetCalc.description,
        oldGross: targetCalc.grossResult,
        newGross: simulatedTarget.grossResult,
        oldNet: targetCalc.displayedResult,
        newNet: simulatedTarget.displayedResult,
        unit: targetCalc.unit,
        diffQuantity: simulatedTarget.displayedResult - targetCalc.displayedResult,
        diffPercent:
          targetCalc.displayedResult !== 0
            ? ((simulatedTarget.displayedResult - targetCalc.displayedResult) / targetCalc.displayedResult) * 100
            : 0,
      },
    ];

    // Check secondary shared calculations (e.g. Masonry wall thickness affecting Plaster, Paint, DPC)
    for (const otherCalc of calculations) {
      if (otherCalc.calculationId === targetCalcId) continue;
      // If other calculation belongs to the same element or has an input matching the name
      const hasSharedInput = otherCalc.inputs.some(
        (i) => i.name.toLowerCase() === inputName.toLowerCase() && otherCalc.elementId === targetCalc.elementId
      );

      if (hasSharedInput) {
        const otherUpdatedInputs = otherCalc.inputs.map((inp) =>
          inp.name.toLowerCase() === inputName.toLowerCase()
            ? { ...inp, value: newValue, normalizedValue: newValue }
            : inp
        );
        const simOther = ProfessionalCalculationEngine.executeCalculation({
          ...otherCalc,
          inputs: otherUpdatedInputs,
        });

        affectedCalculations.push({
          calculationId: otherCalc.calculationId,
          description: otherCalc.description,
          oldGross: otherCalc.grossResult,
          newGross: simOther.grossResult,
          oldNet: otherCalc.displayedResult,
          newNet: simOther.displayedResult,
          unit: otherCalc.unit,
          diffQuantity: simOther.displayedResult - otherCalc.displayedResult,
          diffPercent:
            otherCalc.displayedResult !== 0
              ? ((simOther.displayedResult - otherCalc.displayedResult) / otherCalc.displayedResult) * 100
              : 0,
        });
      }
    }

    // Compute Affected BOQ Items & Costs
    const affectedBoqItems: DownstreamImpactResult['affectedBoqItems'] = [];
    const boqGroupMap = new Map<string, { oldTotal: number; newTotal: number; desc: string; unit: string; code: string }>();

    for (const aff of affectedCalculations) {
      const origCalc = calculations.find((c) => c.calculationId === aff.calculationId);
      if (!origCalc) continue;
      const boqId = origCalc.boqItemId;
      const rate = unitRates[boqId] || 150; // Fallback estimate rate for impact preview

      if (!boqGroupMap.has(boqId)) {
        boqGroupMap.set(boqId, {
          oldTotal: aff.oldNet,
          newTotal: aff.newNet,
          desc: origCalc.description,
          unit: origCalc.unit,
          code: origCalc.itemCode || boqId,
        });
      } else {
        const grp = boqGroupMap.get(boqId)!;
        grp.oldTotal += aff.oldNet;
        grp.newTotal += aff.newNet;
      }
    }

    boqGroupMap.forEach((grp, boqId) => {
      const rate = unitRates[boqId] || 120;
      const oldCost = grp.oldTotal * rate;
      const newCost = grp.newTotal * rate;
      affectedBoqItems.push({
        boqItemId: boqId,
        itemCode: grp.code,
        description: grp.desc,
        oldTotalQty: grp.oldTotal,
        newTotalQty: grp.newTotal,
        unit: grp.unit,
        unitRate: rate,
        oldCost,
        newCost,
        costDiff: newCost - oldCost,
      });
    });

    const unaffectedCount = calculations.length - affectedCalculations.length;

    return {
      inputName,
      oldValue,
      newValue,
      unit: inputUnit,
      affectedCalculations,
      affectedBoqItems,
      unaffectedCount,
    };
  }
}

// ============================================================================
// 6. BOQ AGGREGATION ENGINE (Strict Verification Isolation)
// ============================================================================

export class BoqAggregationEngine {
  /**
   * Aggregate calculation items into BOQ items, strictly isolating unverified or conflict items
   */
  static aggregateCalculations(
    calculations: CalculationObject[],
    rates: Record<string, number> = {},
    currency: string = 'AED'
  ): BoqAggregatedQuantityRecord[] {
    const itemMap = new Map<string, BoqAggregatedQuantityRecord>();

    for (const calc of calculations) {
      // Exclude superseded items from current BOQ
      if (calc.status === 'SUPERSEDED' || calc.isSuperseded) continue;

      const boqId = calc.boqItemId;
      if (!itemMap.has(boqId)) {
        itemMap.set(boqId, {
          boqItemId: boqId,
          itemCode: calc.itemCode || boqId,
          description: calc.description,
          unit: calc.unit,
          totalQuantity: 0,
          verifiedQuantity: 0,
          pendingReviewQuantity: 0,
          calculationsCount: 0,
          calculations: [],
          unitRate: rates[boqId] || 0,
          totalAmount: 0,
          currency,
          status: 'ALL_VERIFIED',
        });
      }

      const rec = itemMap.get(boqId)!;
      rec.calculationsCount++;
      rec.calculations.push({
        calculationId: calc.calculationId,
        description: calc.description,
        quantity: calc.displayedResult,
        status: calc.status,
        formula: calc.formula,
        substitution: calc.substitution,
        sourceDrawing: calc.source || calc.drawingId,
      });

      // Sum quantities based on validation rules
      if (calc.status === 'VERIFIED' || calc.status === 'USER_CORRECTED' || calc.status === 'CALCULATED') {
        rec.verifiedQuantity += calc.displayedResult;
        rec.totalQuantity += calc.displayedResult;
      } else if (calc.status === 'REVIEW_REQUIRED' || calc.status === 'DRAFT') {
        rec.pendingReviewQuantity += calc.displayedResult;
        rec.status = 'NEEDS_REVIEW';
      } else if (calc.status === 'CONFLICT') {
        rec.status = 'HAS_CONFLICTS';
      } else if (calc.status === 'MISSING_INPUT') {
        rec.status = 'INCOMPLETE';
      }
    }

    // Calculate amounts
    const results: BoqAggregatedQuantityRecord[] = [];
    itemMap.forEach((rec) => {
      rec.totalAmount = rec.totalQuantity * (rec.unitRate || 0);
      results.push(rec);
    });

    return results;
  }
}

// ============================================================================
// 7. STANDARD ENGINEERING TEMPLATES CATALOG (20+ Templates)
// ============================================================================

export const STANDARD_CALCULATION_TEMPLATES: CalculationTemplate[] = [
  {
    templateId: 'TMPL-EXCAVATION-01',
    itemCode: 'EXC-001',
    name: 'Earthwork & Foundation Excavation',
    description: 'Volume of excavation for trenches, basements, and footings',
    category: 'EXCAVATION',
    unit: 'm³',
    measurementType: 'VOLUME',
    formula: 'Length * Width * Depth',
    formulaDisplay: 'Length × Width × Depth × Quantity',
    requiredInputs: [
      { key: 'Length', name: 'Length', unit: 'm', defaultVal: 10.0, description: 'Trench or excavation pit length' },
      { key: 'Width', name: 'Width', unit: 'm', defaultVal: 1.2, description: 'Excavation width' },
      { key: 'Depth', name: 'Depth', unit: 'm', defaultVal: 1.5, description: 'Excavation depth below natural ground level' },
    ],
    optionalInputs: [
      { key: 'WorkingSpace', name: 'Working Space', unit: 'm', defaultVal: 0.3, description: 'Additional width for formwork access' },
    ],
    deductionSupported: false,
    defaultPrecision: 3,
  },
  {
    templateId: 'TMPL-PCC-01',
    itemCode: 'CONC-PCC',
    name: 'Plain Cement Concrete (PCC) Blinding',
    description: 'Under-footing and under-slab sub-base concrete bed',
    category: 'PCC',
    unit: 'm³',
    measurementType: 'VOLUME',
    formula: 'Length * Width * Thickness',
    formulaDisplay: 'Length × Width × Thickness × Quantity',
    requiredInputs: [
      { key: 'Length', name: 'Length', unit: 'm', defaultVal: 6.0, description: 'Bed length' },
      { key: 'Width', name: 'Width', unit: 'm', defaultVal: 4.0, description: 'Bed width' },
      { key: 'Thickness', name: 'Thickness', unit: 'm', defaultVal: 0.1, description: 'PCC layer thickness (e.g. 100mm)' },
    ],
    optionalInputs: [],
    deductionSupported: false,
    defaultPrecision: 3,
  },
  {
    templateId: 'TMPL-RCC-01',
    itemCode: 'CONC-RCC',
    name: 'Reinforced Cement Concrete (RCC)',
    description: 'Structural concrete for Footings, Columns, Beams, and Slabs',
    category: 'RCC',
    unit: 'm³',
    measurementType: 'VOLUME',
    formula: 'Length * Width * Depth',
    formulaDisplay: 'Length × Width × Depth × Quantity',
    requiredInputs: [
      { key: 'Length', name: 'Length', unit: 'm', defaultVal: 5.0, description: 'Span or beam length' },
      { key: 'Width', name: 'Width', unit: 'm', defaultVal: 0.3, description: 'Cross section width' },
      { key: 'Depth', name: 'Depth', unit: 'm', defaultVal: 0.6, description: 'Cross section depth' },
    ],
    optionalInputs: [],
    deductionSupported: true,
    defaultPrecision: 3,
  },
  {
    templateId: 'TMPL-MASONRY-01',
    itemCode: 'MAS-001',
    name: 'Brick & Block Masonry Wall',
    description: 'Solid or hollow block masonry with opening deductions',
    category: 'MASONRY',
    unit: 'm³',
    measurementType: 'VOLUME',
    formula: 'Length * Height * Thickness',
    formulaDisplay: '(Length × Height × Thickness) - Opening Deductions',
    requiredInputs: [
      { key: 'Length', name: 'Length', unit: 'm', defaultVal: 6.0, description: 'Centerline or face length of wall' },
      { key: 'Height', name: 'Height', unit: 'm', defaultVal: 3.0, description: 'Clear wall height (Floor to soffit)' },
      { key: 'Thickness', name: 'Thickness', unit: 'm', defaultVal: 0.23, description: 'Wall thickness (e.g. 230mm, 200mm)' },
    ],
    optionalInputs: [],
    deductionSupported: true,
    defaultPrecision: 3,
  },
  {
    templateId: 'TMPL-PLASTER-01',
    itemCode: 'FIN-PLAS',
    name: 'Internal / External Plastering',
    description: 'Wall plastering on single or dual faces minus openings',
    category: 'PLASTER',
    unit: 'm²',
    measurementType: 'AREA',
    formula: 'Length * Height * Faces',
    formulaDisplay: '(Length × Height × Faces) - Opening Deductions',
    requiredInputs: [
      { key: 'Length', name: 'Length', unit: 'm', defaultVal: 6.0, description: 'Wall perimeter or length' },
      { key: 'Height', name: 'Height', unit: 'm', defaultVal: 3.0, description: 'Wall height' },
      { key: 'Faces', name: 'Faces', unit: 'nr', defaultVal: 2.0, description: 'Number of plastered faces (1 or 2)' },
    ],
    optionalInputs: [],
    deductionSupported: true,
    defaultPrecision: 2,
  },
  {
    templateId: 'TMPL-PAINT-01',
    itemCode: 'FIN-PNT',
    name: 'Internal & External Painting',
    description: 'Emulsion, primer, and top coat surface area',
    category: 'PAINT',
    unit: 'm²',
    measurementType: 'AREA',
    formula: 'Length * Height * Faces',
    formulaDisplay: 'Length × Height × Faces - Deductions',
    requiredInputs: [
      { key: 'Length', name: 'Length', unit: 'm', defaultVal: 6.0, description: 'Wall or ceiling length' },
      { key: 'Height', name: 'Height', unit: 'm', defaultVal: 3.0, description: 'Surface height / width' },
      { key: 'Faces', name: 'Faces', unit: 'nr', defaultVal: 1.0, description: 'Number of sides' },
    ],
    optionalInputs: [],
    deductionSupported: true,
    defaultPrecision: 2,
  },
  {
    templateId: 'TMPL-FLOOR-01',
    itemCode: 'FIN-FLR',
    name: 'Tiling & Screed Floor Finish',
    description: 'Room net floor area with deductions for columns and cutouts',
    category: 'FLOOR_FINISH',
    unit: 'm²',
    measurementType: 'AREA',
    formula: 'Length * Width',
    formulaDisplay: '(Length × Width) - Column Voids',
    requiredInputs: [
      { key: 'Length', name: 'Length', unit: 'm', defaultVal: 5.0, description: 'Clear room length' },
      { key: 'Width', name: 'Width', unit: 'm', defaultVal: 4.0, description: 'Clear room width' },
    ],
    optionalInputs: [],
    deductionSupported: true,
    defaultPrecision: 2,
  },
  {
    templateId: 'TMPL-WATERPROOF-01',
    itemCode: 'WP-001',
    name: 'Waterproofing Membrane & Upstands',
    description: 'Horizontal floor membrane plus vertical skirting upstands',
    category: 'WATERPROOFING',
    unit: 'm²',
    measurementType: 'AREA',
    formula: '(Length * Width) + (2 * (Length + Width) * UpstandHeight)',
    formulaDisplay: 'Base Area + Perimeter Upstands',
    requiredInputs: [
      { key: 'Length', name: 'Length', unit: 'm', defaultVal: 5.0, description: 'Balcony or wet area length' },
      { key: 'Width', name: 'Width', unit: 'm', defaultVal: 4.0, description: 'Wet area width' },
      { key: 'UpstandHeight', name: 'Upstand Height', unit: 'm', defaultVal: 0.3, description: 'Vertical skirting upstand height (e.g. 300mm)' },
    ],
    optionalInputs: [],
    deductionSupported: false,
    defaultPrecision: 2,
  },
  {
    templateId: 'TMPL-ROOF-01',
    itemCode: 'STL-ROOF',
    name: 'Sloped Roof Cladding & Sheeting',
    description: '3D true sloping surface area based on pitch angle',
    category: 'ROOF',
    unit: 'm²',
    measurementType: 'AREA',
    formula: '(PlanLength * PlanWidth) / COS(AngleRad)',
    formulaDisplay: 'Plan Area ÷ cos(Slope Angle)',
    requiredInputs: [
      { key: 'PlanLength', name: 'Plan Length', unit: 'm', defaultVal: 24.0, description: 'Roof ridge/eave length' },
      { key: 'PlanWidth', name: 'Plan Width', unit: 'm', defaultVal: 12.0, description: 'Plan rafter span' },
      { key: 'AngleRad', name: 'Angle (rad)', unit: 'rad', defaultVal: 0.1745, description: 'Roof slope angle (10 deg = 0.1745 rad)' },
    ],
    optionalInputs: [],
    deductionSupported: true,
    defaultPrecision: 2,
  },
  {
    templateId: 'TMPL-STEEL-01',
    itemCode: 'STL-MBR',
    name: 'Structural Steel Members (Weight)',
    description: 'Total tonnage computed from member length and section unit weight',
    category: 'STEEL',
    unit: 'kg',
    measurementType: 'WEIGHT',
    formula: 'Length * UnitWeight',
    formulaDisplay: 'Member Length × Unit Weight (kg/m) × Quantity',
    requiredInputs: [
      { key: 'Length', name: 'Length', unit: 'm', defaultVal: 8.5, description: 'Single member cut length' },
      { key: 'UnitWeight', name: 'Unit Weight', unit: 'kg/m', defaultVal: 37.2, description: 'Standard section weight (e.g. UB 203x133x30 = 30kg/m)' },
    ],
    optionalInputs: [],
    deductionSupported: false,
    defaultPrecision: 2,
  },
  {
    templateId: 'TMPL-PIPE-01',
    itemCode: 'MEP-PIPE',
    name: 'Plumbing & Drainage Piping',
    description: 'Linear running length of water supply and drainage pipework',
    category: 'PIPE',
    unit: 'm',
    measurementType: 'LINEAR',
    formula: 'Length',
    formulaDisplay: 'Pipe Run Length × Quantity',
    requiredInputs: [
      { key: 'Length', name: 'Length', unit: 'm', defaultVal: 18.5, description: 'Total centerline pipeline run' },
    ],
    optionalInputs: [],
    deductionSupported: false,
    defaultPrecision: 2,
  },
  {
    templateId: 'TMPL-DUCT-01',
    itemCode: 'MEP-DUCT',
    name: 'HVAC Sheet Metal Ducting (Surface Area)',
    description: 'Ductwork sheet metal surface area for GI fabrication',
    category: 'DUCT',
    unit: 'm²',
    measurementType: 'AREA',
    formula: '2 * (Width + Height) * Length',
    formulaDisplay: '2 × (Width + Height) × Duct Length',
    requiredInputs: [
      { key: 'Length', name: 'Length', unit: 'm', defaultVal: 12.0, description: 'Duct run length' },
      { key: 'Width', name: 'Width', unit: 'm', defaultVal: 0.6, description: 'Duct cross section width' },
      { key: 'Height', name: 'Height', unit: 'm', defaultVal: 0.4, description: 'Duct cross section height' },
    ],
    optionalInputs: [],
    deductionSupported: false,
    defaultPrecision: 2,
  },
  {
    templateId: 'TMPL-FIXTURE-01',
    itemCode: 'MEP-FIX',
    name: 'Electrical / Plumbing Fixture Count',
    description: 'Discrete unit itemized counts from drawings/schedules',
    category: 'FIXTURE',
    unit: 'nr',
    measurementType: 'COUNT',
    formula: 'Count',
    formulaDisplay: 'Verified Fixture Count',
    requiredInputs: [
      { key: 'Count', name: 'Count', unit: 'nr', defaultVal: 1.0, description: 'Instance count from schedule or plan' },
    ],
    optionalInputs: [],
    deductionSupported: false,
    defaultPrecision: 0,
  },
];

export const ENGINEERING_TEMPLATES = STANDARD_CALCULATION_TEMPLATES;
