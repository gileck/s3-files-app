import React from 'react';
import {
  Typography,
  Paper,
  Box,
  Alert,
  Container
} from '@mui/material';
import { useFileManager } from './hooks';
import {
  FileList,
  Breadcrumbs,
  NewFileDialog,
  NewFolderDialog,
  EditFileDialog,
  ViewFileDialog,
  DeleteConfirmDialog
} from './components';

export const FileManager = () => {
  const {
    // State
    files,
    loading,
    error,
    breadcrumbs,

    // File creation
    newFileName,
    setNewFileName,
    newFileContent,
    setNewFileContent,
    showNewFileDialog,
    setShowNewFileDialog,

    // Folder creation
    newFolderName,
    setNewFolderName,
    showNewFolderDialog,
    setShowNewFolderDialog,

    // File edit
    editingFile,
    editFileContent,
    setEditFileContent,
    showEditFileDialog,
    loadingFileContent,

    // File view
    viewingFile,
    viewFileContent,
    showViewFileDialog,
    isJsonContent,
    jsonViewTab,
    setJsonViewTab,

    // Delete confirmation
    itemToDelete,
    showDeleteConfirmDialog,

    // Actions
    fetchFiles,
    handleNavigateToFolder,
    handleBreadcrumbNavigation,
    handleCreateFile,
    handleCreateFolder,
    handleEditFile,
    handleSaveEditedFile,
    handleViewFile,
    handleCopyFile,
    handleDownloadFile,
    handleDeleteItem,
    handleConfirmDelete,
    resetDialogs
  } = useFileManager();

  return (
    <Container maxWidth="lg" sx={{ p: 0 }}>
      <Paper elevation={2} sx={{ p: 1, mt: 3, mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          File Manager
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Breadcrumbs
          breadcrumbs={breadcrumbs}
          onNavigate={handleBreadcrumbNavigation}
          onNewFile={() => setShowNewFileDialog(true)}
          onNewFolder={() => setShowNewFolderDialog(true)}
          onRefresh={fetchFiles}
        />

        <Box sx={{ mt: 2 }}>
          <FileList
            files={files}
            loading={loading}
            onNavigateToFolder={handleNavigateToFolder}
            onDeleteItem={handleDeleteItem}
            onEditFile={handleEditFile}
            onViewFile={handleViewFile}
            onCopyFile={handleCopyFile}
            onDownloadFile={handleDownloadFile}
          />
        </Box>

        {/* Dialogs */}
        <NewFileDialog
          open={showNewFileDialog}
          loading={loading}
          fileName={newFileName}
          fileContent={newFileContent}
          onClose={() => setShowNewFileDialog(false)}
          onFileNameChange={setNewFileName}
          onFileContentChange={setNewFileContent}
          onSave={handleCreateFile}
        />

        <NewFolderDialog
          open={showNewFolderDialog}
          loading={loading}
          folderName={newFolderName}
          onClose={() => setShowNewFolderDialog(false)}
          onFolderNameChange={setNewFolderName}
          onSave={handleCreateFolder}
        />

        <EditFileDialog
          open={showEditFileDialog}
          loading={loading || loadingFileContent}
          file={editingFile}
          fileContent={editFileContent}
          onClose={() => resetDialogs()}
          onFileContentChange={setEditFileContent}
          onSave={handleSaveEditedFile}
        />

        <ViewFileDialog
          open={showViewFileDialog}
          loading={loadingFileContent}
          file={viewingFile}
          fileContent={viewFileContent}
          isJsonContent={isJsonContent}
          jsonViewTab={jsonViewTab}
          onClose={() => resetDialogs()}
          onTabChange={setJsonViewTab}
        />

        <DeleteConfirmDialog
          open={showDeleteConfirmDialog}
          loading={loading}
          item={itemToDelete}
          onClose={() => resetDialogs()}
          onConfirm={handleConfirmDelete}
        />
      </Paper>
    </Container>
  );
};
