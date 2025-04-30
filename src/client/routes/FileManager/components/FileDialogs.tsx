import React from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Box
} from '@mui/material';
import type { FileInfo } from '@/apis/fileManagement/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`json-tabpanel-${index}`}
      aria-labelledby={`json-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

interface NewFileDialogProps {
  open: boolean;
  loading: boolean;
  fileName: string;
  fileContent: string;
  onClose: () => void;
  onFileNameChange: (value: string) => void;
  onFileContentChange: (value: string) => void;
  onSave: () => void;
}

export const NewFileDialog = ({
  open,
  loading,
  fileName,
  fileContent,
  onClose,
  onFileNameChange,
  onFileContentChange,
  onSave
}: NewFileDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>Create New File</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Enter the name and content for the new file.
      </DialogContentText>
      <TextField
        autoFocus
        margin="dense"
        label="File Name"
        fullWidth
        value={fileName}
        onChange={(e) => onFileNameChange(e.target.value)}
        disabled={loading}
      />
      <TextField
        margin="dense"
        label="File Content"
        fullWidth
        multiline
        rows={10}
        value={fileContent}
        onChange={(e) => onFileContentChange(e.target.value)}
        disabled={loading}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>Cancel</Button>
      <Button 
        onClick={onSave} 
        disabled={loading || !fileName.trim()}
        variant="contained"
        color="primary"
      >
        {loading ? <CircularProgress size={24} /> : 'Save'}
      </Button>
    </DialogActions>
  </Dialog>
);

interface NewFolderDialogProps {
  open: boolean;
  loading: boolean;
  folderName: string;
  onClose: () => void;
  onFolderNameChange: (value: string) => void;
  onSave: () => void;
}

export const NewFolderDialog = ({
  open,
  loading,
  folderName,
  onClose,
  onFolderNameChange,
  onSave
}: NewFolderDialogProps) => (
  <Dialog open={open} onClose={onClose} fullWidth>
    <DialogTitle>Create New Folder</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Enter the name for the new folder.
      </DialogContentText>
      <TextField
        autoFocus
        margin="dense"
        label="Folder Name"
        fullWidth
        value={folderName}
        onChange={(e) => onFolderNameChange(e.target.value)}
        disabled={loading}
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} disabled={loading}>Cancel</Button>
      <Button 
        onClick={onSave} 
        disabled={loading || !folderName.trim()}
        variant="contained"
        color="primary"
      >
        {loading ? <CircularProgress size={24} /> : 'Create'}
      </Button>
    </DialogActions>
  </Dialog>
);

interface EditFileDialogProps {
  open: boolean;
  loading: boolean;
  file: FileInfo | null;
  fileContent: string;
  onClose: () => void;
  onFileContentChange: (value: string) => void;
  onSave: () => void;
}

export const EditFileDialog = ({
  open,
  loading,
  file,
  fileContent,
  onClose,
  onFileContentChange,
  onSave
}: EditFileDialogProps) => {
  // Extract filename from the key
  const fileName = file ? file.key.split('/').pop() || file.key : '';
  
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Edit File: {fileName}</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="File Content"
          fullWidth
          multiline
          rows={15}
          value={fileContent}
          onChange={(e) => onFileContentChange(e.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={onSave} 
          disabled={loading}
          variant="contained"
          color="primary"
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface ViewFileDialogProps {
  open: boolean;
  loading: boolean;
  file: FileInfo | null;
  fileContent: string;
  isJsonContent: boolean;
  jsonViewTab: number;
  onClose: () => void;
  onTabChange: (newValue: number) => void;
}

export const ViewFileDialog = ({
  open,
  loading,
  file,
  fileContent,
  isJsonContent,
  jsonViewTab,
  onClose,
  onTabChange
}: ViewFileDialogProps) => {
  // Extract filename from the key
  const fileName = file ? file.key.split('/').pop() || file.key : '';
  
  let parsedJson = null;
  let formattedJson = '';
  
  if (isJsonContent) {
    try {
      parsedJson = JSON.parse(fileContent);
      formattedJson = JSON.stringify(parsedJson, null, 2);
    } catch {
      // If parsing fails, treat as regular text
      isJsonContent = false;
    }
  }
  
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>View File: {fileName}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : isJsonContent ? (
          <>
            <Tabs 
              value={jsonViewTab} 
              onChange={(_, newValue) => onTabChange(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Formatted" />
              <Tab label="Raw" />
            </Tabs>
            <TabPanel value={jsonViewTab} index={0}>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontFamily: 'monospace'
              }}>
                {formattedJson}
              </pre>
            </TabPanel>
            <TabPanel value={jsonViewTab} index={1}>
              <TextField
                fullWidth
                multiline
                rows={15}
                value={fileContent}
                InputProps={{ readOnly: true }}
              />
            </TabPanel>
          </>
        ) : (
          <TextField
            fullWidth
            multiline
            rows={15}
            value={fileContent}
            InputProps={{ readOnly: true }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

interface DeleteConfirmDialogProps {
  open: boolean;
  loading: boolean;
  item: FileInfo | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmDialog = ({
  open,
  loading,
  item,
  onClose,
  onConfirm
}: DeleteConfirmDialogProps) => {
  // Extract filename from the key
  const itemName = item ? item.key.split('/').pop() || item.key : '';
  
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete {item?.isFolder ? 'folder' : 'file'} &ldquo;{itemName}&rdquo;?
          {item?.isFolder && ' This will delete all contents inside the folder.'}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          onClick={onConfirm} 
          disabled={loading}
          variant="contained"
          color="error"
        >
          {loading ? <CircularProgress size={24} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
