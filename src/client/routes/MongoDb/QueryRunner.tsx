import { useState, useEffect } from 'react';
import {
    Box, TextField, Button, CircularProgress,
    Alert, Chip, Tooltip, Collapse, List, ListItem, ListItemText, ListItemIcon,
    IconButton, Paper
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CodeIcon from '@mui/icons-material/Code';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useAIQuery } from '../../hooks/useAIQuery';

interface QueryRunnerProps {
    collection?: string;
    database?: string;
    loading?: boolean;
    error?: Error | null;
    onRunQuery: (query: string) => void;
}

// Interface for storing past queries
interface StoredQuery {
    query: string;
    timestamp: number;
}

// Function to save a query to localStorage
const saveQueryToLocalStorage = (collection: string, query: string) => {
    if (!query || query === '{}') return; // Don't save empty queries

    try {
        // Parse to validate it's valid JSON
        JSON.parse(query);

        // Get existing queries for this collection
        const storageKey = `mongodb_queries_${collection}`;
        const existingQueriesJSON = localStorage.getItem(storageKey);
        const existingQueries: StoredQuery[] = existingQueriesJSON
            ? JSON.parse(existingQueriesJSON)
            : [];

        // Check if this exact query already exists
        const queryExists = existingQueries.some(q => q.query === query);
        if (!queryExists) {
            // Add new query to the start of the array
            const newQueries = [
                { query, timestamp: Date.now() },
                ...existingQueries
            ].slice(0, 20); // Keep only the most recent 20 queries

            localStorage.setItem(storageKey, JSON.stringify(newQueries));
        }
    } catch (e) {
        console.error('Failed to save query to localStorage:', e);
    }
};

// Function to get saved queries from localStorage
const getSavedQueries = (collection: string): StoredQuery[] => {
    try {
        const storageKey = `mongodb_queries_${collection}`;
        const queriesJSON = localStorage.getItem(storageKey);
        return queriesJSON ? JSON.parse(queriesJSON) : [];
    } catch (e) {
        console.error('Failed to get saved queries from localStorage:', e);
        return [];
    }
};

// Function to delete a saved query
const deleteSavedQuery = (collection: string, index: number): StoredQuery[] => {
    try {
        const storageKey = `mongodb_queries_${collection}`;
        const queriesJSON = localStorage.getItem(storageKey);
        const queries = queriesJSON ? JSON.parse(queriesJSON) : [];

        queries.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(queries));

        return queries;
    } catch (e) {
        console.error('Failed to delete saved query:', e);
        return getSavedQueries(collection);
    }
};

export const QueryRunner = ({
    collection,
    database,
    loading: externalLoading,
    error: externalError,
    onRunQuery
}: QueryRunnerProps) => {
    const [queryInput, setQueryInput] = useState('{}');
    const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
    const [showPastQueries, setShowPastQueries] = useState(false);
    const [savedQueries, setSavedQueries] = useState<StoredQuery[]>([]);
    const [queryError, setQueryError] = useState<Error | null>(null);
    const { query: aiGeneratedQuery, loading: aiLoading, error: aiError, cost: aiCost, generateQuery } = useAIQuery();

    // Log AI Query Hook status changes
    useEffect(() => {
        console.log('[QueryRunner] AI Hook Status:', { aiLoading, aiError, aiCost });
    }, [aiLoading, aiError, aiCost]);

    // Reset inputs when database or collection changes
    useEffect(() => {
        setNaturalLanguageInput('');
        setQueryInput('{}');
        setQueryError(null); // Also clear any previous query error
        // setShowPastQueries(false); // Optionally hide past queries as they are collection-specific
    }, [database, collection]);

    // Load saved queries on component mount and when collection changes
    useEffect(() => {
        if (collection) {
            setSavedQueries(getSavedQueries(collection));
        }
    }, [collection]);

    const handleRunQuery = () => {
        try {
            // Validate JSON
            JSON.parse(queryInput);
            setQueryError(null);

            // Run the query
            onRunQuery(queryInput);

            // Save the query to localStorage after running it
            if (collection) {
                saveQueryToLocalStorage(collection, queryInput);
                // Refresh the saved queries list
                setSavedQueries(getSavedQueries(collection));
            }
        } catch (err) {
            setQueryError(err instanceof Error ? err : new Error(String(err)));
        }
    };

    const handleResetQuery = () => {
        // Set query to empty object to show all documents
        setQueryInput('{}');
        setQueryError(null);

        // Run the query immediately
        onRunQuery('{}');
    };

    const handleGenerateAIQuery = async () => {
        setQueryError(null); // Clear previous JSON query errors
        if (collection && naturalLanguageInput) {
            try {
                await generateQuery(collection, naturalLanguageInput, database);
            } catch (err) {
                console.error('[QueryRunner] Error during generateQuery call:', err);
            }
        } else {
            console.warn('[QueryRunner] Skipping AI query generation: collection or naturalLanguageInput is missing.');
        }
    };

    // When AI generates a query, automatically update the main query input and run it
    useEffect(() => {
        console.log('[QueryRunner] AI Generated Query Effect: Received aiGeneratedQuery:', aiGeneratedQuery);
        if (aiGeneratedQuery && collection) {
            setQueryInput(aiGeneratedQuery);
            // Automatically run the generated query
            try {
                JSON.parse(aiGeneratedQuery);
                console.log('[QueryRunner] Parsed AI query successfully, running query:', aiGeneratedQuery);
                onRunQuery(aiGeneratedQuery);
                saveQueryToLocalStorage(collection, aiGeneratedQuery);
                setSavedQueries(getSavedQueries(collection));
            } catch (err) {
                console.error('[QueryRunner] Error processing AI generated query:', err, { aiGeneratedQuery });
                setQueryError(err instanceof Error ? err : new Error(String(err)));
            }
        }
    }, [aiGeneratedQuery, collection, onRunQuery]);

    const handleSelectQuery = (query: string) => {
        setQueryInput(query);
        // Auto-run when selecting a query from history
        try {
            JSON.parse(query);
            onRunQuery(query);
        } catch (err) {
            setQueryError(err instanceof Error ? err : new Error(String(err)));
        }
    };

    const handleDeleteQuery = (index: number) => {
        if (collection) {
            const updatedQueries = deleteSavedQuery(collection, index);
            setSavedQueries(updatedQueries);
        }
    };

    // Format date for display
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                    label="Natural Language Query"
                    fullWidth
                    size="small"
                    value={naturalLanguageInput}
                    onChange={(e) => setNaturalLanguageInput(e.target.value)}
                    placeholder="Example: Find users by email or status"
                    variant="outlined"
                    sx={{
                        backgroundColor: '#F9FAFB',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                        }
                    }}
                />

                {aiCost && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1 }}>
                        <Tooltip title="Cost of this AI query generation">
                            <Chip
                                label={`Cost: $${aiCost.totalCost.toFixed(6)}`}
                                size="small"
                                color="default"
                                variant="outlined"
                            />
                        </Tooltip>
                    </Box>
                )}
                {aiError && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                        {aiError.message || 'Failed to generate query'}
                    </Alert>
                )}

                <Box>
                    <Box sx={{
                        color: "rgba(0, 0, 0, 0.6)",
                        fontSize: "0.75rem",
                        padding: "0 8px",
                        position: "relative",
                        top: "-10px",
                        left: "10px",
                        backgroundColor: "#FAFAFA",
                        zIndex: 1,
                        fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                        fontWeight: 400,
                        lineHeight: 1.4375,
                        letterSpacing: "0.00938em",
                        display: 'inline-block'
                    }}>
                        MongoDB Query (JSON)
                    </Box>
                    <Box
                        sx={{
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            p: 1.5,
                            backgroundColor: '#F3F4F6',
                            minHeight: 90,
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            color: '#1F2937',
                            position: 'relative',
                            mt: -2.5
                        }}
                    >
                        <TextField
                            fullWidth
                            multiline
                            variant="standard"
                            InputProps={{
                                disableUnderline: true,
                                sx: {
                                    p: 0,
                                    fontFamily: 'monospace',
                                    fontSize: '14px',
                                    color: '#1F2937',
                                    minHeight: 60
                                }
                            }}
                            value={queryInput}
                            onChange={(e) => setQueryInput(e.target.value)}
                            placeholder='{"field": "value"}'
                            error={!!queryError}
                            helperText={queryError ? queryError.message : ' '}
                            sx={{
                                '& .MuiFormHelperText-root': {
                                    position: 'absolute',
                                    bottom: -20,
                                    left: 0,
                                    fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                                    fontSize: '0.7rem'
                                }
                            }}
                        />
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mt: 2 }}>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <SmartToyIcon />}
                        onClick={handleGenerateAIQuery}
                        disabled={aiLoading || !naturalLanguageInput}
                        sx={{
                            whiteSpace: 'nowrap',
                            bgcolor: '#E0E0E0',
                            color: '#1F2937',
                            height: '36px',
                            borderRadius: '8px',
                            px: 2,
                            textTransform: 'none',
                            fontSize: '14px',
                            '&:hover': { bgcolor: '#d5d5d5' }
                        }}
                    >
                        Generate
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={<HistoryIcon />}
                        onClick={() => setShowPastQueries(!showPastQueries)}
                        sx={{
                            whiteSpace: 'nowrap',
                            height: '36px',
                            borderRadius: '8px',
                            borderColor: '#2563EB',
                            color: '#2563EB',
                            px: 2,
                            textTransform: 'none',
                            fontSize: '14px',
                            '&:hover': { bgcolor: 'rgba(37, 99, 235, 0.04)' }
                        }}
                    >
                        History
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleRunQuery}
                        startIcon={<PlayArrowIcon />}
                        sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            height: '36px',
                            bgcolor: '#2563EB',
                            fontSize: '14px',
                            px: 2,
                            '&:hover': { bgcolor: '#1D4ED8' }
                        }}
                    >
                        Run Query
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={handleResetQuery}
                        startIcon={<RestartAltIcon />}
                        sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            height: '36px',
                            borderColor: '#DC2626',
                            color: '#DC2626',
                            fontSize: '14px',
                            px: 2,
                            '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.04)' }
                        }}
                    >
                        Reset Query
                    </Button>
                </Box>

                <Collapse in={showPastQueries} sx={{ mt: 2, width: '100%' }}>
                    <Paper variant="outlined" sx={{ p: 1, maxHeight: '200px', overflow: 'auto', borderColor: '#E5E7EB' }}>
                        {savedQueries.length === 0 ? (
                            <Alert severity="info" sx={{ mb: 0 }}>
                                No saved queries
                            </Alert>
                        ) : (
                            <List dense disablePadding>
                                {savedQueries.map((savedQuery, index) => (
                                    <ListItem
                                        key={index}
                                        dense
                                        disablePadding
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                size="small"
                                                onClick={() => handleDeleteQuery(index)}
                                                sx={{ color: '#6B7280' }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        }
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': { backgroundColor: '#F3F4F6' },
                                            py: 0.5,
                                            borderRadius: '4px'
                                        }}
                                        onClick={() => handleSelectQuery(savedQuery.query)}
                                    >
                                        <ListItemIcon sx={{ minWidth: '30px', color: '#6B7280' }}>
                                            <CodeIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '14px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    color: '#1F2937'
                                                }}>
                                                    {savedQuery.query}
                                                </Box>
                                            }
                                            secondary={formatDate(savedQuery.timestamp)}
                                            secondaryTypographyProps={{ fontSize: '12px', color: '#6B7280' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Collapse>
            </Box>
        </Box>
    );
}; 