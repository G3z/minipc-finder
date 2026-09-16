# Mini PC Finder

A fast, static catalog for exploring and comparing Mini PCs from the public **2024 General Mini PC Guide USA** spreadsheet.

## Features

- Light, dark, and system color themes.
- Full-text search, multi-select filters, numeric ranges, and sortable results.
- Multiple values within a filter use OR logic; different filters use AND logic.
- Shareable filter URLs.
- Grid and dense table views.
- Compare up to four Mini PCs side by side, including a differences-only mode.
- Static GitHub Pages deployment with a daily data refresh.

## Data source

Catalog data comes from the public [2024 General Mini PC Guide USA](https://docs.google.com/spreadsheets/d/1SWqLJ6tGmYHzqGaa4RZs54iw7C1uLcTU_rLTRHTOzaA/edit#gid=239063037) Google Sheet.

The source data is fetched during the build and is not included in this repository. The source spreadsheet and its contents remain subject to their respective authors' terms.

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm run data
npm run dev
```

Open `http://localhost:4321/minipc-finder/`.

`npm run data` downloads the latest public spreadsheet and writes generated files under `src/data/`. Internet access is required for that step.

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run data` | Download and normalize the source spreadsheet. |
| `npm run check` | Run typecheck, lint, and tests. |
| `npm run build` | Create the static production build. |
| `npm run preview` | Preview the production build locally. |

## Deployment

The GitHub Actions workflow builds and deploys the site to GitHub Pages on pushes to `master`, on manual dispatch, and daily at 05:00 UTC.

The production URL is [g3z.github.io/minipc-finder](https://g3z.github.io/minipc-finder/).

## License

The code in this repository is released under the [MIT License](LICENSE).
