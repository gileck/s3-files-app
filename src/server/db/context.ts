import { Db } from 'mongodb';
import { connectToDatabaseClient as connectToDatabaseRaw } from './index';
// import { appConfig } from '@/app.config'; // No longer needed here if default DB is handled in connectToDatabaseClient

// Global context to track the current database
class MongoDBContext {
    private currentDb: Db | null = null;
    private currentDbName: string = '';

    // Get the current database connection
    async getDb(): Promise<Db> {
        if (!this.currentDb) {
            this.currentDb = await connectToDatabaseRaw(this.currentDbName);
        }
        return this.currentDb;
    }

    // Switch to a different database
    async useDatabase(dbName?: string): Promise<Db> {
        this.currentDbName = dbName || '';
        this.currentDb = await connectToDatabaseRaw(dbName);
        return this.currentDb;
    }

    // Get current database name
    getCurrentDbName(): string {
        return this.currentDbName;
    }

    // Reset the context
    reset(): void {
        this.currentDb = null;
    }
}

// Create a singleton instance
export const dbContext = new MongoDBContext();

// Simplified connect function that uses the context
export async function connectToDatabase(dbName?: string): Promise<Db> {
    return dbContext.useDatabase(dbName);
}

// Get the current database connection
export async function getCurrentDb(): Promise<Db> {
    return dbContext.getDb();
} 