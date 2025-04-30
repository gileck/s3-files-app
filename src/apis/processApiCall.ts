import { NextApiRequest } from "next";
import { apiHandlers } from "./apis";
import { withCache } from "@/server/cache";
import { CacheResult } from "@/server/cache/types";
import type { ApiOptions } from "@/client/utils/apiClient";

export const processApiCall = async (request: NextApiRequest): Promise<CacheResult<unknown>> => {
  const name = request.body.name as keyof typeof apiHandlers;
  const params = request.body.params;
  const options = request.body.options as ApiOptions;
  const apiHandler = apiHandlers[name];
  if (!apiHandler) {
    throw new Error(`API handler not found for name: ${name}`);
  }
  const result = await withCache(() => apiHandler.process(params), {
    key: name,
    params,
  }, {
    bypassCache: options?.bypassCache || false,
    disableCache: options?.disableCache || false
  });
//   console.log('API response:', result);
  return result;
};