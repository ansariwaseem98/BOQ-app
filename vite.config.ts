import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const DATA_DIR = path.resolve(__dirname, 'data');
const PROJECTS_FILE = path.resolve(DATA_DIR, 'projects.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api')) {
          return next();
        }

        const getBody = async (): Promise<any> => {
          return new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (e) {
                resolve({});
              }
            });
          });
        };

        const sendJson = (statusCode: number, obj: any) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
        };

        if (req.url === '/api/health') {
          return sendJson(200, { status: 'ok', mode: 'vite-dev' });
        }

        // --- Projects API routes ---
        const urlWithoutQuery = req.url.split('?')[0];

        if (urlWithoutQuery === '/api/projects' && req.method === 'GET') {
          const projects = readProjectsFromDisk();
          return sendJson(200, { success: true, projects });
        }

        if (urlWithoutQuery === '/api/projects' && req.method === 'POST') {
          try {
            const body = await getBody();
            const projects = readProjectsFromDisk();
            
            let projectId = body.id;
            if (!projectId) {
              const year = new Date().getFullYear();
              const prefix = `PRJ-${year}-`;
              const currentYearProjects = projects.filter((p: any) => p.id?.startsWith(prefix));
              let maxNum = 0;
              currentYearProjects.forEach((p: any) => {
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
              ...body,
              id: projectId,
              createdAt: body.createdAt || now,
              updatedAt: now,
              status: body.status || 'Active',
            };

            const existingIndex = projects.findIndex((p: any) => p.id === projectId);
            if (existingIndex >= 0) {
              projects[existingIndex] = newProject;
            } else {
              projects.push(newProject);
            }

            writeProjectsToDisk(projects);
            return sendJson(201, { success: true, project: newProject });
          } catch (err: any) {
            return sendJson(500, { success: false, error: err.message });
          }
        }

        const projectItemMatch = urlWithoutQuery.match(/^\/api\/projects\/([^/]+)$/);
        if (projectItemMatch) {
          const projectId = decodeURIComponent(projectItemMatch[1]);
          const projects = readProjectsFromDisk();
          const existingIndex = projects.findIndex((p: any) => p.id === projectId);

          if (req.method === 'GET') {
            if (existingIndex < 0) {
              return sendJson(404, { success: false, error: 'Project not found' });
            }
            return sendJson(200, { success: true, project: projects[existingIndex] });
          }

          if (req.method === 'PUT') {
            try {
              const body = await getBody();
              if (existingIndex < 0) {
                return sendJson(404, { success: false, error: 'Project not found' });
              }
              const updatedProject = {
                ...projects[existingIndex],
                ...body,
                id: projectId,
                updatedAt: new Date().toISOString(),
              };
              projects[existingIndex] = updatedProject;
              writeProjectsToDisk(projects);
              return sendJson(200, { success: true, project: updatedProject });
            } catch (err: any) {
              return sendJson(500, { success: false, error: err.message });
            }
          }

          if (req.method === 'DELETE') {
            const filtered = projects.filter((p: any) => p.id !== projectId);
            writeProjectsToDisk(filtered);
            return sendJson(200, { success: true, deleted: projectId });
          }
        }

        if (req.url === '/api/analyze-drawing' && req.method === 'POST') {
          try {
            const body = await getBody();
            const { drawingMeta, imageBase64, textContent, discipline, level } = body;

            if (!process.env.GEMINI_API_KEY) {
              return sendJson(500, {
                success: false,
                error: 'GEMINI_API_KEY is not set in environment.',
              });
            }

            const ai = new GoogleGenAI({
              apiKey: process.env.GEMINI_API_KEY,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
            });

            const prompt = `You are a Senior Quantity Surveying & Structural Engineering AI Assistant.
Analyze this construction drawing / schedule / sketch for project discipline: ${discipline || 'General Structural/Architectural'}, Level: ${level || 'Typical'}.

Drawing details:
Number: ${drawingMeta?.drawingNumber || 'N/A'}
Title: ${drawingMeta?.title || 'N/A'}
Revision: ${drawingMeta?.revision || 'Rev 01'}

CORE PRINCIPLES:
1. KNOWN → CALCULATE / EXTRACT EXACT DIMENSIONS
2. UNCLEAR → FLAG (create an open item)
3. MISSING → ASK USER (create an open item)
4. CONFLICTING → SHOW CONFLICT (create an open item)
5. NEVER GUESS SILENTLY: If a slab thickness, beam depth, column size, or bar spacing is not explicitly specified or readable, DO NOT invent a number. Mark it as missing/unclear and provide an Open Item.

Extract structured engineering elements and open items. Return JSON.`;

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
                    detectedScale: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    elements: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          type: { type: Type.STRING },
                          category: { type: Type.STRING },
                          name: { type: Type.STRING },
                          length: { type: Type.NUMBER },
                          width: { type: Type.NUMBER },
                          depth: { type: Type.NUMBER },
                          height: { type: Type.NUMBER },
                          count: { type: Type.INTEGER },
                          location: { type: Type.STRING },
                          material: { type: Type.STRING },
                          grade: { type: Type.STRING },
                          reinforcementDetail: { type: Type.STRING },
                          confidence: { type: Type.NUMBER },
                          sourceLocation: { type: Type.STRING },
                          boxX: { type: Type.NUMBER },
                          boxY: { type: Type.NUMBER },
                          boxW: { type: Type.NUMBER },
                          boxH: { type: Type.NUMBER },
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
                        required: ['id', 'category', 'title', 'description', 'requiredInformation'],
                      },
                    },
                  },
                  required: ['elements', 'openItems', 'summary'],
                },
              },
            });

            return sendJson(200, { success: true, data: JSON.parse(response.text || '{}') });
          } catch (err: any) {
            console.error('Vite dev api error:', err);
            return sendJson(500, { success: false, error: err.message });
          }
        }

        if (req.url === '/api/cross-check' && req.method === 'POST') {
          try {
            const body = await getBody();
            const { sourceA, sourceB, comparisonContext } = body;
            const ai = new GoogleGenAI({
              apiKey: process.env.GEMINI_API_KEY || '',
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
            });
            const prompt = `Compare these two construction documents/specifications and identify any structural, geometric, or dimensional conflicts.\nContext: ${comparisonContext || 'Cross-discipline'}\nSource A:\n${JSON.stringify(sourceA)}\nSource B:\n${JSON.stringify(sourceB)}`;
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
                          recommendedOptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        required: ['elementId', 'sourceAValue', 'sourceBValue', 'discrepancyDescription'],
                      },
                    },
                  },
                  required: ['conflictsFound', 'conflicts', 'summary'],
                },
              },
            });
            return sendJson(200, { success: true, data: JSON.parse(response.text || '{}') });
          } catch (err: any) {
            return sendJson(500, { success: false, error: err.message });
          }
        }

        if (req.url === '/api/suggest-rate' && req.method === 'POST') {
          try {
            const body = await getBody();
            const { itemDescription, unit, location, currency } = body;
            const ai = new GoogleGenAI({
              apiKey: process.env.GEMINI_API_KEY || '',
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
            });
            const prompt = `Provide tender rate breakdown for:\nItem: "${itemDescription}"\nUnit: "${unit}"\nLocation: "${location}"\nCurrency: "${currency}"`;
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
            return sendJson(200, { success: true, data: JSON.parse(response.text || '{}') });
          } catch (err: any) {
            return sendJson(500, { success: false, error: err.message });
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
