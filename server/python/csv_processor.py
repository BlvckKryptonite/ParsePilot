#!/usr/bin/env python3
import pandas as pd
import json
import sys
import os
import re
from io import StringIO

def detect_json_columns(df):
    """Detect columns that contain JSON data"""
    json_columns = []
    json_fields = {}
    
    for col in df.columns:
        sample_values = df[col].dropna().head(100)
        json_count = 0
        field_set = set()
        
        for value in sample_values:
            if isinstance(value, str):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, dict):
                        json_count += 1
                        field_set.update(parsed.keys())
                except:
                    continue
        
        if json_count > len(sample_values) * 0.1:  # If >10% are valid JSON
            json_columns.append(col)
            json_fields[col] = list(field_set)
    
    return json_columns, json_fields

def analyze_csv(file_path):
    """Analyze CSV file and return metadata"""
    try:
        df = pd.read_csv(file_path)
        json_columns, json_fields = detect_json_columns(df)
        
        # Get preview data (first 20 rows)
        preview_df = df.head(20)
        preview = []
        
        for _, row in preview_df.iterrows():
            row_data = {}
            for col in df.columns:
                value = row[col]
                if pd.isna(value):
                    row_data[col] = None
                else:
                    row_data[col] = str(value)
            preview.append(row_data)
        
        # Calculate statistics
        stats = {
            'totalRows': len(df),
            'totalColumns': len(df.columns),
            'missingDataPercentage': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100,
            'columnTypes': {
                'text': len([c for c in df.columns if df[c].dtype == 'object' and c not in json_columns]),
                'numeric': len([c for c in df.columns if df[c].dtype in ['int64', 'float64']]),
                'json': len(json_columns)
            }
        }
        
        # Get column distributions for categorical columns
        distributions = {}
        for col in df.columns:
            if df[col].dtype == 'object' and col not in json_columns:
                value_counts = df[col].value_counts().head(10)
                distributions[col] = {
                    'values': value_counts.index.tolist(),
                    'counts': value_counts.values.tolist()
                }
        
        return {
            'rows': len(df),
            'columns': len(df.columns),
            'jsonColumns': json_columns,
            'jsonFields': json_fields,
            'preview': preview,
            'stats': stats,
            'distributions': distributions,
            'columnNames': df.columns.tolist()
        }
    except Exception as e:
        raise Exception(f"Error analyzing CSV: {str(e)}")

def flatten_json_fields(df, config):
    """Flatten JSON fields based on configuration"""
    result_df = df.copy()
    
    for col_name, col_config in config['columns'].items():
        if not col_config['enabled'] or col_name not in df.columns:
            continue
            
        # Extract selected fields
        for field_name, field_enabled in col_config['fields'].items():
            if not field_enabled:
                continue
                
            new_col_name = f"{col_name}_{field_name}"
            new_col_data = []
            
            for value in df[col_name]:
                try:
                    if pd.isna(value):
                        new_col_data.append(None)
                    else:
                        parsed = json.loads(str(value))
                        if isinstance(parsed, dict) and field_name in parsed:
                            new_col_data.append(parsed[field_name])
                        else:
                            new_col_data.append(None)
                except:
                    new_col_data.append(None)
            
            result_df[new_col_name] = new_col_data
    
    return result_df

def normalize_column_names(df, options):
    """Normalize column names based on options"""
    new_columns = {}
    
    for col in df.columns:
        new_name = col
        
        if options.get('removeSpecialChars', True):
            new_name = re.sub(r'[^a-zA-Z0-9_]', '_', new_name)
        
        if options.get('snakeCase', True):
            # Convert camelCase to snake_case
            new_name = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', new_name)
            new_name = re.sub(r'__+', '_', new_name)  # Remove multiple underscores
        
        if options.get('lowercase', False):
            new_name = new_name.lower()
        
        # Ensure column name doesn't start with number
        if new_name and new_name[0].isdigit():
            new_name = f"col_{new_name}"
        
        new_columns[col] = new_name
    
    return df.rename(columns=new_columns)

def handle_missing_data(df, options):
    """Handle missing data based on options"""
    result_df = df.copy()
    
    strategy = options.get('strategy', 'keep')
    
    if strategy == 'remove':
        result_df = result_df.dropna()
    elif strategy == 'fill':
        fill_value = options.get('fillValue', 'N/A')
        result_df = result_df.fillna(fill_value)
    # 'keep' strategy does nothing
    
    return result_df

def apply_filters(df, options):
    """Apply row filters based on options"""
    result_df = df.copy()
    
    if options.get('removeEmptyRows', False):
        result_df = result_df.dropna(how='all')
    
    column_filter = options.get('columnFilter', {})
    if column_filter.get('enabled', False):
        column = column_filter.get('column')
        operator = column_filter.get('operator', 'equals')
        value = column_filter.get('value', '')
        
        if column and column in result_df.columns and value:
            if operator == 'equals':
                result_df = result_df[result_df[column] == value]
            elif operator == 'contains':
                result_df = result_df[result_df[column].astype(str).str.contains(value, na=False)]
            elif operator == 'not_equal':
                result_df = result_df[result_df[column] != value]
    
    return result_df

def process_csv(file_path, operation, options=None):
    """Main processing function"""
    try:
        if operation == 'analyze':
            return analyze_csv(file_path)
        
        df = pd.read_csv(file_path)
        
        if operation == 'flatten' and options:
            config = options.get('config', {})
            df = flatten_json_fields(df, config)
        
        elif operation == 'clean' and options:
            cleaning_options = options.get('cleaningOptions', {})
            json_config = options.get('jsonConfig')
            
            # Apply JSON flattening first if config exists
            if json_config:
                df = flatten_json_fields(df, json_config)
            
            # Apply cleaning options
            normalize_opts = cleaning_options.get('normalizeColumns', {})
            df = normalize_column_names(df, normalize_opts)
            
            missing_opts = cleaning_options.get('missingData', {})
            df = handle_missing_data(df, missing_opts)
            
            filter_opts = cleaning_options.get('filtering', {})
            df = apply_filters(df, filter_opts)
        
        elif operation == 'export' and options:
            format_type = options.get('format', 'csv')
            include_headers = options.get('includeHeaders', True)
            cleaning_options = options.get('cleaningOptions')
            json_config = options.get('jsonConfig')
            
            # Apply all processing steps
            if json_config:
                df = flatten_json_fields(df, json_config)
            
            if cleaning_options:
                normalize_opts = cleaning_options.get('normalizeColumns', {})
                df = normalize_column_names(df, normalize_opts)
                
                missing_opts = cleaning_options.get('missingData', {})
                df = handle_missing_data(df, missing_opts)
                
                filter_opts = cleaning_options.get('filtering', {})
                df = apply_filters(df, filter_opts)
            
            # Export data
            if format_type == 'csv':
                output = StringIO()
                df.to_csv(output, index=False, header=include_headers)
                export_data = output.getvalue()
            elif format_type == 'json':
                export_data = df.to_json(orient='records', indent=2)
            elif format_type == 'xlsx':
                output = StringIO()
                df.to_excel(output, index=False, header=include_headers)
                export_data = output.getvalue()
            else:
                raise Exception(f"Unsupported export format: {format_type}")
            
            return {'exportData': export_data}
        
        # Return processed data and preview
        preview_df = df.head(20)
        preview = []
        
        for _, row in preview_df.iterrows():
            row_data = {}
            for col in df.columns:
                value = row[col]
                if pd.isna(value):
                    row_data[col] = None
                else:
                    row_data[col] = str(value)
            preview.append(row_data)
        
        # Recalculate stats
        json_columns, _ = detect_json_columns(df)
        stats = {
            'totalRows': len(df),
            'totalColumns': len(df.columns),
            'missingDataPercentage': (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100,
            'columnTypes': {
                'text': len([c for c in df.columns if df[c].dtype == 'object' and c not in json_columns]),
                'numeric': len([c for c in df.columns if df[c].dtype in ['int64', 'float64']]),
                'json': len(json_columns)
            }
        }
        
        return {
            'processedData': df.to_dict('records'),
            'preview': preview,
            'stats': stats,
            'columnNames': df.columns.tolist()
        }
        
    except Exception as e:
        raise Exception(f"Error processing CSV: {str(e)}")

if __name__ == "__main__":
    try:
        if len(sys.argv) < 3:
            raise Exception("Usage: python csv_processor.py <file_path> <operation> [options]")
        
        file_path = sys.argv[1]
        operation = sys.argv[2]
        options = None
        
        if len(sys.argv) > 3:
            options = json.loads(sys.argv[3])
        
        result = process_csv(file_path, operation, options)
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
