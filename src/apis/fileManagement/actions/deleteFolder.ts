import { DeleteFolderRequest, DeleteFolderResponse } from '../types';
import { deleteFile, listFiles } from '@/server/s3/sdk';

export async function deleteFolder(request: DeleteFolderRequest): Promise<DeleteFolderResponse> {
  if (!request.folderName) {
    return {
      success: false,
      error: "Missing required field: folderName"
    };
  }
  
  try {
    // Get the folder name with trailing slash
    const folderKey = request.folderName.endsWith('/') 
      ? request.folderName 
      : `${request.folderName}/`;
    
    // List all files in the folder
    const files = await listFiles(folderKey);
    
    // Delete all files in the folder
    for (const file of files) {
      await deleteFile(file.key);
    }
    
    // Delete the folder marker itself
    await deleteFile(folderKey);
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
