# MiniPC Filter — piano di implementazione

Sito statico per consultare e filtrare la Google Sheet **"2024 General Mini PC Guide USA"**, ispirato a Retro Ranker / Retro Catalog.
Dati rigenerati da GitHub Actions, deploy su GitHub Pages, nessun backend.

Sheet ID: `1SWqLJ6tGmYHzqGaa4RZs54iw7C1uLcTU_rLTRHTOzaA` — tab verificato: `gid=239063037` (accesso pubblico in sola lettura).

---

## 0. Come usare questo documento

Ogni task è autonomo: ha input, output, file da toccare e **DoD** (definition of done).
Regole per chi esegue:

- Non modificare file fuori dal perimetro del task.
- `npm run check` (typecheck + lint + test) deve passare prima di dichiarare un task finito.
- Le colonne della sheet si toccano **solo** in `etl/mapping.ts`. Mai nomi di colonna hardcoded nei componenti.
- Se un campo della sheet è ambiguo, lasciarlo `null` e annotarlo in `docs/data-gaps.md`. Non inventare valori.
- Niente dipendenze nuove senza che siano elencate nel task.

---

## 1. Decisioni già prese

| Aspetto | Scelta | Perché |
|---|---|---|
| Framework | Astro 5 + TypeScript | HTML statico per default, un'unica isola interattiva |
| Isola filtri | Preact + `@preact/signals` | ~5 kB, sufficiente per filtrare in memoria |
| Stile | Tailwind v4 con token custom in `@theme` | velocità di esecuzione, design comunque nostro |
| Ricerca | `minisearch` | indice precompilato, full-client |
| Dati | JSON generati a build time, **non committati** | niente rumore in git, sempre freschi |
| Hosting | GitHub Pages su `<user>.github.io/<repo>/` | zero costi, zero infra |
| Aggiornamento | cron giornaliero + `workflow_dispatch` | la sheet cambia spesso (prezzi) |
| Lingua UI | **inglese** | pubblico e dati sono anglofoni |
| Valuta | **USD**, come in origine | nessuna conversione, nessun tasso da mantenere |
| Sorgente | **solo il tab USA completo**, `gid=239063037` | una sola struttura di colonne da reggere |
| Link venditore | mantenuti così come sono nella sheet (non affiliati) | è un valore della sheet originale |

Conseguenza operativa dell'hosting su sottocartella: `astro.config.mjs` deve avere
`site: "https://<user>.github.io"` e `base: "/<repo>"`, e **ogni** URL interna deve passare da
`import.meta.env.BASE_URL`. Link assoluti tipo `/devices` rompono il sito in produzione pur
funzionando in locale: è l'errore più probabile di tutto il progetto.

---

## 2. Fase 0 — Spike di accesso ai dati (bloccante)

### T0.1 — Verificare gli endpoint di export
**Output:** `docs/data-source.md` con l'endpoint scelto e un esempio di risposta.

Provare, in ordine:

1. `https://docs.google.com/spreadsheets/d/<ID>/export?format=csv&gid=<GID>` → preferito: serve un solo tab.
2. `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&gid=<GID>` → fallback.
3. `https://docs.google.com/spreadsheets/d/<ID>/export?format=xlsx` → ultima risorsa, se serve leggere il nome del foglio per la verifica di T0.2.

Attenzione: questi endpoint rispondono **302** verso un host di download. Il client deve seguire i redirect
e controllare che il content-type non sia `text/html` (una pagina di login HTML con status 200 è il modo
tipico in cui questo fallisce in silenzio).

**DoD:** uno script `node etl/spike.mjs` che scarica e stampa le prime 3 righe di dati, senza credenziali, da una macchina pulita (come sarà il runner CI).

### T0.2 — Ancorare il tab
**Output:** `etl/source.ts` → `{ sheetId: "1SWqLJ6...", gid: 239063037, name: "2024 General Mini PC Guide USA" }`.

Si usa **solo** questo tab. Gli altri fogli del documento vanno ignorati.
Poiché il gid da solo non garantisce che il tab non sia stato rinominato o sostituito, l'ETL
verifica anche il nome del foglio e fallisce se non combacia.

**DoD:** l'ETL scarica esclusivamente quel tab e si ferma con un errore leggibile se gid o nome non corrispondono.

### T0.3 — Fixture di test
**Output:** `etl/__fixtures__/guide-usa.csv` — le prime ~40 righe del tab principale, committate.

Serve per i test offline. **DoD:** i test dell'ETL girano senza rete.

---

## 3. Fase 1 — Modello dati

### T1.1 — Schema
**File:** `src/lib/device.ts`

Struttura del foglio (riga 1 = intestazioni, riga 2 vuota, dati dalla riga 3; ci sono colonne vuote e intestazioni duplicate: il parser deve reggerlo).

```ts
type Device = {
  id: string;            // slug stabile, vedi T1.2
  model: string;         // "Model Name"
  brand: string;
  clonedFrom: string | null;
  scores: { overall, brand, socket, gen, gpu, volume, ram, drive, port, lan, seller };
  cpu: { name, class, gen, socket, pCores, threads, tdpW };
  gpu: { name, discrete: boolean, integrated: boolean };
  memory: { slots, maxGb, maxSpeedMts, ecc: boolean };
  storage: { maxDrives, maxNvme, nvmeGen5, nvmeGen4, nvmeGen3, m2Sata, sdCard, sata25, sata35 };
  ports: { pcieX16, pcieX8, pcieX4, pcieX1, oculink, tb5, usb4, pdInMinW, pdVideoMinW, pdVideoDataMinW, hdmi21, displays };
  network: { ethModel, ports: { g10, g5, g2_5, g1 }, maxEth, wifi6e, wifi6, wirelessSoc };
  power: { idleW, loadW, peakW, psuW, psuType, batteryWh, vPro };
  physical: { d1, d2, d3, volumeL, fan1Mm, fan2Mm };
  support: { warrantyYrs, durabilityYrs };
  pricing: {
    barebone: number | null;          // "Estimated Barebone Cost"
    variants: { config: "16GB/512GB" | ..., usd: number }[];
    history: { date: string, fromUsd: number, toUsd: number }[];  // da "Notes"
  };
  seller: { name, url: string | null };
  releaseDate: string | null;         // ISO
  notes: string | null;
  source: { sheet: string, row: number };
};
```

Numeri mancanti = `null`, mai `0`. `0` nella sheet significa davvero "zero porte".

**DoD:** schema `zod` corrispondente in `src/lib/device.schema.ts`, esportato e usato dall'ETL.

### T1.2 — ID stabili
Più righe condividono lo stesso `Model Name` (marche diverse, CPU diverse). Chiave:

```
id = slug(`${brand}-${model}-${cpu.name}-${gpu.name}`)
```

Collisioni → suffisso `-2`, `-3` in ordine di riga, e riga aggiunta a `docs/data-gaps.md`.
`etl/aliases.json` permette override manuali `{ "vecchio-id": "nuovo-id" }` per non rompere URL già condivisi.

**DoD:** test che verifica unicità degli id sulla fixture e stabilità dell'id a parità di input.

### T1.3 — Mapping colonne
**File:** `etl/mapping.ts` — unica fonte di verità intestazione → campo, con parser per tipo:

```ts
export const MAPPING = [
  { header: "Model Name", path: "model", parse: str },
  { header: "Estimated Barebone Cost", path: "pricing.barebone", parse: usd },
  { header: "Vol L", path: "physical.volumeL", parse: num },
  { header: "ECC Support [1=Yes, 0=No]", path: "memory.ecc", parse: bool01 },
  // ...
];
```

Le colonne prezzo per configurazione (`8GB/128GB` … `64GB/2TB`, più `Barebone or Very little RAM / eMMC`) vanno raccolte in `pricing.variants` da una regex, non elencate una a una.

**DoD:** se una colonna attesa sparisce dalla sheet, l'ETL logga un warning; se sparisce una colonna marcata `required: true`, esce con codice ≠ 0.

---

## 4. Fase 2 — ETL

### T2.1 — Fetch
**File:** `etl/fetch.ts` → scarica secondo T0.1, 3 retry con backoff, timeout 30 s, salva il grezzo in `.cache/`.

### T2.2 — Parse & normalizza
**File:** `etl/parse.ts` → `parseSheet(buffer, sheetConfig): Device[]`

Casi da gestire esplicitamente:
- intestazioni vuote o duplicate → colonne ignorate per indice;
- righe totalmente vuote → scartate;
- prezzi `$1,305` → `1305`;
- date `14-Apr-2024` → `2024-04-14`; date assenti → `null`;
- `Overall Score` vuoto o `0.0` → `null` + flag `discontinued: true` (spesso indica fuori produzione/stock);
- testo residuo nelle colonne numeriche → `null` + riga in `docs/data-gaps.md`.

**DoD:** test su fixture, ≥ 95% delle celle non vuote mappate senza warning.

### T2.3 — Storico prezzi dalle note
**File:** `etl/price-history.ts`

La colonna note contiene voci del tipo `Nov 7 2024: $550 to $450`. Estrarre con regex in `pricing.history`, ordinate dalla più recente. Il testo che non combacia resta in `notes`.

**DoD:** test su 10 note reali della fixture, incluse quelle che contengono due o più variazioni e quelle che contengono testo non di prezzo.

### T2.4 — Emissione
**File:** `etl/build-data.ts` → scrive in `src/data/`:

- `catalog.json` — solo i campi che servono al catalogo (id, model, brand, cpu, gpu, scores, volumeL, prezzo minimo, porte chiave, releaseDate). Obiettivo: < 300 kB non compresso.
- `devices/<id>.json` — record completo, letto solo a build time dalle pagine di dettaglio.
- `search-index.json` — indice minisearch precompilato su model, brand, cpu, gpu.
- `meta.json` — `{ generatedAt, sourceSheet, rowCount, warnings[] }`.

**DoD:** `npm run data` rigenera tutto in < 60 s e l'output è deterministico (stesso input → stessi byte).

---

## 5. Fase 3 — Design

Direzione: **scheda tecnica, non vetrina**. Il colore è riservato ai dati; l'interfaccia resta in grigi.

### T3.1 — Token
**File:** `src/styles/theme.css`

```
--ink          #16191D   testo
--alu-050      #F1F2F0   sfondo pagina (grigio alluminio freddo)
--alu-200      #DCDEDB   bordi, righe tabella
--alu-600      #6B7078   testo secondario
--signal       #0E7C7B   unico accento: stati attivi, focus, link
--data-cold    #2E5FA3   estremo freddo delle scale dati
--data-hot     #C4610C   estremo caldo delle scale dati
```

Tipografia: **Archivo** (testo) + **Archivo Narrow** (intestazioni di colonna, dense). Cifre sempre `font-variant-numeric: tabular-nums`.

Vietato, perché sono i tell del generato: etichette in maiuscoletto spaziato sopra ogni titolo, meta separate da `·`, `→` in coda ai link, card tutte identiche con la stessa ombra, animazioni di entrata su ogni sezione.

### T3.2 — Componente firma: silhouette in scala
**File:** `src/components/VolumeMark.astro`

Un rettangolo SVG proporzionale a `D1 × D3`, con area proporzionale al volume, sempre disegnato sulla stessa scala in tutto il sito, con accanto un riferimento fisso (es. una custodia da 2.5"). È l'unico elemento decorativo ammesso, ed è in realtà un dato.

**DoD:** due dispositivi con volume doppio hanno area disegnata doppia; il componente regge `volumeL === null`.

### T3.3 — Scale dati
`src/components/ScoreBar.astro` e `src/lib/scale.ts`: mappano un punteggio sul gradiente `--data-cold → --data-hot`, con valore numerico sempre visibile accanto (il colore non porta mai informazione da solo).

---

## 6. Fase 4 — Pagine

### T4.1 — `/` Home
Hero = il filtro stesso, non uno slogan: tre vincoli iniziali (budget, volume massimo, uso: homelab / desktop / gaming / NAS) e il contatore live "N di M mini PC". Sotto: migliori per punteggio, ribassi recenti (da `pricing.history`), ultimi arrivi.

### T4.2 — `/devices` Catalogo
- Faccette: brand, generazione CPU, classe, GPU integrata/discreta, fascia di prezzo, volume, slot RAM, RAM max, NVMe, 2.5GbE/10GbE, USB4/TB5, Oculink, PCIe, PD in, vPro, ECC.
- Ordinamento: punteggio, prezzo, prezzo/punteggio, volume, data di uscita.
- Due viste: griglia di schede e tabella densa con colonne selezionabili.
- Stato dei filtri nella query string (`?brand=...&maxVol=1.2&sort=score`), URL condivisibile, back del browser funzionante.
- Paginazione client-side a 60 elementi con "carica altri".

### T4.3 — `/devices/[id]` Dettaglio
Generata staticamente per ogni id. Specifiche per sezione, `VolumeMark`, tabella varianti/prezzi, grafico dello storico prezzi (SVG inline, niente librerie), note, link al venditore (`rel="nofollow noopener"`), 4 dispositivi simili (stessa classe CPU, volume entro ±30%), link alla riga di origine nella sheet.

### T4.4 — `/compare` Confronto
Fino a 4 dispositivi via `?ids=a,b,c`. Tabella con righe fisse, evidenziazione delle differenze, riga "solo differenze" attivabile.

### T4.5 — `/method` Metodologia
Da dove vengono i dati, che cosa significano i punteggi, che non sono nostri, data ultimo aggiornamento da `meta.json`, credito esplicito agli autori della sheet e link all'originale.

**DoD di fase:** tutte le pagine funzionano con JavaScript disabilitato tranne i filtri (che devono degradare a elenco completo ordinato per punteggio).

---

## 7. Fase 5 — Isola filtri

**File:** `src/islands/CatalogFilter.tsx`

- Riceve `catalog.json` e `search-index.json` come props serializzate.
- Filtro in memoria, nessuna fetch a runtime.
- Debounce 120 ms sulla ricerca testuale.
- Ogni faccetta mostra il conteggio dei risultati che produrrebbe.
- Stato vuoto: dice quale filtro sta escludendo tutto e offre di rimuoverlo.

**DoD:** con ~600 record, un cambio di filtro rende in < 50 ms su un laptop di fascia media; nessun errore in console; tastiera e focus visibili.

---

## 8. Fase 6 — Automazione

### T6.1 — Workflow
**File:** `.github/workflows/build.yml`

```yaml
on:
  schedule: [{ cron: "0 5 * * *" }]
  workflow_dispatch:
  push: { branches: [main] }
```

Step: checkout → setup-node (cache npm) → `npm ci` → `npm run data` → `npm run build` → `upload-pages-artifact` → `deploy-pages`.
Permessi: `contents: read`, `pages: write`, `id-token: write`.
Se `npm run data` fallisce, il job fallisce e **l'ultimo deploy resta online**.

### T6.2 — Allarme sulle regressioni
Se `rowCount` cala di oltre il 20% rispetto al `meta.json` dell'ultimo deploy, o se manca una colonna `required`, il job fallisce con un messaggio esplicito. Evita di pubblicare un catalogo mutilato perché qualcuno ha riordinato la sheet.

### T6.3 — Storico (opzionale, fase successiva)
Branch `data-snapshots`: il workflow ci scrive `snapshots/YYYY-MM-DD.json`. Abilita grafici prezzi reali invece di quelli ricostruiti dalle note.

---

## 9. Testi e formati

Tutta l'interfaccia è in inglese, `lang="en"`. Il documento di piano resta in italiano, il prodotto no.

- Prezzi: `$1,305` — separatore di migliaia, nessun decimale, nessuna conversione.
- Date: `14 Apr 2024`; date parziali o assenti → `—`, mai una data inventata.
- Volumi: `1.12 L`; dimensioni `147 × 147 × 52 mm`.
- Dato mancante: sempre `—`, mai `0`, mai `N/A`.
- Sentence case ovunque, verbi attivi nei bottoni (`Compare`, `Clear filters`, `Show only differences`).
- I link venditore restano quelli della sheet, con `rel="nofollow noopener"` e una riga in `/method`
  che chiarisce che non sono affiliati e che non guadagniamo nulla.

---

## 10. Ordine di esecuzione

```
T0.1 → T0.2 → T0.3            (bloccanti)
T1.1 → T1.2 → T1.3
T2.1 → T2.2 → T2.3 → T2.4
T3.1 ┐
T4.1..T4.5 ┤ in parallelo dopo T2.4
T5   ┘
T6.1 → T6.2
```

Consegna minima utile dopo T2.4 + T4.2 + T5: catalogo filtrabile online. Tutto il resto è incrementale.
