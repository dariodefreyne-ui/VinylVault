# VinylVault — Volledige stand van zaken

**Branch:** `claude/phase-2-3-continuation-gDrzS`
**Datum:** juni 2026
**Status:** gemerged naar `main` en gedeployd (Phase 2/3 + redesign + ronde 2-verfijningen
behalve de allerlaatste statistieken/tracklist-PR).

Dit document beschrijft de volledige stand van zaken na de doorontwikkeling bovenop
Phase 1, inclusief de verfijningsronde (zie §13).

---

## Inhoud

1. [Samenvatting in één oogopslag](#1-samenvatting-in-één-oogopslag)
2. [Phase 2 — Persoonlijke collecties & permissies](#2-phase-2--persoonlijke-collecties--permissies)
3. [Phase 3 — Metadata-lookup & barcode scanner](#3-phase-3--metadata-lookup--barcode-scanner)
4. [Redesign — "Warm Hi-Fi"](#4-redesign--warm-hi-fi)
5. [PWA — installeerbaar & schermvullend](#5-pwa--installeerbaar--schermvullend)
6. [Service worker — offline & snel herladen](#6-service-worker--offline--snel-herladen)
7. [Performance — code-splitting](#7-performance--code-splitting)
8. [Datamodel & Firestore-rules](#8-datamodel--firestore-rules)
9. [Nieuwe bestanden](#9-nieuwe-bestanden)
10. [Wat jij nog moet doen](#10-wat-jij-nog-moet-doen)
11. [Bekende beperkingen](#11-bekende-beperkingen)
12. [Commit-overzicht](#12-commit-overzicht)

---

## 1. Samenvatting in één oogopslag

| Domein | Status |
|---|---|
| Eigen collectie per gebruiker (familie-app) | ✅ klaar |
| Persoonlijk dashboard + "toon alle collecties" | ✅ klaar |
| Profiel: collectie-label + zichtbaarheid (publiek/privé) | ✅ klaar |
| Browse-permissies (grants) | ✅ klaar (UI-niveau, zie beperkingen) |
| Gemengde collectie-view (meerdere eigenaren) | ✅ klaar |
| Metadata automatisch ophalen (Discogs/MusicBrainz) | ✅ klaar |
| Barcode scannen (cross-device, ook iPhone) | ✅ klaar |
| Visuele redesign "Warm Hi-Fi" | ✅ klaar |
| Installeerbaar als app + schermvullend (geen adresbalk) | ✅ klaar |
| Offline openen + snel herladen (service worker) | ✅ klaar |
| Snellere eerste lading (code-splitting) | ✅ klaar |
| Bulk metadata aanvullen voor hele collectie | ✅ klaar (§13) |
| Node 22 runtime + nieuwste functions-deps | ✅ klaar (§13) |
| Import: barcode/catalogusnummer + heropladen zonder duplicaten | ✅ klaar (§13) |
| Bezoekers-/kioskmodus (touch & swipe) | ✅ klaar (§13) |
| Tracklist automatisch aanvullen | ✅ klaar (§13) |
| Statistieken: totale waarde + aankoopwaarde | ✅ klaar (§13) |
| PWA-icoon (zichtbaar) | ✅ klaar (§13) |

---

## 2. Phase 2 — Persoonlijke collecties & permissies

Van een single-user app naar een **familie-app** waar elke gebruiker zijn eigen
collectie, dashboard en zichtbaarheid heeft — zonder de bestaande (geïmporteerde)
records te breken.

### 2C — Owner-architectuur (non-destructief)
- Records & wishlist-items dragen nu **`ownerUid`** (Firebase uid) naast het bestaande
  **`owner`**-label. Legacy records houden `ownerUid: null` en blijven werken.
- Nieuwe gebruikers krijgen bij registratie automatisch `collectionLabel`
  (= weergavenaam) en `collectionVisibility: 'public'`.
- **Owner-selector dynamisch** in `RecordForm`/`WishlistForm` (gebruikers + legacy labels).
- **Bug opgelost:** het formulier sloeg de prijs op als `price` terwijl KPI's/stats
  `purchasePrice` lezen → handmatig toegevoegde platen stonden op €0. Nu consistent.

### 2D — Persoonlijke Home
- "Welkom, {naam}", KPI's tonen je **eigen** platen en waarde.
- Eigen recentste platen via `isOwnRecord()` (match op `ownerUid` of `collectionLabel`).
- Toggle **"Toon alle collecties" / "Toon mijn collectie"**.
- Valt terug op `displayName` als `collectionLabel` nog niet is ingesteld.

### 2E — Profiel & browse-permissies
- Nieuwe pagina **`/profiel`**: weergavenaam, `collectionLabel`, zichtbaarheid
  (`public`/`private`).
- **`collectionGrants`**-collectie + `useGrants` hook: toegang geven/intrekken per gebruiker.
- Andere collecties bladeren met permissiecheck (publiek of via grant).

### 2F — Gemengde collectie-view
- In **Alle Platen** meerdere eigenaren tegelijk selecteerbaar → gecombineerde view
  (bv. Dario + Papa). "Alles" wist de selectie.

---

## 3. Phase 3 — Metadata-lookup & barcode scanner

### Metadata automatisch ophalen
- **Cloud Function `lookupRelease`**: zoekt op barcode, catalogusnummer of artiest/titel.
  - **Discogs** als `DISCOGS_TOKEN` geconfigureerd is.
  - Valt terug op **MusicBrainz + Cover Art Archive** (gratis, geen token nodig).
- In het plaat-formulier: knop **"Metadata ophalen"** vult **lege velden** aan
  (artiest, titel, label, jaar, land, genres, cover…). Overschrijft niets dat al ingevuld is.

**Bestaande platen aanvullen:** open een plaat → **Bewerken** → *Metadata ophalen*
(of *Scan barcode*) → **Opslaan**. Zoeken op barcode/catalogusnummer is het meest
precies; op enkel artiest+titel kan een verkeerde persing terugkomen.

### Barcode scannen — cross-device
- Vervangen van de browser-native `BarcodeDetector` (enkel Android Chrome) door
  **ZXing** (`@zxing/browser`): werkt nu óók op **iOS Safari**, Android en desktop.
- **Lazy geladen**: de scan-library zit in een aparte chunk en laadt pas wanneer je
  de scanner opent — geen impact op de eerste lading.
- Beperkt tot EAN/UPC, met richtkader-overlay en duidelijke camera-foutmeldingen.
- Vereist HTTPS (productie = Firebase Hosting = HTTPS) en cameratoestemming.

---

## 4. Redesign — "Warm Hi-Fi"

Concept: een analoge platenspeler in dark mode — warm en karaktervol, rustig voor de ogen.

- **Typografie:** Fraunces (display-serif) + Hanken Grotesk (body) via Google Fonts.
  Titels (h1–h3) en KPI-cijfers in de display-font.
- **Palet:** warm houtskoolzwart, **messing/amber** hoofdaccent, **terracotta** pop,
  crèmekleurige tekst (vervangt het koele Material-grijs).
- **Sfeer:** warme radiale gloed + fijne filmkorrel i.p.v. platte kleur.
- **Motion:** zachte staggered fade-in op grids, page-entrance, hover-lift met gloed,
  draaiend vinyl-logo. Respecteert `prefers-reduced-motion`.
- **Iconen:** eigen SVG line-set (`Icon.jsx`) vervangt **alle** emoji in de hele UI.
- **Consistentie:** `ownerColor()` als enige bron van waarheid (loste op dat dezelfde
  eigenaar per scherm een andere kleur kreeg), zichtbare focus-ring, warme scrollbar/selectie,
  grotere cover-art.
- De officiële **frontend-design** skill van Anthropic staat in
  `.claude/skills/frontend-design/` (project-level, in git).

---

## 5. PWA — installeerbaar & schermvullend

Reden: de adresbalk verdwijnt enkel in **standalone** modus (geïnstalleerd vanaf het
beginscherm). In een gewone browsertab blijft de adresbalk altijd zichtbaar.

- **`public/manifest.webmanifest`**: `display: standalone`, naam, thema-/achtergrondkleur `#141110`.
- **App-iconen**: warme vinyl-plaat (192 / 512 / maskable / apple-touch),
  gegenereerd met `scripts/generate-icons.mjs`.
- **iOS meta-tags** (`apple-mobile-web-app-capable`, status-bar-stijl, titel).
- **Safe-area** op de mobiele topbalk (`viewport-fit=cover` + `env(safe-area-inset-top)`)
  zodat de balk netjes onder de notch/statusbalk staat.

**Installeren (na deploy):** iPhone Safari → deelknop → *Zet op beginscherm* → openen via
het icoon. Android Chrome → menu → *App installeren*.

---

## 6. Service worker — offline & snel herladen

`public/sw.js`, geregistreerd in `main.jsx` (enkel productie):

| Verzoek | Strategie | Effect |
|---|---|---|
| Navigatie (app openen) | network-first → fallback gecachete `index.html` | opent **offline** |
| Eigen assets (`/assets/*`) | cache-first (hash-immutable) | **snel herladen** |
| Iconen / manifest / fonts | stale-while-revalidate | direct uit cache |
| Google Fonts | stale-while-revalidate | fonts offline |
| Firebase / Firestore / Storage / Auth | **niet aangeraakt** | altijd live data, geen auth-issues |

- **Updates** worden automatisch opgepikt; de app herlaadt één keer netjes bij een nieuwe
  versie (geen herlaad-lus, geen herlaad bij eerste installatie).
- `firebase.json`: `/sw.js` krijgt `no-cache` zodat je nooit op een oude SW blijft hangen.
- Cache-versie staat op `vv-v1`; bump deze (bv. `vv-v2`) om bij een grote update alle
  caches te forceren wissen.

---

## 7. Performance — code-splitting

| | Vóór | Na |
|---|---|---|
| Initiële JS (gzip) | ~489 KB | **~214 KB** |
| `recharts` | in hoofdbundle | aparte chunk (~114 KB), enkel op Statistieken |
| `xlsx` | in hoofdbundle | aparte chunk (~141 KB), enkel bij import/export |
| `ZXing` (scanner) | n.v.t. | aparte chunk (~140 KB), enkel bij scannen |

- Alle zware pagina's via `React.lazy` + `Suspense`; `xlsx` en de scanner-library
  dynamisch geïmporteerd. Eerste schermlading meer dan gehalveerd.

---

## 8. Datamodel & Firestore-rules

### Velden
```
users/{uid}
  + collectionLabel: string            (bepaalt welke records "van jou" zijn)
  + collectionVisibility: 'public'|'private'   (default 'public')

records/{id}
  + ownerUid: string | null            (null voor legacy/geïmporteerd)
  owner: string                        (label, behouden)

wishlist/{id}
  + ownerUid: string | null

collectionGrants/{id}                  (NIEUW)
  granterUid, granteeUid, canRead, canWrite, grantedAt
```

### Rules (`firestore.rules`)
- `users` **read**: geactiveerde gebruikers mogen elkaars profiel lezen; eigen + admin altijd.
- `users` **update**: zelf je profiel bijwerken (pincode, label, zichtbaarheid, naam) maar
  **nooit je eigen `role`** (admin wel).
- **`collectionGrants`**: read voor geactiveerde gebruikers; create/delete enkel door de granter (of admin).

---

## 9. Nieuwe bestanden

| Bestand | Doel |
|---|---|
| `src/pages/Profile.jsx` | Profiel + zichtbaarheid + toegangsbeheer + browsen |
| `src/hooks/useUsers.js` | Lijst van alle gebruikers (gecachet) |
| `src/hooks/useGrants.js` | Beheer van collectionGrants + `canViewCollection()` |
| `src/hooks/useOwnerOptions.js` | Owner-opties voor formulieren |
| `src/utils/owners.js` | `ownerLabelOf`, `isOwnRecord`, `buildOwnerOptions` |
| `src/firebase/lookup.js` | Client-wrapper voor `lookupRelease` |
| `src/components/records/BarcodeScanner.jsx` | Barcode-scanner (ZXing) |
| `src/components/ui/Icon.jsx` | SVG line-iconenset + vinyl-logo |
| `public/manifest.webmanifest` | PWA-manifest |
| `public/icons/*` | App-iconen (192/512/maskable/apple-touch) |
| `public/sw.js` | Service worker |
| `scripts/generate-icons.mjs` | Iconen genereren (eenmalig, sharp) |
| `.claude/skills/frontend-design/` | Geïnstalleerde design-skill |
| `CHANGES_PHASE_2_3.md` | Dit document |

---

## 10. Wat jij nog moet doen

1. **Deploy** — push deze branch naar `main` (of merge). De GitHub Action zet hosting +
   rules + de nieuwe function live op <https://vinylvault-7b7f5.web.app>. Fonts, PWA en
   service worker werken pas ná deploy (HTTPS vereist).
2. **`collectionLabel` instellen** (eenmalig) voor jou en Papa via **Profiel**, zodat
   de geïmporteerde records (`owner: 'dario'/'papa'`) als "van jullie" herkend worden.
   *(Home valt terug op je weergavenaam, dus als die "Dario" is werkt het al.)*
3. **App installeren** op je gsm: Safari/Chrome → *Zet op beginscherm* → openen via het icoon
   (schermvullend, geen adresbalk).
4. **Discogs-token (optioneel)** — zonder werkt MusicBrainz al. Voor Discogs: token op
   <https://www.discogs.com/settings/developers>, `DISCOGS_TOKEN=...` in `functions/.env`
   (gitignored), functions deployen.

---

## 11. Bekende beperkingen

- **Private-collectie afdwinging is UI-niveau, niet DB-niveau.** Records zijn op Firestore
  leesbaar voor élke geactiveerde gebruiker (bestaande regel `read: if isActivated()`). De
  privé/grant-logica wordt in de UI afgedwongen — passend voor een kleine familie-app. Echte
  DB-afdwinging vergt een herstructurering van de records-leesregels (op `ownerUid`).
- **Bundel ~693 KB** initieel (grotendeels Firebase, app-breed nodig).
- **iOS Safari** scant prima via ZXing, maar moet wel via HTTPS draaien en cameratoestemming krijgen.

---

## 12. Commit-overzicht

```
185f1e8  PWA: service worker voor offline openen + snel herladen
8c48fdd  PWA: installeerbaar + schermvullend (standalone, geen adresbalk)
f6e5b09  Barcode-scanner cross-device via ZXing (werkt nu ook op iOS Safari)
917fe6c  Docs: wijzigingsoverzicht Phase 2 & 3 + redesign
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

---

## 13. Verfijningsronde (na eerste deploy)

Reeks aanpassingen op basis van gebruik in productie.

### Layout & PWA
- **Login/publieke pagina's** centreren correct (was links uitgelijnd); `100dvh` +
  `overflow-x: hidden` tegen "iets te groot" en doorscrollen op iPhone.
- **Mobiel menu** sluit nu zodra je op een nav-item klikt.
- **App-icoon** opnieuw ontworpen: donkere plaat op een **warm amber-veld** met licht
  label → goed zichtbaar op een donker beginscherm (was donker-op-donker).

### Platform
- **Node 22** runtime voor de Cloud Functions; `firebase-functions` 5→7.2.5,
  `firebase-admin` 12→13.10.0. CI op `setup-node@22`. Deploy met `--force` (cleanup policy).
- **Discogs-token via CI**: optioneel GitHub-secret `DISCOGS_TOKEN` → automatisch naar
  `functions/.env` bij deploy.

### Import (Excel)
- Veel bredere kolomherkenning: barcode/ean/upc/streepjescode, **catalogusnummer**,
  land, conditie, uitgavejaar, en `username`→eigenaar. Barcode/catalogusnummer zichtbaar
  in de preview.
- **Heropladen zonder duplicaten of verlies:** bestaande lp's worden herkend (op barcode
  **of** artiest+titel+eigenaar) en standaard **aangevuld** (enkel lege velden, bv.
  barcode), of optioneel overgeslagen. Zo vul je achteraf barcodes in bestaande records.

### Metadata
- **Reprints**: apart **`releaseYear`** (persing) naast `year` (origineel uit Discogs-master).
- **`matchedBy`** in de lookup-respons → melding toont waarop gevonden is (barcode/
  catalogusnummer/artiest+titel).
- **Tracklist** wordt nu opgehaald én opgeslagen (formulierveld + bulk-aanvulling).
- **"Metadata aanvullen"** (`EnrichModal`): loopt de hele collectie af en vult ontbrekende
  cover/genres/jaar/tracklist in (enkel lege velden), gespreid, met voortgang.

### Statistieken
- **Totale waarde** = effectief alles. Nieuwe **Totale aankoopwaarde** telt cadeaus
  (notitie bevat "cadeau"/"kado"/…) en eigenaar `papa` niet mee.

### Bezoekers-/kioskmodus (`/kiosk`)
- Schermvullend (achter login, geen zijbalk/pincode), **touch & swipe** door grote
  cover-art, met zoeken, **eigenaar- en genrefilter**, sortering **"Recent aangekocht"**,
  en een **"Verras me"**-knop (willekeurige lp).

### Detailpagina
- Info-tab toont nu **alle opgeslagen velden** in **inklapbare secties** (standaard
  ingeklapt): Algemeen / Persing & uitgave / Aankoop.

### Consistentie
- "plaat"→"lp" en "platen"→"lp's" in de volledige UI (routes ongewijzigd).
- Eigenaar-namen hoofdletterongevoelig samengevoegd ("Dario" = "dario").
- Alle resterende emoji vervangen door SVG line-icons.

> **Functions-deploy:** Firebase slaat ongewijzigde functions over ("No changes
> detected"). Dat is normaal en betekent dat de gedeployde versie gelijk is aan de
> code op `main` — de reprint-/`matchedBy`-logica is dus live. Een functions-redeploy
> gebeurt automatisch zodra `functions/index.js` wijzigt.
