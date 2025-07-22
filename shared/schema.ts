import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const csvFiles = pgTable("csv_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  size: integer("size").notNull(),
  rows: integer("rows").notNull(),
  columns: integer("columns").notNull(),
  jsonColumns: text("json_columns").array().default([]),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const processedData = pgTable("processed_data", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").references(() => csvFiles.id).notNull(),
  originalData: jsonb("original_data").notNull(),
  processedData: jsonb("processed_data"),
  cleaningOptions: jsonb("cleaning_options"),
  jsonExtractionConfig: jsonb("json_extraction_config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCsvFileSchema = createInsertSchema(csvFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertProcessedDataSchema = createInsertSchema(processedData).omit({
  id: true,
  createdAt: true,
});

export type CsvFile = typeof csvFiles.$inferSelect;
export type InsertCsvFile = z.infer<typeof insertCsvFileSchema>;
export type ProcessedData = typeof processedData.$inferSelect;
export type InsertProcessedData = z.infer<typeof insertProcessedDataSchema>;

export const cleaningOptionsSchema = z.object({
  normalizeColumns: z.object({
    snakeCase: z.boolean().default(true),
    removeSpecialChars: z.boolean().default(true),
    lowercase: z.boolean().default(false),
    trimWhitespace: z.boolean().default(true),
  }).default({
    snakeCase: true,
    removeSpecialChars: true,
    lowercase: false,
    trimWhitespace: true,
  }),
  missingData: z.object({
    strategy: z.enum(['fill', 'remove', 'remove_specific', 'smart_fill', 'keep']).default('fill'),
    fillValue: z.string().default('N/A'),
    fillMethod: z.enum(['custom', 'zero', 'mean', 'median', 'mode']).default('custom'),
    specificColumns: z.array(z.string()).default([]),
  }).default({
    strategy: 'fill',
    fillValue: 'N/A',
    fillMethod: 'custom',
    specificColumns: [],
  }),
  stringCleaning: z.object({
    enabled: z.boolean().default(false),
    trimWhitespace: z.boolean().default(true),
    lowercase: z.boolean().default(false),
    removePunctuation: z.boolean().default(false),
    specificColumns: z.array(z.string()).default([]),
  }).default({
    enabled: false,
    trimWhitespace: true,
    lowercase: false,
    removePunctuation: false,
    specificColumns: [],
  }),
  filtering: z.object({
    removeEmptyRows: z.boolean().default(false),
    columnFilter: z.object({
      enabled: z.boolean().default(false),
      column: z.string().optional(),
      operator: z.enum(['equals', 'contains', 'not_equal', 'greater_than', 'less_than', 'range']).default('equals'),
      value: z.string().optional(),
      minValue: z.string().optional(),
      maxValue: z.string().optional(),
    }).default({
      enabled: false,
      operator: 'equals',
    }),
    multipleFilters: z.array(z.object({
      enabled: z.boolean().default(false),
      column: z.string(),
      operator: z.enum(['equals', 'contains', 'not_equal', 'greater_than', 'less_than']),
      value: z.string(),
    })).default([]),
  }).default({
    removeEmptyRows: false,
    columnFilter: {
      enabled: false,
      operator: 'equals',
    },
    multipleFilters: [],
  }),
  generateReport: z.boolean().default(true),
});

export const jsonExtractionConfigSchema = z.object({
  columns: z.record(z.object({
    enabled: z.boolean(),
    fields: z.record(z.boolean()),
  })),
});

export type CleaningOptions = z.infer<typeof cleaningOptionsSchema>;
export type JsonExtractionConfig = z.infer<typeof jsonExtractionConfigSchema>;
