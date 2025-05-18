import { useState } from 'react';
import { runAIQuery } from '../../apis/mongodb/client';

export function useAIQuery() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [cost, setCost] = useState<{ totalCost: number } | null>(null);

    const generateQuery = async (collection: string, naturalLanguageQuery: string, database?: string, modelId?: string) => {
        if (!collection || !naturalLanguageQuery) return;

        try {
            setLoading(true);
            setError(null);
            setCost(null);

            const response = await runAIQuery(collection, naturalLanguageQuery, database);

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            setQuery(response.data.query || '{}');
            if (response.data.cost) {
                setCost(response.data.cost);
            }
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

    return {
        query,
        loading,
        error,
        cost,
        generateQuery
    };
} 