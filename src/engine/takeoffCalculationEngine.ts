import {
  TakeoffCategoryKey,
  TakeoffCategoryDef,
  ConstructionSequenceStage,
  ConstructionSequenceStep,
  CalculationTemplateType,
  CalculationInputParameter,
  TakeoffDeductionRecord,
  CalculationIntermediateStep,
  DetailedCalculationRecord,
  TakeoffItemRecord,
  TakeoffCalculationStatus,
  ProjectEngineeringRules,
  VerifiedSteelSectionCatalogItem,
  DrawingBoundingBox,
  ProjectRecord,
  ConfidenceTier
} from '../types';

// =========================================================================
// 1. TAKEOFF CATEGORIES DEFINITIONS (18 CATEGORIES A TO R)
// =========================================================================
export const TAKEOFF_CATEGORIES: TakeoffCategoryDef[] = [
  {
    key: 'A_PRELIMINARY_SITE',
    code: 'A',
    label: 'Preliminary & Site Works',
    iconName: 'Compass',
    description: 'Site clearing, site establishment, temporary access, setting out & site preparation',
    subcategories: ['Site Clearing', 'Topsoil Stripping', 'Temporary Fencing', 'Access Roads', 'Setting Out & Survey']
  },
  {
    key: 'B_EARTHWORK',
    code: 'B',
    label: 'Earthwork',
    iconName: 'Shovel',
    description: 'Foundation excavation, trenching, pit excavation, bulk earthworks, backfilling, compaction & disposal',
    subcategories: ['Bulk Excavation', 'Foundation Pit Excavation', 'Trench Excavation', 'Backfilling & Compaction', 'Surplus Soil Disposal', 'Soil Treatment']
  },
  {
    key: 'C_SUBSTRUCTURE',
    code: 'C',
    label: 'Substructure Works',
    iconName: 'Building',
    description: 'PCC blinding, isolated footings, combined footings, raft foundation, pile caps, stub columns & ground beams',
    subcategories: ['PCC Blinding', 'Isolated Footings', 'Combined Footings', 'Raft Foundation', 'Pile Caps', 'Foundation Pedestals', 'Ground Beams / Tie Beams', 'Substructure Retaining Walls']
  },
  {
    key: 'D_RCC',
    code: 'D',
    label: 'RCC Superstructure Concrete',
    iconName: 'Layers',
    description: 'Structural concrete for columns, shear walls, transfer beams, floor beams, suspended slabs & staircases',
    subcategories: ['Columns', 'Shear Walls / Core Walls', 'Floor Beams', 'Transfer Girders', 'Suspended Slabs (Solid / Flat)', 'Ribbed / Waffle Slabs', 'Staircases & Landings', 'Parapet Concrete']
  },
  {
    key: 'E_REINFORCEMENT',
    code: 'E',
    label: 'Reinforcement Steel',
    iconName: 'Grid',
    description: 'High-yield deformed bars, mild steel ties, fabric wire mesh, chairs & couplers across all structural elements',
    subcategories: ['Footing Reinforcement', 'Column Main Bars & Links', 'Beam Main Bars & Stirrups', 'Slab Top/Bottom Mesh', 'Wall Reinforcement', 'Staircase Steel', 'Couplers & Mechanical Splices']
  },
  {
    key: 'F_FORMWORK',
    code: 'F',
    label: 'Formwork / Shuttering',
    iconName: 'Square',
    description: 'Contact area shuttering for foundations, columns, beam sides & soffits, slab soffits, walls & edge forms',
    subcategories: ['Footing Side Formwork', 'Column Formwork', 'Beam Sides & Soffit Formwork', 'Slab Soffit Shuttering', 'Wall Double-Faced Formwork', 'Stair Riser & Soffit Forms', 'Edge & Kickers Formwork']
  },
  {
    key: 'G_MASONRY',
    code: 'G',
    label: 'Masonry & Blockwork',
    iconName: 'Box',
    description: 'Solid concrete blocks, hollow blocks, AAC lightweight blocks, thermal insulated blocks & clay bricks',
    subcategories: ['200mm Solid Concrete Blockwork', '200mm Hollow Blockwork', '150mm Partition Blockwork', '100mm Internal Blockwork', 'AAC Lightweight Blocks', 'Cavity Wall System', 'Lintels & Stiffener Columns']
  },
  {
    key: 'H_DPC_WATERPROOFING',
    code: 'H',
    label: 'DPC & Waterproofing',
    iconName: 'ShieldAlert',
    description: 'Damp proof course membrane, bituminous tanking, membrane waterproofing, liquid coating & waterstops',
    subcategories: ['Damp Proof Course (DPC)', 'Substructure Membrane Tanking', 'Raft / Footing Blinding Waterproofing', 'Wet Area Waterproofing (Bathrooms/Kitchens)', 'Roof Membrane Waterproofing', 'Expansion Joint Waterstops']
  },
  {
    key: 'I_ARCHITECTURAL',
    code: 'I',
    label: 'Architectural Works',
    iconName: 'Landmark',
    description: 'Demountable partitions, drywall studs, acoustic panels, glass railings, balustrades & architectural features',
    subcategories: ['Drywall Partitions', 'Acoustic Wall Panels', 'Glass Balustrades & Railings', 'Architectural Louvers', 'Decorative Screens', 'Canopies & Pergolas']
  },
  {
    key: 'J_DOORS_WINDOWS',
    code: 'J',
    label: 'Doors & Windows',
    iconName: 'DoorOpen',
    description: 'Hollow metal doors, solid core timber doors, fire-rated doors, aluminum framed windows, curtain walling & glass louvers',
    subcategories: ['Fire-Rated Steel Doors', 'Solid Core Timber Doors', 'Flush Doors', 'Aluminum Glazed Windows', 'Curtain Wall Glazing', 'Sliding Doors & Glass Partitions', 'Ironmongery & Hardware Sets']
  },
  {
    key: 'K_FINISHES',
    code: 'K',
    label: 'Finishes & Linings',
    iconName: 'Palette',
    description: 'Internal & external cement plaster, floor screeds, porcelain tiling, marble/granite flooring, ceiling plaster & epoxy',
    subcategories: ['Internal Cement Plaster (15mm)', 'External Plaster / Render (20mm)', 'Ceiling Plaster (12mm)', 'Floor Cement Screed', 'Porcelain / Ceramic Floor Tiling', 'Marble / Granite Flooring', 'Internal Emulsion Painting', 'External Weatherproof Coating', 'Epoxy Floor Coating']
  },
  {
    key: 'L_STEEL_STRUCTURE',
    code: 'L',
    label: 'Structural Steelwork',
    iconName: 'Cpu',
    description: 'Universal columns, rafters, trusses, bracings, portal frames, crane gantry beams, base plates & steel connections',
    subcategories: ['Steel Portal Columns (UC/UB)', 'Roof Rafters (UB)', 'Trusses & Girders', 'Vertical & Plan Bracings (Angles/SHS)', 'Base Plates & Anchor Bolts', 'Connection Plates & Gussets', 'Crane Gantry Beams', 'Steel Stairs & Catwalks']
  },
  {
    key: 'M_ROOFING',
    code: 'M',
    label: 'Roofing Systems',
    iconName: 'Home',
    description: 'Roof purlins, standing seam metal roofs, insulated sandwich panels, thermal insulation, flashings & ridge caps',
    subcategories: ['Z & C Section Roof Purlins', 'Eave Struts & Girts', 'Insulated Sandwich Roof Panels', 'Standing Seam Roof Sheets', 'Roof Thermal & Vapor Insulation', 'Ridge Caps, Flashings & Trims', 'Roof Gutters & Downspouts']
  },
  {
    key: 'N_CLADDING',
    code: 'N',
    label: 'Wall Cladding & Facade',
    iconName: 'LayoutGrid',
    description: 'Side wall girts, insulated wall sandwich panels, aluminum composite panels (ACP), fiber cement boards & louvers',
    subcategories: ['Side Wall Girts (Z/C Sections)', 'Insulated Wall Sandwich Panels', 'Single Skin Profiled Cladding', 'Aluminum Composite Panels (ACP)', 'Corner Flashings & Drip Trims']
  },
  {
    key: 'O_SKYLIGHTS',
    code: 'O',
    label: 'Skylights & Roof Lights',
    iconName: 'Sun',
    description: 'Skylight framing, skylight purlins, translucent polycarbonate sheets, curbs, flashings & safety wire mesh',
    subcategories: ['Skylight Dedicated Purlins & Framing', 'Polycarbonate Multi-Wall Skylight Sheets', 'Skylight Upstand Curbs & Flashings', 'Fall Arrest Safety Mesh for Skylights']
  },
  {
    key: 'P_MEP',
    code: 'P',
    label: 'MEP Infrastructure Runs',
    iconName: 'Zap',
    description: 'Linear pipe runs, HVAC ductwork, electrical cable trays, conduit runs, plumbing fixtures & HVAC equipment',
    subcategories: ['HVAC Rectangular & Circular Ducts', 'Drainage & Water Supply Piping', 'Fire Sprinkler Piping Runs', 'Electrical Cable Trays & Ladders', 'Conduits & Containment', 'Sanitary Fixtures & Fittings', 'Major MEP Equipment']
  },
  {
    key: 'Q_EXTERNAL_WORKS',
    code: 'Q',
    label: 'External Works & Civil Infrastructure',
    iconName: 'Trees',
    description: 'Interlocking pavers, asphalt roads, concrete kerbs, boundary walls, stormwater swales & landscape works',
    subcategories: ['Interlocking Paving Blocks', 'Concrete Kerb Stones & Edging', 'Asphalt Paving & Subbase', 'Compound Boundary Wall', 'Stormwater Drainage Trenches & Manholes']
  },
  {
    key: 'R_OTHER',
    code: 'R',
    label: 'Other Miscellaneous Works',
    iconName: 'MoreHorizontal',
    description: 'Expansion joint covers, corner guards, tactile pavers, building signage, louvers & specialty items',
    subcategories: ['Expansion Joint Covers', 'Corner Guards & Wheel Stops', 'Tactile Paving & Signage', 'Specialty Items']
  }
];

// =========================================================================
// 2. CONSTRUCTION SEQUENCE (25 STAGES: GROUND LEVEL TO ROOF LEVEL)
// =========================================================================
export const CONSTRUCTION_SEQUENCE_STEPS: ConstructionSequenceStep[] = [
  { stage: '01_EXISTING_GROUND', order: 1, name: 'Existing Ground & Site Survey', elevationDescription: 'Natural Ground Level (NGL / ±0.00)', disciplines: ['Civil', 'Other'] },
  { stage: '02_EXCAVATION', order: 2, name: 'Bulk & Foundation Excavation', elevationDescription: 'Below Ground (-1.50m to -4.50m)', disciplines: ['Civil'] },
  { stage: '03_FOUNDATION', order: 3, name: 'Subgrade Preparation & Soil Compaction', elevationDescription: 'Formation Level', disciplines: ['Civil', 'Structural'] },
  { stage: '04_PCC_BLINDING', order: 4, name: 'Plain Cement Concrete (PCC) Blinding Layer', elevationDescription: '50mm–100mm Blinding Datum', disciplines: ['Structural'] },
  { stage: '05_WATERPROOFING_SUB', order: 5, name: 'Substructure Tanking Membrane', elevationDescription: 'Blinding Level & Vertical Faces', disciplines: ['Structural', 'Architectural'] },
  { stage: '06_FOOTING_RAFT_PILECAP', order: 6, name: 'Footings, Raft Slab & Pile Caps', elevationDescription: 'Bottom of Foundation Level', disciplines: ['Structural'] },
  { stage: '07_PEDESTAL', order: 7, name: 'Foundation Pedestals & Stub Columns', elevationDescription: 'Foundation to Ground Beam Datum', disciplines: ['Structural'] },
  { stage: '08_GROUND_BEAM', order: 8, name: 'Ground Beams & Plinth Beams', elevationDescription: 'Plinth Beam Level (-0.20m to ±0.00)', disciplines: ['Structural'] },
  { stage: '09_BACKFILL', order: 9, name: 'Substructure Backfilling & Compaction', elevationDescription: 'Up to Sub-base Level', disciplines: ['Civil'] },
  { stage: '10_DPC', order: 10, name: 'Damp Proof Course (DPC) Barrier', elevationDescription: 'Plinth Level (±0.00)', disciplines: ['Architectural', 'Structural'] },
  { stage: '11_WALLS_SUB', order: 11, name: 'Substructure / Basement Retaining Walls', elevationDescription: 'Basement Level to Ground Slab', disciplines: ['Structural'] },
  { stage: '12_COLUMNS', order: 12, name: 'Ground Floor Columns & Shear Walls', elevationDescription: 'Plinth Level to First Floor Soffit (+3.50m)', disciplines: ['Structural'] },
  { stage: '13_BEAMS', order: 13, name: 'First Floor Suspended Beams', elevationDescription: 'Level +3.50m Beam Datum', disciplines: ['Structural'] },
  { stage: '14_SLABS', order: 14, name: 'First Floor Slab & Grade Slab', elevationDescription: 'Level +3.50m (SSL / FFL)', disciplines: ['Structural'] },
  { stage: '15_STAIRS', order: 15, name: 'Staircase Flight & Landings', elevationDescription: 'Ground to Level 1 Incline', disciplines: ['Structural', 'Architectural'] },
  { stage: '16_UPPER_FLOORS', order: 16, name: 'Upper Floor Columns, Beams & Slabs', elevationDescription: 'Level 02 to Typical Floors', disciplines: ['Structural'] },
  { stage: '17_ROOF_STRUCTURE', order: 17, name: 'Roof Steel Structure / Portal Frames & Rafters', elevationDescription: 'Eaves Level (+6.00m to +10.00m)', disciplines: ['Steel', 'Structural'] },
  { stage: '18_PURLINS', order: 18, name: 'Roof Secondary Purlin System', elevationDescription: 'Rafter Top Flange to Apex', disciplines: ['Steel', 'Architectural'] },
  { stage: '19_SKYLIGHT_PURLINS', order: 19, name: 'Dedicated Skylight Purlins & Upstands', elevationDescription: 'Roof Daylight Openings', disciplines: ['Steel', 'Architectural'] },
  { stage: '20_ROOF_CLADDING', order: 20, name: 'Roof Sheets / Insulated Sandwich Panels', elevationDescription: 'External Roof Sloped Surface', disciplines: ['Architectural', 'Civil'] },
  { stage: '21_SKYLIGHTS', order: 21, name: 'Skylight Glazing & Polycarbonate Sheets', elevationDescription: 'Roof Daylight Openings', disciplines: ['Architectural'] },
  { stage: '22_INSULATION_WATERPROOFING_ROOF', order: 22, name: 'Roof Insulation & Waterproofing Membrane', elevationDescription: 'Roof Deck Surface', disciplines: ['Architectural'] },
  { stage: '23_FLASHINGS_GUTTERS', order: 23, name: 'Ridge Caps, Edge Flashings & Eaves Gutters', elevationDescription: 'Roof Eaves & Ridge Datum', disciplines: ['Architectural', 'Plumbing'] },
  { stage: '24_PARAPETS', order: 24, name: 'Roof Parapets & Coping Stones', elevationDescription: 'Roof Perimeter Top Level', disciplines: ['Architectural', 'Structural'] },
  { stage: '25_FINAL_ROOF_LEVEL', order: 25, name: 'Final Roof Finished Level', elevationDescription: 'Top of Building Datum', disciplines: ['Architectural', 'Other'] }
];

// =========================================================================
// 3. VERIFIED STEEL SECTION CATALOG DATABASE (BS EN / AISC STANDARDS)
// =========================================================================
export const VERIFIED_STEEL_CATALOG: VerifiedSteelSectionCatalogItem[] = [
  // Universal Beams (UB)
  { designation: 'UB 457x191x67', type: 'UB', depthMm: 453.4, widthMm: 189.9, flangeThicknessMm: 12.7, webThicknessMm: 8.5, unitWeightKgM: 67.1, standard: 'BS EN 10365' },
  { designation: 'UB 406x178x74', type: 'UB', depthMm: 412.8, widthMm: 179.5, flangeThicknessMm: 16.0, webThicknessMm: 9.5, unitWeightKgM: 74.2, standard: 'BS EN 10365' },
  { designation: 'UB 406x178x60', type: 'UB', depthMm: 406.4, widthMm: 177.9, flangeThicknessMm: 12.8, webThicknessMm: 7.9, unitWeightKgM: 60.1, standard: 'BS EN 10365' },
  { designation: 'UB 406x140x39', type: 'UB', depthMm: 398.0, widthMm: 141.8, flangeThicknessMm: 8.6, webThicknessMm: 6.4, unitWeightKgM: 39.0, standard: 'BS EN 10365' },
  { designation: 'UB 356x171x57', type: 'UB', depthMm: 358.0, widthMm: 171.5, flangeThicknessMm: 13.0, webThicknessMm: 8.1, unitWeightKgM: 57.0, standard: 'BS EN 10365' },
  { designation: 'UB 305x165x40', type: 'UB', depthMm: 303.4, widthMm: 165.0, flangeThicknessMm: 10.2, webThicknessMm: 6.0, unitWeightKgM: 40.3, standard: 'BS EN 10365' },
  { designation: 'UB 254x146x31', type: 'UB', depthMm: 251.4, widthMm: 146.1, flangeThicknessMm: 8.6, webThicknessMm: 6.0, unitWeightKgM: 31.1, standard: 'BS EN 10365' },
  { designation: 'UB 203x133x25', type: 'UB', depthMm: 203.2, widthMm: 133.2, flangeThicknessMm: 7.8, webThicknessMm: 5.7, unitWeightKgM: 25.1, standard: 'BS EN 10365' },
  
  // Universal Columns (UC)
  { designation: 'UC 356x368x129', type: 'UC', depthMm: 355.6, widthMm: 368.6, flangeThicknessMm: 17.5, webThicknessMm: 10.4, unitWeightKgM: 129.0, standard: 'BS EN 10365' },
  { designation: 'UC 254x254x73', type: 'UC', depthMm: 254.1, widthMm: 254.6, flangeThicknessMm: 14.2, webThicknessMm: 8.6, unitWeightKgM: 73.1, standard: 'BS EN 10365' },
  { designation: 'UC 203x203x46', type: 'UC', depthMm: 203.2, widthMm: 203.6, flangeThicknessMm: 11.0, webThicknessMm: 7.2, unitWeightKgM: 46.1, standard: 'BS EN 10365' },
  { designation: 'UC 152x152x23', type: 'UC', depthMm: 152.4, widthMm: 152.2, flangeThicknessMm: 6.8, webThicknessMm: 5.8, unitWeightKgM: 23.0, standard: 'BS EN 10365' },

  // Parallel Flange Channels (PFC)
  { designation: 'PFC 200x75x23', type: 'PFC', depthMm: 200.0, widthMm: 75.0, flangeThicknessMm: 12.0, webThicknessMm: 7.0, unitWeightKgM: 23.4, standard: 'BS EN 10365' },
  { designation: 'PFC 150x75x18', type: 'PFC', depthMm: 150.0, widthMm: 75.0, flangeThicknessMm: 10.0, webThicknessMm: 6.0, unitWeightKgM: 17.9, standard: 'BS EN 10365' },
  { designation: 'PFC 100x50x10', type: 'PFC', depthMm: 100.0, widthMm: 50.0, flangeThicknessMm: 8.5, webThicknessMm: 5.0, unitWeightKgM: 10.2, standard: 'BS EN 10365' },

  // Square / Rectangular Hollow Sections (SHS / RHS)
  { designation: 'SHS 150x150x6.0', type: 'SHS', depthMm: 150.0, widthMm: 150.0, flangeThicknessMm: 6.0, webThicknessMm: 6.0, unitWeightKgM: 26.4, standard: 'BS EN 10365' },
  { designation: 'SHS 100x100x5.0', type: 'SHS', depthMm: 100.0, widthMm: 100.0, flangeThicknessMm: 5.0, webThicknessMm: 5.0, unitWeightKgM: 14.4, standard: 'BS EN 10365' },
  { designation: 'SHS 80x80x4.0', type: 'SHS', depthMm: 80.0, widthMm: 80.0, flangeThicknessMm: 4.0, webThicknessMm: 4.0, unitWeightKgM: 9.22, standard: 'BS EN 10365' },
  { designation: 'RHS 200x100x6.0', type: 'RHS', depthMm: 200.0, widthMm: 100.0, flangeThicknessMm: 6.0, webThicknessMm: 6.0, unitWeightKgM: 26.4, standard: 'BS EN 10365' },
  { designation: 'RHS 150x100x5.0', type: 'RHS', depthMm: 150.0, widthMm: 100.0, flangeThicknessMm: 5.0, webThicknessMm: 5.0, unitWeightKgM: 18.7, standard: 'BS EN 10365' },

  // Circular Hollow Sections (CHS)
  { designation: 'CHS 168.3x5.0', type: 'CHS', depthMm: 168.3, widthMm: 168.3, flangeThicknessMm: 5.0, webThicknessMm: 5.0, unitWeightKgM: 20.1, standard: 'BS EN 10365' },
  { designation: 'CHS 114.3x4.5', type: 'CHS', depthMm: 114.3, widthMm: 114.3, flangeThicknessMm: 4.5, webThicknessMm: 4.5, unitWeightKgM: 12.2, standard: 'BS EN 10365' },

  // Equal Angles
  { designation: 'Angle 100x100x10', type: 'Angle', depthMm: 100.0, widthMm: 100.0, flangeThicknessMm: 10.0, webThicknessMm: 10.0, unitWeightKgM: 15.0, standard: 'BS EN 10365' },
  { designation: 'Angle 75x75x6', type: 'Angle', depthMm: 75.0, widthMm: 75.0, flangeThicknessMm: 6.0, webThicknessMm: 6.0, unitWeightKgM: 6.85, standard: 'BS EN 10365' },
  { designation: 'Angle 50x50x5', type: 'Angle', depthMm: 50.0, widthMm: 50.0, flangeThicknessMm: 5.0, webThicknessMm: 5.0, unitWeightKgM: 3.77, standard: 'BS EN 10365' },

  // Cold Formed Z & C Purlins
  { designation: 'Z200-15', type: 'Purlin_Z', depthMm: 200.0, widthMm: 65.0, flangeThicknessMm: 1.5, webThicknessMm: 1.5, unitWeightKgM: 3.96, standard: 'BS EN 10365' },
  { designation: 'Z200-20', type: 'Purlin_Z', depthMm: 200.0, widthMm: 65.0, flangeThicknessMm: 2.0, webThicknessMm: 2.0, unitWeightKgM: 5.24, standard: 'BS EN 10365' },
  { designation: 'Z250-20', type: 'Purlin_Z', depthMm: 250.0, widthMm: 75.0, flangeThicknessMm: 2.0, webThicknessMm: 2.0, unitWeightKgM: 6.50, standard: 'BS EN 10365' },
  { designation: 'C200-15', type: 'Purlin_C', depthMm: 200.0, widthMm: 70.0, flangeThicknessMm: 1.5, webThicknessMm: 1.5, unitWeightKgM: 3.96, standard: 'BS EN 10365' },
  { designation: 'C200-20', type: 'Purlin_C', depthMm: 200.0, widthMm: 70.0, flangeThicknessMm: 2.0, webThicknessMm: 2.0, unitWeightKgM: 5.24, standard: 'BS EN 10365' }
];

// Helper to look up steel section unit weight
export function lookupSteelSectionWeight(designation: string): { unitWeightKgM: number | null; catalogItem?: VerifiedSteelSectionCatalogItem } {
  if (!designation) return { unitWeightKgM: null };
  const normalized = designation.trim().toUpperCase().replace(/\s+/g, ' ');
  const match = VERIFIED_STEEL_CATALOG.find(item => 
    item.designation.toUpperCase() === normalized ||
    item.designation.toUpperCase().replace(/\s+/g, '') === normalized.replace(/\s+/g, '')
  );
  if (match) {
    return { unitWeightKgM: match.unitWeightKgM, catalogItem: match };
  }
  return { unitWeightKgM: null };
}

// =========================================================================
// 4. DEFAULT ENGINEERING RULES
// =========================================================================
export function getDefaultEngineeringRules(projectId: string): ProjectEngineeringRules {
  return {
    projectId,
    unitSystem: 'Metric',
    rounding: {
      concreteVolumeDecimals: 3,
      areaDecimals: 2,
      linearLengthDecimals: 2,
      steelWeightDecimals: 3,
      pieceCountDecimals: 0
    },
    deductions: {
      concreteOpeningThresholdM2: 0.10,
      masonryOpeningThresholdM2: 0.10,
      plasterOpeningThresholdM2: 0.50,
      paintOpeningThresholdM2: 0.50,
      deductBeamColumnIntersections: true,
      deductSlabBeamIntersections: true
    },
    wastageRates: {
      concretePct: 0.0,
      rebarPct: 0.0,
      structuralSteelPct: 0.0,
      masonryBlocksPct: 3.0,
      tilesFinishesPct: 5.0,
      roofSheetsPct: 4.0,
      dpcWaterproofingPct: 5.0
    },
    reinforcement: {
      unitWeightFormula: 'STANDARD_D2_162',
      spacingRule: 'CEIL_PLUS_ONE',
      defaultLapMultiplier: 50,
      coverDefaultsMm: {
        footing: 50,
        raft: 50,
        pedestal: 50,
        groundBeam: 40,
        column: 40,
        beam: 30,
        slab: 20,
        retainingWall: 40
      }
    },
    formwork: {
      beamMeasurementMode: 'SOFFIT_AND_TWO_SIDES',
      columnMeasurementMode: 'FOUR_SIDES_FULL_HEIGHT',
      slabMeasurementMode: 'NET_SOFFIT_LESS_BEAM_PROJECTION'
    }
  };
}

// =========================================================================
// 5. DETERMINISTIC CALCULATION ENGINE IMPLEMENTATION
// =========================================================================

export interface CalculationEvaluationResult {
  isBlocked: boolean;
  blockedReason?: string;
  associatedOpenItemIds: string[];
  formula: string;
  formulaNotation: string;
  evaluatedExpression: string;
  intermediateSteps: CalculationIntermediateStep[];
  grossQuantity: number;
  totalDeductions: number;
  netMeasuredQuantity: number;
  wastageQuantity: number;
  tenderQuantity: number;
  unit: string;
  status: TakeoffCalculationStatus;
}

export class TakeoffCalculationEngine {
  /**
   * Deterministically evaluates any calculation template strictly based on inputs,
   * deductions, rules, and mathematical formulas.
   * If any mandatory input is missing -> returns BLOCKED with Open Item required.
   */
  public static evaluate(
    templateType: CalculationTemplateType,
    inputs: CalculationInputParameter[],
    deductions: TakeoffDeductionRecord[] = [],
    rules: ProjectEngineeringRules,
    customWastagePct?: number
  ): CalculationEvaluationResult {
    // 1. Check for missing mandatory inputs
    const missingMandatory = inputs.filter(inp => inp.isMandatory && (inp.value === null || isNaN(inp.value)));
    if (missingMandatory.length > 0) {
      const missingLabels = missingMandatory.map(m => m.label || m.name).join(', ');
      return {
        isBlocked: true,
        blockedReason: `Missing mandatory parameter(s): ${missingLabels}. Please resolve open item or provide dimension.`,
        associatedOpenItemIds: missingMandatory.map(m => `OI-PARAM-${m.name}`),
        formula: 'BLOCKED (Incomplete inputs)',
        formulaNotation: 'BLOCKED',
        evaluatedExpression: 'Undefined',
        intermediateSteps: [],
        grossQuantity: 0,
        totalDeductions: 0,
        netMeasuredQuantity: 0,
        wastageQuantity: 0,
        tenderQuantity: 0,
        unit: 'm³',
        status: 'BLOCKED'
      };
    }

    // Map inputs by name for convenient mathematical lookups
    const paramMap: Record<string, number> = {};
    inputs.forEach(inp => {
      if (inp.value !== null && !isNaN(inp.value)) {
        paramMap[inp.name] = inp.value;
      }
    });

    let formula = '';
    let formulaNotation = '';
    let evaluatedExpression = '';
    let intermediateSteps: CalculationIntermediateStep[] = [];
    let grossQuantity = 0;
    let unit = 'm³';
    let roundingDecimals = 3;
    let defaultWastage = 0;

    // Helper rounding
    const roundTo = (val: number, dec: number) => Number(Math.round(Number(val + 'e' + dec)) + 'e-' + dec);

    switch (templateType) {
      // -------------------------------------------------------------
      // 1. EARTHWORK & EXCAVATION
      // -------------------------------------------------------------
      case 'EARTHWORK_SITE':
      case 'EARTHWORK_FOUNDATION':
      case 'EARTHWORK_TRENCH':
      case 'EARTHWORK_PIT':
      case 'EARTHWORK_BULK':
      case 'EARTHWORK_BACKFILL':
      case 'EARTHWORK_DISPOSAL':
      case 'EARTHWORK_COMPACTION': {
        const L = paramMap['length'] ?? 0;
        const W = paramMap['width'] ?? 0;
        const D = paramMap['depth'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm³';
        roundingDecimals = rules.rounding.concreteVolumeDecimals;
        formula = 'Length × Width × Depth × Number';
        formulaNotation = 'L × W × D × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${D.toFixed(2)}m × ${N}`;
        grossQuantity = L * W * D * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Plan Area per unit', expression: `${L.toFixed(2)} × ${W.toFixed(2)}`, value: L * W, unit: 'm²' },
          { stepNumber: 2, label: 'Volume per unit', expression: `${(L * W).toFixed(3)} × ${D.toFixed(2)}`, value: L * W * D, unit: 'm³' },
          { stepNumber: 3, label: 'Total Volume for all units', expression: `${(L * W * D).toFixed(3)} × ${N}`, value: grossQuantity, unit: 'm³' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 2. PCC / BLINDING CONCRETE
      // -------------------------------------------------------------
      case 'PCC_BLINDING': {
        const L = paramMap['length'] ?? 0;
        const W = paramMap['width'] ?? 0;
        const T = paramMap['thickness'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm³';
        roundingDecimals = rules.rounding.concreteVolumeDecimals;
        formula = 'Length × Width × Thickness × Number';
        formulaNotation = 'L × W × T × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${T.toFixed(3)}m × ${N}`;
        grossQuantity = L * W * T * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Blinding Area per Footing', expression: `${L.toFixed(2)} × ${W.toFixed(2)}`, value: L * W, unit: 'm²' },
          { stepNumber: 2, label: 'Blinding Volume per Unit', expression: `${(L * W).toFixed(3)} × ${T.toFixed(3)}`, value: L * W * T, unit: 'm³' },
          { stepNumber: 3, label: 'Total PCC Volume', expression: `${(L * W * T).toFixed(3)} × ${N}`, value: grossQuantity, unit: 'm³' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 3. RCC CONCRETE (FOOTINGS, PILE CAPS, RAFTS, COLUMNS, BEAMS, SLABS, PEDESTALS)
      // -------------------------------------------------------------
      case 'RCC_FOOTING':
      case 'RCC_PILE_CAP':
      case 'RCC_PEDESTAL':
      case 'RCC_GROUND_BEAM':
      case 'RCC_BEAM': {
        const L = paramMap['length'] ?? 0;
        const W = paramMap['width'] ?? 0;
        const D = paramMap['depth'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm³';
        roundingDecimals = rules.rounding.concreteVolumeDecimals;
        formula = 'Length × Width × Depth × Number';
        formulaNotation = 'L × W × D × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${D.toFixed(2)}m × ${N}`;
        grossQuantity = L * W * D * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Cross-Sectional Area', expression: `${L.toFixed(2)} × ${W.toFixed(2)}`, value: L * W, unit: 'm²' },
          { stepNumber: 2, label: 'Unit Volume', expression: `${(L * W).toFixed(3)} × ${D.toFixed(2)}`, value: L * W * D, unit: 'm³' },
          { stepNumber: 3, label: 'Total RCC Volume', expression: `${(L * W * D).toFixed(3)} × ${N}`, value: grossQuantity, unit: 'm³' }
        ];
        break;
      }

      case 'RCC_COLUMN': {
        const W = paramMap['width'] ?? 0;
        const D = paramMap['depth'] ?? 0;
        const H = paramMap['height'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm³';
        roundingDecimals = rules.rounding.concreteVolumeDecimals;
        formula = 'Width × Depth × Height × Number';
        formulaNotation = 'W × D × H × N';
        evaluatedExpression = `${W.toFixed(3)}m × ${D.toFixed(3)}m × ${H.toFixed(2)}m × ${N}`;
        grossQuantity = W * D * H * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Column Section Area', expression: `${W.toFixed(3)} × ${D.toFixed(3)}`, value: W * D, unit: 'm²' },
          { stepNumber: 2, label: 'Single Column Concrete Volume', expression: `${(W * D).toFixed(4)} × ${H.toFixed(2)}`, value: W * D * H, unit: 'm³' },
          { stepNumber: 3, label: 'Total Column Volume for Group', expression: `${(W * D * H).toFixed(3)} × ${N}`, value: grossQuantity, unit: 'm³' }
        ];
        break;
      }

      case 'RCC_SLAB':
      case 'RCC_RAFT': {
        const L = paramMap['length'] ?? 0;
        const W = paramMap['width'] ?? 0;
        const T = paramMap['thickness'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm³';
        roundingDecimals = rules.rounding.concreteVolumeDecimals;
        formula = 'Length × Width × Thickness × Number';
        formulaNotation = 'L × W × T × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${T.toFixed(3)}m × ${N}`;
        grossQuantity = L * W * T * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Slab Plan Area', expression: `${L.toFixed(2)} × ${W.toFixed(2)}`, value: L * W, unit: 'm²' },
          { stepNumber: 2, label: 'Slab Concrete Volume', expression: `${(L * W).toFixed(2)} × ${T.toFixed(3)}`, value: L * W * T, unit: 'm³' },
          { stepNumber: 3, label: 'Total Slab Volume', expression: `${(L * W * T).toFixed(3)} × ${N}`, value: grossQuantity, unit: 'm³' }
        ];
        break;
      }

      case 'RCC_WALL': {
        const L = paramMap['length'] ?? 0;
        const H = paramMap['height'] ?? 0;
        const T = paramMap['thickness'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm³';
        roundingDecimals = rules.rounding.concreteVolumeDecimals;
        formula = 'Length × Height × Thickness × Number';
        formulaNotation = 'L × H × T × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${H.toFixed(2)}m × ${T.toFixed(3)}m × ${N}`;
        grossQuantity = L * H * T * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Gross Wall Elevation Area', expression: `${L.toFixed(2)} × ${H.toFixed(2)}`, value: L * H, unit: 'm²' },
          { stepNumber: 2, label: 'Gross Wall Concrete Volume', expression: `${(L * H).toFixed(2)} × ${T.toFixed(3)}`, value: L * H * T, unit: 'm³' },
          { stepNumber: 3, label: 'Total Wall Volume', expression: `${(L * H * T).toFixed(3)} × ${N}`, value: grossQuantity, unit: 'm³' }
        ];
        break;
      }

      case 'RCC_STAIR': {
        const flightCount = paramMap['flightCount'] ?? paramMap['count'] ?? 1;
        const waistThk = paramMap['waistThickness'] ?? 0.15;
        const flightLength = paramMap['flightLength'] ?? paramMap['length'] ?? 0;
        const flightWidth = paramMap['flightWidth'] ?? paramMap['width'] ?? 0;
        const riser = paramMap['riser'] ?? 0.15;
        const tread = paramMap['tread'] ?? 0.30;
        const stepCount = paramMap['stepCount'] ?? 10;
        
        unit = 'm³';
        roundingDecimals = rules.rounding.concreteVolumeDecimals;
        const waistVol = flightLength * flightWidth * waistThk;
        const stepsVol = (0.5 * riser * tread) * flightWidth * stepCount;
        grossQuantity = (waistVol + stepsVol) * flightCount;
        formula = '[(Waist Slab L × W × T) + (0.5 × Riser × Tread × W × Steps)] × Flights';
        formulaNotation = '[(L × W × T_w) + (0.5 × R × T_r × W × N_steps)] × N_flights';
        evaluatedExpression = `[(${flightLength.toFixed(2)} × ${flightWidth.toFixed(2)} × ${waistThk.toFixed(3)}) + (0.5 × ${riser.toFixed(2)} × ${tread.toFixed(2)} × ${flightWidth.toFixed(2)} × ${stepCount})] × ${flightCount}`;
        intermediateSteps = [
          { stepNumber: 1, label: 'Inclined Waist Slab Volume', expression: `${flightLength.toFixed(2)} × ${flightWidth.toFixed(2)} × ${waistThk.toFixed(3)}`, value: waistVol, unit: 'm³' },
          { stepNumber: 2, label: 'Steps Triangular Volume', expression: `0.5 × ${riser.toFixed(2)} × ${tread.toFixed(2)} × ${flightWidth.toFixed(2)} × ${stepCount}`, value: stepsVol, unit: 'm³' },
          { stepNumber: 3, label: 'Single Flight Volume', expression: `${waistVol.toFixed(3)} + ${stepsVol.toFixed(3)}`, value: waistVol + stepsVol, unit: 'm³' },
          { stepNumber: 4, label: 'Total Stair Concrete', expression: `${(waistVol + stepsVol).toFixed(3)} × ${flightCount}`, value: grossQuantity, unit: 'm³' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 4. FORMWORK / SHUTTERING
      // -------------------------------------------------------------
      case 'FORMWORK_FOOTING': {
        const L = paramMap['length'] ?? 0;
        const W = paramMap['width'] ?? 0;
        const D = paramMap['depth'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        formula = 'Perimeter × Depth × Number = 2 × (Length + Width) × Depth × Number';
        formulaNotation = '2 × (L + W) × D × N';
        evaluatedExpression = `2 × (${L.toFixed(2)}m + ${W.toFixed(2)}m) × ${D.toFixed(2)}m × ${N}`;
        const perim = 2 * (L + W);
        grossQuantity = perim * D * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Footing Perimeter', expression: `2 × (${L.toFixed(2)} + ${W.toFixed(2)})`, value: perim, unit: 'm' },
          { stepNumber: 2, label: 'Shuttering Area per Footing', expression: `${perim.toFixed(2)} × ${D.toFixed(2)}`, value: perim * D, unit: 'm²' },
          { stepNumber: 3, label: 'Total Footing Formwork', expression: `${(perim * D).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      case 'FORMWORK_COLUMN': {
        const W = paramMap['width'] ?? 0;
        const D = paramMap['depth'] ?? 0;
        const H = paramMap['height'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        formula = 'Perimeter × Height × Number = 2 × (Width + Depth) × Height × Number';
        formulaNotation = '2 × (W + D) × H × N';
        evaluatedExpression = `2 × (${W.toFixed(3)}m + ${D.toFixed(3)}m) × ${H.toFixed(2)}m × ${N}`;
        const perim = 2 * (W + D);
        grossQuantity = perim * H * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Column Perimeter', expression: `2 × (${W.toFixed(3)} + ${D.toFixed(3)})`, value: perim, unit: 'm' },
          { stepNumber: 2, label: 'Formwork Area per Column', expression: `${perim.toFixed(3)} × ${H.toFixed(2)}`, value: perim * H, unit: 'm²' },
          { stepNumber: 3, label: 'Total Column Shuttering', expression: `${(perim * H).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      case 'FORMWORK_BEAM': {
        const L = paramMap['length'] ?? 0;
        const W = paramMap['width'] ?? 0;
        const D = paramMap['depth'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        formula = '(2 × Depth + Soffit Width) × Length × Number';
        formulaNotation = '(2 × D + W) × L × N';
        evaluatedExpression = `(2 × ${D.toFixed(2)}m + ${W.toFixed(2)}m) × ${L.toFixed(2)}m × ${N}`;
        const girth = (2 * D) + W;
        grossQuantity = girth * L * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Beam Contact Girth (Soffit + 2 Sides)', expression: `(2 × ${D.toFixed(2)}) + ${W.toFixed(2)}`, value: girth, unit: 'm' },
          { stepNumber: 2, label: 'Formwork Area per Beam', expression: `${girth.toFixed(2)} × ${L.toFixed(2)}`, value: girth * L, unit: 'm²' },
          { stepNumber: 3, label: 'Total Beam Formwork Area', expression: `${(girth * L).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      case 'FORMWORK_SLAB': {
        const L = paramMap['length'] ?? 0;
        const W = paramMap['width'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        formula = 'Length × Width × Number (Slab Soffit Shuttering)';
        formulaNotation = 'L × W × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${N}`;
        grossQuantity = L * W * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Slab Soffit Area', expression: `${L.toFixed(2)} × ${W.toFixed(2)}`, value: L * W, unit: 'm²' },
          { stepNumber: 2, label: 'Total Slab Soffit Shuttering', expression: `${(L * W).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      case 'FORMWORK_WALL': {
        const L = paramMap['length'] ?? 0;
        const H = paramMap['height'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        formula = '2 × Length × Height × Number (Double-Faced Wall Shuttering)';
        formulaNotation = '2 × L × H × N';
        evaluatedExpression = `2 × ${L.toFixed(2)}m × ${H.toFixed(2)}m × ${N}`;
        grossQuantity = 2 * L * H * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Single Face Area', expression: `${L.toFixed(2)} × ${H.toFixed(2)}`, value: L * H, unit: 'm²' },
          { stepNumber: 2, label: 'Double Face Shuttering per Wall', expression: `2 × ${(L * H).toFixed(2)}`, value: 2 * L * H, unit: 'm²' },
          { stepNumber: 3, label: 'Total Wall Formwork Area', expression: `${(2 * L * H).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 5. MASONRY & WALLS
      // -------------------------------------------------------------
      case 'MASONRY_WALL_VOL': {
        const L = paramMap['length'] ?? 0;
        const H = paramMap['height'] ?? 0;
        const T = paramMap['thickness'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm³';
        roundingDecimals = rules.rounding.concreteVolumeDecimals;
        defaultWastage = rules.wastageRates.masonryBlocksPct;
        formula = 'Length × Height × Thickness × Number − Deductions';
        formulaNotation = 'L × H × T × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${H.toFixed(2)}m × ${T.toFixed(3)}m × ${N}`;
        grossQuantity = L * H * T * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Gross Wall Face Area', expression: `${L.toFixed(2)} × ${H.toFixed(2)}`, value: L * H, unit: 'm²' },
          { stepNumber: 2, label: 'Gross Masonry Volume', expression: `${(L * H).toFixed(2)} × ${T.toFixed(3)}`, value: L * H * T, unit: 'm³' },
          { stepNumber: 3, label: 'Total Gross Volume for Walls', expression: `${(L * H * T).toFixed(3)} × ${N}`, value: grossQuantity, unit: 'm³' }
        ];
        break;
      }

      case 'MASONRY_WALL_AREA': {
        const L = paramMap['length'] ?? 0;
        const H = paramMap['height'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        defaultWastage = rules.wastageRates.masonryBlocksPct;
        formula = 'Length × Height × Number − Opening Deductions';
        formulaNotation = 'L × H × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${H.toFixed(2)}m × ${N}`;
        grossQuantity = L * H * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Gross Wall Area', expression: `${L.toFixed(2)} × ${H.toFixed(2)}`, value: L * H, unit: 'm²' },
          { stepNumber: 2, label: 'Total Gross Wall Area for Group', expression: `${(L * H).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 6. DAMP PROOF COURSE (DPC)
      // -------------------------------------------------------------
      case 'DPC': {
        const L = paramMap['length'] ?? 0;
        const W = paramMap['width'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        defaultWastage = rules.wastageRates.dpcWaterproofingPct;
        formula = 'Length × Width × Number';
        formulaNotation = 'L × W × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${W.toFixed(3)}m × ${N}`;
        grossQuantity = L * W * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'DPC Area per Wall Plinth', expression: `${L.toFixed(2)} × ${W.toFixed(3)}`, value: L * W, unit: 'm²' },
          { stepNumber: 2, label: 'Total DPC Membrane Area', expression: `${(L * W).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 7. REINFORCEMENT ENGINE (d² / 162 kg/m)
      // -------------------------------------------------------------
      case 'REINFORCEMENT_MEMBER': {
        const diaMm = paramMap['diameterMm'] ?? 0;
        const barLen = paramMap['barLength'] ?? 0;
        const barCountPerMember = paramMap['barsPerMember'] ?? paramMap['count'] ?? 1;
        const memberCount = paramMap['memberCount'] ?? 1;
        const lapCount = paramMap['lapCount'] ?? 0;
        const lapLen = paramMap['lapLength'] ?? (rules.reinforcement.defaultLapMultiplier * (diaMm / 1000));
        
        unit = 'kg';
        roundingDecimals = rules.rounding.steelWeightDecimals;
        defaultWastage = rules.wastageRates.rebarPct;
        
        // Unit weight d^2 / 162.2 kg/m
        const unitWeightKgM = (diaMm * diaMm) / 162.2;
        const cuttingLen = barLen + (lapCount * lapLen);
        const totalLen = cuttingLen * barCountPerMember * memberCount;
        grossQuantity = totalLen * unitWeightKgM;
        
        formula = 'Cutting Length × (d² / 162.2) × Total Bars';
        formulaNotation = '[L_bar + (N_lap × L_lap)] × (d² / 162.2) × (N_bars × N_members)';
        evaluatedExpression = `[${barLen.toFixed(2)}m + (${lapCount} × ${lapLen.toFixed(2)}m)] × (${diaMm}² / 162.2 = ${unitWeightKgM.toFixed(3)} kg/m) × (${barCountPerMember} × ${memberCount})`;
        
        intermediateSteps = [
          { stepNumber: 1, label: 'Theoretical Unit Weight (kg/m)', expression: `${diaMm}² / 162.2`, value: unitWeightKgM, unit: 'kg/m' },
          { stepNumber: 2, label: 'Single Bar Cutting Length with Laps', expression: `${barLen.toFixed(2)} + (${lapCount} × ${lapLen.toFixed(2)})`, value: cuttingLen, unit: 'm' },
          { stepNumber: 3, label: 'Total Linear Length of Reinforcement', expression: `${cuttingLen.toFixed(2)} × ${barCountPerMember} × ${memberCount}`, value: totalLen, unit: 'm' },
          { stepNumber: 4, label: 'Total Steel Weight', expression: `${totalLen.toFixed(2)} × ${unitWeightKgM.toFixed(3)}`, value: grossQuantity, unit: 'kg' }
        ];
        break;
      }

      case 'REINFORCEMENT_SPACING': {
        const diaMm = paramMap['diameterMm'] ?? 0;
        const spanM = paramMap['spanLength'] ?? 0;
        const spacingM = (paramMap['spacingMm'] ?? 150) / 1000;
        const barLengthM = paramMap['barLength'] ?? 0;
        const memberCount = paramMap['memberCount'] ?? 1;
        
        unit = 'kg';
        roundingDecimals = rules.rounding.steelWeightDecimals;
        
        // Bar count calculation rule
        let calculatedBars = Math.ceil(spanM / spacingM) + 1;
        if (rules.reinforcement.spacingRule === 'EXACT_RATIO') {
          calculatedBars = Math.round(spanM / spacingM);
        } else if (rules.reinforcement.spacingRule === 'FLOOR_PLUS_ONE') {
          calculatedBars = Math.floor(spanM / spacingM) + 1;
        }

        const unitWeightKgM = (diaMm * diaMm) / 162.2;
        const totalLen = calculatedBars * barLengthM * memberCount;
        grossQuantity = totalLen * unitWeightKgM;

        formula = 'ceil(Span / Spacing + 1) × Bar Length × (d² / 162.2) × Member Count';
        formulaNotation = '[ceil(L_span / s) + 1] × L_bar × (d² / 162.2) × N_members';
        evaluatedExpression = `[ceil(${spanM.toFixed(2)}m / ${(spacingM * 1000).toFixed(0)}mm) + 1 = ${calculatedBars} bars] × ${barLengthM.toFixed(2)}m × ${unitWeightKgM.toFixed(3)} kg/m × ${memberCount}`;

        intermediateSteps = [
          { stepNumber: 1, label: 'Calculated Bar Count along Span', expression: `ceil(${spanM.toFixed(2)} / ${spacingM.toFixed(3)}) + 1`, value: calculatedBars, unit: 'bars' },
          { stepNumber: 2, label: 'Theoretical Unit Weight', expression: `${diaMm}² / 162.2`, value: unitWeightKgM, unit: 'kg/m' },
          { stepNumber: 3, label: 'Total Linear Run of Bars', expression: `${calculatedBars} × ${barLengthM.toFixed(2)} × ${memberCount}`, value: totalLen, unit: 'm' },
          { stepNumber: 4, label: 'Total Reinforcement Weight', expression: `${totalLen.toFixed(2)} × ${unitWeightKgM.toFixed(3)}`, value: grossQuantity, unit: 'kg' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 8. STRUCTURAL STEEL ENGINE
      // -------------------------------------------------------------
      case 'STEEL_MEMBER_WEIGHT': {
        const L = paramMap['length'] ?? 0;
        const unitWeightKgM = paramMap['unitWeightKgM'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'kg';
        roundingDecimals = rules.rounding.steelWeightDecimals;
        defaultWastage = rules.wastageRates.structuralSteelPct;
        
        formula = 'Length × Verified Unit Weight × Quantity';
        formulaNotation = 'L × W_unit × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${unitWeightKgM.toFixed(2)} kg/m × ${N}`;
        grossQuantity = L * unitWeightKgM * N;
        
        intermediateSteps = [
          { stepNumber: 1, label: 'Single Member Weight', expression: `${L.toFixed(2)} × ${unitWeightKgM.toFixed(2)}`, value: L * unitWeightKgM, unit: 'kg' },
          { stepNumber: 2, label: 'Total Steel Weight for Group', expression: `${(L * unitWeightKgM).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'kg' }
        ];
        break;
      }

      case 'STEEL_BASE_PLATE': {
        const L = paramMap['length'] ?? 0; // in mm or m
        const W = paramMap['width'] ?? 0;
        const T = paramMap['thicknessMm'] ?? 20; // in mm
        const N = paramMap['count'] ?? 1;
        const steelDensity = 7850; // kg/m3
        
        // Normalize length & width to meters if > 50 (assumed mm)
        const lM = L > 10 ? L / 1000 : L;
        const wM = W > 10 ? W / 1000 : W;
        const tM = T / 1000;
        
        unit = 'kg';
        roundingDecimals = rules.rounding.steelWeightDecimals;
        const plateVol = lM * wM * tM;
        const singlePlateWeight = plateVol * steelDensity;
        grossQuantity = singlePlateWeight * N;

        formula = 'Length × Width × Thickness × 7,850 kg/m³ × Quantity';
        formulaNotation = 'L × W × T × ρ × N';
        evaluatedExpression = `${lM.toFixed(3)}m × ${wM.toFixed(3)}m × ${tM.toFixed(3)}m × 7850 kg/m³ × ${N}`;

        intermediateSteps = [
          { stepNumber: 1, label: 'Plate Volume per unit', expression: `${lM.toFixed(3)} × ${wM.toFixed(3)} × ${tM.toFixed(3)}`, value: plateVol, unit: 'm³' },
          { stepNumber: 2, label: 'Weight per Plate (Density 7,850 kg/m³)', expression: `${plateVol.toFixed(5)} × 7850`, value: singlePlateWeight, unit: 'kg' },
          { stepNumber: 3, label: 'Total Base Plates Weight', expression: `${singlePlateWeight.toFixed(2)} × ${N}`, value: grossQuantity, unit: 'kg' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 9. PURLINS & SKYLIGHT PURLIN SYSTEMS
      // -------------------------------------------------------------
      case 'PURLIN_SYSTEM':
      case 'SKYLIGHT_PURLIN': {
        const roofLengthM = paramMap['roofLength'] ?? paramMap['length'] ?? 0;
        const purlinSpacingM = (paramMap['spacingMm'] ?? 1500) / 1000;
        const bayLengthM = paramMap['bayLength'] ?? 6.0;
        const numberOfSlopes = paramMap['slopes'] ?? 2; // Gable roof default 2 slopes
        const unitWeightKgM = paramMap['unitWeightKgM'] ?? 5.24;
        
        unit = 'kg';
        roundingDecimals = rules.rounding.steelWeightDecimals;
        
        const linesPerSlope = Math.ceil(roofLengthM / purlinSpacingM) + 1;
        const totalLines = linesPerSlope * numberOfSlopes;
        const totalLinearM = totalLines * bayLengthM;
        grossQuantity = totalLinearM * unitWeightKgM;

        formula = 'Lines × Bay Length × Unit Weight = [ceil(Slope L / Spacing) + 1 × Slopes] × L_bay × W_unit';
        formulaNotation = 'N_lines × L_bay × W_unit';
        evaluatedExpression = `${totalLines} lines × ${bayLengthM.toFixed(2)}m × ${unitWeightKgM.toFixed(2)} kg/m`;

        intermediateSteps = [
          { stepNumber: 1, label: 'Purlin Lines per Slope', expression: `ceil(${roofLengthM.toFixed(2)} / ${purlinSpacingM.toFixed(2)}) + 1`, value: linesPerSlope, unit: 'lines' },
          { stepNumber: 2, label: 'Total Purlin Lines across all slopes', expression: `${linesPerSlope} × ${numberOfSlopes}`, value: totalLines, unit: 'lines' },
          { stepNumber: 3, label: 'Total Linear Purlin Run', expression: `${totalLines} × ${bayLengthM.toFixed(2)}`, value: totalLinearM, unit: 'm' },
          { stepNumber: 4, label: 'Total Purlin Steel Weight', expression: `${totalLinearM.toFixed(2)} × ${unitWeightKgM.toFixed(2)}`, value: grossQuantity, unit: 'kg' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 10. ROOF CLADDING & SLOPED GEOMETRY
      // -------------------------------------------------------------
      case 'ROOF_CLADDING_SLOPED': {
        const planLength = paramMap['planLength'] ?? paramMap['length'] ?? 0;
        const planWidth = paramMap['planWidth'] ?? paramMap['width'] ?? 0;
        const slopeDeg = paramMap['slopeDegrees'] ?? paramMap['pitchDegrees'] ?? 0;
        const N = paramMap['count'] ?? 1;
        
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        defaultWastage = rules.wastageRates.roofSheetsPct;

        const planArea = planLength * planWidth;
        const slopeRad = (slopeDeg * Math.PI) / 180;
        const cosFactor = Math.cos(slopeRad) > 0 ? Math.cos(slopeRad) : 1;
        const slopedArea = planArea / cosFactor;
        grossQuantity = slopedArea * N;

        formula = 'Plan Area / cos(Slope Angle) × Number';
        formulaNotation = '(L_plan × W_plan) / cos(θ) × N';
        evaluatedExpression = `(${planLength.toFixed(2)}m × ${planWidth.toFixed(2)}m) / cos(${slopeDeg.toFixed(1)}°) × ${N}`;

        intermediateSteps = [
          { stepNumber: 1, label: 'Plan Footprint Area', expression: `${planLength.toFixed(2)} × ${planWidth.toFixed(2)}`, value: planArea, unit: 'm²' },
          { stepNumber: 2, label: `Slope Factor (1 / cos(${slopeDeg}°))`, expression: `1 / ${cosFactor.toFixed(4)}`, value: 1 / cosFactor, unit: 'ratio' },
          { stepNumber: 3, label: 'True Sloped Cladding Area per Roof Bay', expression: `${planArea.toFixed(2)} / ${cosFactor.toFixed(4)}`, value: slopedArea, unit: 'm²' },
          { stepNumber: 4, label: 'Total Cladding Area', expression: `${slopedArea.toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      case 'SKYLIGHT_ASSEMBLY': {
        const L = paramMap['length'] ?? 0;
        const W = paramMap['width'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        formula = 'Length × Width × Number';
        formulaNotation = 'L × W × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${N}`;
        grossQuantity = L * W * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Single Skylight Area', expression: `${L.toFixed(2)} × ${W.toFixed(2)}`, value: L * W, unit: 'm²' },
          { stepNumber: 2, label: 'Total Skylight Glazed Area', expression: `${(L * W).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 11. WATERPROOFING SURFACES
      // -------------------------------------------------------------
      case 'WATERPROOFING_SURFACE': {
        const L = paramMap['length'] ?? 0;
        const W = paramMap['width'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        defaultWastage = rules.wastageRates.dpcWaterproofingPct;
        formula = 'Length × Width × Number';
        formulaNotation = 'L × W × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${N}`;
        grossQuantity = L * W * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Waterproofing Surface Area per Unit', expression: `${L.toFixed(2)} × ${W.toFixed(2)}`, value: L * W, unit: 'm²' },
          { stepNumber: 2, label: 'Total Waterproofing Area', expression: `${(L * W).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 12. PLASTER, PAINTING & FINISHES
      // -------------------------------------------------------------
      case 'PLASTER_INTERNAL':
      case 'PLASTER_EXTERNAL':
      case 'PAINTING_SURFACE': {
        const L = paramMap['length'] ?? 0;
        const H = paramMap['height'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        formula = 'Length × Height × Number − Deductions';
        formulaNotation = 'L × H × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${H.toFixed(2)}m × ${N}`;
        grossQuantity = L * H * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Gross Wall Plaster/Paint Area', expression: `${L.toFixed(2)} × ${H.toFixed(2)}`, value: L * H, unit: 'm²' },
          { stepNumber: 2, label: 'Total Gross Surface Area', expression: `${(L * H).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      case 'PLASTER_CEILING':
      case 'FLOOR_FINISH': {
        const L = paramMap['length'] ?? 0;
        const W = paramMap['width'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm²';
        roundingDecimals = rules.rounding.areaDecimals;
        defaultWastage = templateType === 'FLOOR_FINISH' ? rules.wastageRates.tilesFinishesPct : 0;
        formula = 'Length × Width × Number';
        formulaNotation = 'L × W × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${W.toFixed(2)}m × ${N}`;
        grossQuantity = L * W * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Room Surface Area', expression: `${L.toFixed(2)} × ${W.toFixed(2)}`, value: L * W, unit: 'm²' },
          { stepNumber: 2, label: 'Total Finish Area for Group', expression: `${(L * W).toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm²' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 13. DOORS & WINDOWS SCHEDULE QUANTITY
      // -------------------------------------------------------------
      case 'DOORS_WINDOWS_SCHEDULE': {
        const W = paramMap['width'] ?? 0;
        const H = paramMap['height'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'Nr'; // or m²
        roundingDecimals = 0;
        formula = 'Number of Units (Count)';
        formulaNotation = 'N';
        evaluatedExpression = `${N} Nr (Dimensions: ${W.toFixed(2)}m × ${H.toFixed(2)}m)`;
        grossQuantity = N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Unit Face Area', expression: `${W.toFixed(2)} × ${H.toFixed(2)}`, value: W * H, unit: 'm²' },
          { stepNumber: 2, label: 'Schedule Unit Count', expression: `${N}`, value: N, unit: 'Nr' }
        ];
        break;
      }

      // -------------------------------------------------------------
      // 14. MEP RUNS & EQUIPMENT
      // -------------------------------------------------------------
      case 'MEP_PIPE_RUN':
      case 'MEP_DUCT_RUN':
      case 'MEP_CABLE_TRAY': {
        const L = paramMap['length'] ?? 0;
        const N = paramMap['count'] ?? 1;
        unit = 'm';
        roundingDecimals = rules.rounding.linearLengthDecimals;
        formula = 'Length × Number';
        formulaNotation = 'L × N';
        evaluatedExpression = `${L.toFixed(2)}m × ${N}`;
        grossQuantity = L * N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Linear Run Length', expression: `${L.toFixed(2)} × ${N}`, value: grossQuantity, unit: 'm' }
        ];
        break;
      }

      case 'MEP_EQUIPMENT_COUNT': {
        const N = paramMap['count'] ?? 1;
        unit = 'Nr';
        roundingDecimals = 0;
        formula = 'Count of Equipment Units';
        formulaNotation = 'N';
        evaluatedExpression = `${N} Nr`;
        grossQuantity = N;
        intermediateSteps = [
          { stepNumber: 1, label: 'Equipment Piece Count', expression: `${N}`, value: N, unit: 'Nr' }
        ];
        break;
      }

      default: {
        const L = paramMap['length'] ?? 1;
        const W = paramMap['width'] ?? 1;
        const D = paramMap['depth'] ?? 1;
        const N = paramMap['count'] ?? 1;
        unit = 'm³';
        roundingDecimals = 3;
        formula = 'Length × Width × Depth × Number';
        formulaNotation = 'L × W × D × N';
        evaluatedExpression = `${L} × ${W} × ${D} × ${N}`;
        grossQuantity = L * W * D * N;
        intermediateSteps = [{ stepNumber: 1, label: 'Evaluated Geometric Calculation', expression: `${L} × ${W} × ${D} × ${N}`, value: grossQuantity, unit: 'm³' }];
        break;
      }
    }

    // 2. DEDUCTIONS EVALUATION
    let totalDeductions = 0;
    const isVolumeUnit = unit === 'm³';
    
    deductions.forEach(ded => {
      if (ded.isDeductible) {
        if (isVolumeUnit && ded.deductionVolumeM3 !== undefined) {
          totalDeductions += ded.deductionVolumeM3;
        } else {
          totalDeductions += ded.deductionAreaM2;
        }
      }
    });

    const netMeasuredQuantity = Math.max(0, grossQuantity - totalDeductions);
    const roundedNet = roundTo(netMeasuredQuantity, roundingDecimals);

    // 3. WASTAGE & TENDER QUANTITY
    const effectiveWastagePct = customWastagePct !== undefined ? customWastagePct : defaultWastage;
    const wastageQuantity = roundTo(roundedNet * (effectiveWastagePct / 100), roundingDecimals);
    const tenderQuantity = roundTo(roundedNet + wastageQuantity, roundingDecimals);

    return {
      isBlocked: false,
      associatedOpenItemIds: [],
      formula,
      formulaNotation,
      evaluatedExpression,
      intermediateSteps,
      grossQuantity: roundTo(grossQuantity, roundingDecimals),
      totalDeductions: roundTo(totalDeductions, roundingDecimals),
      netMeasuredQuantity: roundedNet,
      wastageQuantity,
      tenderQuantity,
      unit,
      status: 'CALCULATED'
    };
  }
}
