import { useState } from "react";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface JsonFlatteningProps {
  fileData: {
    id: number;
    jsonColumns: string[];
  };
  processedData: {
    jsonFields?: Record<string, string[]>;
  };
  onDataUpdated: (data: any) => void;
}

export default function JsonFlattening({ fileData, processedData, onDataUpdated }: JsonFlatteningProps) {
  const [config, setConfig] = useState<Record<string, { enabled: boolean; fields: Record<string, boolean> }>>({});
  const { toast } = useToast();

  // Initialize config when jsonFields are available
  useState(() => {
    if (processedData.jsonFields && Object.keys(config).length === 0) {
      const initialConfig: typeof config = {};
      
      Object.entries(processedData.jsonFields).forEach(([column, fields]) => {
        initialConfig[column] = {
          enabled: false,
          fields: Object.fromEntries(fields.map(field => [field, false]))
        };
      });
      
      setConfig(initialConfig);
    }
  });

  const flattenMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/files/${fileData.id}/flatten`, { columns: config });
      return response.json();
    },
    onSuccess: (data) => {
      onDataUpdated({
        preview: data.preview,
        stats: data.stats,
      });
      toast({
        title: "JSON fields flattened",
        description: "Selected JSON fields have been extracted into separate columns.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Flattening failed",
        description: error.message || "Failed to flatten JSON fields. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleColumn = (column: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      [column]: {
        ...prev[column],
        enabled,
        fields: enabled 
          ? Object.fromEntries(Object.keys(prev[column]?.fields || {}).map(field => [field, true]))
          : Object.fromEntries(Object.keys(prev[column]?.fields || {}).map(field => [field, false]))
      }
    }));
  };

  const toggleField = (column: string, field: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      [column]: {
        ...prev[column],
        fields: {
          ...prev[column]?.fields,
          [field]: enabled
        }
      }
    }));
  };

  const selectAllJSON = () => {
    const newConfig = { ...config };
    Object.keys(newConfig).forEach(column => {
      newConfig[column].enabled = true;
      Object.keys(newConfig[column].fields).forEach(field => {
        newConfig[column].fields[field] = true;
      });
    });
    setConfig(newConfig);
  };

  if (!fileData.jsonColumns.length || !processedData.jsonFields) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">JSON Field Extraction</h2>
        <p className="text-sm text-gray-600">Select JSON fields to flatten and extract into separate columns</p>
      </div>
      
      <div className="p-6 space-y-6">
        {Object.entries(processedData.jsonFields).map(([column, fields]) => (
          <div key={column} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">{column}</h3>
              <Switch
                checked={config[column]?.enabled || false}
                onCheckedChange={(enabled) => toggleColumn(column, enabled)}
              />
            </div>
            
            <div className={`space-y-2 ${!config[column]?.enabled ? 'opacity-50' : ''}`}>
              {fields.map((field) => (
                <div key={field} className="flex items-center justify-between text-sm">
                  <span className="font-mono text-gray-700">{column}.{field}</span>
                  <Switch
                    checked={config[column]?.fields[field] || false}
                    onCheckedChange={(enabled) => toggleField(column, field, enabled)}
                    disabled={!config[column]?.enabled}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => flattenMutation.mutate()}
            disabled={flattenMutation.isPending || !Object.values(config).some(c => c.enabled)}
          >
            <Wand2 size={16} className="mr-2" />
            {flattenMutation.isPending ? "Flattening..." : "Flatten Selected Fields"}
          </Button>
          <Button variant="ghost" onClick={selectAllJSON}>
            Select All
          </Button>
        </div>
      </div>
    </div>
  );
}
