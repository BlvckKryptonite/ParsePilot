import { useState } from "react";
import { Fan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CleaningOptions } from "@shared/schema";

interface DataCleaningProps {
  fileData: {
    id: number;
  };
  processedData: {
    preview: any[];
  };
  cleaningOptions: CleaningOptions;
  onDataUpdated: (data: any) => void;
  onCleaningOptionsChanged: (options: CleaningOptions) => void;
}

export default function DataCleaning({ fileData, processedData, cleaningOptions, onDataUpdated, onCleaningOptionsChanged }: DataCleaningProps) {

  const { toast } = useToast();

  const cleanMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/files/${fileData.id}/clean`, cleaningOptions);
      return response.json();
    },
    onSuccess: (data) => {
      onDataUpdated({
        ...processedData,
        preview: data.preview,
        stats: data.stats,
        cleaningReport: data.cleaningReport,
      });
      toast({
        title: "Data cleaned successfully",
        description: "Your cleaning options have been applied to the dataset.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cleaning failed",
        description: error.message || "Failed to clean data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/files/${fileData.id}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'csv',
          includeHeaders: true,
          cleaningOptions,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cleaned_data.csv';
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

  const updateNormalizeOptions = (key: keyof typeof cleaningOptions.normalizeColumns, value: boolean) => {
    onCleaningOptionsChanged({
      ...cleaningOptions,
      normalizeColumns: {
        ...cleaningOptions.normalizeColumns,
        [key]: value,
      },
    });
  };

  const updateMissingDataStrategy = (strategy: 'fill' | 'remove' | 'remove_specific' | 'smart_fill' | 'keep') => {
    onCleaningOptionsChanged({
      ...cleaningOptions,
      missingData: {
        ...cleaningOptions.missingData,
        strategy,
      },
    });
  };

  const updateMissingDataOptions = (key: keyof typeof cleaningOptions.missingData, value: any) => {
    onCleaningOptionsChanged({
      ...cleaningOptions,
      missingData: {
        ...cleaningOptions.missingData,
        [key]: value,
      },
    });
  };

  const updateStringCleaningOptions = (key: keyof typeof cleaningOptions.stringCleaning, value: any) => {
    onCleaningOptionsChanged({
      ...cleaningOptions,
      stringCleaning: {
        ...cleaningOptions.stringCleaning,
        [key]: value,
      },
    });
  };

  const updateFilterOptions = (key: keyof typeof cleaningOptions.filtering, value: any) => {
    onCleaningOptionsChanged({
      ...cleaningOptions,
      filtering: {
        ...cleaningOptions.filtering,
        [key]: value,
      },
    });
  };

  const updateColumnFilter = (key: keyof typeof cleaningOptions.filtering.columnFilter, value: any) => {
    onCleaningOptionsChanged({
      ...cleaningOptions,
      filtering: {
        ...cleaningOptions.filtering,
        columnFilter: {
          ...cleaningOptions.filtering.columnFilter,
          [key]: value,
        },
      },
    });
  };

  const columns = processedData.preview.length > 0 ? Object.keys(processedData.preview[0]) : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Data Cleaning Options</h2>
        <p className="text-sm text-gray-600">Configure how to clean and normalize your data</p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Column Normalization */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Column Name Normalization</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="snake-case"
                checked={cleaningOptions.normalizeColumns.snakeCase}
                onCheckedChange={(checked) => updateNormalizeOptions('snakeCase', checked as boolean)}
              />
              <Label htmlFor="snake-case" className="text-sm text-gray-700">Convert to snake_case</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remove-special"
                checked={cleaningOptions.normalizeColumns.removeSpecialChars}
                onCheckedChange={(checked) => updateNormalizeOptions('removeSpecialChars', checked as boolean)}
              />
              <Label htmlFor="remove-special" className="text-sm text-gray-700">Remove special characters</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lowercase"
                checked={cleaningOptions.normalizeColumns.lowercase}
                onCheckedChange={(checked) => updateNormalizeOptions('lowercase', checked as boolean)}
              />
              <Label htmlFor="lowercase" className="text-sm text-gray-700">Convert to lowercase</Label>
            </div>
          </div>
        </div>
        
        {/* Missing Data Handling */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Missing Data Handling</h3>
          <RadioGroup value={cleaningOptions.missingData.strategy} onValueChange={updateMissingDataStrategy}>
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="fill" id="fill" />
                  <Label htmlFor="fill" className="text-sm text-gray-700">Fill with custom values</Label>
                </div>
                <div className="ml-6 space-y-2">
                  <Input
                    placeholder="e.g., N/A, 0, Unknown"
                    value={cleaningOptions.missingData.fillValue}
                    onChange={(e) => updateMissingDataOptions('fillValue', e.target.value)}
                    disabled={cleaningOptions.missingData.strategy !== 'fill'}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="smart_fill" id="smart_fill" />
                  <Label htmlFor="smart_fill" className="text-sm text-gray-700">Smart fill (mean for numbers, default for text)</Label>
                </div>
                <div className="ml-6">
                  <Select
                    value={cleaningOptions.missingData.fillMethod}
                    onValueChange={(value) => updateMissingDataOptions('fillMethod', value)}
                    disabled={cleaningOptions.missingData.strategy !== 'smart_fill'}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mean">Mean (for numeric columns)</SelectItem>
                      <SelectItem value="median">Median (for numeric columns)</SelectItem>
                      <SelectItem value="mode">Mode (most frequent value)</SelectItem>
                      <SelectItem value="zero">Zero (for numeric columns)</SelectItem>
                      <SelectItem value="custom">Custom value</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remove" id="remove" />
                <Label htmlFor="remove" className="text-sm text-gray-700">Remove rows with any missing data</Label>
              </div>
              
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="remove_specific" id="remove_specific" />
                  <Label htmlFor="remove_specific" className="text-sm text-gray-700">Remove rows missing data in specific columns</Label>
                </div>
                <div className="ml-6">
                  <Select
                    value={cleaningOptions.missingData.specificColumns[0] || ''}
                    onValueChange={(value) => updateMissingDataOptions('specificColumns', [value])}
                    disabled={cleaningOptions.missingData.strategy !== 'remove_specific'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select critical column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map((column) => (
                        <SelectItem key={column} value={column}>{column}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="keep" id="keep" />
                <Label htmlFor="keep" className="text-sm text-gray-700">Keep as-is</Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* String Cleaning */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">String Field Cleaning</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enable-string-cleaning"
                checked={cleaningOptions.stringCleaning.enabled}
                onCheckedChange={(checked) => updateStringCleaningOptions('enabled', checked)}
              />
              <Label htmlFor="enable-string-cleaning" className="text-sm text-gray-700">Enable string cleaning</Label>
            </div>
            
            <div className="ml-6 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trim-whitespace"
                  checked={cleaningOptions.stringCleaning.trimWhitespace}
                  onCheckedChange={(checked) => updateStringCleaningOptions('trimWhitespace', checked)}
                  disabled={!cleaningOptions.stringCleaning.enabled}
                />
                <Label htmlFor="trim-whitespace" className="text-sm text-gray-600">Trim whitespace</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="string-lowercase"
                  checked={cleaningOptions.stringCleaning.lowercase}
                  onCheckedChange={(checked) => updateStringCleaningOptions('lowercase', checked)}
                  disabled={!cleaningOptions.stringCleaning.enabled}
                />
                <Label htmlFor="string-lowercase" className="text-sm text-gray-600">Convert to lowercase</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-punctuation"
                  checked={cleaningOptions.stringCleaning.removePunctuation}
                  onCheckedChange={(checked) => updateStringCleaningOptions('removePunctuation', checked)}
                  disabled={!cleaningOptions.stringCleaning.enabled}
                />
                <Label htmlFor="remove-punctuation" className="text-sm text-gray-600">Remove trailing punctuation</Label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Row Filtering */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Row Filtering</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remove-empty"
                checked={cleaningOptions.filtering.removeEmptyRows}
                onCheckedChange={(checked) => updateFilterOptions('removeEmptyRows', checked)}
              />
              <Label htmlFor="remove-empty" className="text-sm text-gray-700">Remove completely empty rows</Label>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-3">
                <Checkbox
                  id="column-filter"
                  checked={cleaningOptions.filtering.columnFilter.enabled}
                  onCheckedChange={(checked) => updateColumnFilter('enabled', checked)}
                />
                <Label htmlFor="column-filter" className="text-sm text-gray-700">Filter by column value</Label>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-sm">
                <Select
                  value={cleaningOptions.filtering.columnFilter.column}
                  onValueChange={(value) => updateColumnFilter('column', value)}
                  disabled={!cleaningOptions.filtering.columnFilter.enabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column) => (
                      <SelectItem key={column} value={column}>{column}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={cleaningOptions.filtering.columnFilter.operator}
                  onValueChange={(value: 'equals' | 'contains' | 'not_equal') => updateColumnFilter('operator', value)}
                  disabled={!cleaningOptions.filtering.columnFilter.enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">equals</SelectItem>
                    <SelectItem value="contains">contains</SelectItem>
                    <SelectItem value="not_equal">not equal</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="value"
                  value={cleaningOptions.filtering.columnFilter.value || ''}
                  onChange={(e) => updateColumnFilter('value', e.target.value)}
                  disabled={!cleaningOptions.filtering.columnFilter.enabled}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button 
            onClick={() => cleanMutation.mutate()}
            disabled={cleanMutation.isPending}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Fan size={16} className="mr-2" />
            {cleanMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          
          <Button 
            onClick={() => downloadMutation.mutate()}
            disabled={downloadMutation.isPending}
            variant="outline"
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {downloadMutation.isPending ? "Downloading..." : "Download Clean Data"}
          </Button>
        </div>
      </div>
    </div>
  );
}
