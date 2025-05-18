import { Db, Collection, Document, ListCollectionsOptions } from 'mongodb';
import { dbContext } from './context';
import { MongoClient } from 'mongodb';
import { appConfig } from '@/app.config'; // Assuming appConfig provides default DB name

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    throw new Error('Please define the MONGO_URI environment variable');
}

const client = new MongoClient(MONGO_URI);

// Internal function for establishing a raw database connection
async function _establishConnection(dbName?: string): Promise<Db> {
    await client.connect();
    return client.db(dbName);
}

// Export the internal function with a specific name for context.ts to import
export { _establishConnection as connectToDatabaseClient };

export async function connectToDatabase(dbName?: string): Promise<Db> {
    return dbContext.useDatabase(dbName);
}

export async function getCollection<T extends Document = Document>(collectionName: string, dbName?: string): Promise<Collection<T>> {
    const db = await connectToDatabase(dbName);
    return db.collection<T>(collectionName);
}

export async function listCollections(dbName: string, options: ListCollectionsOptions = {}): Promise<string[]> {
    const db = await connectToDatabase(dbName);

    // Log info about the database
    console.log('Listing collections from database:', db.databaseName);

    // Include all collections including system collections
    const enhancedOptions = {
        ...options,
        nameOnly: true,
        authorizedCollections: true
    };

    const collections = await db.listCollections(undefined, enhancedOptions).toArray();
    console.log('Raw collections list:', collections);

    const collectionNames = collections.map(collection => collection.name);
    console.log('Collection names:', collectionNames);

    return collectionNames;
}

export async function listDatabases(): Promise<string[]> {
    try {
        const adminDb = client.db('admin');
        const databasesList = await adminDb.admin().listDatabases();

        // Filter out admin, local, and config databases
        const filteredDatabases = databasesList.databases
            .filter(db => !['admin', 'local', 'config'].includes(db.name))
            .map(db => db.name);

        return filteredDatabases;
    } catch (error) {
        console.error('Error listing databases:', error);
        throw error;
    }
}

export async function closeConnection(): Promise<void> {
    await dbContext.reset();
} 