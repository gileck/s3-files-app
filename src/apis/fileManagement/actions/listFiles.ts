import { ListFilesRequest, ListFilesResponse, FileInfo } from '../types';
import { listFiles as s3ListFiles } from '@/server/s3/sdk';

export async function listFiles(request: ListFilesRequest): Promise<ListFilesResponse> {
  try {
    const s3Files = await s3ListFiles(request.prefix);
    
    // Convert S3Files to FileInfo ensuring isFolder is always a boolean
    const files: FileInfo[] = s3Files.map(file => ({
      key: file.key,
      size: file.size,
      lastModified: file.lastModified,
      isFolder: file.isFolder === true,
      fileCount: file.fileCount
    }));
    
    return { files };
  } catch (error) {
    return {
      files: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
