export interface CsvData {
  headers: string[];
  rows: any[][];
  stats: {
    totalRows: number;
    totalColumns: number;
    missingValues: number;
    jsonColumns: string[];
  };
}

export interface JsonColumn {
  name: string;
  sampleData: any[];
  detectedFields: string[];
}

export class CsvProcessor {
  static detectJsonColumns(data: CsvData): JsonColumn[] {
    const jsonColumns: JsonColumn[] = [];
    
    data.headers.forEach((header, index) => {
      const columnData = data.rows.map(row => row[index]);
      const sampleValues = columnData.slice(0, 100);
      
      let jsonCount = 0;
      const detectedFields = new Set<string>();
      
      sampleValues.forEach(value => {
        if (typeof value === 'string' && value.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'object' && parsed !== null) {
              jsonCount++;
              Object.keys(parsed).forEach(key => detectedFields.add(key));
            }
          } catch {
            // Not valid JSON
          }
        }
      });
      
      // If more than 10% of values are valid JSON, consider it a JSON column
      if (jsonCount > sampleValues.length * 0.1) {
        jsonColumns.push({
          name: header,
          sampleData: sampleValues.filter(v => {
            try {
              return typeof JSON.parse(v) === 'object';
            } catch {
              return false;
            }
          }).slice(0, 5),
          detectedFields: Array.from(detectedFields),
        });
      }
    });
    
    return jsonColumns;
  }
  
  static normalizeCsvData(data: CsvData): CsvData {
    const normalizedHeaders = data.headers.map(header => 
      header
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
    );
    
    return {
      ...data,
      headers: normalizedHeaders,
    };
  }
  
  static fillMissingValues(data: CsvData, fillValue: string = 'N/A'): CsvData {
    const processedRows = data.rows.map(row => 
      row.map(cell => (cell === null || cell === undefined || cell === '') ? fillValue : cell)
    );
    
    return {
      ...data,
      rows: processedRows,
    };
  }
  
  static filterRows(data: CsvData, filterConfig: {
    column: string;
    operator: 'equals' | 'contains' | 'not_equals';
    value: string;
  }): CsvData {
    const columnIndex = data.headers.indexOf(filterConfig.column);
    if (columnIndex === -1) return data;
    
    const filteredRows = data.rows.filter(row => {
      const cellValue = String(row[columnIndex]).toLowerCase();
      const filterValue = filterConfig.value.toLowerCase();
      
      switch (filterConfig.operator) {
        case 'equals':
          return cellValue === filterValue;
        case 'contains':
          return cellValue.includes(filterValue);
        case 'not_equals':
          return cellValue !== filterValue;
        default:
          return true;
      }
    });
    
    return {
      ...data,
      rows: filteredRows,
      stats: {
        ...data.stats,
        totalRows: filteredRows.length,
      },
    };
  }
}
