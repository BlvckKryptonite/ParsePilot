import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataPreview from "@/components/data-preview";
import JsonFlattening from "@/components/json-flattening";
import DataCleaning from "@/components/data-cleaning";
import CleaningReport from "@/components/cleaning-report";
import { DataAssistant } from "@/components/data-assistant";
import InsightsDashboard from "@/components/insights-dashboard";
import ExportOptions from "@/components/export-options";
import { FileText, Bot, BarChart3, Settings, FileDown } from "lucide-react";

interface MainTabsProps {
  fileData: any;
  processedData: any;
  cleaningOptions: any;
  onDataUpdated: (data: any) => void;
  onCleaningOptionsChanged: (options: any) => void;
}

export function MainTabs({ fileData, processedData, cleaningOptions, onDataUpdated, onCleaningOptionsChanged }: MainTabsProps) {
  const [activeTab, setActiveTab] = useState("preview");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="preview" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Preview
        </TabsTrigger>
        <TabsTrigger value="assistant" className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          AI Assistant
        </TabsTrigger>
        <TabsTrigger value="insights" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Insights
        </TabsTrigger>
        <TabsTrigger value="cleaning" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Cleaning
        </TabsTrigger>
        <TabsTrigger value="export" className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Export
        </TabsTrigger>
      </TabsList>

      <TabsContent value="preview" className="space-y-6 mt-6">
        <DataPreview 
          fileData={fileData} 
          processedData={processedData}
          onDataUpdated={onDataUpdated}
        />
      </TabsContent>

      <TabsContent value="assistant" className="mt-6">
        <DataAssistant 
          fileData={fileData}
          processedData={processedData}
        />
      </TabsContent>

      <TabsContent value="insights" className="mt-6">
        <InsightsDashboard processedData={processedData} />
      </TabsContent>

      <TabsContent value="cleaning" className="space-y-6 mt-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <JsonFlattening 
            fileData={fileData}
            processedData={processedData}
            onDataUpdated={onDataUpdated}
          />
          <DataCleaning 
            fileData={fileData}
            processedData={processedData}
            cleaningOptions={cleaningOptions}
            onDataUpdated={onDataUpdated}
            onCleaningOptionsChanged={onCleaningOptionsChanged}
          />
        </div>
        {/* Cleaning Report */}
        {processedData.cleaningReport && (
          <CleaningReport report={processedData.cleaningReport} />
        )}
      </TabsContent>

      <TabsContent value="export" className="mt-6">
        <ExportOptions fileData={fileData} />
      </TabsContent>
    </Tabs>
  );
}