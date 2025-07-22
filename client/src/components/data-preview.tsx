import { useState } from "react";
import { RefreshCw, ArrowUpDown, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface DataPreviewProps {
  fileData: {
    id: number;
    originalName: string;
    rows: number;
    columns: number;
    jsonColumns: string[];
  };
  processedData: {
    preview: any[];
    stats: {
      totalRows: number;
      totalColumns: number;
    };
  };
  onDataUpdated: (data: any) => void;
}

export default function DataPreview({ fileData, processedData }: DataPreviewProps) {
  const [showRows, setShowRows] = useState("20");
  const [currentPage, setCurrentPage] = useState(1);

  const displayedRows = processedData.preview.slice(0, parseInt(showRows));
  const totalPages = Math.ceil(fileData.rows / parseInt(showRows));

  const getColumnHeader = (columnName: string) => {
    const isJsonColumn = fileData.jsonColumns.includes(columnName);
    
    return (
      <th
        key={columnName}
        className={`px-4 py-3 text-left font-medium text-gray-700 ${
          isJsonColumn ? 'bg-amber-50' : ''
        }`}
      >
        <div className="flex items-center space-x-2">
          <span>{columnName}</span>
          {isJsonColumn && (
            <TriangleAlert className="text-warning" size={12} />
          )}
          <ArrowUpDown className="text-gray-400" size={12} />
        </div>
      </th>
    );
  };

  const getCellContent = (value: any, columnName: string) => {
    const isJsonColumn = fileData.jsonColumns.includes(columnName);
    
    if (value === null || value === undefined) {
      return <span className="text-gray-500 italic">missing</span>;
    }

    if (isJsonColumn) {
      return (
        <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
          {typeof value === 'string' ? value : JSON.stringify(value)}
        </span>
      );
    }

    // Handle status-like columns with badges
    if (columnName.toLowerCase().includes('status')) {
      const isActive = value.toString().toLowerCase() === 'active';
      return (
        <Badge variant={isActive ? "default" : "destructive"} className="text-xs">
          {value}
        </Badge>
      );
    }

    return <span className="text-gray-900">{value}</span>;
  };

  if (!displayedRows.length) {
    return null;
  }

  const columns = Object.keys(displayedRows[0]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Data Preview</h2>
            <p className="text-sm text-gray-500">
              {fileData.originalName} • {fileData.rows.toLocaleString()} rows • {fileData.columns} columns
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm">
              <RefreshCw size={16} />
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <Select value={showRows} onValueChange={setShowRows}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">First 20 rows</SelectItem>
                  <SelectItem value="50">First 50 rows</SelectItem>
                  <SelectItem value="100">First 100 rows</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map(getColumnHeader)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayedRows.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={`${index}-${column}`}
                    className={`px-4 py-3 ${
                      fileData.jsonColumns.includes(column) ? 'bg-amber-50' : ''
                    }`}
                  >
                    {getCellContent(row[column], column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing 1-{Math.min(parseInt(showRows), fileData.rows)} of {fileData.rows.toLocaleString()} rows
          </span>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <span>Page {currentPage} of {totalPages}</span>
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
