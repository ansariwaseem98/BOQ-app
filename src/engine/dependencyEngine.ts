/**
 * Dependency & Recalculation Engine
 * Cascades geometric and specification changes across elements, BBS, BOQ items and tender totals
 */

import { DetectedElement, BoqItem, BbsBarRecord } from '../types';
import { calculateRccElement } from './rccEngine';
import { calculateMasonryWall } from './masonryEngine';
import { calculateSteelMember } from './steelEngine';
import { calculateHvacDuct, calculatePipeRun } from './mepEngine';

export interface RecalculationResult {
  updatedElements: DetectedElement[];
  updatedBoqItems: BoqItem[];
  costDelta: number;
  auditMessage: string;
}

export function recalculateSingleElement(
  element: DetectedElement,
  allBoqItems: BoqItem[]
): { updatedElement: DetectedElement; affectedBoqItems: BoqItem[]; costDelta: number; auditMessage: string } {
  const prevQuantity = element.calculation.netQuantity;
  let newQuantity = prevQuantity;

  // 1. Recalculate based on element category
  if (['footing', 'pcc', 'column', 'beam', 'slab', 'staircase', 'shear_wall', 'retaining_wall', 'ground_beam', 'pedestal', 'parapet'].includes(element.category)) {
    const calc = calculateRccElement({
      type: element.category as any,
      length: element.dimensions.length,
      width: element.dimensions.width,
      depthOrThickness: element.dimensions.depthOrThickness,
      height: element.dimensions.height,
      count: element.dimensions.count,
      diameterMm: element.dimensions.diameterMm,
      deductions: element.deductions,
    });
    element.calculation = calc;
    newQuantity = calc.netQuantity;
  } else if (['masonry_wall', 'dpc'].includes(element.category)) {
    const { wallCalculation } = calculateMasonryWall({
      length: element.dimensions.length,
      height: element.dimensions.height || 3.0,
      thickness: element.dimensions.depthOrThickness || 0.20,
      count: element.dimensions.count,
      openings: element.deductions.map((d) => ({
        id: d.id,
        name: d.name,
        width: d.length,
        height: d.width,
        count: d.count,
      })),
    });
    element.calculation = wallCalculation;
    newQuantity = wallCalculation.netQuantity;
  } else if (['steel_column', 'steel_rafter', 'purlin'].includes(element.category)) {
    const steelCalc = calculateSteelMember({
      sectionKey: element.specification.steelSection || 'UB 457x191x67',
      length: element.dimensions.length,
      count: element.dimensions.count,
    });
    element.calculation = steelCalc;
    newQuantity = steelCalc.netQuantity;
  } else if (element.category === 'hvac_duct') {
    const ductCalc = calculateHvacDuct({
      widthMm: element.dimensions.width * 1000,
      heightMm: (element.dimensions.depthOrThickness || 0.4) * 1000,
      lengthM: element.dimensions.length,
      count: element.dimensions.count,
    });
    element.calculation = ductCalc;
    newQuantity = ductCalc.netQuantity;
  } else if (element.category === 'pipe') {
    const pipeCalc = calculatePipeRun({
      system: 'Drainage',
      diameterMm: element.dimensions.diameterMm || 110,
      material: 'UPVC',
      lengthM: element.dimensions.length,
      count: element.dimensions.count,
    });
    element.calculation = pipeCalc;
    newQuantity = pipeCalc.netQuantity;
  }

  // 2. Propagate to linked BOQ items
  const quantityDelta = newQuantity - prevQuantity;
  let totalCostDelta = 0;
  const updatedBoqItems: BoqItem[] = [];

  allBoqItems.forEach((boq) => {
    if (element.linkedBoqItemIds.includes(boq.id) || boq.contributingElementIds.includes(element.id)) {
      const oldBoqQty = boq.quantity;
      const newBoqQty = Math.max(0, Number((oldBoqQty + quantityDelta).toFixed(3)));
      const oldAmount = boq.totalAmount;
      const newAmount = Number((newBoqQty * boq.unitRate).toFixed(2));
      const delta = newAmount - oldAmount;
      totalCostDelta += delta;

      const updatedBoq: BoqItem = {
        ...boq,
        quantity: newBoqQty,
        totalAmount: newAmount,
      };
      updatedBoqItems.push(updatedBoq);
    }
  });

  const auditMessage = `Recalculated ${element.name} (${element.id}): Quantity changed from ${prevQuantity.toFixed(2)} to ${newQuantity.toFixed(2)} ${element.calculation.unit}. Affected ${updatedBoqItems.length} BOQ line items with cost impact of ${totalCostDelta >= 0 ? '+' : ''}${totalCostDelta.toFixed(2)}.`;

  return {
    updatedElement: element,
    affectedBoqItems: updatedBoqItems,
    costDelta: totalCostDelta,
    auditMessage,
  };
}

export function recalculateElementDependencies(
  elements: DetectedElement[],
  allBoqItems: BoqItem[]
): RecalculationResult {
  let currentBoqItems = [...allBoqItems];
  let totalDelta = 0;
  const updatedEls: DetectedElement[] = [];

  elements.forEach((el) => {
    const res = recalculateSingleElement({ ...el }, currentBoqItems);
    updatedEls.push(res.updatedElement);
    totalDelta += res.costDelta;
    if (res.affectedBoqItems.length > 0) {
      const affectedMap = new Map(res.affectedBoqItems.map((b) => [b.id, b]));
      currentBoqItems = currentBoqItems.map((b) => (affectedMap.has(b.id) ? affectedMap.get(b.id)! : b));
    }
  });

  return {
    updatedElements: updatedEls,
    updatedBoqItems: currentBoqItems,
    costDelta: totalDelta,
    auditMessage: `Recalculated ${elements.length} elements across BOQ. Total cost delta: ${totalDelta.toFixed(2)}`,
  };
}

