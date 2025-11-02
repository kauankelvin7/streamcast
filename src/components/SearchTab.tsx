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
      <div className="flex gap-3 p-1.5 bg-[#0d0d0d] rounded-xl border border-gray-800">
        <button
          onClick={() => { setContentType('direct'); setSearchResults([]); setSelectedShow(null); }}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            contentType === 'direct' 
              ? 'bg-gradient-to-r from-[#00bfa6] to-[#00d4b8] text-black shadow-lg shadow-[#00bfa6]/30' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <LinkIcon className="w-5 h-5" />
          <span className="hidden sm:inline">URL Direta</span>
          <span className="sm:hidden">URL</span>
        </button>
        <button
          onClick={() => { setContentType('movie'); setSearchResults([]); setSelectedShow(null); }}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            contentType === 'movie' 
              ? 'bg-gradient-to-r from-[#00bfa6] to-[#00d4b8] text-black shadow-lg shadow-[#00bfa6]/30' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Film className="w-5 h-5" />
          Filmes
        </button>
        <button
          onClick={() => { setContentType('tv'); setSearchResults([]); setSelectedShow(null); }}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            contentType === 'tv' 
              ? 'bg-gradient-to-r from-[#00bfa6] to-[#00d4b8] text-black shadow-lg shadow-[#00bfa6]/30' 
              : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          <Tv className="w-5 h-5" />
          Séries
        </button>
      </div>

      {/* Conteúdo Principal */}
      {contentType === 'direct' ? (
        // URL Direta
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-2xl p-6 sm:p-8 border border-gray-800 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00bfa6]/20 to-[#00bfa6]/5 rounded-xl flex items-center justify-center border border-[#00bfa6]/30">
              <LinkIcon className="w-6 h-6 text-[#00bfa6]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">Adicionar URL Direta</h3>
              <p className="text-gray-400 text-sm">Adicione vídeos de qualquer URL (MP4, WebM, etc)</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm font-semibold mb-2 block">Título do Vídeo</label>
              <input
                type="text"
                placeholder="Ex: Meu Vídeo Personalizado"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 focus:border-[#00bfa6] rounded-lg text-white placeholder-gray-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-gray-300 text-sm font-semibold mb-2 block">URL do Vídeo</label>
              <input
                type="text"
                placeholder="https://exemplo.com/video.mp4"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-4 py-3 bg-[#0d0d0d] border border-gray-700 focus:border-[#00bfa6] rounded-lg text-white placeholder-gray-500 transition-colors font-mono text-sm"
              />
            </div>
            <button
              onClick={handleAddDirect}
              className="w-full py-4 bg-gradient-to-r from-[#00bfa6] to-[#00d4b8] hover:from-[#00a794] hover:to-[#00bfa6] text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#00bfa6]/30 transition-all"
            >
              <Plus className="w-5 h-5" />
              Adicionar à Playlist
            </button>
          </div>
        </div>
      ) : selectedShow ? (
        // Seletor de Episódios
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-2xl p-6 border border-gray-800 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <button
                onClick={() => setSelectedShow(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-semibold transition-colors"
              >
                ← Voltar
              </button>
              <div className="flex-1">
                <h3 className="text-white font-bold text-xl flex items-center gap-2">
                  <Tv className="w-6 h-6 text-[#00bfa6]" />
                  {selectedShow.name}
                </h3>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedShow.first_air_date ? new Date(selectedShow.first_air_date).getFullYear() : 'N/A'}
                </p>
              </div>
            </div>

            {selectedShow.poster_path && (
              <div className="mb-6 flex items-start gap-6">
                <img
                  src={getTMDBPosterUrl(selectedShow.poster_path, 'w200')}
                  alt={selectedShow.name}
                  className="w-32 h-48 object-cover rounded-lg border-2 border-gray-700"
                />
                {selectedShow.overview && (
                  <div className="flex-1">
                    <h4 className="text-white font-semibold mb-2">Sinopse</h4>
                    <p className="text-gray-400 text-sm line-clamp-4">{selectedShow.overview}</p>
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#0d0d0d] rounded-xl p-6 border border-gray-800">
              <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                <Play className="w-5 h-5 text-[#00bfa6]" />
                Selecionar Episódio
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-gray-300 text-sm font-semibold mb-2 block">Temporada</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={season}
                      onChange={(e) => setSeason(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 focus:border-[#00bfa6] rounded-lg text-white text-center text-lg font-bold transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">S</span>
                  </div>
                </div>
                <div>
                  <label className="text-gray-300 text-sm font-semibold mb-2 block">Episódio</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={episode}
                      onChange={(e) => setEpisode(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 focus:border-[#00bfa6] rounded-lg text-white text-center text-lg font-bold transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">E</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#00bfa6]/10 border border-[#00bfa6]/30 rounded-lg p-4 mb-4">
                <p className="text-[#00bfa6] text-sm font-semibold">
                  📺 Será adicionado: {selectedShow.name} - S{season.toString().padStart(2, '0')}E{episode.toString().padStart(2, '0')}
                </p>
              </div>

              <button
                onClick={handleAddEpisode}
                className="w-full py-4 bg-gradient-to-r from-[#00bfa6] to-[#00d4b8] hover:from-[#00a794] hover:to-[#00bfa6] text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#00bfa6]/30 transition-all"
              >
                <Plus className="w-5 h-5" />
                Adicionar Episódio (Auto-incrementa)
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Busca de Filmes/Séries
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-2xl p-6 sm:p-8 border border-gray-800 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00bfa6]/20 to-[#00bfa6]/5 rounded-xl flex items-center justify-center border border-[#00bfa6]/30">
              {contentType === 'movie' ? <Film className="w-6 h-6 text-[#00bfa6]" /> : <Tv className="w-6 h-6 text-[#00bfa6]" />}
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">
                Buscar {contentType === 'movie' ? 'Filmes' : 'Séries'}
              </h3>
              <p className="text-gray-400 text-sm">Pesquise no banco de dados do TMDB</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder={contentType === 'movie' ? 'Ex: Oppenheimer, Homem Aranha...' : 'Ex: Breaking Bad, Game of Thrones...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 bg-[#0d0d0d] border border-gray-700 focus:border-[#00bfa6] rounded-lg text-white placeholder-gray-500 transition-colors"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="px-6 py-3 bg-gradient-to-r from-[#00bfa6] to-[#00d4b8] hover:from-[#00a794] hover:to-[#00bfa6] disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-all shadow-lg shadow-[#00bfa6]/30 disabled:shadow-none flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">{isSearching ? 'Buscando...' : 'Buscar'}</span>
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-bold flex items-center gap-2">
                    <Star className="w-5 h-5 text-[#00bfa6]" />
                    Resultados da Busca
                  </h4>
                  <span className="px-3 py-1 bg-[#00bfa6]/20 border border-[#00bfa6]/30 text-[#00bfa6] text-sm font-semibold rounded-full">
                    {searchResults.length} encontrado{searchResults.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#00bfa6] scrollbar-track-gray-800">
                  {searchResults.map((item) => {
                    const isMovie = 'title' in item;
                    const title = isMovie ? item.title : item.name;
                    const date = isMovie ? item.release_date : item.first_air_date;
                    const year = date ? new Date(date).getFullYear() : 'N/A';
                    
                    return (
                      <div
                        key={item.id}
                        className="group bg-[#0d0d0d] rounded-xl overflow-hidden border border-gray-800 hover:border-[#00bfa6] transition-all cursor-pointer transform hover:scale-105 hover:shadow-xl hover:shadow-[#00bfa6]/20"
                        onClick={() => isMovie ? handleAddMovie(item as TMDBMovie) : handleSelectShow(item as TMDBTVShow)}
                      >
                        <div className="relative">
                          {item.poster_path ? (
                            <img
                              src={getTMDBPosterUrl(item.poster_path, 'w200')}
                              alt={title}
                              className="w-full h-64 object-cover"
                            />
                          ) : (
                            <div className="w-full h-64 bg-gray-900 flex items-center justify-center">
                              {isMovie ? <Film className="w-12 h-12 text-gray-700" /> : <Tv className="w-12 h-12 text-gray-700" />}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                            <div className="px-3 py-2 bg-[#00bfa6] text-black text-xs font-bold rounded-lg flex items-center gap-1">
                              {isMovie ? <Plus className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              {isMovie ? 'Adicionar' : 'Escolher Ep.'}
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-white font-semibold text-sm truncate" title={title}>{title}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-gray-400 text-xs">{year}</span>
                            <div className="flex items-center gap-1">
                              {isMovie ? (
                                <Film className="w-3 h-3 text-[#00bfa6]" />
                              ) : (
                                <Tv className="w-3 h-3 text-[#00bfa6]" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
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
