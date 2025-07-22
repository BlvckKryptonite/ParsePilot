import { CheckCircle, Info, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface CleaningReportProps {
  report: {
    summary: {
      original_rows: number;
      original_columns: number;
      final_rows: number;
      final_columns: number;
    };
    operations_performed: string[];
    column_changes: Record<string, string>;
    missing_data_report: {
      rows_removed?: number;
      cells_filled?: number;
      fill_methods_used?: Record<string, string>;
    };
    string_cleaning_report: {
      fields_cleaned?: number;
      operations_applied?: string[];
    };
    filtering_report: {
      rows_filtered?: number;
    };
    readable_summary: string[];
  };
}

export default function CleaningReport({ report }: CleaningReportProps) {
  const { toast } = useToast();

  const downloadReport = () => {
    const reportText = [
      "# Data Cleaning Report",
      `Generated on: ${new Date().toLocaleString()}`,
      "",
      "## Summary",
      ...report.readable_summary,
      "",
      "## Detailed Results",
      `Original data: ${report.summary.original_rows} rows × ${report.summary.original_columns} columns`,
      `Final data: ${report.summary.final_rows} rows × ${report.summary.final_columns} columns`,
      "",
      "## Operations Applied",
      ...report.operations_performed.map(op => `- ${op.replace('_', ' ')}`),
      "",
    ];

    if (Object.keys(report.column_changes).length > 0) {
      reportText.push("## Column Name Changes");
      Object.entries(report.column_changes).forEach(([old_name, new_name]) => {
        reportText.push(`- "${old_name}" → "${new_name}"`);
      });
      reportText.push("");
    }

    if (report.missing_data_report.fill_methods_used) {
      reportText.push("## Missing Data Fill Methods");
      Object.entries(report.missing_data_report.fill_methods_used).forEach(([column, method]) => {
        reportText.push(`- ${column}: ${method}`);
      });
      reportText.push("");
    }

    const blob = new Blob([reportText.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaning_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report downloaded",
      description: "Your cleaning report has been saved as a text file.",
    });
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaning_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Report downloaded",
      description: "Your cleaning report has been saved as a JSON file.",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Cleaning Report</h2>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={downloadReport}>
              <FileText className="w-4 h-4 mr-2" />
              Download TXT
            </Button>
            <Button variant="outline" size="sm" onClick={downloadJSON}>
              <Download className="w-4 h-4 mr-2" />
              Download JSON
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm text-blue-600 font-medium">Original</div>
            <div className="text-lg font-semibold text-blue-900">
              {report.summary.original_rows.toLocaleString()} rows
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-sm text-green-600 font-medium">Final</div>
            <div className="text-lg font-semibold text-green-900">
              {report.summary.final_rows.toLocaleString()} rows
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="text-sm text-purple-600 font-medium">Columns</div>
            <div className="text-lg font-semibold text-purple-900">
              {report.summary.original_columns} → {report.summary.final_columns}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-sm text-orange-600 font-medium">Operations</div>
            <div className="text-lg font-semibold text-orange-900">
              {report.operations_performed.length}
            </div>
          </div>
        </div>

        {/* Operations Applied */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Operations Applied</h3>
          <div className="flex flex-wrap gap-2">
            {report.operations_performed.map((operation, index) => (
              <Badge key={index} variant="secondary">
                {operation.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Summary</h3>
          <div className="space-y-2">
            {report.readable_summary.map((line, index) => (
              <div key={index} className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{line}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Results */}
        {(report.missing_data_report.cells_filled || report.missing_data_report.rows_removed || 
          report.string_cleaning_report.fields_cleaned || report.filtering_report.rows_filtered) && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Detailed Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.missing_data_report.cells_filled && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Missing Values Filled</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {report.missing_data_report.cells_filled.toLocaleString()}
                  </div>
                </div>
              )}
              {report.missing_data_report.rows_removed && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Rows Removed</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {report.missing_data_report.rows_removed.toLocaleString()}
                  </div>
                </div>
              )}
              {report.string_cleaning_report.fields_cleaned && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Fields Cleaned</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {report.string_cleaning_report.fields_cleaned.toLocaleString()}
                  </div>
                </div>
              )}
              {report.filtering_report.rows_filtered && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Rows Filtered</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {report.filtering_report.rows_filtered.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Column Changes */}
        {Object.keys(report.column_changes).length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Column Name Changes</h3>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              <div className="space-y-1 text-sm">
                {Object.entries(report.column_changes).map(([oldName, newName], index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-600">"{oldName}"</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-900 font-medium">"{newName}"</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}