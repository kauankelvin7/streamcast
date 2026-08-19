import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { tmdb } from '@lib/tmdb';
import { useSync } from '@features/sync/hooks/useSync';
import { X, ChevronLeft, ChevronRight, Play, Monitor, Clock } from 'lucide-react';

interface ContentInfo {
  tmdbId: number | string;
  type: 'movie' | 'tv' | 'anime' | 'youtube';
  title: string;
  poster: string | null;
  url?: string;
}

interface Props {
  content: ContentInfo;
  onClose: () => void;
}

interface Episode {
  episode_number: number;
  name: string;
  runtime: number | null;
  still_path: string | null;
  overview: string;
}

type Step = 'season' | 'episode' | 'confirm';

// ─── Injected styles ──────────────────────────────────────────────────────────
const SYNC_STYLES = `
  @keyframes sm-glow {
    0%,100% { box-shadow: 0 0 0 1px rgba(255,255,255,.065), 0 48px 100px rgba(0,0,0,.9); }
    50%     { box-shadow: 0 0 0 1px rgba(229,89,29,.2),    0 48px 100px rgba(0,0,0,.9), 0 0 60px rgba(229,89,29,.06); }
  }
  @keyframes sm-line-in {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes sm-shimmer {
    0%   { transform: translateX(-220%) skewX(-22deg); }
    100% { transform: translateX(340%)  skewX(-22deg); }
  }

  .sm-modal { animation: sm-glow 5s ease-in-out infinite; }
  .sm-topbar { animation: sm-line-in .6s cubic-bezier(.16,1,.3,1) forwards; transform-origin: center; }

  .sm-season-btn {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 18px; border-radius: 14;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    color: #fff; font-size: 14px; font-weight: 500; cursor: pointer;
    transition: all 0.25s; text-align: left;
    font-family: 'Inter', sans-serif;
  }
  .sm-season-btn:hover {
    border-color: rgba(229,89,29,0.4);
    background: rgba(229,89,29,0.06);
    box-shadow: 0 0 20px rgba(229,89,29,0.06);
  }

  .sm-episode-btn {
    display: flex; align-items: center; gap: 14;
    padding: 10px 12px; border-radius: 14;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    color: #fff; cursor: pointer;
    transition: all 0.25s; text-align: left;
    font-family: 'Inter', sans-serif;
  }
  .sm-episode-btn:hover {
    border-color: rgba(229,89,29,0.3);
    background: rgba(229,89,29,0.05);
    box-shadow: 0 0 18px rgba(229,89,29,0.05);
  }
  .sm-episode-btn:hover .ep-arrow { color: #E5591D !important; }

  .sm-back-btn {
    background: none; border: none; color: rgba(255,255,255,0.5);
    font-size: 13px; cursor: pointer; margin-bottom: 16; padding: 0;
    display: flex; align-items: center; gap: 6; font-weight: 500;
    font-family: 'Inter', sans-serif; transition: color 0.2s;
  }
  .sm-back-btn:hover { color: #E5591D; }

  .sm-close-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.5);
    width: 34px; height: 34px;
    border-radius: 50%;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.25s;
  }
  .sm-close-btn:hover {
    background: rgba(229,89,29,0.15);
    color: #F58253;
    transform: rotate(90deg);
    border-color: rgba(229,89,29,0.35);
  }

  .sm-sync-btn {
    width: 100%; padding: 14px 0; border-radius: 14;
    background: linear-gradient(140deg, #E5591D 0%, #a33000 100%);
    border: none; color: #fff; font-size: 14px; font-weight: 700;
    cursor: pointer; font-family: 'Inter', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 8;
    box-shadow: 0 8px 28px rgba(229,89,29,0.35);
    transition: all 0.25s;
    position: relative; overflow: hidden;
    letter-spacing: -0.2px;
  }
  .sm-sync-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 14px 40px rgba(229,89,29,0.5);
  }
  .sm-sync-btn:active:not(:disabled) { transform: scale(0.99); }
  .sm-sync-btn:disabled { opacity: 0.65; cursor: wait; }
  .sm-sync-btn::after {
    content: ''; position: absolute; top: -10px; bottom: -10px; left: 0; width: 55%;
    background: linear-gradient(105deg, transparent 20%, rgba(255,255,255,.12) 50%, transparent 80%);
    transform: translateX(-260%) skewX(-22deg);
  }
  .sm-sync-btn:hover:not(:disabled)::after { animation: sm-shimmer .65s ease forwards; }

  .sm-solo-btn {
    width: 100%; padding: 14px 0; border-radius: 14;
    background: transparent; border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.6); font-size: 14px; font-weight: 500;
    cursor: pointer; font-family: 'Inter', sans-serif;
    display: flex; align-items: center; justify-content: center; gap: 8;
    transition: all 0.25s;
  }
  .sm-solo-btn:hover {
    border-color: rgba(255,255,255,0.2);
    color: #fff;
    background: rgba(255,255,255,0.04);
  }

  .sm-cancel-btn {
    width: 100%; padding: 10px 0;
    background: none; border: none;
    color: rgba(255,255,255,0.3); font-size: 13px; cursor: pointer;
    font-family: 'Inter', sans-serif; transition: color 0.2s;
  }
  .sm-cancel-btn:hover { color: rgba(255,255,255,0.6); }

  .sm-change-btn {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.6); font-size: 11px; font-weight: 500;
    cursor: pointer; border-radius: 8; padding: 5px 12px; flex-shrink: 0;
    font-family: 'Inter', sans-serif; transition: all 0.2s;
  }
  .sm-change-btn:hover { border-color: #E5591D; color: #E5591D; }
`;

export default function SyncModal({ content, onClose }: Props) {
  const navigate = useNavigate();
  const { syncContent, isSyncing } = useSync();

  const [step, setStep] = useState<Step>(
    content.type === 'movie' ? 'confirm' : 'season'
  );
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

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

  const { data: tvDetails } = useQuery({
    queryKey: ['tv-details', content.tmdbId],
    queryFn: () => tmdb.getTVDetails(Number(content.tmdbId)),
    enabled: content.type !== 'movie',
  });

  const { data: seasonData, isLoading: loadingEps } = useQuery({
    queryKey: ['tv-season', content.tmdbId, selectedSeason],
    queryFn: () => tmdb.getTVSeason(Number(content.tmdbId), selectedSeason),
    enabled: content.type !== 'movie' && step === 'episode',
  });

  const totalSeasons = tvDetails?.number_of_seasons ?? 1;
  const episodes: Episode[] = seasonData?.episodes ?? [];

  async function handleSync() {
    const payload = {
      tmdbId: content.tmdbId,
      type: content.type,
      title: content.title,
      season: content.type !== 'movie' ? selectedSeason : undefined,
      episode:
        content.type !== 'movie' && selectedEpisode
          ? selectedEpisode.episode_number
          : undefined,
      url: content.url,
    };
    await syncContent(payload);
    navigate(`/watch/${content.type}/${content.tmdbId}`, {
      state: { season: payload.season, episode: payload.episode, synced: true },
    });
  }

  function handleSolo() {
    navigate(`/watch/${content.type}/${content.tmdbId}`, {
      state: {
        season: content.type !== 'movie' ? selectedSeason : undefined,
        episode: selectedEpisode?.episode_number,
        synced: false,
        url: content.url,
      },
    });
  }

  function formatRuntime(minutes: number | null): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  const STEPS: Step[] = ['season', 'episode', 'confirm'];
  const stepIndex = STEPS.indexOf(step);

  // ── Animation variants ──────────────────────────────────────────────────
  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -80 : 80, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goForward = (nextStep: Step) => { setDirection(1); setStep(nextStep); };
  const goBack = (prevStep: Step) => { setDirection(-1); setStep(prevStep); };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SYNC_STYLES }} />

      <div
        style={{
          position: 'fixed', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20,
        }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 38%, rgba(90,30,0,.3) 0%, rgba(0,0,0,.92) 68%)',
            backdropFilter: 'blur(16px)',
          }}
        />

        {/* Dialog */}
        <motion.div
          className="sm-modal"
          initial={{ opacity: 0, scale: .92, y: 28 }}
          animate={{ opacity: 1, scale: 1,   y: 0  }}
          exit   ={{ opacity: 0, scale: .92, y: 28 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            background: 'rgba(9,9,14,.97)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 28,
            width: '100%',
            maxWidth: content.type === 'movie' ? 440 : 540,
            maxHeight: '88vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(52px)',
            fontFamily: "'Inter', sans-serif",
          }}
        >

          {/* Top accent line */}
          <div className="sm-topbar" style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg,transparent,rgba(245,130,83,.55) 22%,rgba(229,89,29,.95) 50%,rgba(245,130,83,.55) 78%,transparent)',
            borderRadius: '28px 28px 0 0',
          }} />

          {/* Ambient glow */}
          <div style={{
            position: 'absolute', top: -90, right: -90, width: 240, height: 240,
            background: 'radial-gradient(circle,rgba(229,89,29,.07) 0%,transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* ── HEADER ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '24px 28px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            {content.poster && (
              <img
                src={content.poster} alt={content.title}
                style={{ 
                  width: 48, height: 72, borderRadius: 12, objectFit: 'cover', flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ 
                color: '#E5591D', fontSize: 11, marginBottom: 4, 
                textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 
              }}>
                {content.type === 'movie' ? 'Filme' : content.type === 'anime' ? 'Anime' : content.type === 'youtube' ? 'YouTube' : 'Série'}
              </p>
              <h2 style={{ 
                fontSize: 17, fontWeight: 600, color: '#fff', 
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                margin: 0, lineHeight: 1.3
              }}>
                {content.title}
              </h2>
              {content.type !== 'movie' && selectedEpisode && step === 'confirm' && (
                <p style={{ color: 'rgba(245,130,83,0.6)', fontSize: 12, marginTop: 4 }}>
                  T{selectedSeason} · E{selectedEpisode.episode_number} — {selectedEpisode.name}
                </p>
              )}
            </div>

            {/* Progress dots for series */}
            {content.type !== 'movie' && (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginRight: 8 }}>
                {STEPS.map((s, i) => (
                  <div key={s} style={{
                    width: i === stepIndex ? 18 : 7, height: 7, borderRadius: 4,
                    background: step === s ? '#E5591D' : (stepIndex > i ? 'rgba(229,89,29,0.3)' : 'rgba(255,255,255,0.08)'),
                    transition: 'all 0.35s cubic-bezier(.34,1.56,.64,1)',
                    boxShadow: step === s ? '0 0 10px rgba(229,89,29,0.5)' : 'none',
                  }} />
                ))}
              </div>
            )}

            <button className="sm-close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>

          {/* ── SCROLLABLE BODY ── */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
            <AnimatePresence mode="wait" custom={direction}>

              {/* STEP 1 — Season */}
              {step === 'season' && (
                <motion.div
                  key="season"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ padding: '20px 28px 28px' }}
                >
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 16, fontWeight: 500 }}>
                    Escolha a temporada:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                      <button
                        key={s}
                        className="sm-season-btn"
                        onClick={() => { setSelectedSeason(s); setSelectedEpisode(null); goForward('episode'); }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: 'rgba(229,89,29,0.08)', border: '1px solid rgba(229,89,29,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: '#E5591D',
                          }}>
                            {s}
                          </span>
                          Temporada {s}
                        </span>
                        <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.25)' }} />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2 — Episodes */}
              {step === 'episode' && (
                <motion.div
                  key="episode"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ padding: '20px 28px 28px' }}
                >
                  <button className="sm-back-btn" onClick={() => goBack('season')}>
                    <ChevronLeft size={14} />
                    Temporada {selectedSeason}
                  </button>

                  {loadingEps ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="skeleton-shimmer" style={{ height: 72, borderRadius: 14 }} />
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {episodes.map((ep) => (
                        <button
                          key={ep.episode_number}
                          className="sm-episode-btn"
                          onClick={() => { setSelectedEpisode(ep); goForward('confirm'); }}
                        >
                          {ep.still_path ? (
                            <img
                              src={`https://image.tmdb.org/t/p/w185${ep.still_path}`}
                              alt={ep.name}
                              style={{ 
                                width: 100, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0, 
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.06)',
                              }}
                            />
                          ) : (
                            <div style={{ 
                              width: 100, height: 56, borderRadius: 10, 
                              background: 'rgba(229,89,29,0.04)', flexShrink: 0, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              border: '1px solid rgba(229,89,29,0.08)',
                            }}>
                              <Play size={18} style={{ color: 'rgba(229,89,29,0.25)' }} />
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{
                                background: 'rgba(229,89,29,0.1)', border: '1px solid rgba(229,89,29,0.2)',
                                borderRadius: 6, padding: '2px 8px',
                                color: '#E5591D', fontSize: 11, fontWeight: 700,
                              }}>
                                E{ep.episode_number}
                              </span>
                              {ep.runtime && (
                                <span style={{ 
                                  display: 'flex', alignItems: 'center', gap: 3,
                                  color: 'rgba(255,255,255,0.35)', fontSize: 11, 
                                  background: 'rgba(255,255,255,0.04)', 
                                  padding: '2px 8px', borderRadius: 6,
                                }}>
                                  <Clock size={10} />
                                  {formatRuntime(ep.runtime)}
                                </span>
                              )}
                            </div>
                            <p style={{ 
                              fontSize: 13, fontWeight: 500, color: '#fff', 
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              margin: 0,
                            }}>
                              {ep.name}
                            </p>
                            {ep.overview && (
                              <p style={{
                                fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}>
                                {ep.overview}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="ep-arrow" size={16} style={{ color: 'rgba(255,255,255,0.15)', flexShrink: 0, transition: 'color 0.2s' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 3 — Confirm */}
              {step === 'confirm' && (
                <motion.div
                  key="confirm"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter" animate="center" exit="exit"
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  style={{ padding: '20px 28px 28px' }}
                >
                  {content.type !== 'movie' && selectedEpisode && (
                    <div style={{
                      background: 'rgba(229,89,29,0.04)', border: '1px solid rgba(229,89,29,0.12)',
                      borderRadius: 16, padding: 14, marginBottom: 24,
                      display: 'flex', gap: 14, alignItems: 'center',
                    }}>
                      {selectedEpisode.still_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${selectedEpisode.still_path}`}
                          alt={selectedEpisode.name}
                          style={{ width: 88, height: 50, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{ 
                          width: 88, height: 50, borderRadius: 10, 
                          background: 'rgba(229,89,29,0.06)', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Play size={16} style={{ color: 'rgba(229,89,29,0.3)' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'rgba(245,130,83,0.6)', fontSize: 11, marginBottom: 3, fontWeight: 500 }}>
                          T{selectedSeason} · E{selectedEpisode.episode_number}
                          {selectedEpisode.runtime ? ` · ${formatRuntime(selectedEpisode.runtime)}` : ''}
                        </p>
                        <p style={{ 
                          fontSize: 13, fontWeight: 500, color: '#fff', 
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          margin: 0,
                        }}>
                          {selectedEpisode.name}
                        </p>
                      </div>
                      <button className="sm-change-btn" onClick={() => goBack('episode')}>
                        Trocar
                      </button>
                    </div>
                  )}

                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 6, lineHeight: 1.6 }}>
                    Sincronizar <strong style={{ color: '#fff' }}>{content.title}</strong> com todos os players conectados?
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginBottom: 28, lineHeight: 1.6 }}>
                    Inclui todos os dispositivos neste sistema e todos os sites com o player embedado.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Sync Button */}
                    <button className="sm-sync-btn" onClick={handleSync} disabled={isSyncing}>
                      <Monitor size={16} />
                      {isSyncing ? 'Sincronizando...' : 'Sincronizar e assistir'}
                    </button>

                    {/* Solo Button */}
                    <button className="sm-solo-btn" onClick={handleSolo}>
                      <Play size={16} />
                      Assistir sem sincronizar
                    </button>

                    {/* Cancel */}
                    <button className="sm-cancel-btn" onClick={onClose}>
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </>
  );
}
