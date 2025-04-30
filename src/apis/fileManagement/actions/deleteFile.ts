import { DeleteFileRequest, DeleteFileResponse } from '../types';
import { deleteFile as s3DeleteFile } from '@/server/s3/sdk';

export async function deleteFile(request: DeleteFileRequest): Promise<DeleteFileResponse> {
  if (!request.fileName) {
    return {
      success: false,
      error: "Missing required field: fileName"
    };
  }
  
  try {
    await s3DeleteFile(request.fileName);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
