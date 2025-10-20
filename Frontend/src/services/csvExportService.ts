/**
 * CSV Export Service
 * Provides utilities to export report data to CSV format
 */

export interface CSVExportOptions {
  filename: string;
  headers?: string[];
  data: any[];
  includeTimestamp?: boolean;
}

export class CSVExportService {
  /**
   * Convert data to CSV format
   */
  private static convertToCSV(data: any[], headers?: string[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    // Get headers from first object if not provided
    const csvHeaders = headers || Object.keys(data[0]);

    // Create CSV header row
    const headerRow = csvHeaders.map(h => this.escapeCSVValue(h)).join(',');

    // Create CSV data rows
    const dataRows = data.map(row => {
      return csvHeaders.map(header => {
        const value = row[header];
        return this.escapeCSVValue(value);
      }).join(',');
    });

    return [headerRow, ...dataRows].join('\n');
  }

  /**
   * Escape CSV values (handle commas, quotes, newlines)
   */
  private static escapeCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape existing quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Generate filename with timestamp
   */
  private static generateFilename(baseName: string, includeTimestamp: boolean = true): string {
    const sanitized = baseName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    
    if (includeTimestamp) {
      const now = new Date();
      const timestamp = now.toISOString()
        .replace(/:/g, '-')
        .replace(/\..+/, '')
        .replace('T', '_');
      return `${sanitized}_${timestamp}.csv`;
    }

    return `${sanitized}.csv`;
  }

  /**
   * Download CSV file
   */
  private static downloadCSV(csvContent: string, filename: string): void {
    // Create blob with UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  }

  /**
   * Main export function
   */
  static exportToCSV(options: CSVExportOptions): void {
    const { filename, headers, data, includeTimestamp = true } = options;

    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    const csvContent = this.convertToCSV(data, headers);
    const finalFilename = this.generateFilename(filename, includeTimestamp);
    
    this.downloadCSV(csvContent, finalFilename);
  }

  /**
   * Export Agent Transaction Report
   */
  static exportAgentTransactionReport(data: any[]): void {
    const headers = [
      'employee_id',
      'employee_name',
      'branch_id',
      'branch_name',
      'total_transactions',
      'total_value',
      'employee_status'
    ];

    this.exportToCSV({
      filename: 'agent_transaction_report',
      headers,
      data
    });
  }

  /**
   * Export Account Transaction Report
   */
  static exportAccountTransactionReport(data: any[]): void {
    const headers = [
      'saving_account_id',
      'customer_id',
      'customer_name',
      'plan_name',
      'open_date',
      'current_balance',
      'total_transactions',
      'account_status',
      'branch_name',
      'agent_name',
      'agent_id',
      'branch_id'
    ];

    this.exportToCSV({
      filename: 'account_transaction_report',
      headers,
      data
    });
  }

  /**
   * Export Active Fixed Deposits Report
   */
  static exportActiveFixedDepositsReport(data: any[]): void {
    const headers = [
      'fixed_deposit_id',
      'saving_account_id',
      'customer_name',
      'customer_id',
      'principal_amount',
      'interest_rate',
      'plan_months',
      'start_date',
      'end_date',
      'next_payout_date',
      'fd_status',
      'total_interest',
      'branch_name',
      'agent_name',
      'agent_id',
      'branch_id',
      'status'
    ];

    this.exportToCSV({
      filename: 'active_fixed_deposits_report',
      headers,
      data
    });
  }

  /**
   * Export Monthly Interest Distribution Report
   */
  static exportMonthlyInterestReport(data: any[]): void {
    const headers = [
      'plan_name',
      'month',
      'year',
      'month_num',
      'branch_name',
      'account_count',
      'total_interest_paid',
      'average_interest_per_account',
      'min_interest',
      'max_interest'
    ];

    this.exportToCSV({
      filename: 'monthly_interest_distribution_report',
      headers,
      data
    });
  }

  /**
   * Export Customer Activity Report
   */
  static exportCustomerActivityReport(data: any[]): void {
    const headers = [
      'customer_id',
      'customer_name',
      'total_accounts',
      'total_deposits',
      'total_withdrawals',
      'net_change',
      'current_total_balance',
      'customer_status',
      'branch_name',
      'agent_name',
      'agent_id',
      'branch_id'
    ];

    this.exportToCSV({
      filename: 'customer_activity_report',
      headers,
      data
    });
  }

  /**
   * Export report with summary
   */
  static exportReportWithSummary(
    reportName: string,
    data: any[],
    summary: any,
    headers?: string[]
  ): void {
    if (!data || data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Add summary as first rows
    const summaryRows = Object.entries(summary).map(([key, value]) => ({
      [headers?.[0] || 'Field']: key,
      [headers?.[1] || 'Value']: value
    }));

    // Add empty row separator
    const separator = headers ? 
      headers.reduce((acc, h) => ({ ...acc, [h]: '' }), {}) :
      { '': '' };

    // Combine summary, separator, and data
    const combinedData = [
      ...summaryRows,
      separator,
      ...data
    ];

    this.exportToCSV({
      filename: reportName,
      headers,
      data: combinedData
    });
  }
}

export default CSVExportService;
