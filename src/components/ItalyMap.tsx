import { geoMercator, geoPath } from 'd3-geo';
import { useEffect, useMemo, useState } from 'react';
import { REGIONS } from '../data/regions';

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

type ItalyMapProps = {
  targetRegion?: string;
  selectedRegion?: string;
  unlockedRegions: string[];
  expectsMapClick: boolean;
  onRegionSelect: (regionName: string) => void;
};

const WIDTH = 540;
const HEIGHT = 660;

export function ItalyMap({
  targetRegion,
  selectedRegion,
  unlockedRegions,
  expectsMapClick,
  onRegionSelect,
}: ItalyMapProps) {
  const [geoData, setGeoData] = useState<GeoCollection | null>(null);

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

  const paths = useMemo(() => {
    if (!geoData) return [];
    const projection = geoMercator().fitExtent(
      [
        [18, 18],
        [WIDTH - 18, HEIGHT - 18],
      ],
      geoData as GeoJSON.FeatureCollection,
    );
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
  }, [geoData]);

  if (!geoData) {
    return (
      <div className="map-loading" aria-live="polite">
        Caricamento mappa...
      </div>
    );
  }

  return (
    <svg
      className="italy-map"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Mappa interattiva delle regioni italiane"
    >
      <rect className="map-sea" x="0" y="0" width={WIDTH} height={HEIGHT} rx="8" />
      {paths.map((path) => {
        const unlocked = unlockedRegions.includes(path.name);
        const selected = selectedRegion === path.name;
        const target = targetRegion === path.name;
        const className = [
          'map-region',
          unlocked ? 'is-unlocked' : '',
          selected ? 'is-selected' : '',
          expectsMapClick && target ? 'is-target-candidate' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <path
            key={path.name}
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
      {paths.map((path) => {
        const [x, y] = path.centroid;
        const showLabel = unlockedRegions.includes(path.name) || selectedRegion === path.name;
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
