import { useState } from 'react';
import { Search, Play, Film, Tv } from 'lucide-react';
import type { VideoSource, TMDBMovie, TMDBTVShow } from '../types';
import { searchMovies, searchTVShows, getTMDBPosterUrl, getMovieExternalIds, getTVExternalIds, mapGenreIdsToTags } from '../api/tmdb';

type SearchTabProps = {
  onAddVideo: (video: VideoSource) => void;
};

export default function SearchTab({ onAddVideo }: SearchTabProps) {
  const [searchType, setSearchType] = useState<'direct' | 'movie' | 'tv' | 'episode'>('movie');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(TMDBMovie | TMDBTVShow)[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      if (searchType === 'movie') {
        const results = await searchMovies(searchQuery);
        setSearchResults(results);
      } else if (searchType === 'tv' || searchType === 'episode') {
        const results = await searchTVShows(searchQuery);
        setSearchResults(results);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFromTMDB = async (item: TMDBMovie | TMDBTVShow) => {
    const isMovie = 'title' in item;
    const title = isMovie ? item.title : item.name;
    const tmdbId = String(item.id);
    
    let imdbId: string | undefined;
    try {
      const externalIds = isMovie 
        ? await getMovieExternalIds(item.id)
        : await getTVExternalIds(item.id);
      imdbId = externalIds.imdb_id || undefined;
    } catch (e) {
      console.warn('Não foi possível obter IMDB ID');
    }

    // Mapear gêneros automaticamente
    const tags = mapGenreIdsToTags(item.genre_ids);

    const newVideo: VideoSource = {
      id: Date.now().toString(),
      title,
      url: '',
      type: searchType === 'episode' ? 'episode' : (isMovie ? 'movie' : 'tv'),
      tmdb: tmdbId,
      imdb: imdbId,
      season: searchType === 'episode' ? season : undefined,
      episode: searchType === 'episode' ? episode : undefined,
      posterPath: item.poster_path || undefined,
      tags: tags.length > 0 ? tags : undefined,
      addedAt: new Date().toISOString()
    };

    onAddVideo(newVideo);
    setSearchQuery('');
    setSearchResults([]);
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
      <div className="bg-[#1a1a1a]/70 backdrop-blur-lg rounded-2xl p-7 border border-[#00bfa6]/30 shadow-xl shadow-black/40">
        <h3 className="text-white font-bold mb-5 text-2xl flex items-center gap-3">
          <Search className="w-7 h-7 text-[#00bfa6]" />
          Adicionar Novo Vídeo
        </h3>
        
        <div className="mb-6">
          <label className="text-gray-300 text-sm font-semibold mb-3 block">Tipo de Conteúdo</label>
          <div className="grid grid-cols-4 gap-4 bg-gray-950/80 backdrop-blur-sm p-4 rounded-xl border border-gray-800">
            <button
              onClick={() => { setSearchType('direct'); setSearchResults([]); }}
              className={`py-3 rounded-lg font-bold transition ${
                searchType === 'direct' ? 'bg-[#00bfa6] text-black' : 'bg-transparent text-gray-400 hover:bg-gray-800'
              }`}
            >
              🎬 URL
            </button>
            <button
              onClick={() => { setSearchType('movie'); setSearchResults([]); }}
              className={`py-3 rounded-lg font-bold transition ${
                searchType === 'movie' ? 'bg-[#00bfa6] text-black' : 'bg-transparent text-gray-400 hover:bg-gray-800'
              }`}
            >
              🎥 Filme
            </button>
            <button
              onClick={() => { setSearchType('tv'); setSearchResults([]); }}
              className={`py-3 rounded-lg font-bold transition ${
                searchType === 'tv' ? 'bg-[#00bfa6] text-black' : 'bg-transparent text-gray-400 hover:bg-gray-800'
              }`}
            >
              📺 Série
            </button>
            <button
              onClick={() => { setSearchType('episode'); setSearchResults([]); }}
              className={`py-3 rounded-lg font-bold transition ${
                searchType === 'episode' ? 'bg-[#00bfa6] text-black' : 'bg-transparent text-gray-400 hover:bg-gray-800'
              }`}
            >
              📺 Episódio
            </button>
          </div>
        </div>
        
        {searchType === 'direct' ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Título do vídeo"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white"
            />
            <input
              type="text"
              placeholder="URL do vídeo (MP4, WebM, etc)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white"
            />
            <button
              onClick={handleAddDirect}
              className="w-full py-4 bg-[#00bfa6] hover:bg-[#00a794] text-black font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Adicionar URL Direta
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={`Buscar ${searchType === 'movie' ? 'filmes' : 'séries'}... (ex: Homem Aranha)`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 px-4 py-3 bg-gray-950 border border-gray-700 rounded-lg text-white"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-3 bg-[#00bfa6] hover:bg-[#00a794] disabled:bg-gray-600 text-black font-bold rounded-lg flex items-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  {isSearching ? 'Buscando...' : 'Buscar'}
                </button>
              </div>

              {searchType === 'episode' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-950 rounded-lg">
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">Temporada</label>
                    <input
                      type="number"
                      min="1"
                      value={season}
                      onChange={(e) => setSeason(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">Episódio</label>
                    <input
                      type="number"
                      min="1"
                      value={episode}
                      onChange={(e) => setEpisode(Number(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                </div>
              )}

              <div className="bg-[#00bfa6]/10 border border-[#00bfa6]/30 rounded-lg p-4">
                <p className="text-[#00bfa6] text-sm">
                  <strong>💡 Dica:</strong> Busque por nome! Ex: "Homem Aranha", "Breaking Bad", "Oppenheimer"
                </p>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-6">
                <h4 className="text-white font-bold mb-3">Resultados ({searchResults.length})</h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 max-h-96 overflow-y-auto">
                  {searchResults.map((item) => {
                    const title = 'title' in item ? item.title : item.name;
                    const date = 'release_date' in item ? item.release_date : item.first_air_date;
                    const year = date ? new Date(date).getFullYear() : 'N/A';
                    
                    return (
                      <div
                        key={item.id}
                        className="bg-gray-950 rounded-lg overflow-hidden border border-gray-700 hover:border-[#00bfa6] transition cursor-pointer"
                        onClick={() => handleAddFromTMDB(item)}
                      >
                        <img
                          src={getTMDBPosterUrl(item.poster_path, 'w200')}
                          alt={title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-3">
                          <p className="text-white font-bold text-sm truncate">{title}</p>
                          <p className="text-gray-400 text-xs mt-1">
                            {'title' in item ? <Film className="w-3 h-3 inline mr-1" /> : <Tv className="w-3 h-3 inline mr-1" />}
                            {year}
                          </p>
                          <button className="w-full mt-2 py-2 bg-[#00bfa6] hover:bg-[#00a794] text-black text-xs font-bold rounded">
                            Adicionar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
