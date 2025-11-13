import { useState } from 'react';
import { IconSearch, IconPlayerPlay, IconMovie, IconDeviceTv, IconLink, IconPlus, IconChevronRight, IconStar } from '@tabler/icons-react';
import type { VideoSource, TMDBMovie, TMDBTVShow } from '../types';
import { searchMovies, searchTVShows, getTMDBPosterUrl, getMovieExternalIds, getTVExternalIds, mapGenreIdsToTags } from '../api/tmdb';

type SearchTabProps = {
  onAddVideo: (video: VideoSource) => void;
};

type ContentType = 'direct' | 'movie' | 'tv';

export default function SearchTab({ onAddVideo }: SearchTabProps) {
  const [contentType, setContentType] = useState<ContentType>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedShow, setSelectedShow] = useState<TMDBTVShow | null>(null);
  
  // Estados para URL direta
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  
  // Estados para episódios
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSelectedShow(null);
    try {
      if (contentType === 'movie') {
        const results = await searchMovies(searchQuery);
        setSearchResults(results);
      } else if (contentType === 'tv') {
        const results = await searchTVShows(searchQuery);
        setSearchResults(results);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMovie = async (movie: TMDBMovie) => {
    const tmdbId = String(movie.id);
    
    let imdbId: string | undefined;
    try {
      const externalIds = await getMovieExternalIds(movie.id);
      imdbId = externalIds.imdb_id || undefined;
    } catch (e) {
      console.warn('Não foi possível obter IMDB ID');
    }

    const tags = mapGenreIdsToTags(movie.genre_ids);

    const newVideo: VideoSource = {
      id: Date.now().toString(),
      title: movie.title,
      url: '',
      type: 'movie',
      tmdb: tmdbId,
      imdb: imdbId,
      posterPath: movie.poster_path || undefined,
      tags: tags.length > 0 ? tags : undefined,
      addedAt: new Date().toISOString()
    };

    onAddVideo(newVideo);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSelectShow = (show: TMDBTVShow) => {
    setSelectedShow(show);
    setSearchResults([]);
  };

  const handleAddEpisode = async () => {
    if (!selectedShow) return;

    const tmdbId = String(selectedShow.id);
    
    let imdbId: string | undefined;
    try {
      const externalIds = await getTVExternalIds(selectedShow.id);
      imdbId = externalIds.imdb_id || undefined;
    } catch (e) {
      console.warn('Não foi possível obter IMDB ID');
    }

    const tags = mapGenreIdsToTags(selectedShow.genre_ids);

    const newVideo: VideoSource = {
      id: Date.now().toString(),
      title: `${selectedShow.name} - S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`,
      url: '',
      type: 'episode',
      tmdb: tmdbId,
      imdb: imdbId,
      season,
      episode,
      posterPath: selectedShow.poster_path || undefined,
      tags: tags.length > 0 ? tags : undefined,
      addedAt: new Date().toISOString()
    };

    onAddVideo(newVideo);
    
    // Auto-incrementar episódio
    setEpisode(episode + 1);
  };

  const handleAddDirect = () => {
    if (!videoUrl.trim()) {
      alert('Insira a URL do vídeo!');
      return;
    }

    const newVideo: VideoSource = {
      id: Date.now().toString(),
      title: videoTitle || `Vídeo ${Date.now()}`,
      url: videoUrl,
      type: 'direct',
      addedAt: new Date().toISOString()
    };

    onAddVideo(newVideo);
    setVideoTitle('');
    setVideoUrl('');
  };

  return (
    <div className="space-y-6">
      {/* Seletor de Tipo de Conteúdo */}
      <div className="flex gap-2 p-1.5 bg-gray-100 rounded-xl border border-gray-300">
        <button
          onClick={() => { setContentType('direct'); setSearchResults([]); setSelectedShow(null); }}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm ${
            contentType === 'direct' 
              ? 'bg-gray-800 text-white' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          <IconLink className="w-5 h-5" />
          <span className="hidden sm:inline">URL Direta</span>
          <span className="sm:hidden">URL</span>
        </button>
        <button
          onClick={() => { setContentType('movie'); setSearchResults([]); setSelectedShow(null); }}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm ${
            contentType === 'movie' 
              ? 'bg-gray-800 text-white' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          <IconMovie className="w-5 h-5" />
          Filmes
        </button>
        <button
          onClick={() => { setContentType('tv'); setSearchResults([]); setSelectedShow(null); }}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-semibold flex items-center justify-center gap-2 text-sm ${
            contentType === 'tv' 
              ? 'bg-gray-800 text-white' 
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          <IconDeviceTv className="w-5 h-5" />
          Séries
        </button>
      </div>

      {/* Conteúdo Principal */}
      {contentType === 'direct' ? (
        // URL Direta
        <div className="bg-gray-50 rounded-xl p-5 sm:p-6 border border-gray-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center">
              <IconLink className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-gray-800 font-bold text-lg">Adicionar URL Direta</h3>
              <p className="text-gray-600 text-xs">Suporte para MP4, WebM, e mais</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-gray-700 text-sm font-semibold mb-2 block">Título do Vídeo</label>
              <input
                type="text"
                placeholder="ex: Meu Vídeo Personalizado"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="text-gray-700 text-sm font-semibold mb-2 block">URL do Vídeo</label>
              <input
                type="text"
                placeholder="https://exemplo.com/video.mp4"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 font-mono text-sm"
              />
            </div>
            <button
              onClick={handleAddDirect}
              className="w-full py-3.5 bg-gray-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
            >
              <IconPlus className="w-5 h-5" />
              Adicionar à Playlist
            </button>
          </div>
        </div>
      ) : selectedShow ? (
        // Seletor de Episódios
        <div className="space-y-4">
          <div className="bg-gray-800/20 rounded-xl p-5 sm:p-6 border border-gray-600/20">
            <div className="flex items-start gap-4 mb-6">
              <button
                onClick={() => setSelectedShow(null)}
                className="px-4 py-2 bg-gray-800/30 hover:bg-gray-800/50 text-text-secondary rounded-lg text-sm font-semibold"
              >
                ← Voltar
              </button>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <IconDeviceTv className="w-6 h-6 text-gray-400" />
                  {selectedShow.name}
                </h3>
                <p className="text-text-secondary text-sm mt-1">
                  {selectedShow.first_air_date ? new Date(selectedShow.first_air_date).getFullYear() : '—'}
                </p>
              </div>
            </div>

            {selectedShow.poster_path && (
              <div className="mb-6 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <img
                  src={getTMDBPosterUrl(selectedShow.poster_path, 'w200')}
                  alt={selectedShow.name}
                  className="w-24 sm:w-32 h-36 sm:h-48 object-cover rounded-lg border border-gray-600/20"
                />
                {selectedShow.overview && (
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-2 text-sm">Sinopse</h4>
                    <p className="text-text-secondary text-sm line-clamp-4">{selectedShow.overview}</p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-800/30 rounded-lg p-5 border border-gray-600/20">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <IconPlayerPlay className="w-6 h-6 text-gray-400" />
                Selecionar Episódio
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-text-secondary text-sm font-semibold mb-2 block">Temporada</label>
                    <input
                    type="number"
                    min="1"
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-background border border-gray-600/20 focus:border-gray-600 rounded-lg text-white text-center text-lg font-bold"
                  />
                </div>
                <div>
                  <label className="text-text-secondary text-sm font-semibold mb-2 block">Episódio</label>
                    <input
                    type="number"
                    min="1"
                    value={episode}
                    onChange={(e) => setEpisode(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-background border border-gray-600/20 focus:border-gray-600 rounded-lg text-white text-center text-lg font-bold"
                  />
                </div>
              </div>

              <div className="bg-gray-700/10 border border-gray-600/30 rounded-lg p-3 mb-4">
                <p className="text-gray-300 text-sm font-semibold">
                  📺 Adicionando: {selectedShow.name} - S{season.toString().padStart(2, '0')}E{episode.toString().padStart(2, '0')}
                </p>
              </div>

              <button
                onClick={handleAddEpisode}
                className="w-full py-3.5 bg-gray-600 text-white font-bold rounded-lg flex items-center justify-center gap-2"
              >
                <IconPlus className="w-6 h-6" />
                Adicionar Episódio
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Busca de Filmes/Séries
        <div className="bg-gray-50 rounded-xl p-5 sm:p-6 border border-gray-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-200 border border-gray-400 rounded-lg flex items-center justify-center">
              {contentType === 'movie' ? <IconMovie className="w-5 h-5 text-gray-600" /> : <IconDeviceTv className="w-5 h-5 text-gray-600" />}
            </div>
            <div>
              <h3 className="text-gray-800 font-bold text-lg">
                {contentType === 'movie' ? 'Buscar Filmes' : 'Buscar Séries'}
              </h3>
              <p className="text-gray-600 text-xs">Catálogo fornecido por TMDB</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder={contentType === 'movie' ? 'Buscar filmes... (ex: Oppenheimer, Duna)' : 'Buscar séries... (ex: Breaking Bad, The Last of Us)'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3 bg-gray-600 disabled:bg-gray-400 text-white font-bold rounded-lg flex items-center gap-2"
              >
                <IconSearch className="w-5 h-5" />
                <span className="hidden sm:inline">{isSearching ? 'Buscando...' : 'Buscar'}</span>
              </button>
            </div>

            {/* Empty State */}
            {!isSearching && searchResults.length === 0 && !searchQuery && (
              <div className="mt-12 text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-700/10 border-2 border-gray-600/30 rounded-2xl mb-6">
                  {contentType === 'movie' ? (
                    <IconMovie className="w-10 h-10 text-gray-400" />
                  ) : (
                    <IconDeviceTv className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <h4 className="text-white font-bold text-xl mb-2">
                  {contentType === 'movie' ? 'Descubra Filmes Incríveis' : 'Descubra Séries Incríveis'}
                </h4>
                <p className="text-text-secondary text-sm max-w-md mx-auto">
                  Busque em nosso extenso catálogo fornecido por TMDB. Encontre seus {contentType === 'movie' ? 'filmes' : 'séries'} favoritos e adicione à sua playlist instantaneamente.
                </p>
              </div>
            )}

            {/* No Results */}
            {!isSearching && searchResults.length === 0 && searchQuery && (
              <div className="mt-12 text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-800/20 border-2 border-gray-600/20 rounded-2xl mb-6">
                  <IconSearch className="w-10 h-10 text-text-secondary/50" />
                </div>
                <h4 className="text-white font-bold text-xl mb-2">Nenhum Resultado Encontrado</h4>
                <p className="text-text-secondary text-sm max-w-md mx-auto">
                  Tente palavras-chave diferentes ou verifique a ortografia. Não encontramos {contentType === 'movie' ? 'filmes' : 'séries'} correspondentes a "{searchQuery}".
                </p>
              </div>
            )}

            {/* Loading State */}
            {isSearching && (
              <div className="mt-12 py-16">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-600/20 border-t-gray-600 rounded-full"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-gray-600/20 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-white font-bold text-lg mb-1">Buscando...</h4>
                    <p className="text-text-secondary text-sm">Procurando os melhores {contentType === 'movie' ? 'filmes' : 'séries'} para você</p>
                  </div>
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-bold text-lg">Resultados</h4>
                  <span className="px-3 py-1 bg-gray-700/10 border border-gray-600/30 text-gray-300 text-sm font-semibold rounded-lg">
                    {searchResults.length} {searchResults.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {searchResults.map((item) => {
                    const isMovie = 'title' in item;
                    const title = isMovie ? item.title : item.name;
                    const date = isMovie ? item.release_date : item.first_air_date;
                    const year = date ? new Date(date).getFullYear() : '—';
                    const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
                    
                    return (
                      <button
                        key={item.id}
                        className="group relative bg-gray-800/20 hover:bg-gray-800/40 rounded-xl overflow-hidden border border-gray-600/10 hover:border-gray-600/50"
                        onClick={() => isMovie ? handleAddMovie(item as TMDBMovie) : handleSelectShow(item as TMDBTVShow)}
                      >
                        {/* Poster */}
                        <div className="relative aspect-[2/3] bg-background">
                          {item.poster_path ? (
                            <img
                              src={getTMDBPosterUrl(item.poster_path, 'w500')}
                              alt={title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {isMovie ? <IconMovie className="w-12 h-12 text-gray-400" /> : <IconDeviceTv className="w-12 h-12 text-gray-400" />}
                            </div>
                          )}
                          
                          {/* Rating Badge */}
                          {rating && Number(rating) > 0 && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-gray-800/80 rounded-md flex items-center gap-1">
                              <IconStar className="w-3 h-3 text-gray-400 fill-gray-400" />
                              <span className="text-white text-xs font-bold">{rating}</span>
                            </div>
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-end p-4 gap-2">
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                              {isMovie ? <IconPlus className="w-6 h-6 text-white" /> : <IconChevronRight className="w-6 h-6 text-white" />}
                            </div>
                            <p className="text-white text-xs font-semibold text-center opacity-0 group-hover:opacity-100">
                              {isMovie ? 'Adicionar à Playlist' : 'Selecionar Episódio'}
                            </p>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3 space-y-1">
                          <h5 className="text-white font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5rem]" title={title}>
                            {title}
                          </h5>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-secondary font-medium">{year}</span>
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-700/10 border border-gray-600/30 rounded text-gray-300 font-medium">
                              {isMovie ? (
                                <>
                                  <IconMovie className="w-3 h-3" />
                                  <span className="hidden sm:inline">Filme</span>
                                </>
                              ) : (
                                <>
                                  <IconDeviceTv className="w-3 h-3" />
                                  <span className="hidden sm:inline">Série</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
