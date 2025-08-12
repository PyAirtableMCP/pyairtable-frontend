/**
 * Airtable Gateway Client - Connects to our Python airtable-gateway service
 * This replaces direct Airtable API calls with calls to our backend service
 * which provides caching, rate limiting, and error handling.
 */

interface AirtableConfig {
  gatewayUrl: string;
  internalApiKey?: string;
}

interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

interface AirtableTable {
  id: string;
  name: string;
  primaryFieldId: string;
  fields: AirtableField[];
  views: AirtableView[];
  description?: string;
}

interface AirtableField {
  id: string;
  name: string;
  type: string;
  options: Record<string, any>;
  description?: string;
}

interface AirtableView {
  id: string;
  name: string;
  type: string;
  visibleFieldIds: string[];
}

interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime: string;
  lastModified: string;
}

interface ListRecordsResponse {
  records: AirtableRecord[];
  offset?: string;
  total: number;
  hasMore: boolean;
}

interface ListBasesResponse {
  bases: AirtableBase[];
  total: number;
}

interface BaseSchemaResponse {
  tables: AirtableTable[];
  total: number;
}

interface AirtableTableSummary {
  id: string;
  name: string;
  recordCount?: number;
}

interface ListTablesResponse {
  tables: AirtableTableSummary[];
  total: number;
}

class AirtableGatewayClient {
  private config: AirtableConfig;

  constructor(config: AirtableConfig) {
    this.config = config;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    const url = `${this.config.gatewayUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add internal API key if provided
    if (this.config.internalApiKey) {
      headers['X-Internal-API-Key'] = this.config.internalApiKey;
    }

    // Add JWT token if provided
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for additional auth
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Airtable Gateway Error: ${error.message}`);
      }
      throw new Error('Airtable Gateway Error: Unknown error occurred');
    }
  }

  /**
   * Test connection to the gateway
   */
  async testConnection(): Promise<{ status: string; message: string }> {
    return this.makeRequest('/api/v1/airtable/test');
  }

  /**
   * List all accessible Airtable bases
   */
  async listBases(accessToken?: string): Promise<AirtableBase[]> {
    const response = await this.makeRequest<ListBasesResponse>('/api/v1/airtable/bases', {}, accessToken);
    return response.bases;
  }

  /**
   * Get schema for a specific base
   */
  async getBaseSchema(baseId: string): Promise<AirtableTable[]> {
    const response = await this.makeRequest<BaseSchemaResponse>(`/api/v1/airtable/bases/${baseId}/schema`);
    return response.tables;
  }

  /**
   * List tables for a specific base with record counts
   */
  async listTables(baseId: string, accessToken?: string): Promise<AirtableTableSummary[]> {
    const response = await this.makeRequest<ListTablesResponse>(`/api/v1/airtable/bases/${baseId}/tables`, {}, accessToken);
    return response.tables;
  }

  /**
   * List records from a table with optional filtering and pagination
   */
  async listRecords(
    baseId: string,
    tableId: string,
    options: {
      view?: string;
      maxRecords?: number;
      pageSize?: number;
      offset?: string;
      fields?: string[];
      filterByFormula?: string;
      sortField?: string;
      sortDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<ListRecordsResponse> {
    const params = new URLSearchParams();
    
    if (options.view) params.append('view', options.view);
    if (options.maxRecords) params.append('max_records', options.maxRecords.toString());
    if (options.pageSize) params.append('page_size', options.pageSize.toString());
    if (options.offset) params.append('offset', options.offset);
    if (options.fields) {
      options.fields.forEach(field => params.append('fields', field));
    }
    if (options.filterByFormula) params.append('filter_by_formula', options.filterByFormula);
    if (options.sortField) params.append('sort_field', options.sortField);
    if (options.sortDirection) params.append('sort_direction', options.sortDirection);

    const queryString = params.toString();
    const endpoint = `/api/v1/airtable/bases/${baseId}/tables/${tableId}/records${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest<ListRecordsResponse>(endpoint);
  }

  /**
   * Get a single record by ID
   */
  async getRecord(
    baseId: string,
    tableId: string,
    recordId: string
  ): Promise<AirtableRecord> {
    return this.makeRequest<AirtableRecord>(`/api/v1/airtable/bases/${baseId}/tables/${tableId}/records/${recordId}`);
  }

  /**
   * Create new records in a table
   */
  async createRecords(
    baseId: string,
    tableId: string,
    records: Record<string, any>[],
    typecast: boolean = false
  ): Promise<{ records: AirtableRecord[] }> {
    return this.makeRequest(`/api/v1/airtable/bases/${baseId}/tables/${tableId}/records?typecast=${typecast}`, {
      method: 'POST',
      body: JSON.stringify(records),
    });
  }

  /**
   * Update existing records (partial update)
   */
  async updateRecords(
    baseId: string,
    tableId: string,
    records: Array<{ id: string; [field: string]: any }>,
    typecast: boolean = false
  ): Promise<{ records: AirtableRecord[] }> {
    return this.makeRequest(`/api/v1/airtable/bases/${baseId}/tables/${tableId}/records?typecast=${typecast}`, {
      method: 'PATCH',
      body: JSON.stringify(records),
    });
  }

  /**
   * Replace existing records (full update)
   */
  async replaceRecords(
    baseId: string,
    tableId: string,
    records: Array<{ id: string; [field: string]: any }>,
    typecast: boolean = false
  ): Promise<{ records: AirtableRecord[] }> {
    return this.makeRequest(`/api/v1/airtable/bases/${baseId}/tables/${tableId}/records?typecast=${typecast}`, {
      method: 'PUT',
      body: JSON.stringify(records),
    });
  }

  /**
   * Delete records by IDs
   */
  async deleteRecords(
    baseId: string,
    tableId: string,
    recordIds: string[]
  ): Promise<{ records: Array<{ id: string; deleted: boolean }> }> {
    const params = new URLSearchParams();
    recordIds.forEach(id => params.append('record_ids', id));
    
    return this.makeRequest(`/api/v1/airtable/bases/${baseId}/tables/${tableId}/records?${params.toString()}`, {
      method: 'DELETE',
    });
  }

  /**
   * Invalidate cache entries
   */
  async invalidateCache(pattern?: string): Promise<{ status: string; message: string }> {
    const params = pattern ? `?pattern=${encodeURIComponent(pattern)}` : '';
    return this.makeRequest(`/api/v1/airtable/cache/invalidate${params}`, {
      method: 'POST',
    });
  }
}

// Default configuration
const defaultConfig: AirtableConfig = {
  gatewayUrl: process.env.NEXT_PUBLIC_AIRTABLE_GATEWAY_URL || 'http://localhost:8002',
  internalApiKey: process.env.NEXT_PUBLIC_INTERNAL_API_KEY,
};

// Export a default instance
export const airtableClient = new AirtableGatewayClient(defaultConfig);

// Export the class for custom instances
export { AirtableGatewayClient };

// Export types
export type {
  AirtableConfig,
  AirtableBase,
  AirtableTable,
  AirtableTableSummary,
  AirtableField,
  AirtableView,
  AirtableRecord,
  ListRecordsResponse,
  ListBasesResponse,
  BaseSchemaResponse,
  ListTablesResponse,
};