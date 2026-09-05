import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

const port = process.env.PORT || 3000;

// Path to persistent projects database file
const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const STATES_DIR = path.join(DATA_DIR, 'states');
const VERSIONS_DIR = path.join(DATA_DIR, 'versions');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(STATES_DIR)) {
  fs.mkdirSync(STATES_DIR, { recursive: true });
}
if (!fs.existsSync(VERSIONS_DIR)) {
  fs.mkdirSync(VERSIONS_DIR, { recursive: true });
}
if (!fs.existsSync(PROJECTS_FILE)) {
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify([], null, 2));
}

const readProjectsFromDisk = (): any[] => {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const content = fs.readFileSync(PROJECTS_FILE, 'utf-8');
      return JSON.parse(content || '[]');
    }
  } catch (err) {
    console.error('Error reading projects.json:', err);
  }
  return [];
};

const writeProjectsToDisk = (projects: any[]): void => {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing projects.json:', err);
  }
};

const readProjectStateFromDisk = (projectId: string): any => {
  try {
    const filePath = path.join(STATES_DIR, `${projectId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8') || '{}');
    }
  } catch (err) {
    console.error('Error reading state:', err);
  }
  return null;
};

const writeProjectStateToDisk = (projectId: string, state: any): void => {
  try {
    const filePath = path.join(STATES_DIR, `${projectId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing state:', err);
  }
};

const readProjectVersionsFromDisk = (projectId: string): any[] => {
  try {
    const filePath = path.join(VERSIONS_DIR, `${projectId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8') || '[]');
    }
  } catch (err) {
    console.error('Error reading versions:', err);
  }
  return [];
};

const writeProjectVersionsToDisk = (projectId: string, versions: any[]): void => {
  try {
    const filePath = path.join(VERSIONS_DIR, `${projectId.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`);
    fs.writeFileSync(filePath, JSON.stringify(versions, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing versions:', err);
  }
};

// Shared GenAI client with required header
const getGenAI = () => {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- Projects Database Endpoints ---
app.get('/api/projects', (req, res) => {
  const projects = readProjectsFromDisk();
  res.json({ success: true, projects });
});

// Project State Endpoints
app.get('/api/projects/:id/state', (req, res) => {
  const { id } = req.params;
  const state = readProjectStateFromDisk(id);
  res.json({ success: true, state });
});

app.put('/api/projects/:id/state', (req, res) => {
  try {
    const { id } = req.params;
    const stateData = req.body;
    writeProjectStateToDisk(id, stateData);

    const projects = readProjectsFromDisk();
    const existingIndex = projects.findIndex((p) => p.id === id);
    if (existingIndex >= 0) {
      projects[existingIndex].updatedAt = new Date().toISOString();
      writeProjectsToDisk(projects);
    }

    res.json({ success: true, state: stateData });
  } catch (err: any) {
    console.error('Error writing project state:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Project Versions Endpoints
app.get('/api/projects/:id/versions', (req, res) => {
  const { id } = req.params;
  const versions = readProjectVersionsFromDisk(id);
  res.json({ success: true, versions });
});

app.post('/api/projects/:id/versions', (req, res) => {
  try {
    const { id } = req.params;
    const checkpoint = req.body;
    const versions = readProjectVersionsFromDisk(id);
    versions.push(checkpoint);
    writeProjectVersionsToDisk(id, versions);
    res.status(201).json({ success: true, checkpoint });
  } catch (err: any) {
    console.error('Error creating checkpoint:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/projects/:id', (req, res) => {
  const { id } = req.params;
  const projects = readProjectsFromDisk();
  const project = projects.find((p) => p.id === id);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Project not found' });
  }
  res.json({ success: true, project });
});

app.post('/api/projects', (req, res) => {
  try {
    const projectData = req.body;
    const projects = readProjectsFromDisk();
    
    // Generate unique sequential ID if not provided
    let projectId = projectData.id;
    if (!projectId) {
      const year = new Date().getFullYear();
      const prefix = `PRJ-${year}-`;
      const currentYearProjects = projects.filter((p) => p.id?.startsWith(prefix));
      let maxNum = 0;
      currentYearProjects.forEach((p) => {
        const parts = p.id.split('-');
        if (parts.length >= 3) {
          const num = parseInt(parts[2], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });
      projectId = `${prefix}${(maxNum + 1).toString().padStart(4, '0')}`;
    }

    const now = new Date().toISOString();
    const newProject = {
      ...projectData,
      id: projectId,
      createdAt: projectData.createdAt || now,
      updatedAt: now,
      status: projectData.status || 'Active',
    };

    const existingIndex = projects.findIndex((p) => p.id === projectId);
    if (existingIndex >= 0) {
      projects[existingIndex] = newProject;
    } else {
      projects.push(newProject);
    }

    writeProjectsToDisk(projects);
    res.status(201).json({ success: true, project: newProject });
  } catch (err: any) {
    console.error('Error creating project:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const projectData = req.body;
    const projects = readProjectsFromDisk();
    const existingIndex = projects.findIndex((p) => p.id === id);

    if (existingIndex < 0) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const updatedProject = {
      ...projects[existingIndex],
      ...projectData,
      id,
      updatedAt: new Date().toISOString(),
    };

    projects[existingIndex] = updatedProject;
    writeProjectsToDisk(projects);
    res.json({ success: true, project: updatedProject });
  } catch (err: any) {
    console.error('Error updating project:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    const { id } = req.params;
    const projects = readProjectsFromDisk();
    const filtered = projects.filter((p) => p.id !== id);
    writeProjectsToDisk(filtered);
    res.json({ success: true, deleted: id });
  } catch (err: any) {
    console.error('Error deleting project:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Drawing Analyzer
app.post('/api/analyze-drawing', async (req, res) => {
  try {
    const { drawingMeta, imageBase64, fileBase64, mimeType, textContent, discipline, level } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in server environment. Please set GEMINI_API_KEY in settings to run real Gemini document extraction.',
      });
    }

    const ai = getGenAI();
    
    const prompt = `You are a Senior Quantity Surveying, Structural & Architectural Engineering AI Extraction Engine.
Analyze this construction drawing / CAD sheet / schedule / hand sketch for project discipline: ${discipline || 'General Structural/Architectural'}, Level: ${level || 'Typical'}.

Drawing details:
Number: ${drawingMeta?.drawingNumber || 'N/A'}
Title: ${drawingMeta?.title || 'N/A'}
Revision: ${drawingMeta?.revision || 'Rev 01'}

CORE EXTRACTION PRINCIPLES (Phase 18A Real Drawing Analysis):
1. KNOWN → EXTRACT EXACT EVIDENCE-SUPPORTED VALUES (with bounding box region x,y,width,height as 0-100% percentages)
2. UNCLEAR → FLAG as "REVIEW REQUIRED" / Open Item
3. MISSING → CREATE OPEN ITEM (Do NOT guess dimensions, slab thickness, column height, or bar diameters)
4. CONFLICTING → CREATE CONFLICT ITEM (e.g. Plan vs Schedule size discrepancy)
5. NEVER GUESS OR INVENT: Missing data must remain missing and be recorded as Open Item.

Extract structured engineering data:
- metadata: { drawingNumber, drawingTitle, revision, date, scale, projectName, consultant, sheetNumber }
- pageClassification: 'PLAN' | 'ELEVATION' | 'SECTION' | 'DETAIL' | 'SCHEDULE' | 'GENERAL' | 'SPECIFICATION' | 'COVER' | 'UNKNOWN'
- detectedDimensions: array of { rawText, numericValue, unit ('mm'|'m'|'cm'|'ft'|'inch'), isAmbiguous: boolean, boxX, boxY, boxW, boxH, confidence: 'HIGH'|'MEDIUM'|'LOW' }
- detectedGrids: array of { label (e.g. 'A', 'B', '1', '2'), axis ('X'|'Y'), boxX, boxY, boxW, boxH }
- detectedLevels: array of { name, elevationText (e.g. '+0.000', '+3.600'), datum ('FFL'|'SSL'|'TOS'|'TOC'|'GL'|'NGL'|'FGL'|'Roof Level'), boxX, boxY, boxW, boxH }
- elements: array of { id, mark (e.g. 'C1','B1','W1','D1','S1','F1'), type ('Wall'|'Door'|'Window'|'Column'|'Beam'|'Slab'|'Footing'|'Foundation'|'Stair'|'RCC Wall'|'Steel Column'|'Steel Beam'|'Brace'|'Rafter'|'Purlin'|'Cladding'|'Pipe'|'Duct'), length, width, depth, height, thickness, count, location, gridLocation, material, confidence: 'HIGH'|'MEDIUM'|'LOW', boxX, boxY, boxW, boxH, notes }
- openItems: array of { id, category ('MISSING_DIMENSION'|'UNREADABLE_TEXT'|'UNIT_AMBIGUITY'|'MISSING_THICKNESS'|'MISSING_HEIGHT'|'MISSING_SPECIFICATION'|'SCALE_UNAVAILABLE'), problem, requiredInformation, boxX, boxY, boxW, boxH }
- detectedSchedules: array of { scheduleTitle, scheduleType, headers: string[], rowsCount: number, boxX, boxY, boxW, boxH }`;

    const contents: any[] = [];
    
    // Support fileBase64 (PDF or images) or legacy imageBase64
    const rawBase64 = fileBase64 || imageBase64;
    if (rawBase64) {
      const cleanBase64 = rawBase64.replace(/^data:[^;]+;base64,/, '');
      const effectiveMime = mimeType || (rawBase64.startsWith('data:application/pdf') ? 'application/pdf' : 'image/png');
      contents.push({
        inlineData: {
          mimeType: effectiveMime,
          data: cleanBase64,
        },
      });
    }
    
    if (textContent) {
      contents.push({ text: `Drawing text / vector CAD text content:\n${textContent}` });
    }

    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts: contents },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detectedDiscipline: { type: Type.STRING },
            pageClassification: { type: Type.STRING },
            detectedScale: { type: Type.STRING },
            summary: { type: Type.STRING },
            metadata: {
              type: Type.OBJECT,
              properties: {
                drawingNumber: { type: Type.STRING },
                drawingTitle: { type: Type.STRING },
                revision: { type: Type.STRING },
                date: { type: Type.STRING },
                scale: { type: Type.STRING },
                projectName: { type: Type.STRING },
                consultant: { type: Type.STRING },
                sheetNumber: { type: Type.STRING },
              },
            },
            detectedDimensions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rawText: { type: Type.STRING },
                  numericValue: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  isAmbiguous: { type: Type.BOOLEAN },
                  confidence: { type: Type.STRING },
                  boxX: { type: Type.NUMBER },
                  boxY: { type: Type.NUMBER },
                  boxW: { type: Type.NUMBER },
                  boxH: { type: Type.NUMBER },
                },
                required: ['rawText', 'numericValue', 'unit'],
              },
            },
            detectedGrids: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  axis: { type: Type.STRING },
                  boxX: { type: Type.NUMBER },
                  boxY: { type: Type.NUMBER },
                  boxW: { type: Type.NUMBER },
                  boxH: { type: Type.NUMBER },
                },
                required: ['label'],
              },
            },
            detectedLevels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  elevationText: { type: Type.STRING },
                  datum: { type: Type.STRING },
                  boxX: { type: Type.NUMBER },
                  boxY: { type: Type.NUMBER },
                  boxW: { type: Type.NUMBER },
                  boxH: { type: Type.NUMBER },
                },
                required: ['name', 'elevationText'],
              },
            },
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  mark: { type: Type.STRING },
                  type: { type: Type.STRING },
                  category: { type: Type.STRING },
                  name: { type: Type.STRING },
                  length: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  depth: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  thickness: { type: Type.NUMBER },
                  count: { type: Type.INTEGER },
                  location: { type: Type.STRING },
                  gridLocation: { type: Type.STRING },
                  material: { type: Type.STRING },
                  grade: { type: Type.STRING },
                  reinforcementDetail: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                  sourceLocation: { type: Type.STRING },
                  boxX: { type: Type.NUMBER },
                  boxY: { type: Type.NUMBER },
                  boxW: { type: Type.NUMBER },
                  boxH: { type: Type.NUMBER },
                  notes: { type: Type.STRING },
                },
                required: ['id', 'type', 'count'],
              },
            },
            openItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  category: { type: Type.STRING },
                  problem: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  requiredInformation: { type: Type.STRING },
                  suggestedAction: { type: Type.STRING },
                  location: { type: Type.STRING },
                  boxX: { type: Type.NUMBER },
                  boxY: { type: Type.NUMBER },
                  boxW: { type: Type.NUMBER },
                  boxH: { type: Type.NUMBER },
                },
                required: ['id', 'category', 'problem', 'requiredInformation'],
              },
            },
            detectedSchedules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scheduleTitle: { type: Type.STRING },
                  scheduleType: { type: Type.STRING },
                  rowsCount: { type: Type.INTEGER },
                  notes: { type: Type.STRING },
                  boxX: { type: Type.NUMBER },
                  boxY: { type: Type.NUMBER },
                  boxW: { type: Type.NUMBER },
                  boxH: { type: Type.NUMBER },
                },
              },
            },
          },
          required: ['elements', 'openItems', 'summary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Drawing analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze drawing with AI engine.',
    });
  }
});

// Cross-Check / Conflict Detection API
app.post('/api/cross-check', async (req, res) => {
  try {
    const { sourceA, sourceB, comparisonContext } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const ai = getGenAI();
    const prompt = `Compare these two construction documents/specifications and identify any structural, geometric, or dimensional conflicts.
Context: ${comparisonContext || 'General cross-discipline coordination'}

Source A:
${JSON.stringify(sourceA, null, 2)}

Source B:
${JSON.stringify(sourceB, null, 2)}

List every conflict clearly. Under no circumstances choose one silently. Output structured conflict objects.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conflictsFound: { type: Type.BOOLEAN },
            summary: { type: Type.STRING },
            conflicts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  elementId: { type: Type.STRING },
                  category: { type: Type.STRING },
                  sourceAValue: { type: Type.STRING },
                  sourceBValue: { type: Type.STRING },
                  discrepancyDescription: { type: Type.STRING },
                  recommendedOptions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['elementId', 'sourceAValue', 'sourceBValue', 'discrepancyDescription'],
              },
            },
          },
          required: ['conflictsFound', 'conflicts', 'summary'],
        },
      },
    });

    res.json({ success: true, data: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    console.error('Cross-check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rate Analysis AI Assistant
app.post('/api/suggest-rate', async (req, res) => {
  try {
    const { itemDescription, unit, location, currency } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const ai = getGenAI();
    const prompt = `Provide an itemized tender rate breakdown for a civil/structural contractor:
Item: "${itemDescription}"
Unit: "${unit}"
Location/Market: "${location || 'Gulf / International Standard'}"
Currency: "${currency || 'USD'}"

Break down:
- Material unit cost
- Labor unit cost
- Plant & Equipment unit cost
- Subcontractor component
- Waste allowance percentage (typically 3-5%)
- Overhead percentage (typically 8-12%)
- Profit margin percentage (typically 8-15%)
- Total recommended unit rate`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemDescription: { type: Type.STRING },
            unit: { type: Type.STRING },
            currency: { type: Type.STRING },
            materialCost: { type: Type.NUMBER },
            laborCost: { type: Type.NUMBER },
            plantCost: { type: Type.NUMBER },
            subcontractCost: { type: Type.NUMBER },
            wastagePercent: { type: Type.NUMBER },
            overheadPercent: { type: Type.NUMBER },
            profitPercent: { type: Type.NUMBER },
            unitRate: { type: Type.NUMBER },
            basisOfEstimate: { type: Type.STRING },
          },
          required: ['materialCost', 'laborCost', 'plantCost', 'unitRate', 'basisOfEstimate'],
        },
      },
    });

    res.json({ success: true, data: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    console.error('Suggest rate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Project Metadata Extraction from Document / Drawing Title Block
app.post('/api/extract-project-metadata', async (req, res) => {
  try {
    const { documentText, imageBase64, documentName } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const ai = getGenAI();
    const prompt = `You are a Tender Document & Title Block Parser.
Extract project metadata ONLY from the provided text or image of a tender document / title block.
CRITICAL DATA INTEGRITY INSTRUCTION:
- If a field (e.g. client name, consultant, contractor, built-up area, submission deadline) is NOT explicitly mentioned or cannot be determined with confidence, return empty string or null.
- Under NO circumstance invent, fabricate, or assume details not present in the document.
- Provide a confidence score (0.0 to 1.0) for every extracted field.
- Cite the source snippet where the info was found.`;

    const contents: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/png',
          data: cleanBase64,
        },
      });
    }

    if (documentText) {
      contents.push({ text: `Document Text:\n${documentText}` });
    }

    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts: contents },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING },
            projectNumber: { type: Type.STRING },
            location: { type: Type.STRING },
            projectType: { type: Type.STRING },
            clientCompany: { type: Type.STRING },
            clientContact: { type: Type.STRING },
            consultantLead: { type: Type.STRING },
            structuralEngineer: { type: Type.STRING },
            contractorName: { type: Type.STRING },
            contractType: { type: Type.STRING },
            measurementMethodology: { type: Type.STRING },
            tenderReference: { type: Type.STRING },
            tenderDeadline: { type: Type.STRING },
            builtUpAreaM2: { type: Type.NUMBER },
            numberOfFloors: { type: Type.INTEGER },
            overallConfidence: { type: Type.NUMBER },
            extractionSummary: { type: Type.STRING },
          },
          required: ['projectName', 'overallConfidence', 'extractionSummary'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      success: true,
      source: 'AI EXTRACTED',
      status: 'AI EXTRACTED - NOT VERIFIED',
      sourceDocument: documentName || 'Uploaded Document',
      data: parsed,
    });
  } catch (error: any) {
    console.error('Extract project metadata error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`AI BOQ Server running on port ${port}`);
});
