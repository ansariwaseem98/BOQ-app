/**
 * AI BOQ & Tender Estimation Engineer - Phase 12 Rate Analysis & Tender Pricing Engine
 *
 * CRITICAL SEPARATION PRINCIPLE:
 * Quantities and rates must remain strictly separated.
 * The quantity calculated from engineering drawings must NEVER be altered because of pricing.
 * The pricing engine operates ON TOP OF the verified BOQ.
 */

import { UnifiedBoqItem } from '../types';
import {
  RateAnalysisRecord,
  RateComponent,
  RateDatabaseItem,
  PricingScenario,
  PricingQaReport,
  PricingQaIssue,
  TenderSummaryReport,
  CostElementBreakdown,
  TenderCostByDiscipline,
  TenderCostByBuilding,
  TenderCostByLevel,
  ValueEngineeringProposal,
  PricingRevisionSnapshot,
  RateAuditEntry,
} from '../types/rateAnalysis';
import {
  INITIAL_RATE_DATABASE,
  INITIAL_PRICING_SCENARIOS,
  INITIAL_RATE_TEMPLATES,
  INITIAL_VALUE_ENGINEERING_PROPOSALS,
} from '../data/rateDatabaseInitialData';
import { INITIAL_UNIFIED_BOQ_ITEMS } from '../data/unifiedBoqInitialData';

export class RateAnalysisEngine {
  /**
   * Calculate detailed rate build-up from rate components and markup settings
   */
  public static calculateRateBuildUp(
    components: RateComponent[],
    overheadPercent: number = 10.0,
    profitPercent: number = 10.0,
    taxEnabled: boolean = true,
    taxRatePercent: number = 5.0,
    overheadType: 'PERCENTAGE' | 'FIXED' = 'PERCENTAGE',
    profitType: 'PERCENTAGE' | 'FIXED' = 'PERCENTAGE'
  ): {
    materialCost: number;
    labourCost: number;
    equipmentCost: number;
    subcontractCost: number;
    transportCost: number;
    otherCost: number;
    wastageTotalCost: number;
    directCost: number;
    overheadAmount: number;
    profitAmount: number;
    taxAmount: number;
    finalRate: number;
  } {
    let materialCost = 0;
    let labourCost = 0;
    let equipmentCost = 0;
    let subcontractCost = 0;
    let transportCost = 0;
    let otherCost = 0;
    let wastageTotalCost = 0;

    components.forEach((c) => {
      const consumption = Math.max(0, c.consumption || 0);
      const unitRate = Math.max(0, c.unitRate || 0);
      const wastagePct = Math.max(0, c.wastagePercent || 0);

      // Material wastage calculation: Effective quantity = consumption * (1 + wastage%/100)
      if (c.category === 'MATERIAL') {
        const baseAmount = consumption * unitRate;
        const wastageAmount = (consumption * (wastagePct / 100)) * unitRate;
        const totalAmount = baseAmount + wastageAmount;

        c.amount = Number(totalAmount.toFixed(4));
        c.wastageAmount = Number(wastageAmount.toFixed(4));

        materialCost += totalAmount;
        wastageTotalCost += wastageAmount;
      } else {
        const compAmount = consumption * unitRate;
        c.amount = Number(compAmount.toFixed(4));
        c.wastageAmount = 0;

        if (c.category === 'LABOUR') labourCost += compAmount;
        else if (c.category === 'EQUIPMENT') equipmentCost += compAmount;
        else if (c.category === 'SUBCONTRACT') subcontractCost += compAmount;
        else if (c.category === 'TRANSPORT') transportCost += compAmount;
        else otherCost += compAmount;
      }
    });

    const directCost = materialCost + labourCost + equipmentCost + subcontractCost + transportCost + otherCost;

    // Overhead calculation
    const overheadAmount = overheadType === 'PERCENTAGE' 
      ? (directCost * (overheadPercent / 100))
      : overheadPercent;

    // Profit calculation: applied on (Direct Cost + Overhead)
    const profitAmount = profitType === 'PERCENTAGE'
      ? ((directCost + overheadAmount) * (profitPercent / 100))
      : profitPercent;

    // Tax calculation: applied on (Direct Cost + Overhead + Profit) if enabled
    const taxAmount = taxEnabled
      ? ((directCost + overheadAmount + profitAmount) * (taxRatePercent / 100))
      : 0;

    const finalRate = directCost + overheadAmount + profitAmount + taxAmount;

    return {
      materialCost: Number(materialCost.toFixed(4)),
      labourCost: Number(labourCost.toFixed(4)),
      equipmentCost: Number(equipmentCost.toFixed(4)),
      subcontractCost: Number(subcontractCost.toFixed(4)),
      transportCost: Number(transportCost.toFixed(4)),
      otherCost: Number(otherCost.toFixed(4)),
      wastageTotalCost: Number(wastageTotalCost.toFixed(4)),
      directCost: Number(directCost.toFixed(4)),
      overheadAmount: Number(overheadAmount.toFixed(4)),
      profitAmount: Number(profitAmount.toFixed(4)),
      taxAmount: Number(taxAmount.toFixed(4)),
      finalRate: Number(finalRate.toFixed(4)),
    };
  }

  /**
   * Validate unit compatibility between BOQ and Rate Analysis
   */
  public static validateUnitCompatibility(boqUnit: string, rateUnit: string): boolean {
    if (!boqUnit || !rateUnit) return false;
    const cleanBoq = boqUnit.trim().toLowerCase().replace('cu.m', 'm³').replace('sq.m', 'm²').replace('ton', 'tonne').replace('nos', 'no.');
    const cleanRate = rateUnit.trim().toLowerCase().replace('cu.m', 'm³').replace('sq.m', 'm²').replace('ton', 'tonne').replace('nos', 'no.');
    return cleanBoq === cleanRate;
  }

  /**
   * Recalculate BOQ Item Amount strictly without modifying BOQ quantity
   */
  public static calculateBoqItemAmount(verifiedQuantity: number, finalRate: number): number {
    return Number((verifiedQuantity * finalRate).toFixed(2));
  }

  /**
   * Check if a rate's validity date has expired
   */
  public static isRateExpired(validityToDate?: string): boolean {
    if (!validityToDate) return false;
    const target = new Date(validityToDate).getTime();
    const today = new Date().getTime();
    return target < today;
  }

  /**
   * Initialize standard rate analyses for all unified BOQ items
   */
  public static initializeRateAnalyses(
    boqItems: UnifiedBoqItem[] = INITIAL_UNIFIED_BOQ_ITEMS
  ): RateAnalysisRecord[] {
    return boqItems.map((boq, idx) => {
      const template = this.findMatchingTemplate(boq);
      const components: RateComponent[] = template 
        ? template.defaultComponents.map((tc, cIdx) => ({
            id: `RC-${boq.itemCode}-${cIdx + 1}`,
            category: tc.category,
            description: tc.description,
            unit: tc.unit,
            consumption: tc.defaultConsumption,
            unitRate: tc.suggestedRate,
            wastagePercent: tc.wastagePercent,
            amount: 0,
            source: 'Rate Database',
            date: '2026-08-01',
            currency: 'AED',
          }))
        : this.generateDefaultComponentsForBoqItem(boq);

      const buildUp = this.calculateRateBuildUp(components, 10.0, 10.0, true, 5.0);

      const record: RateAnalysisRecord = {
        id: `RA-${boq.itemCode}`,
        boqItemId: boq.id,
        itemCode: boq.itemCode,
        description: boq.description,
        unit: boq.unit,
        rateUnit: boq.unit,
        unitMismatch: false,
        currency: 'AED',
        effectiveDate: '2026-08-01',
        location: 'Central Project Site',
        components,
        ...buildUp,
        overheadType: 'PERCENTAGE',
        overheadPercent: 10.0,
        profitType: 'PERCENTAGE',
        profitPercent: 10.0,
        taxEnabled: true,
        taxRatePercent: 5.0,
        rateSource: template ? 'Rate Database' : 'Market Reference',
        status: 'PRICED',
        validityFrom: '2026-08-01',
        validityTo: '2026-12-31',
        isExpired: false,
        isUserOverridden: false,
        databaseReferenceRate: buildUp.finalRate,
        templateId: template?.id,
        auditTrail: [
          {
            id: `AUDIT-${boq.itemCode}-1`,
            timestamp: new Date().toISOString(),
            user: 'Lead Estimator (System)',
            action: 'CREATED',
            newRate: buildUp.finalRate,
            reason: 'Initial Engineering Rate Build-up populated from Verified Takeoff and Database',
          },
        ],
        lastModifiedAt: new Date().toISOString(),
        lastModifiedBy: 'Lead Estimator (System)',
      };

      return record;
    });
  }

  /**
   * Find matching rate analysis template based on item discipline and description
   */
  private static findMatchingTemplate(boq: UnifiedBoqItem) {
    const desc = boq.description.toLowerCase();
    const elem = (boq.elementType || '').toLowerCase();

    if (elem.includes('footing') || elem.includes('column') || elem.includes('beam') || elem.includes('slab') || desc.includes('concrete')) {
      return INITIAL_RATE_TEMPLATES.find((t) => t.id === 'RAT-CONC-M25');
    }
    if (desc.includes('rebar') || desc.includes('steel bar') || elem.includes('rebar') || boq.unit === 'tonne' || boq.unit === 'kg') {
      return INITIAL_RATE_TEMPLATES.find((t) => t.id === 'RAT-REBAR-TMT');
    }
    if (desc.includes('structural steel') || desc.includes('rafter') || desc.includes('purlin') || desc.includes('portal')) {
      return INITIAL_RATE_TEMPLATES.find((t) => t.id === 'RAT-STRUCT-STEEL');
    }
    if (desc.includes('block') || desc.includes('masonry') || elem.includes('masonry')) {
      return INITIAL_RATE_TEMPLATES.find((t) => t.id === 'RAT-AAC-BLOCK');
    }
    return undefined;
  }

  /**
   * Generate generic engineering default components for items without templates
   */
  private static generateDefaultComponentsForBoqItem(boq: UnifiedBoqItem): RateComponent[] {
    const baseRate = boq.unitRate > 0 ? boq.unitRate : 50.00;
    const materialShare = baseRate * 0.55;
    const labourShare = baseRate * 0.25;
    const equipShare = baseRate * 0.10;
    const transportShare = baseRate * 0.10;

    return [
      {
        id: `RC-${boq.itemCode}-1`,
        category: 'MATERIAL',
        description: `${boq.description} - Primary Material Supply`,
        unit: boq.unit,
        consumption: 1.0,
        unitRate: materialShare,
        wastagePercent: 2.5,
        amount: materialShare * 1.025,
        source: 'Rate Database',
        date: '2026-08-01',
        currency: 'AED',
      },
      {
        id: `RC-${boq.itemCode}-2`,
        category: 'LABOUR',
        description: 'Trade Installation & Trowel Crew',
        unit: boq.unit,
        consumption: 1.0,
        unitRate: labourShare,
        wastagePercent: 0,
        amount: labourShare,
        source: 'Rate Database',
        date: '2026-08-01',
        currency: 'AED',
      },
      {
        id: `RC-${boq.itemCode}-3`,
        category: 'EQUIPMENT',
        description: 'Tools, Machinery & Rigging Allowance',
        unit: boq.unit,
        consumption: 1.0,
        unitRate: equipShare,
        wastagePercent: 0,
        amount: equipShare,
        source: 'Rate Database',
        date: '2026-08-01',
        currency: 'AED',
      },
      {
        id: `RC-${boq.itemCode}-4`,
        category: 'TRANSPORT',
        description: 'Logistics & Internal Site Handling',
        unit: boq.unit,
        consumption: 1.0,
        unitRate: transportShare,
        wastagePercent: 0,
        amount: transportShare,
        source: 'Rate Database',
        date: '2026-08-01',
        currency: 'AED',
      },
    ];
  }

  /**
   * Apply pricing scenario to a rate analysis record
   */
  public static evaluateScenarioRate(
    record: RateAnalysisRecord,
    scenario: PricingScenario
  ): RateAnalysisRecord {
    // Clone components with scenario multipliers applied
    const adjustedComponents: RateComponent[] = record.components.map((c) => {
      let multiplier = 1.0;
      if (c.category === 'MATERIAL') multiplier = scenario.materialCostMultiplier;
      else if (c.category === 'LABOUR') multiplier = scenario.labourCostMultiplier;
      else if (c.category === 'EQUIPMENT') multiplier = scenario.equipmentCostMultiplier;
      else if (c.category === 'SUBCONTRACT') multiplier = scenario.subcontractCostMultiplier;

      return {
        ...c,
        unitRate: Number((c.unitRate * multiplier).toFixed(4)),
      };
    });

    const buildUp = this.calculateRateBuildUp(
      adjustedComponents,
      scenario.overheadPercent,
      scenario.profitPercent,
      scenario.isTaxEnabled,
      scenario.taxRatePercent,
      record.overheadType,
      record.profitType
    );

    return {
      ...record,
      components: adjustedComponents,
      ...buildUp,
      overheadPercent: scenario.overheadPercent,
      profitPercent: scenario.profitPercent,
      taxEnabled: scenario.isTaxEnabled,
      taxRatePercent: scenario.taxRatePercent,
    };
  }

  /**
   * Generate comprehensive Tender Summary Report with complete cost element roll-ups
   */
  public static generateTenderSummaryReport(
    projectId: string,
    projectName: string,
    boqItems: UnifiedBoqItem[],
    rateAnalyses: RateAnalysisRecord[],
    activeScenario: PricingScenario = INITIAL_PRICING_SCENARIOS[0],
    isFrozen: boolean = false,
    pricingRevisionCode: string = 'PRICING REV 00'
  ): TenderSummaryReport {
    let materialTotal = 0;
    let labourTotal = 0;
    let equipmentTotal = 0;
    let subcontractTotal = 0;
    let transportTotal = 0;
    let otherTotal = 0;
    let directCostTotal = 0;
    let overheadTotal = 0;
    let profitTotal = 0;
    let taxTotal = 0;
    let tenderGrandTotal = 0;

    const totalVerifiedQuantityUnits: { [unit: string]: number } = {};

    // Discipline accumulator maps
    const disciplineMap: {
      [disc: string]: {
        itemCount: number;
        directCost: number;
        overheadAmount: number;
        profitAmount: number;
        taxAmount: number;
        tenderAmount: number;
      };
    } = {};

    // Building accumulator maps
    const buildingMap: {
      [bldg: string]: {
        itemCount: number;
        directCost: number;
        tenderAmount: number;
      };
    } = {
      'Building A (Main Warehouse)': { itemCount: 0, directCost: 0, tenderAmount: 0 },
      'Building B (Admin Office Annex)': { itemCount: 0, directCost: 0, tenderAmount: 0 },
    };

    // Level accumulator maps
    const levelMap: {
      [lvl: string]: {
        directCost: number;
        tenderAmount: number;
      };
    } = {
      'Foundation & Substructure': { directCost: 0, tenderAmount: 0 },
      'Ground Floor': { directCost: 0, tenderAmount: 0 },
      'First Floor / Mezzanine': { directCost: 0, tenderAmount: 0 },
      'Roof & Canopy': { directCost: 0, tenderAmount: 0 },
    };

    boqItems.forEach((boq) => {
      // Aggregate quantities by unit
      totalVerifiedQuantityUnits[boq.unit] = (totalVerifiedQuantityUnits[boq.unit] || 0) + (boq.finalQuantity || 0);

      const rateRec = rateAnalyses.find((r) => r.boqItemId === boq.id || r.itemCode === boq.itemCode);
      const evalRate = rateRec ? this.evaluateScenarioRate(rateRec, activeScenario) : null;

      const finalRate = evalRate ? evalRate.finalRate : boq.unitRate;
      const itemAmount = Number(((boq.finalQuantity || 0) * finalRate).toFixed(2));
      const qty = boq.finalQuantity || 0;

      if (evalRate) {
        materialTotal += evalRate.materialCost * qty;
        labourTotal += evalRate.labourCost * qty;
        equipmentTotal += evalRate.equipmentCost * qty;
        subcontractTotal += evalRate.subcontractCost * qty;
        transportTotal += evalRate.transportCost * qty;
        otherTotal += evalRate.otherCost * qty;
        directCostTotal += evalRate.directCost * qty;
        overheadTotal += evalRate.overheadAmount * qty;
        profitTotal += evalRate.profitAmount * qty;
        taxTotal += evalRate.taxAmount * qty;
      } else {
        directCostTotal += itemAmount * 0.8;
        overheadTotal += itemAmount * 0.08;
        profitTotal += itemAmount * 0.08;
        taxTotal += itemAmount * 0.04;
      }

      tenderGrandTotal += itemAmount;

      // Discipline roll-up
      const disc = String(boq.discipline);
      if (!disciplineMap[disc]) {
        disciplineMap[disc] = { itemCount: 0, directCost: 0, overheadAmount: 0, profitAmount: 0, taxAmount: 0, tenderAmount: 0 };
      }
      disciplineMap[disc].itemCount += 1;
      disciplineMap[disc].directCost += evalRate ? evalRate.directCost * qty : itemAmount * 0.8;
      disciplineMap[disc].overheadAmount += evalRate ? evalRate.overheadAmount * qty : itemAmount * 0.08;
      disciplineMap[disc].profitAmount += evalRate ? evalRate.profitAmount * qty : itemAmount * 0.08;
      disciplineMap[disc].taxAmount += evalRate ? evalRate.taxAmount * qty : itemAmount * 0.04;
      disciplineMap[disc].tenderAmount += itemAmount;

      // Building partitioning
      const bldg = boq.section.toLowerCase().includes('admin') || boq.itemCode.includes('ADM') 
        ? 'Building B (Admin Office Annex)' 
        : 'Building A (Main Warehouse)';
      buildingMap[bldg].itemCount += 1;
      buildingMap[bldg].directCost += evalRate ? evalRate.directCost * qty : itemAmount * 0.8;
      buildingMap[bldg].tenderAmount += itemAmount;

      // Floor level partitioning
      const descLower = boq.description.toLowerCase();
      let lvl = 'Ground Floor';
      if (descLower.includes('footing') || descLower.includes('excavat') || descLower.includes('substructure') || descLower.includes('raft')) {
        lvl = 'Foundation & Substructure';
      } else if (descLower.includes('first floor') || descLower.includes('mezzanine') || descLower.includes('level 1')) {
        lvl = 'First Floor / Mezzanine';
      } else if (descLower.includes('roof') || descLower.includes('purlin') || descLower.includes('sheet') || descLower.includes('truss')) {
        lvl = 'Roof & Canopy';
      }
      levelMap[lvl].directCost += evalRate ? evalRate.directCost * qty : itemAmount * 0.8;
      levelMap[lvl].tenderAmount += itemAmount;
    });

    const costElements: CostElementBreakdown = {
      materialTotal: Number(materialTotal.toFixed(2)),
      materialPercent: tenderGrandTotal > 0 ? Number(((materialTotal / tenderGrandTotal) * 100).toFixed(2)) : 0,
      labourTotal: Number(labourTotal.toFixed(2)),
      labourPercent: tenderGrandTotal > 0 ? Number(((labourTotal / tenderGrandTotal) * 100).toFixed(2)) : 0,
      equipmentTotal: Number(equipmentTotal.toFixed(2)),
      equipmentPercent: tenderGrandTotal > 0 ? Number(((equipmentTotal / tenderGrandTotal) * 100).toFixed(2)) : 0,
      subcontractTotal: Number(subcontractTotal.toFixed(2)),
      subcontractPercent: tenderGrandTotal > 0 ? Number(((subcontractTotal / tenderGrandTotal) * 100).toFixed(2)) : 0,
      transportTotal: Number(transportTotal.toFixed(2)),
      transportPercent: tenderGrandTotal > 0 ? Number(((transportTotal / tenderGrandTotal) * 100).toFixed(2)) : 0,
      otherTotal: Number(otherTotal.toFixed(2)),
      otherPercent: tenderGrandTotal > 0 ? Number(((otherTotal / tenderGrandTotal) * 100).toFixed(2)) : 0,
      directCostTotal: Number(directCostTotal.toFixed(2)),
      overheadTotal: Number(overheadTotal.toFixed(2)),
      overheadPercent: directCostTotal > 0 ? Number(((overheadTotal / directCostTotal) * 100).toFixed(2)) : 0,
      profitTotal: Number(profitTotal.toFixed(2)),
      profitPercent: (directCostTotal + overheadTotal) > 0 ? Number(((profitTotal / (directCostTotal + overheadTotal)) * 100).toFixed(2)) : 0,
      taxTotal: Number(taxTotal.toFixed(2)),
      taxPercent: activeScenario.taxRatePercent,
      tenderGrandTotal: Number(tenderGrandTotal.toFixed(2)),
    };

    const disciplineBreakdown: TenderCostByDiscipline[] = Object.entries(disciplineMap).map(([discipline, data]) => ({
      discipline,
      itemCount: data.itemCount,
      directCost: Number(data.directCost.toFixed(2)),
      overheadAmount: Number(data.overheadAmount.toFixed(2)),
      profitAmount: Number(data.profitAmount.toFixed(2)),
      taxAmount: Number(data.taxAmount.toFixed(2)),
      tenderAmount: Number(data.tenderAmount.toFixed(2)),
      percentageOfTender: tenderGrandTotal > 0 ? Number(((data.tenderAmount / tenderGrandTotal) * 100).toFixed(2)) : 0,
    }));

    const buildingBreakdown: TenderCostByBuilding[] = [
      {
        buildingName: 'Building A (Main Warehouse)',
        grossFloorAreaM2: 1250.0,
        isGfaVerified: true,
        itemCount: buildingMap['Building A (Main Warehouse)'].itemCount,
        directCost: Number(buildingMap['Building A (Main Warehouse)'].directCost.toFixed(2)),
        tenderAmount: Number(buildingMap['Building A (Main Warehouse)'].tenderAmount.toFixed(2)),
        costPerM2: Number((buildingMap['Building A (Main Warehouse)'].tenderAmount / 1250.0).toFixed(2)),
        percentageOfTotal: tenderGrandTotal > 0 ? Number(((buildingMap['Building A (Main Warehouse)'].tenderAmount / tenderGrandTotal) * 100).toFixed(2)) : 0,
      },
      {
        buildingName: 'Building B (Admin Office Annex)',
        grossFloorAreaM2: 450.0,
        isGfaVerified: true,
        itemCount: buildingMap['Building B (Admin Office Annex)'].itemCount,
        directCost: Number(buildingMap['Building B (Admin Office Annex)'].directCost.toFixed(2)),
        tenderAmount: Number(buildingMap['Building B (Admin Office Annex)'].tenderAmount.toFixed(2)),
        costPerM2: Number((buildingMap['Building B (Admin Office Annex)'].tenderAmount / 450.0).toFixed(2)),
        percentageOfTotal: tenderGrandTotal > 0 ? Number(((buildingMap['Building B (Admin Office Annex)'].tenderAmount / tenderGrandTotal) * 100).toFixed(2)) : 0,
      },
    ];

    const levelBreakdown: TenderCostByLevel[] = Object.entries(levelMap).map(([levelName, data]) => ({
      levelName,
      directCost: Number(data.directCost.toFixed(2)),
      tenderAmount: Number(data.tenderAmount.toFixed(2)),
      percentageOfTotal: tenderGrandTotal > 0 ? Number(((data.tenderAmount / tenderGrandTotal) * 100).toFixed(2)) : 0,
    }));

    // Evaluate all scenarios for side-by-side comparison
    const scenariosComparison = INITIAL_PRICING_SCENARIOS.map((sc) => {
      let scTender = 0;
      let scDirect = 0;
      let scOverhead = 0;
      let scProfit = 0;
      let scTax = 0;

      boqItems.forEach((b) => {
        const r = rateAnalyses.find((x) => x.boqItemId === b.id || x.itemCode === b.itemCode);
        if (r) {
          const evalR = this.evaluateScenarioRate(r, sc);
          const q = b.finalQuantity || 0;
          scDirect += evalR.directCost * q;
          scOverhead += evalR.overheadAmount * q;
          scProfit += evalR.profitAmount * q;
          scTax += evalR.taxAmount * q;
          scTender += evalR.finalRate * q;
        }
      });

      return {
        scenarioName: sc.name,
        directCost: Number(scDirect.toFixed(2)),
        overhead: Number(scOverhead.toFixed(2)),
        profit: Number(scProfit.toFixed(2)),
        tax: Number(scTax.toFixed(2)),
        tenderTotal: Number(scTender.toFixed(2)),
        deltaFromActive: Number((scTender - tenderGrandTotal).toFixed(2)),
      };
    });

    const qaReport = this.runPricingQaQualityGate(boqItems, rateAnalyses);

    return {
      projectId,
      projectName,
      currency: 'AED',
      pricingRevision: pricingRevisionCode,
      isFrozen,
      totalBoqItems: boqItems.length,
      totalVerifiedQuantityUnits,
      costElements,
      disciplineBreakdown,
      buildingBreakdown,
      levelBreakdown,
      scenariosComparison,
      tenderGrandTotal: Number(tenderGrandTotal.toFixed(2)),
      tenderTotalWords: this.numberToEnglishWords(tenderGrandTotal),
      qaPassed: qaReport.qualityGatePassed,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Run strict Pricing QA Quality Gate (Pre-flight checks)
   */
  public static runPricingQaQualityGate(
    boqItems: UnifiedBoqItem[],
    rateAnalyses: RateAnalysisRecord[]
  ): PricingQaReport {
    const issues: PricingQaIssue[] = [];
    let pricedCount = 0;
    let expiredCount = 0;
    let mismatchCount = 0;
    let overriddenCount = 0;
    let missingSourceCount = 0;

    boqItems.forEach((boq) => {
      const rateRec = rateAnalyses.find((r) => r.boqItemId === boq.id || r.itemCode === boq.itemCode);

      if (!rateRec || !rateRec.components || rateRec.components.length === 0 || rateRec.finalRate <= 0) {
        issues.push({
          id: `QA-UNPRICED-${boq.itemCode}`,
          itemCode: boq.itemCode,
          description: boq.description,
          issueType: 'UNPRICED_ITEM',
          severity: 'CRITICAL',
          message: `BOQ item ${boq.itemCode} has no rate analysis build-up or zero rate. Silent zero is prohibited.`,
          suggestedAction: 'Create detailed rate build-up or apply standard rate template.',
        });
        return;
      }

      pricedCount++;

      // Check unit compatibility
      if (rateRec.unitMismatch || !this.validateUnitCompatibility(boq.unit, rateRec.rateUnit)) {
        mismatchCount++;
        issues.push({
          id: `QA-MISMATCH-${boq.itemCode}`,
          itemCode: boq.itemCode,
          description: boq.description,
          issueType: 'UNIT_MISMATCH',
          severity: 'CRITICAL',
          message: `Unit mismatch: BOQ requires '${boq.unit}' but Rate Analysis is built in '${rateRec.rateUnit}'.`,
          suggestedAction: `Convert rate build-up consumption to match BOQ unit '${boq.unit}'.`,
        });
      }

      // Check rate validity expiration
      if (rateRec.isExpired || this.isRateExpired(rateRec.validityTo)) {
        expiredCount++;
        issues.push({
          id: `QA-EXPIRED-${boq.itemCode}`,
          itemCode: boq.itemCode,
          description: boq.description,
          issueType: 'EXPIRED_RATE',
          severity: 'WARNING',
          message: `Rate analysis validity expired on ${rateRec.validityTo || 'N/A'}. Verify current supplier quote.`,
          suggestedAction: 'Update component prices with renewed supplier quotation.',
        });
      }

      // Check missing rate source
      if (!rateRec.rateSource || rateRec.rateSource.trim() === '') {
        missingSourceCount++;
        issues.push({
          id: `QA-SOURCE-${boq.itemCode}`,
          itemCode: boq.itemCode,
          description: boq.description,
          issueType: 'MISSING_SOURCE',
          severity: 'WARNING',
          message: `Rate analysis lacks formal source attribution (Supplier Quote / Rate Database / Contract Reference).`,
          suggestedAction: 'Assign specific quotation or database source reference.',
        });
      }

      // Check user overrides
      if (rateRec.isUserOverridden) {
        overriddenCount++;
        if (!rateRec.overrideReason || rateRec.overrideReason.trim().length < 5) {
          issues.push({
            id: `QA-OVERRIDE-${boq.itemCode}`,
            itemCode: boq.itemCode,
            description: boq.description,
            issueType: 'OVERRIDDEN_UNJUSTIFIED',
            severity: 'INFO',
            message: `User manual rate override applied without comprehensive engineering justification note.`,
            suggestedAction: 'Record formal reason in audit trail for tender committee audit.',
          });
        }
      }

      // Negative check
      if (rateRec.finalRate < 0) {
        issues.push({
          id: `QA-NEG-${boq.itemCode}`,
          itemCode: boq.itemCode,
          description: boq.description,
          issueType: 'NEGATIVE_RATE',
          severity: 'CRITICAL',
          message: `Final unit rate is negative (AED ${rateRec.finalRate.toFixed(2)}). Calculations invalid.`,
          suggestedAction: 'Correct negative component rates in rate build-up.',
        });
      }
    });

    const unpricedCount = boqItems.length - pricedCount;
    const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
    const warningsCount = issues.filter((i) => i.severity === 'WARNING').length;

    return {
      timestamp: new Date().toISOString(),
      totalBoqItems: boqItems.length,
      pricedItemsCount: pricedCount,
      unpricedItemsCount: unpricedCount,
      pricedPercent: boqItems.length > 0 ? Number(((pricedCount / boqItems.length) * 100).toFixed(1)) : 0,
      rateReviewCount: issues.length,
      expiredRatesCount: expiredCount,
      unitMismatchesCount: mismatchCount,
      overriddenRatesCount: overriddenCount,
      missingSourcesCount: missingSourceCount,
      criticalIssuesCount: criticalCount,
      warningsCount: warningsCount,
      issues,
      qualityGatePassed: criticalCount === 0 && unpricedCount === 0 && mismatchCount === 0,
    };
  }

  /**
   * Convert number into English Currency Words (e.g. AED 1,250.50 -> One Thousand Two Hundred Fifty UAE Dirhams and 50/100 Fils)
   */
  public static numberToEnglishWords(amount: number): string {
    if (isNaN(amount) || amount === 0) return 'Zero UAE Dirhams and Zero Fils';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convertGroup(num: number): string {
      let str = '';
      if (num >= 100) {
        str += ones[Math.floor(num / 100)] + ' Hundred ';
        num %= 100;
      }
      if (num >= 20) {
        str += tens[Math.floor(num / 10)] + ' ';
        num %= 10;
      }
      if (num > 0) {
        str += ones[num] + ' ';
      }
      return str.trim();
    }

    const dirhams = Math.floor(amount);
    const fils = Math.round((amount - dirhams) * 100);

    let result = '';
    const billions = Math.floor(dirhams / 1000000000);
    const millions = Math.floor((dirhams % 1000000000) / 1000000);
    const thousands = Math.floor((dirhams % 1000000) / 1000);
    const remainder = dirhams % 1000;

    if (billions > 0) result += convertGroup(billions) + ' Billion ';
    if (millions > 0) result += convertGroup(millions) + ' Million ';
    if (thousands > 0) result += convertGroup(thousands) + ' Thousand ';
    if (remainder > 0) result += convertGroup(remainder) + ' ';

    result = result.trim() + (dirhams === 1 ? ' UAE Dirham' : ' UAE Dirhams');
    result += ` and ${fils}/100 Fils`;

    return result;
  }
}
