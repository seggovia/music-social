import { chartsRepository } from './charts.repository.js';
import type { Pagination } from '../../shared/pagination.js';

export const chartsService = {
  async healthCheck() {
    return chartsRepository.healthCheck();
  },

  async mostReviewed(pagination: Pagination) {
    return chartsRepository.mostReviewed(pagination);
  },

  async topAllTime(pagination: Pagination) {
    return chartsRepository.topAllTime(pagination);
  },

  async topByYear(year: number, pagination: Pagination) {
    return chartsRepository.topByYear(year, pagination);
  },

  async topByGenre(genreSlug: string, pagination: Pagination) {
    return chartsRepository.topByGenre(genreSlug, pagination);
  },

  async listGenres() {
    return chartsRepository.listGenres();
  },
};
