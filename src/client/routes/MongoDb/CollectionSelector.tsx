import { Box, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';

interface CollectionSelectorProps {
    collections: string[];
    loading: boolean;
    error: Error | null;
    selectedCollection: string;
    onSelectCollection: (collection: string) => void;
}

export const CollectionSelector = ({
    collections,
    loading,
    error,
    selectedCollection,
    onSelectCollection
}: CollectionSelectorProps) => {
    return (
        <Box sx={{ mb: 4 }}>
            {loading ? (
                <CircularProgress size={24} />
            ) : error ? (
                <Alert severity="error">{error.message || 'Failed to load collections'}</Alert>
            ) : (
                <FormControl fullWidth>
                    <InputLabel id="collection-select-label">Select Collection</InputLabel>
                    <Select
                        labelId="collection-select-label"
                        id="collection-select"
                        value={selectedCollection}
                        label="Select Collection"
                        onChange={(e) => onSelectCollection(e.target.value)}
                    >
                        {collections.map((collection) => (
                            <MenuItem key={collection} value={collection}>{collection}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </Box>
    );
}; 