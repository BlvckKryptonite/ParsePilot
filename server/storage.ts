import { 
  csvFiles, 
  processedData, 
  type CsvFile, 
  type InsertCsvFile, 
  type ProcessedData, 
  type InsertProcessedData 
} from "@shared/schema";

export interface IStorage {
  // CSV Files
  createCsvFile(file: InsertCsvFile): Promise<CsvFile>;
  getCsvFile(id: number): Promise<CsvFile | undefined>;
  getAllCsvFiles(): Promise<CsvFile[]>;
  deleteCsvFile(id: number): Promise<void>;

  // Processed Data
  createProcessedData(data: InsertProcessedData): Promise<ProcessedData>;
  getProcessedData(fileId: number): Promise<ProcessedData | undefined>;
  updateProcessedData(id: number, data: Partial<InsertProcessedData>): Promise<ProcessedData | undefined>;
  deleteProcessedData(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private csvFiles: Map<number, CsvFile>;
  private processedData: Map<number, ProcessedData>;
  private currentCsvFileId: number;
  private currentProcessedDataId: number;

  constructor() {
    this.csvFiles = new Map();
    this.processedData = new Map();
    this.currentCsvFileId = 1;
    this.currentProcessedDataId = 1;
  }

  async createCsvFile(insertFile: InsertCsvFile): Promise<CsvFile> {
    const id = this.currentCsvFileId++;
    const file: CsvFile = {
      ...insertFile,
      id,
      uploadedAt: new Date(),
      jsonColumns: insertFile.jsonColumns || [],
    };
    this.csvFiles.set(id, file);
    return file;
  }

  async getCsvFile(id: number): Promise<CsvFile | undefined> {
    return this.csvFiles.get(id);
  }

  async getAllCsvFiles(): Promise<CsvFile[]> {
    return Array.from(this.csvFiles.values());
  }

  async deleteCsvFile(id: number): Promise<void> {
    this.csvFiles.delete(id);
    // Also delete associated processed data
    for (const [key, data] of Array.from(this.processedData.entries())) {
      if (data.fileId === id) {
        this.processedData.delete(key);
      }
    }
  }

  async createProcessedData(insertData: InsertProcessedData): Promise<ProcessedData> {
    const id = this.currentProcessedDataId++;
    const data: ProcessedData = {
      ...insertData,
      id,
      createdAt: new Date(),
      processedData: insertData.processedData || null,
      cleaningOptions: insertData.cleaningOptions || null,
      jsonExtractionConfig: insertData.jsonExtractionConfig || null,
    };
    this.processedData.set(id, data);
    return data;
  }

  async getProcessedData(fileId: number): Promise<ProcessedData | undefined> {
    return Array.from(this.processedData.values()).find(data => data.fileId === fileId);
  }

  async updateProcessedData(id: number, updateData: Partial<InsertProcessedData>): Promise<ProcessedData | undefined> {
    const existing = this.processedData.get(id);
    if (!existing) return undefined;

    const updated: ProcessedData = {
      ...existing,
      ...updateData,
    };
    this.processedData.set(id, updated);
    return updated;
  }

  async deleteProcessedData(id: number): Promise<void> {
    this.processedData.delete(id);
  }
}

export const storage = new MemStorage();
