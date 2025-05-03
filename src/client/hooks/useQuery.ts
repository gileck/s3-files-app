import { useState, useCallback } from 'react';
import { executeQuery } from '../../apis/mongodb/client';
import { WithId, Document } from 'mongodb';

export function useQuery() {
    const [results, setResults] = useState<WithId<Document>[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Use useCallback to memoize the runQuery function to prevent infinite loop
    const runQuery = useCallback(async (collection: string, query: string) => {
        if (!collection || !query) {
            setError(new Error('Collection and query are required'));
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Parse the query string to ensure it's valid JSON
            let parsedQuery: Record<string, unknown>;
            try {
                // Validate JSON
                parsedQuery = JSON.parse(query);

                // Make sure it's an object
                if (typeof parsedQuery !== 'object' || parsedQuery === null || Array.isArray(parsedQuery)) {
                    throw new Error('Query must be a valid JSON object');
                }
            } catch (parseError) {
                throw new Error(`Invalid query format: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
            }

            const response = await executeQuery({
                collection,
                query
            });

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            setResults(response.data.results || []);
        } catch (err) {
            console.error('Query execution error:', err);
            if (err instanceof Error) {
                setError(err);
            } else {
                setError(new Error(String(err)));
            }
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        results,
        loading,
        error,
        runQuery
    };
} 