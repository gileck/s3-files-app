import { MongoClient, Db, Collection, Document, ListCollectionsOptions } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnecting = false;
let connectionPromise: Promise<Db> | null = null;

export async function connectToDatabase(): Promise<Db> {
    if (db) return db;

    if (connectionPromise) return connectionPromise;

    if (isConnecting) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (db) {
                    clearInterval(interval);
                    resolve(db);
                }
            }, 100);
        });
    }

    isConnecting = true;

    connectionPromise = new Promise(async (resolve, reject) => {
        try {
            const uri = process.env.MONGO_URI || "mongodb+srv://gileck:EdzaigZENXq1tkmT@cluster0.yepuugh.mongodb.net/trainingPlanDb?retryWrites=true&w=majority&appName=Cluster0";

            // console.log('MongoDB URI:', uri);

            if (!uri) {
                throw new Error('MONGO_URI environment variable is not defined');
            }

            client = new MongoClient(uri);
            await client.connect();
            db = client.db("trainingPlanDb");

            console.log('Connected to MongoDB:', db.databaseName);
            isConnecting = false;
            resolve(db);
        } catch (error) {
            isConnecting = false;
            connectionPromise = null;
            console.error('MongoDB connection error:', error);
            reject(error);
        }
    });

    return connectionPromise;
}

export async function getCollection<T extends Document = Document>(collectionName: string): Promise<Collection<T>> {
    const db = await connectToDatabase();
    return db.collection<T>(collectionName);
}

export async function listCollections(options: ListCollectionsOptions = {}): Promise<string[]> {
    const db = await connectToDatabase();

    // Log info about the database
    console.log('Listing collections from database:', db.databaseName);

    // Include system collections for debugging
    const collections = await db.listCollections(undefined, options).toArray();
    console.log('Raw collections list:', collections);

    const collectionNames = collections.map(collection => collection.name);
    console.log('Collection names:', collectionNames);

    return collectionNames;
}

export async function closeConnection(): Promise<void> {
    if (client) {
        await client.close();
        client = null;
        db = null;
        connectionPromise = null;
    }
} 