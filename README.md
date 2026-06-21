# Atlante d'Italia

Web app educativa per imparare regioni italiane, capoluoghi, province, confini e collegamenti geografici tramite missioni progressive. Interfaccia con cruscotto, navigazione laterale e tema chiaro/scuro.

## Link pubblico

GitHub Pages: https://lori2003.github.io/RegioniItalia/

Il codice sorgente sta su `main`; la versione pubblicata da GitHub Pages sta sul branch `gh-pages`.

## Funzioni principali

- Login semplice con nome autorizzato: `Lorenzo`.
- Due macro-modalita in home: **Studio** (allenamento libero con aiuti, scelta multipla e mappa interattiva) e
  **Test e Memorizzazione** (ripasso del giorno a ripetizione spaziata e box errori).
- Nelle sessioni di Test e Memorizzazione, ogni carta (mappa, capoluoghi, province, confini, viaggio, indizi) si puo
  affrontare normalmente oppure "a mente": ci pensi, riveli la risposta e ti autovaluti con "L'avevo indovinata" /
  "Non la sapevo".
- Dopo ogni risposta (in Studio e in Test e Memorizzazione) la carta successiva parte da sola dopo pochi secondi,
  senza dover cliccare "Continua": il pulsante "Avanti subito" resta disponibile solo per saltare l'attesa.
- Un bottone "Home" sempre visibile in alto nella schermata di gioco permette di tornare subito alla home, sia da
  Studio che da Test e Memorizzazione, senza dover scorrere la pagina.
- Tre difficolta: facile con suggerimenti, medio con pochi aiuti, difficile senza suggerimenti.
- Sei modalita: mappa cieca, capoluoghi, province, confini, viaggio e indizi culturali.
- Mappa interattiva delle 20 regioni italiane.
- Punteggio, serie, livelli, badge, regioni sbloccate e copertura viste/mancanti per modalita.
- Le nuove missioni preferiscono regioni o tappe non ancora viste nel giro della modalita corrente.
- Salvataggio su Supabase quando configurato, con fallback locale su `localStorage`.
- Layout responsive per desktop e iPhone 15 Pro Max.

## Avvio locale

```bash
npm install
npm run dev
```

Per provarla da telefono sulla stessa rete Wi-Fi, apri l'indirizzo `Network` mostrato da Vite, ad esempio
`http://192.168.1.20:5173/`. In sviluppo la app usa `/`; il prefisso `/RegioniItalia/` resta solo per la build
pubblicata su GitHub Pages.

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
