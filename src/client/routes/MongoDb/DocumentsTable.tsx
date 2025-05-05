import { useState, useMemo } from 'react';
import {
    Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TablePagination, CircularProgress, Alert, Button, Typography,
    IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    DialogContentText, Snackbar, AlertTitle, Tooltip
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useDocuments } from '../../hooks/useDocuments';
import { Document, WithId } from 'mongodb';
import { modifyDocument } from '../../../apis/mongodb/client';
import React from 'react';

interface DocumentsTableProps {
    collection: string;
    onSelectDocument: (id: string) => void;
    onEditDocument?: (id: string) => void;
    customDocuments?: WithId<Document>[];
    isLoading?: boolean;
    error?: Error | null;
}

export const DocumentsTable = ({
    collection,
    onSelectDocument,
    onEditDocument,
    customDocuments,
    isLoading: externalLoading,
    error: externalError
}: DocumentsTableProps) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
    const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
    const [actionInProgress, setActionInProgress] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const {
        documents: fetchedDocuments,
        pagination,
        loading: fetchLoading,
        error: fetchError,
        fetchData
    } = useDocuments(collection, {
        limit: rowsPerPage,
        skip: page * rowsPerPage,
        autoFetch: !customDocuments // Only auto-fetch if we're not using custom documents
    });

    // Use either custom documents or fetched documents
    const documents = customDocuments || fetchedDocuments;
    const loading = externalLoading !== undefined ? externalLoading : fetchLoading;
    const apiError = externalError || fetchError;

    // Handle data refresh
    const handleRefresh = async () => {
        setActionInProgress(true);
        setError(null);

        try {
            await fetchData();
            setSuccessMessage("Data refreshed successfully");
        } catch (err) {
            console.error('Failed to refresh data:', err);
            setError(`Failed to refresh data: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setActionInProgress(false);
        }
    };

    // Handle closing error alert
    const handleCloseError = () => {
        setError(null);
    };

    // Handle closing success message
    const handleCloseSuccess = () => {
        setSuccessMessage(null);
    };

    // Handle closing copied message
    const handleCloseCopied = () => {
        setCopiedField(null);
    };

    //Removed copy to clipboard

    // Extract columns from the first document
    const columns = useMemo(() => {
        if (!documents || documents.length === 0) return [];

        const firstDoc = documents[0];
        const fields = Object.keys(firstDoc);

        // Limit to first 10 fields to avoid overwhelming the table
        return fields.slice(0, 10);
    }, [documents]);

    const handleChangePage = (_: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    //Removed isIdField

    // Format cell values based on their type
    const formatCellValue = (value: unknown): string | React.ReactNode => {
        if (value === null || value === undefined) {
            return '';
        }

        // Handle ObjectId (MongoDB ID)
        if (value && typeof value === 'object' && 'toString' in value && typeof value.toString === 'function') {
            const stringValue = value.toString();
            // Check if it looks like a MongoDB ObjectId (24 hex chars)
            if (/^[0-9a-f]{24}$/i.test(stringValue)) {
                return (
                    <Tooltip title={`ID: ${stringValue}`} placement="top">
                        <Box
                            sx={{
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                                borderRadius: '4px',
                                padding: '2px 4px',
                                display: 'inline-block',
                            }}
                        >
                            {stringValue.substring(0, 8)}
                        </Box>
                    </Tooltip>
                );
            }
        }

        //Removed isDateField

        // Improved date detection logic - uses regex patterns to detect date strings
        const isDateValue = (val: unknown): boolean => {
            if (val instanceof Date) return true;

            // For strings, check if it matches common date patterns
            if (typeof val === 'string') {
                // Skip short strings and pure numeric strings (timestamps)
                if (val.length < 8 || /^\d+$/.test(val)) return false;

                // Common date patterns:

                // ISO 8601 format: 2023-04-26T12:34:56.789Z or variations
                const isoPattern = /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;

                // Date toString format: Wed Jun 03 2020 14:20:00 GMT+0000 (UTC)
                const dateToStringPattern = /^[a-zA-Z]{3}\s[a-zA-Z]{3}\s\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2} GMT[+-]\d{4}/;

                // Common date formats with slashes or dashes: MM/DD/YYYY, DD-MM-YYYY, etc.
                const commonDatePattern = /^(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})(\s\d{1,2}:\d{1,2}(:\d{1,2})?)?$/;

                if (isoPattern.test(val) || dateToStringPattern.test(val) || commonDatePattern.test(val)) {
                    try {
                        const parsed = new Date(val);
                        // Verify we got a valid date (not Jan 1, 1970)
                        return !isNaN(parsed.getTime()) && parsed.getFullYear() > 1970;
                    } catch {
                        return false;
                    }
                }

                return false;
            }

            return false;
        };

        // Format dates
        if (isDateValue(value)) {
            try {
                const date = value instanceof Date ? value : new Date(value as string | number);
                return date.toLocaleString();
            } catch {
                // If date parsing fails, fall through to default formatting
            }
        }

        if (typeof value === 'object') {
            return JSON.stringify(value).slice(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '');
        }

        return String(value);
    };

    // Handle duplicate document
    const handleDuplicate = async (doc: WithId<Document>) => {
        try {
            setActionInProgress(true);
            setError(null);
            console.log('Duplicating document:', doc);

            // Create a new document without the _id field
            const { ...docWithoutId } = doc;

            // Convert ObjectId references to strings
            const sanitizedDoc = JSON.parse(JSON.stringify(docWithoutId));
            console.log('Sanitized document for duplication:', sanitizedDoc);

            const response = await modifyDocument({
                collection,
                document: sanitizedDoc
            });

            console.log('Duplicate document response:', response);

            if (response.data.error) {
                console.error('Error duplicating document:', response.data.error);
                setError(`Failed to duplicate document: ${response.data.error}`);
            } else {
                // Refresh the document list
                await fetchData();
                setSuccessMessage("Document duplicated successfully");
            }
        } catch (err) {
            console.error('Failed to duplicate document:', err);
            setError(`Failed to duplicate document: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setActionInProgress(false);
        }
    };

    // Handle delete document
    const handleDeleteConfirm = async () => {
        if (!documentToDelete) return;

        try {
            setActionInProgress(true);
            setError(null);
            await modifyDocument({
                collection,
                id: documentToDelete,
                document: { _delete: true }
            });
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
            // Refresh the document list
            await fetchData();
            setSuccessMessage("Document deleted successfully");
        } catch (err) {
            console.error('Failed to delete document:', err);
            setError(`Failed to delete document: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setActionInProgress(false);
        }
    };

    // Handle delete all documents
    const handleDeleteAllConfirm = async () => {
        try {
            setActionInProgress(true);
            setError(null);
            const response = await modifyDocument({
                collection,
                document: { _deleteAll: true }
            });
            setDeleteAllDialogOpen(false);
            // Refresh the document list
            await fetchData();
            const count = response.data.deletedCount || 0;
            setSuccessMessage(`${count} documents deleted successfully`);
        } catch (err) {
            console.error('Failed to delete all documents:', err);
            setError(`Failed to delete all documents: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setActionInProgress(false);
        }
    };

    return (
        <Box>
            {/* Error and Success messages */}
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    <AlertTitle>Error</AlertTitle>
                    {error}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!successMessage}
                autoHideDuration={3000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                    {successMessage}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!copiedField}
                autoHideDuration={2000}
                onClose={handleCloseCopied}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseCopied} severity="info" sx={{ width: '100%' }}>
                    {copiedField}
                </Alert>
            </Snackbar>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : apiError ? (
                <Alert severity="error" sx={{ my: 2 }}>
                    {apiError.message || 'Failed to load documents'}
                </Alert>
            ) : documents ? (
                <>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                            variant="outlined"
                            color="primary"
                            startIcon={<RefreshIcon />}
                            onClick={handleRefresh}
                            disabled={actionInProgress}
                        >
                            Refresh Data
                        </Button>

                        {documents.length > 0 && !customDocuments && (
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={() => setDeleteAllDialogOpen(true)}
                                disabled={actionInProgress}
                            >
                                Delete All Documents
                            </Button>
                        )}
                    </Box>

                    <TableContainer component={Paper}>
                        <Table sx={{ minWidth: 650 }} size="small">
                            <TableHead>
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableCell key={column}>{column}</TableCell>
                                    ))}
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {documents.length > 0 ? (
                                    documents.map((doc) => (
                                        <TableRow key={doc._id.toString()}>
                                            {columns.map((column) => (
                                                <TableCell key={`${doc._id}-${column}`}>
                                                    {formatCellValue(doc[column])}
                                                </TableCell>
                                            ))}
                                            <TableCell>
                                                <Stack direction="row" spacing={1}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onSelectDocument(doc._id.toString())}
                                                        title="View"
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => onEditDocument && onEditDocument(doc._id.toString())}
                                                        title="Edit"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDuplicate(doc)}
                                                        title="Duplicate"
                                                        disabled={actionInProgress}
                                                    >
                                                        <ContentCopyIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => {
                                                            setDocumentToDelete(doc._id.toString());
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        title="Delete"
                                                        disabled={actionInProgress}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length + 1} align="center">
                                            No documents found in this collection.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {pagination && documents.length > 0 && !customDocuments && (
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50, 100]}
                            component="div"
                            count={pagination.total}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                        />
                    )}
                </>
            ) : (
                <Box sx={{ my: 4, textAlign: 'center' }}>
                    <Typography variant="body1">No documents found in this collection.</Typography>
                </Box>
            )}

            {/* Delete Document Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Document</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete this document? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={actionInProgress}>Cancel</Button>
                    <Button
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        disabled={actionInProgress}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete All Documents Confirmation Dialog */}
            <Dialog open={deleteAllDialogOpen} onClose={() => setDeleteAllDialogOpen(false)}>
                <DialogTitle>Delete All Documents</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete ALL documents in this collection? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteAllDialogOpen(false)} disabled={actionInProgress}>Cancel</Button>
                    <Button
                        onClick={handleDeleteAllConfirm}
                        color="error"
                        variant="contained"
                        disabled={actionInProgress}
                    >
                        Delete All
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 