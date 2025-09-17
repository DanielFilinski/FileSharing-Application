import { apiClient } from '@/shared/api';

export const favoritesApi = {
  async getUserFavorites(userId: string): Promise<string[]> {
    const res = await apiClient.get<string[]>(`/favorites/${userId}`);
    return res.data;
  },

  async addToFavorites(userId: string, documentId: string): Promise<void> {
    await apiClient.post<void>('/favorites', { userId, documentId });
  },

  async removeFromFavorites(userId: string, documentId: string): Promise<void> {
    await apiClient.delete<void>(`/favorites/${userId}/${documentId}`);
  },

  async getFavoritesCount(userId: string): Promise<number> {
    const res = await apiClient.get<number>(`/favorites/${userId}/count`);
    return res.data;
  }
};


