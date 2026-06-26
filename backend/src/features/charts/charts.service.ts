import { chartsRepository } from './charts.repository.js';

export const chartsService = {
  async healthCheck() {
    return chartsRepository.healthCheck();
  },

  async mostReviewed() {
    return chartsRepository.mostReviewed();
  },
   async topAllTime() {
    return chartsRepository.topAllTime();
  },
  async topByYear(year: number) {
    return chartsRepository.topByYear(year);
  },
  async topByGenre(genreSlug: string) {
    return chartsRepository.topByGenre(genreSlug);
  },

  async listGenres() {
    return chartsRepository.listGenres();
  },
};