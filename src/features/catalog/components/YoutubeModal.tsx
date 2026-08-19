import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, X, Check, AlertTriangle, Clipboard, Play } from 'lucide-react';
import { useSync } from '@features/sync/hooks/useSync';

// ─── Types ────────────────────────────────────────────────────────────────────
type YoutubeModalProps = { onClose: () => void };

type VideoData = {
  title: string;
  author_name: string;
  thumbnail_url: string;
  provider_name: string;
  url: string;
};

// ─── Injected styles (hover states + keyframes) ────────────────────────────
const STYLES = `
  @keyframes ytm-spin    { to { transform: rotate(360deg); } }
  @keyframes ytm-shimmer { 0%   { transform: translateX(-220%) skewX(-22deg); }
                           100% { transform: translateX(340%)  skewX(-22deg); } }
  @keyframes ytm-shake   {
    0%,100% { transform: translateX(0); }
    18%     { transform: translateX(-9px); }
    36%     { transform: translateX(8px); }
    54%     { transform: translateX(-5px); }
    72%     { transform: translateX(4px); }
  }
  @keyframes ytm-fade-up { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes ytm-skel    { 0%,100%{opacity:.3} 50%{opacity:.58} }
  @keyframes ytm-glow    {
    0%,100% { box-shadow: 0 0 0 1px rgba(255,255,255,.065), 0 48px 120px rgba(0,0,0,.97); }
    50%     { box-shadow: 0 0 0 1px rgba(229,89,29,.22),    0 48px 120px rgba(0,0,0,.97), 0 0 80px rgba(229,89,29,.08); }
  }
  @keyframes ytm-line-in { from { transform:scaleX(0); } to { transform:scaleX(1); } }
  @keyframes ytm-dot-in  { from { transform:scale(0) translateY(-50%); } to { transform:scale(1) translateY(-50%); } }
  @keyframes ytm-pulse   { 0%,100%{opacity:1} 50%{opacity:.6} }

  /* Input */
  .ytm-inp {
    width:100%; height:50px; box-sizing:border-box;
    padding: 0 44px 0 16px;
    background: rgba(255,255,255,.04);
    border: 1.5px solid rgba(255,255,255,.075);
    border-radius: 14px; color:#fff; font-size:14px;
    font-family:inherit; caret-color:#E5591D; outline:none;
    transition: border-color .3s, box-shadow .3s, background .3s;
  }
  .ytm-inp::placeholder { color:rgba(255,255,255,.22); }
  .ytm-inp:focus {
    border-color: rgba(229,89,29,.48);
    background: rgba(229,89,29,.04);
    box-shadow: 0 0 0 4px rgba(229,89,29,.08);
  }
  .ytm-inp.ok                  { border-color: rgba(34,197,94,.44); }
  .ytm-inp.ok:focus            { border-color: rgba(34,197,94,.6);  background: rgba(34,197,94,.03); box-shadow: 0 0 0 4px rgba(34,197,94,.07); }

  /* Load button */
  .ytm-btn-load {
    flex-shrink:0; height:50px; padding:0 22px;
    background: linear-gradient(145deg,#E5591D,#a33000);
    color:#fff; border:none; border-radius:14px;
    font-size:14px; font-weight:600; letter-spacing:-.2px;
    font-family:inherit; cursor:pointer; white-space:nowrap;
    transition: transform .2s, box-shadow .2s;
  }
  .ytm-btn-load:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 12px 32px rgba(229,89,29,.45); }
  .ytm-btn-load:active:not(:disabled){ transform:scale(.975); }
  .ytm-btn-load:disabled             { opacity:.55; cursor:not-allowed; }

  /* Paste button */
  .ytm-btn-paste {
    position:absolute; right:10px; top:50%; transform:translateY(-50%);
    background: rgba(255,255,255,.055); border: 1px solid rgba(255,255,255,.09);
    border-radius:8px; padding:5px 10px;
    font-size:11px; font-weight:500; color:rgba(255,255,255,.38);
    font-family:inherit; cursor:pointer;
    display:flex; align-items:center; gap:5px;
    transition: all .2s;
  }
  .ytm-btn-paste:hover { background:rgba(229,89,29,.12); color:rgba(255,255,255,.72); border-color:rgba(229,89,29,.3); }

  /* Close button */
  .ytm-btn-close {
    position:absolute; top:18px; right:18px; z-index:10;
    width:34px; height:34px; border-radius:50%;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.07);
    display:flex; align-items:center; justify-content:center;
    color:rgba(255,255,255,.45); cursor:pointer;
    transition: all .25s;
  }
  .ytm-btn-close:hover { background:rgba(229,89,29,.15); color:#F58253; transform:rotate(90deg); border-color:rgba(229,89,29,.35); }

  /* Sync button */
  .ytm-btn-sync {
    width:100%; height:54px; border:none; border-radius:14px;
    background: linear-gradient(140deg,#E5591D 0%,#a33000 100%);
    color:#fff; font-size:15px; font-weight:700; letter-spacing:-.4px;
    font-family:inherit; cursor:pointer; position:relative; overflow:hidden;
    display:flex; align-items:center; justify-content:center; gap:9px;
    transition: transform .25s, box-shadow .25s;
  }
  .ytm-btn-sync:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 20px 52px rgba(229,89,29,.52); }
  .ytm-btn-sync:active:not(:disabled){ transform:scale(.99); }
  .ytm-btn-sync:disabled             { opacity:.65; cursor:wait; }
  .ytm-btn-sync::after {
    content:''; position:absolute; top:-10px; bottom:-10px; left:0; width:55%;
    background: linear-gradient(105deg,transparent 20%,rgba(255,255,255,.13) 50%,transparent 80%);
    transform: translateX(-260%) skewX(-22deg);
  }
  .ytm-btn-sync:hover:not(:disabled)::after { animation:ytm-shimmer .65s ease forwards; }

  /* Thumbnail hover */
  .ytm-thumb img          { transition: transform .55s ease; display:block; }
  .ytm-thumb:hover img    { transform: scale(1.06); }
  .ytm-thumb .play-ring   { transition: opacity .3s, transform .3s; opacity:0; transform:scale(.78); }
  .ytm-thumb:hover .play-ring { opacity:1; transform:scale(1); }

  /* Utility */
  .ytm-shake  { animation: ytm-shake .42s ease; }
  .ytm-result { animation: ytm-fade-up .35s ease; }
  .ytm-skel   { animation: ytm-skel 1.4s ease infinite; }
  .ytm-modal  { animation: ytm-glow  5s   ease-in-out infinite; }
  .ytm-topbar { animation: ytm-line-in .6s cubic-bezier(.16,1,.3,1) forwards; transform-origin:center; }
  .ytm-valdot { animation: ytm-dot-in .25s cubic-bezier(.34,1.56,.64,1) forwards; }
`;

// ─── Spinner atom ─────────────────────────────────────────────────────────
const Spinner = ({ size = 16, thick = 2 }: { size?: number; thick?: number }) => (
  <span style={{
    width: size, height: size, flexShrink: 0,
    border: `${thick}px solid rgba(255,255,255,.28)`,
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'ytm-spin .75s linear infinite',
    display: 'inline-block',
  }} />
);

// ─── Component ────────────────────────────────────────────────────────────────
export default function YoutubeModal({ onClose }: YoutubeModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  const { syncContent, isSyncing } = useSync();
  const navigate = useNavigate();

  // ── Helpers ───────────────────────────────────────────────────────────────
  const extractId = (link: string) => {
    const m = link.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
    );
    return m ? m[1] : null;
  };

  const isValid = url.trim() !== '' && !!extractId(url);

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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handlePaste = async () => {
    try {
      if (!navigator.clipboard) return;
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch { /* clipboard denied — fail silently */ }
  };

  const handleLoad = async () => {
    setError('');
    setVideoData(null);
    setVideoId(null);

    if (!url.trim()) { setError('Insira uma URL do YouTube.'); return; }
    const id = extractId(url);
    if (!id) { setError('URL inválida. Cole um link do YouTube válido.'); return; }

    setIsLoading(true);
    try {
      const res  = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVideoData(data);
      setVideoId(id);
    } catch (err) {
      console.error('[YoutubeModal]', err);
      setError('Não foi possível carregar os dados deste vídeo.');
      setVideoId(id);
      setVideoData({
        title: 'Vídeo do YouTube', author_name: 'Desconhecido',
        thumbnail_url: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        provider_name: 'YouTube', url,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!videoId || !videoData) return;
    await syncContent({ tmdbId: videoId, type: 'youtube', title: videoData.title });
    onClose();
    navigate(`/watch/youtube/${videoId}`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}>

        {/* ── Backdrop ── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 38%, rgba(90,30,0,.38) 0%, rgba(0,0,0,.92) 68%)',
            backdropFilter: 'blur(18px)',
          }}
        />

        {/* ── Dialog ── */}
        <motion.div
          className="ytm-modal"
          initial={{ opacity: 0, scale: .92, y: 28 }}
          animate={{ opacity: 1, scale: 1,   y: 0  }}
          exit   ={{ opacity: 0, scale: .92, y: 28 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          style={{
            position: 'relative', width: '100%', maxWidth: 504,
            background: 'rgba(9,9,14,.97)',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 28, padding: 32, overflow: 'hidden',
            backdropFilter: 'blur(52px)',
          }}
        >

          {/* Orange accent top line */}
          <div className="ytm-topbar" style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg,transparent,rgba(245,130,83,.55) 22%,rgba(229,89,29,.95) 50%,rgba(245,130,83,.55) 78%,transparent)',
            borderRadius: '28px 28px 0 0',
          }} />

          {/* Ambient glow — top-right corner */}
          <div style={{
            position: 'absolute', top: -90, right: -90, width: 260, height: 260,
            background: 'radial-gradient(circle,rgba(229,89,29,.08) 0%,transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Ambient glow — bottom-left corner */}
          <div style={{
            position: 'absolute', bottom: -80, left: -80, width: 220, height: 220,
            background: 'radial-gradient(circle,rgba(245,130,83,.05) 0%,transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Close */}
          <button className="ytm-btn-close" onClick={onClose} aria-label="Fechar">
            <X size={16} />
          </button>

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 54, height: 54, borderRadius: 18, flexShrink: 0,
              background: 'linear-gradient(145deg,rgba(229,89,29,.14),rgba(163,48,0,.08))',
              border: '1px solid rgba(229,89,29,.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 28px rgba(229,89,29,.14), inset 0 1px 0 rgba(245,130,83,.1)',
            }}>
              <Youtube
                size={28}
                style={{ color: '#E5591D', filter: 'drop-shadow(0 0 9px rgba(229,89,29,.6))' }}
              />
            </div>
            <div>
              <h2 style={{
                margin: 0, fontSize: 20, fontWeight: 700,
                color: '#fff', letterSpacing: '-.6px',
                fontFamily: "'Syne', 'Inter', sans-serif",
              }}>
                Assistir YouTube
              </h2>
              <p style={{
                margin: '4px 0 0', fontSize: 13,
                color: 'rgba(245,130,83,.5)', letterSpacing: '-.1px',
              }}>
                Sincronize qualquer vídeo em tempo real
              </p>
            </div>
          </div>

          {/* ── URL Input row ───────────────────────────────────────────────── */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>

            {/* Input wrapper */}
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                className={`ytm-inp${isValid ? ' ok' : ''}`}
                type="text"
                placeholder="Cole o link do YouTube aqui..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isLoading && handleLoad()}
                autoComplete="off"
                spellCheck={false}
              />

              {/* Clipboard paste (only when empty) */}
              {!url && (
                <button className="ytm-btn-paste" onClick={handlePaste}>
                  <Clipboard size={11} />
                  Colar
                </button>
              )}

              {/* Validation dot (only when typing) */}
              {url && (
                <span className="ytm-valdot" style={{
                  position: 'absolute', right: 14, top: '50%',
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: isValid ? 'rgba(34,197,94,.85)'   : 'rgba(239,68,68,.75)',
                  boxShadow:  isValid ? '0 0 8px rgba(34,197,94,.7)' : '0 0 8px rgba(239,68,68,.5)',
                  transition: 'background .3s, box-shadow .3s',
                }} />
              )}
            </div>

            <button
              className="ytm-btn-load"
              onClick={handleLoad}
              disabled={isLoading}
            >
              {isLoading
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Spinner size={15} />
                    Buscando
                  </span>
                : 'Carregar'
              }
            </button>
          </div>

          {/* ── Error ──────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                exit   ={{ opacity: 0, height: 0, marginBottom: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div className="ytm-shake" style={{
                  background: 'rgba(239,68,68,.07)',
                  border: '1px solid rgba(239,68,68,.2)',
                  borderRadius: 14, padding: '11px 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <AlertTriangle size={16} style={{ color: 'rgba(239,68,68,.92)', flexShrink: 0 }} />
                  <span style={{ color: 'rgba(252,165,165,.9)', fontSize: 13, lineHeight: 1.5 }}>
                    {error}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Skeleton loader ─────────────────────────────────────────────── */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                key="skel"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(255,255,255,.025)',
                  border: '1px solid rgba(255,255,255,.05)',
                  borderRadius: 20, overflow: 'hidden',
                }}
              >
                {/* Thumb skeleton */}
                <div className="ytm-skel" style={{
                  height: 196, background: 'rgba(229,89,29,.04)',
                }} />
                {/* Text skeletons */}
                <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div className="ytm-skel" style={{ height: 17, background: 'rgba(255,255,255,.06)', borderRadius: 8, width: '74%' }} />
                  <div className="ytm-skel" style={{ height: 13, background: 'rgba(255,255,255,.04)', borderRadius: 6, width: '41%' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Video result ────────────────────────────────────────────────── */}
          {videoData && !isLoading && (
            <div
              className="ytm-result"
              style={{
                background: 'rgba(255,255,255,.028)',
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 20, overflow: 'hidden',
              }}
            >
              {/* Thumbnail */}
              <div
                className="ytm-thumb"
                style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', cursor: 'default' }}
              >
                <img
                  src={videoData.thumbnail_url}
                  alt={videoData.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Bottom gradient — orange tinted */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(0deg,rgba(0,0,0,.9) 0%,rgba(10,5,0,.15) 46%,transparent 100%)',
                }} />
                {/* Top vignette */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg,rgba(0,0,0,.28) 0%,transparent 28%)',
                }} />

                {/* Hover play ring */}
                <div className="play-ring" style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,.3)',
                }}>
                  <div style={{
                    width: 62, height: 62, borderRadius: '50%',
                    background: 'linear-gradient(145deg,#E5591D,#a33000)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 36px rgba(229,89,29,.55), 0 8px 24px rgba(0,0,0,.5)',
                  }}>
                    <Play size={22} fill="#fff" color="#fff" style={{ marginLeft: 3 }} />
                  </div>
                </div>

                {/* Title + channel badge */}
                <div style={{ position: 'absolute', bottom: 16, left: 18, right: 18 }}>
                  <h3 style={{
                    margin: '0 0 9px', fontSize: 17, fontWeight: 700,
                    color: '#fff', letterSpacing: '-.4px', lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    textShadow: '0 2px 14px rgba(0,0,0,.75)',
                  }}>
                    {videoData.title}
                  </h3>

                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: 'rgba(229,89,29,.15)',
                    border: '1px solid rgba(229,89,29,.3)',
                    borderRadius: 20, padding: '4px 10px',
                  }}>
                    <Youtube size={12} style={{ color: '#F58253' }} />
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,.82)' }}>
                      {videoData.author_name}
                    </span>
                  </span>
                </div>
              </div>

              {/* Sync action */}
              <div style={{ padding: 14 }}>
                <button
                  className="ytm-btn-sync"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  {isSyncing
                    ? <>
                        <Spinner size={18} thick={2.5} />
                        Sincronizando…
                      </>
                    : <>
                        <Check size={18} strokeWidth={2.5} />
                        Sincronizar no Player
                      </>
                  }
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </>
  );
}
