/**
 * Export Theme Engine
 * Provides unified color schemes, typography, borders, and ExcelJS styling definitions
 * for client/consultant-presentable professional BOQ & engineering reports.
 */

import { ExportColorTheme } from '../types';

export interface ThemeColorPalette {
  name: string;
  code: ExportColorTheme;
  primaryArgb: string;      // Header fill / Main Title
  primaryTextArgb: string;  // White or dark
  sectionArgb: string;      // Section Title Fill
  sectionTextArgb: string;
  subSectionArgb: string;   // Subsection Fill
  subSectionTextArgb: string;
  tableHeaderArgb: string;  // Data Table Column Headers
  tableHeaderTextArgb: string;
  zebraLightArgb: string;   // Subtle alternating row
  subtotalBgArgb: string;   // Subtotal row highlight
  subtotalTextArgb: string;
  grandTotalBgArgb: string; // Grand Total row highlight
  grandTotalTextArgb: string;
  borderColorArgb: string;  // Standard cell border
  accentBorderArgb: string; // Strong outer border
  warningBgArgb: string;    // Open item / review required
  conflictBgArgb: string;   // Conflict alert
  verifiedBgArgb: string;   // Verified highlight
  tagBadgeArgb: string;
}

export const THEME_PALETTES: Record<ExportColorTheme, ThemeColorPalette> = {
  CORPORATE_BLUE: {
    name: 'Corporate Blue',
    code: 'CORPORATE_BLUE',
    primaryArgb: 'FF1E3A8A',      // Deep Blue 900
    primaryTextArgb: 'FFFFFFFF',
    sectionArgb: 'FF1E40AF',      // Blue 800
    sectionTextArgb: 'FFFFFFFF',
    subSectionArgb: 'FFDBEAFE',   // Light Blue 100
    subSectionTextArgb: 'FF1E3A8A',
    tableHeaderArgb: 'FF1E3A8A',  // Navy Blue
    tableHeaderTextArgb: 'FFFFFFFF',
    zebraLightArgb: 'FFF8FAFC',   // Slate 50
    subtotalBgArgb: 'FFDBEAFE',   // Soft Blue
    subtotalTextArgb: 'FF1E3A8A',
    grandTotalBgArgb: 'FF172554', // Darkest Navy
    grandTotalTextArgb: 'FFFFFFFF',
    borderColorArgb: 'FFCBD5E1',  // Slate 300
    accentBorderArgb: 'FF1E3A8A',
    warningBgArgb: 'FFFEF3C7',    // Amber 100
    conflictBgArgb: 'FFFEE2E2',   // Red 100
    verifiedBgArgb: 'FFDCFCE7',   // Green 100
    tagBadgeArgb: 'FFEFF6FF',
  },
  PROFESSIONAL_TEAL: {
    name: 'Professional Teal',
    code: 'PROFESSIONAL_TEAL',
    primaryArgb: 'FF0F766E',      // Teal 700
    primaryTextArgb: 'FFFFFFFF',
    sectionArgb: 'FF115E59',      // Teal 800
    sectionTextArgb: 'FFFFFFFF',
    subSectionArgb: 'FFCCFBF1',   // Teal 100
    subSectionTextArgb: 'FF0F766E',
    tableHeaderArgb: 'FF0F766E',
    tableHeaderTextArgb: 'FFFFFFFF',
    zebraLightArgb: 'FFF0FDFA',   // Teal 50
    subtotalBgArgb: 'FFCCFBF1',
    subtotalTextArgb: 'FF115E59',
    grandTotalBgArgb: 'FF042F2E', // Teal 950
    grandTotalTextArgb: 'FFFFFFFF',
    borderColorArgb: 'FFCCECE6',
    accentBorderArgb: 'FF0F766E',
    warningBgArgb: 'FFFEF3C7',
    conflictBgArgb: 'FFFEE2E2',
    verifiedBgArgb: 'FFDCFCE7',
    tagBadgeArgb: 'FFF0FDFA',
  },
  DARK_GREY: {
    name: 'Dark Grey (Slate)',
    code: 'DARK_GREY',
    primaryArgb: 'FF334155',      // Slate 700
    primaryTextArgb: 'FFFFFFFF',
    sectionArgb: 'FF1E293B',      // Slate 800
    sectionTextArgb: 'FFFFFFFF',
    subSectionArgb: 'FFE2E8F0',   // Slate 200
    subSectionTextArgb: 'FF0F172A',
    tableHeaderArgb: 'FF334155',
    tableHeaderTextArgb: 'FFFFFFFF',
    zebraLightArgb: 'FFF8FAFC',
    subtotalBgArgb: 'FFE2E8F0',
    subtotalTextArgb: 'FF0F172A',
    grandTotalBgArgb: 'FF0F172A', // Slate 900
    grandTotalTextArgb: 'FFFFFFFF',
    borderColorArgb: 'FFCBD5E1',
    accentBorderArgb: 'FF334155',
    warningBgArgb: 'FFFEF3C7',
    conflictBgArgb: 'FFFEE2E2',
    verifiedBgArgb: 'FFDCFCE7',
    tagBadgeArgb: 'FFF1F5F9',
  },
  CORPORATE_GREEN: {
    name: 'Corporate Green',
    code: 'CORPORATE_GREEN',
    primaryArgb: 'FF14532D',      // Emerald 900
    primaryTextArgb: 'FFFFFFFF',
    sectionArgb: 'FF166534',      // Green 800
    sectionTextArgb: 'FFFFFFFF',
    subSectionArgb: 'FFDCFCE7',   // Green 100
    subSectionTextArgb: 'FF14532D',
    tableHeaderArgb: 'FF14532D',
    tableHeaderTextArgb: 'FFFFFFFF',
    zebraLightArgb: 'FFF0FDF4',
    subtotalBgArgb: 'FFDCFCE7',
    subtotalTextArgb: 'FF14532D',
    grandTotalBgArgb: 'FF052E16', // Dark Emerald
    grandTotalTextArgb: 'FFFFFFFF',
    borderColorArgb: 'FFBBF7D0',
    accentBorderArgb: 'FF14532D',
    warningBgArgb: 'FFFEF3C7',
    conflictBgArgb: 'FFFEE2E2',
    verifiedBgArgb: 'FFDCFCE7',
    tagBadgeArgb: 'FFF0FDF4',
  },
};

export function getThemePalette(themeName?: ExportColorTheme): ThemeColorPalette {
  if (themeName && THEME_PALETTES[themeName]) {
    return THEME_PALETTES[themeName];
  }
  return THEME_PALETTES.CORPORATE_BLUE;
}
