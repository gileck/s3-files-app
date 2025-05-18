import { useState, useMemo } from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TablePagination, CircularProgress, Alert, Typography,
    IconButton, Stack, Dialog, DialogTitle, DialogContent, DialogActions,
    DialogContentText, Snackbar, Tooltip, Chip, Avatar,
    Popover
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ImageIcon from '@mui/icons-material/Image';
import LockIcon from '@mui/icons-material/Lock';
import KeyIcon from '@mui/icons-material/Key';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Document, WithId } from 'mongodb';
import React from 'react';

interface DocumentsTableProps {
    collection: string;
    database?: string;
    documents: WithId<Document>[];
    isLoading: boolean;
    error: string | null;
    page: number;
    rowsPerPage: number;
    totalDocuments: number;
    selectedDocumentId?: string | null;
    actionInProgress: boolean;

    onSelectDocument: (id: string) => void;
    onEditDocument?: (id: string) => void;
    onPageChange: (newPage: number) => void;
    onRowsPerPageChange: (newRowsPerPage: number) => void;
    onDeleteDocument: (documentId: string) => Promise<void>;
    onDuplicateDocument: (docToDuplicate: WithId<Document>) => Promise<void>;
    onDeleteAllDocuments: () => Promise<void>;
    onRefreshData: () => Promise<void>;
}

export const DocumentsTable = ({
    collection,
    database,
    documents,
    isLoading,
    error: parentError,
    page,
    rowsPerPage,
    totalDocuments,
    selectedDocumentId,
    actionInProgress,
    onSelectDocument,
    onEditDocument,
    onPageChange,
    onRowsPerPageChange,
    onDeleteDocument,
    onDuplicateDocument,
    onDeleteAllDocuments,
    onRefreshData,
}: DocumentsTableProps) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
    const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [imageAnchorEl, setImageAnchorEl] = useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fullValueDialogOpen, setFullValueDialogOpen] = useState(false);
    const [fullValueDialogContent, setFullValueDialogContent] = useState<string | React.ReactNode>('');
    const [fullValueDialogTitle, setFullValueDialogTitle] = useState<string>('');

    const columns = useMemo(() => {
        if (!documents || documents.length === 0) return [];
        const firstDoc = documents[0];
        if (!firstDoc || typeof firstDoc !== 'object') return [];
        const fields = Object.keys(firstDoc).filter(key => key !== '_id');
        return fields.slice(0, 5);
    }, [documents]);

    const handleChangePage = (_: unknown, newPage: number) => {
        onPageChange(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        onRowsPerPageChange(parseInt(event.target.value, 10));
    };

    const handleCopyToClipboard = (value: string, field: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(`Copied ${field} to clipboard`);
    };

    const handleImageClick = (event: React.MouseEvent<HTMLElement>, imgSrc: string) => {
        setImageAnchorEl(event.currentTarget);
        setPreviewImage(imgSrc);
    };

    const handleImageClose = () => {
        setImageAnchorEl(null);
        setPreviewImage(null);
    };

    const isDateValue = (val: unknown): boolean => {
        if (val instanceof Date) return true;
        if (typeof val === 'string') {
            if (val.length < 8 || /^\d+$/.test(val)) return false;
            const isoPattern = /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/;
            const dateToStringPattern = /^[a-zA-Z]{3}\s[a-zA-Z]{3}\s\d{2}\s\d{4}\s\d{2}:\d{2}:\d{2} GMT[+-]\d{4}/;
            const commonDatePattern = /^(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4})(\s\d{1,2}:\d{1,2}(:\d{1,2})?)?$/;
            if (isoPattern.test(val) || dateToStringPattern.test(val) || commonDatePattern.test(val)) {
                try {
                    const parsed = new Date(val);
                    return !isNaN(parsed.getTime()) && parsed.getFullYear() > 1970;
                } catch { return false; }
            }
            return false;
        }
        return false;
    };

    const formatCellValue = (value: unknown, column: string): string | React.ReactNode => {
        if (value === null || value === undefined) {
            return <Typography variant="body2" sx={{ color: '#6B7280', fontSize: '14px' }}>N/A</Typography>;
        }

        const stringValue = String(value);

        if (column.toLowerCase().includes('id') || column === '_id') {
            return (
                <Tooltip title={`Click to copy: ${stringValue}`} placement="top">
                    <Chip
                        avatar={<Avatar sx={{ bgcolor: 'transparent' }}><KeyIcon sx={{ color: '#2563EB' }} fontSize="small" /></Avatar>}
                        label={`...${stringValue.slice(-6)}`}
                        size="small"
                        onClick={() => handleCopyToClipboard(stringValue, column)}
                        sx={{
                            cursor: 'pointer',
                            backgroundColor: '#E0E7FF',
                            color: '#2563EB',
                            borderRadius: '16px',
                            fontFamily: 'monospace', fontSize: '14px'
                        }}
                    />
                </Tooltip>
            );
        }

        if (column === 'password_hash') {
            return (
                <Tooltip title={`Click to copy full hash: ${stringValue}`} placement="top">
                    <Chip
                        avatar={<Avatar sx={{ bgcolor: 'transparent' }}><LockIcon sx={{ color: '#DC2626' }} fontSize="small" /></Avatar>}
                        label={`...${stringValue.slice(-6)}`}
                        size="small"
                        onClick={() => handleCopyToClipboard(stringValue, 'password hash')}
                        sx={{
                            cursor: 'pointer',
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            borderColor: '#DC2626',
                            borderWidth: 1,
                            borderStyle: 'solid',
                            borderRadius: '16px',
                            fontFamily: 'monospace', fontSize: '14px'
                        }}
                    />
                </Tooltip>
            );
        }

        if (typeof value === 'string' && value.startsWith('data:image/')) {
            return (
                <IconButton
                    size="small"
                    onClick={(e) => handleImageClick(e, value)}
                    sx={{ color: '#2563EB' }}
                >
                    <ImageIcon fontSize="inherit" sx={{ fontSize: '20px' }} />
                </IconButton>
            );
        }

        if (isDateValue(value)) {
            try {
                const date = value instanceof Date ? value : new Date(value as string | number);
                return (
                    <Chip
                        icon={<AccessTimeIcon sx={{ fontSize: '16px', color: '#6B7280' }} />}
                        label={date.toLocaleString()}
                        size="small"
                        sx={{
                            fontSize: '12px',
                            color: '#374151',
                            backgroundColor: '#F3F4F6',
                            borderRadius: '16px'
                        }}
                    />
                );
            } catch { /* Fall through */ }
        }

        if (typeof value === 'object') {
            const jsonStr = JSON.stringify(value, null, 2);
            return (
                <Tooltip title={jsonStr.length > 150 ? jsonStr : ''} placement="top">
                    <Typography variant="body2" sx={{
                        maxWidth: '250px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        fontFamily: jsonStr.includes('{') || jsonStr.includes('[') ? 'monospace' : 'inherit',
                        color: '#1F2937'
                    }}>
                        {jsonStr.length > 150 ? jsonStr.slice(0, 150) + '...' : jsonStr}
                    </Typography>
                </Tooltip>
            );
        }
        return <Typography variant="body2" sx={{ fontSize: '14px', color: '#1F2937' }}>{stringValue}</Typography>;
    };

    const handleDeleteConfirm = async () => {
        if (!documentToDelete) return;
        setIsSubmitting(true);
        try {
            await onDeleteDocument(documentToDelete);
            setDeleteDialogOpen(false);
            setDocumentToDelete(null);
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDuplicate = async (doc: WithId<Document>) => {
        setIsSubmitting(true);
        try {
            await onDuplicateDocument(doc);
        } catch (err) {
            console.error("Duplicate failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAllConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onDeleteAllDocuments();
            setDeleteAllDialogOpen(false);
        } catch (err) {
            console.error("Delete all failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRefresh = async () => {
        setIsSubmitting(true);
        try {
            await onRefreshData();
        } catch (err) {
            console.error("Refresh failed:", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseCopied = () => setCopiedField(null);

    const displayColumns = ['_id', ...columns, 'Actions'];

    const handleOpenFullValueDialog = (value: unknown, column: string) => {
        let content: string | React.ReactNode = '';
        if (typeof value === 'object') {
            content = <pre>{JSON.stringify(value, null, 2)}</pre>;
        } else {
            content = String(value);
        }
        setFullValueDialogContent(content);
        setFullValueDialogTitle(`Full Value: ${column}`);
        setFullValueDialogOpen(true);
    };

    const handleCloseFullValueDialog = () => {
        setFullValueDialogOpen(false);
        setFullValueDialogContent('');
        setFullValueDialogTitle('');
    };

    return (
        <Box>
            <Snackbar
                open={!!copiedField}
                autoHideDuration={3000}
                onClose={handleCloseCopied}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseCopied} severity="success" sx={{ width: '100%', borderRadius: '8px' }}>
                    {copiedField}
                </Alert>
            </Snackbar>

            {isLoading && !documents.length ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : parentError ? (
                <Alert severity="error" sx={{ my: 2, borderRadius: '8px' }}>
                    {parentError}
                </Alert>
            ) : (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1.5 }}>
                        <Tooltip title="Refresh Data">
                            <IconButton
                                onClick={handleRefresh}
                                disabled={actionInProgress || isSubmitting}
                                sx={{
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '8px',
                                    color: '#374151',
                                    width: '36px', height: '36px',
                                    '&:hover': { backgroundColor: '#F3F4F6' }
                                }}
                            >
                                <RefreshIcon sx={{ fontSize: '20px' }} />
                            </IconButton>
                        </Tooltip>
                        {documents.length > 0 && (
                            <Tooltip title="Delete All Documents in this Collection">
                                <IconButton
                                    onClick={() => setDeleteAllDialogOpen(true)}
                                    disabled={actionInProgress || isSubmitting}
                                    sx={{
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        color: '#DC2626',
                                        width: '36px', height: '36px',
                                        '&:hover': { backgroundColor: '#FEE2E2' }
                                    }}
                                >
                                    <DeleteIcon sx={{ fontSize: '20px' }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    <TableContainer sx={{
                        borderRadius: '8px',
                        border: '1px solid #E5E7EB',
                        backgroundColor: '#FFFFFF'
                    }}>
                        <Table sx={{ minWidth: 650 }} size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#F1F5F9' }}>
                                    {displayColumns.map((column) => (
                                        <TableCell
                                            key={column}
                                            sx={{
                                                color: '#1F2937',
                                                fontWeight: '600',
                                                fontSize: '14px',
                                                textTransform: column === 'Actions' || column === '_id' ? 'none' : 'uppercase',
                                                borderBottom: '1px solid #E5E7EB',
                                                padding: '12px 16px',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {column.replace('_', ' ')}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {isLoading && documents.length > 0 && (
                                    <TableRow>
                                        <TableCell colSpan={displayColumns.length} sx={{ textAlign: 'center', py: 2, border: 0 }}>
                                            <CircularProgress size={24} />
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!isLoading && documents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={displayColumns.length} align="center" sx={{ border: 0 }}>
                                            <Typography variant="body1" sx={{ py: 5, color: '#6B7280', fontSize: '14px' }}>
                                                No documents found in this collection.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documents.map((doc) => (
                                        <TableRow
                                            key={doc._id.toString()}
                                            hover
                                            sx={{
                                                height: '56px',
                                                'td, th': { borderBottom: '1px solid #E5E7EB' },
                                                '&:last-child td, &:last-child th': { borderBottom: 0 },
                                                ...(selectedDocumentId === doc._id.toString() && {
                                                    backgroundColor: '#E0E7FF',
                                                })
                                            }}
                                        >
                                            {displayColumns.map((column) => {
                                                const cellValue = column === 'Actions' ? null : doc[column];
                                                return (
                                                    <TableCell
                                                        key={`${doc._id}-${column}`}
                                                        sx={{
                                                            padding: '12px 16px',
                                                            fontSize: '14px',
                                                            color: '#1F2937',
                                                        }}
                                                        onDoubleClick={() => column !== 'Actions' && handleOpenFullValueDialog(cellValue, column)}
                                                    >
                                                        {column === 'Actions' ? (
                                                            <Stack direction="row" spacing={1} justifyContent="flex-start">
                                                                <Tooltip title="View Document">
                                                                    <IconButton size="small" onClick={() => onSelectDocument(doc._id.toString())} sx={{ color: '#2563EB', '&:hover': { backgroundColor: 'rgba(37, 99, 235, 0.08)' } }}>
                                                                        <VisibilityIcon sx={{ fontSize: '20px' }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Edit Document">
                                                                    <IconButton size="small" onClick={() => onEditDocument && onEditDocument(doc._id.toString())} sx={{ color: '#10B981', '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.08)' } }}>
                                                                        <EditIcon sx={{ fontSize: '20px' }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Duplicate Document">
                                                                    <IconButton size="small" onClick={() => handleDuplicate(doc)} disabled={actionInProgress || isSubmitting} sx={{ color: '#0EA5E9', '&:hover': { backgroundColor: 'rgba(14, 165, 233, 0.08)' } }}>
                                                                        <ContentCopyIcon sx={{ fontSize: '20px' }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Delete Document">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => { setDocumentToDelete(doc._id.toString()); setDeleteDialogOpen(true); }}
                                                                        disabled={actionInProgress || isSubmitting}
                                                                        sx={{ color: '#EF4444', '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.08)' } }}
                                                                    >
                                                                        <DeleteIcon sx={{ fontSize: '20px' }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Stack>
                                                        ) : formatCellValue(cellValue, column)}
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {documents.length > 0 && (
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50, 100]}
                            component="div"
                            count={totalDocuments}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            sx={{
                                mt: 2,
                                color: '#374151',
                                fontSize: '14px',
                                borderTop: '1px solid #E5E7EB',
                                paddingTop: '12px',
                                '.MuiTablePagination-toolbar': { paddingLeft: 0 },
                                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                                    margin: 0,
                                    fontSize: '14px'
                                },
                                '.MuiTablePagination-select': { fontSize: '14px' },
                                '.MuiTablePagination-actions button': { color: '#374151' }
                            }}
                        />
                    )}
                </>
            )}

            <Dialog
                open={deleteDialogOpen}
                onClose={() => !isSubmitting && setDeleteDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: '8px' } }}
            >
                <DialogTitle sx={{ fontSize: '18px', fontWeight: '600' }}>Delete Document</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '14px' }}>Are you sure you want to delete this document? This action cannot be undone.</DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: '12px 16px' }}>
                    <IconButton
                        onClick={() => !isSubmitting && setDeleteDialogOpen(false)}
                        disabled={isSubmitting}
                        sx={{ color: '#374151', fontSize: '14px', textTransform: 'none', '&:hover': { backgroundColor: '#F3F4F6' } }}
                    >
                        Cancel
                    </IconButton>
                    <IconButton
                        onClick={handleDeleteConfirm}
                        disabled={isSubmitting}
                        sx={{ color: '#DC2626', fontSize: '14px', textTransform: 'none', '&:hover': { backgroundColor: '#FEE2E2' } }}
                    >
                        {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Delete"}
                    </IconButton>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteAllDialogOpen}
                onClose={() => !isSubmitting && setDeleteAllDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: '8px' } }}
            >
                <DialogTitle sx={{ fontSize: '18px', fontWeight: '600' }}>Delete All Documents</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontSize: '14px' }}>Are you sure you want to delete ALL documents in this collection? This action cannot be undone.</DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: '12px 16px' }}>
                    <IconButton
                        onClick={() => !isSubmitting && setDeleteAllDialogOpen(false)}
                        disabled={isSubmitting}
                        sx={{ color: '#374151', fontSize: '14px', textTransform: 'none', '&:hover': { backgroundColor: '#F3F4F6' } }}
                    >
                        Cancel
                    </IconButton>
                    <IconButton
                        onClick={handleDeleteAllConfirm}
                        disabled={isSubmitting}
                        sx={{ color: '#DC2626', fontSize: '14px', textTransform: 'none', '&:hover': { backgroundColor: '#FEE2E2' } }}
                    >
                        {isSubmitting ? <CircularProgress size={20} color="inherit" /> : "Delete All"}
                    </IconButton>
                </DialogActions>
            </Dialog>

            <Popover
                open={Boolean(imageAnchorEl)}
                anchorEl={imageAnchorEl}
                onClose={handleImageClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                PaperProps={{ sx: { borderRadius: '8px', boxShadow: 3 } }}
            >
                {previewImage && (
                    <Box sx={{ p: 1 }}>
                        <img src={previewImage} alt="Preview" style={{ display: 'block', width: '100%', maxWidth: '300px', height: 'auto', borderRadius: '4px' }} />
                    </Box>
                )}
            </Popover>

            <Dialog
                open={fullValueDialogOpen}
                onClose={handleCloseFullValueDialog}
                PaperProps={{ sx: { borderRadius: '8px', minWidth: '400px', maxWidth: '80vw' } }}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle sx={{ fontSize: '18px', fontWeight: '600' }}>{fullValueDialogTitle}</DialogTitle>
                <DialogContent dividers>
                    {typeof fullValueDialogContent === 'string' ? (
                        <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '14px' }}>
                            {fullValueDialogContent}
                        </Typography>
                    ) : (
                        fullValueDialogContent
                    )}
                </DialogContent>
                <DialogActions sx={{ p: '12px 16px' }}>
                    <IconButton
                        onClick={handleCloseFullValueDialog}
                        sx={{ color: '#374151', fontSize: '14px', textTransform: 'none', '&:hover': { backgroundColor: '#F3F4F6' } }}
                    >
                        Close
                    </IconButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
}; 