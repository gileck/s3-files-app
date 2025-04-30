import { WriteFileRequest, WriteFileResponse } from '../types';
import { uploadFile } from '@/server/s3/sdk';

export async function writeFile(request: WriteFileRequest): Promise<WriteFileResponse> {
  if (!request.fileName || request.content === undefined) {
    return {
      key: "",
      error: "Missing required fields: fileName and content are required"
    };
  }
  
  try {
    const key = await uploadFile({
      content: request.content,
      fileName: request.fileName,
      contentType: request.contentType
    });
    
    return { key };
  } catch (error) {
    return {
      key: "",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
