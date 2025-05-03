import { useState, useEffect } from 'react';
import { fetchDocuments } from '../../apis/mongodb/client';
import { DocumentsResponse, DocumentsRequest } from '../../apis/mongodb/types';
import { Document, WithId } from 'mongodb';

interface UseDocumentsOptions {
    autoFetch?: boolean;
}

export function useDocuments(
    collection: string,
    options: UseDocumentsOptions & Omit<DocumentsRequest, 'collection'> = {}
) {
    const { autoFetch = true, limit = 100, skip = 0, query = {}, id } = options;

    const [documents, setDocuments] = useState<WithId<Document>[] | null>(null);
    const [document, setDocument] = useState<WithId<Document> | null>(null);
    const [pagination, setPagination] = useState<DocumentsResponse['pagination'] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = async () => {
        if (!collection) return;

        try {
            setLoading(true);
            setError(null);

            const response = await fetchDocuments({
                collection,
                limit,
                skip,
                query,
                id
            });

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            if (response.data.document) {
                setDocument(response.data.document);
                setDocuments(null);
                setPagination(null);
            } else {
                setDocuments(response.data.documents || []);
                setDocument(null);
                setPagination(response.data.pagination || null);
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err);
            } else {
                setError(new Error(String(err)));
            }
            setDocuments(null);
            setDocument(null);
            setPagination(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (autoFetch && collection) {
            fetchData();
        }
    }, [autoFetch, collection, limit, skip, id, JSON.stringify(query)]);

    return {
        documents,
        document,
        pagination,
        loading,
        error,
        fetchData,
        setDocuments
    };
} 