# VinylVault

Vinyl Record Collection Manager (React + Vite + Firebase).

## Phase 2 — Persoonlijke collecties & permissies

- **Owner-model**: records dragen `owner` (label) + `ownerUid` (Firebase uid, `null` voor legacy/geïmporteerde records). Bestaande data blijft werken zonder migratie.
- **Profiel** (`/profiel`): elke gebruiker stelt zijn `collectionLabel` en `collectionVisibility` (`public`/`private`) in.
- **Persoonlijke Home**: toont je eigen platen/KPI's met een toggle "Toon alle collecties".
- **Browse-permissies**: publieke collecties zijn voor alle leden zichtbaar; private collecties enkel voor de eigenaar of wie via `collectionGrants` toegang kreeg (beheer op de profielpagina).
- **Gemengde view**: in *Alle Platen* kunnen meerdere eigenaren tegelijk geselecteerd worden.

Nieuwe gebruikers krijgen bij registratie automatisch `collectionLabel` (= weergavenaam) en `collectionVisibility: 'public'`.

> Bestaande gebruikers (Dario/Papa) kunnen hun `collectionLabel` eenmalig instellen via **Profiel** zodat hun geïmporteerde records (`owner: 'dario'`/`'papa'`) als "van hen" herkend worden.

## Phase 3 — Metadata-lookup & barcode scanner

- **Metadata ophalen**: in het plaat-formulier vult de knop *Metadata ophalen* lege velden aan op basis van barcode, catalogusnummer of artiest/titel.
- **Barcode scannen**: de knop *Scan barcode* gebruikt de browser-native `BarcodeDetector` API (werkt o.a. op Android Chrome; iOS Safari ondersteunt dit nog niet — daar blijft handmatige invoer beschikbaar).
- **Bronnen**: Cloud Function `lookupRelease` gebruikt **Discogs** (indien token geconfigureerd) met **MusicBrainz + Cover Art Archive** als gratis fallback.

### Discogs token configureren (optioneel)

Zonder token werkt de lookup via MusicBrainz. Voor Discogs-resultaten:

1. Maak een persoonlijk token aan op <https://www.discogs.com/settings/developers>.
2. Voeg het toe aan de functions-omgeving, bv. via `functions/.env` (gitignored):
   ```
   DISCOGS_TOKEN=jouw_token_hier
   ```
3. Deploy de functions: `npm run functions:deploy`.

-----

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
