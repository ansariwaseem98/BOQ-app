/**
 * Realistic Fixture Data for Phase 6 Steel & Roofing Engine
 * Warehouse Structure: 48m Length × 30m Span (15m Rafter Half-Span) × 7.5m Eave Height
 */

import {
  SteelMemberRegisterItem,
  RoofGeometryData,
  RoofCladdingTakeoffData,
  SkylightTakeoffData,
  FlashingGutterTakeoffItem,
  SteelRevisionDiffRecord,
  SteelConflictRecord,
} from '../types';
import {
  calculateSteelMemberItem,
  calculateSteelPlate,
  calculatePurlinTakeoff,
  calculateGirtTakeoff,
  calculateRoofGeometry,
  calculateRoofCladdingTakeoff,
  calculateSkylightTakeoff,
} from '../engine/steelRoofEngine';

// Warehouse 48m × 30m × 7.5m Gable Roof (5.71° pitch, 1.5m rise)
export const SAMPLE_ROOF_GEOMETRY: RoofGeometryData = calculateRoofGeometry({
  id: 'ROOF-GEO-01',
  roofName: 'Industrial Warehouse Gable Roof',
  roofType: 'Double Slope',
  buildingLengthM: 48.0,
  spanM: 30.0,
  riseM: 1.5,
  eaveOverhangM: 0.6,
});

// Skylights: 12 Nr Polycarbonate Panels (6.0m × 1.0m = 72.0 m²)
export const SAMPLE_SKYLIGHTS: SkylightTakeoffData[] = [
  calculateSkylightTakeoff({
    id: 'SKY-001',
    mark: 'SL-01',
    roofZone: 'Slope A (East Bay 2, 4, 6)',
    type: 'Polycarbonate',
    lengthM: 6.0,
    widthM: 1.0,
    quantity: 6,
    thicknessMm: 2.5,
  }),
  calculateSkylightTakeoff({
    id: 'SKY-002',
    mark: 'SL-02',
    roofZone: 'Slope B (West Bay 2, 4, 6)',
    type: 'Polycarbonate',
    lengthM: 6.0,
    widthM: 1.0,
    quantity: 6,
    thicknessMm: 2.5,
  }),
];

const totalSkylightM2 = SAMPLE_SKYLIGHTS.reduce((a, b) => a + b.totalAreaM2, 0);

// Roof Cladding with Skylight Deduction & +5% Wastage
export const SAMPLE_ROOF_CLADDING: RoofCladdingTakeoffData[] = [
  calculateRoofCladdingTakeoff({
    id: 'CLAD-001',
    mark: 'RC-01',
    material: '0.5mm Pre-painted Zincalume Sheet',
    profile: 'Trapezoidal 1000',
    grossRoofAreaM2: SAMPLE_ROOF_GEOMETRY.grossRoofAreaM2, // ~1505 m² with overhangs
    effectiveCoverWidthMm: 1000,
    slopingSheetLengthM: SAMPLE_ROOF_GEOMETRY.slopingLengthM,
    roofLengthM: 48.0,
    numSlopes: 2,
    skylightDeductionM2: totalSkylightM2,
    wastagePercent: 5.0,
  }),
];

// Flashings, Gutters, Downpipes & Insulation
export const SAMPLE_FLASHINGS_GUTTERS: FlashingGutterTakeoffItem[] = [
  {
    id: 'FL-001',
    mark: 'RF-01',
    category: 'Flashings',
    subType: 'Ridge Flashing',
    girthMm: 450,
    thicknessMm: 0.55,
    lengthM: 48.0,
    quantity: 1,
    totalLengthM: 48.0,
    totalAreaM2: 21.6,
    unit: 'm',
    formula: 'Length × Girth',
    formulaWithValues: '48.00m × 0.45m girth = 21.60 m² (48.00 linear metres)',
    source: 'Architectural Details Sheet A-501',
    drawingNumber: 'ST-ROOF-01',
    revision: '01',
    status: 'VERIFIED',
  },
  {
    id: 'FL-002',
    mark: 'BF-01',
    category: 'Flashings',
    subType: 'Barge Flashing',
    girthMm: 400,
    thicknessMm: 0.55,
    lengthM: 15.68,
    quantity: 4,
    totalLengthM: 62.72,
    totalAreaM2: 25.09,
    unit: 'm',
    formula: '4 × Sloping Gable End Length',
    formulaWithValues: '4 Nr × 15.68m = 62.72 linear metres (25.09 m²)',
    source: 'Architectural Details Sheet A-501',
    drawingNumber: 'ST-ROOF-01',
    revision: '01',
    status: 'VERIFIED',
  },
  {
    id: 'GUT-001',
    mark: 'EG-01',
    category: 'Gutters',
    subType: 'Eaves Gutter',
    girthMm: 600,
    thicknessMm: 0.8,
    lengthM: 48.0,
    quantity: 2,
    totalLengthM: 96.0,
    unit: 'm',
    formula: '2 × Building Length',
    formulaWithValues: '2 sides × 48.00m = 96.00 linear metres Box/Eaves Gutter',
    source: 'Drainage Plan Sheet P-101',
    drawingNumber: 'ST-ROOF-01',
    revision: '01',
    status: 'VERIFIED',
  },
  {
    id: 'DP-001',
    mark: 'DP-01',
    category: 'Downpipes',
    subType: 'Downpipe (Vertical)',
    diameterMm: 150,
    lengthM: 7.5,
    quantity: 8,
    totalLengthM: 60.0,
    unit: 'm',
    formula: 'Drops × Eave Height',
    formulaWithValues: '8 drops × 7.50m = 60.00 linear metres Ø150mm Downpipes',
    source: 'Drainage Plan Sheet P-101',
    drawingNumber: 'ST-ROOF-01',
    revision: '01',
    status: 'VERIFIED',
  },
  {
    id: 'INS-001',
    mark: 'INS-01',
    category: 'Insulation',
    subType: 'Glass Wool Insulation',
    thicknessMm: 50,
    lengthM: 48.0,
    quantity: 1,
    totalAreaM2: SAMPLE_ROOF_GEOMETRY.grossRoofAreaM2,
    unit: 'm²',
    formula: 'Gross Roof Cladding Area',
    formulaWithValues: `${SAMPLE_ROOF_GEOMETRY.grossRoofAreaM2} m² 50mm Glass Wool with Foil Backing`,
    source: 'Building Spec Section 07210',
    drawingNumber: 'ST-ROOF-01',
    revision: '01',
    status: 'VERIFIED',
  },
];

// Helper to build members list
export function generateSampleSteelMembers(): SteelMemberRegisterItem[] {
  const members: SteelMemberRegisterItem[] = [];

  // 1. Primary Columns: 18 Nr UC 254x254x73 (9 frames × 2 columns, height 7.5m)
  const colRes = calculateSteelMemberItem({
    id: 'ST-COL-01',
    physicalMemberId: 'PHYS-COL-C1_C18',
    mark: 'C-01 to C-18',
    category: 'Primary Steel',
    memberType: 'Column',
    section: 'UC 254x254x73',
    materialGrade: 'S355',
    lengthM: 7.5,
    quantity: 18,
    level: 'Ground to Eave +7.50m',
    grid: 'Grids 1-9 / A & B',
    drawingNumber: 'ST-GA-01',
    drawingType: 'GA',
    revision: '01',
    pageNumber: 1,
    sourceLocation: 'Portal Frame Elevation 1-9',
  });
  members.push(colRes.item);

  // 2. Primary Rafters: 18 Nr UB 457x191x67 (9 frames × 2 rafters, slope length 15.68m)
  const rafRes = calculateSteelMemberItem({
    id: 'ST-RAF-01',
    physicalMemberId: 'PHYS-RAF-R1_R18',
    mark: 'RAF-01 to RAF-18',
    category: 'Primary Steel',
    memberType: 'Rafter',
    section: 'UB 457x191x67',
    materialGrade: 'S355',
    lengthM: 15.68,
    quantity: 18,
    level: 'Roof Slope +7.5m to +9.0m',
    grid: 'Grids 1-9 / A-B',
    drawingNumber: 'ST-GA-01',
    drawingType: 'GA',
    revision: '01',
    pageNumber: 1,
    sourceLocation: 'Roof Framing Plan Sheet 1',
  });
  members.push(rafRes.item);

  // 3. Eave Struts / Tie Beams: 16 Nr UB 254x146x31 (6m bays × 2 lines)
  const tieRes = calculateSteelMemberItem({
    id: 'ST-TIE-01',
    physicalMemberId: 'PHYS-TIE-T1_T16',
    mark: 'TIE-01 to TIE-16',
    category: 'Secondary Steel',
    memberType: 'Tie Beam',
    section: 'UB 254x146x31',
    materialGrade: 'S355',
    lengthM: 6.0,
    quantity: 16,
    level: 'Eave Level +7.50m',
    grid: 'Lines A & B, Bays 1-9',
    drawingNumber: 'ST-GA-02',
    drawingType: 'GA',
    revision: '01',
    pageNumber: 2,
    sourceLocation: 'Eave Longitudinal Section',
  });
  members.push(tieRes.item);

  // 4. Roof & Wall Bracing: 24 Nr SHS 100x100x5 (8.5m length)
  const brcRes = calculateSteelMemberItem({
    id: 'ST-BRC-01',
    physicalMemberId: 'PHYS-BRC-BR1_BR24',
    mark: 'BR-01 to BR-24',
    category: 'Bracing',
    memberType: 'Bracing Member',
    section: 'SHS 100x100x5',
    materialGrade: 'S275',
    lengthM: 8.5,
    quantity: 24,
    level: 'Bays 1-2 & 8-9',
    grid: 'Grid 1-2, 8-9 / Roof & Walls',
    drawingNumber: 'ST-GA-03',
    drawingType: 'GA',
    revision: '01',
    pageNumber: 3,
    sourceLocation: 'Bracing Elevations & Roof Plan',
  });
  members.push(brcRes.item);

  // 5. Purlins (Slope A & B): Z200x65x2.0 @ 1500mm c/c
  const purlinCalc = calculatePurlinTakeoff({
    section: 'Z200x65x2.0',
    roofZone: 'Roof Slopes A & B (Both Sides)',
    slopeSpanM: 15.68 * 2, // Both slopes
    roofLengthM: 48.0,
    spacingMm: 1500,
    spacingRule: 'CEILING_PLUS_1',
    runType: 'Continuous',
    lapLengthMm: 600,
  });

  members.push({
    id: 'ST-PUR-01',
    physicalMemberId: 'PHYS-PUR-MAIN',
    mark: 'PUR-01 (22 Lines)',
    category: 'Purlins',
    memberType: 'Purlin',
    section: 'Z200x65x2.0',
    materialGrade: 'S355',
    lengthM: purlinCalc.totalPurlinLengthM,
    quantity: 1,
    unitWeightKgM: purlinCalc.unitWeightKgM,
    totalWeightKg: purlinCalc.totalWeightKg,
    totalWeightTonnes: Number((purlinCalc.totalWeightKg / 1000).toFixed(3)),
    level: 'Roof Slope',
    grid: 'Continuous over Bays 1-9',
    drawingNumber: 'ST-ROOF-01',
    drawingType: 'GA',
    revision: '01',
    pageNumber: 1,
    sourceLocation: 'Roof Purlin Layout Plan',
    confidence: 0.99,
    verificationStatus: 'USER VERIFIED',
    isBlocked: false,
    associatedOpenItemIds: [],
    formula: purlinCalc.formula,
    formulaWithValues: purlinCalc.formulaWithValues,
    purlinData: purlinCalc,
    associatedSources: [{ drawingNumber: 'ST-ROOF-01', type: 'GA', revision: '01', page: 1 }],
    auditTrail: [
      {
        id: 'AUD-PUR-01',
        timestamp: new Date().toISOString(),
        user: 'Engine: calculatePurlinTakeoff',
        action: 'CREATED',
        previousValue: null,
        newValue: purlinCalc.totalWeightKg,
        newFormula: purlinCalc.formulaWithValues,
        reason: 'Continuous Z200 Purlins with 600mm Laps',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 6. Skylight Purlins (Separated)
  const skyPurlinCalc = calculatePurlinTakeoff({
    section: 'Z200x65x2.0',
    roofZone: 'Skylight Trimmers & Openings',
    slopeSpanM: 6.0,
    roofLengthM: 12.0,
    spacingMm: 1500,
    isSkylightPurlin: true,
  });

  members.push({
    id: 'ST-PUR-SKY',
    physicalMemberId: 'PHYS-PUR-SKY',
    mark: 'SKY-PUR-01',
    category: 'Purlins',
    memberType: 'Skylight Purlin',
    section: 'Z200x65x2.0',
    materialGrade: 'S355',
    lengthM: skyPurlinCalc.totalPurlinLengthM,
    quantity: 1,
    unitWeightKgM: skyPurlinCalc.unitWeightKgM,
    totalWeightKg: skyPurlinCalc.totalWeightKg,
    totalWeightTonnes: Number((skyPurlinCalc.totalWeightKg / 1000).toFixed(3)),
    level: 'Roof Slope (Skylight Bays)',
    grid: 'Bays 2, 4, 6',
    drawingNumber: 'ST-ROOF-01',
    drawingType: 'GA',
    revision: '01',
    pageNumber: 1,
    sourceLocation: 'Roof Skylight Detail Sheet',
    confidence: 0.99,
    verificationStatus: 'USER VERIFIED',
    isBlocked: false,
    associatedOpenItemIds: [],
    formula: skyPurlinCalc.formula,
    formulaWithValues: skyPurlinCalc.formulaWithValues,
    purlinData: skyPurlinCalc,
    associatedSources: [{ drawingNumber: 'ST-ROOF-01', type: 'GA', revision: '01', page: 1 }],
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 7. Wall Girts: C150x50x1.8 @ 1500mm c/c (2 Side Walls @ 48m + 2 End Walls @ 30m)
  const sideGirtCalc = calculateGirtTakeoff({
    section: 'C150x50x1.8',
    wallType: 'Side Wall Girt',
    wallHeightM: 7.5,
    runLengthM: 48.0 * 2, // 2 side walls
    spacingMm: 1500,
  });

  members.push({
    id: 'ST-GRT-01',
    physicalMemberId: 'PHYS-GRT-SIDE',
    mark: 'GRT-SIDE (5 Tiers)',
    category: 'Girts',
    memberType: 'Wall Girt',
    section: 'C150x50x1.8',
    materialGrade: 'S355',
    lengthM: sideGirtCalc.totalLengthM,
    quantity: 1,
    unitWeightKgM: sideGirtCalc.unitWeightKgM,
    totalWeightKg: sideGirtCalc.totalWeightKg,
    totalWeightTonnes: Number((sideGirtCalc.totalWeightKg / 1000).toFixed(3)),
    level: 'Side Walls 0.0m to +7.5m',
    grid: 'Lines A & B, Grids 1-9',
    drawingNumber: 'ST-GA-04',
    drawingType: 'GA',
    revision: '01',
    pageNumber: 4,
    sourceLocation: 'Wall Cladding & Girt Elevations',
    confidence: 0.98,
    verificationStatus: 'USER VERIFIED',
    isBlocked: false,
    associatedOpenItemIds: [],
    formula: sideGirtCalc.formula,
    formulaWithValues: sideGirtCalc.formulaWithValues,
    girtData: sideGirtCalc,
    associatedSources: [{ drawingNumber: 'ST-GA-04', type: 'GA', revision: '01', page: 4 }],
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 8. Base Plates: 18 Nr (500x500x25mm)
  const basePlateData = calculateSteelPlate({
    shape: 'Rectangle',
    lengthMm: 500,
    widthMm: 500,
    thicknessMm: 25,
    quantity: 18,
    densityKgM3: 7850,
  });

  members.push({
    id: 'ST-PL-BASE',
    physicalMemberId: 'PHYS-PL-BP1',
    mark: 'BP-01 (18 Nr)',
    category: 'Base Plates',
    memberType: 'Base Plate',
    section: 'PL 25x500',
    materialGrade: 'S355',
    lengthM: 0.5,
    quantity: 18,
    unitWeightKgM: null,
    totalWeightKg: basePlateData.totalWeightKg,
    totalWeightTonnes: Number((basePlateData.totalWeightKg / 1000).toFixed(3)),
    level: 'Foundation Level 0.00m',
    grid: 'Grids 1-9 / A-B',
    drawingNumber: 'ST-DET-01',
    drawingType: 'Detail',
    revision: '01',
    pageNumber: 1,
    sourceLocation: 'Base Plate Detail Type A',
    confidence: 0.99,
    verificationStatus: 'USER VERIFIED',
    isBlocked: false,
    associatedOpenItemIds: [],
    formula: basePlateData.formula,
    formulaWithValues: basePlateData.formulaWithValues,
    plateData: basePlateData,
    associatedSources: [{ drawingNumber: 'ST-DET-01', type: 'Detail', revision: '01', page: 1 }],
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 9. Gusset Plates (Triangular 400x300x12mm, 36 Nr)
  const gussetData = calculateSteelPlate({
    shape: 'Triangle',
    lengthMm: 400,
    widthMm: 300,
    thicknessMm: 12,
    quantity: 36,
    densityKgM3: 7850,
  });

  members.push({
    id: 'ST-PL-GUSSET',
    physicalMemberId: 'PHYS-PL-GP1',
    mark: 'GP-01 (36 Nr)',
    category: 'Gusset Plates',
    memberType: 'Gusset Plate',
    section: 'PL 12x400x300',
    materialGrade: 'S275',
    lengthM: 0.4,
    quantity: 36,
    unitWeightKgM: null,
    totalWeightKg: gussetData.totalWeightKg,
    totalWeightTonnes: Number((gussetData.totalWeightKg / 1000).toFixed(3)),
    level: 'Bracing Nodes',
    grid: 'Grids 1-2, 8-9',
    drawingNumber: 'ST-DET-02',
    drawingType: 'Detail',
    revision: '01',
    pageNumber: 2,
    sourceLocation: 'Bracing Gusset Details',
    confidence: 0.98,
    verificationStatus: 'USER VERIFIED',
    isBlocked: false,
    associatedOpenItemIds: [],
    formula: gussetData.formula,
    formulaWithValues: gussetData.formulaWithValues,
    plateData: gussetData,
    associatedSources: [{ drawingNumber: 'ST-DET-02', type: 'Detail', revision: '01', page: 2 }],
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 10. Sag Rods (Ø12mm round bar, 96 Nr @ 1.5m = 144m @ 0.888 kg/m)
  const sagTotalKg = Number((1.5 * 96 * 0.888).toFixed(2));
  members.push({
    id: 'ST-SAG-01',
    physicalMemberId: 'PHYS-SAG-01',
    mark: 'SR-01 (96 Nr)',
    category: 'Sag Rods',
    memberType: 'Sag Rod',
    section: 'Ø12mm Rod',
    materialGrade: 'A36',
    lengthM: 1.5,
    quantity: 96,
    unitWeightKgM: 0.888,
    totalWeightKg: sagTotalKg,
    totalWeightTonnes: Number((sagTotalKg / 1000).toFixed(3)),
    level: 'Roof Slope Between Purlins',
    grid: 'Bays 1-9',
    drawingNumber: 'ST-ROOF-02',
    drawingType: 'Detail',
    revision: '01',
    pageNumber: 2,
    sourceLocation: 'Purlin Bridging & Sag Rod Detail',
    confidence: 0.98,
    verificationStatus: 'USER VERIFIED',
    isBlocked: false,
    associatedOpenItemIds: [],
    formula: 'Length (m) × Quantity × Unit Weight (0.888 kg/m)',
    formulaWithValues: `1.50m × 96 Nr × 0.888 kg/m = ${sagTotalKg} kg (${(sagTotalKg / 1000).toFixed(3)} Tonnes)`,
    associatedSources: [{ drawingNumber: 'ST-ROOF-02', type: 'Detail', revision: '01', page: 2 }],
    auditTrail: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return members;
}

// Revisions comparison sample
export const SAMPLE_STEEL_REVISIONS: SteelRevisionDiffRecord[] = [
  {
    id: 'REV-ST-01',
    memberMark: 'RAF-01 to RAF-18',
    element: 'Portal Rafters',
    oldRevision: 'Rev 00',
    newRevision: 'Rev 01',
    oldSection: 'UB 406x178x54 (54.1 kg/m)',
    newSection: 'UB 457x191x67 (67.2 kg/m)',
    oldWeightKg: 15268.0,
    newWeightKg: 18965.0,
    deltaKg: 3697.0,
    changeSummary: 'Upsized section per revised wind & equipment load on roof',
    reviewed: true,
  },
  {
    id: 'REV-ST-02',
    memberMark: 'PUR-01',
    element: 'Roof Purlins',
    oldRevision: 'Rev 00',
    newRevision: 'Rev 01',
    oldSection: 'Z150x65x1.8 (4.15 kg/m)',
    newSection: 'Z200x65x2.0 (5.45 kg/m)',
    oldWeightKg: 2840.0,
    newWeightKg: 3730.0,
    deltaKg: 890.0,
    changeSummary: 'Purlin depth increased for 6m bay continuity',
    reviewed: true,
  },
];

// Conflicts sample
export const SAMPLE_STEEL_CONFLICTS: SteelConflictRecord[] = [
  {
    id: 'CONF-ST-01',
    memberMark: 'B-102',
    conflictType: 'SECTION_MISMATCH',
    drawingA: {
      drawingNumber: 'ST-GA-01',
      type: 'GA Drawing',
      revision: '01',
      spec: 'UB 406x178x54',
      location: 'Grid 2/A-B',
    },
    drawingB: {
      drawingNumber: 'ST-SHOP-12',
      type: 'Fabrication Shop Drawing',
      revision: '00',
      spec: 'UB 457x191x67',
      location: 'Assembly RF-02',
    },
    status: 'OPEN',
    resolutionNote: 'Awaiting Structural Engineer confirmation before fabrication release.',
  },
];
