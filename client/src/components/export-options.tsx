import { useState } from "react";
import { FileText, FileSpreadsheet, FileCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface ExportOptionsProps {
  fileData: {
    id: number;
    originalName: string;
  } | null;
}

export default function ExportOptions({ fileData }: ExportOptionsProps) {
  const [exportSettings, setExportSettings] = useState({
    includeHeaders: true,
    includeMetadata: false,
  });

  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async (format: string) => {
      if (!fileData) throw new Error("No file selected");
      
      const response = await fetch(`/api/files/${fileData.id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          includeHeaders: exportSettings.includeHeaders,
          includeMetadata: exportSettings.includeMetadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileData.originalName.replace('.csv', '')}_cleaned.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export successful",
        description: "Your cleaned data has been downloaded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExport = (format: string) => {
    exportMutation.mutate(format);
  };

  const updateSetting = (key: keyof typeof exportSettings, value: boolean) => {
    setExportSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Export Options</h2>
      </div>
      
      <div className="p-6 space-y-4">
        <Button
          onClick={() => handleExport('csv')}
          disabled={!fileData || exportMutation.isPending}
          className="w-full bg-primary hover:bg-primary/90"
        >
          <FileText size={16} className="mr-2" />
          Export as CSV
        </Button>
        
        <Button
          onClick={() => handleExport('xlsx')}
          disabled={!fileData || exportMutation.isPending}
          className="w-full bg-success hover:bg-success/90"
        >
          <FileSpreadsheet size={16} className="mr-2" />
          Export as Excel
        </Button>
        
        <Button
          onClick={() => handleExport('json')}
          disabled={!fileData || exportMutation.isPending}
          variant="secondary"
          className="w-full"
        >
          <FileCode size={16} className="mr-2" />
          Export as JSON
        </Button>
        
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">Export Settings</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-headers"
                checked={exportSettings.includeHeaders}
                onCheckedChange={(checked) => updateSetting('includeHeaders', checked as boolean)}
              />
              <Label htmlFor="include-headers" className="text-sm">Include headers</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-metadata"
                checked={exportSettings.includeMetadata}
                onCheckedChange={(checked) => updateSetting('includeMetadata', checked as boolean)}
              />
              <Label htmlFor="include-metadata" className="text-sm">Include metadata</Label>
            </div>
          </div>
        </div>

        {exportMutation.isPending && (
          <div className="flex items-center justify-center py-2">
            <Download className="animate-pulse mr-2" size={16} />
            <span className="text-sm text-gray-600">Preparing download...</span>
          </div>
        )}
      </div>
    </div>
  );
}
