# VinylVault — Wijzigingsoverzicht (Phase 2 & 3 + redesign)

**Branch:** `claude/phase-2-3-continuation-gDrzS`
**Datum:** juni 2026
**Status:** alle wijzigingen gebouwd (groen) en gepusht — nog niet gedeployed naar productie.

Dit document vat alles samen wat in deze sessie is gebouwd, bovenop het bestaande
Phase 1-werk. Totaal: **32 bestanden gewijzigd, ~1.700 regels toegevoegd**, verspreid
over 10 commits.

---

## 1. Inhoudsopgave

1. [Phase 2 — Persoonlijke collecties & permissies](#2-phase-2--persoonlijke-collecties--permissies)
2. [Phase 3 — Metadata-lookup & barcode scanner](#3-phase-3--metadata-lookup--barcode-scanner)
3. [Redesign — "Warm Hi-Fi" visuele identiteit](#4-redesign--warm-hi-fi-visuele-identiteit)
4. [Performance — code-splitting](#5-performance--code-splitting)
5. [frontend-design skill geïnstalleerd](#6-frontend-design-skill-geïnstalleerd)
6. [Datamodel & Firestore-rules](#7-datamodel--firestore-rules)
7. [Nieuwe bestanden](#8-nieuwe-bestanden)
8. [Wat jij nog moet doen](#9-wat-jij-nog-moet-doen)
9. [Bekende beperkingen](#10-bekende-beperkingen)
10. [Commit-overzicht](#11-commit-overzicht)

---

## 2. Phase 2 — Persoonlijke collecties & permissies

Doel: van een single-user app naar een **familie-app** waar elke gebruiker zijn
eigen collectie, dashboard en zichtbaarheid heeft — zonder de bestaande
(geïmporteerde) records te breken.

### 2C — Owner-architectuur (non-destructief)
- Records & wishlist-items dragen nu **`ownerUid`** (Firebase uid) naast het
  bestaande **`owner`**-label. Legacy records houden `ownerUid: null` en blijven werken.
- Nieuwe gebruikers krijgen bij registratie automatisch `collectionLabel`
  (= weergavenaam) en `collectionVisibility: 'public'`.
- **Owner-selector is dynamisch** geworden in `RecordForm` en `WishlistForm`
  (gebruikers + legacy labels i.p.v. hardcoded "Dario"/"Papa").
- **Bug opgelost:** het formulier sloeg de prijs op als `price`, terwijl KPI's en
  statistieken `purchasePrice` lezen → handmatig toegevoegde platen stonden op €0.
  Nu overal consistent `purchasePrice`.

### 2D — Persoonlijke Home
- Header "Welkom, {naam}", KPI's tonen je **eigen** platen en waarde.
- Eigen recentste platen via `isOwnRecord()` (match op `ownerUid` of `collectionLabel`).
- Toggle **"Toon alle collecties" / "Toon mijn collectie"**.
- Valt terug op `displayName` als `collectionLabel` nog niet is ingesteld, zodat
  legacy-gebruikers hun records meteen herkend zien.

### 2E — Profiel & browse-permissies
- Nieuwe pagina **`/profiel`**: weergavenaam, `collectionLabel`, en
  zichtbaarheid (`public`/`private`) instellen.
- **`collectionGrants`**-collectie + `useGrants` hook: toegang geven/intrekken per gebruiker.
- Andere collecties bladeren met permissiecheck (publiek of via grant).
- Sidebar-link + route toegevoegd.

### 2F — Gemengde collectie-view
- In **Alle Platen** kunnen meerdere eigenaren tegelijk geselecteerd worden
  (chips) → gecombineerde view (bv. Dario + Papa samen). "Alles" wist de selectie.

---

## 3. Phase 3 — Metadata-lookup & barcode scanner

- **Cloud Function `lookupRelease`** (`functions/index.js`): zoekt op barcode,
  catalogusnummer of artiest/titel.
  - Gebruikt **Discogs** als `DISCOGS_TOKEN` is geconfigureerd.
  - Valt terug op **MusicBrainz + Cover Art Archive** (gratis, geen token nodig).
  - Vereist authenticatie. Node 20 global `fetch`, geen extra dependencies.
- **`RecordForm`**: knoppen *Metadata ophalen* en *Scan barcode* die lege velden
  automatisch aanvullen (artiest, titel, label, jaar, land, genres, cover, …).
- **`BarcodeScanner`** component via de browser-native `BarcodeDetector` API
  (geen externe library). Werkt o.a. op Android Chrome; iOS Safari ondersteunt dit
  (nog) niet → daar blijft handmatige invoer beschikbaar.
- Opgehaalde cover-URL wordt mee bewaard bij toevoegen/bewerken.

---

## 4. Redesign — "Warm Hi-Fi" visuele identiteit

Concept: een analoge platenspeler in dark mode — warm en karaktervol, maar rustig
voor de ogen.

- **Typografie:** Fraunces (display-serif) + Hanken Grotesk (body) via Google Fonts.
  Alle titels (h1–h3) en KPI-cijfers in de display-font.
- **Palet:** warm houtskoolzwart met **messing/amber** als hoofdaccent, **terracotta**
  als pop, crèmekleurige tekst (vervangt het koele Material-grijs). Eén dominante
  warme kleur i.p.v. vier gelijke primaries.
- **Sfeer:** warme radiale gloed + fijne filmkorrel in de achtergrond i.p.v. platte kleur.
- **Motion:** zachte staggered fade-in op grids, page-entrance, hover-lift met gloed,
  draaiend vinyl-logo. Respecteert `prefers-reduced-motion`.
- **Iconen:** eigen SVG line-iconenset (`Icon.jsx`) vervangt **alle** emoji in nav,
  kaarten, zoekbalk, formulieren, detail, admin en pincode-scherm.
- **Consistentie:** `ownerColor()` als enige bron van waarheid — loste de bug op dat
  dezelfde eigenaar op elk scherm een andere badge-kleur kreeg. Zichtbare focus-ring
  (was nergens), warme scrollbar en tekstselectie. Grotere cover-art op de kaarten.

---

## 5. Performance — code-splitting

| | Vóór | Na |
|---|---|---|
| Initiële JS (gzip) | ~489 KB | **~214 KB** |
| `recharts` | in hoofdbundle | aparte chunk (~114 KB), laadt enkel op Statistieken |
| `xlsx` | in hoofdbundle | aparte chunk (~141 KB), laadt enkel bij import/export |

- Alle zware pagina's via `React.lazy` + `Suspense`.
- `xlsx` dynamisch geïmporteerd in `importExcel.js`.
- Eerste schermlading (login → home) meer dan gehalveerd — vooral merkbaar op mobiel.

---

## 6. frontend-design skill geïnstalleerd

De officiële **frontend-design** skill van Anthropic (`anthropics/skills`) staat nu
in `.claude/skills/frontend-design/` (project-level, in git → blijft behouden in deze
ephemere omgeving en is deelbaar). Oproepbaar via `/frontend-design` in een nieuwe sessie.

---

## 7. Datamodel & Firestore-rules

### Nieuwe/uitgebreide velden
```
users/{uid}
  + collectionLabel: string           (bv. 'dario' — bepaalt welke records "van jou" zijn)
  + collectionVisibility: 'public' | 'private'   (default 'public')

records/{id}
  + ownerUid: string | null           (Firebase uid; null voor legacy/geïmporteerd)
  owner: string                       (label, behouden)

wishlist/{id}
  + ownerUid: string | null

collectionGrants/{id}                 (NIEUW)
  granterUid, granteeUid, canRead, canWrite, grantedAt
```

### Firestore-rules (`firestore.rules`)
- `users` **read**: geactiveerde gebruikers mogen elkaars profiel lezen
  (owner-selectie + browsing); eigen profiel + admin altijd.
- `users` **update**: een gebruiker mag zijn eigen profiel bijwerken (pincode,
  collectionLabel, zichtbaarheid, naam) maar **nooit zijn eigen `role`** (admin wel).
- **`collectionGrants`**: read voor geactiveerde gebruikers; create/delete enkel
  door de granter (of admin).

---

## 8. Nieuwe bestanden

| Bestand | Doel |
|---|---|
| `src/pages/Profile.jsx` | Profiel + zichtbaarheid + toegangsbeheer + browsen |
| `src/hooks/useUsers.js` | Lijst van alle gebruikers (gecachet) |
| `src/hooks/useGrants.js` | Beheer van collectionGrants + `canViewCollection()` |
| `src/hooks/useOwnerOptions.js` | Owner-opties voor formulieren |
| `src/utils/owners.js` | `ownerLabelOf`, `isOwnRecord`, `buildOwnerOptions` |
| `src/firebase/lookup.js` | Client-wrapper voor `lookupRelease` |
| `src/components/records/BarcodeScanner.jsx` | Barcode-scanner (BarcodeDetector) |
| `src/components/ui/Icon.jsx` | SVG line-iconenset + vinyl-logo |
| `.claude/skills/frontend-design/` | Geïnstalleerde skill |

---

## 9. Wat jij nog moet doen

1. **Deploy** — push deze branch naar `main` (of merge). De GitHub Action zet
   hosting + rules + de nieuwe function automatisch live op
   <https://vinylvault-7b7f5.web.app>. Fonts laden runtime, dus de nieuwe look zie
   je pas na deploy.
2. **`collectionLabel` instellen** (eenmalig) voor jou en Papa via **Profiel**, zodat
   de geïmporteerde records (`owner: 'dario'/'papa'`) als "van jullie" herkend worden.
   *(Home valt automatisch terug op je weergavenaam, dus als die "Dario" is werkt het al.)*
3. **Discogs-token (optioneel)** — zonder werkt MusicBrainz al. Voor Discogs-resultaten:
   maak een token op <https://www.discogs.com/settings/developers>, zet
   `DISCOGS_TOKEN=...` in `functions/.env` (gitignored) en deploy de functions.

---

## 10. Bekende beperkingen

- **Private-collectie afdwinging is UI-niveau, niet DB-niveau.** Records zijn op
  Firestore-niveau leesbaar voor élke geactiveerde gebruiker (bestaande regel
  `read: if isActivated()`). De privé/grant-logica wordt in de UI afgedwongen —
  passend voor een kleine familie-app. Echte DB-afdwinging zou een herstructurering
  van de records-leesregels vergen (op `ownerUid`), wat de legacy-records raakt.
- **Bundel ~693 KB** initieel (grotendeels Firebase, app-breed nodig). Verder
  opsplitsen kan, maar levert weinig op omdat Firebase vroeg nodig is.
- **iOS Safari** ondersteunt de barcode-scanner niet → handmatige invoer blijft daar.

---

## 11. Commit-overzicht

```
fc69a5e  Iconen: resterende emoji vervangen door SVG line-icons
56e4f5e  Perf: code-splitting — initiele bundle 1585KB -> 693KB
2dce042  Redesign: 'Warm Hi-Fi' visuele identiteit
f2bb28f  Installeer officiële Anthropic frontend-design skill (project-level)
efac08b  Docs + legacy fallback collectionLabel naar displayName
37170b9  Phase 3: metadata-lookup (Discogs/MusicBrainz) + barcode scanner
a5be64e  Phase 2E: profielpagina met collectie-zichtbaarheid en browse-permissies
7755c9f  Phase 2F: gemengde collectie-view in Alle Platen
75bf79c  Phase 2D: persoonlijke Home met eigen collectie + toggle
bdba77f  Phase 2C: owner-architectuur met ownerUid en collectionLabel
```
