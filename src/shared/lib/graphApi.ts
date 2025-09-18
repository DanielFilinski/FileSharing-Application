import { Client } from '@microsoft/microsoft-graph-client';

export class GraphApiService {
  private graphClient: Client;

  constructor(token: string) {
    this.graphClient = Client.init({
      authProvider: (done) => done(null, token),
    });
  }

  async getOrganizationUsers() {
    return this.graphClient.api('/users').get();
  }
}

export const createGraphApiService = (token: string) => new GraphApiService(token);



