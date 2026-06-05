# Security

Overzicht van bekende beveiligingsbevindingen en hoe ze op te volgen.
Laatst bijgewerkt: juni 2026.

## Afhankelijkheden — `npm audit`

### `xlsx` (SheetJS) — high — opvolgen
- **Advisories:** Prototype Pollution (GHSA-4r6h-8v6p-xvw6) + ReDoS (GHSA-5pgg-2g8v-p4x9).
- **Waarom npm geen fix heeft:** SheetJS publiceert sinds `0.18.5` niet meer naar de
  npm-registry, maar via de eigen CDN. De npm-versie blijft daardoor kwetsbaar.
- **Praktijkrisico voor VinylVault: laag.** `xlsx` parst enkel bij **import**, en die
  functie is afgeschermd voor rol *beheerder/admin* — enkel vertrouwde gebruikers kunnen
  een bestand uploaden. **Export** parst geen externe input. Er is geen publieke/anonieme
  parsing. Een exploit vereist dat een vertrouwde gebruiker bewust een kwaadaardig bestand
  uploadt, in de eigen browsersessie.
- **Fix (lokaal uitvoeren — onze CI-omgeving blokkeert de SheetJS-CDN, je eigen machine
  en de GitHub-runner niet):**
  ```bash
  npm install https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
  npm run build
  git add package.json package-lock.json
  git commit -m "Security: xlsx naar patched SheetJS-versie (0.20.3)"
  git push
  ```
  Daarna is `npm audit` (root) schoon. Controleer op <https://cdn.sheetjs.com/> of er een
  nieuwere versie dan 0.20.3 is.

### Cloud Functions — 9 moderate — geen actie nodig
- Allemaal **transitief en upstream**: `firebase-admin` → `@google-cloud/firestore` →
  `google-gax` → `uuid` / `teeny-request` / `retry-request`.
- We draaien al op de **nieuwste** `firebase-admin` (13.10.0); deze lossen op zodra Google
  die sub-dependencies bumpt. Server-side, moderate. `npm audit fix --force` zou de SDK
  kunnen breken → bewust laten staan.

## Toegangsmodel (ter herinnering)

- Records zijn op Firestore-niveau leesbaar voor élke **geactiveerde** gebruiker
  (`read: if isActivated()`). De privé/grant-logica voor collecties wordt in de **UI**
  afgedwongen, niet in de database-rules. Passend voor een kleine familie-app; voor harde
  afdwinging zouden de records-leesregels op `ownerUid` herschreven moeten worden.
- Een gebruiker kan zijn eigen profiel bijwerken maar **nooit zijn eigen rol** (rules).
- `deleteAuthUser` doet de admin-check **server-side** in de Cloud Function.

## Secrets

- `.env.local`, `.env`, `functions/.env` staan in `.gitignore` en horen **nooit** in git.
- GitHub Secrets in gebruik: `FIREBASE_SERVICE_ACCOUNT`, `ENV_FILE`, en optioneel
  `DISCOGS_TOKEN` (zie README).

## Een kwetsbaarheid melden

Stuur een e-mail naar de eigenaar (dario.de.freyne@gmail.com) i.p.v. een publieke issue
aan te maken.
