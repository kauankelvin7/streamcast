import { useState } from 'react';
import { Search, Play, Film, Tv, Link as LinkIcon, Plus, ChevronRight, Star } from 'lucide-react';
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
  <div className="flex gap-2 p-1.5 bg-slate-900/50 rounded-xl border border-slate-700">
        <button
          onClick={() => { setContentType('direct'); setSearchResults([]); setSelectedShow(null); }}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
            contentType === 'direct' 
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <LinkIcon className="w-5 h-5" />
          <span className="hidden sm:inline">URL Direta</span>
          <span className="sm:hidden">URL</span>
        </button>
        <button
          onClick={() => { setContentType('movie'); setSearchResults([]); setSelectedShow(null); }}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
            contentType === 'movie' 
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Film className="w-5 h-5" />
          Filmes
        </button>
        <button
          onClick={() => { setContentType('tv'); setSearchResults([]); setSelectedShow(null); }}
          className={`flex-1 py-2.5 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm ${
            contentType === 'tv' 
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20' 
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Tv className="w-5 h-5" />
          Séries
        </button>
      </div>

      {/* Conteúdo Principal */}
      {contentType === 'direct' ? (
        // URL Direta
  <div className="bg-slate-900/40 rounded-xl p-5 sm:p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
              <LinkIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Add Direct URL</h3>
              <p className="text-slate-400 text-xs">Support for MP4, WebM, and more</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-blue-300 text-sm font-semibold mb-2 block">Título do Vídeo</label>
              <input
                type="text"
                placeholder="ex: Meu Vídeo Personalizado"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-lg text-white placeholder-slate-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-blue-300 text-sm font-semibold mb-2 block">URL do Vídeo</label>
              <input
                type="text"
                placeholder="https://exemplo.com/video.mp4"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-lg text-white placeholder-slate-500 transition-colors font-mono text-sm"
              />
            </div>
            <button
              onClick={handleAddDirect}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add to Playlist
            </button>
          </div>
        </div>
      ) : selectedShow ? (
        // Seletor de Episódios
        <div className="space-y-4">
          <div className="bg-slate-900/40 rounded-xl p-5 sm:p-6 border border-slate-700">
            <div className="flex items-start gap-4 mb-6">
              <button
                onClick={() => setSelectedShow(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors"
              >
                ← Voltar
              </button>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Tv className="w-6 h-6 text-blue-400" />
                  {selectedShow.name}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {selectedShow.first_air_date ? new Date(selectedShow.first_air_date).getFullYear() : '—'}
                </p>
              </div>
            </div>

            {selectedShow.poster_path && (
              <div className="mb-6 flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <img
                  src={getTMDBPosterUrl(selectedShow.poster_path, 'w200')}
                  alt={selectedShow.name}
                  className="w-24 sm:w-32 h-36 sm:h-48 object-cover rounded-lg border border-slate-700"
                />
                {selectedShow.overview && (
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-2 text-sm">Sinopse</h4>
                    <p className="text-slate-400 text-sm line-clamp-4">{selectedShow.overview}</p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <Play className="w-6 h-6 text-blue-400" />
                Selecionar Episódio
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-slate-300 text-sm font-semibold mb-2 block">Temporada</label>
                  <input
                    type="number"
                    min="1"
                    value={season}
                    onChange={(e) => setSeason(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg text-white text-center text-lg font-bold transition-colors"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm font-semibold mb-2 block">Episódio</label>
                  <input
                    type="number"
                    min="1"
                    value={episode}
                    onChange={(e) => setEpisode(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg text-white text-center text-lg font-bold transition-colors"
                  />
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <p className="text-blue-300 text-sm font-semibold">
                  📺 Adicionando: {selectedShow.name} - S{season.toString().padStart(2, '0')}E{episode.toString().padStart(2, '0')}
                </p>
              </div>

              <button
                onClick={handleAddEpisode}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
              >
                <Plus className="w-6 h-6" />
                Adicionar Episódio
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Busca de Filmes/Séries
  <div className="bg-slate-900/40 rounded-xl p-5 sm:p-6 border border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
              {contentType === 'movie' ? <Film className="w-5 h-5 text-blue-400" /> : <Tv className="w-5 h-5 text-blue-400" />}
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                {contentType === 'movie' ? 'Buscar Filmes' : 'Buscar Séries'}
              </h3>
              <p className="text-slate-400 text-xs">Catálogo fornecido por TMDB</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder={contentType === 'movie' ? 'Buscar filmes... (ex: Oppenheimer, Duna)' : 'Buscar séries... (ex: Breaking Bad, The Last of Us)'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-lg text-white placeholder-slate-500 transition-colors"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/30 disabled:shadow-none flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">{isSearching ? 'Buscando...' : 'Buscar'}</span>
              </button>
            </div>

            {/* Empty State */}
            {!isSearching && searchResults.length === 0 && !searchQuery && (
              <div className="mt-12 text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl mb-6">
                  {contentType === 'movie' ? (
                    <Film className="w-10 h-10 text-blue-400" />
                  ) : (
                    <Tv className="w-10 h-10 text-blue-400" />
                  )}
                </div>
                <h4 className="text-white font-bold text-xl mb-2">
                  {contentType === 'movie' ? 'Descubra Filmes Incríveis' : 'Descubra Séries Incríveis'}
                </h4>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Busque em nosso extenso catálogo fornecido por TMDB. Encontre seus {contentType === 'movie' ? 'filmes' : 'séries'} favoritos e adicione à sua playlist instantaneamente.
                </p>
              </div>
            )}

            {/* No Results */}
            {!isSearching && searchResults.length === 0 && searchQuery && (
              <div className="mt-12 text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-800/50 border-2 border-slate-700 rounded-2xl mb-6">
                  <Search className="w-10 h-10 text-slate-500" />
                </div>
                <h4 className="text-white font-bold text-xl mb-2">Nenhum Resultado Encontrado</h4>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Tente palavras-chave diferentes ou verifique a ortografia. Não encontramos {contentType === 'movie' ? 'filmes' : 'séries'} correspondentes a "{searchQuery}".
                </p>
              </div>
            )}

            {/* Loading State */}
            {isSearching && (
              <div className="mt-12 py-16">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-center">
                    <h4 className="text-white font-bold text-lg mb-1">Searching...</h4>
                    <p className="text-slate-400 text-sm">Looking for the best {contentType === 'movie' ? 'movies' : 'TV shows'} for you</p>
                  </div>
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-bold text-lg">Results</h4>
                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-semibold rounded-lg">
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
                        className="group relative bg-slate-800/40 hover:bg-slate-800/60 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/10"
                        onClick={() => isMovie ? handleAddMovie(item as TMDBMovie) : handleSelectShow(item as TMDBTVShow)}
                      >
                        {/* Poster */}
                        <div className="relative aspect-[2/3] bg-slate-900">
                          {item.poster_path ? (
                            <img
                              src={getTMDBPosterUrl(item.poster_path, 'w500')}
                              alt={title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {isMovie ? <Film className="w-12 h-12 text-slate-700" /> : <Tv className="w-12 h-12 text-slate-700" />}
                            </div>
                          )}
                          
                          {/* Rating Badge */}
                          {rating && Number(rating) > 0 && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-md flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-white text-xs font-bold">{rating}</span>
                            </div>
                          )}
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-end p-4 gap-2">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200">
                              {isMovie ? <Plus className="w-6 h-6 text-white" /> : <ChevronRight className="w-6 h-6 text-white" />}
                            </div>
                            <p className="text-white text-xs font-semibold text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-75">
                              {isMovie ? 'Add to Playlist' : 'Select Episode'}
                            </p>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3 space-y-1">
                          <h5 className="text-white font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5rem]" title={title}>
                            {title}
                          </h5>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">{year}</span>
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300 font-medium">
                              {isMovie ? (
                                <>
                                  <Film className="w-3 h-3" />
                                  <span className="hidden sm:inline">Movie</span>
                                </>
                              ) : (
                                <>
                                  <Tv className="w-3 h-3" />
                                  <span className="hidden sm:inline">TV</span>
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
