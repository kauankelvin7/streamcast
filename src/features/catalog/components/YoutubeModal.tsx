import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, X, Play, Share2, Clipboard } from 'lucide-react';
import { useSync } from '@features/sync/hooks/useSync';

interface YoutubeModalProps {
  onClose: () => void;
}

interface VideoData {
  title: string;
  author_name: string;
  thumbnail_url: string;
}

const STYLES = `
  @keyframes ytm-glow {
    0%,100% { box-shadow: 0 0 0 1px rgba(255,255,255,.065), 0 32px 80px rgba(0,0,0,.85); }
    50%     { box-shadow: 0 0 0 1px rgba(229,89,29,.22),    0 32px 80px rgba(0,0,0,.85), 0 0 60px rgba(229,89,29,.08); }
  }
  @keyframes ytm-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes ytm-fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ytm-modal {
    animation: ytm-glow 5s ease-in-out infinite;
  }
  .ytm-inp {
    width: 100%;
    padding: 14px 18px;
    background: rgba(255,255,255,0.035);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px;
    color: #fff;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }
  .ytm-inp:focus {
    border-color: rgba(229,89,29,0.5);
    background: rgba(229,89,29,0.03);
    box-shadow: 0 0 24px rgba(229,89,29,0.1);
  }
  .ytm-btn-action-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px 20px;
    border-radius: 14px;
    background: linear-gradient(135deg, #F58253, #E5591D);
    border: none;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 20px rgba(229,89,29,0.35);
    flex: 1;
  }
  .ytm-btn-action-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(229,89,29,0.5);
  }
  .ytm-btn-action-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 13px 18px;
    border-radius: 14px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    transition: all 0.2s ease;
    flex: 1;
  }
  .ytm-btn-action-secondary:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.2);
  }
  .ytm-btn-paste {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 8px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ytm-btn-paste:hover {
    background: rgba(255,255,255,0.12);
    color: #fff;
  }
`;

export default function YoutubeModal({ onClose }: YoutubeModalProps) {
  const [url, setUrl] = useState('');
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  const { syncContent, isSyncing } = useSync();
  const navigate = useNavigate();

  // Helper universal de extração de ID do YouTube (links curtos, longos, shorts, live, embed ou ID direto)
  const extractId = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Se já for um ID de 11 caracteres
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }

    // Match de URLs comuns do YouTube
    const match = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/i
    );

    return match ? match[1] : null;
  };

  // Atualiza ID e dados instantaneamente ao digitar ou colar
  useEffect(() => {
    const id = extractId(url);
    if (id) {
      setVideoId(id);
      setVideoData({
        title: 'Vídeo do YouTube',
        author_name: 'YouTube',
        thumbnail_url: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      });

      // Tenta obter o título real via oEmbed em segundo plano (sem bloquear)
      fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.title) {
            setVideoData({
              title: data.title,
              author_name: data.author_name || 'YouTube',
              thumbnail_url: data.thumbnail_url || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
            });
          }
        })
        .catch(() => {});
    } else {
      setVideoId(null);
      setVideoData(null);
    }
  }, [url]);

  // Fecha modal com Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePaste = async () => {
    try {
      if (!navigator.clipboard) return;
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text.trim());
    } catch { /* clipboard permission */ }
  };

  const handlePlayNow = () => {
    const id = videoId || extractId(url);
    if (!id) return;
    onClose();
    navigate(`/watch/youtube/${id}`);
  };

  const handleSync = async () => {
    const id = videoId || extractId(url);
    if (!id) return;
    await syncContent({
      tmdbId: id,
      type: 'youtube',
      title: videoData?.title || 'Vídeo do YouTube',
    });
    onClose();
    navigate(`/watch/youtube/${id}`);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 38%, rgba(90,30,0,.38) 0%, rgba(0,0,0,.92) 68%)',
            backdropFilter: 'blur(18px)',
          }}
        />

        {/* Modal Dialog */}
        <motion.div
          className="ytm-modal"
          initial={{ opacity: 0, scale: .94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: .94, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          style={{
            position: 'relative', width: '100%', maxWidth: 480,
            background: 'rgba(12, 12, 16, 0.98)',
            border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 24, padding: '28px', overflow: 'hidden',
            backdropFilter: 'blur(40px)',
          }}
        >
          {/* Top orange line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'linear-gradient(90deg, transparent, #F58253 30%, #E5591D 70%, transparent)',
          }} />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.06)', border: 'none',
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >
            <X size={16} />
          </button>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(145deg, rgba(229,89,29,0.2), rgba(163,48,0,0.1))',
              border: '1px solid rgba(229,89,29,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(229,89,29,0.2)',
            }}>
              <Youtube size={26} color="#E5591D" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Syne', sans-serif" }}>
                Tocar do YouTube
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                Cole qualquer link de vídeo, short, live ou playlist
              </p>
            </div>
          </div>

          {/* Input wrapper */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <input
              className="ytm-inp"
              type="text"
              placeholder="Cole o link ou ID do vídeo..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handlePlayNow();
                }
              }}
              autoFocus
              spellCheck={false}
            />
            {!url && (
              <button className="ytm-btn-paste" onClick={handlePaste}>
                <Clipboard size={12} />
                Colar
              </button>
            )}
          </div>

          {/* Video Preview (Instantâneo) */}
          <AnimatePresence>
            {videoId && videoData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginBottom: 20 }}
              >
                <div style={{
                  borderRadius: 16, overflow: 'hidden',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9', width: '100%', background: '#000' }}>
                    <img
                      src={videoData.thumbnail_url}
                      alt={videoData.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => {
                        e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/0.jpg`;
                      }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 60%)',
                    }} />
                    <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {videoData.title}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                        {videoData.author_name}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="ytm-btn-action-primary"
              onClick={handlePlayNow}
              disabled={!url.trim()}
              style={{ opacity: !url.trim() ? 0.5 : 1, cursor: !url.trim() ? 'not-allowed' : 'pointer' }}
            >
              <Play size={16} fill="#fff" />
              Assistir Agora
            </button>

            <button
              className="ytm-btn-action-secondary"
              onClick={handleSync}
              disabled={!url.trim() || isSyncing}
              style={{ opacity: !url.trim() ? 0.5 : 1, cursor: !url.trim() ? 'not-allowed' : 'pointer' }}
            >
              <Share2 size={15} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}
