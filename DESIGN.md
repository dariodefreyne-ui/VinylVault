---
name: VinylVault
description: A warm, dark, analog-feeling vinyl record collection manager.
colors:
  bg-primary: "#141110"
  bg-card: "#1c1815"
  bg-hover: "#262019"
  text-primary: "#f2ebdd"
  text-secondary: "#a89a85"
  border-color: "#312a22"
  brand: "#d9a05b"
  brand-strong: "#e7b06a"
  brand-text: "#1a1512"
  accent-red: "#cf6a4c"
  accent-blue: "#6f8f9c"
  accent-green: "#8aa46a"
  accent-orange: "#d9a05b"
typography:
  display:
    fontFamily: "Fraunces, Georgia, 'Times New Roman', serif"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Hanken Grotesk, system-ui, -apple-system, sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
  label:
    fontSize: "11px"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "14px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "28px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-text}"
    rounded: "{rounded.md}"
    padding: "9px 17px"
  button-secondary:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "9px 17px"
  button-danger:
    backgroundColor: "{colors.accent-red}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "9px 17px"
  chip-active:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-strong}"
    rounded: "{rounded.pill}"
    padding: "5px 13px"
  chip-inactive:
    backgroundColor: "{colors.bg-card}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.pill}"
    padding: "5px 13px"
  card-kpi:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.md}"
    padding: "15px 20px"
---

# Design System: VinylVault

## 1. Overview

**Creative North Star: "The Warm Hi-Fi"**

VinylVault is built for a small group of personal collectors logging and browsing their own vinyl, not for an anonymous SaaS audience. The system reads like an amber-lit listening room at night: a near-black charcoal base, warm brass/amber as the one dominant accent, terracotta and olive and dusty teal as quiet supporting colors, and a faint film-grain texture across every screen that signals analog media rather than a flat productivity tool. Typography pairs a serif display face for warmth and character with a clean grotesque for body text, so headings feel personal and curated while data stays legible.

This system explicitly rejects the generic SaaS dashboard: no gray flat cards, no gradient hero-metric tiles, no sterile enterprise-admin chrome. Depth and warmth come from tone, texture, and a single confident accent color, not from decoration.

**Key Characteristics:**
- Dark, warm-neutral base (`#141110`) with brass/amber (`#d9a05b`) as the sole dominant accent
- Subtle film-grain texture and soft radial glows for analog depth, never decorative gradients
- Fraunces serif for display, Hanken Grotesk for body and UI text
- Flat cards with hairline borders at rest; glow and lift only on hover/emphasis
- Stable owner-color hashing (red/blue/teal/olive) so each collector's records are recognizable at a glance without hardcoded names

## 2. Colors

The palette is a warm charcoal-and-brass system: one accent carries almost all color weight, with three muted secondary hues reserved for owner/category identification.

### Primary
- **Brass Amber** (`#d9a05b`): the brand color. Primary buttons, active chip states, focus rings, the warm glow shadow on emphasized actions. Also doubles as the "orange" owner/accent slot.
- **Brass Strong** (`#e7b06a`): lighter brass for active chip text and hover states where `brand` itself would sit on a tinted background.
- **Brass Text** (`#1a1512`): near-black text used on top of brass-colored buttons, for contrast.

### Secondary
- **Terracotta** (`#cf6a4c`, `accent-red`): danger actions, error toasts, and one of the four owner-identity colors. A sharp, warm pop against the charcoal base.
- **Dusty Teal** (`#6f8f9c`, `accent-blue`): info toasts and an owner-identity color. Deliberately muted, never bright cyan.
- **Olive Sage** (`#8aa46a`, `accent-green`): success toasts and an owner-identity color.

### Neutral
- **Charcoal Black** (`#141110`, `bg-primary`): page background, almost-black but warm rather than true neutral.
- **Warm Charcoal** (`#1c1815`, `bg-card`): card and surface background, one step lighter than the page.
- **Hover Charcoal** (`#262019`, `bg-hover`): interactive surface state, one step lighter than card.
- **Warm Cream** (`#f2ebdd`, `text-primary`): primary text, body content, headings.
- **Taupe** (`#a89a85`, `text-secondary`): secondary text, labels, captions.
- **Hairline Border** (`#312a22`, `border-color`): default card and chip borders at rest.

### Named Rules
**The One Accent Rule.** Brass amber is the only color allowed to dominate a screen. Terracotta, teal, and olive exist only as small, purposeful signals (owner identity, status, danger) — never as a competing primary.

**The Dim-Tint Rule.** When an accent needs a background instead of just a foreground (badges, active filters), use that accent at low opacity (`rgba(..., 0.14–0.16)`) over the dark base rather than a flat saturated fill. This is how `redDim`, `blueDim`, `greenDim`, `brandDim` work throughout the token set.

## 3. Typography

**Display Font:** Fraunces (with Georgia, Times New Roman fallback)
**Body Font:** Hanken Grotesk (with system-ui, -apple-system fallback)

**Character:** A warm, slightly editorial serif for headings against a clean, neutral grotesque for everything functional. The pairing should feel like a well-designed record sleeve, not a tech product.

### Hierarchy
- **Display** (600 weight, `clamp(20px, 5vw, 32px)` for KPI values up to 30px for page headings, letter-spacing `-0.01em`): page titles and the large numeric values inside KPI tiles.
- **Title** (600 weight, ~14px): card titles, button labels.
- **Body** (400–500 weight, 16px, line-height 1.5): default reading text, descriptions, list content.
- **Label** (600 weight, 11px, letter-spacing `0.08em`, uppercase): KPI labels, small metadata captions above values.

### Named Rules
**The Serif-for-Numbers Rule.** Display/serif typography is reserved for headings and the large numeric values in KPI tiles. Body copy, buttons, and form fields stay in Hanken Grotesk; mixing the serif into dense UI text breaks legibility.

## 4. Elevation

Flat by default, glow on emphasis. Cards and chips sit flat against the page with a 1px hairline border (`border-color`) at rest; there is no ambient shadow doing the work of separating surfaces from the background — tone (`bg-primary` → `bg-card` → `bg-hover`) carries that. Shadows appear only as a deliberate response to state: a hovered KPI tile lifts slightly with `translateY(-2px)`, primary buttons carry a warm brass glow, and floating elements (toasts, modals) get a real drop shadow because they're detached from the page surface.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgba(0,0,0,0.4)`): default resting shadow on cards, barely visible, mostly grounding.
- **Raised** (`box-shadow: 0 6px 22px rgba(0,0,0,0.45)`): floating surfaces — toasts, modals, anything detached from page flow.
- **Glow** (`box-shadow: 0 10px 30px rgba(217,160,91,0.18)`): the brass glow under primary buttons. The one place shadow carries brand color instead of pure black.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest, distinguished by tone, not shadow. Shadow is reserved for hover lift, the primary-button glow, and genuinely floating elements.

## 5. Components

### Buttons
- **Shape:** rounded corners (`10px`, `rounded.md`).
- **Primary:** brass background (`#d9a05b`), near-black text (`#1a1512`), brass glow shadow. Padding `9px 17px`.
- **Secondary:** card-background fill (`#1c1815`), cream text, hairline border.
- **Danger:** dimmed terracotta background (`rgba(207,106,76,0.16)`), terracotta text and border.
- **Ghost:** transparent, taupe text, no border.
- **Hover / Focus:** background and border transition over 0.18s; visible 2px brass focus ring with 2px offset on `:focus-visible`.

### Chips
- **Style:** fully rounded (`999px`), hairline border at rest.
- **Active state:** brass-dimmed background, brass-strong text, brass border, 600 weight.
- **Inactive state:** transparent background, taupe text, hairline border, 500 weight.

### Cards / KPI Tiles
- **Corner Style:** `10px` radius.
- **Background:** warm charcoal at rest, hover-charcoal with brass border on hover (when interactive).
- **Shadow Strategy:** flat `card` shadow at rest; lifts `translateY(-2px)` on hover for clickable tiles.
- **Border:** 1px hairline, switches to brass on hover for clickable tiles.
- **Internal Padding:** `15px 20px`.

### Toasts
- **Style:** card-background, accent-colored 1px border matching toast type (success/error/info), small accent dot, raised drop shadow.
- **Position:** fixed bottom-right, respecting safe-area insets.
- **Lifetime:** auto-dismiss after 4 seconds, click to dismiss early.

### Badges
- **Style:** pill-shaped, dimmed accent background, accent-colored text, accent-colored border at low opacity.

### Owner Color (signature pattern)
Each collector's display name is hashed deterministically to one of four accent colors (terracotta / dusty teal / olive / brass), so the same person always renders in the same color across every screen without hardcoding names. This is the visual mechanism behind "small-group trust" from PRODUCT.md: collections feel personally attributed, not assigned by an admin system.

## 6. Do's and Don'ts

### Do:
- **Do** keep brass amber (`#d9a05b`) as the only color allowed to dominate a screen.
- **Do** use tone steps (`bg-primary` → `bg-card` → `bg-hover`) to convey depth before reaching for shadow.
- **Do** pair Fraunces only with headings and large numeric values; keep dense UI text in Hanken Grotesk.
- **Do** use the dimmed-accent-background pattern (`rgba(accent, 0.14–0.16)`) for badges and active filter chips instead of flat saturated fills.
- **Do** keep the deterministic owner-color hash for any new per-person UI; never hardcode a person's color.

### Don't:
- **Don't** introduce gray flat cards or sterile enterprise-admin styling; this is the explicit anti-reference from PRODUCT.md.
- **Don't** use gradient hero-metric tiles or gradient text for KPI values; the serif numeral plus flat brass tint already carries emphasis.
- **Don't** add ambient shadows to every card "for depth"; depth comes from background tone, shadow is reserved for hover/floating states.
- **Don't** introduce a second saturated accent competing with brass amber for visual weight.
- **Don't** strip the film-grain texture or warm radial glow from the page background; it's the load-bearing detail that keeps the dark theme from feeling like generic SaaS dark mode.
