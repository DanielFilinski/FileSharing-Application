import { createGraphApiService } from './graphApi';
import { apiClient } from '../api';

export class SyncService {
  private graphApi = createGraphApiService(this.token);
  constructor(private token: string) {}

  async syncUsersWithAzureAd() {
    const azureUsers = await this.graphApi.getOrganizationUsers();
    await apiClient.post('/users/sync-azure-ad', { users: azureUsers.value });
    return apiClient.get('/users/employees');
  }
}



