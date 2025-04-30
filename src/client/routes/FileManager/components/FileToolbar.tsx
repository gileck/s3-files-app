import React from 'react';
import { 
  Box, 
  Button,
  useMediaQuery,
  useTheme,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface FileToolbarProps {
  onNewFile: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
}

export const FileToolbar = ({
  onNewFile,
  onNewFolder,
  onRefresh
}: FileToolbarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box sx={{ mb: 2 }}>
      <Stack 
        direction={isMobile ? 'column' : 'row'} 
        spacing={1}
        sx={{ width: '100%' }}
      >
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onNewFile}
          fullWidth={isMobile}
        >
          New File
        </Button>
        
        <Button
          variant="contained"
          startIcon={<CreateNewFolderIcon />}
          onClick={onNewFolder}
          fullWidth={isMobile}
        >
          New Folder
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          fullWidth={isMobile}
        >
          Refresh
        </Button>
      </Stack>
    </Box>
  );
};
