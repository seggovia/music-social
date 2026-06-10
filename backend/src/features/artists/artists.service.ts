import { artistsRepository } from './artists.repository.js';

export const artistsService = {
  async healthCheck() {
    return artistsRepository.healthCheck();
  },
};
