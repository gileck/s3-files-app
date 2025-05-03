import { useState, useEffect } from 'react';
import {
    Box, Paper, TextField, Button, CircularProgress,
    Alert, Chip, Tooltip, Collapse, List, ListItem, ListItemText, ListItemIcon,
    IconButton
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CodeIcon from '@mui/icons-material/Code';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useAIQuery } from '../../hooks/useAIQuery';

interface QueryRunnerProps {
    collection: string;
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

export const QueryRunner = ({ collection, onRunQuery }: QueryRunnerProps) => {
    const [queryInput, setQueryInput] = useState('{}');
    const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
    const [showPastQueries, setShowPastQueries] = useState(false);
    const [savedQueries, setSavedQueries] = useState<StoredQuery[]>([]);
    const [queryError, setQueryError] = useState<Error | null>(null);
    const { query: aiGeneratedQuery, loading: aiLoading, error: aiError, cost: aiCost, generateQuery } = useAIQuery();

    // Load saved queries on component mount and when collection changes
    useEffect(() => {
        setSavedQueries(getSavedQueries(collection));
    }, [collection]);

    const handleRunQuery = () => {
        try {
            // Validate JSON
            JSON.parse(queryInput);
            setQueryError(null);

            // Run the query
            onRunQuery(queryInput);

            // Save the query to localStorage after running it
            saveQueryToLocalStorage(collection, queryInput);

            // Refresh the saved queries list
            setSavedQueries(getSavedQueries(collection));
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
        await generateQuery(collection, naturalLanguageInput);
    };

    // When AI generates a query, automatically update the main query input and run it
    useEffect(() => {
        if (aiGeneratedQuery) {
            setQueryInput(aiGeneratedQuery);
            // Automatically run the generated query
            try {
                JSON.parse(aiGeneratedQuery);
                onRunQuery(aiGeneratedQuery);
                saveQueryToLocalStorage(collection, aiGeneratedQuery);
                setSavedQueries(getSavedQueries(collection));
            } catch (err) {
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
        const updatedQueries = deleteSavedQuery(collection, index);
        setSavedQueries(updatedQueries);
    };

    // Format date for display
    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Natural Language Query Input */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                        label="Natural Language Query"
                        fullWidth
                        size="small"
                        value={naturalLanguageInput}
                        onChange={(e) => setNaturalLanguageInput(e.target.value)}
                        placeholder="Example: Find all documents with a specific ID"
                        variant="outlined"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={aiLoading ? <CircularProgress size={16} /> : <SmartToyIcon />}
                        onClick={handleGenerateAIQuery}
                        disabled={aiLoading || !naturalLanguageInput}
                        sx={{ whiteSpace: 'nowrap', minWidth: '140px' }}
                    >
                        Generate
                    </Button>
                    <Button
                        variant={showPastQueries ? "contained" : "outlined"}
                        size="small"
                        startIcon={<HistoryIcon />}
                        onClick={() => setShowPastQueries(!showPastQueries)}
                        sx={{ whiteSpace: 'nowrap', minWidth: '100px' }}
                    >
                        History
                    </Button>
                </Box>

                {/* Cost display for AI query */}
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

                {/* AI Error */}
                {aiError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {aiError.message || 'Failed to generate query'}
                    </Alert>
                )}

                {/* Query History */}
                <Collapse in={showPastQueries}>
                    <Paper variant="outlined" sx={{ p: 1, maxHeight: '200px', overflow: 'auto' }}>
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
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        }
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': { backgroundColor: '#f0f0f0' },
                                            py: 0.5
                                        }}
                                        onClick={() => handleSelectQuery(savedQuery.query)}
                                    >
                                        <ListItemIcon sx={{ minWidth: '30px' }}>
                                            <CodeIcon fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Box sx={{
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.85rem',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {savedQuery.query}
                                                </Box>
                                            }
                                            secondary={formatDate(savedQuery.timestamp)}
                                            secondaryTypographyProps={{ fontSize: '0.7rem' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Collapse>

                {/* MongoDB Query Input */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                        label="MongoDB Query (JSON)"
                        fullWidth
                        multiline
                        rows={2}
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
                        placeholder='{"field": "value"}'
                        variant="outlined"
                        error={!!queryError}
                        helperText={queryError?.message}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            startIcon={<PlayArrowIcon />}
                            onClick={handleRunQuery}
                            sx={{ whiteSpace: 'nowrap', minWidth: '140px' }}
                        >
                            Run Query
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            size="small"
                            startIcon={<RestartAltIcon />}
                            onClick={handleResetQuery}
                            sx={{ whiteSpace: 'nowrap', minWidth: '140px' }}
                        >
                            Reset Query
                        </Button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}; 