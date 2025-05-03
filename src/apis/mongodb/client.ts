import apiClient from '../../client/utils/apiClient';
import { collectionsApiName, documentsApiName, modifyDocumentApiName, queryApiName, statsApiName, aiQueryApiName } from './index';
import type {
    CollectionsResponse,
    DocumentsRequest, DocumentsResponse,
    ModifyDocumentRequest, ModifyDocumentResponse,
    QueryRequest, QueryResponse,
    StatsRequest, StatsResponse,
    AIQueryRequest, AIQueryResponse
} from './types';
import type { CacheResult } from '../../server/cache/types';

// Collections API
export const fetchCollections = async (): Promise<CacheResult<CollectionsResponse>> => {
    return apiClient.call<CacheResult<CollectionsResponse>>(
        collectionsApiName
    );
};

// Documents API
export const fetchDocuments = async (
    request: DocumentsRequest
): Promise<CacheResult<DocumentsResponse>> => {
    return apiClient.call<CacheResult<DocumentsResponse>, DocumentsRequest>(
        documentsApiName,
        request
    );
};

// Modify Document API
export const modifyDocument = async (
    request: ModifyDocumentRequest
): Promise<CacheResult<ModifyDocumentResponse>> => {
    return apiClient.call<CacheResult<ModifyDocumentResponse>, ModifyDocumentRequest>(
        modifyDocumentApiName,
        request
    );
};

// Query API
export const executeQuery = async (
    request: QueryRequest
): Promise<CacheResult<QueryResponse>> => {
    return apiClient.call<CacheResult<QueryResponse>, QueryRequest>(
        queryApiName,
        request
    );
};

// Stats API
export const fetchStats = async (
    request: StatsRequest
): Promise<CacheResult<StatsResponse>> => {
    return apiClient.call<CacheResult<StatsResponse>, StatsRequest>(
        statsApiName,
        request
    );
};

// AI Query API
export const generateAIQuery = async (
    request: AIQueryRequest
): Promise<CacheResult<AIQueryResponse>> => {
    return apiClient.call<CacheResult<AIQueryResponse>, AIQueryRequest>(
        aiQueryApiName,
        request
    );
}; 