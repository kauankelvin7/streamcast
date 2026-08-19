import { describe, it, expect } from 'vitest';
import { buildMovieUrl, buildTvUrl, buildEpisodeUrl } from './vidsrc';

describe('vidsrc URL builder', () => {
  describe('buildMovieUrl', () => {
    it('deve priorizar ID do IMDb quando fornecido', () => {
      const url = buildMovieUrl({ imdb: 'tt1234567', tmdb: '550' });
      expect(url).toBe('https://embedmaster.link/movie/tt1234567');
    });

    it('deve usar ID do TMDb quando IMDb não for fornecido', () => {
      const url = buildMovieUrl({ tmdb: 550 });
      expect(url).toBe('https://embedmaster.link/movie/550');
    });

    it('deve formatar IMDb sem prefixo tt adicionando tt', () => {
      const url = buildMovieUrl({ imdb: '1234567' });
      expect(url).toBe('https://embedmaster.link/movie/tt1234567');
    });
  });

  describe('buildTvUrl', () => {
    it('deve construir URL base de série com IMDb', () => {
      const url = buildTvUrl({ imdb: 'tt0944947' });
      expect(url).toBe('https://embedmaster.link/tv/tt0944947');
    });

    it('deve construir URL base de série com TMDb', () => {
      const url = buildTvUrl({ tmdb: 1399 });
      expect(url).toBe('https://embedmaster.link/tv/1399');
    });
  });

  describe('buildEpisodeUrl', () => {
    it('deve construir URL de episódio com temporada e número', () => {
      const url = buildEpisodeUrl({ imdb: 'tt0944947', season: 1, episode: 5 });
      expect(url).toBe('https://embedmaster.link/tv/tt0944947/1/5');
    });

    it('deve construir URL de episódio com TMDb', () => {
      const url = buildEpisodeUrl({ tmdb: 1399, season: 2, episode: 3 });
      expect(url).toBe('https://embedmaster.link/tv/1399/2/3');
    });
  });
});
