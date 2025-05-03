import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, Paper, Collapse, Button, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useRouter } from '../../router';
import { useCollections } from '../../hooks/useCollections';
import { CollectionSelector } from './CollectionSelector';
import { DocumentsTable } from './DocumentsTable';
import { DocumentViewer } from './DocumentViewer';
import { QueryRunner } from './QueryRunner';
import { useQuery } from '../../hooks/useQuery';

export const MongoDb = () => {
    const router = useRouter();
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showQueryPanel, setShowQueryPanel] = useState(true);
    const { collections, loading: collectionsLoading, error: collectionsError } = useCollections();
    const { results, loading: queryLoading, error: queryError, runQuery } = useQuery();

    // Initialize from URL when component mounts or router query changes
    useEffect(() => {
        // Get collection from URL path or query parameter
        const collectionFromPath = router.routeParams.collection;
        const collectionFromQuery = router.queryParams.collection;

        // Prefer path parameter, fall back to query parameter
        const collection = collectionFromPath || collectionFromQuery;

        if (collection && collection !== selectedCollection) {
            setSelectedCollection(collection);
        }
    }, [router.routeParams, router.queryParams, selectedCollection]);

    // Run a query to fetch all documents when the collection changes
    useEffect(() => {
        if (selectedCollection) {
            // Run an empty query to fetch all documents
            runQuery(selectedCollection, '{}');
        }
    }, [selectedCollection, runQuery]);

    // Handle selecting a collection
    const handleSelectCollection = useCallback((collection: string) => {
        setSelectedCollection(collection);

        // Update URL with the selected collection
        // Use path-based URLs if the route supports it, otherwise fall back to query params
        if (router.currentPath.includes('/mongodb/')) {
            // We're already on a collection-specific route, just update the collection part
            router.navigate(`/mongodb/${collection}`);
        } else if (router.currentPath === '/mongodb') {
            // We're on the base route, add the collection
            router.navigate(`/mongodb/${collection}`);
        } else {
            // Fall back to query parameter approach
            router.navigate(`/mongodb?collection=${collection}`);
        }

        // Reset document selection
        setSelectedDocumentId(null);
        setIsEditing(false);
    }, [router]);

    const handleSelectDocument = useCallback((id: string) => {
        setSelectedDocumentId(id);
        setIsEditing(false);
    }, []);

    const handleEditDocument = useCallback((id: string) => {
        setSelectedDocumentId(id);
        setIsEditing(true);
    }, []);

    const handleBack = useCallback(() => {
        setSelectedDocumentId(null);
        setIsEditing(false);
    }, []);

    const handleToggleQueryPanel = useCallback(() => {
        setShowQueryPanel(prev => !prev);
    }, []);

    const handleRefresh = useCallback(() => {
        if (selectedCollection) {
            runQuery(selectedCollection, '{}');
        }
    }, [selectedCollection, runQuery]);

    // Memoize the query handler to avoid recreation on every render
    const handleRunQuery = useCallback((query: string) => {
        if (selectedCollection) {
            runQuery(selectedCollection, query);
        }
    }, [selectedCollection, runQuery]);

    return (
        <Container maxWidth="xl">
            <Box sx={{ my: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    MongoDB Dashboard
                </Typography>

                <CollectionSelector
                    collections={collections}
                    loading={collectionsLoading}
                    error={collectionsError}
                    selectedCollection={selectedCollection}
                    onSelectCollection={handleSelectCollection}
                />

                {selectedCollection && (
                    <Box sx={{ mt: 4 }}>
                        {selectedDocumentId ? (
                            <DocumentViewer
                                collection={selectedCollection}
                                documentId={selectedDocumentId}
                                onBack={handleBack}
                                initialEditMode={isEditing}
                            />
                        ) : (
                            <>
                                <Paper sx={{ mb: 3, p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="h6">Query Builder</Typography>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <IconButton
                                                size="small"
                                                onClick={handleRefresh}
                                                title="Refresh Documents"
                                            >
                                                <RefreshIcon />
                                            </IconButton>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={handleToggleQueryPanel}
                                                endIcon={showQueryPanel ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                            >
                                                {showQueryPanel ? 'Hide Query' : 'Show Query'}
                                            </Button>
                                        </Box>
                                    </Box>

                                    <Collapse in={showQueryPanel}>
                                        <Box sx={{ mb: 2 }}>
                                            <QueryRunner
                                                collection={selectedCollection}
                                                onRunQuery={handleRunQuery}
                                            />
                                        </Box>
                                    </Collapse>
                                </Paper>

                                <DocumentsTable
                                    collection={selectedCollection}
                                    onSelectDocument={handleSelectDocument}
                                    onEditDocument={handleEditDocument}
                                    customDocuments={results.length > 0 ? results : undefined}
                                    isLoading={queryLoading}
                                    error={queryError}
                                />
                            </>
                        )}
                    </Box>
                )}
            </Box>
        </Container>
    );
}; 