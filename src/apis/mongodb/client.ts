import apiClient from '../../client/utils/apiClient';
import { databasesApiName, collectionsApiName, documentsApiName, modifyDocumentApiName, queryApiName, statsApiName, aiQueryApiName } from './index';
import type {
    DatabasesResponse,
    CollectionsResponse,
    DocumentsRequest, DocumentsResponse,
    ModifyDocumentRequest, ModifyDocumentResponse,
    QueryRequest, QueryResponse,
    StatsRequest, StatsResponse,
    AIQueryRequest, AIQueryResponse
} from './types';
import type { CacheResult } from '../../server/cache/types';

// Databases API
export const fetchDatabases = async (): Promise<CacheResult<DatabasesResponse>> => {
    return apiClient.call<CacheResult<DatabasesResponse>>(
        databasesApiName
    );
};

// Collections API
export const fetchCollections = async (database?: string): Promise<CacheResult<CollectionsResponse>> => {
    return apiClient.call<CacheResult<CollectionsResponse>>(
        collectionsApiName,
        { database }
    );
};

// Documents API
export const fetchDocuments = async (
    collection: string,
    filterParams: {
        query?: Record<string, any>;
        limit?: number;
        skip?: number;
    } = {},
    database?: string
): Promise<CacheResult<DocumentsResponse>> => {
    const request: DocumentsRequest = {
        collection,
        query: filterParams.query || {},
        limit: filterParams.limit,
        skip: filterParams.skip,
        database
    };
    return apiClient.call<CacheResult<DocumentsResponse>>(documentsApiName, request);
};

export const fetchDocument = async (
    collection: string,
    documentId: string,
    database?: string
): Promise<CacheResult<DocumentsResponse>> => {
    const request: DocumentsRequest = { collection, documentId, database };
    return apiClient.call<CacheResult<DocumentsResponse>>(documentsApiName, request);
};

// Modify Document API
export const modifyDocument = async (
    request: ModifyDocumentRequest
): Promise<CacheResult<ModifyDocumentResponse>> => {
    return apiClient.call<CacheResult<ModifyDocumentResponse>>(modifyDocumentApiName, request);
};

// Legacy interface for backward compatibility
export const modifyDocumentLegacy = async (
    collection: string,
    action: 'insert' | 'update' | 'delete',
    document: Record<string, any>,
    documentId?: string,
    database?: string
): Promise<CacheResult<ModifyDocumentResponse>> => {
    const request: ModifyDocumentRequest = { collection, action, document, documentId, database };
    return modifyDocument(request);
};

// Query API
export const runQuery = async (
    collection: string,
    query: string,
    database?: string
): Promise<CacheResult<QueryResponse>> => {
    const request: QueryRequest = { collection, query, database };
    return apiClient.call<CacheResult<QueryResponse>>(queryApiName, request);
};

// Stats API
export const fetchCollectionStats = async (
    collection: string,
    database?: string
): Promise<CacheResult<StatsResponse>> => {
    const request: StatsRequest = { collection, database };
    return apiClient.call<CacheResult<StatsResponse>>(statsApiName, request);
};

// AI Query API
export const runAIQuery = async (
    collection: string,
    naturalLanguageQuery: string,
    database?: string
): Promise<CacheResult<AIQueryResponse>> => {
    const request: AIQueryRequest = { collection, naturalLanguageQuery, database };
    return apiClient.call<CacheResult<AIQueryResponse>>(aiQueryApiName, request);
}; 