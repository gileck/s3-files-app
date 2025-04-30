import React, { useState, useEffect } from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  IconButton,
  Tooltip,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Typography,
  Button,
  Box
} from '@mui/material';
import {
  Folder as FolderIcon,
  Description as FileIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  ContentCopy as CopyIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import type { FileInfo } from '@/apis/fileManagement/types';

interface FileListProps {
  files: FileInfo[];
  loading: boolean;
  onNavigateToFolder: (prefix: string, folderName: string) => void;
  onDeleteItem: (file: FileInfo) => void;
  onEditFile: (file: FileInfo) => void;
  onViewFile: (file: FileInfo) => void;
  onCopyFile?: (file: FileInfo) => void;
  onDownloadFile?: (file: FileInfo) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Function to format date and time
const formatDateTime = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(date).toLocaleString(undefined, options);
};

// Function to shorten long filenames
const shortenFileName = (fileName: string, maxLength = 50): string => {
  if (fileName.length <= maxLength) return fileName;

  const ext = fileName.includes('.') ?
    fileName.substring(fileName.lastIndexOf('.')) : '';

  const name = fileName.includes('.') ?
    fileName.substring(0, fileName.lastIndexOf('.')) : fileName;

  const shortName = name.substring(0, maxLength - ext.length - 3) + '...';
  return shortName + ext;
};

export const FileList = ({
  files,
  loading,
  onNavigateToFolder,
  onDeleteItem,
  onEditFile,
  onViewFile,
  onCopyFile = () => { },
  onDownloadFile = () => { }
}: FileListProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [visibleFiles, setVisibleFiles] = useState<FileInfo[]>([]);
  const [itemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Sort files by date and prepare for pagination
  useEffect(() => {
    if (!files.length) return;

    // Sort files by date (newest first) and separate folders to keep them at the top
    const sortedFiles = [...files].sort((a, b) => {
      // Always keep folders at top
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      // Then sort by date (newest first)
      const dateA = new Date(a.lastModified).getTime();
      const dateB = new Date(b.lastModified).getTime();
      return dateB - dateA;
    });

    // Update visible files based on current page
    const slicedFiles = sortedFiles.slice(0, currentPage * itemsPerPage);
    setVisibleFiles(slicedFiles);
  }, [files, currentPage, itemsPerPage]);

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (files.length === 0) {
    return <div>No files found in this directory.</div>;
  }

  const remainingFiles = files.length - visibleFiles.length;

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          mt: 1
        }}
      >
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          Showing {visibleFiles.length} of {files.length} items
        </Typography>

        {files.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {files.filter(f => f.isFolder).length} folders, {files.filter(f => !f.isFolder).length} files
          </Typography>
        )}
      </Box>

      <List sx={{ width: '100%' }}>
        {visibleFiles.map((file) => {
          // Extract filename from the key
          const keyParts = file.key.split('/');
          const fileName = keyParts[keyParts.length - 1] || file.key;
          // Extract prefix (directory path) from the key
          const prefix = file.key.substring(0, file.key.length - fileName.length);
          // Get shortened filename for display
          const displayName = isMobile ? shortenFileName(fileName, 40) : shortenFileName(fileName, 30);

          return (
            <ListItem
              key={file.key}
              sx={{
                borderBottom: '1px solid #eee',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                p: 0,
                mb: 1.5,
                borderRadius: 1,
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {/* File Name Row */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    py: 1.5,
                    px: isMobile ? 1.5 : 2,
                    cursor: file.isFolder ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (file.isFolder) {
                      onNavigateToFolder(prefix, fileName);
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: isMobile ? 36 : 48 }}>
                    {file.isFolder ?
                      <FolderIcon color="primary" fontSize={isMobile ? "medium" : "medium"} /> :
                      <FileIcon color="info" fontSize={isMobile ? "medium" : "medium"} />
                    }
                  </ListItemIcon>

                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: isMobile ? '0.95rem' : '1.1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {displayName}
                    </Typography>
                  </Box>
                </Box>

                {/* Info and Actions Row */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    py: 0.5,
                    px: isMobile ? 1.5 : 2,
                    borderTop: '1px solid rgba(0, 0, 0, 0.07)'
                  }}
                >
                  {/* File info */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
                      color: 'text.secondary',
                      mr: 1,
                      flexShrink: 0
                    }}
                  >
                    {file.isFolder ? 'Folder' : formatFileSize(file.size)} • {formatDateTime(file.lastModified)}
                  </Typography>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {!file.isFolder && (
                      <>
                        <Tooltip title="View">
                          <IconButton
                            onClick={() => onViewFile(file)}
                            size="small"
                            sx={{ p: 0.5 }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => onEditFile(file)}
                            size="small"
                            sx={{ p: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Copy">
                          <IconButton
                            onClick={() => onCopyFile(file)}
                            size="small"
                            sx={{ p: 0.5 }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Download">
                          <IconButton
                            onClick={() => onDownloadFile(file)}
                            size="small"
                            sx={{ p: 0.5 }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}

                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => onDeleteItem(file)}
                        size="small"
                        color="error"
                        sx={{ p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>
            </ListItem>
          );
        })}
      </List>

      {remainingFiles > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
          <Button
            variant="contained"
            onClick={handleLoadMore}
            size={isMobile ? "medium" : "large"}
            sx={{ px: 3, py: 1 }}
          >
            Load More ({remainingFiles} files remaining)
          </Button>
        </Box>
      )}
    </>
  );
};
