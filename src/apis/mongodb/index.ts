// Import the API types
export * from './types';

// API names - these must all be exported here
export const name = 'mongodb';
export const databasesApiName = `${name}/databases`;
export const collectionsApiName = `${name}/collections`;
export const documentsApiName = `${name}/documents`;
export const modifyDocumentApiName = `${name}/modifyDocument`;
export const queryApiName = `${name}/query`;
export const statsApiName = `${name}/stats`;
export const aiQueryApiName = `${name}/aiQuery`; 