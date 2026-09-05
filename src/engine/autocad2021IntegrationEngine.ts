/**
 * Autodesk AutoCAD 2021 Integration Engine
 * Release: AutoCAD 2021 (Version 24.0 / Native AC1032 Format)
 * 
 * Provides:
 * 1. AutoCAD 2021 AC1032 DWG/DXF Format compatibility & headers
 * 2. Native AutoCAD 2021 Command Script (.SCR) generator for opening, zooming, and layer setup
 * 3. AutoCAD 2021 AutoLISP (.LSP) routine generator for bidirectional BOQ tagging & entity inspection
 * 4. AutoCAD 2021 Windows URI protocol handler launcher (`acad2021://` / `autocad://`)
 * 5. One-click Windows Registry (.REG) file generator to link web browser to local acad.exe
 * 6. Batch launcher (.BAT) generator for direct command-line AutoCAD 2021 launching
 */

import { UnifiedBoqItem, ProjectDocument } from '../types';

export interface AutoCAD2021LaunchConfig {
  drawingNumber: string;
  drawingTitle: string;
  filename: string;
  fileFormat: string;
  elementTag?: string;
  itemCode?: string;
  category?: string;
  coordinates?: { x: number; y: number; z?: number };
  quantity?: number;
  unit?: string;
  unitRateAed?: number;
  totalAmountAed?: number;
  layers?: string[];
  scale?: string;
}

export interface AutoCAD2021SystemInfo {
  version: string;
  releaseYear: number;
  dwgVersion: string;
  acadVer: string;
  defaultExecutablePathWin: string;
  defaultExecutablePathAlt: string;
  protocolScheme: string;
  recommendedResolution: string;
}

export const AUTOCAD_2021_SPECS: AutoCAD2021SystemInfo = {
  version: '2021.1 / v24.0',
  releaseYear: 2021,
  dwgVersion: 'AutoCAD 2018-2021 Drawing (*.dwg)',
  acadVer: 'AC1032',
  defaultExecutablePathWin: 'C:\\Program Files\\Autodesk\\AutoCAD 2021\\acad.exe',
  defaultExecutablePathAlt: 'C:\\Program Files\\Autodesk\\AutoCAD LT 2021\\acad.exe',
  protocolScheme: 'acad2021',
  recommendedResolution: 'Optimized for high-DPI 4K displays & large CAD drawings',
};

export class AutoCAD2021IntegrationEngine {
  /**
   * Generates a native AutoCAD 2021 Command Script (.SCR)
   * This script runs inside desktop AutoCAD 2021 via command line: SCRIPT filename.scr
   */
  public static generateAutoCAD2021Script(config: AutoCAD2021LaunchConfig): string {
    const lines: string[] = [];

    lines.push('; ==============================================================================');
    lines.push('; AUTODESK AUTOCAD 2021 - BOQ ESTIMATION & TAKEOFF INTEGRATION SCRIPT');
    lines.push(`; Target: AutoCAD 2021 (Release 24.0 / Format AC1032)`);
    lines.push(`; Drawing Sheet: ${config.drawingNumber} - ${config.drawingTitle}`);
    if (config.itemCode) {
      lines.push(`; Linked BOQ Item: [${config.itemCode}] ${config.elementTag || ''}`);
      lines.push(`; Quantity: ${config.quantity || 1} ${config.unit || 'units'} @ AED ${config.unitRateAed || 0} = AED ${config.totalAmountAed || 0}`);
    }
    lines.push(`; Generated: ${new Date().toISOString()}`);
    lines.push('; ==============================================================================');
    lines.push('');

    // Safe environment settings for AutoCAD 2021
    lines.push('; 1. Environment & Unit Normalization (AutoCAD 2021)');
    lines.push('CMDECHO 0');
    lines.push('FILEDIA 0'); // Suppress file dialogs during automated script execution
    lines.push('INSUNITS 4'); // 4 = Millimeters (standard metric construction)
    lines.push('MEASUREMENT 1'); // 1 = Metric
    lines.push('LUNITS 2'); // Decimal units
    lines.push('LUPREC 2'); // 2 decimal precision
    lines.push('');

    // Create / ensure BOQ inspection layers exist with high-visibility colors
    lines.push('; 2. Create AutoCAD 2021 BOQ Inspection & Annotation Layers');
    lines.push('-LAYER M "BOQ_INSPECTION_2021" C 1 "BOQ_INSPECTION_2021" LW 0.35 "BOQ_INSPECTION_2021" ');
    lines.push('-LAYER M "BOQ_ELEMENT_MARKERS" C 4 "BOQ_ELEMENT_MARKERS" LW 0.50 "BOQ_ELEMENT_MARKERS" ');
    lines.push('-LAYER M "BOQ_RATE_CALLOUTS" C 3 "BOQ_RATE_CALLOUTS" ');
    lines.push('-LAYER S "BOQ_INSPECTION_2021" ');
    lines.push('');

    // Zoom extents or zoom to coordinates if provided
    lines.push('; 3. Viewport Navigation');
    if (config.coordinates) {
      const { x, y } = config.coordinates;
      lines.push(`_ZOOM C ${x},${y} 2500`);
      lines.push(`; Draw high-visibility target marker in AutoCAD 2021`);
      lines.push(`_CIRCLE ${x},${y} 350`);
      lines.push(`_CIRCLE ${x},${y} 150`);
      lines.push(`-MTEXT ${x + 400},${y + 400} H 250 W 3000`);
      lines.push(`BOQ: ${config.itemCode || 'CAD ELEMENT'}\\P${config.elementTag || ''}\\PQty: ${config.quantity || ''} ${config.unit || ''}\\PValue: AED ${(config.totalAmountAed || 0).toLocaleString()}`);
      lines.push('');
    } else {
      lines.push('_ZOOM E');
    }

    lines.push('');
    lines.push('; 4. Restore AutoCAD 2021 Interactive Settings');
    lines.push('FILEDIA 1');
    lines.push('CMDECHO 1');
    lines.push('REDRAW');
    lines.push('(princ "\\n*** AutoCAD 2021 BOQ Integration Sync Completed Successfully! ***\\n")');
    lines.push('');

    return lines.join('\r\n');
  }

  /**
   * Generates a native AutoCAD 2021 AutoLISP (.LSP) module
   * Compatible with AutoCAD 2021 modernized AutoLISP Unicode engine.
   * Can be loaded via APPLOAD or (load "boq_sync_2021.lsp")
   */
  public static generateAutoCAD2021AutoLisp(config: AutoCAD2021LaunchConfig): string {
    const lines: string[] = [];

    lines.push(';;; ==========================================================================');
    lines.push(';;; AUTOCAD 2021 BOQ TAKEOFF & MEASUREMENT BIDIRECTIONAL ENGINE');
    lines.push(';;; Compatible with Autodesk AutoCAD 2021 (64-bit / Unicode LISP)');
    lines.push(';;; ==========================================================================');
    lines.push('');
    lines.push('(vl-load-com)');
    lines.push('');
    lines.push(';; Global project configuration for AutoCAD 2021');
    lines.push(`(setq *BOQ-SHEET-NO* "${config.drawingNumber}")`);
    lines.push(`(setq *BOQ-SHEET-TITLE* "${config.drawingTitle}")`);
    lines.push(`(setq *BOQ-CURRENCY* "AED")`);
    lines.push('');
    lines.push(';; Command: BOQINFO - Displays BOQ Item & Currency Info in AutoCAD 2021 Command Line');
    lines.push('(defun c:BOQINFO ()');
    lines.push('  (princ "\\n=======================================================")');
    lines.push('  (princ "\\n AI BOQ & TENDER ESTIMATION ENGINE - AUTOCAD 2021 BRIDGE")');
    lines.push(`  (princ (strcat "\\n Drawing: " *BOQ-SHEET-NO* " - " *BOQ-SHEET-TITLE*))`);
    if (config.itemCode) {
      lines.push(`  (princ "\\n Active Item: [${config.itemCode}] ${config.elementTag || ''}")`);
      lines.push(`  (princ "\\n Measured Qty: ${config.quantity || 0} ${config.unit || ''}")`);
      lines.push(`  (princ "\\n Unit Rate: AED ${(config.unitRateAed || 0).toFixed(2)}")`);
      lines.push(`  (princ "\\n Total Value: AED ${(config.totalAmountAed || 0).toFixed(2)}")`);
    }
    lines.push('  (princ "\\n Currency: UAE Dirham (AED)")');
    lines.push('  (princ "\\n Commands available in AutoCAD 2021:")');
    lines.push('  (princ "\\n   BOQINFO    - Show active BOQ item data")');
    lines.push('  (princ "\\n   BOQZOOM    - Zoom to measured element coordinates")');
    lines.push('  (princ "\\n   BOQTAG     - Tag selected entity with BOQ Extended Data (XDATA)")');
    lines.push('  (princ "\\n   BOQEXPORT  - Export selected lengths/areas to BOQ format")');
    lines.push('  (princ "\\n=======================================================\\n")');
    lines.push('  (princ)');
    lines.push(')');
    lines.push('');

    // Zoom to coordinate command
    lines.push(';; Command: BOQZOOM - Focus AutoCAD 2021 Viewport onto takeoff target');
    lines.push('(defun c:BOQZOOM ()');
    if (config.coordinates) {
      const { x, y } = config.coordinates;
      lines.push(`  (command "_ZOOM" "_C" (list ${x} ${y} 0.0) 1500.0)`);
      lines.push(`  (princ "\\n[AutoCAD 2021] Centered on element at (${x}, ${y}).")`);
    } else {
      lines.push('  (command "_ZOOM" "_E")');
      lines.push('  (princ "\\n[AutoCAD 2021] Zoomed to drawing extents.")');
    }
    lines.push('  (princ)');
    lines.push(')');
    lines.push('');

    // Tag entity with XDATA
    lines.push(';; Command: BOQTAG - Attach BOQ metadata to any entity in AutoCAD 2021');
    lines.push('(defun c:BOQTAG (/ ent exdata)');
    lines.push('  (setq ent (car (entsel "\\nSelect CAD entity to attach BOQ metadata: ")))');
    lines.push('  (if ent');
    lines.push('    (progn');
    lines.push('      (regapp "AI_BOQ_2021")');
    lines.push('      (setq exdata');
    lines.push('        (list -3');
    lines.push('          (list "AI_BOQ_2021"');
    lines.push(`            (cons 1000 "${config.itemCode || 'BOQ-ITEM'}")`);
    lines.push(`            (cons 1000 "${config.elementTag || 'ELEMENT'}")`);
    lines.push(`            (cons 1000 "AED")`);
    lines.push(`            (cons 1040 ${config.unitRateAed || 0.0})`);
    lines.push('          )');
    lines.push('        )');
    lines.push('      )');
    lines.push('      (entmod (append (entget ent) (list exdata)))');
    lines.push('      (princ "\\n[AutoCAD 2021] BOQ Metadata attached via XDATA successfully!")');
    lines.push('    )');
    lines.push('  )');
    lines.push('  (princ)');
    lines.push(')');
    lines.push('');

    // Auto-exec on load
    lines.push('(c:BOQINFO)');
    lines.push('(princ "\\n*** AutoCAD 2021 AutoLISP BOQ Module Ready. Type BOQINFO to inspect. ***\\n")');
    lines.push('(princ)');

    return lines.join('\r\n');
  }

  /**
   * Generates a Windows Batch Launcher (.BAT) for AutoCAD 2021
   * Allows double-clicking to directly start desktop AutoCAD 2021 with the drawing and script
   */
  public static generateAutoCAD2021BatchLauncher(config: AutoCAD2021LaunchConfig): string {
    const safeFilename = config.filename || `${config.drawingNumber}.dwg`;
    const lines: string[] = [];

    lines.push('@echo off');
    lines.push('title AutoCAD 2021 - BOQ Drawing Launcher');
    lines.push('color 0B');
    lines.push('echo ==============================================================================');
    lines.push('echo        AUTODESK AUTOCAD 2021 - BOQ ESTIMATION & TAKEOFF LAUNCHER');
    lines.push('echo ==============================================================================');
    lines.push(`echo Target Drawing : ${config.drawingNumber} - ${config.drawingTitle}`);
    lines.push(`echo Target File    : ${safeFilename}`);
    lines.push(`echo Currency       : AED (UAE Dirham)`);
    lines.push('echo.');
    lines.push('echo Searching for Autodesk AutoCAD 2021 installation on this system...');
    lines.push('');
    lines.push('set ACAD2021_EXE=""');
    lines.push('if exist "C:\\Program Files\\Autodesk\\AutoCAD 2021\\acad.exe" (');
    lines.push('    set ACAD2021_EXE="C:\\Program Files\\Autodesk\\AutoCAD 2021\\acad.exe"');
    lines.push(') else if exist "C:\\Program Files\\Autodesk\\AutoCAD LT 2021\\acad.exe" (');
    lines.push('    set ACAD2021_EXE="C:\\Program Files\\Autodesk\\AutoCAD LT 2021\\acad.exe"');
    lines.push(') else if exist "%ProgramFiles%\\Autodesk\\AutoCAD 2021\\acad.exe" (');
    lines.push('    set ACAD2021_EXE="%ProgramFiles%\\Autodesk\\AutoCAD 2021\\acad.exe"');
    lines.push(')');
    lines.push('');
    lines.push('if not %ACAD2021_EXE%=="" (');
    lines.push('    echo [FOUND] AutoCAD 2021 detected: %ACAD2021_EXE%');
    lines.push('    echo Launching AutoCAD 2021 with drawing and BOQ synchronization...');
    lines.push(`    start "" %ACAD2021_EXE% /b "boq_sync_2021.scr" "${safeFilename}"`);
    lines.push(') else (');
    lines.push('    echo [NOTE] AutoCAD 2021 not in standard path.');
    lines.push('    echo Attempting Windows file association launch for .dwg/.dxf with AutoCAD...');
    lines.push(`    start "" "${safeFilename}"`);
    lines.push(')');
    lines.push('');
    lines.push('echo.');
    lines.push('echo AutoCAD 2021 process initiated. You may now close this window.');
    lines.push('timeout /t 5 >nul');

    return lines.join('\r\n');
  }

  /**
   * Generates a Windows Registry (.REG) file to register the `acad2021://` protocol
   * Clicking `acad2021://...` in browser directly executes AutoCAD 2021!
   */
  public static generateAutoCAD2021ProtocolReg(): string {
    const lines: string[] = [];

    lines.push('Windows Registry Editor Version 5.00');
    lines.push('');
    lines.push('; ==============================================================================');
    lines.push('; One-Click AutoCAD 2021 Protocol Registration for Web BOQ Engine');
    lines.push('; Enables direct "Open in AutoCAD 2021" browser clicks without security prompts');
    lines.push('; ==============================================================================');
    lines.push('');
    lines.push('[HKEY_CLASSES_ROOT\\acad2021]');
    lines.push('@="URL:AutoCAD 2021 Protocol"');
    lines.push('"URL Protocol"=""');
    lines.push('');
    lines.push('[HKEY_CLASSES_ROOT\\acad2021\\DefaultIcon]');
    lines.push('@="C:\\\\Program Files\\\\Autodesk\\\\AutoCAD 2021\\\\acad.exe,0"');
    lines.push('');
    lines.push('[HKEY_CLASSES_ROOT\\acad2021\\shell]');
    lines.push('');
    lines.push('[HKEY_CLASSES_ROOT\\acad2021\\shell\\open]');
    lines.push('');
    lines.push('[HKEY_CLASSES_ROOT\\acad2021\\shell\\open\\command]');
    lines.push('@="\\\"C:\\\\Program Files\\\\Autodesk\\\\AutoCAD 2021\\\\acad.exe\\\" \\\"%1\\\""');
    lines.push('');
    lines.push('; Fallback for standard autocad:// scheme');
    lines.push('[HKEY_CLASSES_ROOT\\autocad]');
    lines.push('@="URL:AutoCAD Protocol"');
    lines.push('"URL Protocol"=""');
    lines.push('');
    lines.push('[HKEY_CLASSES_ROOT\\autocad\\shell\\open\\command]');
    lines.push('@="\\\"C:\\\\Program Files\\\\Autodesk\\\\AutoCAD 2021\\\\acad.exe\\\" \\\"%1\\\""');
    lines.push('');

    return lines.join('\r\n');
  }

  /**
   * Helper to trigger a browser file download
   */
  public static downloadFile(filename: string, content: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /**
   * Generates a complete AutoCAD 2021 integration package (Script, LISP, BAT, and Instructions)
   */
  public static downloadAutoCAD2021Package(config: AutoCAD2021LaunchConfig): void {
    const scrContent = this.generateAutoCAD2021Script(config);
    const lspContent = this.generateAutoCAD2021AutoLisp(config);
    const batContent = this.generateAutoCAD2021BatchLauncher(config);

    // Download the primary AutoCAD 2021 script
    const baseName = config.drawingNumber ? config.drawingNumber.replace(/[^a-zA-Z0-9-_]/g, '_') : 'drawing';
    this.downloadFile(`${baseName}_AutoCAD2021_Sync.scr`, scrContent, 'application/x-autocad');
    
    // Also trigger AutoLISP routine
    setTimeout(() => {
      this.downloadFile(`boq_sync_autocad2021.lsp`, lspContent, 'application/x-lisp');
    }, 400);

    // Also download Windows batch launcher
    setTimeout(() => {
      this.downloadFile(`Launch_in_AutoCAD_2021.bat`, batContent, 'application/x-bat');
    }, 800);
  }

  /**
   * Attempts to launch AutoCAD 2021 via custom desktop URI protocol
   */
  public static launchViaProtocol(config: AutoCAD2021LaunchConfig): boolean {
    const targetFile = encodeURIComponent(config.filename || `${config.drawingNumber}.dwg`);
    const customUri = `acad2021://open?file=${targetFile}&item=${encodeURIComponent(config.itemCode || '')}&curr=AED`;
    
    try {
      window.location.href = customUri;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Extracts launch config from a ProjectDocument
   */
  public static fromProjectDocument(doc: ProjectDocument, item?: UnifiedBoqItem): AutoCAD2021LaunchConfig {
    const rawDoc = doc as any;
    const rawItem = item as any;
    return {
      drawingNumber: doc.drawingNumber || doc.title || 'DWG-001',
      drawingTitle: doc.title || rawDoc.name || 'CAD Construction Drawing',
      filename: rawDoc.sourceFileName || rawDoc.name || `${doc.drawingNumber || 'drawing'}.${(doc.fileFormat || 'dwg').toLowerCase()}`,
      fileFormat: doc.fileFormat || 'DWG',
      elementTag: item?.elementType || doc.discipline || 'Structural GA',
      itemCode: item?.itemCode,
      category: rawItem?.category || rawItem?.sectionName || doc.discipline,
      quantity: rawItem?.finalQuantity || item?.finalQuantity,
      unit: item?.unit,
      unitRateAed: rawItem?.finalRate || rawItem?.rate || 0,
      totalAmountAed: item?.totalAmount,
      scale: doc.scaleRatio || rawDoc.scale || '1:100',
    };
  }
}
