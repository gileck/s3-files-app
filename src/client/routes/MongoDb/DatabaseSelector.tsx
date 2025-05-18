import { Box, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';

interface DatabaseSelectorProps {
    databases: string[];
    loading: boolean;
    error: Error | null;
    selectedDatabase: string;
    onSelectDatabase: (database: string) => void;
}

export const DatabaseSelector = ({
    databases,
    loading,
    error,
    selectedDatabase,
    onSelectDatabase
}: DatabaseSelectorProps) => {
    return (
        <Box sx={{ mb: 4 }}>
            {loading ? (
                <CircularProgress size={24} />
            ) : error ? (
                <Alert severity="error">{error.message || 'Failed to load databases'}</Alert>
            ) : (
                <FormControl fullWidth>
                    <InputLabel id="database-select-label">Select Database</InputLabel>
                    <Select
                        labelId="database-select-label"
                        id="database-select"
                        value={selectedDatabase}
                        label="Select Database"
                        onChange={(e) => onSelectDatabase(e.target.value)}
                    >
                        {databases.map((database) => (
                            <MenuItem key={database} value={database}>{database}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Box>
    );
}; 