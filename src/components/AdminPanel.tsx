import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Settings as SettingsIcon, Save, List, Clock, Tag } from 'lucide-react';
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
    onSave(config, playlist, schedules);
    alert('✅ Configurações salvas e sincronizadas!');
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

  return (
    <div className="fixed inset-0 bg-linear-to-br from-black via-gray-900 to-black z-50 overflow-y-auto font-['Poppins']">
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header com blur e espaçamento */}
          <div className="flex items-center justify-between p-8 bg-linear-to-r from-[#1e1e1e]/90 to-[#1a1a1a]/90 backdrop-blur-sm rounded-2xl mb-8 border border-[#00bfa6]/30">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-linear-to-br from-[#00bfa6]/20 to-[#00bfa6]/5 border-2 border-[#00bfa6]/50 rounded-xl flex items-center justify-center">
                <SettingsIcon className="w-7 h-7 text-[#00bfa6]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">StreamCast</h1>
                <p className="text-gray-400 text-sm mt-1">Painel de Controle Avançado</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowEmbedModal(true)}
                className="px-4 py-2 bg-[#121212] border border-gray-700 hover:border-[#00bfa6] text-gray-300 hover:text-white rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Embed
              </button>
              <button 
                onClick={onClose} 
                className="p-2 bg-[#121212] border border-gray-700 hover:border-red-500 text-gray-300 hover:text-red-400 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal de Embed Code */}
          {showEmbedModal && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-60">
              <div className="bg-[#1e1e1e] border border-[#00bfa6]/30 rounded-2xl p-8 max-w-2xl w-full m-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold text-lg">Código de Incorporação</h3>
                  <button onClick={() => setShowEmbedModal(false)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <pre className="bg-[#121212] border border-gray-600 rounded-lg p-4 text-gray-300 text-sm font-mono overflow-x-auto mb-4">
                  <code>{generateEmbedCode()}</code>
                </pre>
                <button 
                  onClick={copyEmbedCode} 
                  className="w-full py-3 bg-[#00bfa6] hover:bg-[#00a794] rounded-lg text-black font-bold transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copiar Código
                </button>
              </div>
            </div>
          )}

          {/* Tabs com espaçamento otimizado */}
          <div className="flex items-center gap-4 p-3 bg-[#1e1e1e]/80 backdrop-blur-sm rounded-2xl mb-10 border border-[#00bfa6]/20">
            {[
              { id: 'search', label: 'Buscar', icon: Copy },
              { id: 'playlist', label: 'Playlist', icon: List },
              { id: 'schedule', label: 'Agendar', icon: Clock },
              { id: 'settings', label: 'Config', icon: SettingsIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors duration-150 flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-[#00bfa6] text-black'
                    : 'bg-transparent text-gray-400 hover:bg-[#121212] hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-[#1e1e1e] border border-[#00bfa6]/10 rounded-2xl p-8 min-h-[500px]">
            
            {activeTab === 'search' && (
              <SearchTab onAddVideo={handleAddVideo} />
            )}

            {activeTab === 'playlist' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-xl">Playlist</h3>
                  <span className="px-3 py-1 bg-[#121212] border border-gray-700 text-[#00bfa6] text-sm font-semibold rounded-full">
                    {playlist.length} vídeos
                  </span>
                </div>
                
                {playlist.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center">
                    <List className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                    <p className="text-white font-semibold mb-1">Playlist Vazia</p>
                    <p className="text-gray-400 text-sm">Use a aba "Buscar" para adicionar vídeos.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {playlist.map((video, index) => (
                      <div key={video.id} className="bg-[#1a1a1a]/60 backdrop-blur-sm border border-gray-700 hover:border-[#00bfa6]/60 rounded-xl p-5 transition-colors duration-150 flex items-center gap-5">
                        <div className="w-12 text-center text-gray-400 font-bold text-lg">{index + 1}</div>
                        {video.posterPath ? (
                          <img
                            src={getTMDBPosterUrl(video.posterPath)}
                            alt={video.title}
                            className="w-12 h-16 object-cover rounded-md border border-gray-600"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-gray-800 rounded-md flex items-center justify-center">
                            <List className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">{video.title}</p>
                          <div className="flex items-center gap-2 text-xs mt-1 flex-wrap">
                            <span className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded">{video.type}</span>
                            {video.type === 'episode' && <span className="font-mono text-gray-400">S{video.season}E{video.episode}</span>}
                            {video.tmdb && <span className="font-mono text-gray-400">TMDB:{video.tmdb}</span>}
                            {video.tags && video.tags.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap">
                                {video.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-[#00bfa6]/20 border border-[#00bfa6]/30 text-[#00bfa6] rounded text-xs">
                                    {tag}
                                  </span>
                                ))}
                                {video.tags.length > 2 && (
                                  <span className="text-gray-400">+{video.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditTags(video.id, video.tags)}
                            className="p-2 text-[#00bfa6] hover:text-white hover:bg-[#00bfa6]/10 rounded-md transition-colors duration-200"
                            title="Editar Tags"
                          >
                            <Tag className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleRemoveVideo(video.id)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors duration-200"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Criar Novo Agendamento */}
                <div className="space-y-5">
                  <h3 className="text-white font-bold text-xl mb-4">Criar Agendamento</h3>
                  <div>
                    <label className="text-gray-300 text-sm font-semibold mb-1 block">Nome</label>
                    <input
                      type="text"
                      placeholder="Ex: Sessão da Tarde"
                      value={scheduleName}
                      onChange={(e) => setScheduleName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121212] border border-gray-700 focus:border-[#00bfa6] rounded-lg text-white placeholder-gray-500 transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-semibold mb-1 block">Vídeo</label>
                    <select
                      value={scheduleVideoId}
                      onChange={(e) => setScheduleVideoId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#121212] border border-gray-700 focus:border-[#00bfa6] rounded-lg text-white"
                    >
                      <option value="">Selecione um vídeo</option>
                      {playlist.map(video => (
                        <option key={video.id} value={video.id}>{video.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-300 text-sm font-semibold mb-2 block">Dias da Semana</label>
                    <div className="grid grid-cols-4 gap-2">
                      {DAYS.map((day, index) => (
                        <button
                          key={index}
                          onClick={() => toggleDay(index)}
                          className={`py-2 rounded-lg font-semibold text-sm transition-colors duration-200 ${
                            scheduleDays.includes(index)
                              ? 'bg-[#00bfa6] text-black'
                              : 'bg-[#121212] border border-gray-700 text-gray-300 hover:border-[#00bfa6]/50'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-300 text-sm font-semibold mb-1 block">Início</label>
                      <input
                        type="time"
                        value={scheduleStart}
                        onChange={(e) => setScheduleStart(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121212] border border-gray-700 focus:border-[#00bfa6] rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 text-sm font-semibold mb-1 block">Término</label>
                      <input
                        type="time"
                        value={scheduleEnd}
                        onChange={(e) => setScheduleEnd(e.target.value)}
                        className="w-full px-3 py-2 bg-[#121212] border border-gray-700 focus:border-[#00bfa6] rounded-lg text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddSchedule}
                    className="w-full py-3 bg-[#00bfa6] hover:bg-[#00a794] text-black font-bold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5" />
                    Criar
                  </button>
                </div>
                
                {/* Lista de Agendamentos */}
                <div className="space-y-3">
                  <h3 className="text-white font-bold text-xl mb-4">Agendamentos Ativos</h3>
                  {schedules.length > 0 ? (
                    schedules.map(schedule => (
                      <div key={schedule.id} className="bg-[#121212] border border-gray-700 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-white font-semibold">{schedule.name}</p>
                            <p className="text-sm text-gray-400 font-mono">{schedule.startTime} - {schedule.endTime}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {schedule.days.map(day => (
                                <span key={day} className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs font-semibold rounded">
                                  {DAYS[day]}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveSchedule(schedule.id)}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors duration-200"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="border-2 border-dashed border-gray-700 rounded-xl p-12 text-center h-full flex flex-col justify-center">
                      <Clock className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                      <p className="text-white font-semibold mb-1">Nenhum agendamento</p>
                      <p className="text-gray-400 text-sm">Crie um para começar.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="max-w-2xl mx-auto">
                <h3 className="text-white font-bold text-xl mb-6">Configurações</h3>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'autoplay', label: 'Autoplay' },
                      { key: 'muted', label: 'Mudo' },
                      { key: 'loop', label: 'Loop' },
                      { key: 'useSchedule', label: 'Usar Agendamento' }
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-3 p-4 bg-[#121212] border border-gray-700 rounded-lg cursor-pointer hover:border-[#00bfa6]/50 transition-colors duration-200">
                        <input
                          type="checkbox"
                          checked={config[key as keyof PlayerConfig] as boolean}
                          onChange={(e) => setConfig({ ...config, [key]: e.target.checked })}
                          className="w-5 h-5 rounded-sm accent-[#00bfa6]"
                        />
                        <span className="text-white font-semibold">{label}</span>
                      </label>
                    ))}
                  </div>
                  
                  <div>
                    <label className="text-gray-300 text-sm font-semibold mb-1 block">Idioma (Áudio/Legenda)</label>
                    <select
                      value={config.ds_lang}
                      onChange={(e) => setConfig({ ...config, ds_lang: e.target.value })}
                      className="w-full px-3 py-2 bg-[#121212] border border-gray-700 focus:border-[#00bfa6] rounded-lg text-white"
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
                  
                  <div>
                    <label className="text-gray-300 text-sm font-semibold mb-1 block">Chave da API TMDB</label>
                    <input
                      type="password"
                      placeholder="Cole sua chave da API aqui"
                      value={config.tmdbApiKey}
                      onChange={(e) => setConfig({ ...config, tmdbApiKey: e.target.value })}
                      className="w-full px-3 py-2 bg-[#121212] border border-gray-700 focus:border-[#00bfa6] rounded-lg text-white placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <button
                onClick={handleSaveAll}
                className="w-full py-4 bg-[#00bfa6] hover:bg-[#00a794] text-black font-bold rounded-lg text-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Salvar e Sincronizar
              </button>
              <p className="text-center text-gray-500 text-xs mt-3">
                As configurações serão salvas e aplicadas em todos os players.
              </p>
            </div>
          </div>

          {/* Modal de Edição de Tags - Otimizado */}
          {editingVideoId && (
            <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-60">
              <div className="bg-[#1e1e1e] border border-[#00bfa6]/30 rounded-2xl p-8 max-w-2xl w-full m-4">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#00bfa6]/10 border border-[#00bfa6]/30 rounded-lg flex items-center justify-center">
                      <Tag className="w-5 h-5 text-[#00bfa6]" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Editar Tags</h3>
                      <p className="text-gray-400 text-sm">Selecione os gêneros do vídeo</p>
                    </div>
                  </div>
                  <button onClick={() => { setEditingVideoId(null); setEditingTags([]); }} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {GENRE_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`py-3 px-4 rounded-lg font-semibold text-sm transition-colors duration-150 ${
                        editingTags.includes(tag)
                          ? 'bg-[#00bfa6] text-black'
                          : 'bg-[#121212] border border-gray-700 text-gray-300 hover:border-[#00bfa6]/50 hover:text-white'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => { setEditingVideoId(null); setEditingTags([]); }}
                    className="flex-1 py-3 bg-[#121212] border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg font-bold transition-colors duration-150"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleSaveTags} 
                    className="flex-1 py-3 bg-[#00bfa6] hover:bg-[#00a794] rounded-lg text-black font-bold transition-colors duration-150 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Salvar Tags
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
