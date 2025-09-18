import { CosmosClient, Container, Database } from '@azure/cosmos';

export class CosmosDbService {
  private client: CosmosClient;
  private database: Database;
  private containers: Record<string, Container>;

  constructor(connectionString: string, databaseName: string) {
    this.client = new CosmosClient(connectionString);
    this.database = this.client.database(databaseName);
    this.containers = {
      documents: this.database.container('documents'),
      chatMessages: this.database.container('chat-messages'),
      auditEvents: this.database.container('audit-events'),
      userFavorites: this.database.container('user-favorites'),
      documentVersions: this.database.container('document-versions'),
    } as unknown as Record<string, Container>;
  }

  async queryDocuments(query: string, parameters: any[] = []) {
    const { resources } = await this.containers.documents.items.query({ query, parameters }).fetchAll();
    return resources;
  }
}

export const cosmosDbService = new CosmosDbService(
  import.meta.env.VITE_COSMOSDB_CONNECTION_STRING,
  import.meta.env.VITE_COSMOSDB_DATABASE_NAME,
);



