import { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Button, CircularProgress, Alert,
    TextField, Grid, IconButton, Snackbar, AlertTitle,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import CodeIcon from '@mui/icons-material/Code';
import { useDocuments } from '../../hooks/useDocuments';
import { modifyDocument } from '../../../apis/mongodb/client';
import { Document, WithId } from 'mongodb';

interface DocumentViewerProps {
    collection: string;
    documentId: string;
    onBack: () => void;
    initialEditMode?: boolean;
}

export const DocumentViewer = ({ collection, documentId, onBack, initialEditMode = false }: DocumentViewerProps) => {
    const { document, loading, error: fetchError, fetchData } = useDocuments(collection, { id: documentId });
    const [editMode, setEditMode] = useState(initialEditMode);
    const [currentEditedDocument, setCurrentEditedDocument] = useState<Record<string, unknown>>({});
    const [saving, setSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [jsonDialogOpen, setJsonDialogOpen] = useState(false);

    // Handle closing error alert
    const handleCloseError = () => {
        setErrorMessage(null);
    };

    // Handle closing success message
    const handleCloseSuccess = () => {
        setSuccessMessage(null);
    };

    // Initialize edit mode when document is loaded
    useEffect(() => {
        if (document && initialEditMode) {
            setCurrentEditedDocument(prepareEditableDocument(document));
        }
    }, [document, initialEditMode]);

    // Convert document to editable format, excluding _id field
    const prepareEditableDocument = (doc: WithId<Document>) => {
        const editableDoc: Record<string, unknown> = {};

        Object.entries(doc).forEach(([key, value]) => {
            if (key !== '_id') {
                editableDoc[key] = value;
            }
        });

        return editableDoc;
    };

    const handleEdit = () => {
        if (!document) return;

        setCurrentEditedDocument(prepareEditableDocument(document));
        setEditMode(true);
        setErrorMessage(null);
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setCurrentEditedDocument({});
        setErrorMessage(null);
    };

    const handleSave = async () => {
        if (!document || !currentEditedDocument) return;

        try {
            setSaving(true);
            setErrorMessage(null);

            const response = await modifyDocument({
                collection,
                id: documentId,
                document: currentEditedDocument as Document
            });

            if (response.data.error) {
                throw new Error(response.data.error);
            }

            setEditMode(false);
            fetchData();
            setSuccessMessage("Document updated successfully");
        } catch (err) {
            console.error('Error saving document:', err);
            if (err instanceof Error) {
                setErrorMessage(`Failed to save document: ${err.message}`);
            } else {
                setErrorMessage(`Failed to save document: ${String(err)}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const handleFieldChange = (key: string, value: string) => {
        setCurrentEditedDocument(prev => ({
            ...prev,
            [key]: value
        }));
    };

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

    // Format field value for display
    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) {
            return 'null';
        }

        // Format date values
        if (isDateValue(value)) {
            try {
                const date = value instanceof Date ? value : new Date(value as string | number);
                return date.toLocaleString();
            } catch {
                // If date parsing fails, fall through to default formatting
            }
        }

        if (typeof value === 'object') {
            return JSON.stringify(value, null, 2);
        }

        return String(value);
    };

    // Get appropriate TextField type for editing
    const getFieldType = (value: unknown): string => {
        if (isDateValue(value)) {
            return 'datetime-local';
        }

        if (typeof value === 'number') {
            return 'number';
        }

        return 'text';
    };

    return (
        <Box>
            {/* Error and Success messages */}
            <Snackbar
                open={!!errorMessage}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
                    <AlertTitle>Error</AlertTitle>
                    {errorMessage}
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

            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={onBack} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">Document Details</Typography>

                {document && (
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<CodeIcon />}
                            onClick={() => setJsonDialogOpen(true)}
                        >
                            View Raw JSON
                        </Button>
                        {!editMode && (
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={handleEdit}
                            >
                                Edit
                            </Button>
                        )}
                    </Box>
                )}

                {editMode && (
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<CancelIcon />}
                            onClick={handleCancelEdit}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            Save
                        </Button>
                    </Box>
                )}
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : fetchError ? (
                <Alert severity="error" sx={{ my: 2 }}>
                    {fetchError.message || 'Failed to load document'}
                </Alert>
            ) : document ? (
                <Paper sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                        <Box sx={{ width: '100%', p: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">
                                ID
                            </Typography>
                            <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                                {document._id.toString()}
                            </Typography>
                        </Box>

                        {Object.entries(editMode ? currentEditedDocument : document)
                            .filter(([key]) => key !== '_id')
                            .map(([key, value]) => (
                                <Box sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, p: 1 }} key={key}>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            {key}
                                        </Typography>

                                        {editMode ? (
                                            <TextField
                                                fullWidth
                                                multiline={typeof value === 'object' && !(value instanceof Date)}
                                                rows={typeof value === 'object' && !(value instanceof Date) ? 4 : 1}
                                                value={formatValue(currentEditedDocument[key])}
                                                onChange={(e) => handleFieldChange(key, e.target.value)}
                                                size="small"
                                                type={getFieldType(value)}
                                            />
                                        ) : (
                                            <Typography
                                                variant="body1"
                                                sx={{
                                                    wordBreak: 'break-all',
                                                    whiteSpace: typeof value === 'object' && !(value instanceof Date) ? 'pre-wrap' : 'normal'
                                                }}
                                            >
                                                {formatValue(value)}
                                            </Typography>
                                        )}
                                    </Box>
                                </Box>
                            ))}
                    </Grid>
                </Paper>
            ) : (
                <Alert severity="info">Document not found</Alert>
            )}

            {/* Raw JSON Dialog */}
            <Dialog
                open={jsonDialogOpen}
                onClose={() => setJsonDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Raw JSON Document</DialogTitle>
                <DialogContent>
                    <Box sx={{
                        p: 2,
                        fontFamily: 'monospace',
                        backgroundColor: '#f5f5f5',
                        overflowX: 'auto',
                        whiteSpace: 'pre'
                    }}>
                        {document && JSON.stringify(document, null, 2)}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setJsonDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 