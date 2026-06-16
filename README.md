# Italia Quest: La conquista delle regioni

Web app educativa per imparare regioni italiane, capoluoghi, province, confini e collegamenti geografici tramite missioni progressive.

## Funzioni principali

- Login semplice con nome autorizzato: `Lorenzo`.
- Tre difficolta: facile con suggerimenti, medio con pochi aiuti, difficile senza suggerimenti.
- Sei modalita: mappa cieca, capoluoghi, province, confini, viaggio e indizi culturali.
- Mappa interattiva delle 20 regioni italiane.
- Punteggio, serie, livelli, badge e regioni sbloccate.
- Salvataggio su Supabase quando configurato, con fallback locale su `localStorage`.
- Layout responsive per desktop e iPhone 15 Pro Max.

## Avvio locale

```bash
npm install
npm run dev
```

## Configurazione Supabase

1. Crea un progetto Supabase.
2. Esegui lo script SQL in `supabase/schema.sql`.
3. Copia `.env.example` in `.env.local`.
4. Inserisci `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Riavvia il dev server.

La chiave personale Supabase e la chiave GitHub non devono essere salvate nel repository.

## Dati geografici

- Le province e le unita territoriali sono basate sul dataset ISTAT dei codici delle unita amministrative territoriali.
- La mappa regionale usa un GeoJSON delle regioni italiane incluso in `public/italy-regions.geojson`.
