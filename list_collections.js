const uri = "mongodb+srv://gileck:EdzaigZENXq1tkmT@cluster0.yepuugh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to the MongoDB cluster
db = connect(uri);

// Get list of all databases
const dbs = db.adminCommand({ listDatabases: 1 });

// For each database, print its collections
print("\n=== ALL DATABASES AND COLLECTIONS ===");
dbs.databases.forEach(database => {
    const dbName = database.name;
    // Skip admin, local, and config databases
    if (dbName !== "admin" && dbName !== "local" && dbName !== "config") {
        print(`\nDatabase: ${dbName}`);

        // Connect to this database
        const currentDb = db.getSiblingDB(dbName);

        // Get all collections
        const collections = currentDb.getCollectionNames();

        if (collections.length === 0) {
            print("  No collections");
        } else {
            collections.forEach(collection => {
                print(`  - ${collection}`);

                // Count documents in this collection
                const count = currentDb[collection].countDocuments();
                print(`    Documents: ${count}`);
            });
        }
    }
}); 