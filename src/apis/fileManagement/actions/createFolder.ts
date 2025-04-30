import { CreateFolderRequest, CreateFolderResponse } from '../types';
import { uploadFile } from '@/server/s3/sdk';

export async function createFolder(request: CreateFolderRequest): Promise<CreateFolderResponse> {
  if (!request.folderName) {
    return {
      key: "",
      error: "Missing required field: folderName"
    };
  }
  
  try {
    // Folders in S3 are just empty objects with a trailing slash
    const folderKey = request.folderName.endsWith('/') 
      ? request.folderName 
      : `${request.folderName}/`;
      
    const key = await uploadFile({
      content: '',
      fileName: folderKey
    });
    
    return { key };
  } catch (error) {
    return {
      key: "",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
