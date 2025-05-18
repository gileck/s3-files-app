import { useState, useEffect } from 'react';
import { fetchDatabases } from '../../apis/mongodb/client';

interface UseDatabasesOptions {
    autoFetch?: boolean;
}

export function useDatabases(options: UseDatabasesOptions = {}) {
    const { autoFetch = true } = options;
    const [databases, setDatabases] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchDatabasesData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetchDatabases();

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            setDatabases(response.data.databases || []);
        } catch (err) {
            if (err instanceof Error) {
                setError(err);
            } else {
                setError(new Error(String(err)));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoFetch) {
            fetchDatabasesData();
        }
    }, [autoFetch]);

    return {
        databases,
        loading,
        error,
        fetchDatabases: fetchDatabasesData
    };
} 