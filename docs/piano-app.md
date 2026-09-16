# MiniPC Finder — piano applicativo

## Obiettivo

Trasformare l’MVP attuale in un catalogo responsive, accessibile e condivisibile che permetta di:

- esplorare i Mini PC in modalità light/dark;
- filtrare tutte le caratteristiche disponibili;
- ordinare i risultati;
- confrontare fino a quattro prodotti.

Il sito resta statico: dati generati dalla Google Sheet durante la build e interazione interamente client-side.

## Stato iniziale verificato

- ETL, schema dati e generazione del catalogo funzionano.
- La pagina corrente offre solo ricerca testuale e filtro singolo per brand.
- `catalog.json` non include ancora memoria, storage, rete, alimentazione e supporto: questi campi sono presenti nel modello completo, ma non possono ancora essere filtrati dal catalogo.
- Non esistono ancora layout condiviso, pagina di dettaglio, confronto, URL dei filtri o test dell’interfaccia.

## Regole funzionali

### Filtri

- Ogni filtro discreto è una multiselect.
- Più valori nello stesso filtro sono combinati in **OR**: `AMD OR Intel`.
- Filtri diversi sono combinati in **AND**: `(AMD OR Intel) AND USB4 AND max price $500`.
- I campi booleani espongono `Yes`, `No` e stato non selezionato; i valori mancanti non equivalgono a `No`.
- Numeri continui usano intervalli min/max quando utile: prezzo, volume, RAM, TDP, numero di porte, punteggi.
- Ogni opzione mostra il conteggio ottenibile con gli altri filtri attivi.
- Tutto lo stato è nella query string; refresh, condivisione URL e back/forward devono conservarlo.

### Ordinamento

Ordinamenti iniziali:

- overall score, crescente/decrescente;
- prezzo minimo, crescente/decrescente;
- rapporto prezzo/punteggio;
- volume;
- data di uscita;
- brand e modello.

Valori mancanti sempre in fondo, indipendentemente dalla direzione.

### Confronto

- Selezione da card o tabella, massimo quattro prodotti.
- Barra persistente con selezionati, rimozione, azzeramento e pulsante `Compare`.
- Pagina `/compare?ids=id-1,id-2` condivisibile.
- Tabella per sezioni: CPU/GPU, memoria, storage, porte, rete, consumi, dimensioni, supporto e prezzo.
- Opzione `Show only differences`; valori migliori evidenziati soltanto per metriche con direzione non ambigua.

## Architettura proposta

### Dati

Ampliare `CatalogDevice` e `etl/build-data.ts` con tutti i campi filtrabili. Il catalogo client deve contenere dati normalizzati e compatti, non note e metadati non usati. Generare inoltre `facets.json` con valori disponibili, min/max e conteggi globali.

Definire i filtri in un solo registro tipizzato (`src/lib/filter-definitions.ts`): chiave URL, etichetta, gruppo, tipo, accesso al campo e normalizzatore. UI, motore e serializzazione devono usare questo registro, evitando condizioni duplicate nei componenti.

### Stato client

Un unico store Preact Signals contiene:

- testo di ricerca;
- valori selezionati per faccetta;
- intervalli numerici;
- ordinamento e direzione;
- vista griglia/tabella;
- pagina/caricamento progressivo;
- ID selezionati per il confronto.

La query string è la sorgente persistente dello stato. `history.replaceState` durante l’interazione e `popstate` per back/forward. La selezione confronto può usare la query string; `localStorage` è ammesso solo come comodità tra pagine, mai come unica sorgente.

### Componenti

- `BaseLayout.astro`: header, navigazione, metadati, theme bootstrap.
- `ThemeToggle.tsx`: `light`, `dark`, `system`, senza flash iniziale.
- `CatalogApp.tsx`: orchestration dello stato.
- `FilterSidebar.tsx`: desktop sidebar e drawer mobile.
- `MultiSelectFilter.tsx`, `RangeFilter.tsx`, `BooleanFilter.tsx`.
- `SortControl.tsx`, `ActiveFilters.tsx`, `ResultCount.tsx`.
- `DeviceCard.tsx` e `DeviceTable.tsx`.
- `CompareTray.tsx` e `CompareTable.tsx`.
- `EmptyState.tsx` con indicazione dei filtri che azzerano i risultati.

## Direzione visuale

Interfaccia tecnica ma curata: superfici pulite, alta densità informativa e accento colore riservato alle azioni e ai dati.

- Token semantici CSS per entrambe le modalità: background, surface, surface-raised, text, muted, border, accent, focus, positive e warning.
- Modalità iniziale da `prefers-color-scheme`; scelta salvata e applicata prima del render.
- Card con gerarchia netta: modello, CPU/GPU, prezzo, punteggio e caratteristiche distintive.
- Sidebar filtri sticky su desktop; drawer a schermo intero su mobile.
- Griglia responsive e tabella densa con prima colonna sticky.
- Focus visibile, contrasto WCAG AA, target touch ≥ 44 px e nessuna informazione affidata solo al colore.

## Fasi di implementazione

### Fase 1 — Contratto dati completo

1. Completare il mapping ETL dei campi già presenti in `Device`.
2. Ampliare `CatalogDevice` con tutti i campi filtrabili e il prezzo minimo calcolato.
3. Generare `facets.json` e documentare valori non normalizzabili.
4. Aggiungere test fixture per null, zero reale, booleani e valori multipli.

**DoD:** ogni caratteristica richiesta è presente nel catalogo o esplicitamente documentata come data gap; output deterministico; `npm run check` passa.

### Fase 2 — Design system light/dark

1. Creare layout e token semantici.
2. Implementare scelta `light/dark/system` senza flash.
3. Costruire card, controlli, badge, pulsanti e skeleton coerenti.
4. Verificare desktop, tablet e mobile.

**DoD:** entrambe le modalità hanno contrasto AA, nessun layout shift del tema e preferenza persistente.

### Fase 3 — Motore filtri e URL

1. Creare registro tipizzato delle faccette.
2. Implementare OR interno, AND tra gruppi e intervalli numerici.
3. Collegare query string, back/forward, reset totale e rimozione singola.
4. Calcolare conteggi contestuali e stato vuoto esplicativo.
5. Aggiungere ricerca con debounce 120 ms e MiniSearch.

**DoD:** tutte le caratteristiche filtrabili funzionano; URL condiviso riproduce esattamente i risultati; cambio filtro < 50 ms sul catalogo reale.

### Fase 4 — Risultati e ordinamento

1. Implementare griglia e tabella selezionabili.
2. Aggiungere ordinamenti, direzione e gestione uniforme dei null.
3. Mostrare 60 risultati iniziali con `Load more`.
4. Conservare posizione e stato quando si torna dal dettaglio.

**DoD:** ordinamenti verificati con test unitari; tastiera e screen reader possono usare tutti i controlli.

### Fase 5 — Confronto

1. Aggiungere selezione fino a quattro elementi nelle due viste.
2. Implementare tray persistente e limite con feedback chiaro.
3. Creare `/compare` con tabella responsive e `Show only differences`.
4. Gestire ID inesistenti o duplicati senza errore.

**DoD:** URL confronto condivisibile, confronto funzionante con 2–4 prodotti, valori mancanti mostrati come `—`.

### Fase 6 — Qualità e rilascio

1. Test unitari per filtri, query string, sort e differenze.
2. Test browser per tema, mobile drawer, back/forward e confronto.
3. Verifica build con base path `/minipc-finder` e JavaScript disabilitato.
4. Audit dimensione bundle, accessibilità e performance.

**DoD:** `npm run check` e build passano; nessun errore console; catalogo completo visibile senza JS, funzioni interattive disponibili con JS.

## Ordine consigliato

`Dati → Design system → Filtri/URL → Risultati/sort → Confronto → QA`

Il primo rilascio utile termina con la Fase 4. La Fase 5 aggiunge il confronto senza dover riscrivere motore filtri o componenti dei risultati.
