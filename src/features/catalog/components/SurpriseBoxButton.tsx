import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
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

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#F58253', '#E5591D', '#FFD700', '#FF6B9D', '#7B68EE',
  '#00E5FF', '#76FF03', '#FFAB40', '#E040FB',
];

function Confetti({ count = 65 }: { count?: number }) {
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      startX: 50 + (Math.random() - 0.5) * 15,
      startY: 50 + (Math.random() - 0.5) * 10,
      delay: Math.random() * 0.2,
      duration: 1.4 + Math.random() * 0.9,
      size: 4 + Math.random() * 5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 720 - 360,
      angle: Math.random() * Math.PI * 2,
      distance: 140 + Math.random() * 320,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    })),
    [count]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: 9999999,
    }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.startX}%`,
            top: `${p.startY}%`,
            opacity: 1,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            left: `calc(${p.startX}% + ${Math.cos(p.angle) * p.distance}px)`,
            top: `calc(${p.startY}% + ${Math.sin(p.angle) * p.distance}px)`,
            opacity: [1, 1, 0],
            scale: [0, 1.25, 0.4],
            rotate: p.rotation,
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: EASE_OUT }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.shape === 'rect' ? p.size * 1.6 : p.size,
            borderRadius: p.shape === 'circle' ? '50%' : 2,
            background: p.color,
            boxShadow: `0 0 6px ${p.color}44`,
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
    50% { transform: translateY(-3px); }
  }
  @keyframes sb-glow-ring {
    0%, 100% { box-shadow: 0 0 0 0 rgba(229,89,29,0), 0 4px 16px rgba(229,89,29,0.18); }
    50% { box-shadow: 0 0 0 4px rgba(229,89,29,0.12), 0 4px 22px rgba(229,89,29,0.32); }
  }
  @keyframes sb-ribbon-shine {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes sb-pulse-border {
    0%, 100% { border-color: rgba(229,89,29,0.35); }
    50% { border-color: rgba(255,215,0,0.6); }
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

  .sb-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 999px;
    background: linear-gradient(150deg, rgba(229,89,29,0.22), rgba(140,40,0,0.14));
    border: 1px solid rgba(229,89,29,0.35);
    color: #FFD700;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    letter-spacing: 0.01em;
    cursor: pointer;
    user-select: none;
    transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s cubic-bezier(0.22,1,0.36,1), background 0.25s ease, color 0.25s ease, border-color 0.25s ease;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    white-space: nowrap;
    animation: sb-glow-ring 3.2s ease-in-out infinite, sb-pulse-border 3.2s ease-in-out infinite;
    overflow: hidden;
    z-index: 1;
  }
  .sb-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.12) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: sb-ribbon-shine 3.4s linear infinite;
    border-radius: 999px;
    pointer-events: none;
  }
  .sb-btn:hover {
    background: linear-gradient(150deg, rgba(229,89,29,0.38), rgba(163,48,0,0.26));
    box-shadow: 0 0 28px rgba(229,89,29,0.45), 0 0 10px rgba(255,215,0,0.22);
    transform: translateY(-2px) scale(1.02);
    color: #fff;
    border-color: rgba(255,215,0,0.7);
  }
  .sb-btn:active { transform: translateY(0) scale(0.97); }

  .sb-icon-wrap {
    animation: sb-idle-float 2.8s ease-in-out infinite;
    display: flex;
    align-items: center;
  }

  /* ── 3D box ── */
  .sb-scene {
    perspective: 900px;
    width: 130px;
    height: 130px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sb-cube {
    position: relative;
    width: 74px;
    height: 74px;
    transform-style: preserve-3d;
    animation: sb-cube-spin 5s ease-in-out infinite;
  }
  .sb-cube.sb-cube-shaking { animation: none; }
  .sb-face {
    position: absolute;
    width: 74px;
    height: 74px;
    background: linear-gradient(150deg, #7a2c0e 0%, #a33000 45%, #E5591D 100%);
    border: 1px solid rgba(255,215,0,0.28);
    box-shadow: inset 0 0 24px rgba(0,0,0,0.35);
  }
  .sb-face-front  { transform: translateZ(37px); }
  .sb-face-back   { transform: rotateY(180deg) translateZ(37px); filter: brightness(0.72); }
  .sb-face-right  { transform: rotateY(90deg) translateZ(37px); filter: brightness(0.85); }
  .sb-face-left   { transform: rotateY(-90deg) translateZ(37px); filter: brightness(0.6); }
  .sb-face-bottom { transform: rotateX(-90deg) translateZ(37px); filter: brightness(0.5); }
  .sb-ribbon-v {
    position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 11px; background: linear-gradient(180deg, #FFE55C, #FFD700 40%, #C9A400);
    box-shadow: 0 0 10px rgba(255,215,0,0.35);
  }
  .sb-ribbon-h {
    position: absolute; left: 0; right: 0; top: 50%; transform: translateY(-50%);
    height: 11px; background: linear-gradient(90deg, #FFE55C, #FFD700 40%, #C9A400);
    box-shadow: 0 0 10px rgba(255,215,0,0.35);
  }

  /* ── Modal custom scrollbar ── */
  .sb-modal-body::-webkit-scrollbar { width: 4px; }
  .sb-modal-body::-webkit-scrollbar-track { background: transparent; }
  .sb-modal-body::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1);
    border-radius: 4px;
  }
  .sb-modal-body::-webkit-scrollbar-thumb:hover {
    background: rgba(229,89,29,0.4);
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function SurpriseBoxButton({ allMovies, onSelect }: SurpriseBoxProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'exploding' | 'revealed'>('idle');
  const [chosenMovie, setChosenMovie] = useState<any>(null);
  const [moodInfo, setMoodInfo] = useState<{ dayMood: MoodConfig; timePeriod: string } | null>(null);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const timeoutRef2 = useRef<ReturnType<typeof setTimeout>>();
  
  // Track already-seen movie IDs so the same movie never repeats in the same session
  const seenIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (timeoutRef2.current) clearTimeout(timeoutRef2.current);
    };
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Sorteio inteligente e variado sem repetição
  const pickMovie = useCallback(async (): Promise<{ movie: any; dayMood: MoodConfig; timePeriod: string }> => {
    const dayOfWeek = new Date().getDay();
    const dayMood = DAY_MOODS[dayOfWeek];
    const timePeriod = getTimeOfDay();
    const today = new Date();
    const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    let pool = (allMovies || []).filter((m: any) => m && m.id && m.poster_path);

    // Fallback: se allMovies ainda estiver vazio, busca do TMDB diretamente
    if (pool.length === 0) {
      try {
        const fallbackRes = await tmdb.getTrending('movie', 'week');
        if (fallbackRes?.results?.length) {
          pool = fallbackRes.results.filter((m: any) => m && m.poster_path);
        }
      } catch (err) {
        console.error('TMDB fallback error:', err);
      }
    }

    // Filtra para remover filmes já vistos na sessão
    let available = pool.filter((m: any) => !seenIdsRef.current.has(m.id));

    // Se todos os filmes do catálogo já foram vistos nesta sessão, reinicia o histórico
    if (available.length === 0) {
      const currentId = chosenMovie?.id;
      seenIdsRef.current.clear();
      if (currentId) seenIdsRef.current.add(currentId);
      available = pool.filter((m: any) => !seenIdsRef.current.has(m.id));
      if (available.length === 0) available = pool;
    }

    // Calcula pontuação de adequação por humor/horário/temporada
    const scored = available
      .map((movie: any) => {
        let score = 0;
        const genres = movie.genre_ids || [];

        genres.forEach((g: number) => {
          if (dayMood.genreIds.includes(g)) score += 35;
        });

        score += Math.min(movie.popularity || 0, 100) / 10;
        score += (movie.vote_average || 0) * 3;

        if (timePeriod === 'morning' && genres.includes(10751)) score += 15;
        if (timePeriod === 'afternoon' && genres.includes(35)) score += 15;
        if (timePeriod === 'evening' && (genres.includes(28) || genres.includes(53))) score += 15;
        if (timePeriod === 'latenight' && (genres.includes(27) || genres.includes(9648))) score += 20;

        const season = getSeason();
        if (season === 'winter' && (genres.includes(10749) || genres.includes(18))) score += 10;
        if (season === 'summer' && (genres.includes(12) || genres.includes(28))) score += 10;

        const movieSeed = (dateSeed + movie.id + Math.floor(Math.random() * 50)) % 100;
        score += movieSeed * 0.4;

        return { movie, score };
      })
      .sort((a: any, b: any) => b.score - a.score);

    // Pega entre os melhores candidatos com sorteio ponderado
    const topCandidates = scored.slice(0, Math.min(10, scored.length));
    let pickedMovie = topCandidates[0]?.movie || pool[0];

    if (topCandidates.length > 1) {
      const totalScore = topCandidates.reduce((sum: number, c: any) => sum + Math.max(c.score, 1), 0);
      let random = Math.random() * totalScore;
      for (const candidate of topCandidates) {
        random -= Math.max(candidate.score, 1);
        if (random <= 0) {
          pickedMovie = candidate.movie;
          break;
        }
      }
    }

    // Registra como visto nesta sessão para nunca repetir
    if (pickedMovie?.id) {
      seenIdsRef.current.add(pickedMovie.id);
    }

    return { movie: pickedMovie, dayMood, timePeriod };
  }, [allMovies, chosenMovie?.id]);

  const executeSpin = useCallback(async () => {
    setIsOverviewExpanded(false);
    setPhase('shaking');
    setIsShaking(true);

    const resultPromise = pickMovie();

    timeoutRef.current = setTimeout(async () => {
      setIsShaking(false);
      setPhase('exploding');

      const result = await resultPromise;
      setChosenMovie(result.movie);
      setMoodInfo({ dayMood: result.dayMood, timePeriod: result.timePeriod });

      timeoutRef2.current = setTimeout(() => {
        setPhase('revealed');
      }, 550);
    }, 750);
  }, [pickMovie]);

  const handleClick = useCallback(() => {
    setIsOpen(true);
    executeSpin();
  }, [executeSpin]);

  const handleTryAnother = useCallback(() => {
    executeSpin();
  }, [executeSpin]);

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
    setIsOverviewExpanded(false);
  }, [chosenMovie, onSelect]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPhase('idle');
    setChosenMovie(null);
    setMoodInfo(null);
    setIsOverviewExpanded(false);
  }, []);

  // Fechar com tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, handleClose]);

  const backdropUrl = chosenMovie?.backdrop_path
    ? tmdb.getImageUrl(chosenMovie.backdrop_path, 'w1280')
    : null;
  const posterUrl = chosenMovie?.poster_path
    ? tmdb.getImageUrl(chosenMovie.poster_path, 'w500')
    : (chosenMovie?.backdrop_path ? tmdb.getImageUrl(chosenMovie.backdrop_path, 'w780') : null);
  const timeInfo = moodInfo ? TIME_LABELS[moodInfo.timePeriod] : null;
  const year = (chosenMovie?.release_date || chosenMovie?.first_air_date || '').slice(0, 4);
  const rating = chosenMovie?.vote_average ? Number(chosenMovie.vote_average).toFixed(1) : null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SURPRISE_STYLES }} />

      {/* ── BOTÃO CAIXA MISTERIOSA ── */}
      <button
        type="button"
        className="sb-btn"
        onClick={handleClick}
        title="Caixa Misteriosa — O destino escolhe seu filme!"
      >
        <span className="sb-icon-wrap"><Gift size={16} /></span>
        Caixa Misteriosa
        <span style={{
          position: 'absolute', top: 3, right: 12,
          fontSize: 8, opacity: 0.7,
          animation: 'sb-sparkle 2s ease-in-out infinite',
        }}>✨</span>
      </button>

      {/* ── MODAL EM PORTAL DIRETAMENTE NO BODY ── */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <div
              key="surprise-box-modal-root"
              style={{
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2147483647,
                padding: '24px 20px',
              }}
              onClick={handleClose}
            >
              {/* Backdrop com desfoque cinematográfico escuro */}
              <motion.div
                key="surprise-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(4, 4, 7, 0.92)',
                  backdropFilter: 'blur(32px)',
                  WebkitBackdropFilter: 'blur(32px)',
                }}
              />

              {/* Confetes na explosão / revelação */}
              {(phase === 'exploding' || phase === 'revealed') && <Confetti count={65} />}

              {/* ─── Janela do Modal (Larga, Elegante e Fluida) ─── */}
              <motion.div
                key="surprise-dialog"
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'relative',
                  width: '100%',
                  maxWidth: 680,
                  maxHeight: 'min(92vh, 650px)',
                  borderRadius: 24,
                  overflow: 'hidden',
                  background: '#0c0c11',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px rgba(229,89,29,0.08)',
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 1,
                }}
              >
                {/* Linha de acento superior com degradê suave */}
                <div style={{
                  height: 2, flexShrink: 0,
                  background: 'linear-gradient(90deg, transparent 5%, rgba(229,89,29,0.8) 30%, rgba(255,215,0,0.7) 50%, rgba(229,89,29,0.8) 70%, transparent 95%)',
                }} />

                {/* Botão Fechar no canto superior */}
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Fechar"
                  style={{
                    position: 'absolute', top: 14, right: 14, zIndex: 60,
                    background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.6)',
                    width: 36, height: 36, borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(229,89,29,0.25)';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.transform = 'rotate(90deg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                    e.currentTarget.style.transform = 'rotate(0)';
                  }}
                >
                  <X size={16} />
                </button>

                {/* Conteúdo com rolagem suave se a tela for muito baixa */}
                <div
                  className="sb-modal-body"
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {/* ── FASE 1: CAIXA GIRANDO / SORTEANDO ── */}
                    {phase === 'shaking' && (
                      <motion.div
                        key="shaking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.15 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          padding: '64px 32px 76px',
                          textAlign: 'center', minHeight: 320,
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
                            transition={{ duration: 0.75, ease: EASE_OUT }}
                          >
                            <div className="sb-face sb-face-front"><div className="sb-ribbon-v" /><div className="sb-ribbon-h" /></div>
                            <div className="sb-face sb-face-back" />
                            <div className="sb-face sb-face-right"><div className="sb-ribbon-v" /></div>
                            <div className="sb-face sb-face-left"><div className="sb-ribbon-v" /></div>
                            <div className="sb-face sb-face-bottom" />
                            <div style={{
                              position: 'absolute', width: 74, height: 74,
                              transform: 'translateY(-37px) rotateX(90deg)',
                              transformStyle: 'preserve-3d',
                            }}>
                              <motion.div
                                style={{
                                  width: '100%', height: '100%',
                                  background: 'linear-gradient(150deg, #FFE55C, #FFD700 55%, #C9A400)',
                                  border: '1px solid rgba(255,255,255,0.35)',
                                  boxShadow: 'inset 0 0 18px rgba(0,0,0,0.15)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <Sparkles size={16} style={{ color: 'rgba(120,60,0,0.55)' }} />
                              </motion.div>
                            </div>
                          </motion.div>
                        </div>
                        <motion.p
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                          style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500, marginTop: 8 }}
                        >
                          Sorteando seu filme especial...
                        </motion.p>
                      </motion.div>
                    )}

                    {/* ── FASE 2: EXPLOSÃO DE LUZ ── */}
                    {phase === 'exploding' && (
                      <motion.div
                        key="exploding"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: EASE_OUT }}
                        style={{
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center',
                          padding: '80px 32px',
                          textAlign: 'center', minHeight: 320,
                        }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.8, 0], rotate: [0, 180] }}
                          transition={{ duration: 0.45, ease: EASE_OUT }}
                          style={{
                            width: 68, height: 68, borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(255,235,150,0.6) 0%, rgba(229,89,29,0.55) 50%, transparent 72%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Sparkles size={30} style={{ color: '#FFD700' }} />
                        </motion.div>
                      </motion.div>
                    )}

                    {/* ── FASE 3: FILME REVELADO (DESIGN HARMONIOSO SEM CORTES) ── */}
                    {phase === 'revealed' && chosenMovie && moodInfo && (
                      <motion.div
                        key="revealed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ position: 'relative' }}
                      >
                        {/* Banner de fundo cinematográfico sutil */}
                        {backdropUrl && (
                          <div style={{
                            position: 'relative',
                            height: 140,
                            overflow: 'hidden',
                            width: '100%',
                          }}>
                            <motion.img
                              initial={{ scale: 1.08, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.6, ease: EASE_SILK }}
                              src={backdropUrl}
                              alt=""
                              style={{
                                position: 'absolute', inset: 0,
                                width: '100%', height: '100%',
                                objectFit: 'cover',
                                filter: 'brightness(0.38) saturate(1.2)',
                              }}
                            />
                            {/* Gradiente vertical para mesclar com o conteúdo */}
                            <div style={{
                              position: 'absolute', inset: 0,
                              background: 'linear-gradient(180deg, rgba(12,12,17,0.2) 0%, rgba(12,12,17,0.85) 75%, #0c0c11 100%)',
                            }} />
                          </div>
                        )}

                        {/* Conteúdo com Grid Harmônico: Poster vertical à esquerda, infos à direita */}
                        <div style={{
                          padding: '0 28px 26px',
                          marginTop: backdropUrl ? -70 : 20,
                          position: 'relative',
                          zIndex: 2,
                        }}>
                          {/* Bloco Superior: Poster + Detalhes do Filme */}
                          <div style={{
                            display: 'flex',
                            gap: 22,
                            alignItems: 'flex-start',
                            marginBottom: 20,
                          }}>
                            {/* Capa Vertical com proporção perfeita 2:3 */}
                            {posterUrl && (
                              <motion.div
                                initial={{ opacity: 0, y: 14, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.08, duration: 0.4, ease: EASE_SILK }}
                                style={{
                                  flexShrink: 0,
                                  width: 125,
                                  height: 185,
                                  borderRadius: 14,
                                  overflow: 'hidden',
                                  border: '2px solid rgba(255,255,255,0.14)',
                                  boxShadow: '0 16px 36px rgba(0,0,0,0.7), 0 0 20px rgba(229,89,29,0.1)',
                                  background: '#15151e',
                                }}
                              >
                                <img
                                  src={posterUrl}
                                  alt={chosenMovie.title ?? chosenMovie.name}
                                  loading="eager"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                  }}
                                />
                              </motion.div>
                            )}

                            {/* Informações Principais */}
                            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                              {/* Selo do Destino */}
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.12, duration: 0.3 }}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 6,
                                  padding: '4px 11px', borderRadius: 999,
                                  background: 'rgba(229,89,29,0.18)',
                                  border: '1px solid rgba(229,89,29,0.35)',
                                  color: '#F58253', fontSize: 11, fontWeight: 700,
                                  letterSpacing: '0.04em', textTransform: 'uppercase',
                                  marginBottom: 8,
                                }}
                              >
                                <Sparkles size={11} />
                                O destino escolheu para você
                              </motion.div>

                              {/* Título */}
                              <motion.h2
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.18, duration: 0.35 }}
                                style={{
                                  fontSize: 21,
                                  fontWeight: 800,
                                  color: '#fff',
                                  lineHeight: 1.25,
                                  margin: '0 0 10px',
                                  letterSpacing: '-0.015em',
                                }}
                              >
                                {chosenMovie.title ?? chosenMovie.name}
                              </motion.h2>

                              {/* Badges de Nota e Ano */}
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.25, duration: 0.3 }}
                                style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}
                              >
                                {rating && (
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '4px 10px', borderRadius: 8,
                                    background: 'rgba(255,215,0,0.1)',
                                    border: '1px solid rgba(255,215,0,0.2)',
                                    color: '#FFD700', fontSize: 13, fontWeight: 700,
                                  }}>
                                    <Star size={12} fill="#FFD700" color="#FFD700" />
                                    {rating}
                                  </span>
                                )}
                                {year && (
                                  <span style={{
                                    padding: '4px 10px', borderRadius: 8,
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.09)',
                                    color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600,
                                  }}>
                                    {year}
                                  </span>
                                )}
                              </motion.div>

                              {/* Cartão de Humor & Inspiração do Dia */}
                              <motion.div
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.3 }}
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  border: '1px solid rgba(255,255,255,0.07)',
                                  borderRadius: 12,
                                  padding: '10px 14px',
                                }}
                              >
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: 7,
                                  flexWrap: 'wrap', marginBottom: 3,
                                }}>
                                  <span style={{ fontSize: 13 }}>{moodInfo.dayMood.emoji}</span>
                                  <span style={{
                                    color: '#F58253', fontSize: 11.5, fontWeight: 700,
                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                  }}>
                                    {moodInfo.dayMood.label}
                                  </span>
                                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                                  <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11.5, fontWeight: 500 }}>
                                    {timeInfo?.emoji} {timeInfo?.label}
                                  </span>
                                  <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                                  <span style={{ fontSize: 11 }}>{getSeasonEmoji()}</span>
                                </div>
                                <p style={{
                                  color: 'rgba(255,255,255,0.4)', fontSize: 12,
                                  lineHeight: 1.4, margin: 0, fontStyle: 'italic',
                                }}>
                                  "{moodInfo.dayMood.phrase}"
                                </p>
                              </motion.div>
                            </div>
                          </div>

                          {/* Sinopse do Filme com "Ler mais" expansível */}
                          {chosenMovie.overview && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.34, duration: 0.3 }}
                              style={{ margin: '0 0 20px' }}
                            >
                              <p style={{
                                fontSize: 13.5,
                                color: 'rgba(255,255,255,0.58)',
                                lineHeight: 1.6,
                                margin: 0,
                                display: isOverviewExpanded ? 'block' : '-webkit-box',
                                WebkitLineClamp: isOverviewExpanded ? undefined : 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                transition: 'all 0.25s ease',
                              }}>
                                {chosenMovie.overview}
                              </p>

                              {chosenMovie.overview.length > 150 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOverviewExpanded(!isOverviewExpanded);
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '4px 0 0',
                                    color: '#F58253',
                                    fontSize: 12.5,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    transition: 'color 0.2s',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = '#FFD700'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = '#F58253'; }}
                                >
                                  {isOverviewExpanded ? 'Ler menos' : 'Ler mais...'}
                                </button>
                              )}
                            </motion.div>
                          )}

                          {/* Botões de Ação lado a lado */}
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.38, duration: 0.35 }}
                            style={{ display: 'flex', gap: 12 }}
                          >
                            {/* Botão Assistir */}
                            <button
                              type="button"
                              onClick={handleWatch}
                              style={{
                                flex: 1.2, padding: '13px 0', borderRadius: 12,
                                background: 'linear-gradient(135deg, #E5591D, #c44a10)',
                                border: 'none', color: '#fff', fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: '0 6px 22px rgba(229,89,29,0.35)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(229,89,29,0.5)';
                                e.currentTarget.style.filter = 'brightness(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 6px 22px rgba(229,89,29,0.35)';
                                e.currentTarget.style.filter = 'brightness(1)';
                              }}
                            >
                              <Play size={15} fill="#fff" />
                              Assistir / Sincronizar
                            </button>

                            {/* Botão Tentar Outro */}
                            <button
                              type="button"
                              onClick={handleTryAnother}
                              style={{
                                flex: 0.8, padding: '13px 0', borderRadius: 12,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.12)',
                                color: 'rgba(255,255,255,0.75)', fontSize: 13.5, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255,215,0,0.4)';
                                e.currentTarget.style.background = 'rgba(255,215,0,0.06)';
                                e.currentTarget.style.color = '#FFD700';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
                              }}
                            >
                              <Dice5 size={15} />
                              Outro Destino
                            </button>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}