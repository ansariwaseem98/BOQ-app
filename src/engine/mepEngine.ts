/**
 * AI BOQ & Tender Estimation Engineer - Phase 8 MEP Takeoff Engine
 * 
 * Deterministic quantity calculation, allowance management, formula formatting,
 * plan/riser reconciliation, open item generation, conflict detection, and revision tracking.
 */

import {
  MEPDiscipline,
  GeneralMEPElement,
  MEPCableTakeoffItem,
  MEPDuctworkTakeoffItem,
  MEPHVACPipingItem,
  MEPPlumbingPipeItem,
  MEPFirePipingItem,
  MEPSupportItem,
  MEPOpenItemRecord,
  MEPConflictRecord,
  MEPRevisionDiffRecord,
  MEPRiserReconciliationRecord,
  MEPSummaryData,
  MEPAuditRecord,
  CalculationRecord,
} from '../types';

export class MEPEngine {
  /**
   * 1. Calculate Cable Length with Explicit Allowances
   * Base route length + panel termination + equipment termination + vertical rise/drop + slack
   */
  public static calculateCableLength(params: {
    baseRouteLengthM: number;
    panelTerminationAllowanceM?: number;
    equipmentTerminationAllowanceM?: number;
    verticalRiseDropAllowanceM?: number;
    slackAllowanceM?: number;
  }): {
    totalLengthM: number;
    formulaWithValues: string;
    allowances: { label: string; value: number; unit: string }[];
  } {
    const base = Math.max(0, params.baseRouteLengthM || 0);
    const panel = Math.max(0, params.panelTerminationAllowanceM || 0);
    const equip = Math.max(0, params.equipmentTerminationAllowanceM || 0);
    const vertical = Math.max(0, params.verticalRiseDropAllowanceM || 0);
    const slack = Math.max(0, params.slackAllowanceM || 0);

    const total = base + panel + equip + vertical + slack;

    const allowances = [
      { label: 'Panel Termination Allowance', value: panel, unit: 'm' },
      { label: 'Equipment Termination Allowance', value: equip, unit: 'm' },
      { label: 'Vertical Rise/Drop Allowance', value: vertical, unit: 'm' },
      { label: 'Route Slack Allowance', value: slack, unit: 'm' },
    ].filter(a => a.value > 0);

    const allowanceParts = [panel, equip, vertical, slack].filter(v => v > 0);
    const allowanceSumStr = allowanceParts.length > 0 ? ` + (${allowanceParts.map(v => v.toFixed(2)).join(' + ')})` : '';
    const formulaWithValues = `${base.toFixed(2)}m (Route)${allowanceSumStr} = ${total.toFixed(2)} m`;

    return {
      totalLengthM: Number(total.toFixed(2)),
      formulaWithValues,
      allowances,
    };
  }

  /**
   * 2. Calculate Rectangular Duct Surface Area (m²)
   * Perimeter = 2 * (Width + Height) in meters
   * Surface Area = Perimeter * Length in meters
   */
  public static calculateRectangularDuctArea(params: {
    widthMm: number;
    heightMm: number;
    lengthM: number;
    gaugeThicknessMm?: number;
  }): {
    surfaceAreaM2: number;
    perimeterM: number;
    formulaWithValues: string;
    isBlocked: boolean;
    blockedReason?: string;
  } {
    if (!params.widthMm || params.widthMm <= 0 || !params.heightMm || params.heightMm <= 0) {
      return {
        surfaceAreaM2: 0,
        perimeterM: 0,
        formulaWithValues: 'BLOCKED: Missing duct width or height',
        isBlocked: true,
        blockedReason: 'Duct dimensions missing or unreadable on drawing',
      };
    }

    const widthM = params.widthMm / 1000;
    const heightM = params.heightMm / 1000;
    const perimeterM = 2 * (widthM + heightM);
    const surfaceArea = perimeterM * params.lengthM;

    const formulaWithValues = `2 × (${widthM.toFixed(3)}m + ${heightM.toFixed(3)}m) × ${params.lengthM.toFixed(2)}m = ${surfaceArea.toFixed(2)} m²`;

    return {
      surfaceAreaM2: Number(surfaceArea.toFixed(2)),
      perimeterM: Number(perimeterM.toFixed(3)),
      formulaWithValues,
      isBlocked: false,
    };
  }

  /**
   * 3. Calculate Round Spiral Duct Surface Area (m²)
   * Surface Area = π * Diameter (m) * Length (m)
   */
  public static calculateRoundDuctArea(params: {
    diameterMm: number;
    lengthM: number;
  }): {
    surfaceAreaM2: number;
    circumferenceM: number;
    formulaWithValues: string;
    isBlocked: boolean;
    blockedReason?: string;
  } {
    if (!params.diameterMm || params.diameterMm <= 0) {
      return {
        surfaceAreaM2: 0,
        circumferenceM: 0,
        formulaWithValues: 'BLOCKED: Missing round duct diameter',
        isBlocked: true,
        blockedReason: 'Round duct diameter missing on drawing',
      };
    }

    const diameterM = params.diameterMm / 1000;
    const circumferenceM = Math.PI * diameterM;
    const surfaceArea = circumferenceM * params.lengthM;

    const formulaWithValues = `π × ${diameterM.toFixed(3)}m × ${params.lengthM.toFixed(2)}m = ${surfaceArea.toFixed(2)} m²`;

    return {
      surfaceAreaM2: Number(surfaceArea.toFixed(2)),
      circumferenceM: Number(circumferenceM.toFixed(3)),
      formulaWithValues,
      isBlocked: false,
    };
  }

  /**
   * 4. Calculate Piping Running Length with Fitting Allowance
   */
  public static calculatePipingLength(params: {
    segmentLengthsM: number[];
    fittingAllowanceM?: number;
    verticalDropsM?: number;
  }): {
    baseLengthM: number;
    totalLengthM: number;
    formulaWithValues: string;
  } {
    const baseLength = params.segmentLengthsM.reduce((sum, seg) => sum + Math.max(0, seg), 0);
    const fittings = Math.max(0, params.fittingAllowanceM || 0);
    const vertical = Math.max(0, params.verticalDropsM || 0);
    const total = baseLength + fittings + vertical;

    const segStr = params.segmentLengthsM.map(s => s.toFixed(2)).join(' + ');
    const addStr = (fittings > 0 || vertical > 0)
      ? ` + ${fittings > 0 ? `${fittings.toFixed(2)}m (fittings)` : ''}${vertical > 0 ? ` + ${vertical.toFixed(2)}m (vertical)` : ''}`
      : '';

    const formulaWithValues = `(${segStr})${addStr} = ${total.toFixed(2)} m`;

    return {
      baseLengthM: Number(baseLength.toFixed(2)),
      totalLengthM: Number(total.toFixed(2)),
      formulaWithValues,
    };
  }

  /**
   * 5. Calculate MEP Support Spacing & Quantity
   * Support Count = Ceil(Route Length / Standard Spacing) + 1 (Start & End Hanger)
   */
  public static calculateSupportQuantity(params: {
    routeLengthM: number;
    standardSpacingRuleM: number;
    minSupports?: number;
  }): {
    calculatedQuantity: number;
    formulaCalculation: string;
  } {
    const spacing = Math.max(0.5, params.standardSpacingRuleM || 2.0);
    const length = Math.max(0, params.routeLengthM || 0);
    const minSup = params.minSupports || 2;

    if (length <= 0) {
      return {
        calculatedQuantity: 0,
        formulaCalculation: '0 m / spacing = 0 Nos.',
      };
    }

    const count = Math.max(minSup, Math.ceil(length / spacing) + 1);
    const formulaCalculation = `⌈${length.toFixed(2)}m / ${spacing.toFixed(1)}m⌉ + 1 = ${count} Nos.`;

    return {
      calculatedQuantity: count,
      formulaCalculation,
    };
  }

  /**
   * 6. Calculate Cable Tray Running Length & Required Supports
   */
  public static calculateCableTrayTakeoff(params: {
    segmentLengthsM: number[];
    supportSpacingM?: number;
  }): {
    totalLengthM: number;
    supportCount: number;
    formulaWithValues: string;
  } {
    const totalLength = params.segmentLengthsM.reduce((acc, s) => acc + Math.max(0, s), 0);
    const spacing = params.supportSpacingM || 1.5;
    const supportCount = totalLength > 0 ? Math.ceil(totalLength / spacing) + 1 : 0;

    const formulaWithValues = `Segments (${params.segmentLengthsM.map(s => s.toFixed(2)).join(' + ')}) = ${totalLength.toFixed(2)} m; Supports @ ${spacing}m = ${supportCount} Nos.`;

    return {
      totalLengthM: Number(totalLength.toFixed(2)),
      supportCount,
      formulaWithValues,
    };
  }

  /**
   * 7. Open Item Detection & Generation
   */
  public static detectOpenItems(elements: GeneralMEPElement[]): MEPOpenItemRecord[] {
    const openItems: MEPOpenItemRecord[] = [];

    elements.forEach(elem => {
      // 1. Missing size or diameter
      if (!elem.size || elem.size.trim() === '' || elem.size.toLowerCase().includes('unknown') || elem.size.toLowerCase().includes('tbc')) {
        let issueType: MEPOpenItemRecord['issueType'] = 'MISSING_PIPE_DIAMETER';
        if (elem.discipline === 'HVAC') issueType = 'MISSING_DUCT_SIZE';
        if (elem.discipline === 'Electrical') issueType = 'MISSING_CABLE_SIZE';
        if (elem.discipline === 'Plumbing') issueType = 'MISSING_PIPE_DIAMETER';

        openItems.push({
          id: `OI-${elem.id}-${Date.now().toString().slice(-4)}`,
          discipline: elem.discipline,
          physicalElementId: elem.physicalElementId,
          elementTag: elem.tag,
          issueType,
          description: `Element ${elem.tag} (${elem.description}) has missing or unreadable size specification.`,
          drawingReference: elem.primaryDrawingNumber,
          revision: elem.revision,
          sourceLocation: elem.level + (elem.roomName ? ` - ${elem.roomName}` : ''),
          suggestedAction: 'Request RFI from MEP design consultant or verify Against Detail / Riser drawings.',
          status: 'OPEN',
          createdDate: new Date().toISOString().split('T')[0],
        });
      }

      // 2. Equipment missing capacity
      if (elem.discipline === 'Equipment' || elem.subSystem.toLowerCase().includes('equipment') || elem.subSystem.toLowerCase().includes('pump') || elem.subSystem.toLowerCase().includes('ahu')) {
        if (!elem.ratingOrCapacity || elem.ratingOrCapacity.trim() === '' || elem.ratingOrCapacity.toLowerCase().includes('tbc')) {
          openItems.push({
            id: `OI-CAP-${elem.id}`,
            discipline: elem.discipline,
            physicalElementId: elem.physicalElementId,
            elementTag: elem.tag,
            issueType: 'MISSING_EQUIPMENT_CAPACITY',
            description: `Equipment ${elem.tag} capacity / duty parameter is unreadable or not specified.`,
            drawingReference: elem.primaryDrawingNumber,
            revision: elem.revision,
            sourceLocation: elem.level,
            suggestedAction: 'Consult Equipment Schedule or Electrical/Mechanical Schedule to obtain capacity before final BOQ rating.',
            status: 'OPEN',
            createdDate: new Date().toISOString().split('T')[0],
          });
        }
      }

      // 3. Blocked element flag
      if (elem.isBlocked && elem.blockedReason) {
        // Ensure not duplicate
        const exists = openItems.some(o => o.physicalElementId === elem.physicalElementId);
        if (!exists) {
          openItems.push({
            id: `OI-BLK-${elem.id}`,
            discipline: elem.discipline,
            physicalElementId: elem.physicalElementId,
            elementTag: elem.tag,
            issueType: 'UNCLEAR_SYMBOL',
            description: elem.blockedReason,
            drawingReference: elem.primaryDrawingNumber,
            revision: elem.revision,
            sourceLocation: elem.level,
            suggestedAction: 'Verify legend and architectural background coordination.',
            status: 'OPEN',
            createdDate: new Date().toISOString().split('T')[0],
          });
        }
      }
    });

    return openItems;
  }

  /**
   * 8. Plan vs Riser vs Schedule Reconciliation & Duplicate Protection
   * Ensures that if an element appears on Plan (e.g. P-101) and Riser (e.g. RISER-01) and Schedule,
   * it is associated to one Physical MEP Element ID with quantity counted exactly ONCE.
   */
  public static reconcilePlanAndRiser(records: {
    planElements: GeneralMEPElement[];
    riserElements: GeneralMEPElement[];
    scheduleElements?: GeneralMEPElement[];
  }): {
    reconciledRecords: MEPRiserReconciliationRecord[];
    conflicts: MEPConflictRecord[];
    unifiedElements: GeneralMEPElement[];
  } {
    const reconciledRecords: MEPRiserReconciliationRecord[] = [];
    const conflicts: MEPConflictRecord[] = [];
    const unifiedElementsMap = new Map<string, GeneralMEPElement>();

    // Index plan elements by tag / physical ID
    records.planElements.forEach(planElem => {
      unifiedElementsMap.set(planElem.physicalElementId, { ...planElem, quantity: planElem.quantity });
    });

    // Cross-match with riser elements
    records.riserElements.forEach(riserElem => {
      const existing = unifiedElementsMap.get(riserElem.physicalElementId);

      if (existing) {
        // Found matching physical item! DO NOT DOUBLE COUNT
        // Check size consistency
        const planSize = existing.size || 'UNSPECIFIED';
        const riserSize = riserElem.size || 'UNSPECIFIED';

        let reconciledStatus: MEPRiserReconciliationRecord['reconciledStatus'] = 'SINGLE_VERIFIED_ENTITY';

        if (planSize !== riserSize && planSize !== 'UNSPECIFIED' && riserSize !== 'UNSPECIFIED') {
          reconciledStatus = 'SIZE_MISMATCH';

          conflicts.push({
            id: `CONF-PR-${existing.physicalElementId}`,
            discipline: existing.discipline,
            elementTag: existing.tag,
            conflictType: 'PLAN_VS_RISER_SIZE',
            sourceA: {
              documentName: existing.sourceDrawings[0]?.drawingTitle || 'Plan Drawing',
              drawingNumber: existing.primaryDrawingNumber,
              revision: existing.revision,
              location: existing.level,
              value: planSize,
            },
            sourceB: {
              documentName: riserElem.sourceDrawings[0]?.drawingTitle || 'Riser Diagram',
              drawingNumber: riserElem.primaryDrawingNumber,
              revision: riserElem.revision,
              location: riserElem.level,
              value: riserSize,
            },
            status: 'OPEN',
          });
        }

        // Merge source provenance into existing without increasing quantity
        const updatedDrawings = [...existing.sourceDrawings];
        riserElem.sourceDrawings.forEach(d => {
          if (!updatedDrawings.some(ud => ud.drawingNumber === d.drawingNumber)) {
            updatedDrawings.push(d);
          }
        });
        existing.sourceDrawings = updatedDrawings;

        reconciledRecords.push({
          physicalElementId: existing.physicalElementId,
          elementTag: existing.tag,
          discipline: existing.discipline,
          system: existing.system,
          planDrawingRef: existing.primaryDrawingNumber,
          riserDrawingRef: riserElem.primaryDrawingNumber,
          reconciledStatus,
          planSize,
          riserSize,
          takeoffCount: 1, // Guaranteed 1
          notes: reconciledStatus === 'SIZE_MISMATCH'
            ? `Plan shows ${planSize} while Riser shows ${riserSize}. Open conflict logged.`
            : `Verified single physical entity appearing on Plan and Riser. Takeoff counted once.`,
        });
      } else {
        // Unique riser element (e.g. vertical riser pipe spanning multiple floors)
        unifiedElementsMap.set(riserElem.physicalElementId, { ...riserElem });
        reconciledRecords.push({
          physicalElementId: riserElem.physicalElementId,
          elementTag: riserElem.tag,
          discipline: riserElem.discipline,
          system: riserElem.system,
          planDrawingRef: 'N/A (Riser Only)',
          riserDrawingRef: riserElem.primaryDrawingNumber,
          reconciledStatus: 'SINGLE_VERIFIED_ENTITY',
          planSize: 'N/A',
          riserSize: riserElem.size || 'UNSPECIFIED',
          takeoffCount: 1,
          notes: 'Vertical main element extracted from Riser schematic.',
        });
      }
    });

    return {
      reconciledRecords,
      conflicts,
      unifiedElements: Array.from(unifiedElementsMap.values()),
    };
  }

  /**
   * 9. Revision Delta Comparison (Rev 00 vs Rev 01)
   */
  public static compareRevisions(
    rev00Elements: GeneralMEPElement[],
    rev01Elements: GeneralMEPElement[]
  ): MEPRevisionDiffRecord[] {
    const diffs: MEPRevisionDiffRecord[] = [];
    const rev00Map = new Map(rev00Elements.map(e => [e.physicalElementId, e]));
    const rev01Map = new Map(rev01Elements.map(e => [e.physicalElementId, e]));

    // Check modified and deleted items
    rev00Elements.forEach(oldElem => {
      const newElem = rev01Map.get(oldElem.physicalElementId);

      if (!newElem) {
        // Deleted in Rev 01
        diffs.push({
          id: `REV-DEL-${oldElem.physicalElementId}`,
          discipline: oldElem.discipline,
          elementTag: oldElem.tag,
          oldRevision: oldElem.revision,
          newRevision: 'Rev 01',
          changeType: 'DELETED_ELEMENT',
          oldSpecification: `${oldElem.description} (${oldElem.size || 'N/A'})`,
          newSpecification: 'Deleted / Removed in Rev 01',
          oldQuantity: oldElem.lengthM || oldElem.quantity,
          newQuantity: 0,
          unit: oldElem.unit,
          deltaQuantity: -(oldElem.lengthM || oldElem.quantity),
          changeSummary: `Element ${oldElem.tag} was removed in revised tender drawing.`,
          reviewed: false,
        });
      } else {
        // Check size change
        if (oldElem.size !== newElem.size) {
          diffs.push({
            id: `REV-SIZE-${oldElem.physicalElementId}`,
            discipline: oldElem.discipline,
            elementTag: oldElem.tag,
            oldRevision: oldElem.revision,
            newRevision: newElem.revision,
            changeType: 'SIZE_CHANGED',
            oldSpecification: oldElem.size || 'Unspecified',
            newSpecification: newElem.size || 'Unspecified',
            oldQuantity: oldElem.lengthM || oldElem.quantity,
            newQuantity: newElem.lengthM || newElem.quantity,
            unit: oldElem.unit,
            deltaQuantity: (newElem.lengthM || newElem.quantity) - (oldElem.lengthM || oldElem.quantity),
            changeSummary: `Size upgraded/changed from ${oldElem.size} to ${newElem.size}.`,
            reviewed: false,
          });
        } else if (
          Math.abs((newElem.lengthM || newElem.quantity) - (oldElem.lengthM || oldElem.quantity)) > 0.01
        ) {
          // Quantity or route length changed
          diffs.push({
            id: `REV-QTY-${oldElem.physicalElementId}`,
            discipline: oldElem.discipline,
            elementTag: oldElem.tag,
            oldRevision: oldElem.revision,
            newRevision: newElem.revision,
            changeType: 'ROUTE_MODIFIED',
            oldSpecification: `${oldElem.size || oldElem.description}`,
            newSpecification: `${newElem.size || newElem.description}`,
            oldQuantity: oldElem.lengthM || oldElem.quantity,
            newQuantity: newElem.lengthM || newElem.quantity,
            unit: oldElem.unit,
            deltaQuantity: Number(((newElem.lengthM || newElem.quantity) - (oldElem.lengthM || oldElem.quantity)).toFixed(2)),
            changeSummary: `Route / count adjusted by ${((newElem.lengthM || newElem.quantity) - (oldElem.lengthM || oldElem.quantity)).toFixed(2)} ${oldElem.unit}.`,
            reviewed: false,
          });
        }
      }
    });

    // Check newly added items in Rev 01
    rev01Elements.forEach(newElem => {
      if (!rev00Map.has(newElem.physicalElementId)) {
        diffs.push({
          id: `REV-ADD-${newElem.physicalElementId}`,
          discipline: newElem.discipline,
          elementTag: newElem.tag,
          oldRevision: 'Rev 00',
          newRevision: newElem.revision,
          changeType: 'ADDED_ELEMENT',
          oldSpecification: 'Not in Rev 00',
          newSpecification: `${newElem.description} (${newElem.size || 'N/A'})`,
          oldQuantity: 0,
          newQuantity: newElem.lengthM || newElem.quantity,
          unit: newElem.unit,
          deltaQuantity: newElem.lengthM || newElem.quantity,
          changeSummary: `New element ${newElem.tag} added in Rev 01 design update.`,
          reviewed: false,
        });
      }
    });

    return diffs;
  }

  /**
   * 10. Summary Aggregator
   */
  public static calculateSummary(
    elements: GeneralMEPElement[],
    openItems: MEPOpenItemRecord[],
    conflicts: MEPConflictRecord[]
  ): MEPSummaryData {
    let lightingTotalCount = 0;
    let socketSwitchTotalCount = 0;
    let panelTotalCount = 0;
    let cableTotalLengthM = 0;
    let cableTrayTotalLengthM = 0;
    let conduitTotalLengthM = 0;
    let earthingConductorLengthM = 0;

    let hvacEquipmentCount = 0;
    let ductTotalLengthM = 0;
    let ductTotalAreaM2 = 0;
    let hvacPipingTotalLengthM = 0;
    let diffusersGrillesCount = 0;
    let dampersCount = 0;
    let hvacValvesCount = 0;

    let plumbingFixturesCount = 0;
    let waterSupplyPipeLengthM = 0;
    let drainagePipeLengthM = 0;
    let plumbingPumpsTanksCount = 0;
    let plumbingValvesCount = 0;

    let firePipingTotalLengthM = 0;
    let sprinklersTotalCount = 0;
    let hydrantsHoseReelsCount = 0;
    let firePumpsCount = 0;

    let fireAlarmDevicesCount = 0;
    let cctvCamerasCount = 0;
    let accessControlPointsCount = 0;
    let dataPointsCount = 0;
    let elvCablesLengthM = 0;

    let mepSupportsTotalCount = 0;

    let verifiedElementsCount = 0;
    let unverifiedElementsCount = 0;
    let blockedElementsCount = 0;

    elements.forEach(elem => {
      if (elem.verificationStatus === 'verified') verifiedElementsCount++;
      else unverifiedElementsCount++;

      if (elem.isBlocked) blockedElementsCount++;

      const qty = elem.quantity || 1;
      const len = elem.lengthM || 0;

      // Discipline-based aggregation
      if (elem.discipline === 'Electrical') {
        const sub = (elem.subSystem || elem.description).toLowerCase();
        if (sub.includes('light') || elem.unit === 'No.' && sub.includes('luminaire')) lightingTotalCount += qty;
        else if (sub.includes('socket') || sub.includes('switch') || sub.includes('spur')) socketSwitchTotalCount += qty;
        else if (sub.includes('panel') || sub.includes('db') || sub.includes('mdb') || sub.includes('smdb') || sub.includes('mcc')) panelTotalCount += qty;
        else if (sub.includes('cable') && !sub.includes('tray')) cableTotalLengthM += len;
        else if (sub.includes('tray') || sub.includes('ladder') || sub.includes('trunking')) cableTrayTotalLengthM += len;
        else if (sub.includes('conduit')) conduitTotalLengthM += len;
        else if (sub.includes('earth') || sub.includes('lightning')) earthingConductorLengthM += len;
      } else if (elem.discipline === 'HVAC' || elem.discipline === 'Ventilation') {
        const sub = (elem.subSystem || elem.description).toLowerCase();
        if (sub.includes('ahu') || sub.includes('fcu') || sub.includes('chiller') || sub.includes('fan') || sub.includes('vav')) hvacEquipmentCount += qty;
        else if (sub.includes('duct') && !sub.includes('damper')) {
          ductTotalLengthM += len;
          // Check if ductwork item has surface area
          const ductItem = elem as unknown as MEPDuctworkTakeoffItem;
          if (ductItem.surfaceAreaM2) ductTotalAreaM2 += ductItem.surfaceAreaM2;
        } else if (sub.includes('damper')) dampersCount += qty;
        else if (sub.includes('diffuser') || sub.includes('grille') || sub.includes('louver')) diffusersGrillesCount += qty;
        else if (sub.includes('chilled') || sub.includes('condensate') || sub.includes('refrigerant') || sub.includes('pipe')) hvacPipingTotalLengthM += len;
        else if (sub.includes('valve')) hvacValvesCount += qty;
      } else if (elem.discipline === 'Plumbing') {
        const sub = (elem.subSystem || elem.description).toLowerCase();
        if (sub.includes('wc') || sub.includes('basin') || sub.includes('sink') || sub.includes('urinal') || sub.includes('shower') || sub.includes('fixture')) plumbingFixturesCount += qty;
        else if (sub.includes('water supply') || sub.includes('cold water') || sub.includes('hot water')) waterSupplyPipeLengthM += len;
        else if (sub.includes('drain') || sub.includes('soil') || sub.includes('waste') || sub.includes('vent stack') || sub.includes('rainwater')) drainagePipeLengthM += len;
        else if (sub.includes('tank') || sub.includes('pump') || sub.includes('heater')) plumbingPumpsTanksCount += qty;
        else if (sub.includes('valve')) plumbingValvesCount += qty;
      } else if (elem.discipline === 'Fire Fighting') {
        const sub = (elem.subSystem || elem.description).toLowerCase();
        if (sub.includes('sprinkler') && elem.unit === 'No.') sprinklersTotalCount += qty;
        else if (sub.includes('hydrant') || sub.includes('hose reel') || sub.includes('cabinet')) hydrantsHoseReelsCount += qty;
        else if (sub.includes('pump')) firePumpsCount += qty;
        else if (sub.includes('pipe') || sub.includes('header') || sub.includes('main')) firePipingTotalLengthM += len;
      } else if (elem.discipline === 'Fire Alarm') {
        fireAlarmDevicesCount += qty;
      } else if (elem.discipline === 'ELV') {
        const sub = (elem.subSystem || elem.description).toLowerCase();
        if (sub.includes('cctv') || sub.includes('camera')) cctvCamerasCount += qty;
        else if (sub.includes('access') || sub.includes('reader') || sub.includes('lock')) accessControlPointsCount += qty;
        else if (sub.includes('data') || sub.includes('rj45') || sub.includes('rack')) dataPointsCount += qty;
        else if (sub.includes('cable') || sub.includes('fiber') || sub.includes('cat6')) elvCablesLengthM += len;
      } else if (elem.discipline === 'MEP Supports') {
        mepSupportsTotalCount += qty;
      }
    });

    return {
      lightingTotalCount,
      socketSwitchTotalCount,
      panelTotalCount,
      cableTotalLengthM: Number(cableTotalLengthM.toFixed(2)),
      cableTrayTotalLengthM: Number(cableTrayTotalLengthM.toFixed(2)),
      conduitTotalLengthM: Number(conduitTotalLengthM.toFixed(2)),
      earthingConductorLengthM: Number(earthingConductorLengthM.toFixed(2)),

      hvacEquipmentCount,
      ductTotalLengthM: Number(ductTotalLengthM.toFixed(2)),
      ductTotalAreaM2: Number(ductTotalAreaM2.toFixed(2)),
      hvacPipingTotalLengthM: Number(hvacPipingTotalLengthM.toFixed(2)),
      diffusersGrillesCount,
      dampersCount,
      hvacValvesCount,

      plumbingFixturesCount,
      waterSupplyPipeLengthM: Number(waterSupplyPipeLengthM.toFixed(2)),
      drainagePipeLengthM: Number(drainagePipeLengthM.toFixed(2)),
      plumbingPumpsTanksCount,
      plumbingValvesCount,

      firePipingTotalLengthM: Number(firePipingTotalLengthM.toFixed(2)),
      sprinklersTotalCount,
      hydrantsHoseReelsCount,
      firePumpsCount,

      fireAlarmDevicesCount,
      cctvCamerasCount,
      accessControlPointsCount,
      dataPointsCount,
      elvCablesLengthM: Number(elvCablesLengthM.toFixed(2)),

      mepSupportsTotalCount,

      totalElementsCount: elements.length,
      verifiedElementsCount,
      unverifiedElementsCount,
      blockedElementsCount,
      openItemsCount: openItems.filter(o => o.status === 'OPEN').length,
      openConflictsCount: conflicts.filter(c => c.status === 'OPEN').length,
    };
  }
}

/**
 * Direct functional helper for HVAC Duct surface area calculations
 */
export function calculateHvacDuct(params: {
  widthMm: number;
  heightMm: number;
  lengthM: number;
  count?: number;
  gauge?: string;
}): CalculationRecord & {
  sheetMetalAreaM2: number;
  perimeterM: number;
  singleDuctAreaM2: number;
  totalAreaM2: number;
} {
  const count = params.count || 1;
  const widthM = params.widthMm / 1000;
  const heightM = params.heightMm / 1000;
  const perimeterM = 2 * (widthM + heightM);
  const singleArea = perimeterM * params.lengthM;
  const totalArea = singleArea * count;
  const formula = 'Count × [2 × (Width + Height) × Length]';
  const expressionWithValues = count > 1 
    ? `${count} × [2 × (${widthM.toFixed(3)}m + ${heightM.toFixed(3)}m) × ${params.lengthM.toFixed(2)}m] = ${totalArea.toFixed(2)} m²`
    : `2 × (${widthM.toFixed(3)}m + ${heightM.toFixed(3)}m) × ${params.lengthM.toFixed(2)}m = ${totalArea.toFixed(2)} m²`;

  return {
    formula,
    expressionWithValues,
    grossQuantity: Number(totalArea.toFixed(2)),
    deductionsTotal: 0,
    netQuantity: Number(totalArea.toFixed(2)),
    unit: 'm²',
    auditSteps: [
      {
        stepNumber: 1,
        label: 'Calculate Duct Perimeter',
        expression: `2 × (${widthM.toFixed(3)}m + ${heightM.toFixed(3)}m)`,
        subtotal: Number(perimeterM.toFixed(3)),
        unit: 'm',
      },
      {
        stepNumber: 2,
        label: 'Calculate Surface Area',
        expression: `${count} × ${perimeterM.toFixed(3)}m × ${params.lengthM.toFixed(2)}m`,
        subtotal: Number(totalArea.toFixed(2)),
        unit: 'm²',
      },
    ],
    lastCalculatedAt: new Date().toISOString(),
    sheetMetalAreaM2: Number(totalArea.toFixed(2)),
    perimeterM: Number(perimeterM.toFixed(3)),
    singleDuctAreaM2: Number(singleArea.toFixed(2)),
    totalAreaM2: Number(totalArea.toFixed(2)),
  };
}

/**
 * Direct functional helper for Pipe run calculations
 */
export function calculatePipeRun(params: {
  system?: string;
  diameterMm: number;
  material?: string;
  lengthM: number;
  count?: number;
  allowanceM?: number;
}): CalculationRecord & {
  lengthM: number;
  finalQuantity: number;
  diameterMm: number;
  material: string;
} {
  const count = params.count || 1;
  const baseLen = params.lengthM * count;
  const allowance = params.allowanceM || 0;
  const total = baseLen + allowance;
  const formula = 'Count × Length + Allowance';
  const expressionWithValues = count > 1
    ? `${count} × ${params.lengthM.toFixed(2)}m${allowance > 0 ? ` + ${allowance.toFixed(2)}m allowance` : ''} = ${total.toFixed(2)} m`
    : `${params.lengthM.toFixed(2)}m${allowance > 0 ? ` + ${allowance.toFixed(2)}m allowance` : ''} = ${total.toFixed(2)} m`;

  return {
    formula,
    expressionWithValues,
    grossQuantity: Number(total.toFixed(2)),
    deductionsTotal: 0,
    netQuantity: Number(total.toFixed(2)),
    unit: 'm',
    auditSteps: [
      {
        stepNumber: 1,
        label: 'Route Length',
        expression: `${count} × ${params.lengthM.toFixed(2)}m`,
        subtotal: Number(baseLen.toFixed(2)),
        unit: 'm',
      },
      ...(allowance > 0 ? [{
        stepNumber: 2,
        label: 'Fitting/Rise Allowance',
        expression: `+ ${allowance.toFixed(2)}m`,
        subtotal: Number(total.toFixed(2)),
        unit: 'm',
      }] : []),
    ],
    lastCalculatedAt: new Date().toISOString(),
    lengthM: Number(total.toFixed(2)),
    finalQuantity: Number(total.toFixed(2)),
    diameterMm: params.diameterMm,
    material: params.material || 'Standard',
  };
}

