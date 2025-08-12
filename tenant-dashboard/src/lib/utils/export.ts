/**
 * Export utilities for table data to CSV and Excel formats
 */

export interface ExportRecord {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
  lastModified?: string;
}

export interface ExportOptions {
  filename?: string;
  tableName?: string;
  includeMetadata?: boolean;
  onProgress?: (progress: number) => void;
}

/**
 * Formats a field value for export
 */
export function formatFieldValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map(v => String(v)).join(', ');
    }
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Generates a filename with timestamp
 */
export function generateFilename(tableName: string, format: 'csv' | 'xlsx'): string {
  const date = new Date();
  const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const sanitizedTableName = tableName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  return `${sanitizedTableName}-${dateString}.${format}`;
}

/**
 * Gets all unique field names from records
 */
export function getFieldNames(records: ExportRecord[]): string[] {
  const fieldSet = new Set<string>();
  records.forEach(record => {
    Object.keys(record.fields).forEach(field => fieldSet.add(field));
  });
  return Array.from(fieldSet).sort();
}

/**
 * Converts records to CSV format
 */
export function recordsToCSV(records: ExportRecord[], options: ExportOptions = {}): string {
  if (records.length === 0) return '';

  const { includeMetadata = true, onProgress } = options;
  const fieldNames = getFieldNames(records);
  
  // Build headers
  const headers = ['Record ID', ...fieldNames];
  if (includeMetadata) {
    headers.push('Created Time', 'Last Modified');
  }

  // Convert to CSV rows
  const rows: string[] = [];
  rows.push(headers.map(h => `"${h}"`).join(','));

  records.forEach((record, index) => {
    const row: string[] = [];
    
    // Add record ID
    row.push(`"${record.id}"`);
    
    // Add field values
    fieldNames.forEach(fieldName => {
      const value = formatFieldValue(record.fields[fieldName]);
      // Escape quotes by doubling them and wrap in quotes
      row.push(`"${value.replace(/"/g, '""')}"`);
    });
    
    // Add metadata if requested
    if (includeMetadata) {
      row.push(`"${record.createdTime}"`);
      row.push(`"${record.lastModified || ''}"`);
    }
    
    rows.push(row.join(','));
    
    // Report progress
    if (onProgress) {
      const progress = ((index + 1) / records.length) * 100;
      onProgress(progress);
    }
  });

  return rows.join('\n');
}

/**
 * Downloads CSV data as a file
 */
export function downloadCSV(records: ExportRecord[], options: ExportOptions = {}): void {
  const { filename, tableName = 'table' } = options;
  const csvContent = recordsToCSV(records, options);
  const finalFilename = filename || generateFilename(tableName, 'csv');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Converts records to Excel format using lightweight approach
 * This uses a simple XML-based Excel format (SpreadsheetML)
 */
export function recordsToExcel(records: ExportRecord[], options: ExportOptions = {}): string {
  if (records.length === 0) return '';

  const { includeMetadata = true, onProgress } = options;
  const fieldNames = getFieldNames(records);
  
  // Build headers
  const headers = ['Record ID', ...fieldNames];
  if (includeMetadata) {
    headers.push('Created Time', 'Last Modified');
  }

  // Start XML structure
  let xml = '<?xml version="1.0"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += '<Worksheet ss:Name="Records">\n';
  xml += '<Table>\n';

  // Add header row
  xml += '<Row>\n';
  headers.forEach(header => {
    xml += `<Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>\n`;
  });
  xml += '</Row>\n';

  // Add data rows
  records.forEach((record, index) => {
    xml += '<Row>\n';
    
    // Add record ID
    xml += `<Cell><Data ss:Type="String">${escapeXml(record.id)}</Data></Cell>\n`;
    
    // Add field values
    fieldNames.forEach(fieldName => {
      const value = formatFieldValue(record.fields[fieldName]);
      const dataType = isNumeric(value) ? 'Number' : 'String';
      xml += `<Cell><Data ss:Type="${dataType}">${escapeXml(value)}</Data></Cell>\n`;
    });
    
    // Add metadata if requested
    if (includeMetadata) {
      xml += `<Cell><Data ss:Type="String">${escapeXml(record.createdTime)}</Data></Cell>\n`;
      xml += `<Cell><Data ss:Type="String">${escapeXml(record.lastModified || '')}</Data></Cell>\n`;
    }
    
    xml += '</Row>\n';
    
    // Report progress
    if (onProgress) {
      const progress = ((index + 1) / records.length) * 100;
      onProgress(progress);
    }
  });

  xml += '</Table>\n';
  xml += '</Worksheet>\n';
  xml += '</Workbook>';

  return xml;
}

/**
 * Downloads Excel data as a file
 */
export function downloadExcel(records: ExportRecord[], options: ExportOptions = {}): void {
  const { filename, tableName = 'table' } = options;
  const excelContent = recordsToExcel(records, options);
  const finalFilename = filename || generateFilename(tableName, 'xlsx');

  // Create and trigger download
  const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Helper function to escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}

/**
 * Helper function to check if a value is numeric
 */
function isNumeric(value: string): boolean {
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
}

/**
 * Progress tracking for large exports
 */
export class ExportProgress {
  private callback?: (progress: number) => void;
  private total: number = 0;
  private current: number = 0;

  constructor(callback?: (progress: number) => void) {
    this.callback = callback;
  }

  setTotal(total: number) {
    this.total = total;
    this.current = 0;
  }

  increment() {
    this.current++;
    this.updateProgress();
  }

  setProgress(current: number) {
    this.current = current;
    this.updateProgress();
  }

  private updateProgress() {
    if (this.callback && this.total > 0) {
      const progress = (this.current / this.total) * 100;
      this.callback(Math.min(100, Math.max(0, progress)));
    }
  }
}

/**
 * Export records with progress tracking for large datasets
 */
export async function exportRecordsWithProgress(
  records: ExportRecord[],
  format: 'csv' | 'excel',
  options: ExportOptions = {}
): Promise<void> {
  return new Promise((resolve) => {
    // Use requestAnimationFrame to prevent UI blocking
    requestAnimationFrame(() => {
      if (format === 'csv') {
        downloadCSV(records, options);
      } else {
        downloadExcel(records, options);
      }
      resolve();
    });
  });
}