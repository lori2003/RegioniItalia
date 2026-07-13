import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Church,
  Columns,
  Landmark,
  MapPin,
  Palette,
  Route,
  Signpost,
  TreePine,
  X,
} from 'lucide-react';
import {
  ROMA_CATEGORY_COLORS,
  ROMA_CATEGORY_LABELS,
  ROMA_MONUMENTS,
  ROMA_RIVERS,
  ROMA_STREETS,
  ROMA_VIEWBOX,
  ROMA_WALLS,
  ROMA_ZONES,
} from '../data/roma';
import type { RomaCategory, RomaMonument } from '../data/roma';

type Selection = { type: 'monument'; id: string } | { type: 'zone'; id: string } | null;

const CATEGORY_ICON: Record<RomaCategory, typeof Landmark> = {
  antico: Columns,
  religioso: Church,
  piazza: MapPin,
  museo: Palette,
  parco: TreePine,
  moderno: Landmark,
};

const CATEGORIES = Object.keys(ROMA_CATEGORY_LABELS) as RomaCategory[];

export function RomaMap() {
  const [selection, setSelection] = useState<Selection>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [showStreets, setShowStreets] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [activeCategory, setActiveCategory] = useState<RomaCategory | null>(null);

  const selectedMonument =
    selection?.type === 'monument' ? ROMA_MONUMENTS.find((m) => m.id === selection.id) ?? null : null;
  const selectedZone =
    selection?.type === 'zone' ? ROMA_ZONES.find((z) => z.id === selection.id) ?? null : null;

  const monumentsByZone = useMemo(() => {
    const map: Record<string, RomaMonument[]> = {};
    ROMA_MONUMENTS.forEach((m) => {
      (map[m.zoneId] ??= []).push(m);
    });
    return map;
  }, []);

  const dimmed = (category: RomaCategory) => activeCategory !== null && activeCategory !== category;

  return (
    <section className="roma">
      <header className="roma__intro">
        <div>
          <h2 className="roma__title">
            <Landmark size={22} /> Studia Roma
          </h2>
          <p>
            Esplora la città per zone. Tocca una <strong>zona</strong> per capirne il carattere, un{' '}
            <strong>monumento</strong> per scoprirne posizione e storia, e segui le <strong>vie principali</strong> che
            attraversano il centro e le consolari che escono dalla città.
          </p>
        </div>
        <div className="roma__toolbar">
          <button
            type="button"
            className={`roma__toggle ${showStreets ? 'is-on' : ''}`}
            onClick={() => setShowStreets((v) => !v)}
          >
            <Route size={16} /> Vie
          </button>
          <button
            type="button"
            className={`roma__toggle ${showLabels ? 'is-on' : ''}`}
            onClick={() => setShowLabels((v) => !v)}
          >
            <Signpost size={16} /> Etichette
          </button>
        </div>
      </header>

      <div className="roma__legend">
        <button
          type="button"
          className={`roma__cat ${activeCategory === null ? 'is-active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >
          Tutti
        </button>
        {CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICON[cat];
          return (
            <button
              key={cat}
              type="button"
              className={`roma__cat ${activeCategory === cat ? 'is-active' : ''}`}
              style={{ '--cat': ROMA_CATEGORY_COLORS[cat] } as CSSProperties}
              onClick={() => setActiveCategory((prev) => (prev === cat ? null : cat))}
            >
              <span className="roma__cat-dot" />
              <Icon size={14} /> {ROMA_CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      <div className="roma__grid">
        <div className="roma__map-wrap panel">
          <svg
            className="roma-map"
            viewBox={`0 0 ${ROMA_VIEWBOX.width} ${ROMA_VIEWBOX.height}`}
            role="img"
            aria-label="Mappa stilizzata di Roma con zone, vie e monumenti"
          >
            <rect className="roma-map__land" x="0" y="0" width={ROMA_VIEWBOX.width} height={ROMA_VIEWBOX.height} rx="14" />

            {/* Zone */}
            {ROMA_ZONES.map((zone) => {
              const active = selectedZone?.id === zone.id;
              return (
                <polygon
                  key={zone.id}
                  className={`roma-zone ${active ? 'is-active' : ''}`}
                  points={zone.polygon}
                  style={{ '--zone': zone.color } as CSSProperties}
                  onClick={() => setSelection({ type: 'zone', id: zone.id })}
                />
              );
            })}

            {/* Mura aureliane */}
            <path className="roma-walls" d={ROMA_WALLS} />

            {/* Fiumi */}
            <path className="roma-river" d={ROMA_RIVERS.tevere} />
            <path className="roma-river roma-river--minor" d={ROMA_RIVERS.aniene} />

            {/* Etichette zone */}
            {ROMA_ZONES.map((zone) => (
              <text key={`${zone.id}-l`} className="roma-zone__label" x={zone.labelAt[0]} y={zone.labelAt[1]}>
                {zone.name}
              </text>
            ))}

            {/* Vie */}
            {showStreets &&
              ROMA_STREETS.map((street) => (
                <g key={street.id} className={`roma-street roma-street--${street.kind}`}>
                  <path d={street.path} />
                  <text className="roma-street__label" x={street.labelAt[0]} y={street.labelAt[1]}>
                    {street.name}
                  </text>
                </g>
              ))}

            {/* Monumenti — l'attivo/hover in fondo cosi viene disegnato sopra gli altri */}
            {[...ROMA_MONUMENTS]
              .sort((a, b) => {
                const rank = (id: string) => (selectedMonument?.id === id ? 2 : hovered === id ? 1 : 0);
                return rank(a.id) - rank(b.id);
              })
              .map((m) => {
              const active = selectedMonument?.id === m.id;
              const isHover = hovered === m.id;
              const showName = showLabels || active || isHover;
              // Etichette a ovest del fiume scritte verso sinistra: non sconfinano nel centro.
              const labelLeft = m.at[0] < 380;
              return (
                <g
                  key={m.id}
                  className={`roma-pin ${active ? 'is-active' : ''} ${dimmed(m.category) ? 'is-dimmed' : ''}`}
                  style={{ '--cat': ROMA_CATEGORY_COLORS[m.category] } as CSSProperties}
                  transform={`translate(${m.at[0]} ${m.at[1]})`}
                  onClick={() => setSelection({ type: 'monument', id: m.id })}
                  onMouseEnter={() => setHovered(m.id)}
                  onMouseLeave={() => setHovered((h) => (h === m.id ? null : h))}
                  tabIndex={0}
                  role="button"
                  aria-label={m.name}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelection({ type: 'monument', id: m.id });
                    }
                  }}
                >
                  <circle className="roma-pin__halo" r={active ? 15 : 11} />
                  <circle className="roma-pin__dot" r={5} />
                  {showName ? (
                    <text
                      className="roma-pin__label"
                      x={labelLeft ? -9 : 9}
                      y={4}
                      textAnchor={labelLeft ? 'end' : 'start'}
                    >
                      {m.name}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>
        </div>

        <aside className="roma__panel panel">
          {selectedMonument ? (
            <MonumentCard monument={selectedMonument} onClose={() => setSelection(null)} />
          ) : selectedZone ? (
            <div className="roma__detail">
              <div className="roma__detail-head">
                <div>
                  <span className="roma__eyebrow">Zona</span>
                  <h3>{selectedZone.name}</h3>
                  <p className="roma__tagline">{selectedZone.tagline}</p>
                </div>
                <button type="button" className="roma__close" onClick={() => setSelection(null)} aria-label="Chiudi">
                  <X size={18} />
                </button>
              </div>
              <p className="roma__desc">{selectedZone.description}</p>
              <span className="roma__eyebrow">Cosa vedere qui</span>
              <ul className="roma__list">
                {(monumentsByZone[selectedZone.id] ?? []).map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => setSelection({ type: 'monument', id: m.id })}>
                      <span className="roma__list-dot" style={{ background: ROMA_CATEGORY_COLORS[m.category] }} />
                      {m.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="roma__hint">
              <p className="roma__hint-lead">
                <MapPin size={18} /> Tocca la mappa per iniziare.
              </p>
              <span className="roma__eyebrow">Le zone di Roma</span>
              <ul className="roma__zones-list">
                {ROMA_ZONES.map((zone) => (
                  <li key={zone.id}>
                    <button type="button" onClick={() => setSelection({ type: 'zone', id: zone.id })}>
                      <span className="roma__list-dot" style={{ background: zone.color }} />
                      <span>
                        <strong>{zone.name}</strong>
                        <small>{zone.tagline}</small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function MonumentCard({ monument, onClose }: { monument: RomaMonument; onClose: () => void }) {
  const zone = ROMA_ZONES.find((z) => z.id === monument.zoneId);
  const Icon = CATEGORY_ICON[monument.category];
  return (
    <div className="roma__detail">
      <div className="roma__detail-head">
        <div>
          <span className="roma__chip" style={{ '--cat': ROMA_CATEGORY_COLORS[monument.category] } as CSSProperties}>
            <Icon size={13} /> {ROMA_CATEGORY_LABELS[monument.category]}
          </span>
          <h3>{monument.name}</h3>
          {zone ? <p className="roma__tagline">Zona: {zone.name}</p> : null}
        </div>
        <button type="button" className="roma__close" onClick={onClose} aria-label="Chiudi">
          <X size={18} />
        </button>
      </div>
      <p className="roma__desc">{monument.blurb}</p>
      <div className="roma__tip">
        <MapPin size={15} /> {monument.tip}
      </div>
    </div>
  );
}
