import { Document, WithId, BSON } from 'mongodb';

export type DatabasesRequest = Record<string, never>;

export type DatabasesResponse = {
    databases: string[];
    error?: string;
};

export type CollectionsRequest = {
    database?: string;
};

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
    filter?: Record<string, any>;
    documentId?: string;
    database?: string;
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
    action?: 'insert' | 'update' | 'delete';
    documentId?: string;
    database?: string;
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
    database?: string;
};

export type QueryResponse = {
    results: WithId<Document>[];
    error?: string;
};

export type StatsRequest = {
    collection: string;
    database?: string;
};

export type StatsResponse = {
    stats: BSON.Document | null;
    error?: string;
};

// Create types for AI-powered query generation
export interface AIQueryRequest extends Record<string, string | undefined> {
    collection: string;
    naturalLanguageQuery: string;
    query?: string;
    modelId?: string;
    database?: string;
}

export interface AIQueryResponse {
    query: string;
    error?: string;
    cost?: { totalCost: number };
} 