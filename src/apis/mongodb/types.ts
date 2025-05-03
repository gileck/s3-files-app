import { Document, WithId, BSON } from 'mongodb';

export type CollectionsRequest = Record<string, never>;

export type CollectionsResponse = {
    collections: string[];
    error?: string;
};

export type DocumentsRequest = {
    collection: string;
    limit?: number;
    skip?: number;
    query?: BSON.Document;
    id?: string;
};

export type DocumentsResponse = {
    documents?: WithId<Document>[];
    document?: WithId<Document>;
    pagination?: {
        total: number;
        limit: number;
        skip: number;
    };
    error?: string;
};

export type ModifyDocumentRequest = {
    collection: string;
    id?: string;
    document: Document;
};

export type ModifyDocumentResponse = {
    success: boolean;
    insertedId?: string;
    deletedCount?: number;
    error?: string;
};

export type QueryRequest = {
    collection: string;
    query: string;
};

export type QueryResponse = {
    results: WithId<Document>[];
    error?: string;
};

export type StatsRequest = {
    collection: string;
};

export type StatsResponse = {
    stats: BSON.Document | null;
    error?: string;
};

// Create types for AI-powered query generation
export interface AIQueryRequest {
    collection: string;
    naturalLanguageQuery: string;
    modelId?: string;
}

export interface AIQueryResponse {
    query: string;
    error?: string;
    cost?: { totalCost: number };
} 