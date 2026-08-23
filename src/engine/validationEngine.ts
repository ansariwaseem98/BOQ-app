/**
 * Engineering Validation & Quality Assurance Engine
 * Detects suspicious engineering conditions, geometric anomalies and conflicting data
 */

import { DetectedElement, ValidationIssue, ProjectMeta } from '../types';

export function runEngineeringValidation(
  elements: DetectedElement[],
  projectMeta?: ProjectMeta
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Set<string>();

  elements.forEach((el) => {
    // Rule 1: Duplicate Element ID check
    if (seenIds.has(el.id)) {
      issues.push({
        id: `VAL-DUP-${el.id}`,
        ruleCode: 'RULE_DUPLICATE_ID',
        severity: 'error',
        title: `Duplicate Element ID: ${el.id}`,
        description: `Element ID '${el.id}' is used more than once across drawing schedules.`,
        elementId: el.id,
        drawingNumber: el.drawingNumber,
        suggestedCorrection: 'Ensure unique numbering prefix per floor or zone (e.g. L01-C01, L02-C01).',
      });
    }
    seenIds.add(el.id);

    // Rule 2: Zero or Negative Quantities
    if (el.calculation.netQuantity <= 0) {
      issues.push({
        id: `VAL-ZERO-${el.id}`,
        ruleCode: 'RULE_NON_POSITIVE_QTY',
        severity: 'error',
        title: `Zero or Negative Quantity: ${el.name}`,
        description: `Calculated net quantity is ${el.calculation.netQuantity} ${el.calculation.unit}. Deductions may exceed gross area/volume.`,
        elementId: el.id,
        drawingNumber: el.drawingNumber,
        suggestedCorrection: 'Verify dimensions and check if door/window deductions exceed total wall surface.',
      });
    }

    // Rule 3: Wall height vs typical floor height (typically 3.0m - 4.5m)
    if (el.category === 'masonry_wall') {
      const h = el.dimensions.height || 0;
      if (h > 4.8) {
        issues.push({
          id: `VAL-WALL-H-${el.id}`,
          ruleCode: 'RULE_EXCESSIVE_WALL_HEIGHT',
          severity: 'warning',
          title: `Excessive Wall Height: ${el.name} (${h.toFixed(2)}m)`,
          description: `Wall height of ${h.toFixed(2)}m exceeds typical single floor clear height (4.8m).`,
          elementId: el.id,
          drawingNumber: el.drawingNumber,
          suggestedCorrection: 'Check if this is a double-height lobby/shaft, or if floor-to-floor height was used instead of beam soffit clear height.',
        });
      }
    }

    // Rule 4: Slab thickness sanity check (100mm to 500mm for standard solid/flat slabs)
    if (el.category === 'slab') {
      const thkMm = (el.dimensions.depthOrThickness || 0) * 1000;
      if (thkMm < 100 || thkMm > 600) {
        issues.push({
          id: `VAL-SLAB-THK-${el.id}`,
          ruleCode: 'RULE_ABNORMAL_SLAB_THICKNESS',
          severity: 'warning',
          title: `Abnormal Slab Thickness: ${el.name} (${thkMm}mm)`,
          description: `Slab thickness of ${thkMm}mm is outside standard building range (100mm - 600mm).`,
          elementId: el.id,
          drawingNumber: el.drawingNumber,
          suggestedCorrection: 'Verify if units were uploaded in inches or if drawing note specifies special transfer slab.',
        });
      }
    }

    // Rule 5: Beam span-to-depth ratio (deflection check: L / D should usually be <= 16-20)
    if (el.category === 'beam') {
      const span = el.dimensions.length;
      const depth = el.dimensions.depthOrThickness;
      if (span > 0 && depth > 0) {
        const ratio = span / depth;
        if (ratio > 22) {
          issues.push({
            id: `VAL-BEAM-SPAN-${el.id}`,
            ruleCode: 'RULE_HIGH_SPAN_DEPTH_RATIO',
            severity: 'warning',
            title: `High Beam Span/Depth Ratio: ${el.name} (L/D = ${ratio.toFixed(1)})`,
            description: `Span of ${span}m with depth of ${depth}m yields L/D = ${ratio.toFixed(1)}, exceeding deflection guidelines (IS 456 / BS 8110 limit ~20).`,
            elementId: el.id,
            drawingNumber: el.drawingNumber,
            suggestedCorrection: 'Verify beam depth in schedule or check for intermediate support column.',
          });
        }
      }
    }

    // Rule 6: Low Confidence AI extraction flag
    if (el.status === 'review_required' || (el.confidence !== undefined && el.confidence < 0.75)) {
      issues.push({
        id: `VAL-CONF-${el.id}`,
        ruleCode: 'RULE_LOW_CONFIDENCE_AI',
        severity: 'info',
        title: `AI Extraction Needs Human Verification: ${el.name}`,
        description: `Confidence score is ${(el.confidence * 100).toFixed(0)}%. Drawing notes or dimensions may have slight ambiguity.`,
        elementId: el.id,
        drawingNumber: el.drawingNumber,
        suggestedCorrection: 'Click "SHOW ME WHY" to inspect the source drawing bounding box and verify numbers.',
      });
    }
  });

  return issues;
}

export const validateProjectDataset = (
  elements: DetectedElement[],
  boqItems?: any[],
  bbsRecords?: any[],
  drawings?: any[]
) => runEngineeringValidation(elements);
