import { getCollection } from './index';
import { Filter, Document, FindOptions, UpdateFilter, UpdateOptions, InsertOneOptions, DeleteOptions, WithId, BSON, ObjectId, DeleteResult, Collection } from 'mongodb';
import { dbContext, connectToDatabase } from './context';

export type DocumentId = string | ObjectId;

/**
 * Converts a string ID to an ObjectId, or returns the ObjectId if it already is one.
 * Throws an error for invalid IDs.
 */
export function toObjectId(id: DocumentId): ObjectId {
    if (typeof id === 'string') {
        if (ObjectId.isValid(id)) {
            return new ObjectId(id);
        }
        throw new Error(`Invalid ObjectId string: ${id}`);
    }
    return id; // Already an ObjectId
}

/**
 * Helper function to convert date strings in a query object to Date objects.
 * Looks for keys named "$date" and attempts to convert their string values.
 */
export function convertDates(query: any): any {
    if (typeof query !== 'object' || query === null) return query;
    if (Array.isArray(query)) return query.map(convertDates);

    const newQuery: any = {};
    for (const key in query) {
        if (query.hasOwnProperty(key)) {
            if (key === '$date' && typeof query[key] === 'string') {
                const date = new Date(query[key]);
                if (!isNaN(date.getTime())) return date;
            }
            newQuery[key] = convertDates(query[key]);
        }
    }
    return newQuery;
}

/**
 * Helper function to convert string IDs in a query object to ObjectId objects.
 * Specifically targets fields like _id, userId, etc. (customize as needed).
 * This is a basic example; enhance with more sophisticated schema awareness if possible.
 */
export function convertIdFields(query: any): any {
    if (typeof query !== 'object' || query === null) return query;
    if (Array.isArray(query)) return query.map(convertIdFields);

    const newQuery: any = {};
    const idFieldNames = ['_id', 'userId', 'itemId', 'orderId', 'sessionId']; // Common ID fields

    for (const key in query) {
        if (query.hasOwnProperty(key)) {
            const value = query[key];
            if (idFieldNames.includes(key) && typeof value === 'string' && ObjectId.isValid(value)) {
                newQuery[key] = new ObjectId(value);
            } else if (typeof value === 'object' && value !== null && '$oid' in value && typeof value.$oid === 'string' && ObjectId.isValid(value.$oid)) {
                // Handle { $oid: "..." } structure specifically for the field value itself
                newQuery[key] = new ObjectId(value.$oid);
            } else {
                newQuery[key] = convertIdFields(value);
            }
        }
    }
    return newQuery;
}

export async function findDocuments<T extends Document = Document>(
    collectionName: string,
    filter: Filter<T> = {},
    options: FindOptions<T> = {},
    database?: string
): Promise<WithId<T>[]> {
    let collection: Collection<T>;
    if (database) {
        collection = await getCollection<T>(collectionName, database);
    } else {
        const db = await dbContext.getDb();
        collection = db.collection<T>(collectionName);
    }
    return collection.find(filter, options).toArray();
}

export async function findDocument<T extends Document = Document>(
    collectionName: string,
    filter: Filter<T>,
    database?: string
): Promise<WithId<T> | null> {
    let col: Collection<T>;
    if (database) {
        col = await getCollection<T>(collectionName, database);
    } else {
        const db = await dbContext.getDb();
        col = db.collection<T>(collectionName);
    }
    return col.findOne(filter);
}

// Get a document by ID
export async function getDocumentById<T extends Document>(
    collectionName: string,
    id: DocumentId,
    database?: string
): Promise<WithId<T> | null> {
    const collection = await getCollection<T>(collectionName, database);
    return collection.findOne({ _id: toObjectId(id) } as Filter<T>);
}

export async function updateDocument<T extends Document = Document>(
    collectionName: string,
    filter: Filter<T> | DocumentId,
    update: UpdateFilter<T> | Partial<T> | Record<string, unknown>,
    options: UpdateOptions = {},
    database?: string
): Promise<boolean> {
    const collection = await getCollection<T>(collectionName, database);
    const finalFilter = typeof filter === 'string' || filter instanceof ObjectId
        ? { _id: toObjectId(filter) } as Filter<T>
        : filter;
    const finalUpdate = update && typeof update === 'object' && Object.keys(update).every(k => !k.startsWith('$'))
        ? { $set: update }
        : update;
    const result = await collection.updateOne(finalFilter, finalUpdate as UpdateFilter<T>, options);
    return result.acknowledged;
}

export async function insertDocument<T extends Document = Document>(
    collectionName: string,
    document: Omit<T, '_id'> | Record<string, unknown>,
    options: InsertOneOptions = {},
    database?: string
): Promise<string | null> {
    const collection = await getCollection<T>(collectionName, database);
    const docToInsert = { ...document } as any;
    const result = await collection.insertOne(docToInsert, options);
    return result.acknowledged ? result.insertedId.toString() : null;
}

export async function deleteDocument<T extends Document = Document>(
    collectionName: string,
    filter: Filter<T> | DocumentId,
    options: DeleteOptions = {},
    database?: string
): Promise<boolean> {
    const collection = await getCollection<T>(collectionName, database);
    const finalFilter = typeof filter === 'string' || filter instanceof ObjectId
        ? { _id: toObjectId(filter) } as Filter<T>
        : filter;
    const result = await collection.deleteOne(finalFilter, options);
    return result.acknowledged && result.deletedCount > 0;
}

// Delete all documents in a collection
export async function deleteAllDocuments<T extends Document = Document>(
    collectionName: string,
    filter: Filter<T> = {},
    database?: string
): Promise<DeleteResult> {
    const collection = await getCollection<T>(collectionName, database);
    return collection.deleteMany(filter);
}

export async function countDocuments<T extends Document = Document>(
    collectionName: string,
    filter: Filter<T> = {},
    database?: string
): Promise<number> {
    const collection = await getCollection<T>(collectionName, database);
    return collection.countDocuments(filter);
}

export async function executeQuery<T extends Document = Document>(
    collectionName: string,
    query: string,
    database?: string
): Promise<WithId<T>[]> {
    const collection = await getCollection<T>(collectionName, database); // Ensure collection uses explicit DB for safety
    try {
        let parsedQuery: Filter<Document>;
        try {
            const rawQuery = JSON.parse(query);
            const withDatesConverted = convertDates(rawQuery);
            parsedQuery = convertIdFields(withDatesConverted) as Filter<Document>;
            if (typeof parsedQuery !== 'object' || parsedQuery === null || Array.isArray(parsedQuery)) {
                throw new Error('Query must be a valid JSON object.');
            }
        } catch (parseError: any) {
            throw new Error(`Invalid query format: ${parseError.message}`);
        }
        const res = await collection.find(parsedQuery as unknown as Filter<T>).toArray();
        return res;
    } catch (error: any) {
        console.error('Error executing query:', error);
        if (error.message.startsWith('Invalid query format')) {
            throw error;
        }
        throw new Error('Failed to execute query.');
    }
}

export async function getCollectionStats(
    collectionName: string,
    database?: string
): Promise<BSON.Document> {
    const db = await connectToDatabase(database); // connectToDatabase sets context
    const result = await db.command({ collStats: collectionName });
    return result;
}

// Create a new collection
export async function createCollection(name: string, database?: string) {
    const db = await connectToDatabase(database); // Use specific DB if provided, else context default
    return db.createCollection(name);
}

// Delete a collection
export async function deleteCollection(name: string, database?: string) {
    const db = await connectToDatabase(database); // Use specific DB if provided, else context default
    return db.collection(name).drop();
} 