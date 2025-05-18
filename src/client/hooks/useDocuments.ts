import { useState, useEffect, useCallback } from 'react';
import { fetchDocuments, fetchDocument } from '../../apis/mongodb/client';
import { DocumentsResponse, DocumentsRequest } from '../../apis/mongodb/types';
import { Document, WithId } from 'mongodb';

interface UseDocumentsOptions {
    autoFetch?: boolean;
    database?: string;
}

export function useDocuments(
    collection: string,
    options: UseDocumentsOptions & Omit<DocumentsRequest, 'collection'> = {}
) {
    const { autoFetch = true, limit = 100, skip = 0, query = {}, id, database } = options;

    const [documents, setDocuments] = useState<WithId<Document>[] | null>(null);
    const [document, setDocument] = useState<WithId<Document> | null>(null);
    const [pagination, setPagination] = useState<DocumentsResponse['pagination'] | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!collection) return;

        try {
            setLoading(true);
            setError(null);

            let response;
            if (id) {
                response = await fetchDocument(collection, id, database);
            } else {
                response = await fetchDocuments(collection, query, database);
            }

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
    }, [collection, id, database, JSON.stringify(query), limit, skip]);

    useEffect(() => {
        if (autoFetch && collection) {
            fetchData();
        }
    }, [autoFetch, fetchData]);

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