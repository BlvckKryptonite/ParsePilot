import { useState } from "react";
import FileUpload from "@/components/file-upload";
import DataPreview from "@/components/data-preview";
import JsonFlattening from "@/components/json-flattening";
import DataCleaning from "@/components/data-cleaning";
import InsightsDashboard from "@/components/insights-dashboard";
import ExportOptions from "@/components/export-options";
import CleaningReport from "@/components/cleaning-report";
import { DataAssistant } from "@/components/data-assistant";
import { MainTabs } from "@/components/main-tabs";
import { ChartLine, HelpCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileData {
  id: number;
  originalName: string;
  rows: number;
  columns: number;
  jsonColumns: string[];
}

interface ProcessedData {
  preview: any[];
  stats: {
    totalRows: number;
    totalColumns: number;
    missingDataPercentage: number;
    columnTypes: {
      text: number;
      numeric: number;
      json: number;
    };
  };
  distributions?: Record<string, { values: string[]; counts: number[] }>;
  jsonFields?: Record<string, string[]>;
  cleaningReport?: {
    summary: {
      original_rows: number;
      original_columns: number;
      final_rows: number;
      final_columns: number;
    };
    operations_performed: string[];
    column_changes: Record<string, string>;
    missing_data_report: any;
    string_cleaning_report: any;
    filtering_report: any;
    readable_summary: string[];
  };
}

export default function Home() {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [cleaningOptions, setCleaningOptions] = useState<any>({
    normalizeColumns: {
      snakeCase: true,
      removeSpecialChars: true,
      lowercase: false,
      trimWhitespace: true,
    },
    missingData: {
      strategy: 'fill',
      fillValue: 'N/A',
      fillMethod: 'custom',
      specificColumns: [],
    },
    stringCleaning: {
      enabled: false,
      trimWhitespace: true,
      lowercase: false,
      removePunctuation: false,
      specificColumns: [],
    },
    filtering: {
      removeEmptyRows: false,
      columnFilter: {
        enabled: false,
        column: '',
        operator: 'equals',
        value: '',
        minValue: '',
        maxValue: '',
      },
      multipleFilters: [],
    },
    generateReport: true,
  });

  const handleDeleteFile = () => {
    setFileData(null);
    setProcessedData(null);
    setCleaningOptions({
      normalizeColumns: {
        snakeCase: true,
        removeSpecialChars: true,
        lowercase: false,
        trimWhitespace: true,
      },
      missingData: {
        strategy: 'fill',
        fillValue: 'N/A',
        fillMethod: 'custom',
        specificColumns: [],
      },
      stringCleaning: {
        enabled: false,
        trimWhitespace: true,
        lowercase: false,
        removePunctuation: false,
        specificColumns: [],
      },
      filtering: {
        removeEmptyRows: false,
        columnFilter: {
          enabled: false,
          column: '',
          operator: 'equals',
          value: '',
          minValue: '',
          maxValue: '',
        },
        multipleFilters: [],
      },
      generateReport: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Logo placeholder - replace with your custom logo */}
              {/* <img src="your-logo.png" alt="ParsePilot Logo" className="w-10 h-10" /> */}
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <ChartLine className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">ParsePilot</h1>
                <p className="text-xs text-gray-500">Clean, Convert & Analyze Messy CSVs</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <HelpCircle size={18} />
              </Button>
              <Button disabled={!fileData}>
                <Download size={16} className="mr-2" />
                Export Clean Data
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-6xl mx-auto">
          {/* File Upload */}
          <FileUpload 
            onFileUploaded={setFileData} 
            onDataProcessed={setProcessedData}
            onDeleteFile={handleDeleteFile}
            hasFile={!!fileData}
          />

          {/* Main Content with Tabs */}
          {fileData && processedData && (
            <div className="mt-4 sm:mt-6">
              <MainTabs 
                fileData={fileData}
                processedData={processedData}
                cleaningOptions={cleaningOptions}
                onDataUpdated={setProcessedData}
                onCleaningOptionsChanged={setCleaningOptions}
              />
            </div>
          )}
        </div>
      </main>
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="text-center text-xs sm:text-sm text-gray-600">
            <p>Planned, developed and copyrighted by Muma K.</p>
            <div className="mt-2 sm:mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
              <a href="#" className="hover:text-gray-900 transition-colors">Documentation</a>
              <a href="#" className="hover:text-gray-900 transition-colors">API Reference</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Support</a>
              <a href="#" className="hover:text-gray-900 transition-colors">CLI Tool</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
