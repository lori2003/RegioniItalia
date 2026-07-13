/**
 * Elementi geografici extra per la mappa d'Italia: fiumi, mari e rilievi.
 * Le coordinate sono [longitudine, latitudine] reali, cosi vengono proiettate
 * con la stessa proiezione delle regioni e si allineano alla mappa.
 * I tracciati dei fiumi sono semplificati (livello "sussidiario"), non esatti.
 */

export type GeoLine = { name: string; points: [number, number][] };
export type GeoPoint = { name: string; at: [number, number] };

/** Fiumi principali, come polilinee lon/lat da monte a foce. */
export const ITALY_RIVERS: GeoLine[] = [
  {
    name: 'Po',
    points: [
      [7.35, 44.7],
      [7.7, 45.0],
      [8.05, 45.1],
      [8.9, 45.15],
      [9.7, 45.12],
      [10.9, 45.05],
      [11.6, 45.02],
      [12.05, 45.03],
      [12.5, 44.96],
    ],
  },
  {
    name: 'Adige',
    points: [
      [11.35, 46.5],
      [11.12, 46.07],
      [10.85, 45.8],
      [11.0, 45.44],
      [11.6, 45.25],
      [12.28, 45.18],
    ],
  },
  {
    name: 'Tevere',
    points: [
      [12.15, 43.6],
      [12.45, 42.9],
      [12.6, 42.42],
      [12.62, 42.0],
      [12.48, 41.9],
      [12.28, 41.76],
    ],
  },
  {
    name: 'Arno',
    points: [
      [11.75, 43.66],
      [11.55, 43.72],
      [11.25, 43.78],
      [10.9, 43.72],
      [10.5, 43.72],
      [10.28, 43.68],
    ],
  },
  {
    name: 'Ticino',
    points: [
      [8.62, 46.15],
      [8.7, 45.8],
      [8.75, 45.4],
      [8.9, 45.15],
    ],
  },
];

/** Nomi dei mari, posizionati al largo attorno all'Italia. */
export const ITALY_SEAS: GeoPoint[] = [
  { name: 'Mar Ligure', at: [8.5, 43.65] },
  { name: 'Mar Tirreno', at: [11.4, 40.0] },
  { name: 'Mar Adriatico', at: [15.55, 43.1] },
  { name: 'Mar Ionio', at: [17.6, 38.5] },
  { name: 'Mar di Sardegna', at: [6.5, 40.1] },
];

/** Catene montuose (etichette). */
export const ITALY_RANGES: GeoPoint[] = [
  { name: 'ALPI', at: [9.6, 46.35] },
  { name: 'A P P E N N I N I', at: [13.9, 42.0] },
];

/** Cime e vulcani principali, come piccoli triangoli con etichetta. */
export const ITALY_PEAKS: GeoPoint[] = [
  { name: 'Monte Bianco', at: [6.86, 45.83] },
  { name: 'Gran Sasso', at: [13.57, 42.47] },
  { name: 'Vesuvio', at: [14.43, 40.82] },
  { name: 'Etna', at: [14.99, 37.75] },
  { name: 'Gennargentu', at: [9.3, 39.98] },
];
