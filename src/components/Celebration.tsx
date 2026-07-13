import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Crown, Flame, Trophy } from 'lucide-react';

/** Evento di celebrazione emesso dopo una risposta corretta.
 *  Ogni evento ha un `id` crescente: cambiando la key React rimonta il layer
 *  e le animazioni ripartono da capo. */
export type CelebrationEvent = {
  id: number;
  points: number;
  streak: number;
  /** Nome breve della regione appena sbloccata per la prima volta. */
  captured?: string;
  /** Nome breve della regione che ha raggiunto la padronanza massima. */
  mastered?: string;
  /** Soglia di combo raggiunta (3, 5, 10, ...), se presente. */
  milestone?: number;
};

const CONFETTI_COLORS = ['#1f9d61', '#f0b54e', '#12455f', '#2bb978', '#e7c15a', '#c2392a'];

type Particle = {
  dx: number;
  dy: number;
  rot: number;
  color: string;
  duration: number;
  delay: number;
  size: number;
};

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const distance = 70 + Math.random() * 230;
    return {
      dx: Math.cos(angle) * distance,
      // Sbilanciato verso il basso per dare l'effetto "esplode e ricade".
      dy: Math.sin(angle) * distance * 0.6 + 120 + Math.random() * 160,
      rot: (Math.random() - 0.5) * 720,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: 750 + Math.random() * 650,
      delay: Math.random() * 120,
      size: 6 + Math.random() * 6,
    };
  });
}

export function Celebration({ event }: { event: CelebrationEvent }) {
  // Piu ricca la vittoria (combo alte, conquiste), piu coriandoli.
  const count = useMemo(() => {
    let base = 26;
    if (event.milestone) base += 22;
    if (event.captured) base += 20;
    if (event.mastered) base += 26;
    base += Math.min(event.streak, 12) * 2;
    return Math.min(base, 90);
  }, [event]);

  const particles = useMemo(() => buildParticles(count), [count]);

  const toast = event.mastered
    ? { icon: <Trophy size={20} />, text: `${event.mastered} padroneggiata!`, tone: 'mastered' as const }
    : event.captured
      ? { icon: <Crown size={20} />, text: `${event.captured} conquistata!`, tone: 'captured' as const }
      : event.milestone
        ? { icon: <Flame size={20} />, text: `Combo x${event.milestone}! In fiamme`, tone: 'combo' as const }
        : null;

  return (
    <div className="celebration-layer" aria-hidden="true">
      <div className="confetti-origin">
        {particles.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={
              {
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
                '--rot': `${p.rot}deg`,
                '--dur': `${p.duration}ms`,
                '--delay': `${p.delay}ms`,
                width: `${p.size}px`,
                height: `${p.size * 0.62}px`,
                background: p.color,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {event.points > 0 ? <div className="floating-points">+{event.points}</div> : null}

      {toast ? (
        <div className={`celebration-toast tone-${toast.tone}`}>
          {toast.icon}
          <span>{toast.text}</span>
        </div>
      ) : null}
    </div>
  );
}
