import { useState, useEffect } from 'react';
import { fetchCollections } from '../../apis/mongodb/client';

interface UseCollectionsOptions {
    autoFetch?: boolean;
}

export function useCollections(options: UseCollectionsOptions = {}) {
    const { autoFetch = true } = options;
    const [collections, setCollections] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchCollectionsData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetchCollections();

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            setCollections(response.data.collections || []);
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
            fetchCollectionsData();
        }
    }, [autoFetch]);

    return {
        collections,
        loading,
        error,
        fetchCollections: fetchCollectionsData
    };
} 