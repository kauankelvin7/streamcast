import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
import { 
  IconX, IconCopy, IconSettings2, IconDeviceFloppy, IconListDetails, 
  IconClockHour4, IconTags, IconUpload, IconWorld, IconSearch, IconSparkles, IconDownload, IconFileText, IconMovie
} from '@tabler/icons-react';
import { findSubtitles, getSubtitleDownloadUrl, Subtitle } from '../utils/subtitles';
  // Estado para legendas
  const [subLoadingId, setSubLoadingId] = useState<string | null>(null);
  const [subResults, setSubResults] = useState<Record<string, Subtitle[]>>({});
  const [subError, setSubError] = useState<string | null>(null);
  const [ffmpegCmd, setFfmpegCmd] = useState<string | null>(null);
  // Busca legendas para um vídeo
  const handleSearchSubtitles = async (video: VideoSource) => {
    setSubLoadingId(video.id);
    setSubError(null);
    setFfmpegCmd(null);
    try {
      let subs: Subtitle[] | null = null;
      if (video.imdb) {
        subs = await findSubtitles(video.imdb, video.season, video.episode);
      } else if (video.title) {
        // Busca por nome se não houver IMDB
        const query = encodeURIComponent(video.title);
        const url = `https://api.opensubtitles.com/api/v1/subtitles?query=${query}&languages=pb,pt,en`;
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) throw new Error('OpenSubtitles API Error');
        const result = await response.json();
        subs = result.data?.map((item: any) => ({
          SubFileName: item.attributes.files[0]?.file_name || 'Unknown',
          SubDownloadLink: item.attributes.files[0]?.file_id ? `https://api.opensubtitles.com/api/v1/download` : '',
          ZipDownloadLink: '',
          LanguageName: item.attributes.language,
          SubFormat: item.attributes.files[0]?.file_name.split('.').pop() || 'srt',
          Score: item.attributes.ratings,
          SubtitlesLink: item.attributes.url,
          IDSubtitleFile: item.attributes.files[0]?.file_id,
        })) || null;
      }
      if (!subs || subs.length === 0) {
        setSubError('Nenhuma legenda encontrada.');
        setSubLoadingId(null);
        return;
      }
      setSubResults(prev => ({ ...prev, [video.id]: subs.filter(s => s.LanguageName.toLowerCase().includes('portugu')) }));
    } catch (e) {
      setSubError('Erro ao buscar legendas.');
    }
    setSubLoadingId(null);
  };

  // Baixa legenda .srt
  const handleDownloadSubtitle = async (subtitle: Subtitle) => {
    setSubError(null);
    try {
      const url = await getSubtitleDownloadUrl(subtitle.IDSubtitleFile);
      if (!url) {
        setSubError('Não foi possível obter o link da legenda.');
        return;
      }
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = subtitle.SubFileName || 'legenda.srt';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setSubError('Erro ao baixar legenda.');
    }
  };

  // Gera comando ffmpeg para incorporar legenda
  const handleGenerateFfmpeg = (video: VideoSource, subtitle: Subtitle) => {
    // Supondo que o vídeo e a legenda estejam salvos localmente
    const videoFile = video.fileName || 'meu_video.mp4';
    const subFile = subtitle.SubFileName || 'legenda.srt';
    setFfmpegCmd(`ffmpeg -i "${videoFile}" -vf subtitles="${subFile}" -c:a copy "${videoFile.replace(/\.[^/.]+$/, '')}_legendado.mp4"`);
  };
import type { VideoSource, PlayerConfig, ScheduleItem } from '../types';
import { GENRE_TAGS } from '../types';
import SearchTab from './SearchTab';
import UploadTab from './UploadTab';
import { DAYS } from '../utils/schedule';
import { getTMDBPosterUrl } from '../api/tmdb';
import { deleteVideoBlob } from '../utils/indexedDB';

type AdminPanelProps = {
  config: PlayerConfig;
  playlist: VideoSource[];
  schedules: ScheduleItem[];
  onClose: () => void;
  onSave: (config: PlayerConfig, playlist: VideoSource[], schedules: ScheduleItem[]) => void;
};

// Floating Particles Component
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-primary rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
            opacity: Math.random() * 0.5 + 0.2,
            boxShadow: `0 0 ${10 + Math.random() * 20}px rgba(138, 43, 226, ${0.3 + Math.random() * 0.5})`
          }}
        />
      ))}
      {[...Array(15)].map((_, i) => (
        <div
          key={`accent-${i}`}
          className="absolute w-1 h-1 bg-accent rounded-full animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`,
            opacity: Math.random() * 0.4 + 0.1,
            boxShadow: `0 0 ${10 + Math.random() * 20}px rgba(0, 255, 255, ${0.3 + Math.random() * 0.4})`
          }}
        />
      ))}
    </div>
  );
};

export default function AdminPanel({ config: initialConfig, playlist: initialPlaylist, schedules: initialSchedules, onClose, onSave }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'internet' | 'search' | 'upload' | 'playlist' | 'schedule' | 'settings'>('internet');
  const [config, setConfig] = useState(initialConfig);
  const [playlist, setPlaylist] = useState(initialPlaylist);
  const [schedules, setSchedules] = useState(initialSchedules);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [uploads, setUploads] = useState<VideoSource[]>([]);
  
  // Internet Search State
  const [internetSearchQuery, setInternetSearchQuery] = useState('');
  const [internetSearchResults, setInternetSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
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
          color: 'from-red-500 to-red-600',
          urlPattern: (query: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
        },
        { 
          name: 'Vimeo', 
          icon: '🎥', 
          color: 'from-blue-500 to-blue-600',
          urlPattern: (query: string) => `https://vimeo.com/search?q=${encodeURIComponent(query)}`
        },
        { 
          name: 'Dailymotion', 
          icon: '📺', 
          color: 'from-cyan-500 to-cyan-600',
          urlPattern: (query: string) => `https://www.dailymotion.com/search/${encodeURIComponent(query)}`
        },
        { 
          name: 'Archive.org', 
          icon: '🎞️', 
          color: 'from-purple-500 to-purple-600',
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

  // Uploads handlers (persist in localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('streamcast_uploads');
      if (raw) setUploads(JSON.parse(raw));
    } catch (e) {}
  }, []);

  const persistUploads = (list: VideoSource[]) => {
    try {
      localStorage.setItem('streamcast_uploads', JSON.stringify(list));
    } catch (e) {}
  };

  const handleAddUpload = (video: VideoSource) => {
    const next = [...uploads, video];
    setUploads(next);
    persistUploads(next);
    // Optionally auto-add to playlist
  };

  const handleRemoveUpload = async (id: string) => {
    const upload = uploads.find(u => u.id === id);
    
    // Remove do IndexedDB se for um vídeo armazenado lá
    if (upload && upload.url.startsWith('indexeddb://')) {
      const videoId = upload.url.replace('indexeddb://', '');
      await deleteVideoBlob(videoId);
    }
    
    const next = uploads.filter(u => u.id !== id);
    setUploads(next);
    persistUploads(next);
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
  const tabs: { id: 'internet' | 'search' | 'upload' | 'playlist' | 'schedule' | 'settings'; label: string; icon: any }[] = [
  { id: 'internet', label: 'Busca Web', icon: IconWorld },
  { id: 'search', label: 'TMDB', icon: IconSearch },
  { id: 'upload', label: 'Uploads', icon: IconUpload },
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
  <div className="fixed inset-0 bg-gradient-to-br from-[#0a0014] via-[#1a0a2e] to-[#0a0014] z-50 overflow-y-auto font-poppins">
      {/* Floating Particles */}
      <FloatingParticles />
      
      {/* Animated Background Orbs with enhanced effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-primary/40 rounded-full blur-[180px] animate-glow-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-secondary/40 rounded-full blur-[180px] animate-glow-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-accent/30 rounded-full blur-[160px] animate-glow-pulse" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative min-h-screen p-3 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Header with enhanced effects */}
          <div className="relative overflow-hidden p-5 sm:p-8 bg-black/40 backdrop-blur-2xl rounded-3xl mb-6 border-2 border-primary/40 shadow-[0_0_80px_rgba(138,43,226,0.5)] animate-neon-border">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 pointer-events-none animate-gradient"></div>
            
            {/* Decorative corner accents */}
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-primary/30 to-transparent rounded-br-full"></div>
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-accent/30 to-transparent rounded-tl-full"></div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative group animate-bounce-subtle">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary via-secondary to-accent rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/60 group-hover:scale-110 transition-transform duration-500">
                    <IconSettings2 className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)] animate-spin" style={{ animationDuration: '20s' }} />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(138,43,226,0.8)] animate-gradient bg-[length:200%_auto]">
                    StreamCast
                  </h1>
                  <p className="text-accent text-xs sm:text-sm font-bold tracking-widest drop-shadow-[0_0_15px_rgba(0,255,255,0.8)] animate-pulse">PAINEL ADMINISTRATIVO</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowEmbedModal(true)}
                  className="group relative px-4 py-2.5 sm:px-5 sm:py-3 bg-gradient-to-r from-primary/20 to-secondary/20 hover:from-primary/40 hover:to-secondary/40 backdrop-blur-xl border-2 border-primary/50 hover:border-primary/80 text-white rounded-2xl transition-all duration-500 flex items-center gap-2 text-sm font-bold shadow-[0_0_30px_rgba(138,43,226,0.4)] hover:shadow-[0_0_50px_rgba(138,43,226,0.8)] hover:scale-110 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <IconCopy className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  <span className="hidden sm:inline relative z-10">Embed</span>
                </button>
                <button
                  onClick={onClose}
                  className="group relative p-2.5 sm:p-3 bg-gradient-to-r from-red-500/20 to-red-600/20 hover:from-red-500/40 hover:to-red-600/40 backdrop-blur-xl border-2 border-red-500/50 hover:border-red-500/80 text-red-300 hover:text-white rounded-2xl transition-all duration-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.8)] hover:scale-110 hover:rotate-90"
                >
                  <IconX className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                </button>
              </div>
            </div>
          </div>

          {/* Modal de Embed Code with enhanced effects */}
          {showEmbedModal && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-60 p-4 animate-in fade-in duration-300">
              <div className="relative bg-black/60 backdrop-blur-2xl border-2 border-primary/40 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-[0_0_100px_rgba(138,43,226,0.6)] animate-scale-pulse">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 rounded-3xl pointer-events-none animate-gradient"></div>
                
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-primary/40 to-transparent rounded-br-full"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-accent/40 to-transparent rounded-tl-full"></div>
                
                <div className="relative flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/30 to-secondary/30 border-2 border-primary/50 rounded-2xl flex items-center justify-center backdrop-blur-xl shadow-lg shadow-primary/40 animate-pulse">
                      <IconCopy className="w-6 h-6 text-white drop-shadow-[0_0_12px_rgba(138,43,226,1)]" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl bg-gradient-to-r from-white via-primary to-accent bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">Código de Incorporação</h3>
                      <p className="text-slate-400 text-sm font-semibold">Copie e cole em seu site</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowEmbedModal(false)} 
                    className="group p-2.5 bg-red-500/20 hover:bg-red-500/40 border-2 border-red-500/50 hover:border-red-500/80 text-red-300 hover:text-white rounded-2xl transition-all duration-500 backdrop-blur-xl shadow-lg hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:scale-110 hover:rotate-90"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>
                
                <pre className="bg-black/60 backdrop-blur-sm border-2 border-primary/30 rounded-2xl p-5 text-accent text-xs sm:text-sm font-mono overflow-x-auto mb-6 max-h-96 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] hover:border-accent/50 transition-colors duration-300">
                  <code>{generateEmbedCode()}</code>
                </pre>
                
                <button 
                  onClick={copyEmbedCode} 
                  className="group relative w-full py-4 bg-gradient-to-r from-primary via-secondary to-accent hover:from-accent hover:via-secondary hover:to-primary rounded-2xl text-white font-bold transition-all duration-500 flex items-center justify-center gap-3 shadow-[0_0_50px_rgba(138,43,226,0.6)] hover:shadow-[0_0_80px_rgba(0,255,255,0.8)] hover:scale-105 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
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
            className="flex items-center gap-2 p-2 bg-black/40 backdrop-blur-2xl rounded-2xl mb-6 border border-primary/30 overflow-x-auto shadow-lg shadow-primary/20"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls={`panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 min-w-24 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap overflow-hidden ${
                  activeTab === tab.id
                    ? 'text-white shadow-2xl shadow-primary/40 scale-105'
                    : 'text-slate-400 hover:text-primary hover:scale-102'
                }`}
              >
                {activeTab === tab.id && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-90"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent blur-lg opacity-50 animate-pulse"></div>
                  </>
                )}
                {activeTab !== tab.id && (
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                )}
                <tab.icon className={`w-4 h-4 relative z-10 ${activeTab === tab.id ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}`} />
                <span className="hidden xs:inline relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-black/40 backdrop-blur-2xl border border-primary/20 rounded-3xl p-4 sm:p-6 lg:p-8 min-h-[500px] shadow-[0_0_50px_rgba(138,43,226,0.2)]">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 rounded-3xl pointer-events-none"></div>
            
            {activeTab === 'internet' && (
              <div className="relative space-y-8">
                <div className="text-center mb-12 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary via-secondary to-accent rounded-full blur-3xl opacity-50 animate-pulse"></div>
                  </div>
                  <div className="relative inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary via-secondary to-accent rounded-3xl shadow-[0_0_60px_rgba(0,255,255,0.8)] mb-6 animate-bounce-subtle">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent rounded-3xl blur-xl opacity-75 animate-pulse"></div>
                    <IconWorld className="relative w-12 h-12 text-white drop-shadow-[0_0_20px_rgba(255,255,255,1)]" />
                  </div>
                  <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]">
                    Buscar Vídeos na Internet
                  </h2>
                  <p className="text-slate-300 text-lg font-semibold flex items-center justify-center gap-2">
                    <IconSparkles className="w-5 h-5 text-accent animate-pulse" />
                    Encontre vídeos em múltiplas plataformas
                    <IconSparkles className="w-5 h-5 text-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
                  </p>
                </div>

                {/* Enhanced Search Bar */}
                <div className="relative max-w-4xl mx-auto group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-3xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                  <div className="relative flex gap-3 bg-black/60 backdrop-blur-2xl border-2 border-primary/40 hover:border-accent/60 rounded-3xl p-3 shadow-[0_0_50px_rgba(138,43,226,0.4)] transition-all duration-500">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={internetSearchQuery}
                        onChange={(e) => setInternetSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleInternetSearch()}
                        placeholder="Digite o nome do filme, série ou vídeo..."
                        className="w-full px-6 py-5 bg-black/40 backdrop-blur-sm border border-primary/20 rounded-2xl text-white placeholder-slate-500 text-lg font-medium focus:outline-none focus:border-accent/50 focus:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all duration-300"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <IconSearch className="w-6 h-6 text-primary/40 animate-pulse" />
                      </div>
                    </div>
                    <button
                      onClick={handleInternetSearch}
                      disabled={isSearching}
                      className="group/btn relative px-10 py-5 bg-gradient-to-r from-primary via-secondary to-accent hover:from-accent hover:via-secondary hover:to-primary disabled:from-gray-500 disabled:to-gray-600 text-white font-bold rounded-2xl transition-all duration-500 shadow-[0_0_40px_rgba(138,43,226,0.6)] hover:shadow-[0_0_70px_rgba(0,255,255,0.9)] hover:scale-110 flex items-center gap-3 overflow-hidden"
                    >
                      {isSearching ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Buscando...
                        </>
                      ) : (
                        <>
                          <IconSearch className="w-5 h-5" />
                          Buscar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {internetSearchResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                    {internetSearchResults.map((result) => (
                      <div
                        key={result.id}
                        className="group relative bg-black/40 backdrop-blur-2xl border border-primary/30 hover:border-accent rounded-3xl overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_0_60px_rgba(138,43,226,0.6)] hover:-translate-y-2"
                      >
                        {/* Glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                        
                        <div className="relative h-48 overflow-hidden">
                          <div className={`absolute inset-0 bg-gradient-to-br ${result.color} opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>
                          <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
                          <div className="absolute inset-0 flex items-center justify-center text-7xl drop-shadow-[0_0_20px_rgba(138,43,226,0.8)] group-hover:scale-110 transition-transform duration-500">
                            {result.icon}
                          </div>
                          <div className="absolute top-3 right-3 px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-primary/30 shadow-lg shadow-primary/20">
                            {result.duration}
                          </div>
                        </div>
                        
                        <div className="relative p-5">
                          <div className={`inline-flex px-3 py-1.5 bg-gradient-to-r ${result.color} text-white text-xs font-bold rounded-xl mb-3 shadow-lg`}>
                            {result.source}
                          </div>
                          <h3 className="text-white font-bold text-sm mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all duration-300">
                            {result.title}
                          </h3>
                          <p className="text-slate-400 text-xs mb-4">{result.views}</p>
                          <button
                            onClick={() => handleAddFromInternet(result)}
                            className="relative w-full py-3 bg-gradient-to-r from-primary via-secondary to-accent hover:from-accent hover:via-secondary hover:to-primary text-white font-bold rounded-xl transition-all duration-500 flex items-center justify-center gap-2 text-sm shadow-[0_0_30px_rgba(138,43,226,0.5)] hover:shadow-[0_0_50px_rgba(0,255,255,0.8)] overflow-hidden group/btn"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000"></div>
                            <IconSearch className="w-4 h-4 relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            <span className="relative z-10">Adicionar Vídeo</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isSearching && internetSearchResults.length === 0 && internetSearchQuery && (
                  <div className="text-center py-20">
                    <IconWorld className="w-24 h-24 text-primary/30 mx-auto mb-6" />
                    <p className="text-slate-400 text-lg">Nenhum resultado encontrado. Tente outra busca.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <SearchTab onAddVideo={handleAddVideo} />
            )}

            {activeTab === 'upload' && (
              <UploadTab onUploadComplete={handleAddUpload} onAddToPlaylist={handleAddVideo} uploads={uploads} onRemoveUpload={handleRemoveUpload} />
            )}

            {activeTab === 'playlist' && (
              <div className="relative space-y-6">
                <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                  <h3 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent drop-shadow-[0_0_20px_rgba(138,43,226,0.5)]">
                    Playlist
                  </h3>
                  <span className="px-5 py-2.5 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-xl border border-primary/40 text-white text-sm font-bold rounded-2xl shadow-lg shadow-primary/30">
                    {playlist.length} {playlist.length === 1 ? 'Vídeo' : 'Vídeos'}
                  </span>
                </div>
                
                {playlist.length === 0 ? (
                  <div className="relative border-2 border-dashed border-primary/30 bg-black/20 backdrop-blur-xl rounded-3xl p-12 sm:p-16 text-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
                    <IconListDetails className="relative w-16 h-16 sm:w-20 sm:h-20 text-primary/40 mx-auto mb-4 drop-shadow-[0_0_30px_rgba(138,43,226,0.6)]" />
                    <p className="relative text-white font-bold text-lg mb-2">Playlist Vazia</p>
                    <p className="relative text-slate-400 text-sm">Adicione vídeos pela aba Buscar ou Internet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {playlist.map((video, index) => (
                      <div key={video.id} className="group relative bg-black/40 hover:bg-black/60 backdrop-blur-2xl border border-primary/20 hover:border-accent rounded-2xl p-5 transition-all duration-500 flex items-center gap-4 hover:shadow-[0_0_40px_rgba(138,43,226,0.4)] hover:scale-[1.02]">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
                        <div className="relative flex-shrink-0 w-12 sm:w-14 h-12 sm:h-14 bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl border border-primary/40 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg shadow-primary/20">
                          {index + 1}
                        </div>
                        {video.posterPath ? (
                          <img
                            src={getTMDBPosterUrl(video.posterPath)}
                            alt={video.title}
                            className="relative w-10 h-14 sm:w-12 sm:h-16 object-cover rounded-xl border-2 border-primary/30 shadow-lg group-hover:border-accent transition-colors duration-300"
                          />
                        ) : (
                          <div className="relative w-10 h-14 sm:w-12 sm:h-16 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-xl flex items-center justify-center">
                            <IconListDetails className="w-5 h-5 sm:w-6 sm:h-6 text-primary/50" />
                          </div>
                        )}
                        <div className="relative flex-1 min-w-0">
                          <p className="text-white font-bold text-sm sm:text-base truncate mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-accent transition-all duration-300">
                            {video.title}
                          </p>
                          <div className="flex items-center gap-2 text-xs flex-wrap">
                            <span className="px-2.5 py-1 bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-xl border border-primary/40 text-white rounded-lg text-xs font-bold uppercase shadow-sm">
                              {video.type}
                            </span>
                            {video.type === 'episode' && (
                              <span className="font-mono text-accent text-xs font-bold drop-shadow-[0_0_10px_rgba(0,255,255,0.6)]">
                                S{video.season}E{video.episode}
                              </span>
                            )}
                            {video.tmdb && (
                              <span className="font-mono text-slate-500 text-xs">#{video.tmdb}</span>
                            )}
                            {video.tags && video.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {video.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-secondary/20 border border-secondary/40 text-secondary rounded-lg text-xs font-semibold">
                                    {tag}
                                  </span>
                                ))}
                                {video.tags.length > 2 && (
                                  <span className="text-slate-500 text-xs">+{video.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Legendas */}
                          {(video.imdb || video.title) && (
                            <div className="mt-3 space-y-2">
                              <button
                                onClick={() => handleSearchSubtitles(video)}
                                disabled={subLoadingId === video.id}
                                className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-lg shadow-md flex items-center gap-2 hover:scale-105 transition-all duration-300"
                              >
                                <IconFileText className="w-4 h-4" />
                                {subLoadingId === video.id ? 'Buscando...' : 'Buscar Legenda (PT)'}
                              </button>
                              {subResults[video.id] && (
                                <div className="space-y-1">
                                  {subResults[video.id].map(sub => (
                                    <div key={sub.IDSubtitleFile} className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2 border border-primary/20">
                                      <span className="text-xs font-bold text-primary">{sub.LanguageName}</span>
                                      <span className="text-xs text-white">{sub.SubFileName}</span>
                                      <button
                                        onClick={() => handleDownloadSubtitle(sub)}
                                        className="px-2 py-1 bg-gradient-to-r from-primary to-accent text-white rounded shadow flex items-center gap-1 text-xs hover:scale-105"
                                      >
                                        <IconDownload className="w-4 h-4" />
                                        Baixar
                                      </button>
                                      <button
                                        onClick={() => handleGenerateFfmpeg(video, sub)}
                                        className="px-2 py-1 bg-gradient-to-r from-secondary to-primary text-white rounded shadow flex items-center gap-1 text-xs hover:scale-105"
                                      >
                                        <IconMovie className="w-4 h-4" />
                                        Incorporar Legenda ao Vídeo
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {subError && (
                                <div className="text-xs text-red-400 font-bold mt-2">{subError}</div>
                              )}
                              {ffmpegCmd && (
                                <div className="mt-2 p-2 bg-black/40 border border-primary/30 rounded-lg text-xs text-white">
                                  <span className="font-bold text-primary">Como incorporar legenda ao vídeo:</span>
                                  <pre className="whitespace-pre-wrap break-all text-accent mt-1">{ffmpegCmd}</pre>
                                  <button
                                    onClick={() => {navigator.clipboard.writeText(ffmpegCmd || ''); alert('Comando copiado!')}}
                                    className="mt-2 px-3 py-1 bg-gradient-to-r from-primary to-accent text-white rounded shadow text-xs"
                                  >Copiar instrução</button>
                                  <div className="text-slate-400 text-xs mt-2">Cole este comando no seu computador para gerar o vídeo com legenda embutida.</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="relative flex items-center gap-2">
                          <button
                            onClick={() => handleEditTags(video.id, video.tags)}
                            className="p-2.5 bg-gradient-to-br from-secondary/20 to-secondary/10 backdrop-blur-xl border border-secondary/40 text-white hover:from-secondary/30 hover:to-secondary/20 rounded-xl transition-all duration-300 shadow-lg shadow-secondary/20 hover:shadow-secondary/40 hover:scale-110"
                            title="Edit Tags"
                          >
                            <IconTags className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-[0_0_8px_rgba(255,0,255,0.6)]" />
                          </button>
                          <button
                            onClick={() => handleRemoveVideo(video.id)}
                            className="p-2.5 bg-gradient-to-br from-red-500/20 to-red-500/10 backdrop-blur-xl border border-red-500/40 text-red-300 hover:from-red-500/30 hover:to-red-500/20 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-110"
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
