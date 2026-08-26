/**
 * PHASE 15D — STRUCTURAL STEEL & ROOF MASTER DATASET
 * Realistic industrial warehouse facility: 48m Length × 30m Span × 7.5m Eave Height
 * 9 Portal frames @ 6m bay centers, Double slope gable roof (5.71° pitch)
 */

import {
  SteelMemberRecord,
  SteelPlateRecord,
  BoltGroupRecord,
  WeldRecord,
  PurlinRecord,
  GirtRecord,
  BracingRecord,
  RoofGeometryRecord,
  RoofZoneRecord,
  RoofCladdingRecord,
  SkylightRecord,
  FlashingAccessoryRecord,
  RoofInsulationRecord,
  RoofSafetyRecord,
  SteelOpenItem,
  SteelConflict,
  SteelRevisionDiff,
  SourceReference,
} from '../types/steelRoofTypes';
import {
  calculateSteelMember,
  calculateSteelPlate,
  calculatePurlinTakeoff,
  calculateGirtTakeoff,
  calculateBracingTakeoff,
  calculateRoofGeometry,
  calculateRoofCladding,
  calculateSkylightTakeoff,
  calculateFlashingAccessory,
  calculateBoltGroup,
  calculateWeldTakeoff,
} from '../engine/steelRoofEngine';

// Sources
const GA_PLAN: SourceReference = {
  drawingNumber: 'ST-01',
  drawingTitle: 'Main Warehouse Framing Plan & Sections',
  drawingType: 'GA',
  revision: '01',
  pageNumber: 1,
  locationDescription: 'Overall Structural Framing Grids 1-9 / A-B',
};

const COL_SCHEDULE: SourceReference = {
  drawingNumber: 'ST-02',
  drawingTitle: 'Column & Base Plate Schedule',
  drawingType: 'Schedule',
  revision: '01',
  pageNumber: 2,
  locationDescription: 'Columns C1, C2, C3 Schedule & Base Plate Details',
};

const ROOF_PLAN: SourceReference = {
  drawingNumber: 'ST-03',
  drawingTitle: 'Roof Purlin & Cladding Layout Plan',
  drawingType: 'GA',
  revision: '01',
  pageNumber: 3,
  locationDescription: 'Roof Slope Layout & Skylight Distribution',
};

const DETAIL_DWG: SourceReference = {
  drawingNumber: 'ST-04',
  drawingTitle: 'Portal Frame Knee & Apex Connection Details',
  drawingType: 'Detail',
  revision: '01',
  pageNumber: 4,
  locationDescription: 'Splice Plates, Haunches, Bolts & Welds',
};

const FAB_DWG: SourceReference = {
  drawingNumber: 'SH-101',
  drawingTitle: 'Shop Fabrication Column Assembly',
  drawingType: 'Shop Drawing',
  revision: '00',
  pageNumber: 1,
  locationDescription: 'Assembly Piece Mark C1-FAB',
};

// =========================================================================
// 1. ROOF GEOMETRY & ZONES
// =========================================================================
export const MASTER_ROOF_GEOMETRY: RoofGeometryRecord = calculateRoofGeometry({
  id: 'ROOF-GEO-01',
  roofName: 'Main Warehouse Gable Roof (30m Span)',
  roofType: 'Double Slope',
  buildingLengthM: 48.0,
  buildingWidthSpanM: 30.0,
  riseM: 1.5,
  eaveOverhangM: 0.6,
  gableOverhangM: 0.5,
  source: ROOF_PLAN,
  notes: 'Symmetrical double pitch @ 5.71° pitch angle with 0.6m eave overhang and 0.5m gable overhang',
});

export const MASTER_ROOF_ZONES: RoofZoneRecord[] = [
  {
    zoneId: 'ZONE-NORTH',
    zoneName: 'North Roof Slope (Grids 1-9 / Ridge to Eave A)',
    slopeDesignation: 'North Slope',
    planAreaM2: 764.4,
    trueSlopingAreaM2: 768.6,
    slopePitchDeg: 5.71,
    claddingSpecification: '0.55mm Zincalume Trapezoidal 1000 Profile',
    hasSkylights: true,
    skylightAreaM2: 36.0,
    netCladdingAreaM2: 732.6,
    source: ROOF_PLAN,
  },
  {
    zoneId: 'ZONE-SOUTH',
    zoneName: 'South Roof Slope (Grids 1-9 / Ridge to Eave B)',
    slopeDesignation: 'South Slope',
    planAreaM2: 764.4,
    trueSlopingAreaM2: 768.6,
    slopePitchDeg: 5.71,
    claddingSpecification: '0.55mm Zincalume Trapezoidal 1000 Profile',
    hasSkylights: true,
    skylightAreaM2: 36.0,
    netCladdingAreaM2: 732.6,
    source: ROOF_PLAN,
  },
];

// =========================================================================
// 2. SKYLIGHTS & OPENINGS
// =========================================================================
export const MASTER_SKYLIGHTS: SkylightRecord[] = [
  calculateSkylightTakeoff({
    skylightId: 'SKY-001',
    mark: 'SL-01',
    zoneId: 'ZONE-NORTH',
    material: 'Polycarbonate Profiled Sheet',
    thicknessMm: 2.5,
    lengthM: 6.0,
    widthM: 1.0,
    quantity: 6,
    source: ROOF_PLAN,
    notes: '6 Nr translucent sheets on North Slope (Bays 2, 4, 6, 8)',
  }),
  calculateSkylightTakeoff({
    skylightId: 'SKY-002',
    mark: 'SL-02',
    zoneId: 'ZONE-SOUTH',
    material: 'Polycarbonate Profiled Sheet',
    thicknessMm: 2.5,
    lengthM: 6.0,
    widthM: 1.0,
    quantity: 6,
    source: ROOF_PLAN,
    notes: '6 Nr translucent sheets on South Slope (Bays 2, 4, 6, 8)',
  }),
];

const totalSkylightM2 = MASTER_SKYLIGHTS.reduce((sum, s) => sum + s.totalAreaM2, 0);

// =========================================================================
// 3. ROOF CLADDING & PANELS
// =========================================================================
export const MASTER_ROOF_CLADDING: RoofCladdingRecord[] = [
  calculateRoofCladding({
    claddingId: 'CLAD-001',
    mark: 'RC-01',
    zoneId: 'ZONE-ALL',
    claddingType: 'Profiled Metal Sheet',
    profile: 'Trapezoidal 1000',
    sheetThicknessMm: 0.55,
    coating: 'PVDF Pre-painted Zincalume',
    color: 'Off-White (RAL 9002)',
    grossRoofAreaM2: MASTER_ROOF_GEOMETRY.trueSlopingSurfaceAreaM2, // ~1537.2 m²
    deductedSkylightAreaM2: totalSkylightM2, // 72.0 m²
    effectiveCoverWidthMm: 1000,
    slopingSheetLengthM: MASTER_ROOF_GEOMETRY.slopingRafterLengthM,
    roofLengthM: MASTER_ROOF_GEOMETRY.buildingLengthM + (2 * MASTER_ROOF_GEOMETRY.gableOverhangM),
    numSlopes: 2,
    source: ROOF_PLAN,
    notes: 'High-tensile zinc-aluminium alloy coated steel sheet with bonded factory seal',
  }).cladding,
];

// =========================================================================
// 4. PRIMARY & SECONDARY STEEL MEMBERS REGISTER
// =========================================================================
export const MASTER_STEEL_MEMBERS: SteelMemberRecord[] = [
  // 18 Nr Main Portal Columns (Grid A & B / 1-9)
  calculateSteelMember({
    id: 'ST-COL-01',
    masterMemberId: 'MAST-COL-C1',
    physicalMemberId: 'PHYS-COL-C1',
    mark: 'C1',
    category: 'Primary Steel',
    memberType: 'Column',
    section: 'UC 254x254x73',
    materialGrade: 'S355',
    lengthM: 7.5,
    quantity: 18,
    level: 'Base to Eave +7.5m',
    grid: 'Grid 1-9 / A, B',
    zone: 'Main Warehouse',
    primarySource: COL_SCHEDULE,
    associatedSources: [GA_PLAN, FAB_DWG],
    scheduleWeightKg: 9868.5,
  }).member,

  // 18 Nr Main Portal Rafters (Slope length 15.08m per half-rafter)
  calculateSteelMember({
    id: 'ST-RAF-01',
    masterMemberId: 'MAST-RAF-R1',
    physicalMemberId: 'PHYS-RAF-R1',
    mark: 'R1',
    category: 'Roof Framing',
    memberType: 'Rafter',
    section: 'UB 457x191x67',
    materialGrade: 'S355',
    lengthM: 15.08,
    quantity: 18,
    level: 'Roof Pitch Level',
    grid: 'Grid 1-9 / Half Rafters',
    zone: 'Roof Slopes',
    primarySource: GA_PLAN,
    associatedSources: [ROOF_PLAN, DETAIL_DWG],
    scheduleWeightKg: 18241.25,
  }).member,

  // 4 Nr Gable End Columns (Grid 1 & 9 / Interior posts)
  calculateSteelMember({
    id: 'ST-GCOL-01',
    masterMemberId: 'MAST-GCOL-C2',
    physicalMemberId: 'PHYS-GCOL-C2',
    mark: 'C2',
    category: 'Primary Steel',
    memberType: 'Column',
    section: 'UC 203x203x46',
    materialGrade: 'S355',
    lengthM: 8.5,
    quantity: 4,
    level: 'Base to Gable Rafter',
    grid: 'Grid 1 & 9 / Post A1, B1',
    zone: 'Gable Ends',
    primarySource: COL_SCHEDULE,
  }).member,

  // 16 Nr Eave Struts / Tie Beams (SHS 150x150x6.3, 6m bays)
  calculateSteelMember({
    id: 'ST-EAVE-01',
    masterMemberId: 'MAST-EAVE-01',
    physicalMemberId: 'PHYS-EAVE-01',
    mark: 'ES-1',
    category: 'Secondary Steel',
    memberType: 'Eave Strut',
    section: 'SHS 150x150x6.3',
    materialGrade: 'S355',
    lengthM: 6.0,
    quantity: 16,
    level: 'Eave Level +7.5m',
    grid: 'Grid 1-9 / Line A & B',
    zone: 'Eave Lines',
    primarySource: GA_PLAN,
  }).member,

  // 8 Nr Ridge Tie Members (RHS 200x100x6, 6m bays)
  calculateSteelMember({
    id: 'ST-RIDGE-01',
    masterMemberId: 'MAST-RIDGE-01',
    physicalMemberId: 'PHYS-RIDGE-01',
    mark: 'RT-1',
    category: 'Secondary Steel',
    memberType: 'Tie Member',
    section: 'RHS 200x100x6',
    materialGrade: 'S355',
    lengthM: 6.0,
    quantity: 8,
    level: 'Ridge Apex Level +9.0m',
    grid: 'Grid 1-9 / Apex',
    zone: 'Roof Apex',
    primarySource: GA_PLAN,
  }).member,

  // 16 Nr Crane Runway Beams (UB 610x229x101, 6m span for 10T Overhead Crane)
  calculateSteelMember({
    id: 'ST-CRANE-01',
    masterMemberId: 'MAST-CRANE-01',
    physicalMemberId: 'PHYS-CRANE-01',
    mark: 'CB-1',
    category: 'Primary Steel',
    memberType: 'Crane Girder',
    section: 'UB 610x229x101',
    materialGrade: 'S355',
    lengthM: 6.0,
    quantity: 16,
    level: 'Crane Bracket +5.8m',
    grid: 'Grid 1-9 / Line A & B',
    zone: 'Crane Corridor',
    primarySource: GA_PLAN,
    associatedSources: [DETAIL_DWG],
  }).member,

  // Mezzanine Secondary Beam with Segment lengths
  calculateSteelMember({
    id: 'ST-MEZZ-01',
    masterMemberId: 'MAST-MEZZ-01',
    physicalMemberId: 'PHYS-MEZZ-01',
    mark: 'B-MEZZ-01',
    category: 'Primary Steel',
    memberType: 'Secondary Beam',
    section: 'UB 406x178x54',
    materialGrade: 'S355',
    lengthM: null,
    segments: [
      { segmentId: 'SEG-1', label: 'Office Bay 1', lengthM: 6.0, source: 'Grid 1-2' },
      { segmentId: 'SEG-2', label: 'Office Bay 2', lengthM: 6.0, source: 'Grid 2-3' },
    ],
    quantity: 4,
    level: 'Mezzanine +3.6m',
    grid: 'Grid 1-3 / A-B',
    zone: 'Office Annex',
    primarySource: GA_PLAN,
  }).member,
];

// =========================================================================
// 5. PURLIN & GIRT ENGINE ITEMS
// =========================================================================
export const MASTER_PURLINS: PurlinRecord[] = [
  calculatePurlinTakeoff({
    purlinId: 'PUR-001',
    purlinMark: 'P1',
    profileType: 'Z-Purlin',
    section: 'Z200x65x2.0',
    roofSlopeLengthM: MASTER_ROOF_GEOMETRY.slopingRafterLengthM, // 15.08m
    baySpanM: 6.0,
    spacingMm: 1500,
    spacingRule: 'Exact Division',
    slopesCount: 2,
    hasLap: true,
    lapLengthM: 0.6,
    source: ROOF_PLAN,
    notes: 'Continuous cold-formed Z-purlins nested with 600mm sleeves/laps over portal frames',
  }),
];

export const MASTER_GIRTS: GirtRecord[] = [
  calculateGirtTakeoff({
    girtId: 'GIRT-001',
    girtMark: 'G1',
    profileType: 'C-Girt',
    section: 'C150x50x1.8',
    wallHeightM: 7.5,
    wallLengthM: 48.0,
    spacingMm: 1500,
    source: GA_PLAN,
    notes: 'Side wall sheeting girts mounted externally to UC columns',
  }),
  calculateGirtTakeoff({
    girtId: 'GIRT-002',
    girtMark: 'G2',
    profileType: 'C-Girt',
    section: 'C150x50x1.8',
    wallHeightM: 8.5,
    wallLengthM: 30.0,
    spacingMm: 1500,
    source: GA_PLAN,
    notes: 'Gable end wall sheeting girts (2 Nr gable walls)',
  }),
];

// =========================================================================
// 6. BRACING SYSTEMS
// =========================================================================
export const MASTER_BRACING: BracingRecord[] = [
  calculateBracingTakeoff({
    bracingId: 'BR-ROOF-01',
    bracingMark: 'RBR-1',
    bracingType: 'Cross Bracing',
    section: 'L 75x75x6',
    bayWidthM: 6.0,
    bayHeightM: 15.08,
    quantity: 8, // 4 cross pairs in roof plane
    source: ROOF_PLAN,
    notes: 'Roof plane cross-bracing in End Bays (1-2 and 8-9)',
  }),
  calculateBracingTakeoff({
    bracingId: 'BR-WALL-01',
    bracingMark: 'WBR-1',
    bracingType: 'Cross Bracing',
    section: 'L 75x75x6',
    bayWidthM: 6.0,
    bayHeightM: 7.5,
    quantity: 8, // 4 cross pairs in side walls
    source: GA_PLAN,
    notes: 'Vertical wall cross-bracing in End Bays (1-2 and 8-9)',
  }),
];

// =========================================================================
// 7. PLATES & CONNECTIONS (Base, Gussets, Haunches, Splices)
// =========================================================================
export const MASTER_PLATES: SteelPlateRecord[] = [
  // 18 Nr Column Base Plates (500mm × 350mm × 25mm)
  calculateSteelPlate({
    plateId: 'PL-BASE-01',
    plateMark: 'BP-01',
    plateType: 'Base Plate',
    associatedMemberMark: 'C1',
    lengthM: 0.5,
    widthM: 0.35,
    thicknessMm: 25,
    quantity: 18,
    source: COL_SCHEDULE,
    notes: 'Heavy base plate with 4 Nr 30mm dia anchor bolt holes',
  }),

  // 18 Nr Knee Haunch Plates (1200mm × 400mm × 12mm)
  calculateSteelPlate({
    plateId: 'PL-HAUNCH-01',
    plateMark: 'HP-01',
    plateType: 'Connection Plate',
    associatedMemberMark: 'R1 / C1 Knee',
    lengthM: 1.2,
    widthM: 0.4,
    thicknessMm: 12,
    quantity: 18,
    source: DETAIL_DWG,
    notes: 'Haunch web stiffener plate for moment-resisting knee joints',
  }),

  // 9 Nr Apex Splice Plates (600mm × 200mm × 16mm)
  calculateSteelPlate({
    plateId: 'PL-APEX-01',
    plateMark: 'AP-01',
    plateType: 'Splice Plate',
    associatedMemberMark: 'R1 Apex Joint',
    lengthM: 0.6,
    widthM: 0.2,
    thicknessMm: 16,
    quantity: 18, // 2 plates per apex joint × 9 joints
    source: DETAIL_DWG,
    notes: 'Bolted apex ridge splice connection plates',
  }),

  // 36 Nr Column Web Stiffeners (200mm × 100mm × 10mm)
  calculateSteelPlate({
    plateId: 'PL-STIFF-01',
    plateMark: 'ST-01',
    plateType: 'Stiffener Plate',
    associatedMemberMark: 'C1 at Crane Bracket',
    lengthM: 0.2,
    widthM: 0.1,
    thicknessMm: 10,
    quantity: 36,
    source: DETAIL_DWG,
    notes: 'Crane bracket load-bearing column stiffener plates',
  }),
];

// =========================================================================
// 8. BOLTS & ANCHOR BOLTS
// =========================================================================
export const MASTER_BOLTS: BoltGroupRecord[] = [
  calculateBoltGroup({
    boltId: 'BOLT-ANCH-01',
    boltMark: 'AB-M24',
    boltType: 'Anchor Bolt',
    diameterMm: 24,
    lengthMm: 650,
    grade: '8.8',
    connectionId: 'CONN-BASE-C1',
    associatedMemberMark: 'C1 Base Plate',
    location: 'Concrete Foundation Pedestals',
    rows: 2,
    columns: 2,
    spacingMm: 350,
    edgeDistanceMm: 75,
    quantityPerConnection: 4,
    numberOfConnections: 18,
    projectionMm: 125,
    embedmentLengthMm: 525,
    basePlateAssociation: 'BP-01',
    source: COL_SCHEDULE,
    notes: 'Hot-dip galvanized M24 Grade 8.8 cast-in holding down bolts with double nuts and heavy washer plates',
  }),
  calculateBoltGroup({
    boltId: 'BOLT-HSFG-01',
    boltMark: 'HSFG-M20',
    boltType: 'High Strength Friction Grip (HSFG)',
    diameterMm: 20,
    lengthMm: 75,
    grade: '10.9',
    connectionId: 'CONN-KNEE-R1',
    associatedMemberMark: 'R1 Knee Joint',
    location: 'Rafter to Column Flange Joint',
    rows: 4,
    columns: 2,
    spacingMm: 100,
    edgeDistanceMm: 50,
    quantityPerConnection: 8,
    numberOfConnections: 18,
    source: DETAIL_DWG,
    notes: 'Grade 10.9 friction grip structural bolts pre-tensioned to standard torque specification',
  }),
];

// =========================================================================
// 9. WELDS
// =========================================================================
export const MASTER_WELDS: WeldRecord[] = [
  calculateWeldTakeoff({
    weldId: 'WELD-001',
    weldMark: 'W-FILLET-8',
    weldType: 'Fillet Weld',
    sizeMm: 8,
    lengthM: 0.8,
    quantity: 18,
    location: 'Column to Base Plate perimeter',
    associatedMemberMark: 'C1 Base Plate',
    source: DETAIL_DWG,
    notes: 'All-around continuous 8mm fillet weld at column base',
  }),
  calculateWeldTakeoff({
    weldId: 'WELD-002',
    weldMark: 'W-FILLET-6',
    weldType: 'Fillet Weld',
    sizeMm: 6,
    lengthM: 1.2,
    quantity: 18,
    location: 'Haunch Flange to Rafter Web',
    associatedMemberMark: 'R1 Haunch Joint',
    source: DETAIL_DWG,
    notes: 'Shop welded 6mm continuous fillet weld along haunch flange',
  }),
];

// =========================================================================
// 10. FLASHINGS, GUTTERS & ACCESSORIES
// =========================================================================
export const MASTER_FLASHINGS: FlashingAccessoryRecord[] = [
  calculateFlashingAccessory({
    accessoryId: 'FL-001',
    mark: 'RF-01',
    category: 'Ridge Flashing',
    material: '0.55mm Zincalume Sheet',
    girthMm: 450,
    lengthM: 49.0, // 48m + 1m overhangs
    quantity: 1,
    unit: 'm',
    source: ROOF_PLAN,
    notes: 'Apex ridge cap with notched edge to match trapezoidal profile',
  }),
  calculateFlashingAccessory({
    accessoryId: 'FL-002',
    mark: 'BF-01',
    category: 'Barge Flashing',
    material: '0.55mm Zincalume Sheet',
    girthMm: 400,
    lengthM: 15.08,
    quantity: 4, // 4 barge slopes
    unit: 'm',
    source: ROOF_PLAN,
    notes: 'Gable end corner barge flashings',
  }),
  calculateFlashingAccessory({
    accessoryId: 'FL-003',
    mark: 'GUT-01',
    category: 'Box Gutter',
    material: '1.2mm Colorbond Galvanized Steel',
    girthMm: 600,
    lengthM: 49.0,
    quantity: 2, // North and South eaves
    unit: 'm',
    source: ROOF_PLAN,
    notes: 'Heavy duty external box eaves gutters with overflow spouts',
  }),
  calculateFlashingAccessory({
    accessoryId: 'FL-004',
    mark: 'DP-01',
    category: 'Downpipe',
    material: '150mm Dia Round PVC-U / Steel',
    lengthM: 7.5,
    quantity: 10, // 5 per side
    unit: 'm',
    source: ROOF_PLAN,
    notes: 'Rainwater downpipes connected to perimeter storm drainage',
  }),
];

// =========================================================================
// 11. ROOF INSULATION & SAFETY
// =========================================================================
export const MASTER_INSULATION: RoofInsulationRecord[] = [
  {
    insulationId: 'INS-001',
    mark: 'INS-GW-50',
    insulationType: 'Glasswool Blanket',
    thicknessMm: 50,
    densityKgM3: 24,
    areaM2: MASTER_ROOF_GEOMETRY.trueSlopingSurfaceAreaM2,
    source: ROOF_PLAN,
    status: 'USER VERIFIED',
    notes: 'Factory laminated reinforced aluminium foil (FR) facing facing downward over safety wire mesh',
  },
];

export const MASTER_SAFETY: RoofSafetyRecord[] = [
  {
    safetyId: 'SAF-001',
    mark: 'LL-01',
    itemType: 'Horizontal Lifeline',
    lengthM: 48.0,
    quantity: 2,
    unit: 'm',
    source: ROOF_PLAN,
    status: 'USER VERIFIED',
    notes: 'Grade 316 Stainless Steel fall-arrest lifeline system mounted along ridge line',
  },
  {
    safetyId: 'SAF-002',
    mark: 'MESH-01',
    itemType: 'Safety Fall-Arrest Mesh',
    areaM2: MASTER_ROOF_GEOMETRY.trueSlopingSurfaceAreaM2,
    quantity: 1,
    unit: 'm²',
    source: ROOF_PLAN,
    status: 'USER VERIFIED',
    notes: 'High tensile galvanized 2mm wire mesh (50mm × 50mm grid) installed taut over purlins',
  },
];

// =========================================================================
// 12. REALISTIC OPEN ITEMS (Zero Guesswork)
// =========================================================================
export const MASTER_STEEL_OPEN_ITEMS: SteelOpenItem[] = [
  {
    id: 'OI-STEEL-001',
    elementId: 'ST-CANOPY-01',
    elementMark: 'CAN-STRUT-01',
    category: 'MISSING_SECTION',
    severity: 'CRITICAL_BLOCKING',
    title: 'Unreadable Canopy Strut Section at Front Entrance',
    description: 'Drawing ST-01 Detail 6 notes canopy tie strut as "SHS [Unreadable]x4.0". Section mass per metre cannot be established without structural engineer confirmation.',
    requiredInformation: 'Exact hollow section designation (e.g. SHS 75x75x4 or SHS 100x100x4).',
    suggestedAction: 'Raise RFI to Structural Engineer to confirm canopy tie strut section.',
    drawingNumber: 'ST-01',
    location: 'Front Entrance Canopy Grid 1/A',
    status: 'OPEN',
  },
  {
    id: 'OI-STEEL-002',
    elementId: 'BOLT-MEZZ-01',
    elementMark: 'B-MEZZ-BOLTS',
    category: 'MISSING_BOLT_INFO',
    severity: 'WARNING_REVIEW',
    title: 'Mezzanine Connection Bolt Grade Not Annotated',
    description: 'Detail ST-04/8 shows 4 Nr M16 bolts for mezzanine secondary beam cleats but does not specify whether Grade 4.6 or Grade 8.8 is required.',
    requiredInformation: 'Specified bolt grade for mezzanine connections.',
    suggestedAction: 'Confirm bolt grade with structural specification table.',
    drawingNumber: 'ST-04',
    location: 'Mezzanine Framing Details Grid 2/A',
    status: 'OPEN',
  },
];

// =========================================================================
// 13. REALISTIC CONFLICT (Cross-Drawing Discrepancy)
// =========================================================================
export const MASTER_STEEL_CONFLICTS: SteelConflict[] = [
  {
    id: 'CONF-STEEL-001',
    conflictType: 'SECTION_MISMATCH',
    elementMark: 'B-204',
    description: 'Beam Schedule ST-02 specifies ISMB 450 (72.4 kg/m) for secondary transfer beam B-204, whereas General Framing Plan ST-01 calls out ISMB 400 (61.6 kg/m).',
    sourceA: {
      drawingNumber: 'ST-02',
      drawingType: 'Structural Schedule',
      revision: '01',
      value: 'ISMB 450 (72.40 kg/m)',
      location: 'Secondary Beam Schedule Table 3',
    },
    sourceB: {
      drawingNumber: 'ST-01',
      drawingType: 'GA Framing Plan',
      revision: '01',
      value: 'ISMB 400 (61.60 kg/m)',
      location: 'Framing Plan Grid B / 4-5',
    },
    status: 'OPEN',
  },
];

// =========================================================================
// 14. REVISION HISTORY & DIFFS
// =========================================================================
export const MASTER_STEEL_REVISIONS: SteelRevisionDiff[] = [
  {
    diffId: 'REV-DIFF-001',
    elementMark: 'C1',
    category: 'Primary Steel',
    changeType: 'MODIFIED_SECTION',
    oldRevision: '00',
    newRevision: '01',
    oldSection: 'UC 254x254x89 (88.9 kg/m)',
    newSection: 'UC 254x254x73 (73.1 kg/m)',
    oldWeightKg: 12001.5,
    newWeightKg: 9868.5,
    deltaWeightKg: -2133.0,
    deltaWeightTonnes: -2.133,
    oldBoqItem: 'Structural Steel Columns Grade S355',
    newBoqItem: 'Structural Steel Columns Grade S355',
    affectedBoqIds: ['BOQ-ST-COL-01'],
    summary: 'Value engineering optimization reduced column weight by 2.13 tonnes across 18 columns based on wind tunnel refinement',
    reviewed: true,
    reviewedBy: 'Senior Structural QS',
  },
  {
    diffId: 'REV-DIFF-002',
    elementMark: 'P1',
    category: 'Purlins',
    changeType: 'MODIFIED_SPACING',
    oldRevision: '00',
    newRevision: '01',
    oldSection: 'Z200x65x1.8 (4.95 kg/m) @ 1200mm',
    newSection: 'Z200x65x2.0 (5.45 kg/m) @ 1500mm',
    oldWeightKg: 8520.0,
    newWeightKg: 7850.2,
    deltaWeightKg: -669.8,
    deltaWeightTonnes: -0.67,
    oldBoqItem: 'Cold-Formed Z-Purlins',
    newBoqItem: 'Cold-Formed Z-Purlins',
    affectedBoqIds: ['BOQ-PUR-01'],
    summary: 'Increased purlin gauge to 2.0mm allowing wider 1500mm spacing, reducing total rows from 28 to 22',
    reviewed: true,
    reviewedBy: 'Project Lead QS',
  },
];
