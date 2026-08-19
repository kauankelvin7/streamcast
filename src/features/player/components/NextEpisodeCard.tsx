import { useEffect, useState } from 'react';

interface Props {
  onCancel: () => void;
}

interface CardState {
  next: { season: number; episode: number };
  totalCountdown: number;
}

export default function NextEpisodeCard({ onCancel }: Props) {
  const [card, setCard]           = useState<CardState | null>(null);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const showHandler = (e: Event) => {
      const { next, countdown } = (e as CustomEvent).detail;
      setCard({ next, totalCountdown: countdown });
      setRemaining(countdown);
    };
    const tickHandler = (e: Event) => {
      const val = (e as CustomEvent).detail;
      if (val === null) { setCard(null); return; }
      setRemaining(val as number);
    };

    window.addEventListener('showNextEpisodeCard', showHandler);
    window.addEventListener('nextEpisodeCountdown', tickHandler);
    return () => {
      window.removeEventListener('showNextEpisodeCard', showHandler);
      window.removeEventListener('nextEpisodeCountdown', tickHandler);
    };
  }, []);

  if (!card) return null;

  const progress = (remaining / card.totalCountdown) * 100;

  return (
    <div style={{
      position: 'absolute', bottom: 80, right: 24,
      background: '#1A1A1A', border: '1px solid #2A2A2A',
      borderRadius: 12, padding: 16, width: 260,
      zIndex: 100,
    }}>
      {/* Fechar */}
      <button
        onClick={onCancel}
        style={{
          position: 'absolute', top: 8, right: 10,
          background: 'none', border: 'none',
          color: '#666', fontSize: 18, cursor: 'pointer', lineHeight: 1,
        }}
      >×</button>

      <p style={{ fontSize: 11, color: '#B3B3B3', marginBottom: 4 }}>A seguir</p>
      <p style={{ fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 12 }}>
        T{card.next.season} · Episódio {card.next.episode}
      </p>

      {/* Barra de progresso do countdown */}
      <div style={{
        height: 3, background: '#2A2A2A',
        borderRadius: 2, marginBottom: 14, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', background: '#00A8E1',
          width: `${progress}%`,
          transition: 'width 1s linear',
          borderRadius: 2,
        }} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 6,
            background: 'transparent', border: '1px solid #2A2A2A',
            color: '#B3B3B3', fontSize: 13, cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('nextEpisodeCountdown', { detail: 0 }))}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 6,
            background: '#00A8E1', border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Assistir agora
        </button>
      </div>
    </div>
  );
}
