import {
  TakeoffItemRecord,
  DetailedCalculationRecord,
  CalculationInputParameter,
  TakeoffDeductionRecord,
  ProjectEngineeringRules,
  TakeoffCategoryKey,
  ConstructionSequenceStage,
  CalculationTemplateType,
  TakeoffCalculationStatus,
  ProjectRecord,
  ProjectDocument,
  ExtractedElementItem,
  CalculationAuditRecord
} from '../types';
import {
  TakeoffCalculationEngine,
  getDefaultEngineeringRules,
  lookupSteelSectionWeight,
  TAKEOFF_CATEGORIES,
  CONSTRUCTION_SEQUENCE_STEPS
} from '../engine/takeoffCalculationEngine';

const TAKEOFF_STORAGE_KEY_PREFIX = 'cad_takeoff_items_';
const RULES_STORAGE_KEY_PREFIX = 'cad_engineering_rules_';

export class TakeoffStorageService {
  /**
   * Loads engineering rules for project
   */
  public static getEngineeringRules(projectId: string): ProjectEngineeringRules {
    if (!projectId) return getDefaultEngineeringRules('default');
    try {
      const stored = localStorage.getItem(`${RULES_STORAGE_KEY_PREFIX}${projectId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored engineering rules:', e);
    }
    const defaults = getDefaultEngineeringRules(projectId);
    this.saveEngineeringRules(defaults);
    return defaults;
  }

  /**
   * Saves engineering rules for project
   */
  public static saveEngineeringRules(rules: ProjectEngineeringRules): void {
    if (!rules || !rules.projectId) return;
    try {
      localStorage.setItem(`${RULES_STORAGE_KEY_PREFIX}${rules.projectId}`, JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to save engineering rules:', e);
    }
  }

  /**
   * Loads all takeoff items for a project
   */
  public static getTakeoffItems(projectId: string): TakeoffItemRecord[] {
    if (!projectId) return [];
    try {
      const stored = localStorage.getItem(`${TAKEOFF_STORAGE_KEY_PREFIX}${projectId}`);
      if (stored) {
        const items: TakeoffItemRecord[] = JSON.parse(stored);
        return items;
      }
    } catch (e) {
      console.warn('Failed to parse stored takeoff items:', e);
    }
    return [];
  }

  /**
   * Saves all takeoff items for a project
   */
  public static saveTakeoffItems(projectId: string, items: TakeoffItemRecord[]): void {
    if (!projectId) return;
    try {
      localStorage.setItem(`${TAKEOFF_STORAGE_KEY_PREFIX}${projectId}`, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save takeoff items:', e);
    }
  }

  /**
   * Update or insert a single takeoff item with calculation update & audit logging
   */
  public static saveTakeoffItem(
    projectId: string,
    updatedItem: TakeoffItemRecord,
    auditAction: CalculationAuditRecord['action'] = 'INPUT_MODIFIED',
    reason = 'Manual engineer edit'
  ): TakeoffItemRecord {
    const rules = this.getEngineeringRules(projectId);
    
    // Recalculate calculation record
    const evalResult = TakeoffCalculationEngine.evaluate(
      updatedItem.calculation.templateType,
      updatedItem.calculation.inputs,
      updatedItem.calculation.deductions,
      rules,
      updatedItem.wastagePercent
    );

    const now = new Date().toISOString();
    const previousVal = updatedItem.measuredQuantity;

    // Build audit record
    const auditRecord: CalculationAuditRecord = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: now,
      user: 'Lead Quantity Surveyor (You)',
      action: auditAction,
      previousValue: previousVal,
      newValue: evalResult.netMeasuredQuantity,
      previousFormula: updatedItem.calculation.formula,
      newFormula: evalResult.formula,
      reason
    };

    const newCalculation: DetailedCalculationRecord = {
      ...updatedItem.calculation,
      formula: evalResult.formula,
      formulaNotation: evalResult.formulaNotation,
      evaluatedExpression: evalResult.evaluatedExpression,
      intermediateSteps: evalResult.intermediateSteps,
      grossQuantity: evalResult.grossQuantity,
      totalDeductions: evalResult.totalDeductions,
      netMeasuredQuantity: evalResult.netMeasuredQuantity,
      wastageQuantity: evalResult.wastageQuantity,
      tenderQuantity: evalResult.tenderQuantity,
      unit: evalResult.unit,
      isBlockedByOpenItem: evalResult.isBlocked,
      blockedReason: evalResult.blockedReason,
      status: evalResult.isBlocked
        ? 'BLOCKED'
        : updatedItem.verificationStatus === 'USER_VERIFIED'
        ? 'USER_VERIFIED'
        : updatedItem.verificationStatus === 'USER_CORRECTED'
        ? 'USER_CORRECTED'
        : evalResult.status,
      modifiedAt: now,
      auditTrail: [auditRecord, ...(updatedItem.calculation.auditTrail || [])]
    };

    const recomputedItem: TakeoffItemRecord = {
      ...updatedItem,
      calculation: newCalculation,
      formulaSummary: `${evalResult.evaluatedExpression} = ${evalResult.netMeasuredQuantity} ${evalResult.unit}`,
      unit: evalResult.unit,
      measuredQuantity: evalResult.netMeasuredQuantity,
      wastageQuantity: evalResult.wastageQuantity,
      tenderQuantity: evalResult.tenderQuantity,
      status: newCalculation.status,
      openItemCount: evalResult.isBlocked ? 1 : 0,
      blockedReason: evalResult.blockedReason,
      lastModifiedAt: now
    };

    const allItems = this.getTakeoffItems(projectId);
    const index = allItems.findIndex(i => i.id === recomputedItem.id);
    if (index >= 0) {
      allItems[index] = recomputedItem;
    } else {
      allItems.unshift(recomputedItem);
    }
    this.saveTakeoffItems(projectId, allItems);
    return recomputedItem;
  }

  /**
   * Resolves a blocking open item for a takeoff item and recalculates immediately
   */
  public static resolveOpenItem(
    projectId: string,
    takeoffItemId: string,
    parameterName: string,
    resolvedValue: number,
    unit: string,
    notes = 'Resolved via Takeoff Workspace Open Item Inspector'
  ): TakeoffItemRecord | null {
    const allItems = this.getTakeoffItems(projectId);
    const item = allItems.find(i => i.id === takeoffItemId);
    if (!item) return null;

    // Update the input parameter
    const updatedInputs = item.calculation.inputs.map(inp => {
      if (inp.name.toLowerCase() === parameterName.toLowerCase() || inp.id.toLowerCase() === parameterName.toLowerCase()) {
        return {
          ...inp,
          value: resolvedValue,
          unit,
          isMissing: false,
          isUserOverridden: true,
          sourceDescription: `User Confirmed: ${notes}`
        };
      }
      return inp;
    });

    const updatedItem: TakeoffItemRecord = {
      ...item,
      verificationStatus: 'USER_CORRECTED',
      calculation: {
        ...item.calculation,
        inputs: updatedInputs
      },
      notes: item.notes ? `${item.notes} | ${notes}` : notes
    };

    return this.saveTakeoffItem(projectId, updatedItem, 'OPEN_ITEM_RESOLVED', `Resolved ${parameterName} = ${resolvedValue} ${unit}`);
  }

  /**
   * Bulk mass editing of multiple items with safety confirmation & recomputation
   */
  public static massEditTakeoffItems(
    projectId: string,
    itemIds: string[],
    changes: {
      parameterName?: string;
      parameterValue?: number;
      wastagePercent?: number;
      verificationStatus?: 'USER_VERIFIED' | 'USER_CORRECTED';
      notes?: string;
    },
    reason: string
  ): TakeoffItemRecord[] {
    const rules = this.getEngineeringRules(projectId);
    const allItems = this.getTakeoffItems(projectId);
    const updatedList: TakeoffItemRecord[] = [];

    const now = new Date().toISOString();

    allItems.forEach(item => {
      if (itemIds.includes(item.id)) {
        let updatedInputs = [...item.calculation.inputs];
        if (changes.parameterName && changes.parameterValue !== undefined) {
          updatedInputs = updatedInputs.map(inp => {
            if (inp.name.toLowerCase() === changes.parameterName?.toLowerCase()) {
              return {
                ...inp,
                value: changes.parameterValue!,
                isMissing: false,
                isUserOverridden: true,
                sourceDescription: `Bulk Applied: ${reason}`
              };
            }
            return inp;
          });
        }

        const newWastage = changes.wastagePercent !== undefined ? changes.wastagePercent : item.wastagePercent;
        const newVerification = changes.verificationStatus || item.verificationStatus;

        const evalResult = TakeoffCalculationEngine.evaluate(
          item.calculation.templateType,
          updatedInputs,
          item.calculation.deductions,
          rules,
          newWastage
        );

        const auditRecord: CalculationAuditRecord = {
          id: `AUD-MASS-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          timestamp: now,
          user: 'Lead Quantity Surveyor (You)',
          action: 'MASS_EDITED',
          previousValue: item.measuredQuantity,
          newValue: evalResult.netMeasuredQuantity,
          reason: `Bulk Update applied to ${itemIds.length} items: ${reason}`
        };

        const recomputedCalculation: DetailedCalculationRecord = {
          ...item.calculation,
          inputs: updatedInputs,
          formula: evalResult.formula,
          formulaNotation: evalResult.formulaNotation,
          evaluatedExpression: evalResult.evaluatedExpression,
          intermediateSteps: evalResult.intermediateSteps,
          grossQuantity: evalResult.grossQuantity,
          totalDeductions: evalResult.totalDeductions,
          netMeasuredQuantity: evalResult.netMeasuredQuantity,
          wastageQuantity: evalResult.wastageQuantity,
          tenderQuantity: evalResult.tenderQuantity,
          unit: evalResult.unit,
          isBlockedByOpenItem: evalResult.isBlocked,
          blockedReason: evalResult.blockedReason,
          status: evalResult.isBlocked ? 'BLOCKED' : newVerification === 'USER_VERIFIED' ? 'USER_VERIFIED' : 'USER_CORRECTED',
          modifiedAt: now,
          auditTrail: [auditRecord, ...(item.calculation.auditTrail || [])]
        };

        const modifiedItem: TakeoffItemRecord = {
          ...item,
          calculation: recomputedCalculation,
          formulaSummary: `${evalResult.evaluatedExpression} = ${evalResult.netMeasuredQuantity} ${evalResult.unit}`,
          unit: evalResult.unit,
          measuredQuantity: evalResult.netMeasuredQuantity,
          wastagePercent: newWastage,
          wastageQuantity: evalResult.wastageQuantity,
          tenderQuantity: evalResult.tenderQuantity,
          verificationStatus: newVerification,
          status: recomputedCalculation.status,
          openItemCount: evalResult.isBlocked ? 1 : 0,
          blockedReason: evalResult.blockedReason,
          notes: changes.notes ? `${item.notes || ''} | ${changes.notes}` : item.notes,
          lastModifiedAt: now
        };

        updatedList.push(modifiedItem);
      }
    });

    // Merge back into storage
    const updatedMap = new Map(updatedList.map(i => [i.id, i]));
    const merged = allItems.map(item => updatedMap.get(item.id) || item);
    this.saveTakeoffItems(projectId, merged);

    return updatedList;
  }

  /**
   * Recalculates all takeoff items when engineering rules (rounding, wastage, codes) change
   */
  public static recalculateAll(projectId: string): TakeoffItemRecord[] {
    const rules = this.getEngineeringRules(projectId);
    const allItems = this.getTakeoffItems(projectId);

    const recomputed = allItems.map(item => {
      const evalResult = TakeoffCalculationEngine.evaluate(
        item.calculation.templateType,
        item.calculation.inputs,
        item.calculation.deductions,
        rules,
        item.wastagePercent
      );

      const newCalculation: DetailedCalculationRecord = {
        ...item.calculation,
        formula: evalResult.formula,
        formulaNotation: evalResult.formulaNotation,
        evaluatedExpression: evalResult.evaluatedExpression,
        intermediateSteps: evalResult.intermediateSteps,
        grossQuantity: evalResult.grossQuantity,
        totalDeductions: evalResult.totalDeductions,
        netMeasuredQuantity: evalResult.netMeasuredQuantity,
        wastageQuantity: evalResult.wastageQuantity,
        tenderQuantity: evalResult.tenderQuantity,
        unit: evalResult.unit,
        isBlockedByOpenItem: evalResult.isBlocked,
        blockedReason: evalResult.blockedReason,
        status: evalResult.isBlocked
          ? 'BLOCKED'
          : item.verificationStatus === 'USER_VERIFIED'
          ? 'USER_VERIFIED'
          : item.verificationStatus === 'USER_CORRECTED'
          ? 'USER_CORRECTED'
          : evalResult.status
      };

      return {
        ...item,
        calculation: newCalculation,
        formulaSummary: `${evalResult.evaluatedExpression} = ${evalResult.netMeasuredQuantity} ${evalResult.unit}`,
        unit: evalResult.unit,
        measuredQuantity: evalResult.netMeasuredQuantity,
        wastageQuantity: evalResult.wastageQuantity,
        tenderQuantity: evalResult.tenderQuantity,
        status: newCalculation.status,
        openItemCount: evalResult.isBlocked ? 1 : 0,
        blockedReason: evalResult.blockedReason
      };
    });

    this.saveTakeoffItems(projectId, recomputed);
    return recomputed;
  }

  /**
   * Bootstraps / seeds full Takeoff Items from project extracted elements, documents and standard building sequence
   */
  public static bootstrapInitialTakeoff(
    project: ProjectRecord,
    documents: ProjectDocument[] = []
  ): TakeoffItemRecord[] {
    const projectId = project.id;
    const existing = this.getTakeoffItems(projectId);
    if (existing.length > 0) return existing;

    const rules = this.getEngineeringRules(projectId);
    const generatedItems: TakeoffItemRecord[] = [];
    const now = new Date().toISOString();

    const docMap = new Map(documents.map(d => [d.id, d]));
    const defaultDoc = documents[0] || {
      id: 'DOC-SEED-01',
      drawingNumber: 'S-201',
      revision: 'Rev 01',
      title: 'Foundation & Structural Layout'
    };

    // -------------------------------------------------------------
    // 1. SITE & EXCAVATION (Category B - Stage 02)
    // -------------------------------------------------------------
    {
      const inputs: CalculationInputParameter[] = [
        { id: 'inp-len', name: 'length', label: 'Excavation Length', value: 24.50, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Building Footprint Outline + 1.0m Working Space' },
        { id: 'inp-wid', name: 'width', label: 'Excavation Width', value: 16.50, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Building Width + 1.0m Working Space' },
        { id: 'inp-dep', name: 'depth', label: 'Excavation Depth', value: 1.80, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Natural Ground to Formation Level -1.80m' },
        { id: 'inp-cnt', name: 'count', label: 'Number of Pits / Zones', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('EARTHWORK_BULK', inputs, [], rules, 0);
      const itemId = 'TO-0001';
      const calcId = 'CALC-0001';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-02.01.01',
        projectId,
        category: 'B_EARTHWORK',
        categoryCode: 'B',
        subcategory: 'Bulk Excavation',
        sequenceStage: '02_EXCAVATION',
        sequenceOrder: 2,
        description: 'Bulk excavation in all types of soil for basement & foundations from NGL down to formation level (-1.80m)',
        elementType: 'Earthwork',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'C-101',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Site Perimeter / Overall Plot Grid A-F / 1-6',
        boundingBox: { x: 10, y: 15, width: 80, height: 70, color: '#f59e0b', label: 'Site Excavation Zone' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'EARTHWORK_BULK',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'm³',
          roundingDecimals: rules.rounding.concreteVolumeDecimals,
          wastagePercentage: 0,
          wastageQuantity: 0,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'C-101',
            revision: '01',
            page: 1,
            locationDescription: 'Overall Site Footprint Grid A-F / 1-6'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-01',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Initial Takeoff Setup from Civil Site Plan'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} m³`,
        unit: 'm³',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: 0,
        wastageQuantity: 0,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 0.98,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 2. PCC BLINDING (Category C - Stage 04)
    // -------------------------------------------------------------
    {
      const inputs: CalculationInputParameter[] = [
        { id: 'inp-pcc-l', name: 'length', label: 'Blinding Length (Footing + 0.1m offset)', value: 2.20, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Footing F1 (2.0m + 2x100mm projection)' },
        { id: 'inp-pcc-w', name: 'width', label: 'Blinding Width (Footing + 0.1m offset)', value: 2.20, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Footing F1 (2.0m + 2x100mm projection)' },
        { id: 'inp-pcc-t', name: 'thickness', label: 'PCC Thickness', value: 0.10, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Standard General Notes: 100mm PCC C15/20 Blinding' },
        { id: 'inp-pcc-n', name: 'count', label: 'Number of Footings (F1)', value: 12, unit: 'Nr', isMissing: false, isMandatory: true, sourceDescription: 'Foundation Schedule: 12 Nr F1 Footings' }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('PCC_BLINDING', inputs, [], rules, 0);
      const itemId = 'TO-0002';
      const calcId = 'CALC-0002';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-03.01.01',
        projectId,
        category: 'C_SUBSTRUCTURE',
        categoryCode: 'C',
        subcategory: 'PCC Blinding',
        sequenceStage: '04_PCC_BLINDING',
        sequenceOrder: 4,
        description: '100mm thick Plain Cement Concrete (PCC M15) blinding under isolated footings F1 with 100mm side projection',
        elementType: 'PCC Blinding',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'S-201',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Foundation Layout Grid 1-4 / A-C',
        boundingBox: { x: 18, y: 22, width: 25, height: 30, color: '#94a3b8', label: 'PCC Blinding Footing F1' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'PCC_BLINDING',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'm³',
          roundingDecimals: rules.rounding.concreteVolumeDecimals,
          wastagePercentage: 0,
          wastageQuantity: 0,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'S-201',
            revision: '01',
            page: 1,
            locationDescription: 'Foundation Plan Detail Sheet S-201'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-02',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Calculated from Foundation Schedule'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} m³`,
        unit: 'm³',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: 0,
        wastageQuantity: 0,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 0.99,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 3. RCC ISOLATED FOOTINGS F1 (Category C - Stage 06)
    // -------------------------------------------------------------
    {
      const inputs: CalculationInputParameter[] = [
        { id: 'inp-f-l', name: 'length', label: 'Footing Length', value: 2.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Schedule of Footings: F1 Length 2000mm' },
        { id: 'inp-f-w', name: 'width', label: 'Footing Width', value: 2.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Schedule of Footings: F1 Width 2000mm' },
        { id: 'inp-f-d', name: 'depth', label: 'Footing Depth / Thickness', value: 0.50, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Section 1-1 / S-201: Depth 500mm' },
        { id: 'inp-f-n', name: 'count', label: 'Number of Footings', value: 12, unit: 'Nr', isMissing: false, isMandatory: true, sourceDescription: 'Foundation Layout: 12 Nr F1' }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('RCC_FOOTING', inputs, [], rules, 0);
      const itemId = 'TO-0003';
      const calcId = 'CALC-0003';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-03.02.01',
        projectId,
        category: 'C_SUBSTRUCTURE',
        categoryCode: 'C',
        subcategory: 'Isolated Footings',
        sequenceStage: '06_FOOTING_RAFT_PILECAP',
        sequenceOrder: 6,
        description: 'Reinforced cement concrete (M35 Grade) in isolated pad footings F1 (2000 x 2000 x 500mm)',
        elementType: 'Footing',
        elementId: 'FTG-F1',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'S-201',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Foundation Layout Grid Axis 1-4 / A-C',
        boundingBox: { x: 20, y: 25, width: 22, height: 26, color: '#3b82f6', label: 'RCC Footing F1 (12 Nr)' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'RCC_FOOTING',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'm³',
          roundingDecimals: rules.rounding.concreteVolumeDecimals,
          wastagePercentage: 0,
          wastageQuantity: 0,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'S-201',
            revision: '01',
            page: 1,
            locationDescription: 'Footing Schedule Sheet S-201'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-03',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Generated from Schedule of Footings'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} m³`,
        unit: 'm³',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: 0,
        wastageQuantity: 0,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 1.0,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 4. FOOTING FORMWORK (Category F - Stage 06)
    // -------------------------------------------------------------
    {
      const inputs: CalculationInputParameter[] = [
        { id: 'inp-fw-f-l', name: 'length', label: 'Footing Length', value: 2.00, unit: 'm', isMissing: false, isMandatory: true },
        { id: 'inp-fw-f-w', name: 'width', label: 'Footing Width', value: 2.00, unit: 'm', isMissing: false, isMandatory: true },
        { id: 'inp-fw-f-d', name: 'depth', label: 'Footing Side Depth', value: 0.50, unit: 'm', isMissing: false, isMandatory: true },
        { id: 'inp-fw-f-n', name: 'count', label: 'Number of Footings', value: 12, unit: 'Nr', isMissing: false, isMandatory: true }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('FORMWORK_FOOTING', inputs, [], rules, 0);
      const itemId = 'TO-0004';
      const calcId = 'CALC-0004';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-06.01.01',
        projectId,
        category: 'F_FORMWORK',
        categoryCode: 'F',
        subcategory: 'Footing Side Formwork',
        sequenceStage: '06_FOOTING_RAFT_PILECAP',
        sequenceOrder: 6,
        description: 'Formwork / shuttering to vertical sides of isolated pad footings F1',
        elementType: 'Formwork',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'S-201',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Foundation Layout Grid 1-4 / A-C',
        boundingBox: { x: 20, y: 25, width: 22, height: 26, color: '#ec4899', label: 'Footing Formwork F1' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'FORMWORK_FOOTING',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'm²',
          roundingDecimals: rules.rounding.areaDecimals,
          wastagePercentage: 0,
          wastageQuantity: 0,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'S-201',
            revision: '01',
            page: 1,
            locationDescription: 'Footing Perimeter Formwork Sheet S-201'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-04',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Calculated Perimeter x Depth x Count'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} m²`,
        unit: 'm²',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: 0,
        wastageQuantity: 0,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 1.0,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 5. GROUND BEAMS (Category C - Stage 08)
    // -------------------------------------------------------------
    {
      const inputs: CalculationInputParameter[] = [
        { id: 'inp-gb-l', name: 'length', label: 'Total Ground Beam Length', value: 84.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Tie Beam Layout between Grids A-F' },
        { id: 'inp-gb-w', name: 'width', label: 'Ground Beam Width', value: 0.30, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Section GB-1 (300mm x 500mm)' },
        { id: 'inp-gb-d', name: 'depth', label: 'Ground Beam Depth', value: 0.50, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Section GB-1 (300mm x 500mm)' },
        { id: 'inp-gb-n', name: 'count', label: 'Number of Runs', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('RCC_GROUND_BEAM', inputs, [], rules, 0);
      const itemId = 'TO-0005';
      const calcId = 'CALC-0005';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-03.04.01',
        projectId,
        category: 'C_SUBSTRUCTURE',
        categoryCode: 'C',
        subcategory: 'Ground Beams / Tie Beams',
        sequenceStage: '08_GROUND_BEAM',
        sequenceOrder: 8,
        description: 'Reinforced cement concrete (M35 Grade) in plinth level ground beams GB-1 (300 x 500mm)',
        elementType: 'Ground Beam',
        elementId: 'GB-01',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'S-201',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Plinth Beam Level Grid Lines 1,2,3,4 & A,B,C',
        boundingBox: { x: 15, y: 20, width: 70, height: 50, color: '#3b82f6', label: 'Ground Beams GB-1' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'RCC_GROUND_BEAM',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'm³',
          roundingDecimals: rules.rounding.concreteVolumeDecimals,
          wastagePercentage: 0,
          wastageQuantity: 0,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'S-201',
            revision: '01',
            page: 1,
            locationDescription: 'Tie Beam Detail Sheet S-201'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-05',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Computed from Ground Beam Schedule'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} m³`,
        unit: 'm³',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: 0,
        wastageQuantity: 0,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 0.97,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 6. DPC (Category H - Stage 10)
    // -------------------------------------------------------------
    {
      const inputs: CalculationInputParameter[] = [
        { id: 'inp-dpc-l', name: 'length', label: 'Wall Plinth Length', value: 84.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Total External & Internal Ground Floor Wall Length' },
        { id: 'inp-dpc-w', name: 'width', label: 'DPC Membrane Width (Wall Thickness)', value: 0.20, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Matches 200mm Blockwork Width' },
        { id: 'inp-dpc-n', name: 'count', label: 'Number of Wall Plinths', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('DPC', inputs, [], rules, rules.wastageRates.dpcWaterproofingPct);
      const itemId = 'TO-0006';
      const calcId = 'CALC-0006';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-08.01.01',
        projectId,
        category: 'H_DPC_WATERPROOFING',
        categoryCode: 'H',
        subcategory: 'Damp Proof Course (DPC)',
        sequenceStage: '10_DPC',
        sequenceOrder: 10,
        description: 'Supply and lay 2-ply bituminous Damp Proof Course (DPC) membrane 200mm wide on top of plinth beams',
        elementType: 'DPC',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'A-101',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Plinth Level ±0.00 along all Ground Floor Walls',
        boundingBox: { x: 15, y: 20, width: 70, height: 50, color: '#06b6d4', label: 'DPC Barrier (200mm width)' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'DPC',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'm²',
          roundingDecimals: rules.rounding.areaDecimals,
          wastagePercentage: rules.wastageRates.dpcWaterproofingPct,
          wastageQuantity: evalRes.wastageQuantity,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'A-101',
            revision: '01',
            page: 1,
            locationDescription: 'Architectural Ground Floor Detail Sheet A-101'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-06',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Measured from Wall Plinth Run'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} m²`,
        unit: 'm²',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: rules.wastageRates.dpcWaterproofingPct,
        wastageQuantity: evalRes.wastageQuantity,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 0.99,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 7. RCC SUPERSTRUCTURE COLUMNS (Category D - Stage 12)
    // -------------------------------------------------------------
    {
      const inputs: CalculationInputParameter[] = [
        { id: 'inp-col-w', name: 'width', label: 'Column Width', value: 0.40, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Column Schedule C1 (400mm x 400mm)' },
        { id: 'inp-col-d', name: 'depth', label: 'Column Depth', value: 0.40, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Column Schedule C1 (400mm x 400mm)' },
        { id: 'inp-col-h', name: 'height', label: 'Clear Column Height', value: 3.50, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Floor-to-Floor Height 3.50m (±0.00 to +3.50m)' },
        { id: 'inp-col-n', name: 'count', label: 'Number of Columns (C1)', value: 12, unit: 'Nr', isMissing: false, isMandatory: true, sourceDescription: 'Structural Plan: 12 Columns C1' }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('RCC_COLUMN', inputs, [], rules, 0);
      const itemId = 'TO-0007';
      const calcId = 'CALC-0007';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-04.01.01',
        projectId,
        category: 'D_RCC',
        categoryCode: 'D',
        subcategory: 'Columns',
        sequenceStage: '12_COLUMNS',
        sequenceOrder: 12,
        description: 'Reinforced cement concrete (M35 Grade) in ground floor structural columns C1 (400 x 400mm x 3.5m height)',
        elementType: 'Column',
        elementId: 'COL-C1',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'S-202',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Ground Floor Column Layout Grid 1-4 / A-C',
        boundingBox: { x: 25, y: 30, width: 10, height: 10, color: '#3b82f6', label: 'Column C1 (12 Nr)' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'RCC_COLUMN',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'm³',
          roundingDecimals: rules.rounding.concreteVolumeDecimals,
          wastagePercentage: 0,
          wastageQuantity: 0,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'S-202',
            revision: '01',
            page: 1,
            locationDescription: 'Column Schedule Sheet S-202'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-07',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Calculated 0.40 x 0.40 x 3.50 x 12 = 6.720 m³'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} m³`,
        unit: 'm³',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: 0,
        wastageQuantity: 0,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 1.0,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 8. COLUMN FORMWORK (Category F - Stage 12)
    // -------------------------------------------------------------
    {
      const inputs: CalculationInputParameter[] = [
        { id: 'inp-col-fw-w', name: 'width', label: 'Column Width', value: 0.40, unit: 'm', isMissing: false, isMandatory: true },
        { id: 'inp-col-fw-d', name: 'depth', label: 'Column Depth', value: 0.40, unit: 'm', isMissing: false, isMandatory: true },
        { id: 'inp-col-fw-h', name: 'height', label: 'Formwork Height', value: 3.50, unit: 'm', isMissing: false, isMandatory: true },
        { id: 'inp-col-fw-n', name: 'count', label: 'Number of Columns', value: 12, unit: 'Nr', isMissing: false, isMandatory: true }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('FORMWORK_COLUMN', inputs, [], rules, 0);
      const itemId = 'TO-0008';
      const calcId = 'CALC-0008';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-06.02.01',
        projectId,
        category: 'F_FORMWORK',
        categoryCode: 'F',
        subcategory: 'Column Formwork',
        sequenceStage: '12_COLUMNS',
        sequenceOrder: 12,
        description: 'Formwork to four vertical sides of rectangular columns C1 (Perimeter 2 x (0.4+0.4) = 1.6m x 3.5m x 12 Nr = 67.20 m²)',
        elementType: 'Formwork',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'S-202',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Ground Floor Column Layout Grid 1-4 / A-C',
        boundingBox: { x: 25, y: 30, width: 10, height: 10, color: '#ec4899', label: 'Column Formwork C1' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'FORMWORK_COLUMN',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'm²',
          roundingDecimals: rules.rounding.areaDecimals,
          wastagePercentage: 0,
          wastageQuantity: 0,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'S-202',
            revision: '01',
            page: 1,
            locationDescription: 'Column Formwork Calculation'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-08',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Computed 2 x (0.40+0.40) x 3.50 x 12 = 67.20 m²'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} m²`,
        unit: 'm²',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: 0,
        wastageQuantity: 0,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 1.0,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 9. FLOOR BEAMS B101 (Category D - Stage 13)
    // -------------------------------------------------------------
    {
      const inputs: CalculationInputParameter[] = [
        { id: 'inp-bm-l', name: 'length', label: 'Beam Span Length', value: 6.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Clear Span between Column Grid 1 and 2' },
        { id: 'inp-bm-w', name: 'width', label: 'Beam Width', value: 0.30, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Beam Schedule: B101 Width 300mm' },
        { id: 'inp-bm-d', name: 'depth', label: 'Beam Depth', value: 0.60, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Beam Schedule: B101 Depth 600mm' },
        { id: 'inp-bm-n', name: 'count', label: 'Number of Beams', value: 8, unit: 'Nr', isMissing: false, isMandatory: true, sourceDescription: 'Level 1 Framing Plan: 8 Nr B101' }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('RCC_BEAM', inputs, [], rules, 0);
      const itemId = 'TO-0009';
      const calcId = 'CALC-0009';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-04.02.01',
        projectId,
        category: 'D_RCC',
        categoryCode: 'D',
        subcategory: 'Floor Beams',
        sequenceStage: '13_BEAMS',
        sequenceOrder: 13,
        description: 'Reinforced cement concrete (M35 Grade) in first floor suspended floor beams B101 (300 x 600mm x 6.0m span)',
        elementType: 'Beam',
        elementId: 'BM-B101',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'S-203',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Level 1 Framing Plan Grid 1-4 / A-C',
        boundingBox: { x: 30, y: 35, width: 40, height: 6, color: '#3b82f6', label: 'Beams B101 (8 Nr)' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'RCC_BEAM',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'm³',
          roundingDecimals: rules.rounding.concreteVolumeDecimals,
          wastagePercentage: 0,
          wastageQuantity: 0,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'S-203',
            revision: '01',
            page: 1,
            locationDescription: 'First Floor Beam Schedule Sheet S-203'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-09',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Calculated 0.30 x 0.60 x 6.00 x 8 = 8.640 m³'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} m³`,
        unit: 'm³',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: 0,
        wastageQuantity: 0,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 1.0,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 10. MASONRY WALL WITH DOOR/WINDOW DEDUCTIONS (Category G - Stage 11)
    // -------------------------------------------------------------
    {
      const wallInputs: CalculationInputParameter[] = [
        { id: 'inp-w-l', name: 'length', label: 'Wall Length', value: 10.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Grid 1 Wall between Grid A and C' },
        { id: 'inp-w-h', name: 'height', label: 'Wall Height', value: 3.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Clear Height between Floor & Beam Soffit' },
        { id: 'inp-w-t', name: 'thickness', label: 'Blockwork Thickness', value: 0.20, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: '200mm Solid Concrete Blockwork Specification' },
        { id: 'inp-w-n', name: 'count', label: 'Number of Wall Panels', value: 2, unit: 'Nr', isMissing: false, isMandatory: true }
      ];

      // Concrete / Masonry Deductions for Openings (Door D1 & Window W1)
      const deductions: TakeoffDeductionRecord[] = [
        {
          id: 'DED-01',
          parentElementId: 'WL-01',
          parentElementName: 'Wall Panel W-01 (Grid 1)',
          openingElementId: 'DR-D01',
          openingElementName: 'Door D-01 (1000 x 2100mm)',
          openingType: 'door',
          widthM: 1.00,
          heightOrLengthM: 2.10,
          thicknessM: 0.20,
          count: 2, // 2 doors in total across the 2 wall panels
          deductionAreaM2: 1.00 * 2.10 * 2, // 4.20 m²
          deductionVolumeM3: 1.00 * 2.10 * 0.20 * 2, // 0.840 m³
          ruleUsed: 'IS 1200 / POMI: Openings > 0.10 m² fully deducted',
          isDeductible: true,
          sourceDrawing: 'A-101 Rev 01',
          sourceLocation: 'Door Schedule Reference D-01'
        },
        {
          id: 'DED-02',
          parentElementId: 'WL-01',
          parentElementName: 'Wall Panel W-01 (Grid 1)',
          openingElementId: 'WN-W01',
          openingElementName: 'Window W-01 (1500 x 1200mm)',
          openingType: 'window',
          widthM: 1.50,
          heightOrLengthM: 1.20,
          thicknessM: 0.20,
          count: 2,
          deductionAreaM2: 1.50 * 1.20 * 2, // 3.60 m²
          deductionVolumeM3: 1.50 * 1.20 * 0.20 * 2, // 0.720 m³
          ruleUsed: 'IS 1200 / POMI: Openings > 0.10 m² fully deducted',
          isDeductible: true,
          sourceDrawing: 'A-101 Rev 01',
          sourceLocation: 'Window Schedule Reference W-01'
        }
      ];

      const evalRes = TakeoffCalculationEngine.evaluate('MASONRY_WALL_VOL', wallInputs, deductions, rules, rules.wastageRates.masonryBlocksPct);
      const itemId = 'TO-0010';
      const calcId = 'CALC-0010';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-07.01.01',
        projectId,
        category: 'G_MASONRY',
        categoryCode: 'G',
        subcategory: '200mm Solid Concrete Blockwork',
        sequenceStage: '11_WALLS_SUB',
        sequenceOrder: 11,
        description: '200mm thick solid concrete blockwork in cement mortar 1:4 with opening deductions for Doors D-01 (2 Nr) and Windows W-01 (2 Nr)',
        elementType: 'Wall',
        elementId: 'WL-01',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'A-101',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Ground Floor Wall Grid 1 / A-C',
        boundingBox: { x: 15, y: 40, width: 60, height: 4, color: '#8b5cf6', label: 'Masonry Wall W-01 with Deductions' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'MASONRY_WALL_VOL',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs: wallInputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions,
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: evalRes.totalDeductions,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'm³',
          roundingDecimals: rules.rounding.concreteVolumeDecimals,
          wastagePercentage: rules.wastageRates.masonryBlocksPct,
          wastageQuantity: evalRes.wastageQuantity,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'A-101',
            revision: '01',
            page: 1,
            locationDescription: 'Architectural Ground Floor Plan Sheet A-101'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-10',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Gross 12.000 m³ - Deductions 1.560 m³ = 10.440 m³'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `Gross ${evalRes.grossQuantity} m³ − Deductions ${evalRes.totalDeductions} m³ = ${evalRes.netMeasuredQuantity} m³`,
        unit: 'm³',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: rules.wastageRates.masonryBlocksPct,
        wastageQuantity: evalRes.wastageQuantity,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 1.0,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 11. BLOCKED WALL ITEM (MISSING THICKNESS -> OPEN ITEM REQUIRED)
    // -------------------------------------------------------------
    {
      const blockedInputs: CalculationInputParameter[] = [
        { id: 'inp-bw-l', name: 'length', label: 'Wall Length', value: 8.50, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Partition Wall Length Grid D' },
        { id: 'inp-bw-h', name: 'height', label: 'Wall Height', value: 3.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Floor to Ceiling 3.00m' },
        { id: 'inp-bw-t', name: 'thickness', label: 'Wall Thickness', value: null, unit: 'm', isMissing: true, isMandatory: true, sourceDescription: 'MISSING IN DRAWING (No callout or hatch key)' },
        { id: 'inp-bw-n', name: 'count', label: 'Number of Walls', value: 1, unit: 'Nr', isMissing: false, isMandatory: true }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('MASONRY_WALL_VOL', blockedInputs, [], rules, rules.wastageRates.masonryBlocksPct);
      const itemId = 'TO-0011';
      const calcId = 'CALC-0011';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-07.02.01',
        projectId,
        category: 'G_MASONRY',
        categoryCode: 'G',
        subcategory: '150mm Partition Blockwork',
        sequenceStage: '11_WALLS_SUB',
        sequenceOrder: 11,
        description: 'Internal partition wall W-12 on Grid D (Length 8.50m x Height 3.00m) — BLOCKED: Wall thickness missing in drawing',
        elementType: 'Wall',
        elementId: 'WL-12',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'A-102',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Internal Corridor Grid D/2-4',
        boundingBox: { x: 45, y: 55, width: 35, height: 4, color: '#ef4444', label: 'Wall W-12 [MISSING THICKNESS - OPEN ITEM]' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'MASONRY_WALL_VOL',
          formula: 'BLOCKED (Incomplete inputs)',
          formulaNotation: 'BLOCKED',
          evaluatedExpression: 'Length 8.50m × Height 3.00m × Thickness [MISSING]',
          inputs: blockedInputs,
          intermediateSteps: [],
          deductions: [],
          grossQuantity: 0,
          totalDeductions: 0,
          netMeasuredQuantity: 0,
          unit: 'm³',
          roundingDecimals: rules.rounding.concreteVolumeDecimals,
          wastagePercentage: rules.wastageRates.masonryBlocksPct,
          wastageQuantity: 0,
          tenderQuantity: 0,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'A-102',
            revision: '01',
            page: 1,
            locationDescription: 'Corridor Partition Wall Grid D/2-4 Sheet A-102'
          },
          isBlockedByOpenItem: true,
          blockedReason: 'Missing mandatory parameter: Wall Thickness. Cannot calculate final BOQ volume without confirmed thickness.',
          associatedOpenItemIds: ['OI-PARAM-thickness'],
          status: 'BLOCKED',
          auditTrail: [{
            id: 'AUD-SEED-11',
            timestamp: now,
            user: 'Automated Engineering Engine',
            action: 'CREATED',
            previousValue: null,
            newValue: 0,
            reason: 'Flagged as BLOCKED due to unnoted wall thickness'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: 'BLOCKED: Confirm wall thickness (Open Item Required)',
        unit: 'm³',
        measuredQuantity: 0,
        wastagePercent: rules.wastageRates.masonryBlocksPct,
        wastageQuantity: 0,
        tenderQuantity: 0,
        confidence: 0.40,
        confidenceTier: 'LOW',
        verificationStatus: 'UNVERIFIED',
        status: 'BLOCKED',
        openItemCount: 1,
        openItemIds: ['OI-PARAM-thickness'],
        blockedReason: 'Confirm wall thickness to unblock calculation.',
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 12. STRUCTURAL STEEL PORTAL RAFTERS (Category L - Stage 17)
    // -------------------------------------------------------------
    {
      const steelCatalog = lookupSteelSectionWeight('UB 406x178x74');
      const unitWeight = steelCatalog.unitWeightKgM || 74.2;
      const steelInputs: CalculationInputParameter[] = [
        { id: 'inp-st-l', name: 'length', label: 'Rafter Span Length', value: 12.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Roof Truss Span 12.00m' },
        { id: 'inp-st-w', name: 'unitWeightKgM', label: 'Verified Unit Weight', value: unitWeight, unit: 'kg/m', isMissing: false, isMandatory: true, sourceDescription: 'BS EN 10365 Catalog for UB 406x178x74 = 74.20 kg/m' },
        { id: 'inp-st-n', name: 'count', label: 'Number of Rafters', value: 8, unit: 'Nr', isMissing: false, isMandatory: true, sourceDescription: 'Roof Structural Layout: 4 Portal Frames x 2 Slopes = 8 Rafters' }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('STEEL_MEMBER_WEIGHT', steelInputs, [], rules, 0);
      const itemId = 'TO-0012';
      const calcId = 'CALC-0012';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-12.01.01',
        projectId,
        category: 'L_STEEL_STRUCTURE',
        categoryCode: 'L',
        subcategory: 'Roof Rafters (UB)',
        sequenceStage: '17_ROOF_STRUCTURE',
        sequenceOrder: 17,
        description: 'Structural steel universal beams Grade S355JR in roof rafters UB 406x178x74 (12.0m length x 74.2 kg/m x 8 Nr = 7,123.20 kg / 7.123 Tonnes)',
        elementType: 'Steel Rafter',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'S-301',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Roof Framing Plan Grid 1-4 / A-B',
        boundingBox: { x: 20, y: 15, width: 60, height: 30, color: '#6366f1', label: 'Roof Rafters UB 406x178x74 (8 Nr)' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'STEEL_MEMBER_WEIGHT',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs: steelInputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'kg',
          roundingDecimals: rules.rounding.steelWeightDecimals,
          wastagePercentage: 0,
          wastageQuantity: 0,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'S-301',
            revision: '01',
            page: 1,
            locationDescription: 'Roof Structural Framing Plan Sheet S-301'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-12',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Calculated 12.00m x 74.20 kg/m x 8 Nr = 7,123.20 kg'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} kg (${(evalRes.netMeasuredQuantity / 1000).toFixed(3)} Tonnes)`,
        unit: 'kg',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: 0,
        wastageQuantity: 0,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 1.0,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 13. ROOF PURLIN SYSTEM (Category M - Stage 18)
    // -------------------------------------------------------------
    {
      const purlinInputs: CalculationInputParameter[] = [
        { id: 'inp-pur-l', name: 'roofLength', label: 'Roof Slope Length', value: 12.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Rafter Top Flange Slope Length' },
        { id: 'inp-pur-sp', name: 'spacingMm', label: 'Purlin Spacing', value: 1500, unit: 'mm', isMissing: false, isMandatory: true, sourceDescription: 'Purlin Spacing 1.50m c/c on General Notes' },
        { id: 'inp-pur-bay', name: 'bayLength', label: 'Building Length / Bay Length', value: 24.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Building Length across 4 Bays (4 x 6.0m = 24m)' },
        { id: 'inp-pur-sl', name: 'slopes', label: 'Number of Roof Slopes', value: 2, unit: 'Nr', isMissing: false, isMandatory: true, sourceDescription: 'Dual Pitch Duo-Gable Roof' },
        { id: 'inp-pur-w', name: 'unitWeightKgM', label: 'Z200-20 Purlin Unit Weight', value: 5.24, unit: 'kg/m', isMissing: false, isMandatory: true, sourceDescription: 'Cold-formed section Z200-20 catalog weight' }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('PURLIN_SYSTEM', purlinInputs, [], rules, 0);
      const itemId = 'TO-0013';
      const calcId = 'CALC-0013';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-13.01.01',
        projectId,
        category: 'M_ROOFING',
        categoryCode: 'M',
        subcategory: 'Z & C Section Roof Purlins',
        sequenceStage: '18_PURLINS',
        sequenceOrder: 18,
        description: 'Cold-formed galvanized steel Z-purlins Z200-20 @ 1.5m c/c spacing across dual slope roof (18 lines x 24m = 432m linear x 5.24 kg/m = 2,263.68 kg)',
        elementType: 'Purlin',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'S-302',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Roof Purlin Layout Sheet S-302',
        boundingBox: { x: 20, y: 15, width: 60, height: 30, color: '#f59e0b', label: 'Z200-20 Purlin Grid (18 Lines)' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'PURLIN_SYSTEM',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs: purlinInputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'kg',
          roundingDecimals: rules.rounding.steelWeightDecimals,
          wastagePercentage: 0,
          wastageQuantity: 0,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'S-302',
            revision: '01',
            page: 1,
            locationDescription: 'Roof Purlin Layout Detail Sheet S-302'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-13',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Calculated 18 lines x 24.0m x 5.24 kg/m = 2,263.68 kg'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} kg`,
        unit: 'kg',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: 0,
        wastageQuantity: 0,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 0.98,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 14. SKYLIGHT DEDICATED PURLINS (Category O - Stage 19)
    // -------------------------------------------------------------
    {
      const skylightPurlinInputs: CalculationInputParameter[] = [
        { id: 'inp-sky-pur-l', name: 'roofLength', label: 'Skylight Opening Length', value: 4.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Skylight Roof Bay Opening Length' },
        { id: 'inp-sky-pur-sp', name: 'spacingMm', label: 'Purlin Spacing', value: 1000, unit: 'mm', isMissing: false, isMandatory: true, sourceDescription: 'Skylight Trimmer Spacing 1000mm' },
        { id: 'inp-sky-pur-bay', name: 'bayLength', label: 'Trimmer Beam Length', value: 6.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Portal Bay Width 6.00m' },
        { id: 'inp-sky-pur-sl', name: 'slopes', label: 'Number of Openings', value: 2, unit: 'Nr', isMissing: false, isMandatory: true, sourceDescription: '2 Dedicated Skylight Roof Apertures' },
        { id: 'inp-sky-pur-w', name: 'unitWeightKgM', label: 'C200-15 Unit Weight', value: 3.96, unit: 'kg/m', isMissing: false, isMandatory: true, sourceDescription: 'C-Section Purlin Trimmer' }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('SKYLIGHT_PURLIN', skylightPurlinInputs, [], rules, 0);
      const itemId = 'TO-0014';
      const calcId = 'CALC-0014';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-15.01.01',
        projectId,
        category: 'O_SKYLIGHTS',
        categoryCode: 'O',
        subcategory: 'Skylight Dedicated Purlins & Framing',
        sequenceStage: '19_SKYLIGHT_PURLINS',
        sequenceOrder: 19,
        description: 'Dedicated cold-formed galvanized steel C200-15 purlins and trimmers around roof daylight skylight openings',
        elementType: 'Skylight Purlin',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'S-303',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Roof Skylight Apertures Grid B-C / 2-3',
        boundingBox: { x: 35, y: 25, width: 25, height: 15, color: '#eab308', label: 'Skylight Trimmer Purlins (C200-15)' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'SKYLIGHT_PURLIN',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs: skylightPurlinInputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'kg',
          roundingDecimals: rules.rounding.steelWeightDecimals,
          wastagePercentage: 0,
          wastageQuantity: 0,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'S-303',
            revision: '01',
            page: 1,
            locationDescription: 'Skylight Structural Detail Sheet S-303'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-14',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Calculated 10 lines x 6.0m x 3.96 kg/m = 237.60 kg'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} kg`,
        unit: 'kg',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: 0,
        wastageQuantity: 0,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 0.96,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    // -------------------------------------------------------------
    // 15. ROOF CLADDING SLOPED AREA (Category M - Stage 20)
    // -------------------------------------------------------------
    {
      const claddingInputs: CalculationInputParameter[] = [
        { id: 'inp-clad-l', name: 'planLength', label: 'Building Plan Length', value: 24.00, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Total Eaves Length 24.00m' },
        { id: 'inp-clad-w', name: 'planWidth', label: 'Half-Span Plan Width per Slope', value: 11.59, unit: 'm', isMissing: false, isMandatory: true, sourceDescription: 'Plan Projection of Rafter (12.0m * cos(15°))' },
        { id: 'inp-clad-sl', name: 'slopeDegrees', label: 'Roof Pitch / Slope Angle', value: 15.00, unit: 'deg', isMissing: false, isMandatory: true, sourceDescription: 'Roof Slope: 15° Pitch' },
        { id: 'inp-clad-n', name: 'count', label: 'Number of Slopes', value: 2, unit: 'Nr', isMissing: false, isMandatory: true, sourceDescription: 'Dual Pitch Gable Roof' }
      ];
      const evalRes = TakeoffCalculationEngine.evaluate('ROOF_CLADDING_SLOPED', claddingInputs, [], rules, rules.wastageRates.roofSheetsPct);
      const itemId = 'TO-0015';
      const calcId = 'CALC-0015';
      generatedItems.push({
        id: itemId,
        boqItemId: 'BOQ-13.02.01',
        projectId,
        category: 'M_ROOFING',
        categoryCode: 'M',
        subcategory: 'Insulated Sandwich Roof Panels',
        sequenceStage: '20_ROOF_CLADDING',
        sequenceOrder: 20,
        description: '50mm thick PIR insulated metal sandwich roof panels calculated over true 15° sloped geometry with 4.0% end-lap wastage allowance',
        elementType: 'Roof Cladding',
        drawingId: defaultDoc.id,
        drawingNumber: defaultDoc.drawingNumber || 'A-201',
        revisionId: defaultDoc.revision || '01',
        page: 1,
        sourceLocation: 'Roof Plan & Elevation Sheet A-201',
        boundingBox: { x: 10, y: 10, width: 80, height: 40, color: '#0ea5e9', label: 'Sloped Roof Cladding (15° Pitch)' },
        calculationId: calcId,
        calculation: {
          id: calcId,
          takeoffItemId: itemId,
          projectId,
          templateType: 'ROOF_CLADDING_SLOPED',
          formula: evalRes.formula,
          formulaNotation: evalRes.formulaNotation,
          evaluatedExpression: evalRes.evaluatedExpression,
          inputs: claddingInputs,
          intermediateSteps: evalRes.intermediateSteps,
          deductions: [],
          grossQuantity: evalRes.grossQuantity,
          totalDeductions: 0,
          netMeasuredQuantity: evalRes.netMeasuredQuantity,
          unit: 'm²',
          roundingDecimals: rules.rounding.areaDecimals,
          wastagePercentage: rules.wastageRates.roofSheetsPct,
          wastageQuantity: evalRes.wastageQuantity,
          tenderQuantity: evalRes.tenderQuantity,
          sourceInfo: {
            documentId: defaultDoc.id,
            drawingNumber: 'A-201',
            revision: '01',
            page: 1,
            locationDescription: 'Roof Geometry Plan Sheet A-201'
          },
          isBlockedByOpenItem: false,
          associatedOpenItemIds: [],
          status: 'USER_VERIFIED',
          auditTrail: [{
            id: 'AUD-SEED-15',
            timestamp: now,
            user: 'Lead Quantity Surveyor (You)',
            action: 'CREATED',
            previousValue: null,
            newValue: evalRes.netMeasuredQuantity,
            reason: 'Calculated (24m x 11.59m) / cos(15°) x 2 = 576.00 m² sloped area'
          }],
          createdAt: now,
          modifiedAt: now
        },
        formulaSummary: `${evalRes.evaluatedExpression} = ${evalRes.netMeasuredQuantity} m² (Tender Qty: ${evalRes.tenderQuantity} m²)`,
        unit: 'm²',
        measuredQuantity: evalRes.netMeasuredQuantity,
        wastagePercent: rules.wastageRates.roofSheetsPct,
        wastageQuantity: evalRes.wastageQuantity,
        tenderQuantity: evalRes.tenderQuantity,
        confidence: 0.99,
        confidenceTier: 'HIGH',
        verificationStatus: 'USER_VERIFIED',
        status: 'USER_VERIFIED',
        openItemCount: 0,
        openItemIds: [],
        lastModifiedAt: now
      });
    }

    this.saveTakeoffItems(projectId, generatedItems);
    return generatedItems;
  }
}
