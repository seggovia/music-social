import { albumsRepository } from './albums.repository.js';

export const albumsService = {
  async healthCheck() {
    return albumsRepository.healthCheck();
  },
};
