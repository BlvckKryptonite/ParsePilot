#!/usr/bin/env python3
import json
import sys
import csv
import os

def detect_json_columns(rows, headers):
    """Detect columns that contain JSON data"""
    json_columns = []
    json_fields = {}
    
    for col_idx, header in enumerate(headers):
        json_count = 0
        field_set = set()
        sample_size = min(100, len(rows))
        
        for i in range(sample_size):
            if col_idx < len(rows[i]):
                value = rows[i][col_idx]
                if isinstance(value, str) and value.strip().startswith('{'):
                    try:
                        parsed = json.loads(value)
                        if isinstance(parsed, dict):
                            json_count += 1
                            field_set.update(parsed.keys())
                    except:
                        continue
        
        if json_count > sample_size * 0.1:  # If >10% are valid JSON
            json_columns.append(header)
            json_fields[header] = list(field_set)
    
    return json_columns, json_fields

def analyze_csv(file_path):
    """Analyze CSV file and return metadata"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)
            rows = list(reader)
        
        json_columns, json_fields = detect_json_columns(rows, headers)
        
        # Get preview data (first 20 rows)
        preview_rows = rows[:20]
        preview = []
        
        for row in preview_rows:
            row_data = {}
            for i, header in enumerate(headers):
                value = row[i] if i < len(row) else None
                if value == '' or value is None:
                    row_data[header] = None
                else:
                    row_data[header] = value
            preview.append(row_data)
        
        # Calculate statistics
        total_cells = len(rows) * len(headers)
        missing_cells = sum(1 for row in rows for cell in row if cell == '' or cell is None)
        missing_percentage = (missing_cells / total_cells) * 100 if total_cells > 0 else 0
        
        stats = {
            'totalRows': len(rows),
            'totalColumns': len(headers),
            'missingDataPercentage': missing_percentage,
            'columnTypes': {
                'text': len(headers) - len(json_columns),
                'numeric': 0,  # Simple implementation
                'json': len(json_columns)
            }
        }
        
        # Get column distributions for categorical columns
        distributions = {}
        for col_idx, header in enumerate(headers):
            if header not in json_columns:
                value_counts = {}
                for row in rows:
                    if col_idx < len(row) and row[col_idx]:
                        value = row[col_idx]
                        value_counts[value] = value_counts.get(value, 0) + 1
                
                # Get top 10 values
                sorted_values = sorted(value_counts.items(), key=lambda x: x[1], reverse=True)[:10]
                if sorted_values:
                    distributions[header] = {
                        'values': [item[0] for item in sorted_values],
                        'counts': [item[1] for item in sorted_values]
                    }
        
        return {
            'rows': len(rows),
            'columns': len(headers),
            'jsonColumns': json_columns,
            'jsonFields': json_fields,
            'preview': preview,
            'stats': stats,
            'distributions': distributions,
            'columnNames': headers
        }
    except Exception as e:
        raise Exception(f"Error analyzing CSV: {str(e)}")

def flatten_json_fields(rows, headers, config):
    """Flatten JSON fields based on configuration"""
    if not config or 'columns' not in config:
        return rows, headers
    
    new_headers = headers.copy()
    new_rows = []
    
    # Find columns to process
    columns_to_flatten = {}
    for col_name, col_config in config['columns'].items():
        if col_config.get('enabled', False) and col_name in headers:
            col_idx = headers.index(col_name)
            enabled_fields = [field for field, enabled in col_config.get('fields', {}).items() if enabled]
            if enabled_fields:
                columns_to_flatten[col_idx] = (col_name, enabled_fields)
    
    # Add new headers for flattened fields
    for col_idx, (col_name, fields) in columns_to_flatten.items():
        for field in fields:
            new_header = f"{col_name}_{field}"
            if new_header not in new_headers:
                new_headers.append(new_header)
    
    # Process each row
    for row in rows:
        new_row = row.copy()
        # Ensure row has same length as original headers
        while len(new_row) < len(headers):
            new_row.append('')
        
        # Add flattened fields
        for col_idx, (col_name, fields) in columns_to_flatten.items():
            if col_idx < len(row) and row[col_idx]:
                try:
                    json_data = json.loads(row[col_idx])
                    if isinstance(json_data, dict):
                        for field in fields:
                            value = json_data.get(field, '')
                            new_row.append(str(value) if value is not None else '')
                    else:
                        for _ in fields:
                            new_row.append('')
                except:
                    for _ in fields:
                        new_row.append('')
            else:
                for _ in fields:
                    new_row.append('')
        
        new_rows.append(new_row)
    
    return new_rows, new_headers

def is_numeric_string(value):
    """Check if a string represents a numeric value"""
    try:
        float(str(value))
        return True
    except (ValueError, TypeError):
        return False

def detect_column_types(rows, headers):
    """Detect column types to enable smart processing"""
    column_types = {}
    
    for i, header in enumerate(headers):
        numeric_count = 0
        total_count = 0
        
        for row in rows[:min(100, len(rows))]:  # Sample first 100 rows
            if i < len(row) and row[i] and str(row[i]).strip():
                total_count += 1
                if is_numeric_string(row[i]):
                    numeric_count += 1
        
        if total_count > 0 and numeric_count / total_count > 0.8:
            column_types[header] = 'numeric'
        else:
            column_types[header] = 'text'
    
    return column_types

def normalize_column_names(headers, options):
    """Normalize column names based on options"""
    if not options:
        return headers, {}
    
    new_headers = []
    column_changes = {}
    
    for header in headers:
        original_name = header
        new_name = header
        
        if options.get('trimWhitespace', True):
            new_name = new_name.strip()
        
        if options.get('removeSpecialChars', True):
            import re
            new_name = re.sub(r'[^a-zA-Z0-9_\s]', '', new_name)
        
        if options.get('snakeCase', True):
            import re
            new_name = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', new_name)
            new_name = re.sub(r'\s+', '_', new_name)
            new_name = re.sub(r'__+', '_', new_name)
        
        if options.get('lowercase', True):  # Enable by default for demonstration
            new_name = new_name.lower()
        
        # Ensure valid column name
        if new_name and new_name[0].isdigit():
            new_name = f"col_{new_name}"
        
        if not new_name:
            new_name = f"column_{len(new_headers)}"
        
        new_headers.append(new_name)
        if original_name != new_name:
            column_changes[original_name] = new_name
    
    return new_headers, column_changes

def calculate_statistics(values):
    """Calculate mean, median, mode for numeric values"""
    numeric_values = []
    for val in values:
        if val and str(val).strip() and is_numeric_string(val):
            try:
                numeric_values.append(float(val))
            except (ValueError, TypeError):
                continue
    
    if not numeric_values:
        return None, None, None
    
    # Mean
    mean_val = sum(numeric_values) / len(numeric_values)
    
    # Median
    sorted_vals = sorted(numeric_values)
    n = len(sorted_vals)
    if n % 2 == 0:
        median_val = (sorted_vals[n//2 - 1] + sorted_vals[n//2]) / 2
    else:
        median_val = sorted_vals[n//2]
    
    # Mode (most frequent value)
    from collections import Counter
    counts = Counter(numeric_values)
    mode_val = counts.most_common(1)[0][0] if counts else None
    
    return mean_val, median_val, mode_val

def handle_missing_data(rows, headers, options, column_types=None):
    """Enhanced missing data handling with smart fill options"""
    if not options:
        return rows, {}
    
    strategy = options.get('strategy', 'keep')
    fill_value = options.get('fillValue', 'N/A')
    fill_method = options.get('fillMethod', 'custom')
    specific_columns = options.get('specificColumns', [])
    
    changes_report = {
        'rows_removed': 0,
        'cells_filled': 0,
        'fill_methods_used': {}
    }
    
    if strategy == 'remove':
        # Remove rows with any missing data
        original_count = len(rows)
        filtered_rows = []
        for row_idx, row in enumerate(rows):
            has_missing = False
            for cell_idx, cell in enumerate(row):

                
                # Check for empty, None, null string, or whitespace-only values
                cell_str = str(cell) if cell is not None else ''
                if (cell is None or 
                    cell == '' or 
                    cell_str.strip() == '' or 
                    cell_str.lower().strip() in ['null', 'none', 'nan', 'na', 'n/a', '#n/a', 'nil', 'missing', '?', '-']):
                    has_missing = True
                    break
            if not has_missing:
                filtered_rows.append(row)
        changes_report['rows_removed'] = original_count - len(filtered_rows)
        return filtered_rows, changes_report
    
    elif strategy == 'remove_specific':
        # Remove rows with missing data in specific columns
        if specific_columns:
            original_count = len(rows)
            col_indices = [headers.index(col) for col in specific_columns if col in headers]
            filtered_rows = []
            for row in rows:
                has_missing_in_specific = False
                for idx in col_indices:
                    if idx < len(row) and (not row[idx] or not str(row[idx]).strip()):
                        has_missing_in_specific = True
                        break
                if not has_missing_in_specific:
                    filtered_rows.append(row)
            changes_report['rows_removed'] = original_count - len(filtered_rows)
            return filtered_rows, changes_report
    
    elif strategy in ['fill', 'smart_fill']:
        new_rows = []
        
        # Calculate statistics for smart fill
        column_stats = {}
        if strategy == 'smart_fill' or fill_method in ['mean', 'median', 'mode']:
            for i, header in enumerate(headers):
                column_values = [row[i] if i < len(row) else '' for row in rows]
                mean_val, median_val, mode_val = calculate_statistics(column_values)
                column_stats[header] = {
                    'mean': mean_val,
                    'median': median_val,
                    'mode': mode_val
                }
        
        for row in rows:
            new_row = []
            for i, cell in enumerate(row):
                header = headers[i] if i < len(headers) else f'col_{i}'
                
                cell_str = str(cell) if cell is not None else ''
                if (cell is None or 
                    cell == '' or 
                    cell_str.strip() == '' or 
                    cell_str.lower().strip() in ['null', 'none', 'nan', 'na', 'n/a', '#n/a', 'nil', 'missing', '?', '-']):
                    # Determine fill value
                    if strategy == 'smart_fill':
                        # Smart fill based on column type
                        if column_types and column_types.get(header) == 'numeric':
                            if column_stats[header]['mean'] is not None:
                                fill_val = str(column_stats[header]['mean'])
                                changes_report['fill_methods_used'][header] = 'mean'
                            else:
                                fill_val = '0'
                                changes_report['fill_methods_used'][header] = 'zero'
                        else:
                            fill_val = fill_value
                            changes_report['fill_methods_used'][header] = 'default'
                    elif fill_method == 'zero':
                        fill_val = '0'
                        changes_report['fill_methods_used'][header] = 'zero'
                    elif fill_method in ['mean', 'median', 'mode'] and header in column_stats:
                        stat_val = column_stats[header][fill_method]
                        fill_val = str(stat_val) if stat_val is not None else fill_value
                        changes_report['fill_methods_used'][header] = fill_method
                    else:
                        fill_val = fill_value
                        changes_report['fill_methods_used'][header] = 'custom'
                    
                    new_row.append(fill_val)
                    changes_report['cells_filled'] += 1
                else:
                    new_row.append(cell)
            new_rows.append(new_row)
        
        return new_rows, changes_report
    
    return rows, changes_report

def clean_string_fields(rows, headers, options):
    """Clean string fields based on options"""
    if not options or not options.get('enabled', False):
        return rows, {}
    
    changes_report = {
        'fields_cleaned': 0,
        'operations_applied': []
    }
    
    trim_whitespace = options.get('trimWhitespace', True)
    lowercase = options.get('lowercase', False)
    remove_punctuation = options.get('removePunctuation', False)
    specific_columns = options.get('specificColumns', [])
    
    # Determine which columns to clean
    columns_to_clean = specific_columns if specific_columns else headers
    
    new_rows = []
    for row in rows:
        new_row = []
        for i, cell in enumerate(row):
            header = headers[i] if i < len(headers) else f'col_{i}'
            
            if header in columns_to_clean and isinstance(cell, str):
                original_cell = cell
                cleaned_cell = cell
                
                if trim_whitespace:
                    cleaned_cell = cleaned_cell.strip()
                
                if lowercase:
                    cleaned_cell = cleaned_cell.lower()
                
                if remove_punctuation:
                    import re
                    cleaned_cell = re.sub(r'[^\w\s]$', '', cleaned_cell)  # Remove trailing punctuation
                
                if original_cell != cleaned_cell:
                    changes_report['fields_cleaned'] += 1
                
                new_row.append(cleaned_cell)
            else:
                new_row.append(cell)
        
        new_rows.append(new_row)
    
    if trim_whitespace:
        changes_report['operations_applied'].append('trim_whitespace')
    if lowercase:
        changes_report['operations_applied'].append('lowercase')
    if remove_punctuation:
        changes_report['operations_applied'].append('remove_punctuation')
    
    return new_rows, changes_report

def apply_filters(rows, headers, options):
    """Apply row filters based on options"""
    if not options:
        return rows
    
    filtered_rows = rows
    
    # Remove empty rows
    if options.get('removeEmptyRows', False):
        filtered_rows = [row for row in filtered_rows if any(cell and cell.strip() for cell in row)]
    
    # Column filter
    column_filter = options.get('columnFilter', {})
    if column_filter.get('enabled', False):
        column = column_filter.get('column')
        operator = column_filter.get('operator', 'equals')
        value = column_filter.get('value', '')
        
        if column and column in headers and value:
            col_idx = headers.index(column)
            new_filtered_rows = []
            
            for row in filtered_rows:
                if col_idx < len(row):
                    cell_value = str(row[col_idx]).lower()
                    filter_value = value.lower()
                    
                    if operator == 'equals' and cell_value == filter_value:
                        new_filtered_rows.append(row)
                    elif operator == 'contains' and filter_value in cell_value:
                        new_filtered_rows.append(row)
                    elif operator == 'not_equal' and cell_value != filter_value:
                        new_filtered_rows.append(row)
            
            filtered_rows = new_filtered_rows
    
    return filtered_rows

def process_csv(file_path, operation, options=None):
    """Main processing function"""
    try:
        if operation == 'analyze':
            return analyze_csv(file_path)
        
        # Read CSV file
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)
            rows = list(reader)
        
        if operation == 'flatten' and options:
            config = options.get('config', {})
            rows, headers = flatten_json_fields(rows, headers, config)
        
        elif operation == 'clean' and options:
            cleaning_options = options.get('cleaningOptions', {})
            json_config = options.get('jsonConfig')
            
            # Initialize comprehensive cleaning report
            cleaning_report = {
                'summary': {
                    'original_rows': len(rows),
                    'original_columns': len(headers),
                    'final_rows': 0,
                    'final_columns': 0,
                },
                'operations_performed': [],
                'column_changes': {},
                'missing_data_report': {},
                'string_cleaning_report': {},
                'filtering_report': {},
                'json_flattening_report': {}
            }
            
            # Detect column types for smart processing
            column_types = detect_column_types(rows, headers)
            
            # Apply JSON flattening first if config exists
            if json_config:
                rows, headers = flatten_json_fields(rows, headers, json_config)
                cleaning_report['operations_performed'].append('json_flattening')
                cleaning_report['json_flattening_report'] = {'columns_flattened': True}
            
            # Apply column normalization
            normalize_opts = cleaning_options.get('normalizeColumns', {})
            if normalize_opts:
                headers, column_changes = normalize_column_names(headers, normalize_opts)
                if column_changes:
                    cleaning_report['operations_performed'].append('column_normalization')
                    cleaning_report['column_changes'] = column_changes
            
            # Apply string cleaning
            string_opts = cleaning_options.get('stringCleaning', {})
            if string_opts and string_opts.get('enabled', False):
                rows, string_report = clean_string_fields(rows, headers, string_opts)
                cleaning_report['operations_performed'].append('string_cleaning')
                cleaning_report['string_cleaning_report'] = string_report
            
            # Apply missing data handling
            missing_opts = cleaning_options.get('missingData', {})
            if missing_opts:
                rows, missing_report = handle_missing_data(rows, headers, missing_opts, column_types)
                if missing_report.get('rows_removed', 0) > 0 or missing_report.get('cells_filled', 0) > 0:
                    cleaning_report['operations_performed'].append('missing_data_handling')
                    cleaning_report['missing_data_report'] = missing_report
            
            # Apply filtering
            filter_opts = cleaning_options.get('filtering', {})
            if filter_opts:
                original_row_count = len(rows)
                rows = apply_filters(rows, headers, filter_opts)
                rows_filtered = original_row_count - len(rows)
                if rows_filtered > 0:
                    cleaning_report['operations_performed'].append('row_filtering')
                    cleaning_report['filtering_report'] = {'rows_filtered': rows_filtered}
            
            # Update final counts
            cleaning_report['summary']['final_rows'] = len(rows)
            cleaning_report['summary']['final_columns'] = len(headers)
            
            # Generate human-readable summary
            cleaning_report['readable_summary'] = generate_cleaning_summary(cleaning_report)
        
        elif operation == 'export' and options:
            format_type = options.get('format', 'csv')
            include_headers = options.get('includeHeaders', True)
            cleaning_options = options.get('cleaningOptions')
            json_config = options.get('jsonConfig')
            
            # Apply all processing steps
            if json_config:
                rows, headers = flatten_json_fields(rows, headers, json_config)
            
            if cleaning_options:
                # Apply column normalization
                normalize_opts = cleaning_options.get('normalizeColumns', {})
                if normalize_opts:
                    headers, _ = normalize_column_names(headers, normalize_opts)
                
                # Apply string cleaning
                string_opts = cleaning_options.get('stringCleaning', {})
                if string_opts and string_opts.get('enabled', False):
                    rows, _ = clean_string_fields(rows, headers, string_opts)
                
                # Apply missing data handling
                missing_opts = cleaning_options.get('missingData', {})
                if missing_opts:
                    column_types = detect_column_types(rows, headers)
                    rows, _ = handle_missing_data(rows, headers, missing_opts, column_types)
                
                # Apply filtering
                filter_opts = cleaning_options.get('filtering', {})
                if filter_opts:
                    rows = apply_filters(rows, headers, filter_opts)
            
            # Export data
            if format_type == 'csv':
                import io
                output = io.StringIO()
                writer = csv.writer(output)
                if include_headers:
                    writer.writerow(headers)
                writer.writerows(rows)
                export_data = output.getvalue()
            elif format_type == 'json':
                data = []
                for row in rows:
                    row_dict = {}
                    for i, header in enumerate(headers):
                        value = row[i] if i < len(row) else ''
                        row_dict[header] = value
                    data.append(row_dict)
                export_data = json.dumps(data, indent=2)
            elif format_type == 'xlsx':
                # For now, return CSV format as Excel isn't implemented
                import io
                output = io.StringIO()
                writer = csv.writer(output)
                if include_headers:
                    writer.writerow(headers)
                writer.writerows(rows)
                export_data = output.getvalue()
            else:
                raise Exception(f"Unsupported export format: {format_type}")
            
            return {'exportData': export_data}
        
        # Return processed data and preview
        preview_rows = rows[:20]
        preview = []
        
        for row in preview_rows:
            row_data = {}
            for i, header in enumerate(headers):
                value = row[i] if i < len(row) else None
                if value == '' or value is None:
                    row_data[header] = None
                else:
                    row_data[header] = value
            preview.append(row_data)
        
        # Recalculate stats
        json_columns, _ = detect_json_columns(rows, headers)
        total_cells = len(rows) * len(headers)
        missing_cells = sum(1 for row in rows for cell in row if cell == '' or cell is None)
        missing_percentage = (missing_cells / total_cells) * 100 if total_cells > 0 else 0
        
        stats = {
            'totalRows': len(rows),
            'totalColumns': len(headers),
            'missingDataPercentage': missing_percentage,
            'columnTypes': {
                'text': len(headers) - len(json_columns),
                'numeric': 0,
                'json': len(json_columns)
            }
        }
        
        result = {
            'processedData': [dict(zip(headers, row)) for row in rows],
            'preview': preview,
            'stats': stats,
            'columnNames': headers
        }
        
        # Include cleaning report if available
        if operation == 'clean' and 'cleaning_report' in locals():
            result['cleaningReport'] = cleaning_report
            
        return result
        
    except Exception as e:
        raise Exception(f"Error processing CSV: {str(e)}")

def generate_cleaning_summary(report):
    """Generate human-readable cleaning summary"""
    summary = []
    
    # Basic stats
    original_rows = report['summary']['original_rows']
    final_rows = report['summary']['final_rows']
    original_cols = report['summary']['original_columns']
    final_cols = report['summary']['final_columns']
    
    summary.append(f"Data processed: {original_rows} → {final_rows} rows, {original_cols} → {final_cols} columns")
    
    # Operations performed
    if report['operations_performed']:
        summary.append(f"Operations applied: {', '.join(report['operations_performed'])}")
    
    # Column changes
    if report['column_changes']:
        summary.append(f"Column names normalized: {len(report['column_changes'])} columns renamed")
    
    # Missing data
    if report['missing_data_report']:
        missing = report['missing_data_report']
        if missing.get('rows_removed', 0) > 0:
            summary.append(f"Rows removed due to missing data: {missing['rows_removed']}")
        if missing.get('cells_filled', 0) > 0:
            summary.append(f"Missing values filled: {missing['cells_filled']}")
    
    # String cleaning
    if report['string_cleaning_report']:
        string_clean = report['string_cleaning_report']
        if string_clean.get('fields_cleaned', 0) > 0:
            summary.append(f"String fields cleaned: {string_clean['fields_cleaned']}")
    
    # Filtering
    if report['filtering_report']:
        filtered = report['filtering_report'].get('rows_filtered', 0)
        if filtered > 0:
            summary.append(f"Rows filtered out: {filtered}")
    
    return summary

if __name__ == "__main__":
    try:
        if len(sys.argv) < 3:
            raise Exception("Usage: python simple_csv_processor.py <file_path> <operation> [options]")
        
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