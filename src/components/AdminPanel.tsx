
import { useState, useEffect } from 'react';
import type React from 'react';
import { IconPlayerPlay, IconX, IconCopy, IconSettings2, IconDeviceFloppy, IconListDetails, 
  IconClockHour4, IconWorld, IconSearch
} from '@tabler/icons-react';
import type { VideoSource, PlayerConfig, ScheduleItem } from '../types';
import SearchTab from './SearchTab';
import { DAYS } from '../utils/schedule';
import { getTMDBPosterUrl } from '../api/tmdb';

type AdminPanelProps = {
  config: PlayerConfig;
  playlist: VideoSource[];
  schedules: ScheduleItem[];
  onClose: () => void;
  onSave: (config: PlayerConfig, playlist: VideoSource[], schedules: ScheduleItem[]) => void;
};

export default function AdminPanel({ config: initialConfig, playlist: initialPlaylist, schedules: initialSchedules, onClose, onSave }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'internet' | 'search' | 'playlist' | 'schedule' | 'settings'>('internet');
  const [config, setConfig] = useState(initialConfig);
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  
  // Internet Search State
  const [internetSearchQuery, setInternetSearchQuery] = useState('');
  const [internetSearchResults, setInternetSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleVideoId, setScheduleVideoId] = useState('');
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [scheduleStart, setScheduleStart] = useState('09:00');
  const [scheduleEnd, setScheduleEnd] = useState('18:00');

  useEffect(() => {
    setConfig(initialConfig);
    setPlaylist(initialPlaylist);
    setSchedules(initialSchedules);
  }, [initialConfig, initialPlaylist, initialSchedules]);

  // Internet Video Search Function
  const handleInternetSearch = async () => {
    if (!internetSearchQuery.trim()) return;
    
    setIsSearching(true);
    setInternetSearchResults([]);
    
    try {
      const sources = [
        { 
          name: 'YouTube', 
          icon: '🎬', 
          color: 'from-gray-500 to-gray-600',
          urlPattern: (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        },
        { 
          name: 'Vimeo', 
          icon: '🎥', 
          color: 'from-gray-500 to-gray-600',
          urlPattern: (query: string) => `https://vimeo.com/search?q=${encodeURIComponent(query)}`
        },
        { 
          name: 'Dailymotion', 
          icon: '📺', 
          color: 'from-gray-500 to-gray-600',
          urlPattern: (query: string) => `https://www.dailymotion.com/search/${encodeURIComponent(query)}`
        },
        { 
          name: 'Archive.org', 
          icon: '🎞️', 
          color: 'from-gray-500 to-gray-600',
          urlPattern: (query: string) => `https://archive.org/details/movies?query=${encodeURIComponent(query)}`
        },
      ];
      
      // Cria resultados simulados que representam links de busca
      const mockResults = sources.map((source, idx) => ({
        id: `${source.name.toLowerCase()}-${Date.now()}-${idx}`,
        title: `${internetSearchQuery} - ${source.name}`,
        source: source.name,
        icon: source.icon,
        color: source.color,
        searchUrl: source.urlPattern(internetSearchQuery),
        // URL de exemplo para demonstração (você pode integrar APIs reais aqui)
        exampleVideoUrl: `https://example.com/${source.name.toLowerCase()}/${encodeURIComponent(internetSearchQuery)}`,
        duration: `${Math.floor(Math.random() * 120 + 30)}:00`,
        views: `${Math.floor(Math.random() * 1000)}K views`,
      }));
      
      setTimeout(() => {
        setInternetSearchResults(mockResults);
        setIsSearching(false);
      }, 1500);
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
    }
  };

  const handleAddFromInternet = (result: any) => {
    // Solicita URL do vídeo ao usuário
    const videoUrl = prompt(
      `🎬 Cole a URL do vídeo de ${result.source}:\n\n` +
      `Exemplos aceitos:\n` +
      `• YouTube: youtube.com/watch?v=...\n` +
      `• Vimeo: vimeo.com/123456\n` +
      `• MP4/WebM direto\n` +
      `• Qualquer URL de vídeo`
    );
    
    if (!videoUrl || !videoUrl.trim()) return;
    
    // Cria vídeo com a URL fornecida
    const newVideo: VideoSource = {
      id: `internet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: `${internetSearchQuery} (${result.source})`,
      type: 'movie',
      url: videoUrl.trim(),
      tags: ['Internet', result.source],
      addedAt: new Date().toISOString(),
    };
    
    handleAddVideo(newVideo);
    alert(`✅ Vídeo adicionado à playlist!\n\nTítulo: ${newVideo.title}`);
  };

  const handleAddVideo = (video: VideoSource) => {
    setPlaylist([...playlist, video]);
    setActiveTab('playlist');
  };

  const handleRemoveVideo = (id: string) => {
    setPlaylist(playlist.filter(v => v.id !== id));
  };

  const handleAddSchedule = () => {
    if (!scheduleName.trim() || !scheduleVideoId || scheduleDays.length === 0) {
      alert('Preencha todos os campos!');
      return;
    }

    const newSchedule: ScheduleItem = {
      id: Date.now().toString(),
      name: scheduleName,
      videoId: scheduleVideoId,
      days: scheduleDays,
      startTime: scheduleStart,
      endTime: scheduleEnd,
      active: true
    };

    setSchedules([...schedules, newSchedule]);
    setScheduleName('');
    setScheduleVideoId('');
    setScheduleDays([]);
    setScheduleStart('09:00');
    setScheduleEnd('18:00');
  };

  const handleRemoveSchedule = (id: string) => {
    setSchedules(schedules.filter(s => s.id !== id));
  };

  const toggleDay = (day: number) => {
    setScheduleDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSaveAll = async () => {
    const { saveAllData } = await import('../utils/storage');
    const success = await saveAllData(config, playlist, schedules);
    
    if (success) {
      const frames = document.querySelectorAll('iframe');
      frames.forEach(frame => {
        try {
          frame.contentWindow?.postMessage({ type: 'STREAMCAST_SYNC' }, '*');
        } catch (e) {}
      });
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'streamcast-sync',
        newValue: Date.now().toString()
      }));
      
      alert('✅ Configurações salvas e sincronizadas!');
    } else {
      alert('❌ Erro ao salvar configurações.');
    }
    
    onSave(config, playlist, schedules);
    onClose();
  };

  const generateEmbedCode = () => {
    const baseUrl = window.location.origin;
    const embedUrl = `${baseUrl}?embed=true`;
    return `<div id="streamcast-player" style="width: 100%; height: 100vh;"></div>
<script>
  const iframe = document.createElement('iframe');
  iframe.src = '${embedUrl}';
  iframe.style.cssText = 'width: 100%; height: 100%; border: 0;';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'origin';
  document.getElementById('streamcast-player').appendChild(iframe);
</script>`;
  };

  const copyEmbedCode = () => {
    const code = generateEmbedCode();
    navigator.clipboard.writeText(code).then(() => {
      alert('✅ Código copiado!');
    });
  };

  // Improved a11y/keyboard support for the top navigation
  const tabs: { id: 'internet' | 'search' | 'playlist' | 'schedule' | 'settings'; label: string; icon: any }[] = [
  { id: 'internet', label: 'Busca Web', icon: IconWorld },
  { id: 'search', label: 'Buscar Filmes', icon: IconSearch },
  { id: 'playlist', label: 'Playlist', icon: IconListDetails },
  { id: 'schedule', label: 'Agenda', icon: IconClockHour4 },
  { id: 'settings', label: 'Config', icon: IconSettings2 }
  ];

  const handleTabsKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex(t => t.id === activeTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = tabs[(currentIndex + 1) % tabs.length];
      setActiveTab(next.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
      setActiveTab(prev.id);
    }
  };

  return (

  <div className="fixed inset-0 bg-gray-900 z-50 overflow-y-auto font-sans flex flex-col items-center justify-center text-black">
    {/* Header */}
    <div className="w-full max-w-4xl mx-auto bg-gray-800 text-white p-4 rounded-t-xl flex items-center justify-between border border-gray-600">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
          <IconPlayerPlay className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">Painel Administrativo</h1>
      </div>
      <button
        onClick={onClose}
        className="p-3 bg-gray-700 text-white rounded-full border border-gray-600"
        title="Fechar painel"
      >
        <IconX className="w-6 h-6" />
      </button>
    </div>

    {/* All content goes here, starting with the header and main panel */}

          {/* Modal de Embed Code with enhanced effects */}
          {showEmbedModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-60 p-4">
              <div className="relative bg-gray-900 border border-gray-700 rounded-3xl p-6 sm:p-8 max-w-3xl w-full">
                
                <div className="relative flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-700 border border-gray-600 rounded-2xl flex items-center justify-center">
                      <IconCopy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">Código de Incorporação</h3>
                      <p className="text-gray-400 text-sm font-semibold">Copie e cole em seu site</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowEmbedModal(false)} 
                    className="p-2.5 bg-gray-800 border border-gray-600 text-gray-300 rounded-2xl"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>
                
                <pre className="bg-gray-800 border border-gray-600 rounded-2xl p-5 text-gray-300 text-xs sm:text-sm font-mono overflow-x-auto mb-6 max-h-96">
                  <code>{generateEmbedCode()}</code>
                </pre>
                
                <button 
                  onClick={copyEmbedCode} 
                  className="w-full py-4 bg-gray-700 text-white font-bold rounded-2xl flex items-center justify-center gap-3"
                >
                  <IconCopy className="w-5 h-5" />
                  Copiar para a área de transferência
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div
            role="tablist"
            aria-label="Admin navigation"
            onKeyDown={handleTabsKeyDown}
            className="flex items-center gap-4 p-4 bg-gray-100 rounded-xl mb-6 border border-gray-300 overflow-x-auto w-full max-w-4xl mx-auto text-black"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-32 py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 text-sm whitespace-nowrap overflow-hidden border ${
                  activeTab === tab.id
                    ? 'text-white border-gray-500 bg-gray-800'
                    : 'text-gray-700 border-gray-300 bg-white'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-white' : 'text-gray-500'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white border border-gray-300 rounded-b-xl p-8 w-full max-w-4xl mx-auto min-h-[500px] flex flex-col gap-6 text-black">
            
            {activeTab === 'internet' && (
              <div className="flex flex-col gap-8 items-center">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-gray-800 mb-3">Buscar Vídeos na Internet</h2>
                  <p className="text-gray-600 text-xl bg-gray-100 rounded-lg px-4 py-2 inline-block">Encontre e adicione vídeos de múltiplas plataformas online</p>
                </div>

                {/* Enhanced Search Bar */}
                <div className="flex gap-4 w-full max-w-3xl bg-gray-100 p-2 rounded-2xl border border-gray-300">
                  <input
                    type="text"
                    value={internetSearchQuery}
                    onChange={(e) => setInternetSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleInternetSearch()}
                    placeholder="Ex: Avengers Endgame, Stranger Things S01E01, Música XYZ..."
                    className="flex-1 px-6 py-4 bg-white border border-gray-300 rounded-xl text-black placeholder-gray-500 text-lg"
                  />
                  <button
                    onClick={handleInternetSearch}
                    disabled={isSearching}
                    className="px-10 py-4 bg-gray-600 text-white font-bold rounded-xl border border-gray-500"
                  >
                    {isSearching ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>

                {/* Search results */}
                <div className="w-full max-w-3xl flex flex-col gap-6 mt-10">
                  {internetSearchResults.map((result) => (
                    <div key={result.id} className="border border-gray-300 rounded-2xl p-6 bg-gray-50 flex flex-col gap-4 items-start">
                      <div className="flex items-center gap-4 mb-2 w-full">
                        <span className="text-2xl text-gray-600 bg-gray-200 rounded-lg p-2">{result.icon}</span>
                        <span className="text-sm px-4 py-2 bg-gray-200 rounded-full text-gray-800 font-bold">{result.source}</span>
                        <span className="text-sm text-gray-600 ml-auto bg-gray-200 rounded-lg px-3 py-1">{result.duration}</span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{result.title}</h3>
                      <p className="text-gray-700 text-base mb-4 bg-gray-200 rounded-lg px-3 py-1 inline-block">{result.views}</p>
                      <button
                        onClick={() => handleAddFromInternet(result)}
                        className="px-8 py-3 bg-gray-600 text-white rounded-xl font-bold"
                      >Adicionar à Playlist</button>
                    </div>
                  ))}
                  {!isSearching && internetSearchResults.length === 0 && internetSearchQuery && (
                    <div className="text-center py-16 text-gray-500 text-xl bg-gray-100 rounded-2xl border border-gray-300">Nenhum resultado encontrado. Tente uma busca diferente.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'search' && (
              <SearchTab onAddVideo={handleAddVideo} />
            )}

            {activeTab === 'playlist' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-6">
                  <h3 className="text-4xl font-bold text-gray-800">
                    Minha Playlist
                  </h3>
                  <span className="px-6 py-3 bg-gray-200 border border-gray-400 text-gray-800 text-lg font-bold rounded-xl">
                    {playlist.length} {playlist.length === 1 ? 'Vídeo' : 'Vídeos'}
                  </span>
                </div>

                {playlist.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-16 text-center">
                    <div className="w-20 h-20 bg-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <IconListDetails className="w-10 h-10 text-white" />
                    </div>
                    <p className="text-gray-700 font-bold text-2xl mb-3">Playlist Vazia</p>
                    <p className="text-gray-500 text-lg">Adicione vídeos pelas abas Buscar ou Internet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {playlist.map((video, index) => (
                      <div key={video.id} className="bg-gray-50 border border-gray-300 rounded-2xl p-6 flex items-center gap-6">
                        <div className="flex-shrink-0 w-14 h-14 bg-gray-600 text-white rounded-xl flex items-center justify-center font-bold text-xl">
                          {index + 1}
                        </div>
                        {video.posterPath ? (
                          <img
                            src={getTMDBPosterUrl(video.posterPath)}
                            alt={video.title}
                            className="w-14 h-20 object-cover rounded-xl border-2 border-gray-300"
                          />
                        ) : (
                          <div className="w-14 h-20 bg-gray-300 border-2 border-gray-400 rounded-xl flex items-center justify-center">
                            <IconListDetails className="w-7 h-7 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 font-bold text-lg truncate mb-2">
                            {video.title}
                          </p>
                          <p className="text-gray-600 text-base bg-gray-200 rounded-lg px-3 py-1 inline-block">
                            {video.type === 'movie' ? 'Filme' : video.type === 'tv' ? 'Série' : video.type === 'episode' ? 'Episódio' : 'Vídeo'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveVideo(video.id)}
                          className="p-3 bg-gray-600 text-white rounded-xl"
                          title="Remover da playlist"
                        >
                          <IconX className="w-6 h-6" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 mb-6">Agendamento de Vídeos</h3>

                {/* Create Schedule */}
                <div className="bg-gray-50 border border-gray-300 rounded-2xl p-8">
                  <h4 className="text-2xl font-bold text-gray-800 mb-6">Criar Novo Agendamento</h4>

                  <div className="space-y-6">
                    <div>
                      <label className="text-gray-700 text-sm font-semibold mb-3 block">Nome do Agendamento</label>
                      <input
                        type="text"
                        placeholder="Ex: Filmes do Horário Nobre"
                        value={scheduleName}
                        onChange={(e) => setScheduleName(e.target.value)}
                        className="w-full px-5 py-4 bg-white border border-gray-300 rounded-xl text-gray-800 placeholder-gray-500 text-lg"
                      />
                    </div>

                    <div>
                      <label className="text-gray-700 text-sm font-semibold mb-3 block">Vídeo</label>
                      <select
                        value={scheduleVideoId}
                        onChange={(e) => setScheduleVideoId(e.target.value)}
                        className="w-full px-5 py-4 bg-white border border-gray-300 rounded-xl text-gray-800 appearance-none cursor-pointer text-lg"
                      >
                        <option value="">Selecione um vídeo...</option>
                        {playlist.map(video => (
                          <option key={video.id} value={video.id}>{video.title}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-700 text-sm font-semibold mb-4 block">Dias da Semana</label>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                        {DAYS.map((day, index) => (
                          <button
                            key={index}
                            onClick={() => toggleDay(index)}
                            className={`py-3 px-3 rounded-xl font-semibold text-sm ${
                              scheduleDays.includes(index)
                                ? 'bg-gray-800 text-white'
                                : 'bg-white border border-gray-300 text-gray-600'
                            }`}
                          >
                            {day.slice(0, 3)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="text-gray-700 text-sm font-semibold mb-3 block">Horário de Início</label>
                        <input
                          type="time"
                          value={scheduleStart}
                          onChange={(e) => setScheduleStart(e.target.value)}
                          className="w-full px-5 py-4 bg-white border border-gray-300 rounded-xl text-gray-800 font-mono text-lg"
                        />
                      </div>
                      <div>
                        <label className="text-gray-700 text-sm font-semibold mb-3 block">Horário de Fim</label>
                        <input
                          type="time"
                          value={scheduleEnd}
                          onChange={(e) => setScheduleEnd(e.target.value)}
                          className="w-full px-5 py-4 bg-white border border-gray-300 rounded-xl text-gray-800 font-mono text-lg"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddSchedule}
                      className="w-full py-4 bg-gray-600 text-white font-bold rounded-xl"
                    >
                      <IconClockHour4 className="w-6 h-6 inline mr-2" />
                      Adicionar Agendamento
                    </button>
                  </div>
                </div>

                {/* Schedules List */}
                <div className="space-y-6">
                  <h4 className="text-2xl font-bold text-gray-800">Agendamentos Ativos</h4>

                  {schedules.length > 0 ? (
                    schedules.map(schedule => (
                      <div key={schedule.id} className="bg-gray-50 border border-gray-300 rounded-2xl p-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-800 font-bold text-lg mb-3">{schedule.name}</p>
                            <p className="text-gray-600 text-base font-mono mb-4 bg-gray-200 rounded-lg px-3 py-1 inline-block">{schedule.startTime} — {schedule.endTime}</p>
                            <div className="flex flex-wrap gap-3">
                              {schedule.days.map(day => (
                                <span key={day} className="px-3 py-2 bg-gray-200 border border-gray-400 text-gray-800 text-sm font-semibold rounded-lg">
                                  {DAYS[day].slice(0, 3)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSchedule(schedule.id)}
                            className="flex-shrink-0 p-3 bg-gray-600 text-white rounded-xl"
                            title="Remover agendamento"
                          >
                            <IconX className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-2xl p-16 text-center">
                      <IconClockHour4 className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                      <p className="text-gray-700 font-bold text-2xl mb-3">Sem Agendamentos</p>
                      <p className="text-gray-500 text-lg">Crie horários automáticos de reprodução</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-4xl mx-auto space-y-8">

                {/* PLAYER MODE SELECTOR - Simplified */}
                <div className="space-y-6">
                  <h3 className="text-3xl font-bold text-gray-800">Configurações do Player</h3>
                  <p className="text-gray-600 text-lg">Escolha o motor de reprodução ideal para seus vídeos</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {/* EmbedMaster Mode */}
                    <button
                      onClick={() => setConfig({ ...config, playerMode: 'vidsrc' })}
                      className={`p-8 rounded-2xl border-2 text-center ${
                        config.playerMode === 'vidsrc'
                          ? 'bg-gray-100 border-gray-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="text-5xl mb-4">🎬</div>
                      <h5 className="text-xl font-bold text-gray-800 mb-2">EmbedMaster</h5>
                      <p className="text-base text-gray-600 mb-4">Streams multi-fonte</p>
                      <div className={`mx-auto w-5 h-5 rounded-full border-3 flex items-center justify-center ${
                        config.playerMode === 'vidsrc' ? 'border-gray-500' : 'border-gray-300'
                      }`}>
                        {config.playerMode === 'vidsrc' && (
                          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                        )}
                      </div>
                    </button>

                    {/* Direct Video Mode */}
                    <button
                      onClick={() => setConfig({ ...config, playerMode: 'direct' })}
                      className={`p-8 rounded-2xl border-2 text-center ${
                        config.playerMode === 'direct'
                          ? 'bg-gray-100 border-gray-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="text-5xl mb-4">🎥</div>
                      <h5 className="text-xl font-bold text-gray-800 mb-2">Stream Direto</h5>
                      <p className="text-base text-gray-600 mb-4">Sincronização em tempo real</p>
                      <div className={`mx-auto w-5 h-5 rounded-full border-3 flex items-center justify-center ${
                        config.playerMode === 'direct' ? 'border-gray-500' : 'border-gray-300'
                      }`}>
                        {config.playerMode === 'direct' && (
                          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                        )}
                      </div>
                    </button>

                    {/* YouTube Mode */}
                    <button
                      onClick={() => setConfig({ ...config, playerMode: 'youtube' })}
                      className={`p-8 rounded-2xl border-2 text-center ${
                        config.playerMode === 'youtube'
                          ? 'bg-gray-100 border-gray-500'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="text-5xl mb-4">📺</div>
                      <h5 className="text-xl font-bold text-gray-800 mb-2">YouTube</h5>
                      <p className="text-base text-gray-600 mb-4">Playlists & vídeos</p>
                      <div className={`mx-auto w-5 h-5 rounded-full border-3 flex items-center justify-center ${
                        config.playerMode === 'youtube' ? 'border-gray-500' : 'border-gray-300'
                      }`}>
                        {config.playerMode === 'youtube' && (
                          <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>


                {/* GENERAL SETTINGS */}
                <div className="space-y-8">
                  <h4 className="text-3xl font-bold text-gray-800">Opções Gerais</h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {[
                      { key: 'autoplay', label: 'Autoplay', icon: '▶️' },
                      { key: 'muted', label: 'Mudo', icon: '🔇' },
                      { key: 'loop', label: 'Loop', icon: '🔁' },
                      { key: 'useSchedule', label: 'Agenda', icon: '📅' }
                    ].map(({ key, label, icon }) => (
                      <label
                        key={key}
                        className={`relative flex flex-col items-center gap-3 p-6 rounded-2xl border-2 cursor-pointer ${
                          config[key as keyof PlayerConfig]
                            ? 'bg-gray-100 border-gray-500'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={config[key as keyof PlayerConfig] as boolean}
                          onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
                          className="sr-only"
                        />
                        <span className="text-4xl">{icon}</span>
                        <span className="text-gray-800 text-base font-semibold">{label}</span>
                        <div className={`absolute top-3 right-3 w-5 h-5 rounded-full border-3 flex items-center justify-center ${
                          config[key as keyof PlayerConfig] ? 'border-gray-500' : 'border-gray-300'
                        }`}>
                          {config[key as keyof PlayerConfig] && (
                            <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* LANGUAGE & API */}
                <div className="grid grid-cols-1 gap-8">
                  {/* LANGUAGE */}
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold text-gray-800">Idioma das Legendas</h4>
                    <select
                      value={config.ds_lang}
                      onChange={(e) => setConfig({ ...config, ds_lang: e.target.value })}
                      className="w-full px-5 py-4 bg-white border border-gray-300 rounded-xl text-gray-800 appearance-none cursor-pointer font-medium text-lg"
                    >
                      <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                      <option value="en">🇺🇸 Inglês</option>
                      <option value="es">🇪🇸 Espanhol</option>
                      <option value="fr">🇫🇷 Francês</option>
                      <option value="de">🇩🇪 Alemão</option>
                      <option value="it">🇮🇹 Italiano</option>
                      <option value="ja">🇯🇵 Japonês</option>
                      <option value="ko">🇰🇷 Coreano</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-10 pt-6 border-t border-gray-300">
              <button
                onClick={handleSaveAll}
                className="w-full py-5 bg-gray-600 text-white font-bold text-xl rounded-2xl border border-gray-500 flex items-center justify-center gap-3"
              >
                <IconDeviceFloppy className="w-6 h-6" />
                💾 Salvar Todas as Alterações
              </button>
              <p className="text-center text-gray-500 text-sm mt-4 bg-gray-100 rounded-lg px-4 py-2 inline-block">
                As alterações são sincronizadas instantaneamente em todos os players
              </p>
            </div>
          </div>

  </div>
  );
}
