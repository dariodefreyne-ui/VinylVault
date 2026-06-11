---
name: brand-guidelines
description: VinylVault brand guidelines — apply the "Warm Hi-Fi" design system when building or styling any UI in this project. Use this skill whenever creating or modifying components, pages, or styles to ensure consistency with the established brand identity.
---

# VinylVault Brand Guidelines — "Warm Hi-Fi"

VinylVault is a personal vinyl record collection manager. Its visual identity evokes the warmth and tactility of analogue audio: warm charcoal backgrounds, brass/amber accents, fine film grain, and a serif/sans pairing that feels both editorial and refined.

**Always apply these guidelines when building or editing any UI in this project.**

---

## Color Palette

All colors are defined in `src/styles/tokens.js` and exposed as CSS custom properties via `setupTokens()`.

| Token | Hex | CSS var | Role |
|---|---|---|---|
| `bgPrimary` | `#141110` | `--bg-primary` | Page background (warm near-black) |
| `bgCard` | `#1c1815` | `--bg-card` | Card / panel background |
| `bgHover` | `#262019` | `--bg-hover` | Hover state for interactive surfaces |
| `textPrimary` | `#f2ebdd` | `--text-primary` | Body text (warm cream) |
| `textSecondary` | `#a89a85` | `--text-secondary` | Muted / supporting text (taupe) |
| `borderColor` | `#312a22` | `--border-color` | Subtle borders |
| `brand` | `#d9a05b` | `--brand` | Primary brand accent (brass/amber) |
| `brandStrong` | `#e7b06a` | — | Hover / emphasis on brand elements |
| `brandText` | `#1a1512` | — | Dark text on amber buttons |
| `accentRed` | `#cf6a4c` | `--accent-red` | Terracotta — errors, warnings, destructive |
| `accentBlue` | `#6f8f9c` | `--accent-blue` | Steel-teal — info, secondary badges |
| `accentGreen` | `#8aa46a` | `--accent-green` | Olive/sage — success states |

**Dim variants** (16% opacity) exist for badge/chip backgrounds: `redDim`, `blueDim`, `greenDim`, `orangeDim`, `brandDim`.

**Rules:**
- The amber `--brand` color is the dominant accent. Use it for primary CTAs, links, active states, focus rings, and highlights.
- Never use cold blues, neon purples, or high-saturation colors — everything must feel warm and analogue.
- The film grain and radial gradient glows on `body` are always present — don't add competing background treatments.

---

## Typography

| Role | Font | CSS var | Fallback |
|---|---|---|---|
| Display / headings | Fraunces | `--font-display` | Georgia, Times New Roman, serif |
| Body / UI | Hanken Grotesk | `--font-body` | system-ui, -apple-system, sans-serif |

Both fonts are loaded from Google Fonts. Always import them via the existing `<link>` in `index.html` — never swap them for Inter, Roboto, Arial, or any system default.

**Heading style** (`h1`, `h2`, `h3`):
- `font-family: var(--font-display)`
- `font-weight: 600`
- `letter-spacing: -0.01em`

**Page heading** (matches `pageHeading` token):
- `font-size: 30px`, `font-weight: 600`, `letter-spacing: -0.01em`, `margin-bottom: 28px`

---

## Spacing & Layout

| Token | Value | Use |
|---|---|---|
| `radius.sm` | `6px` | Input fields, small chips |
| `radius.md` | `10px` | Cards, buttons, modals |
| `radius.lg` | `14px` | Large panels, drawers |
| `pageLayout.padding` | `32px` | Page horizontal padding |
| `pageLayout.maxWidth` | `1100px` | Content max-width |

Use `src/styles/tokens.js` exports directly in inline styles or import values into CSS modules. Do not hardcode spacing values that conflict with the token scale.

---

## Components & Patterns

### Import tokens instead of hardcoding

```js
import { colors, fonts, radius, shadows, buttonStyle, badgeStyle, chipStyle } from '@/styles/tokens';
```

### Buttons

Use the `buttonStyle(variant)` helper from tokens:

| Variant | Appearance |
|---|---|
| `primary` | Amber fill (`--brand`), dark text, amber glow shadow |
| `secondary` | Card background, cream text, subtle border |
| `danger` | Terracotta tint background, terracotta text/border |
| `ghost` | Transparent, muted text |

Buttons always include `gap: 7px` for icon + label pairs and use the `transition` defined in `buttonStyle`.

### Badges

Use `badgeStyle(color)` with `'red' | 'blue' | 'green' | 'orange'`. Badges are pill-shaped (`border-radius: 999px`), 11px, weight 600, with a dim tint background and a faint border.

### Filter chips

Use `chipStyle(active)`. Active chips use `brandDim` background and `brandStrong` text; inactive chips are transparent with a muted border.

### Cards

```js
{
  backgroundColor: colors.bgCard,
  borderRadius: radius.md,
  border: `1px solid ${colors.borderColor}`,
  boxShadow: shadows.card,
}
```

Hoverable cards increase shadow to `shadows.raised` and shift `bgHover` on hover.

### Form inputs

```js
{
  backgroundColor: colors.bgCard,
  border: `1px solid ${colors.borderColor}`,
  borderRadius: radius.sm,
  color: colors.textPrimary,
  fontFamily: fonts.body,
}
```

Focus states use the global `:focus-visible` rule (2px solid `--brand`, offset 2px) — don't override it.

---

## Visual Effects

### Background atmosphere

The `body` has two fixed radial gradients applied in `index.css`:
- Top-right: amber glow `rgba(217,160,91,0.10)`
- Bottom-left: terracotta glow `rgba(207,106,76,0.08)`

These are always present. Don't add solid color blocks or competing gradients that obscure them.

### Film grain

A 4%-opacity SVG noise texture is layered over the entire viewport via `body::before`. It gives the UI an analogue, tactile feel. Never remove or suppress it.

### Shadows

| Token | Value | Use |
|---|---|---|
| `shadows.card` | `0 1px 2px rgba(0,0,0,0.4)` | Default card resting state |
| `shadows.raised` | `0 6px 22px rgba(0,0,0,0.45)` | Hover / elevated state |
| `shadows.glow` | `0 10px 30px rgba(217,160,91,0.18)` | Amber glow on primary buttons |

---

## Motion & Animation

Two utility classes are defined in `index.css`:

| Class | Effect |
|---|---|
| `.vv-in` | Single fade-up entrance (`opacity: 0 → 1`, `translateY(10px → 0)`, 0.5s ease) |
| `.vv-stagger` | Applies `.vv-in` to all direct children with staggered delays (0.03s increments, capped at 0.35s for child 9+) |

**Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` — a spring-like ease-out.

Apply `.vv-in` on page-level containers and `.vv-stagger` on grids and lists. Always respect `prefers-reduced-motion` — the CSS already disables these animations; don't add JS-driven motion that bypasses this.

---

## Icons

The project uses a custom SVG line-icon system defined in `src/components/ui/Icon.jsx` and `public/icons.svg`.

- **Never use emoji as UI icons.** Always use the `<Icon name="..." />` component.
- Stroke-based, 1.5px weight, consistent with the warm aesthetic.
- If a new icon is needed, add it to the SVG sprite in `public/icons.svg` and register it in `Icon.jsx`.

---

## Owner Colors

Use `ownerColor(label)` from tokens to assign a consistent badge color to a collection owner. The same owner always gets the same color, derived deterministically from their label string.

---

## What NOT to do

- Don't use Inter, Roboto, Arial, or system-ui as a display font.
- Don't use cold neon blues, bright purples, or high-saturation colors.
- Don't add solid white or light-mode backgrounds — VinylVault is dark-only.
- Don't add drop shadows with colored tints other than amber or black.
- Don't use emoji for icons; use the `<Icon>` component.
- Don't hardcode hex values — always reference tokens.
- Don't suppress the film grain or background glows.
- Don't add new fonts without updating both `index.html` (Google Fonts import) and `tokens.js`.
