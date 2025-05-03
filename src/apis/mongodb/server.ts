import {
    /* CollectionsRequest, */ CollectionsResponse, DocumentsRequest, DocumentsResponse,
    ModifyDocumentRequest, ModifyDocumentResponse, QueryRequest, QueryResponse,
    StatsRequest, StatsResponse, AIQueryRequest, AIQueryResponse
} from './types';
import { collectionsApiName, documentsApiName, modifyDocumentApiName, queryApiName, statsApiName, aiQueryApiName, name } from './index';
import { listCollections, connectToDatabase } from '../../server/db';
import { findDocuments, findDocument, insertDocument, updateDocument, deleteDocument, deleteAllDocuments, countDocuments, executeQuery, getCollectionStats } from '../../server/db/operations';
import { ObjectId, Document, Filter } from 'mongodb';
import { AIModelAdapter } from '../../server/ai/baseModelAdapter';

// Export API names
export { name, collectionsApiName, documentsApiName, modifyDocumentApiName, queryApiName, statsApiName, aiQueryApiName };

// Collections API
export const getCollections = async (): Promise<CollectionsResponse> => {
    try {
        console.log('API: Getting collections...');

        // Get the connected database instance for additional info
        const db = await connectToDatabase();
        console.log('Connected database name:', db.databaseName);

        // Try listing all collections including system collections
        const collections = await listCollections({
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
        const { collection, limit = 100, skip = 0, query = {}, id } = request;

        if (id) {
            try {
                const document = await findDocument(collection, { _id: new ObjectId(id) });

                if (!document) {
                    return { error: 'Document not found' };
                }

                return { document };
            } catch (fetchError) {
                console.error('Invalid document ID error:', fetchError);
                return { error: 'Invalid document ID' };
            }
        }

        const documents = await findDocuments(collection, query as Filter<Document>, {
            limit,
            skip
        });

        const total = await countDocuments(collection, query as Filter<Document>);

        return {
            documents,
            pagination: {
                total,
                limit,
                skip
            }
        };
    } catch (error) {
        console.error('Error fetching documents:', error);
        return {
            error: `Failed to fetch documents: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};

// Modify Document API
export const modifyDocument = async (request: ModifyDocumentRequest): Promise<ModifyDocumentResponse> => {
    try {
        const { collection, id, document } = request;

        // Check for delete operations
        if (document._delete === true && id) {
            // Delete a single document
            try {
                console.log(`Deleting document with ID ${id} from collection ${collection}`);
                const success = await deleteDocument(collection, new ObjectId(id));

                if (!success) {
                    return { success: false, error: 'Document not found or delete failed' };
                }

                return { success: true };
            } catch (deleteError) {
                console.error('Error deleting document:', deleteError);
                return { success: false, error: 'Failed to delete document' };
            }
        }

        // Check for delete all operations
        if (document._deleteAll === true) {
            // Delete all documents in the collection
            try {
                console.log(`Deleting all documents from collection ${collection}`);
                const result = await deleteAllDocuments(collection);

                return {
                    success: true,
                    deletedCount: result.deletedCount ?? 0
                };
            } catch (deleteAllError) {
                console.error('Error deleting all documents:', deleteAllError);
                return { success: false, error: 'Failed to delete all documents' };
            }
        }

        // Handle insert (no id provided)
        if (!id) {
            try {
                console.log(`Inserting new document into collection ${collection}:`, document);

                // Remove any MongoDB specific properties that might cause issues
                const cleanDoc = { ...document };
                delete cleanDoc._id;
                delete cleanDoc._delete;
                delete cleanDoc._deleteAll;

                const insertedId = await insertDocument(collection, cleanDoc);
                console.log(`Document inserted with ID: ${insertedId}`);

                if (!insertedId) {
                    console.error('Insert failed: No insertedId returned');
                    return { success: false, error: 'Failed to insert document' };
                }

                return { success: true, insertedId };
            } catch (insertError) {
                console.error('Error inserting document:', insertError);
                return {
                    success: false,
                    error: `Failed to insert document: ${insertError instanceof Error ? insertError.message : String(insertError)}`
                };
            }
        }

        // Handle update (id provided)
        try {
            console.log(`Updating document ${id} in collection ${collection}:`, document);
            const success = await updateDocument(
                collection,
                { _id: new ObjectId(id) },
                { $set: document }
            );

            if (!success) {
                return { success: false, error: 'Document not found or update failed' };
            }

            return { success: true };
        } catch (updateError) {
            console.error('Invalid document ID during update:', updateError);
            return { success: false, error: 'Invalid document ID' };
        }
    } catch (error) {
        console.error('Error modifying document:', error);
        return {
            success: false,
            error: `Failed to modify document: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};

// Query API
export const executeCustomQuery = async (request: QueryRequest): Promise<QueryResponse> => {
    try {
        const { collection, query } = request;

        if (!query) {
            return { results: [], error: 'Query is required' };
        }

        const results = await executeQuery(collection, query);

        return { results };
    } catch (error) {
        console.error('Error executing query:', error);
        return {
            results: [],
            error: `Failed to execute query: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};

// Stats API
export const getStats = async (request: StatsRequest): Promise<StatsResponse> => {
    try {
        const { collection } = request;

        const stats = await getCollectionStats(collection);

        return { stats };
    } catch (error) {
        console.error('Error fetching collection stats:', error);
        return {
            stats: {},
            error: `Failed to fetch collection stats: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};

// AI Query Generation API
export const generateAIQuery = async (request: AIQueryRequest): Promise<AIQueryResponse> => {
    try {
        const { collection, naturalLanguageQuery, modelId = 'gemini-1.5-pro' } = request;

        if (!naturalLanguageQuery) {
            return { query: '{}', error: 'Natural language query is required' };
        }

        // Get a few example documents from the collection to help the AI understand the structure
        let exampleDocs: Document[] = [];
        try {
            exampleDocs = await findDocuments(collection, {}, { limit: 5 });
            console.log(`Retrieved ${exampleDocs.length} example documents for AI context`);
        } catch (error) {
            console.warn(`Could not fetch example documents: ${error}`);
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