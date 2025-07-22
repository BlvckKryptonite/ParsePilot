import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { insertCsvFileSchema, cleaningOptionsSchema, jsonExtractionConfigSchema } from "@shared/schema";
import { z } from "zod";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Upload CSV file
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
        return res.status(400).json({ error: "Only CSV files are allowed" });
      }

      // Process CSV file with Python script
      const pythonResult = await processCsvWithPython(req.file.path, 'analyze');
      
      if (!pythonResult.success) {
        return res.status(400).json({ error: pythonResult.error });
      }

      const csvFile = await storage.createCsvFile({
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        rows: pythonResult.data.rows,
        columns: pythonResult.data.columns,
        jsonColumns: pythonResult.data.jsonColumns || [],
      });

      // Store the original data
      await storage.createProcessedData({
        fileId: csvFile.id,
        originalData: pythonResult.data.preview,
        processedData: null,
        cleaningOptions: null,
        jsonExtractionConfig: null,
      });

      res.json({
        file: csvFile,
        preview: pythonResult.data.preview,
        stats: pythonResult.data.stats,
        jsonColumns: pythonResult.data.jsonColumns,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to process file" });
    }
  });

  // Get file data
  app.get("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getCsvFile(fileId);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const processedData = await storage.getProcessedData(fileId);
      res.json({ file, processedData });
    } catch (error) {
      console.error("Get file error:", error);
      res.status(500).json({ error: "Failed to get file" });
    }
  });

  // Process JSON flattening
  app.post("/api/files/:id/flatten", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const config = jsonExtractionConfigSchema.parse(req.body);

      const file = await storage.getCsvFile(fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const processedData = await storage.getProcessedData(fileId);
      if (!processedData) {
        return res.status(404).json({ error: "No data found for file" });
      }

      // Process with Python script
      const filePath = path.join('uploads', file.filename);
      const pythonResult = await processCsvWithPython(filePath, 'flatten', { config });

      if (!pythonResult.success) {
        return res.status(400).json({ error: pythonResult.error });
      }

      // Update processed data
      const updated = await storage.updateProcessedData(processedData.id, {
        processedData: pythonResult.data.processedData,
        jsonExtractionConfig: config,
      });

      res.json({
        processedData: updated,
        preview: pythonResult.data.preview,
        stats: pythonResult.data.stats,
      });
    } catch (error) {
      console.error("Flatten error:", error);
      res.status(500).json({ error: "Failed to flatten JSON fields" });
    }
  });

  // Apply cleaning options
  app.post("/api/files/:id/clean", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const options = cleaningOptionsSchema.parse(req.body.cleaningOptions || req.body);

      const file = await storage.getCsvFile(fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const processedData = await storage.getProcessedData(fileId);
      if (!processedData) {
        return res.status(404).json({ error: "No data found for file" });
      }

      // Process with Python script
      const filePath = path.join('uploads', file.filename);
      const pythonResult = await processCsvWithPython(filePath, 'clean', { 
        cleaningOptions: options,
        jsonConfig: processedData.jsonExtractionConfig,
      });

      if (!pythonResult.success) {
        return res.status(400).json({ error: pythonResult.error });
      }

      // Update processed data
      const updated = await storage.updateProcessedData(processedData.id, {
        processedData: pythonResult.data.processedData,
        cleaningOptions: options,
      });

      res.json({
        processedData: updated,
        preview: pythonResult.data.preview,
        stats: pythonResult.data.stats,
      });
    } catch (error) {
      console.error("Clean error:", error);
      res.status(500).json({ error: "Failed to clean data" });
    }
  });

  // Export data
  app.post("/api/files/:id/export", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const { format = 'csv', includeHeaders = true, includeMetadata = false, cleaningOptions } = req.body;

      const file = await storage.getCsvFile(fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const processedData = await storage.getProcessedData(fileId);
      if (!processedData) {
        return res.status(404).json({ error: "No data found for file" });
      }

      // Export with Python script - use request cleaning options or fallback to stored ones
      const filePath = path.join('uploads', file.filename);
      const exportOptions = {
        format,
        includeHeaders,
        includeMetadata,
        cleaningOptions: cleaningOptions || processedData.cleaningOptions,
        jsonConfig: processedData.jsonExtractionConfig,
      };
      
      // Debug removed

      const pythonResult = await processCsvWithPython(filePath, 'export', exportOptions);

      if (!pythonResult.success) {
        return res.status(400).json({ error: pythonResult.error });
      }

      const exportFileName = `${file.originalName.replace('.csv', '')}_cleaned.${format}`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${exportFileName}"`);
      res.setHeader('Content-Type', getContentType(format));
      res.send(pythonResult.data.exportData);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Chat with data assistant
  app.post("/api/files/:id/chat", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const { message, context } = req.body;

      const file = await storage.getCsvFile(fileId);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      const processedData = await storage.getProcessedData(fileId);
      if (!processedData) {
        return res.status(404).json({ error: "No data found for file" });
      }

      let response: string;
      
      if (process.env.OPENAI_API_KEY) {
        // Import OpenAI client
        const { analyzeDataWithAI } = await import('./openai-client');

        // Enhance context with processed data
        const enhancedContext = {
          ...context,
          processedStats: processedData.stats,
          jsonColumns: file.jsonColumns,
          missingDataPercentage: context.stats?.missingDataPercentage
        };

        response = await analyzeDataWithAI(message, enhancedContext);
      } else {
        // Use demo responses when API key is not configured
        const { getDemoResponse } = await import('./demo-responses');
        const demoResponse = getDemoResponse(message);
        
        if (demoResponse) {
          response = demoResponse;
        } else {
          response = `I'd love to help analyze your data! However, the OpenAI API key hasn't been configured yet. 

For now, try asking me about:
• "What are the main patterns in my data?"
• "What cleaning steps do you recommend?"
• "Can you summarize the key statistics?"

Once the API key is configured, I'll be able to provide detailed insights about any aspect of your ${context.fileName} dataset with ${context.rows} rows and ${context.columns} columns.`;
        }
      }
      
      res.json({ response });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        error: "Failed to process chat request",
        details: error.message 
      });
    }
  });

  // Get all files
  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.getAllCsvFiles();
      res.json(files);
    } catch (error) {
      console.error("Get files error:", error);
      res.status(500).json({ error: "Failed to get files" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function processCsvWithPython(filePath: string, operation: string, options?: any): Promise<{ success: boolean; data?: any; error?: string }> {
  return new Promise((resolve) => {
    const pythonScript = path.join(import.meta.dirname, 'python', 'simple_csv_processor.py');
    const args = [pythonScript, filePath, operation];
    
    if (options) {
      args.push(JSON.stringify(options));
    }

    const python = spawn('python3', args);
    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve({ success: true, data: result });
        } catch (error) {
          resolve({ success: false, error: 'Failed to parse Python output' });
        }
      } else {
        resolve({ success: false, error: errorOutput || 'Python script failed' });
      }
    });
  });
}

function getContentType(format: string): string {
  switch (format) {
    case 'csv': return 'text/csv';
    case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'json': return 'application/json';
    default: return 'application/octet-stream';
  }
}
