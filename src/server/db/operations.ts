import { getCollection, connectToDatabase } from './index';
import { Filter, Document, FindOptions, UpdateFilter, UpdateOptions, InsertOneOptions, DeleteOptions, WithId, BSON, ObjectId, DeleteResult } from 'mongodb';

export type DocumentId = string | ObjectId;

// Convert string ID to ObjectId
export function toObjectId(id: DocumentId): ObjectId {
    return typeof id === 'string' ? new ObjectId(id) : id;
}

// Helper function to recursively convert $date objects to Date instances and $oid to ObjectId
function convertDates(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Check if this is a $date object
    if (typeof obj === 'object' && obj !== null && '$date' in obj && typeof obj.$date === 'string') {
        return new Date(obj.$date as string);
    }

    // Check if this is an $oid object
    if (typeof obj === 'object' && obj !== null && '$oid' in obj && typeof obj.$oid === 'string') {
        return new ObjectId(obj.$oid as string);
    }

    // If it's an array, recursively process each item
    if (Array.isArray(obj)) {
        return obj.map(item => convertDates(item));
    }

    // If it's an object, recursively process each property
    if (typeof obj === 'object' && obj !== null) {
        const result: Record<string, unknown> = {};
        for (const key in obj as Record<string, unknown>) {
            result[key] = convertDates((obj as Record<string, unknown>)[key]);
        }
        return result;
    }

    // Return primitive values as is
    return obj;
}

// Helper function to automatically convert potential ObjectId string fields
function convertIdFields(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
        return obj;
    }

    // Handle _id field directly if it's a string that looks like an ObjectId
    if (typeof obj === 'object' && obj !== null && '_id' in obj && typeof obj._id === 'string' && /^[0-9a-fA-F]{24}$/.test(obj._id as string)) {
        (obj as Record<string, unknown>)._id = new ObjectId(obj._id as string);
    }

    // Handle other potential ID fields (fields ending with Id)
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        const result: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            if (
                key !== '_id' &&
                (key.endsWith('Id') || key === 'id') &&
                typeof value === 'string' &&
                /^[0-9a-fA-F]{24}$/.test(value)
            ) {
                // Convert strings that look like ObjectIds to ObjectId instances
                result[key] = new ObjectId(value);
            } else {
                // Process nested objects and arrays
                result[key] = convertIdFields(value);
            }
        }
        return result;
    }

    // Process arrays recursively
    if (Array.isArray(obj)) {
        return obj.map(item => convertIdFields(item));
    }

    return obj;
}

export async function findDocuments<T extends Document>(
    collectionName: string,
    filter: Filter<T> = {},
    options: FindOptions<T> = {}
): Promise<WithId<T>[]> {
    const collection = await getCollection<T>(collectionName);
    return collection.find(filter, options).toArray();
}

export async function findDocument<T extends Document>(
    collectionName: string,
    filter: Filter<T>
): Promise<WithId<T> | null> {
    const collection = await getCollection<T>(collectionName);
    return collection.findOne(filter);
}

// Get a document by ID
export async function getDocumentById<T extends Document>(
    collectionName: string,
    id: DocumentId
): Promise<WithId<T> | null> {
    const collection = await getCollection<T>(collectionName);
    return collection.findOne({ _id: toObjectId(id) } as Filter<T>);
}

export async function updateDocument<T extends Document>(
    collectionName: string,
    filter: Filter<T> | DocumentId,
    update: UpdateFilter<T> | Partial<T> | Record<string, unknown>,
    options: UpdateOptions = {}
): Promise<boolean> {
    const collection = await getCollection<T>(collectionName);

    // If first parameter is a DocumentId, convert it to a filter
    const finalFilter = typeof filter === 'string' || filter instanceof ObjectId
        ? { _id: toObjectId(filter) } as Filter<T>
        : filter;

    // Add $set if not already an update operator
    const finalUpdate = update && typeof update === 'object' && !('$set' in update) && !('$push' in update) && !('$pull' in update)
        ? { $set: update }
        : update;

    const result = await collection.updateOne(finalFilter, finalUpdate as UpdateFilter<T>, options);
    return result.acknowledged;
}

export async function insertDocument<T extends Document>(
    collectionName: string,
    document: Omit<T, '_id'> | Record<string, unknown>,
    options: InsertOneOptions = {}
): Promise<string | null> {
    const collection = await getCollection<T>(collectionName);
    // Cast to any to bypass TypeScript type checks with MongoDB types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docToInsert = { ...document } as any;

    const result = await collection.insertOne(docToInsert, options);
    return result.acknowledged ? result.insertedId.toString() : null;
}

export async function deleteDocument<T extends Document>(
    collectionName: string,
    filter: Filter<T> | DocumentId,
    options: DeleteOptions = {}
): Promise<boolean> {
    const collection = await getCollection<T>(collectionName);

    // If first parameter is a DocumentId, convert it to a filter
    const finalFilter = typeof filter === 'string' || filter instanceof ObjectId
        ? { _id: toObjectId(filter) } as Filter<T>
        : filter;

    const result = await collection.deleteOne(finalFilter, options);
    return result.acknowledged && result.deletedCount > 0;
}

// Delete all documents in a collection
export async function deleteAllDocuments<T extends Document>(
    collectionName: string
): Promise<DeleteResult> {
    const collection = await getCollection<T>(collectionName);
    return collection.deleteMany({});
}

export async function countDocuments<T extends Document>(
    collectionName: string,
    filter: Filter<T> = {}
): Promise<number> {
    const collection = await getCollection<T>(collectionName);
    return collection.countDocuments(filter);
}

export async function executeQuery<T extends Document>(
    collectionName: string,
    query: string
): Promise<WithId<T>[]> {
    try {
        let parsedQuery: Filter<Document>;
        try {
            // Parse the query and convert any $date objects to actual Date objects
            const rawQuery = JSON.parse(query);

            // First convert special formats ($date, $oid)
            const withDatesConverted = convertDates(rawQuery);

            // Then attempt to convert regular ID fields
            parsedQuery = convertIdFields(withDatesConverted) as Filter<Document>;

            console.log('Original query:', rawQuery);
            console.log('Converted query:', parsedQuery);

            if (typeof parsedQuery !== 'object' || parsedQuery === null || Array.isArray(parsedQuery)) {
                throw new Error('Query must be a valid JSON object.');
            }
        } catch (parseError) {
            console.error('Invalid JSON query format:', parseError);
            throw new Error(`Invalid query format: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
        }
        const collection = await getCollection<T>(collectionName);

        // Need to use `as unknown as Filter<T>` to satisfy the type checker
        const res = await collection.find(parsedQuery as unknown as Filter<T>).toArray();
        console.log('Query results:', res);
        return res;
    } catch (error) {
        console.error('Error executing query:', error);
        if (error instanceof Error && error.message.startsWith('Invalid query format')) {
            throw error;
        }
        throw new Error('Failed to execute query.');
    }
}

export async function getCollectionStats(collectionName: string): Promise<BSON.Document> {
    const db = await connectToDatabase();
    const result = await db.command({ collStats: collectionName });
    return result;
}

// Create a new collection
export async function createCollection(name: string) {
    const db = await connectToDatabase();
    return db.createCollection(name);
}

// Delete a collection
export async function deleteCollection(name: string) {
    const db = await connectToDatabase();
    return db.collection(name).drop();
} 