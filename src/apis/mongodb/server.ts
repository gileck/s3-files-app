import {
    /* CollectionsRequest, */ CollectionsResponse, DocumentsRequest, DocumentsResponse,
    ModifyDocumentRequest, ModifyDocumentResponse, QueryRequest, QueryResponse,
    StatsRequest, StatsResponse, AIQueryRequest, AIQueryResponse, DatabasesResponse
} from './types';
import { databasesApiName, collectionsApiName, documentsApiName, modifyDocumentApiName, queryApiName, statsApiName, aiQueryApiName, name } from './index';
import { listCollections, listDatabases } from '../../server/db';
import { findDocuments, findDocument, insertDocument, updateDocument, deleteDocument, deleteAllDocuments, countDocuments, executeQuery, getCollectionStats } from '../../server/db/operations';
import { ObjectId, Document, Filter } from 'mongodb';
import { AIModelAdapter } from '../../server/ai/baseModelAdapter';
import { dbContext, connectToDatabase } from '../../server/db/context';

// Export API names
export { name, databasesApiName, collectionsApiName, documentsApiName, modifyDocumentApiName, queryApiName, statsApiName, aiQueryApiName };

// Databases API
export const getDatabases = async (): Promise<DatabasesResponse> => {
    try {
        console.log('API: Getting databases...');
        const databases = await listDatabases();
        console.log('Returning databases to client:', databases);
        return { databases };
    } catch (error) {
        console.error('Error fetching databases:', error);
        return {
            databases: [],
            error: `Failed to fetch databases: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};

// Collections API
export const getCollections = async (database?: string): Promise<CollectionsResponse> => {
    try {
        console.log('API: Getting collections...', database ? `for database: ${database}` : '(No database specified)');

        if (!database) {
            console.error('Error: Database name not provided to getCollections API.');
            return {
                collections: [],
                error: 'Database name must be provided to list collections.'
            };
        }


        const collections = await listCollections(database, {
            nameOnly: false,
            authorizedCollections: false
        });

        console.log('Returning collections to client:', collections);
        return { collections };
    } catch (error) {
        console.error('Error fetching collections:', error);
        return {
            collections: [],
            error: `Failed to fetch collections: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};

// Documents API
export const getDocuments = async (request: DocumentsRequest): Promise<DocumentsResponse> => {
    try {
        const { collection, limit = 100, skip = 0, query = {}, id, database, documentId } = request;

        // console.log('API: getDocuments called with params:', { collection, limit, skip, query: JSON.stringify(query), id, documentId, database });

        // No longer need to set context here if operations always receive 'database' param
        // if (database) {
        //     await connectToDatabase(database);
        //     // console.log('Switched to database context:', database);
        // }

        if (id || documentId) {
            const docId = id || documentId;
            try {
                // console.log(`Finding document with ID ${docId} in collection ${collection} using DB: ${database}`);
                const document = await findDocument(collection, { _id: new ObjectId(docId) }, database);
                if (!document) {
                    return { error: 'Document not found' };
                }
                return { document };
            } catch (fetchError: any) {
                // console.error('Invalid document ID error:', fetchError);
                return { error: `Invalid document ID or query error: ${fetchError.message}` };
            }
        }

        // console.log(`Finding documents in collection ${collection} with query: ${JSON.stringify(query)} using DB: ${database}`);
        const documents = await findDocuments(collection, query as Filter<Document>, { limit, skip }, database);
        const total = await countDocuments(collection, query as Filter<Document>, database);

        return {
            documents,
            pagination: { total, limit, skip }
        };
    } catch (error: any) {
        // console.error('Error fetching documents:', error);
        return { error: `Failed to fetch documents: ${error.message}` };
    }
};

// Modify Document API
export const modifyDocument = async (request: ModifyDocumentRequest): Promise<ModifyDocumentResponse> => {
    try {
        const { collection, id, document, database } = request;

        // No longer need to set context here if operations always receive 'database' param
        // if (database) {
        //     await connectToDatabase(database);
        // }

        if (document._delete === true && id) {
            try {
                const success = await deleteDocument(collection, new ObjectId(id), {}, database);
                if (!success) return { success: false, error: 'Document not found or delete failed' };
                return { success: true };
            } catch (deleteError: any) {
                return { success: false, error: `Failed to delete document: ${deleteError.message}` };
            }
        }

        if (document._deleteAll === true) {
            try {
                const result = await deleteAllDocuments(collection, {}, database);
                return { success: true, deletedCount: result.deletedCount ?? 0 };
            } catch (deleteAllError: any) {
                return { success: false, error: `Failed to delete all documents: ${deleteAllError.message}` };
            }
        }

        if (!id) { // Insert
            try {
                const cleanDoc = { ...document };
                delete cleanDoc._id; delete cleanDoc._delete; delete cleanDoc._deleteAll;
                const insertedId = await insertDocument(collection, cleanDoc, {}, database);
                if (!insertedId) return { success: false, error: 'Failed to insert document' };
                return { success: true, insertedId };
            } catch (insertError: any) {
                return { success: false, error: `Failed to insert document: ${insertError.message}` };
            }
        }

        // Update
        try {
            const cleanUpdateDoc = { ...document }; // Ensure _id, _delete, etc., are not in $set if they were accidentally passed
            delete cleanUpdateDoc._id; delete cleanUpdateDoc._delete; delete cleanUpdateDoc._deleteAll;

            const success = await updateDocument(collection, new ObjectId(id), { $set: cleanUpdateDoc }, {}, database);
            if (!success) return { success: false, error: 'Document not found or update failed' };
            return { success: true };
        } catch (updateError: any) {
            return { success: false, error: `Failed to update document: ${updateError.message}` };
        }

    } catch (error: any) {
        return { success: false, error: `Failed to modify document: ${error.message}` };
    }
};

// Query API
export const executeCustomQuery = async (request: QueryRequest): Promise<QueryResponse> => {
    try {
        const { collection, query, database } = request;
        // if (database) { await connectToDatabase(database); } // Context setting less critical if passed explicitly
        if (!query) return { results: [], error: 'Query is required' };
        const results = await executeQuery(collection, query, database);
        return { results };
    } catch (error: any) {
        return { results: [], error: `Failed to execute query: ${error.message}` };
    }
};

// Stats API
export const getStats = async (request: StatsRequest): Promise<StatsResponse> => {
    try {
        const { collection, database } = request;
        // if (database) { await connectToDatabase(database); } // Context setting less critical if passed explicitly
        if (!collection) return { stats: {}, error: 'Collection name is required for stats' };
        const stats = await getCollectionStats(collection, database);
        return { stats };
    } catch (error: any) {
        return { stats: {}, error: `Failed to fetch collection stats: ${error.message}` };
    }
};

// AI Query Generation API
export const generateAIQuery = async (request: AIQueryRequest): Promise<AIQueryResponse> => {
    try {
        const { collection, naturalLanguageQuery, modelId = 'gemini-1.5-pro', database } = request;
        // if (database) { await connectToDatabase(database); } // Context setting less critical

        if (!naturalLanguageQuery) return { query: '{}', error: 'Natural language query is required' };
        if (!collection) return { query: '{}', error: 'Collection name is required for AI query' };

        let exampleDocs: Document[] = [];
        try {
            // findDocuments now takes database as the 4th argument
            exampleDocs = await findDocuments(collection, {}, { limit: 5 }, database);
        } catch (error: any) {
            console.warn(`Could not fetch example documents for AI query: ${error.message}`);
        }

        // Format example documents as string
        const examplesText = exampleDocs.length > 0
            ? `\nHere are ${exampleDocs.length} example documents from the collection to help you understand the structure:\n${JSON.stringify(exampleDocs, null, 2)}\n`
            : '';

        // Get current date information
        const now = new Date();
        const currentDateInfo = `
        Current date information (use this for any relative time references):
        - Current date: ${now.toISOString()}
        - Today: ${now.toISOString().split('T')[0]}
        - Current year: ${now.getFullYear()}
        - Current month: ${now.getMonth() + 1}
        - Current day: ${now.getDate()}
        - Current hour: ${now.getHours()}
        - Current minute: ${now.getMinutes()}
        - Current second: ${now.getSeconds()}
        `;

        // Initialize the AI model adapter
        const adapter = new AIModelAdapter(modelId);

        // Construct the prompt
        const prompt = `
        You are a MongoDB query generator. Your task is to convert natural language queries into valid MongoDB queries.
        
        Collection: ${collection}
        ${examplesText}
        ${currentDateInfo}
        
        Natural language query: "${naturalLanguageQuery}"
        
        IMPORTANT QUERY FORMATTING INSTRUCTIONS:
        1. For date fields, always use the proper MongoDB Extended JSON format:
           - For date objects: {"$date": "YYYY-MM-DDTHH:MM:SS.SSSZ"}
           - Example of a date query: {"createdAt":{"$gte":{"$date":"2023-05-02T00:00:00.000Z"}}}
        
        2. For ObjectId fields, use the Extended JSON format:
           - For ObjectIds: {"$oid": "507f1f77bcf86cd799439011"}
           - Example of an ObjectId query: {"_id":{"$oid":"507f1f77bcf86cd799439011"}}
        
        3. Date operation examples:
           - Find documents created in the last 7 days: {"createdAt":{"$gte":{"$date":"2023-05-02T00:00:00.000Z"}}}
           - Find documents created on a specific date: {"createdAt":{"$gte":{"$date":"2023-05-02T00:00:00.000Z"},"$lt":{"$date":"2023-05-03T00:00:00.000Z"}}}
           - Find documents created before a specific date: {"createdAt":{"$lt":{"$date":"2023-05-02T00:00:00.000Z"}}}
        
        4. NEVER use plain string format for dates or ObjectIds.
        
        Convert this to a MongoDB query object. Return ONLY valid JSON for a MongoDB query object, with no explanation or other text.
        Your response must be a valid MongoDB query that can be directly parsed as JSON.
        `;

        // Process the prompt and get the response
        const response = await adapter.processPromptToJSON<{ query: string }>(prompt, 'mongodb/aiQuery');

        // Clean up any non-JSON output
        let queryJson = response.result.query || response.result;

        // If queryJson is a string not already an object, ensure it's proper JSON
        if (typeof queryJson === 'string') {
            try {
                // Make sure it's valid JSON
                JSON.parse(queryJson);
            } catch (error) {
                // If it's not valid JSON, try to extract JSON from the response
                console.error('Error parsing AI-generated JSON:', error);
                const jsonMatch = queryJson.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    queryJson = jsonMatch[0];
                } else {
                    throw new Error('Failed to extract valid JSON from AI response');
                }
            }
        } else {
            // If it's already an object, stringify it
            queryJson = JSON.stringify(queryJson);
        }

        return {
            query: queryJson,
            cost: response.cost
        };
    } catch (error) {
        console.error('Error generating AI query:', error);
        return {
            query: '{}',
            error: `Failed to generate query: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}; 