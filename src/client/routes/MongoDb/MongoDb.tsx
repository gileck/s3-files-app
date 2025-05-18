import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, Paper, Collapse, Button, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useRouter } from '../../router';
import { useCollections } from '../../hooks/useCollections';
import { useDatabases } from '../../hooks/useDatabases';
import { DatabaseSelector } from './DatabaseSelector';
import { CollectionSelector } from './CollectionSelector';
import { DocumentsTable } from './DocumentsTable';
import { DocumentViewer } from './DocumentViewer';
import { QueryRunner } from './QueryRunner';
import { useQuery } from '../../hooks/useQuery';
import { fetchDocuments as apiFetchDocuments, modifyDocument } from '../../../apis/mongodb/client';
import { Document, WithId } from 'mongodb';

export const MongoDb = () => {
    const router = useRouter();
    const [selectedDatabase, setSelectedDatabase] = useState<string>('');
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showQueryPanel, setShowQueryPanel] = useState(true);

    const [tableDocuments, setTableDocuments] = useState<WithId<Document>[]>([]);
    const [tableLoading, setTableLoading] = useState<boolean>(false);
    const [tableError, setTableError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalDocuments, setTotalDocuments] = useState(0);
    const [actionInProgress, setActionInProgress] = useState(false);

    const { databases, loading: databasesLoading, error: dbsErrorHook } = useDatabases();
    const { collections, loading: collectionsLoading, error: collsErrorHook } = useCollections({
        database: selectedDatabase,
        autoFetch: !!selectedDatabase
    });

    const { loading: queryRunnerLoading, error: qrErrorHook } = useQuery();

    const fetchTableDocuments = useCallback(async (db: string, coll: string, currentPage: number, currentRowsPerPage: number, queryFilter: object = {}) => {
        if (!db || !coll) {
            setTableDocuments([]);
            setTotalDocuments(0);
            setTableLoading(false);
            return;
        }
        setTableLoading(true);
        setTableError(null);
        try {
            const response = await apiFetchDocuments(
                coll,
                {
                    query: queryFilter,
                    limit: currentRowsPerPage,
                    skip: currentPage * currentRowsPerPage
                },
                db
            );

            if (response.data.error) {
                throw new Error(response.data.error);
            }
            setTableDocuments(response.data.documents || []);
            setTotalDocuments(response.data.pagination?.total || 0);
        } catch (err) {
            setTableError(err instanceof Error ? err.message : String(err));
            setTableDocuments([]);
            setTotalDocuments(0);
        } finally {
            setTableLoading(false);
        }
    }, []);

    // Effect 1: Initialize State from URL on mount
    useEffect(() => {
        const dbFromUrl = router.routeParams.database || router.queryParams.database || '';
        const collFromUrl = router.routeParams.collection || router.queryParams.collection || '';

        if (dbFromUrl) {
            setSelectedDatabase(dbFromUrl);
        }
        if (collFromUrl) {
            setSelectedCollection(collFromUrl);
        }
        // Set page to 0 for initial load if db/collection are present
        if (dbFromUrl && collFromUrl) {
            setPage(0);
        }
    }, []); // Empty dependency array: runs only on mount

    // Effect 2: Fetch data when critical state changes (db, collection, page, rowsPerPage)
    useEffect(() => {
        if (selectedDatabase && selectedCollection) {
            fetchTableDocuments(selectedDatabase, selectedCollection, page, rowsPerPage);
        } else {
            setTableDocuments([]);
            setTotalDocuments(0);
            setTableLoading(false);
        }
    }, [selectedDatabase, selectedCollection, page, rowsPerPage, fetchTableDocuments]);

    // Effect 3: Sync State to URL (e.g., after user selects a DB/collection from dropdown)
    const updateUrl = useCallback((database: string, collection: string) => {
        let path = '/mongodb';
        if (database && collection) {
            path = `/mongodb/${database}/${collection}`;
        } else if (database) {
            path = `/mongodb/${database}`;
        }

        const currentPathFromRouter = router.routeParams.database
            ? (router.routeParams.collection
                ? `/mongodb/${router.routeParams.database}/${router.routeParams.collection}`
                : `/mongodb/${router.routeParams.database}`)
            : '/mongodb';
        // Consider queryParams as well if they define the view

        if (path !== currentPathFromRouter) {
            router.navigate(path);
        }
    }, [router]); // router object and its params are dependencies for constructing currentPathFromRouter

    useEffect(() => {
        updateUrl(selectedDatabase, selectedCollection);
    }, [selectedDatabase, selectedCollection, updateUrl]);

    const handleSelectDatabase = useCallback((database: string) => {
        setPage(0);
        setSelectedDatabase(database);
        setSelectedCollection('');
        setSelectedDocumentId(null);
    }, []);

    const handleSelectCollection = useCallback((collection: string) => {
        setPage(0);
        setSelectedCollection(collection);
        setSelectedDocumentId(null);
    }, []);

    const handleSelectDocument = useCallback((documentId: string) => {
        setSelectedDocumentId(documentId);
        setIsEditing(false);
    }, []);

    const handleToggleEdit = useCallback(() => setIsEditing(!isEditing), [isEditing]);
    const handleToggleQueryPanel = useCallback(() => setShowQueryPanel(!showQueryPanel), [showQueryPanel]);

    const handleRunQueryRunner = useCallback(async (query: string) => {
        if (selectedDatabase && selectedCollection) {
            setTableError(null);
            try {
                const parsedQuery = JSON.parse(query);
                setPage(0);
                await fetchTableDocuments(selectedDatabase, selectedCollection, 0, rowsPerPage, parsedQuery);
            } catch (error) {
                console.error("Invalid query for QueryRunner:", error);
                setTableError("Invalid query format. Please use valid JSON.");
            }
        }
    }, [selectedDatabase, selectedCollection, rowsPerPage, fetchTableDocuments]);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const handleRowsPerPageChange = useCallback((newRowsPerPage: number) => {
        setRowsPerPage(newRowsPerPage);
        setPage(0);
    }, []);

    const handleRefreshData = useCallback(async () => {
        if (selectedDatabase && selectedCollection) {
            setActionInProgress(true);
            setTableError(null);
            await fetchTableDocuments(selectedDatabase, selectedCollection, page, rowsPerPage);
            setActionInProgress(false);
        }
    }, [selectedDatabase, selectedCollection, page, rowsPerPage, fetchTableDocuments]);

    const handleDeleteDocument = useCallback(async (documentId: string) => {
        if (!selectedDatabase || !selectedCollection) return;
        setActionInProgress(true);
        setTableError(null);
        try {
            await modifyDocument({
                database: selectedDatabase,
                collection: selectedCollection,
                id: documentId,
                document: { _delete: true }
            });
            await fetchTableDocuments(selectedDatabase, selectedCollection, page, rowsPerPage);
        } catch (err) {
            setTableError(err instanceof Error ? err.message : String(err));
        } finally {
            setActionInProgress(false);
        }
    }, [selectedDatabase, selectedCollection, page, rowsPerPage, fetchTableDocuments]);

    const handleDuplicateDocument = useCallback(async (docToDuplicate: WithId<Document>) => {
        if (!selectedDatabase || !selectedCollection) return;
        setActionInProgress(true);
        setTableError(null);
        const { _id, ...docWithoutId } = docToDuplicate;
        try {
            await modifyDocument({
                database: selectedDatabase,
                collection: selectedCollection,
                document: docWithoutId
            });
            await fetchTableDocuments(selectedDatabase, selectedCollection, page, rowsPerPage);
        } catch (err) {
            setTableError(err instanceof Error ? err.message : String(err));
        } finally {
            setActionInProgress(false);
        }
    }, [selectedDatabase, selectedCollection, page, rowsPerPage, fetchTableDocuments]);

    const handleDeleteAllDocuments = useCallback(async () => {
        if (!selectedDatabase || !selectedCollection) return;
        setActionInProgress(true);
        setTableError(null);
        try {
            await modifyDocument({
                database: selectedDatabase,
                collection: selectedCollection,
                document: { _deleteAll: true }
            });
            setPage(0);
            await fetchTableDocuments(selectedDatabase, selectedCollection, 0, rowsPerPage);
        } catch (err) {
            setTableError(err instanceof Error ? err.message : String(err));
        } finally {
            setActionInProgress(false);
        }
    }, [selectedDatabase, selectedCollection, rowsPerPage, fetchTableDocuments]);

    return (
        <Container
            maxWidth={false}
            sx={{
                backgroundColor: '#FAFAFA',
                minHeight: '100vh',
                py: 3,
            }}
        >
            <Box
                sx={{
                    maxWidth: '1280px',
                    mx: 'auto',
                    px: 3,
                }}
            >
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', fontSize: '24px' }}>
                    MongoDB Dashboard
                </Typography>

                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
                    <Box flex={1}>
                        <DatabaseSelector
                            databases={databases}
                            loading={databasesLoading}
                            error={dbsErrorHook}
                            selectedDatabase={selectedDatabase}
                            onSelectDatabase={handleSelectDatabase}
                        />
                    </Box>
                    <Box flex={1}>
                        <CollectionSelector
                            collections={collections}
                            loading={collectionsLoading}
                            error={collsErrorHook}
                            selectedCollection={selectedCollection}
                            onSelectCollection={handleSelectCollection}
                        />
                    </Box>
                </Box>

                {selectedCollection && (
                    <>
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    MongoDB Query
                                </Typography>
                                <IconButton onClick={handleToggleQueryPanel} size="small">
                                    {showQueryPanel ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                </IconButton>
                            </Box>
                            <Collapse in={showQueryPanel}>
                                <QueryRunner
                                    collection={selectedCollection}
                                    database={selectedDatabase}
                                    onRunQuery={handleRunQueryRunner}
                                />
                            </Collapse>
                        </Paper>

                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Documents in {selectedCollection}
                            </Typography>
                            <DocumentsTable
                                collection={selectedCollection}
                                database={selectedDatabase}
                                documents={tableDocuments}
                                isLoading={tableLoading}
                                error={tableError}
                                page={page}
                                rowsPerPage={rowsPerPage}
                                totalDocuments={totalDocuments}
                                selectedDocumentId={selectedDocumentId}
                                actionInProgress={actionInProgress}
                                onSelectDocument={handleSelectDocument}
                                onEditDocument={(id) => { setSelectedDocumentId(id); setIsEditing(true); }}
                                onPageChange={handlePageChange}
                                onRowsPerPageChange={handleRowsPerPageChange}
                                onDeleteDocument={handleDeleteDocument}
                                onDuplicateDocument={handleDuplicateDocument}
                                onDeleteAllDocuments={handleDeleteAllDocuments}
                                onRefreshData={handleRefreshData}
                            />
                        </Paper>
                    </>
                )}

                {selectedDocumentId && selectedCollection && (
                    <Box sx={{ mt: 4 }}>
                        <Paper sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">
                                    Document Details
                                </Typography>
                                <Button
                                    variant={isEditing ? "contained" : "outlined"}
                                    color={isEditing ? "primary" : "secondary"}
                                    onClick={handleToggleEdit}
                                    size="small"
                                    sx={{ mr: 1 }}
                                >
                                    {isEditing ? "Editing" : "Edit"}
                                </Button>
                            </Box>

                            <DocumentViewer
                                collection={selectedCollection}
                                documentId={selectedDocumentId}
                                database={selectedDatabase}
                                isEditing={isEditing}
                                onDocumentUpdated={() => {
                                    if (selectedDatabase && selectedCollection) {
                                        fetchTableDocuments(selectedDatabase, selectedCollection, page, rowsPerPage);
                                    }
                                    setIsEditing(false);
                                    setSelectedDocumentId(null);
                                }}
                            />
                        </Paper>
                    </Box>
                )}
            </Box>
        </Container>
    );
}; 