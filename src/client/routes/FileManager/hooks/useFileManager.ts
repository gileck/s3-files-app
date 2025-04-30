import { useState, useCallback, useEffect } from 'react';
import {
  listFiles,
  writeFile,
  deleteFile,
  createFolder,
  deleteFolder,
  getFile
} from '@/apis/fileManagement/client';
import type { FileInfo } from '@/apis/fileManagement/types';

export const useFileManager = () => {
  // State
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrefix, setCurrentPrefix] = useState<string>('');
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  // File creation state
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);

  // Folder creation state
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  // File edit state
  const [editingFile, setEditingFile] = useState<FileInfo | null>(null);
  const [editFileContent, setEditFileContent] = useState('');
  const [showEditFileDialog, setShowEditFileDialog] = useState(false);
  const [loadingFileContent, setLoadingFileContent] = useState(false);

  // File view state
  const [viewingFile, setViewingFile] = useState<FileInfo | null>(null);
  const [viewFileContent, setViewFileContent] = useState('');
  const [showViewFileDialog, setShowViewFileDialog] = useState(false);
  const [isJsonContent, setIsJsonContent] = useState(false);
  const [jsonViewTab, setJsonViewTab] = useState(0);

  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<FileInfo | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);

  // Fetch files from the API
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await listFiles(currentPrefix);
      setFiles(response.data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPrefix]);

  // Load files on component mount and when prefix changes
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Handle navigation to a folder
  const handleNavigateToFolder = useCallback((prefix: string, folderName: string) => {
    const newPrefix = `${prefix}${folderName}`;
    setCurrentPrefix(newPrefix);

    // Update breadcrumbs
    if (prefix === '') {
      // Going from root to first level
      setBreadcrumbs([folderName]);
    } else {
      // Going deeper
      setBreadcrumbs([...breadcrumbs, folderName]);
    }
  }, [breadcrumbs]);

  // Handle navigation via breadcrumbs
  const handleBreadcrumbNavigation = useCallback((index: number) => {
    if (index === -1) {
      // Navigate to root
      setCurrentPrefix('');
      setBreadcrumbs([]);
    } else {
      // Navigate to specific breadcrumb
      const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
      const newPrefix = newBreadcrumbs.reduce((acc, crumb) => `${acc}${crumb}/`, '');

      setCurrentPrefix(newPrefix);
      setBreadcrumbs(newBreadcrumbs);
    }
  }, [breadcrumbs]);

  // Handle creating a new file
  const handleCreateFile = useCallback(async () => {
    if (!newFileName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const filePath = `${currentPrefix}${newFileName}`;
      await writeFile(filePath, newFileContent);

      // Reset state and refresh files
      setNewFileName('');
      setNewFileContent('');
      setShowNewFileDialog(false);
      fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create file');
      console.error('Error creating file:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPrefix, newFileName, newFileContent, fetchFiles]);

  // Handle creating a new folder
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const folderPath = `${currentPrefix}${newFolderName}/`;
      await createFolder(folderPath);

      // Reset state and refresh files
      setNewFolderName('');
      setShowNewFolderDialog(false);
      fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
      console.error('Error creating folder:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPrefix, newFolderName, fetchFiles]);

  // Handle editing a file
  const handleEditFile = useCallback(async (file: FileInfo) => {
    setEditingFile(file);
    setLoadingFileContent(true);

    try {
      const filePath = file.key;

      const response = await getFile(filePath);

      setEditFileContent(response.data.content || '');
      setShowEditFileDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file content');
      console.error('Error loading file content:', err);
    } finally {
      setLoadingFileContent(false);
    }
  }, []);

  // Handle saving edited file
  const handleSaveEditedFile = useCallback(async () => {
    if (!editingFile) return;

    setLoading(true);
    setError(null);

    try {
      const filePath = editingFile.key;
      await writeFile(filePath, editFileContent);

      // Reset state and refresh files
      setEditingFile(null);
      setEditFileContent('');
      setShowEditFileDialog(false);
      fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
      console.error('Error saving file:', err);
    } finally {
      setLoading(false);
    }
  }, [editingFile, editFileContent, fetchFiles]);

  // Handle viewing a file
  const handleViewFile = useCallback(async (file: FileInfo) => {
    setViewingFile(file);
    setLoadingFileContent(true);

    try {
      const filePath = file.key;
      const response = await getFile(filePath);
      const content = response.data.content || '';

      setViewFileContent(content);

      // Check if content is JSON
      try {
        JSON.parse(content);
        setIsJsonContent(true);
      } catch {
        setIsJsonContent(false);
      }

      setShowViewFileDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file content');
      console.error('Error loading file content:', err);
    } finally {
      setLoadingFileContent(false);
    }
  }, []);

  // Handle copying a file to clipboard
  const handleCopyFile = useCallback(async (file: FileInfo) => {
    try {
      const filePath = file.key;
      const response = await getFile(filePath);
      const content = response.data.content || '';

      await navigator.clipboard.writeText(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy file content');
      console.error('Error copying file content:', err);
    }
  }, []);

  // Handle downloading a file
  const handleDownloadFile = useCallback(async (file: FileInfo) => {
    try {
      const filePath = file.key;
      const response = await getFile(filePath);
      const content = response.data.content || '';

      // Create a blob with the file content
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      // Create a download link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
      console.error('Error downloading file:', err);
    }
  }, []);

  // Handle deleting a file or folder
  const handleDeleteItem = useCallback((item: FileInfo) => {
    setItemToDelete(item);
    setShowDeleteConfirmDialog(true);
  }, []);

  // Handle confirming deletion
  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    setLoading(true);
    setError(null);

    try {
      const path = itemToDelete.key + (itemToDelete.isFolder ? '/' : '');

      if (itemToDelete.isFolder) {
        await deleteFolder(path);
      } else {
        await deleteFile(path);
      }

      // Reset state and refresh files
      setItemToDelete(null);
      setShowDeleteConfirmDialog(false);
      fetchFiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
      console.error('Error deleting item:', err);
    } finally {
      setLoading(false);
    }
  }, [itemToDelete, fetchFiles]);

  // Reset dialogs
  const resetDialogs = useCallback(() => {
    setShowNewFileDialog(false);
    setShowNewFolderDialog(false);
    setShowEditFileDialog(false);
    setShowViewFileDialog(false);
    setShowDeleteConfirmDialog(false);
  }, []);

  return {
    // State
    files,
    loading,
    error,
    currentPrefix,
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
  };
};
