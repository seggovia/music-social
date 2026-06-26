import { chartsRepository } from './charts.repository.js';

export const chartsService = {
  async healthCheck() {
    return chartsRepository.healthCheck();
  },

  async mostReviewed() {
    return chartsRepository.mostReviewed();
  },
};