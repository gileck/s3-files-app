import { NextApiRequest } from "next";
import { apiHandlers } from "./apis";
import { withCache } from "@/server/cache";
import { CacheResult } from "@/server/cache/types";
import { connectToDatabase } from "@/server/db/context";

export const processApiCall = async (request: NextApiRequest): Promise<CacheResult<unknown>> => {
  const name = request.body.name as keyof typeof apiHandlers;
  const params = request.body.params;

  // Initialize database context if database parameter is provided
  if (params && params.database) {
    await connectToDatabase(params.database);
  }

  const apiHandler = apiHandlers[name];
  if (!apiHandler) {
    throw new Error(`API handler not found for name: ${name}`);
  }

  const result = await withCache(() => apiHandler.process(params), {
    key: name,
    params,
  }, {
    // bypassCache: options?.bypassCache || false,
    // disableCache: options?.disableCache || false
    disableCache: true
  });

  //   console.log('API response:', result);
  return result;
};