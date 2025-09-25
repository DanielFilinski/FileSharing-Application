const config = {
  authorityHost: process.env.M365_AUTHORITY_HOST,
  tenantId: process.env.M365_TENANT_ID,
  clientId: process.env.M365_CLIENT_ID,
  clientSecret: process.env.M365_CLIENT_SECRET,
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:7071/api',
  editorBaseUrl: process.env.EDITOR_BASE_URL || 'https://office.com/editor',
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT,
  storageKey: process.env.AZURE_STORAGE_KEY,
  cosmosDbEndpoint: process.env.COSMOS_DB_ENDPOINT,
  cosmosDbKey: process.env.COSMOS_DB_KEY,
};

export default config;
