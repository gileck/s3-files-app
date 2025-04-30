import React from 'react';
import {
  Box,
  Button,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Home as HomeIcon,
  CreateNewFolder as CreateNewFolderIcon,
  Refresh as RefreshIcon,
  AddCircleOutlined
} from '@mui/icons-material';

interface BreadcrumbsProps {
  breadcrumbs: string[];
  onNavigate: (index: number) => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
  onRefresh?: () => void;
}

export const Breadcrumbs = ({
  breadcrumbs,
  onNavigate,
  onNewFile,
  onNewFolder,
  onRefresh
}: BreadcrumbsProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isXs = useMediaQuery(theme.breakpoints.down('xs'));

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          overflowX: 'auto'
        }}
      >
        <Button
          startIcon={<HomeIcon />}
          onClick={() => onNavigate(-1)}
          size={isMobile ? 'small' : 'medium'}
          sx={{ mr: 1 }}
        >
          Root
        </Button>

        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            <Typography variant="body2" sx={{ mx: 1 }}>/</Typography>
            <Button
              onClick={() => onNavigate(index)}
              size={isMobile ? 'small' : 'medium'}
            >
              {crumb.endsWith('/') ? crumb.slice(0, -1) : crumb}
            </Button>
          </React.Fragment>
        ))}

        <Box sx={{ flexGrow: 1 }} />

        {/* Action buttons */}
        {!isXs && (
          <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
            {onNewFile && (
              <Tooltip title="New File">
                <IconButton
                  size="medium"
                  color="primary"
                  onClick={onNewFile}
                >
                  <AddCircleOutlined fontSize="medium" />
                </IconButton>
              </Tooltip>
            )}

            {onNewFolder && (
              <Tooltip title="New Folder">
                <IconButton
                  size="medium"
                  color="primary"
                  onClick={onNewFolder}
                >
                  <CreateNewFolderIcon fontSize="medium" />
                </IconButton>
              </Tooltip>
            )}

            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton
                  size="medium"
                  onClick={onRefresh}
                >
                  <RefreshIcon fontSize="medium" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>


    </Box>
  );
};
