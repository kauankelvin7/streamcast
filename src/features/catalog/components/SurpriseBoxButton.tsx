import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { tmdb } from '@lib/tmdb';
import { Gift, Play, Star, Sparkles, X, Dice5 } from 'lucide-react';
import type { SelectedContent } from './CatalogPanel';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SurpriseBoxProps {
  allMovies: any[];
  onSelect: (item: SelectedContent) => void;
}

interface MoodConfig {
  label: string;
  emoji: string;
  phrase: string;
  genreIds: number[];
}

// ─── Mood Logic ───────────────────────────────────────────────────────────────
const DAY_MOODS: Record<number, MoodConfig> = {
  0: { label: 'Domingo em Família', emoji: '🏠', phrase: 'Domingo pede aconchego e diversão!', genreIds: [10751, 16, 35] },
  1: { label: 'Motivação de Segunda', emoji: '💪', phrase: 'Comece a semana com inspiração!', genreIds: [18, 36, 12] },
  2: { label: 'Terça de Mistério', emoji: '🔍', phrase: 'Uma noite perfeita para desvendar mistérios...', genreIds: [9648, 53, 80] },
  3: { label: 'Quarta Sci-Fi', emoji: '🚀', phrase: 'Meio de semana, hora de viajar para outros mundos!', genreIds: [878, 14, 12] },
  4: { label: 'Quinta Cultural', emoji: '🎭', phrase: 'Cultura e emoção para sua quinta-feira!', genreIds: [18, 36, 10402] },
  5: { label: 'Sexta de Ação', emoji: '🔥', phrase: 'Sexta à noite pede adrenalina pura!', genreIds: [28, 12, 53] },
  6: { label: 'Sábado Épico', emoji: '⚔️', phrase: 'Sábado é dia de aventura épica!', genreIds: [28, 14, 878] },
};

const TIME_LABELS: Record<string, { label: string; emoji: string }> = {
  morning: { label: 'Sessão Matinê', emoji: '☀️' },
  afternoon: { label: 'Sessão da Tarde', emoji: '🌤️' },
  evening: { label: 'Sessão da Noite', emoji: '🌙' },
  latenight: { label: 'Madrugada Cinéfila', emoji: '🌌' },
};

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  if (h >= 18 && h < 24) return 'evening';
  return 'latenight';
}

function getSeason(): string {
  const month = new Date().getMonth();
  // Southern hemisphere (Brazil)
  if (month >= 2 && month <= 4) return 'autumn';
  if (month >= 5 && month <= 7) return 'winter';
  if (month >= 8 && month <= 10) return 'spring';
  return 'summer';
}

function getSeasonEmoji(): string {
  const s = getSeason();
  if (s === 'winter') return '❄️';
  if (s === 'summer') return '☀️';
  if (s === 'autumn') return '🍂';
  return '🌸';
}

// ─── Easing ───────────────────────────────────────────────────────────────────
const EASE_SILK = [0.22, 1, 0.36, 1] as const;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// ─── Confetti Particle ────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#F58253', '#E5591D', '#FFD700', '#FF6B9D', '#7B68EE',
  '#00E5FF', '#76FF03', '#FFAB40', '#E040FB',
];

function Confetti({ count = 44 }: { count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.35,
      duration: 1.3 + Math.random() * 1.5,
      size: 4 + Math.random() * 7,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 720 - 360,
      xDrift: (Math.random() - 0.5) * 220,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    })),
    [count]);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 100 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: '55%', x: `${p.x}%`, opacity: 1, scale: 0, rotate: 0 }}
          animate={{
            y: '-125%',
            x: `calc(${p.x}% + ${p.xDrift}px)`,
            opacity: [1, 1, 0],
            scale: [0, 1.15, 0.55],
            rotate: p.rotation,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: EASE_OUT }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.shape === 'rect' ? p.size * 1.5 : p.size,
            borderRadius: p.shape === 'circle' ? '50%' : 2,
            background: p.color,
            boxShadow: `0 0 6px ${p.color}66`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Light rays behind the box ─────────────────────────────────────────────────
function LightBurst({ active }: { active: boolean }) {
  const rays = useMemo(() => Array.from({ length: 10 }, (_, i) => i * 36), []);
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      {rays.map((deg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scaleY: 0.3 }}
          animate={active ? { opacity: [0, 0.5, 0], scaleY: [0.3, 1, 1.3] } : { opacity: 0 }}
          transition={{ duration: 1.1, delay: i * 0.02, ease: EASE_OUT }}
          style={{
            position: 'absolute',
            width: 3,
            height: 170,
            borderRadius: 3,
            background: 'linear-gradient(180deg, rgba(255,215,0,0.55), transparent 75%)',
            transform: `rotate(${deg}deg) translateY(-72px)`,
            transformOrigin: 'center 72px',
            filter: 'blur(0.5px)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const SURPRISE_STYLES = `
  @keyframes sb-idle-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  @keyframes sb-glow-ring {
    0%, 100% { box-shadow: 0 0 0 0 rgba(229,89,29,0), 0 4px 16px rgba(229,89,29,0.18); }
    50% { box-shadow: 0 0 0 5px rgba(229,89,29,0.10), 0 4px 22px rgba(229,89,29,0.32); }
  }
  @keyframes sb-ribbon-shine {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes sb-pulse-border {
    0%, 100% { border-color: rgba(229,89,29,0.32); }
    50% { border-color: rgba(255,215,0,0.55); }
  }
  @keyframes sb-sparkle {
    0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
    50% { opacity: 1; transform: scale(1) rotate(180deg); }
  }
  @keyframes sb-cube-spin {
    0% { transform: rotateX(-16deg) rotateY(-28deg); }
    50% { transform: rotateX(-16deg) rotateY(28deg); }
    100% { transform: rotateX(-16deg) rotateY(-28deg); }
  }
  @keyframes sb-reveal-poster {
    0% { transform: scale(0.6) rotateY(60deg) rotateX(6deg); opacity: 0; filter: blur(8px); }
    60% { transform: scale(1.04) rotateY(-6deg) rotateX(-2deg); opacity: 1; filter: blur(0px); }
    100% { transform: scale(1) rotateY(0deg) rotateX(0deg); opacity: 1; filter: blur(0px); }
  }

  .sb-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 999px;
    background: linear-gradient(150deg, rgba(229,89,29,0.20), rgba(140,40,0,0.12));
    border: 1px solid rgba(229,89,29,0.32);
    color: #FFD700;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.01em;
    cursor: pointer;
    transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s cubic-bezier(0.22,1,0.36,1), background 0.35s ease, color 0.3s ease, border-color 0.3s ease;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    white-space: nowrap;
    animation: sb-glow-ring 3.2s ease-in-out infinite, sb-pulse-border 3.2s ease-in-out infinite;
    overflow: hidden;
  }
  .sb-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.10) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: sb-ribbon-shine 3.4s linear infinite;
    border-radius: 999px;
    pointer-events: none;
  }
  .sb-btn:hover {
    background: linear-gradient(150deg, rgba(229,89,29,0.34), rgba(163,48,0,0.22));
    box-shadow: 0 0 30px rgba(229,89,29,0.4), 0 0 10px rgba(255,215,0,0.18);
    transform: translateY(-2px) scale(1.025);
    color: #fff;
    border-color: rgba(255,215,0,0.55);
  }
  .sb-btn:active { transform: translateY(0) scale(0.97); }

  .sb-icon-wrap {
    animation: sb-idle-float 2.8s ease-in-out infinite;
    display: flex;
    align-items: center;
  }

  .sb-reveal-poster {
    animation: sb-reveal-poster 0.85s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  /* ── 3D box ── */
  .sb-scene {
    perspective: 900px;
    width: 160px;
    height: 160px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sb-cube {
    position: relative;
    width: 96px;
    height: 96px;
    transform-style: preserve-3d;
    animation: sb-cube-spin 5s ease-in-out infinite;
  }
  .sb-cube.sb-cube-shaking {
    animation: none;
  }
  .sb-face {
    position: absolute;
    width: 96px;
    height: 96px;
    background: linear-gradient(150deg, #7a2c0e 0%, #a33000 45%, #E5591D 100%);
    border: 1px solid rgba(255,215,0,0.28);
    box-shadow: inset 0 0 24px rgba(0,0,0,0.35);
  }
  .sb-face-front  { transform: translateZ(48px); }
  .sb-face-back   { transform: rotateY(180deg) translateZ(48px); filter: brightness(0.72); }
  .sb-face-right  { transform: rotateY(90deg) translateZ(48px); filter: brightness(0.85); }
  .sb-face-left   { transform: rotateY(-90deg) translateZ(48px); filter: brightness(0.6); }
  .sb-face-bottom { transform: rotateX(-90deg) translateZ(48px); filter: brightness(0.5); }
  .sb-ribbon-v {
    position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 14px; background: linear-gradient(180deg, #FFE55C, #FFD700 40%, #C9A400);
    box-shadow: 0 0 10px rgba(255,215,0,0.35);
  }
  .sb-ribbon-h {
    position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%);
    height: 14px; background: linear-gradient(90deg, #FFE55C, #FFD700 40%, #C9A400);
    box-shadow: 0 0 10px rgba(255,215,0,0.35);
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function SurpriseBoxButton({ allMovies, onSelect }: SurpriseBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'exploding' | 'revealed'>('idle');
  const [chosenMovie, setChosenMovie] = useState<any>(null);
  const [moodInfo, setMoodInfo] = useState<{ dayMood: MoodConfig; timePeriod: string } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Smart movie selection
  const pickMovie = useCallback(() => {
    const dayOfWeek = new Date().getDay();
    const dayMood = DAY_MOODS[dayOfWeek];
    const timePeriod = getTimeOfDay();
    const today = new Date();

    // Use date as seed for "Film of the Day" consistency within the same day
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    // Score each movie based on mood match
    const scored = allMovies
      .filter((m: any) => m.poster_path && m.vote_average > 0)
      .map((movie: any) => {
        let score = 0;
        const genres = movie.genre_ids || [];

        // Genre match with day mood
        genres.forEach((g: number) => {
          if (dayMood.genreIds.includes(g)) score += 30;
        });

        // Popularity bonus
        score += Math.min(movie.popularity || 0, 100) / 10;

        // Rating bonus
        score += (movie.vote_average || 0) * 3;

        // Time-of-day tweaks
        if (timePeriod === 'morning' && genres.includes(10751)) score += 15;
        if (timePeriod === 'afternoon' && genres.includes(35)) score += 15;
        if (timePeriod === 'evening' && (genres.includes(28) || genres.includes(53))) score += 15;
        if (timePeriod === 'latenight' && (genres.includes(27) || genres.includes(9648))) score += 20;

        // Season tweaks
        const season = getSeason();
        if (season === 'winter' && (genres.includes(10749) || genres.includes(18))) score += 10;
        if (season === 'summer' && (genres.includes(12) || genres.includes(28))) score += 10;

        // Use date seed to add deterministic pseudo-random variety
        const movieSeed = (dateSeed + movie.id) % 100;
        score += movieSeed * 0.3;

        return { movie, score };
      })
      .sort((a: any, b: any) => b.score - a.score);

    // Pick from top 8 candidates with weighted randomness
    const topCandidates = scored.slice(0, Math.min(8, scored.length));
    if (topCandidates.length === 0) return { movie: allMovies[0], dayMood, timePeriod };

    // Weighted random selection
    const totalScore = topCandidates.reduce((sum: number, c: any) => sum + c.score, 0);
    let random = Math.random() * totalScore;
    let picked = topCandidates[0];
    for (const candidate of topCandidates) {
      random -= candidate.score;
      if (random <= 0) { picked = candidate; break; }
    }

    return { movie: picked.movie, dayMood, timePeriod };
  }, [allMovies]);

  const handleClick = useCallback(() => {
    if (allMovies.length === 0) return;

    setIsOpen(true);
    setPhase('shaking');
    setIsShaking(true);

    // Shake phase
    timeoutRef.current = setTimeout(() => {
      setIsShaking(false);
      setPhase('exploding');

      const result = pickMovie();
      setChosenMovie(result.movie);
      setMoodInfo({ dayMood: result.dayMood, timePeriod: result.timePeriod });

      // Reveal after explosion
      timeoutRef.current = setTimeout(() => {
        setPhase('revealed');
      }, 650);
    }, 900);
  }, [allMovies, pickMovie]);

  const handleTryAnother = useCallback(() => {
    setPhase('shaking');
    setIsShaking(true);

    timeoutRef.current = setTimeout(() => {
      setIsShaking(false);
      setPhase('exploding');

      const result = pickMovie();
      setChosenMovie(result.movie);
      setMoodInfo({ dayMood: result.dayMood, timePeriod: result.timePeriod });

      timeoutRef.current = setTimeout(() => {
        setPhase('revealed');
      }, 650);
    }, 900);
  }, [pickMovie]);

  const handleWatch = useCallback(() => {
    if (!chosenMovie) return;
    const poster = chosenMovie.poster_path
      ? tmdb.getImageUrl(chosenMovie.poster_path, 'w500')
      : (chosenMovie.backdrop_path ? tmdb.getImageUrl(chosenMovie.backdrop_path, 'w780') : null);

    onSelect({
      tmdbId: chosenMovie.id,
      type: 'movie',
      title: chosenMovie.title ?? chosenMovie.name ?? 'Sem título',
      poster,
    });
    setIsOpen(false);
    setPhase('idle');
  }, [chosenMovie, onSelect]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPhase('idle');
    setChosenMovie(null);
    setMoodInfo(null);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleClose]);

  const backdropUrl = chosenMovie?.backdrop_path
    ? tmdb.getImageUrl(chosenMovie.backdrop_path, 'original')
    : null;

  const posterUrl = chosenMovie?.poster_path
    ? tmdb.getImageUrl(chosenMovie.poster_path, 'w500')
    : null;

  const timeInfo = moodInfo ? TIME_LABELS[moodInfo.timePeriod] : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SURPRISE_STYLES }} />

      {/* ── THE BUTTON ── */}
      <button
        className="sb-btn"
        onClick={handleClick}
        title="Caixa Misteriosa — O destino escolhe seu filme!"
      >
        <span className="sb-icon-wrap">
          <Gift size={16} />
        </span>
        Caixa Misteriosa
        <span style={{
          position: 'absolute', top: 3, right: 12,
          fontSize: 8, opacity: 0.7,
          animation: 'sb-sparkle 2s ease-in-out infinite',
        }}>✨</span>
      </button>

      {/* ── THE MODAL ── */}
      <AnimatePresence>
        {isOpen && (
          <div
            style={{
              position: 'fixed', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: 20,
            }}
            onClick={handleClose}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_SILK }}
              style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 50% 30%, rgba(90,30,0,.32) 0%, rgba(0,0,0,.94) 68%)',
                backdropFilter: 'blur(20px)',
              }}
            />

            {/* Confetti + light burst on exploding/revealed */}
            {(phase === 'exploding' || phase === 'revealed') && (
              <>
                <LightBurst active={phase === 'exploding'} />
                <Confetti count={54} />
              </>
            )}

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.82, y: 36 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: 'spring', damping: 22, stiffness: 240 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                background: 'rgba(9,9,14,.97)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 28,
                width: '100%',
                maxWidth: 520,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'blur(52px)',
                fontFamily: "'Inter', sans-serif",
                boxShadow: '0 48px 110px rgba(0,0,0,.9), 0 0 70px rgba(229,89,29,.09)',
              }}
            >
              {/* Top accent line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, transparent, rgba(255,215,0,.6) 22%, rgba(229,89,29,.95) 50%, rgba(255,215,0,.6) 78%, transparent)',
                borderRadius: '28px 28px 0 0',
                zIndex: 20,
              }} />

              {/* Close button */}
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute', top: 16, right: 16, zIndex: 50,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.5)',
                  width: 34, height: 34,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(229,89,29,0.15)';
                  e.currentTarget.style.color = '#F58253';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                <X size={16} />
              </button>

              {/* ── SHAKING PHASE (true CSS 3D gift box) ── */}
              <AnimatePresence mode="wait">
                {phase === 'shaking' && (
                  <motion.div
                    key="shaking"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.25 }}
                    transition={{ duration: 0.3, ease: EASE_SILK }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '64px 40px 76px',
                      textAlign: 'center',
                    }}
                  >
                    <div className="sb-scene">
                      <motion.div
                        className={`sb-cube${isShaking ? ' sb-cube-shaking' : ''}`}
                        animate={isShaking ? {
                          rotateZ: [0, -10, 10, -8, 8, -4, 4, 0],
                          rotateX: [-16, -22, -10, -20, -12, -16],
                          rotateY: [-28, -40, -16, -34, -20, -28],
                          y: [0, -6, 2, -5, 1, 0],
                        } : {}}
                        transition={{ duration: 0.9, ease: EASE_OUT }}
                      >
                        <div className="sb-face sb-face-front"><div className="sb-ribbon-v" /><div className="sb-ribbon-h" /></div>
                        <div className="sb-face sb-face-back" />
                        <div className="sb-face sb-face-right"><div className="sb-ribbon-v" /></div>
                        <div className="sb-face sb-face-left"><div className="sb-ribbon-v" /></div>
                        <div className="sb-face sb-face-bottom" />

                        {/* Lid — a hinged plane at the top, opens on its own local origin */}
                        <div style={{
                          position: 'absolute', width: 96, height: 96,
                          transform: 'translateY(-48px) rotateX(90deg)',
                          transformStyle: 'preserve-3d',
                        }}>
                          <motion.div
                            animate={{ rotateX: 0 }}
                            style={{
                              width: '100%', height: '100%',
                              transformOrigin: '50% 0%',
                              transformStyle: 'preserve-3d',
                              background: 'linear-gradient(150deg, #FFE55C, #FFD700 55%, #C9A400)',
                              border: '1px solid rgba(255,255,255,0.35)',
                              boxShadow: 'inset 0 0 18px rgba(0,0,0,0.15), 0 6px 20px rgba(0,0,0,0.3)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <Sparkles size={20} style={{ color: 'rgba(120,60,0,0.55)' }} />
                          </motion.div>
                        </div>
                      </motion.div>
                    </div>

                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15, duration: 0.4 }}
                      style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: 500, marginTop: 4 }}
                    >
                      Preparando sua surpresa...
                    </motion.p>
                  </motion.div>
                )}

                {/* ── EXPLODING PHASE ── */}
                {phase === 'exploding' && (
                  <motion.div
                    key="exploding"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '80px 40px',
                      textAlign: 'center',
                    }}
                  >
                    <motion.div
                      animate={{ scale: [1, 1.6, 0], rotate: [0, 200] }}
                      transition={{ duration: 0.55, ease: EASE_OUT }}
                      style={{
                        width: 84, height: 84,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,235,150,0.55) 0%, rgba(229,89,29,0.6) 50%, transparent 72%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Sparkles size={36} style={{ color: '#FFD700' }} />
                    </motion.div>
                  </motion.div>
                )}

                {/* ── REVEALED PHASE ── */}
                {phase === 'revealed' && chosenMovie && moodInfo && (
                  <motion.div
                    key="revealed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE_SILK }}
                    style={{ display: 'flex', flexDirection: 'column' }}
                  >
                    {/* Backdrop Image */}
                    <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                      {backdropUrl && (
                        <motion.img
                          initial={{ scale: 1.15, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.9, ease: EASE_SILK }}
                          src={backdropUrl}
                          alt=""
                          style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover',
                            filter: 'brightness(0.5) saturate(1.15)',
                          }}
                        />
                      )}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(0deg, rgba(9,9,14,1) 0%, rgba(9,9,14,0.5) 50%, rgba(9,9,14,0.3) 100%)',
                      }} />

                      {/* Mood badge */}
                      <motion.div
                        initial={{ y: -18, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.28, duration: 0.4, ease: EASE_SILK }}
                        style={{
                          position: 'absolute', top: 20, left: 24,
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 999,
                          background: 'rgba(0,0,0,0.6)',
                          border: '1px solid rgba(255,215,0,0.3)',
                          color: '#FFD700', fontSize: 11, fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        <Gift size={12} />
                        Caixa Misteriosa
                      </motion.div>

                      {/* Poster floating over transition, gentle 3D tilt on hover */}
                      {posterUrl && (
                        <div style={{ position: 'absolute', bottom: -40, left: 24, zIndex: 10, perspective: 600 }}>
                          <div
                            className="sb-reveal-poster"
                            style={{
                              width: 110,
                              height: 165,
                              borderRadius: 16,
                              overflow: 'hidden',
                              border: '2px solid rgba(255,255,255,0.12)',
                              boxShadow: '0 18px 50px rgba(0,0,0,0.7), 0 0 22px rgba(229,89,29,0.16)',
                              transformStyle: 'preserve-3d',
                              transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'rotateY(-10deg) rotateX(4deg) scale(1.03)';
                              e.currentTarget.style.boxShadow = '0 24px 60px rgba(0,0,0,0.75), 0 0 30px rgba(229,89,29,0.28)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'rotateY(0deg) rotateX(0deg) scale(1)';
                              e.currentTarget.style.boxShadow = '0 18px 50px rgba(0,0,0,0.7), 0 0 22px rgba(229,89,29,0.16)';
                            }}
                          >
                            <img
                              src={posterUrl}
                              alt={chosenMovie.title ?? chosenMovie.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '52px 28px 28px' }}>
                      {/* Destiny phrase */}
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.18, duration: 0.4, ease: EASE_SILK }}
                        style={{
                          color: '#FFD700',
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          marginBottom: 6,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <Sparkles size={13} />
                        O destino escolheu para você
                      </motion.p>

                      {/* Movie title */}
                      <motion.h2
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.45, ease: EASE_SILK }}
                        style={{
                          fontFamily: "'Syne', sans-serif",
                          fontSize: 26,
                          fontWeight: 800,
                          color: '#fff',
                          lineHeight: 1.15,
                          margin: '0 0 12px',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {chosenMovie.title ?? chosenMovie.name}
                      </motion.h2>

                      {/* Movie meta */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}
                      >
                        {chosenMovie.vote_average > 0 && (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 8,
                            background: 'rgba(0,0,0,0.4)',
                            border: '1px solid rgba(255,215,0,0.2)',
                            color: '#FFD700', fontSize: 12, fontWeight: 700,
                          }}>
                            <Star size={11} fill="#FFD700" color="#FFD700" />
                            {Number(chosenMovie.vote_average).toFixed(1)}
                          </span>
                        )}
                        {(chosenMovie.release_date || chosenMovie.first_air_date) && (
                          <span style={{
                            padding: '4px 10px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500,
                          }}>
                            {(chosenMovie.release_date || chosenMovie.first_air_date || '').slice(0, 4)}
                          </span>
                        )}
                      </motion.div>

                      {/* Mood reason */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.48, duration: 0.4, ease: EASE_SILK }}
                        style={{
                          background: 'linear-gradient(135deg, rgba(229,89,29,0.07), rgba(255,215,0,0.045))',
                          border: '1px solid rgba(229,89,29,0.16)',
                          borderRadius: 16,
                          padding: '14px 18px',
                          marginBottom: 20,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 16 }}>{moodInfo.dayMood.emoji}</span>
                          <span style={{ color: '#F58253', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {moodInfo.dayMood.label}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>•</span>
                          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500 }}>
                            {timeInfo?.emoji} {timeInfo?.label}
                          </span>
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>•</span>
                          <span style={{ fontSize: 12 }}>{getSeasonEmoji()}</span>
                        </div>
                        <p style={{
                          color: 'rgba(255,255,255,0.55)',
                          fontSize: 13,
                          lineHeight: 1.5,
                          margin: 0,
                          fontStyle: 'italic',
                        }}>
                          "{moodInfo.dayMood.phrase}"
                        </p>
                      </motion.div>

                      {/* Overview */}
                      {chosenMovie.overview && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.54, duration: 0.4 }}
                          style={{
                            fontSize: 13,
                            color: 'rgba(255,255,255,0.5)',
                            lineHeight: 1.65,
                            margin: '0 0 24px',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {chosenMovie.overview}
                        </motion.p>
                      )}

                      {/* Action buttons */}
                      <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.62, duration: 0.45, ease: EASE_SILK }}
                        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                      >
                        {/* Watch / Sync */}
                        <button
                          onClick={handleWatch}
                          style={{
                            width: '100%', padding: '14px 0', borderRadius: 14,
                            background: 'linear-gradient(140deg, #E5591D 0%, #a33000 100%)',
                            border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            boxShadow: '0 8px 28px rgba(229,89,29,0.35)',
                            transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 14px 42px rgba(229,89,29,0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 28px rgba(229,89,29,0.35)';
                          }}
                        >
                          <Play size={16} fill="#fff" />
                          Assistir / Sincronizar
                        </button>

                        {/* Try another */}
                        <button
                          onClick={handleTryAnother}
                          style={{
                            width: '100%', padding: '14px 0', borderRadius: 14,
                            background: 'transparent',
                            border: '1px solid rgba(255,215,0,0.2)',
                            color: '#FFD700', fontSize: 14, fontWeight: 600,
                            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,215,0,0.5)';
                            e.currentTarget.style.background = 'rgba(255,215,0,0.05)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,215,0,0.2)';
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <Dice5 size={16} />
                          Tentar Outro Destino
                        </button>

                        {/* Cancel */}
                        <button
                          onClick={handleClose}
                          style={{
                            width: '100%', padding: '10px 0',
                            background: 'none', border: 'none',
                            color: 'rgba(255,255,255,0.3)', fontSize: 13,
                            cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                            transition: 'color 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
                        >
                          Fechar
                        </button>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}