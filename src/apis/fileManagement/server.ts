import { 
  FileManagementRequest, 
  FileManagementResponse,
  ListFilesResponse,
  GetFileResponse,
  WriteFileResponse,
  DeleteFileResponse,
  CreateFolderResponse,
  DeleteFolderResponse
} from "./types";
import { name } from './index';
import {
  listFiles,
  getFile,
  writeFile,
  deleteFile,
  createFolder,
  deleteFolder
} from './actions';

export { name };

// Process function that handles all file management operations
export const process = async (request: FileManagementRequest): Promise<FileManagementResponse> => {
  try {
    // Input validation
    if (!request.action) {
      return {
        files: [],
        error: "Missing required field: action"
      } as ListFilesResponse;
    }

    // Route to the appropriate action handler
    switch (request.action) {
      case 'list':
        return listFiles(request);
        
      case 'getFile':
        return getFile(request);
        
      case 'write':
        return writeFile(request);
        
      case 'delete':
        return deleteFile(request);
        
      case 'createFolder':
        return createFolder(request);
        
      case 'deleteFolder':
        return deleteFolder(request);
        
      default: {
        // In TypeScript's control flow analysis, by the time we reach this default case,
        // request.action is of type never, since we've exhausted all possible action types
        // in the switch statement. We need to handle this case properly.
        return {
          files: [],
          error: "Invalid action"
        } as ListFilesResponse;
      }
    }
  } catch (error) {
    console.error('Error in file management API:', error);
    
    // Return appropriate error response based on the action
    switch (request.action) {
      case 'list':
        return {
          files: [],
          error: error instanceof Error ? error.message : String(error)
        } as ListFilesResponse;
      
      case 'getFile':
        return {
          content: "",
          error: error instanceof Error ? error.message : String(error)
        } as GetFileResponse;
        
      case 'write':
      case 'createFolder':
        return {
          key: "",
          error: error instanceof Error ? error.message : String(error)
        } as WriteFileResponse | CreateFolderResponse;
        
      case 'delete':
      case 'deleteFolder':
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        } as DeleteFileResponse | DeleteFolderResponse;
        
      default: {
        // In TypeScript's control flow analysis, by the time we reach this default case,
        // request.action is of type never, since we've exhausted all possible action types
        // in the switch statement. We need to handle this case properly.
        return {
          files: [],
          error: error instanceof Error ? error.message : String(error)
        } as ListFilesResponse;
      }
    }
  }
};
