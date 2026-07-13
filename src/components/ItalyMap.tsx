import { geoMercator, geoPath } from 'd3-geo';
import { useEffect, useMemo, useState } from 'react';
import { ITALY_PEAKS, ITALY_RANGES, ITALY_RIVERS, ITALY_SEAS } from '../data/italyGeo';
import { REGIONS } from '../data/regions';
import type { MasteryLevel } from '../types';

type GeoFeature = {
  type: 'Feature';
  properties: {
    reg_name: string;
  };
  geometry: GeoJSON.Geometry;
};

type GeoCollection = {
  type: 'FeatureCollection';
  features: GeoFeature[];
};

type ProvinceFeature = {
  type: 'Feature';
  properties: { prov_name: string; prov_acr: string; reg_name: string };
  geometry: GeoJSON.Geometry;
};

type ProvinceCollection = { type: 'FeatureCollection'; features: ProvinceFeature[] };

type ItalyMapProps = {
  targetRegion?: string;
  selectedRegion?: string;
  masteryByRegion: Record<string, MasteryLevel>;
  expectsMapClick: boolean;
  /** Se true mostra i colori di padronanza e i nomi delle regioni note (home).
   *  Se false la mappa resta neutra per non rivelare risposte (durante il gioco). */
  revealMastery?: boolean;
  /** Regione da illuminare d'oro dopo una risposta corretta (effetto conquista).
   *  La `key` cambia a ogni conquista cosi l'animazione riparte. */
  capturedRegion?: string;
  captureKey?: number;
  /** Mostra province, fiumi, mari e rilievi. Le etichette geografiche appaiono
   *  solo con questo attivo (default true). */
  showDetail?: boolean;
  onRegionSelect: (regionName: string) => void;
};

const WIDTH = 540;
const HEIGHT = 660;

export function ItalyMap({
  targetRegion,
  selectedRegion,
  masteryByRegion,
  expectsMapClick,
  revealMastery = true,
  capturedRegion,
  captureKey,
  showDetail = true,
  onRegionSelect,
}: ItalyMapProps) {
  const [geoData, setGeoData] = useState<GeoCollection | null>(null);
  const [provData, setProvData] = useState<ProvinceCollection | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}italy-regions.geojson`)
      .then((response) => response.json())
      .then((data: GeoCollection) => {
        if (alive) setGeoData(data);
      })
      .catch(() => {
        if (alive) setGeoData(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}italy-provinces.geojson`)
      .then((response) => response.json())
      .then((data: ProvinceCollection) => {
        if (alive) setProvData(data);
      })
      .catch(() => {
        if (alive) setProvData(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const projection = useMemo(() => {
    if (!geoData) return null;
    return geoMercator().fitExtent(
      [
        [18, 18],
        [WIDTH - 18, HEIGHT - 18],
      ],
      geoData as GeoJSON.FeatureCollection,
    );
  }, [geoData]);

  const paths = useMemo(() => {
    if (!geoData || !projection) return [];
    const path = geoPath(projection);
    return geoData.features.map((feature) => {
      const region = REGIONS.find((item) => item.name === feature.properties.reg_name);
      return {
        name: feature.properties.reg_name,
        shortName: region?.shortName ?? feature.properties.reg_name,
        d: path(feature as GeoJSON.Feature) ?? '',
        centroid: path.centroid(feature as GeoJSON.Feature),
      };
    });
  }, [geoData, projection]);

  const provincePaths = useMemo(() => {
    if (!provData || !projection) return [];
    const path = geoPath(projection);
    return provData.features.map((feature) => ({
      key: feature.properties.prov_acr || feature.properties.prov_name,
      d: path(feature as GeoJSON.Feature) ?? '',
    }));
  }, [provData, projection]);

  const geo = useMemo(() => {
    if (!projection) return null;
    const toLine = (points: [number, number][]) => {
      const parts = points
        .map((p) => projection(p))
        .filter((xy): xy is [number, number] => Array.isArray(xy))
        .map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`);
      return parts.length > 1 ? `M ${parts.join(' L ')}` : '';
    };
    return {
      rivers: ITALY_RIVERS.map((r) => ({
        name: r.name,
        d: toLine(r.points),
        label: projection(r.points[Math.floor(r.points.length / 2)]),
      })),
      seas: ITALY_SEAS.map((s) => ({ name: s.name, xy: projection(s.at) })),
      ranges: ITALY_RANGES.map((s) => ({ name: s.name, xy: projection(s.at) })),
      peaks: ITALY_PEAKS.map((s) => ({ name: s.name, xy: projection(s.at) })),
    };
  }, [projection]);

  if (!geoData) {
    return (
      <div className="map-loading" aria-live="polite">
        Caricamento mappa...
      </div>
    );
  }

  return (
    <svg
      className={expectsMapClick ? 'italy-map awaiting-click' : 'italy-map'}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Mappa interattiva delle regioni italiane con province, fiumi e rilievi"
    >
      <rect className="map-sea" x="0" y="0" width={WIDTH} height={HEIGHT} rx="8" />

      {/* Nomi dei mari, dietro alla terraferma */}
      {showDetail && geo
        ? geo.seas.map((sea) =>
            sea.xy ? (
              <text key={sea.name} className="map-sea-label" x={sea.xy[0]} y={sea.xy[1]}>
                {sea.name}
              </text>
            ) : null,
          )
        : null}

      {/* Regioni (interattive) */}
      {paths.map((path) => {
        const mastery = masteryByRegion[path.name] ?? 'new';
        const captured = capturedRegion === path.name;
        // Dopo una risposta corretta la regione target si "accende": niente
        // evidenziazione da selezione, si vede solo la conquista dorata.
        const selected = selectedRegion === path.name && !captured;
        const target = targetRegion === path.name && !captured;
        const className = [
          'map-region',
          revealMastery ? `is-mastery-${mastery}` : '',
          selected ? 'is-selected' : '',
          target ? 'is-target-candidate' : '',
          captured ? 'is-captured' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <path
            key={captured ? `${path.name}-cap-${captureKey ?? 0}` : path.name}
            className={className}
            d={path.d}
            tabIndex={0}
            role="button"
            aria-label={path.shortName}
            onClick={() => onRegionSelect(path.name)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onRegionSelect(path.name);
              }
            }}
          />
        );
      })}

      {/* Confini delle province (sopra le regioni, non cliccabili) */}
      {showDetail && provincePaths.length > 0 ? (
        <g className="province-layer">
          {provincePaths.map((p) => (
            <path key={p.key} className="map-province" d={p.d} />
          ))}
        </g>
      ) : null}

      {/* Fiumi */}
      {showDetail && geo ? (
        <g className="river-layer">
          {geo.rivers.map((r) => (
            <path key={r.name} className="map-river" d={r.d} />
          ))}
        </g>
      ) : null}

      {/* Rilievi: cime e vulcani */}
      {showDetail && geo
        ? geo.peaks.map((peak) =>
            peak.xy ? (
              <g key={peak.name} className="map-peak" transform={`translate(${peak.xy[0]} ${peak.xy[1]})`}>
                <path className="map-peak__mark" d="M 0 -5 L 4.5 3.5 L -4.5 3.5 Z" />
                <text className="map-peak__label" x={7} y={3}>
                  {peak.name}
                </text>
              </g>
            ) : null,
          )
        : null}

      {/* Etichette dei mari (in primo piano, leggibili) */}
      {showDetail && geo
        ? geo.rivers.map((r) =>
            r.label ? (
              <text key={`${r.name}-l`} className="map-river-label" x={r.label[0]} y={r.label[1]}>
                {r.name}
              </text>
            ) : null,
          )
        : null}

      {/* Catene montuose */}
      {showDetail && geo
        ? geo.ranges.map((range) =>
            range.xy ? (
              <text
                key={range.name}
                className="map-range-label"
                x={range.xy[0]}
                y={range.xy[1]}
                transform={range.name.includes('PENNINI') ? `rotate(-58 ${range.xy[0]} ${range.xy[1]})` : undefined}
              >
                {range.name}
              </text>
            ) : null,
          )
        : null}

      {/* Nomi delle regioni */}
      {paths.map((path) => {
        const [x, y] = path.centroid;
        const known = (masteryByRegion[path.name] ?? 'new') !== 'new';
        // In gioco (revealMastery=false) la mappa resta neutra: nessun nome,
        // tranne la regione selezionata o quella corretta rivelata dopo la risposta.
        const showLabel = revealMastery
          ? known || selectedRegion === path.name
          : selectedRegion === path.name || targetRegion === path.name;
        if (!showLabel) return null;

        return (
          <text key={`${path.name}-label`} className="map-label" x={x} y={y}>
            {path.shortName}
          </text>
        );
      })}
    </svg>
  );
}
