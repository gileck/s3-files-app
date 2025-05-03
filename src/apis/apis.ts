import { ApiHandlers } from "./types";
import * as chat from "./chat/server";
import * as clearCache from "./settings/clearCache/server";
import * as fileManagement from "./fileManagement/server";
import * as aiUsage from "./monitoring/aiUsage/server";
import * as mongodb from "./mongodb/server";
import { DocumentsRequest, ModifyDocumentRequest, QueryRequest, StatsRequest, AIQueryRequest } from "./mongodb/types";


export const apiHandlers: ApiHandlers = {
  [chat.name]: { process: chat.process as (params: unknown) => Promise<unknown> },
  [clearCache.name]: { process: clearCache.process as (params: unknown) => Promise<unknown> },
  [fileManagement.name]: { process: fileManagement.process as (params: unknown) => Promise<unknown> },
  [aiUsage.all]: { process: aiUsage.getAllUsage as (params: unknown) => Promise<unknown> },
  [aiUsage.summary]: { process: aiUsage.getSummary as (params: unknown) => Promise<unknown> },
  [mongodb.collectionsApiName]: { process: () => mongodb.getCollections() },
  [mongodb.documentsApiName]: { process: (params: unknown) => mongodb.getDocuments(params as DocumentsRequest) },
  [mongodb.modifyDocumentApiName]: { process: (params: unknown) => mongodb.modifyDocument(params as ModifyDocumentRequest) },
  [mongodb.queryApiName]: { process: (params: unknown) => mongodb.executeCustomQuery(params as QueryRequest) },
  [mongodb.statsApiName]: { process: (params: unknown) => mongodb.getStats(params as StatsRequest) },
  [mongodb.aiQueryApiName]: { process: (params: unknown) => mongodb.generateAIQuery(params as AIQueryRequest) }
};
