import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
import { IconX, IconCopy, IconSettings2, IconDeviceFloppy, IconListDetails, IconClockHour4, IconTags } from '@tabler/icons-react';
import type { VideoSource, PlayerConfig, ScheduleItem } from '../types';
import { GENRE_TAGS } from '../types';
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
  const [activeTab, setActiveTab] = useState<'search' | 'playlist' | 'schedule' | 'settings'>('search');
  const [config, setConfig] = useState(initialConfig);
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  
  const [scheduleName, setScheduleName] = useState('');
  const [scheduleVideoId, setScheduleVideoId] = useState('');
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [scheduleStart, setScheduleStart] = useState('09:00');
  const [scheduleEnd, setScheduleEnd] = useState('18:00');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingTags, setEditingTags] = useState<string[]>([]);

  useEffect(() => {
    setConfig(initialConfig);
    setPlaylist(initialPlaylist);
    setSchedules(initialSchedules);
  }, [initialConfig, initialPlaylist, initialSchedules]);

  const handleAddVideo = (video: VideoSource) => {
    setPlaylist([...playlist, video]);
    setActiveTab('playlist');
  };

  const handleRemoveVideo = (id: string) => {
    setPlaylist(playlist.filter(v => v.id !== id));
  };

  const handleEditTags = useCallback((videoId: string, currentTags: string[] = []) => {
    setEditingVideoId(videoId);
    setEditingTags(currentTags);
  }, []);

  const handleSaveTags = useCallback(() => {
    if (editingVideoId) {
      setPlaylist(playlist.map(v => 
        v.id === editingVideoId ? { ...v, tags: editingTags } : v
      ));
      setEditingVideoId(null);
      setEditingTags([]);
    }
  }, [editingVideoId, editingTags, playlist]);

  const toggleTag = useCallback((tag: string) => {
    setEditingTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

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
  const tabs: { id: 'search' | 'playlist' | 'schedule' | 'settings'; label: string; icon: any }[] = [
  { id: 'search', label: 'Search', icon: IconCopy },
  { id: 'playlist', label: 'Playlist', icon: IconListDetails },
  { id: 'schedule', label: 'Schedule', icon: IconClockHour4 },
  { id: 'settings', label: 'Settings', icon: IconSettings2 }
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
  <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 z-50 overflow-y-auto font-poppins">
      <div className="min-h-screen p-3 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="relative overflow-hidden p-5 sm:p-8 bg-slate-900/60 backdrop-blur-xl rounded-2xl mb-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <IconSettings2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                    StreamCast
                  </h1>
                  <p className="text-blue-300 text-xs sm:text-sm hidden sm:block">Painel Administrativo</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmbedModal(true)}
                  className="px-3 py-2 sm:px-4 sm:py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500/50 text-blue-300 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-semibold"
                >
                  <IconCopy className="w-4 h-4" />
                  <span className="hidden sm:inline">Embed</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 sm:p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 text-red-300 rounded-lg transition-all duration-200"
                >
                  <IconX className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Modal de Embed Code */}
          {showEmbedModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-60 p-4">
              <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-3xl w-full">
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center">
                      <IconCopy className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Código de Incorporação</h3>
                      <p className="text-slate-400 text-xs">Copie e cole em seu site</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowEmbedModal(false)} 
                    className="p-2 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-lg transition-all duration-200"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>
                
                <pre className="bg-slate-950 border border-slate-700 rounded-xl p-4 text-blue-300 text-xs sm:text-sm font-mono overflow-x-auto mb-6 max-h-96">
                  <code>{generateEmbedCode()}</code>
                </pre>
                
                <button 
                  onClick={copyEmbedCode} 
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-white font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  <IconCopy className="w-5 h-5" />
                  Copy to Clipboard
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div
            role="tablist"
            aria-label="Admin navigation"
            onKeyDown={handleTabsKeyDown}
            className="flex items-center gap-2 p-2 bg-slate-900/50 backdrop-blur-xl rounded-xl mb-6 border border-slate-700 overflow-x-auto"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-24 py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-transparent text-slate-400 hover:bg-slate-800 hover:text-blue-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden xs:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 sm:p-6 lg:p-8 min-h-[500px]">
            
            {activeTab === 'search' && (
              <SearchTab onAddVideo={handleAddVideo} />
            )}

            {activeTab === 'playlist' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">Playlist</h3>
                  <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm font-semibold rounded-xl">
                    {playlist.length} {playlist.length === 1 ? 'Vídeo' : 'Vídeos'}
                  </span>
                </div>
                
                {playlist.length === 0 ? (
                  <div className="border-2 border-dashed border-blue-500/20 bg-slate-800/20 rounded-2xl p-12 sm:p-16 text-center">
                    <IconListDetails className="w-16 h-16 sm:w-20 sm:h-20 text-blue-400/30 mx-auto mb-4" />
                    <p className="text-white font-bold text-lg mb-2">Playlist Vazia</p>
                    <p className="text-slate-400 text-sm">Adicione vídeos pela aba Buscar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {playlist.map((video, index) => (
                      <div key={video.id} className="group bg-slate-800/30 hover:bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200 flex items-center gap-4">
                        <div className="flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-center text-blue-300 font-bold text-sm sm:text-base">
                          {index + 1}
                        </div>
                        {video.posterPath ? (
                          <img
                            src={getTMDBPosterUrl(video.posterPath)}
                            alt={video.title}
                            className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded-lg border border-slate-600"
                          />
                        ) : (
                          <div className="w-10 h-14 sm:w-12 sm:h-16 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center">
                            <IconListDetails className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm sm:text-base truncate mb-1">{video.title}</p>
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded text-xs font-medium uppercase">{video.type}</span>
                            {video.type === 'episode' && <span className="font-mono text-cyan-400 text-xs">S{video.season}E{video.episode}</span>}
                            {video.tmdb && <span className="font-mono text-slate-500 text-xs">#{video.tmdb}</span>}
                            {video.tags && video.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {video.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                                {video.tags.length > 2 && (
                                  <span className="text-slate-500 text-xs">+{video.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditTags(video.id, video.tags)}
                            className="p-2 bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 rounded-lg transition-all duration-200"
                            title="Edit Tags"
                          >
                            <IconTags className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => handleRemoveVideo(video.id)}
                            className="p-2 bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                          >
                            <IconX className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Create Schedule */}
                <div className="space-y-5">
                  <h3 className="text-2xl font-bold text-white mb-6">Criar Agendamento</h3>

                  <div>
                    <label className="text-blue-300 text-sm font-semibold mb-2 block">Nome</label>
                    <input
                      type="text"
                      placeholder="ex: Filmes do Horário Nobre"
                      value={scheduleName}
                      onChange={(e) => setScheduleName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl text-white placeholder-slate-500 transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="text-blue-300 text-sm font-semibold mb-2 block">Vídeo</label>
                    <select
                      value={scheduleVideoId}
                      onChange={(e) => setScheduleVideoId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl text-white appearance-none cursor-pointer transition-all duration-200"
                    >
                      <option value="">Selecione um vídeo...</option>
                      {playlist.map(video => (
                        <option key={video.id} value={video.id}>{video.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-blue-300 text-sm font-semibold mb-3 block">Dias da Semana</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {DAYS.map((day, index) => (
                        <button
                          key={index}
                          onClick={() => toggleDay(index)}
                          className={`py-2.5 px-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                            scheduleDays.includes(index)
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-800/50 border border-slate-700 text-slate-400 hover:border-blue-500/50'
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-blue-300 text-sm font-semibold mb-2 block">Início</label>
                      <input
                        type="time"
                        value={scheduleStart}
                        onChange={(e) => setScheduleStart(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl text-white font-mono transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="text-blue-300 text-sm font-semibold mb-2 block">Fim</label>
                      <input
                        type="time"
                        value={scheduleEnd}
                        onChange={(e) => setScheduleEnd(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl text-white font-mono transition-all duration-200"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddSchedule}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.01]"
                  >
                    <IconClockHour4 className="w-5 h-5" />
                    Adicionar Agendamento
                  </button>
                </div>
                
                {/* Schedules List */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white mb-6">Agendamentos Ativos</h3>

                  {schedules.length > 0 ? (
                    schedules.map(schedule => (
                      <div key={schedule.id} className="bg-slate-800/30 border border-slate-700 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-200">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-base truncate mb-2">{schedule.name}</p>
                            <p className="text-cyan-400 text-sm font-mono mb-3">{schedule.startTime} — {schedule.endTime}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {schedule.days.map(day => (
                                <span key={day} className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium rounded">
                                  {DAYS[day].slice(0, 3)}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSchedule(schedule.id)}
                            className="flex-shrink-0 p-2 bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                          >
                            <IconX className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border-2 border-dashed border-blue-500/20 bg-slate-800/20 rounded-2xl p-12 text-center h-full flex flex-col justify-center">
                      <IconClockHour4 className="w-16 h-16 text-blue-400/30 mx-auto mb-4" />
                      <p className="text-white font-bold text-lg mb-2">Sem Agendamentos</p>
                      <p className="text-slate-400 text-sm">Crie horários automáticos de reprodução</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-4xl mx-auto space-y-10">
                
                {/* PLAYER MODE SELECTOR - Simplified */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-white mb-6">Motor de Reprodução</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* EmbedMaster Mode */}
                    <button
                      onClick={() => setConfig({ ...config, playerMode: 'vidsrc' })}
                      className={`group relative p-6 rounded-xl border transition-all duration-300 text-center ${
                        config.playerMode === 'vidsrc'
                          ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-slate-800/40 border-slate-700 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="text-4xl mb-3">🎬</div>
                      <h5 className="text-base font-bold text-white mb-1">EmbedMaster</h5>
                      <p className="text-xs text-slate-400 mb-3">Streams multi-fonte</p>
                      <div className={`mx-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        config.playerMode === 'vidsrc' ? 'border-blue-400' : 'border-slate-600'
                      }`}>
                        {config.playerMode === 'vidsrc' && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        )}
                      </div>
                    </button>

                    {/* Direct Video Mode */}
                    <button
                      onClick={() => setConfig({ ...config, playerMode: 'direct' })}
                      className={`group relative p-6 rounded-xl border transition-all duration-300 text-center ${
                        config.playerMode === 'direct'
                          ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-slate-800/40 border-slate-700 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="text-4xl mb-3">🎥</div>
                      <h5 className="text-base font-bold text-white mb-1">Stream Direto</h5>
                      <p className="text-xs text-slate-400 mb-3">Sincronização em tempo real</p>
                      <div className={`mx-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        config.playerMode === 'direct' ? 'border-blue-400' : 'border-slate-600'
                      }`}>
                        {config.playerMode === 'direct' && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        )}
                      </div>
                    </button>

                    {/* YouTube Mode */}
                    <button
                      onClick={() => setConfig({ ...config, playerMode: 'youtube' })}
                      className={`group relative p-6 rounded-xl border transition-all duration-300 text-center ${
                        config.playerMode === 'youtube'
                          ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-slate-800/40 border-slate-700 hover:border-blue-500/50'
                      }`}
                    >
                      <div className="text-4xl mb-3">📺</div>
                      <h5 className="text-base font-bold text-white mb-1">YouTube</h5>
                      <p className="text-xs text-slate-400 mb-3">Playlists & videos</p>
                      <div className={`mx-auto w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        config.playerMode === 'youtube' ? 'border-blue-400' : 'border-slate-600'
                      }`}>
                        {config.playerMode === 'youtube' && (
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>


                {/* GENERAL SETTINGS */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white mb-6">Options</h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { key: 'autoplay', label: 'Autoplay', icon: '▶️' },
                      { key: 'muted', label: 'Muted', icon: '🔇' },
                      { key: 'loop', label: 'Loop', icon: '🔁' },
                      { key: 'useSchedule', label: 'Schedule', icon: '📅' }
                    ].map(({ key, label, icon }) => (
                      <label
                        key={key}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          config[key as keyof PlayerConfig]
                            ? 'bg-blue-500/10 border-blue-500'
                            : 'bg-slate-800/40 border-slate-700 hover:border-blue-500/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={config[key as keyof PlayerConfig] as boolean}
                          onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
                          className="sr-only"
                        />
                        <span className="text-2xl">{icon}</span>
                        <span className="text-white text-sm font-medium">{label}</span>
                        <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          config[key as keyof PlayerConfig] ? 'border-blue-400' : 'border-slate-600'
                        }`}>
                          {config[key as keyof PlayerConfig] && (
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* LANGUAGE & API */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* LANGUAGE */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">Subtitle Language</h3>
                    <select
                      value={config.ds_lang}
                      onChange={(e) => setConfig({ ...config, ds_lang: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl text-white appearance-none cursor-pointer transition-all duration-200 font-medium"
                    >
                      <option value="pt-BR">🇧🇷 Portuguese (Brazil)</option>
                      <option value="en">🇺🇸 English</option>
                      <option value="es">🇪🇸 Spanish</option>
                      <option value="fr">🇫🇷 French</option>
                      <option value="de">🇩🇪 German</option>
                      <option value="it">🇮🇹 Italian</option>
                      <option value="ja">🇯🇵 Japanese</option>
                      <option value="ko">🇰🇷 Korean</option>
                    </select>
                  </div>

                  {/* TMDB API KEY */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-white">Chave API TMDB</h3>
                    <input
                      type="password"
                      placeholder="Chave API opcional"
                      value={config.tmdbApiKey}
                      onChange={(e) => setConfig({ ...config, tmdbApiKey: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 focus:border-blue-500 rounded-xl text-white placeholder-slate-500 transition-all duration-200 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-10 pt-6 border-t border-slate-700">
              <button
                onClick={handleSaveAll}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-[1.01]"
              >
                <IconDeviceFloppy className="w-5 h-5" />
                Save All Changes
              </button>
              <p className="text-center text-slate-500 text-xs mt-3">
                Changes sync instantly across all players
              </p>
            </div>
          </div>

          {/* Tag Editor Modal */}
          {editingVideoId && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-60 p-4">
              <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-3xl w-full">
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center">
                      <IconTags className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Edit Tags</h3>
                      <p className="text-slate-400 text-xs">Select genre categories</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setEditingVideoId(null); setEditingTags([]); }} 
                    className="p-2 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-lg transition-all duration-200"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6 max-h-[60vh] overflow-y-auto">
                  {GENRE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`py-2.5 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                        editingTags.includes(tag)
                          ? 'bg-purple-500 text-white'
                          : 'bg-slate-800/50 border border-slate-700 text-slate-300 hover:border-purple-500/50'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => { setEditingVideoId(null); setEditingTags([]); }}
                    className="flex-1 py-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveTags} 
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <IconDeviceFloppy className="w-5 h-5" />
                    Save Tags
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
