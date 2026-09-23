# Web Patterns — Decision Guide

> Companion to `web-app-framework.md` and `web-frontend-design.md`.
> Those documents tell you the rules. This one tells you which pattern to reach for
> when a specific situation comes up — and why.
>
> Format per entry:
> - **When this comes up** — the situation that triggers this decision
> - **The pattern** — what to use
> - **Why it fits** — the reasoning
> - **When NOT to use it** — the exceptions
> - **Reference** — real example from a project

---

## Table of Contents

1. [Filterable data grids — filter drawer + chip groups](#1-filterable-data-grids)
2. [Site-wide search — client-side fuzzy search index](#2-site-wide-search)
3. [Section navigation on long pages](#3-section-navigation-on-long-pages)
4. [Design tokens — globals before components](#4-design-tokens)
5. [Typography scale — define before building](#5-typography-scale)
6. [Button system — two globals, no per-component redefinition](#6-button-system)
7. [Component token groups — globals contract pattern](#7-component-token-groups)
8. [Border alpha scale — never hand-type rgba](#8-border-alpha-scale)
9. [Theme switching — semantic alias layer](#9-theme-switching)
10. [Font tokens — never repeat font-family strings](#10-font-tokens)
11. [Variable lookup rule — module CSS enforcement](#11-variable-lookup-rule)
12. [CSS audit — inheriting or cleaning up a stylesheet](#12-css-audit)
13. [Cross-platform design tokens — Style Dictionary](#13-style-dictionary)

---

## 1. Filterable data grids

**When this comes up:**
A page displays a large collection of cards or rows (30+) that users need to filter
by multiple dimensions (category, status, rarity, type) and sort by multiple fields.

**The pattern: filter drawer + chip groups + sort dropdown**

A single slim control bar contains:
- A prominent search input (always visible)
- A sort dropdown with explicit labels ("Growth — high to low", not a toggle button)
- A "Filters" button with a badge showing active filter count ("Filters (3)")

Clicking Filters opens a drawer:
- Slides in from the right on desktop
- Slides up from the bottom on mobile (native sheet pattern)
- Contains all filter dimensions as chip group toggles
- Contains compare/selection features if applicable
- Has "Clear all" and "Done" actions

Chip groups: small pill buttons per filter value, all selected by default.
Tapping one deselects it. Each group has a "Select all / Clear" shortcut.

**Why it fits:**
- One interaction pattern replaces 4+ scattered control rows
- Badge on the Filters button tells users at a glance that filters are active
- Mobile-native: bottom sheet is the expected pattern on touch devices
- Scales to any number of filter dimensions without crowding the page
- Sort as a dropdown eliminates hidden toggle behavior (click-to-flip-direction)

**When NOT to use it:**
- Fewer than 3 filter dimensions — a simple row of chips inline is fine
- The data is tabular (use a data table with column sort headers instead)
- Filters change so rarely that a settings page is more appropriate

**Reference:** befish.cc Fish Dex — 300 cards, 5 tier filters, 6 rarity filters,
4 sort options, compare mode, measured-only toggle. Previously scattered across
4 separate control rows. Redesigned to filter drawer in Phase 4.

---

## 2. Site-wide search

**When this comes up:**
A content-heavy site (wiki, documentation, knowledge base) where users need to find
a specific topic across multiple pages and sections, not just find a page by name.

**The pattern: client-side fuzzy search index (Fuse.js)**

Build a static search index in `lib/searchIndex.ts`:
```ts
type SearchEntry = {
  title: string;    // section title
  body: string;     // searchable text excerpt
  url: string;      // /page#anchor
  page: string;     // display name e.g. "Mechanics"
  section: string;  // subsection label
};
```

Use Fuse.js to search it client-side. Results grouped by page, matched term
highlighted in accent color. Search input lives in the nav bar — collapsed to
an icon/pill, expands on click or "/" keypress.

Results overlay shows:
- Grouped by page
- Section subtitle per result
- Matched term highlighted
- Max results capped by a config constant (e.g. `SEARCH_MAX_RESULTS = 7`)

The constant lives in `lib/searchConfig.ts` and mirrors a CSS comment token
in `globals.css` — CSS cannot drive JS, so both are kept in sync manually.

**Why it fits:**
- No backend needed — indexes your own content at build time
- Fuse.js is ~11KB, no API calls, instant results
- Anchor URLs (/mechanics#growth) jump directly to the section
- The index is built as you write pages — add entries per section as you go
- Ctrl+F still works (content is all on page, not hidden behind tabs)

**When NOT to use it:**
- Content changes frequently (daily) — consider Algolia or a backend search
- The site has user-generated content — client-side index will not stay current
- The site is primarily a product app, not content — in-app search is different

**Build it before the content pages:**
Search needs anchor IDs on every section. If you build pages first and add
search later, you revisit every page to add IDs and index entries. Build the
search component and index structure first, populate entries as each page is built.

**Reference:** befish.cc — search indexes How to Play (6 sections), Tips (6),
Mechanics (14). Built in Phase 2 before any content pages were written.
"/" keyboard shortcut follows Wikipedia convention.

---

## 3. Section navigation on long pages

**When this comes up:**
A single page has many named sections (8+) and users will land on it looking
for one specific section rather than reading top to bottom.

**Decision tree:**

```
Does the site have site-wide search?
YES → Does search cover this page's sections with anchor links?
      YES → Skip section nav entirely. Search handles it.
      NO  → Add sections to search index first, then re-evaluate.
NO  → How many sections?
      6 or fewer  → Table of contents block at top of page (static, no JS)
      7 to 12     → Sticky horizontal nav bar (see below)
      13 or more  → Group sections into 5-6 categories, sticky nav for categories
```

**Sticky horizontal nav bar (when needed):**
- Sits directly below the main nav, sticks on scroll
- Page title breadcrumb on left, section links on right
- Active link: accent-color underline indicator + subtle tinted background
- Mobile: horizontal scroll with fade indicator on right edge
- Tracks scroll position to update active link automatically
- Reusable component — build once, use on any long page

**The dated pattern to avoid:**
Floating sidebar that overlaps content. Fixed position, box shadow, visible at
all times. Common in early 2010s web design. Replaced by sticky horizontal bars
and site-wide search in modern implementations.

**Reference:** befish.cc Game Mechanics — 14 sections. Sticky nav planned then
dropped when site-wide search was confirmed to cover all 14 sections with anchor
links. Search made the component unnecessary.

---

## 4. Design tokens

**When this comes up:**
Starting any web project with a visual interface, or inheriting one where
color/font/spacing values are scattered across component files.

**The pattern: token foundation in globals.css before any component**

All design values defined as CSS custom properties in one file before any
component CSS is written.

Three-tier architecture:
- Tier 1 — Primitives: raw brand values (--color-cyan: #00f0de)
- Tier 2 — Semantic aliases: what a color means (--accent: var(--color-cyan))
- Tier 3 — Component tokens: scoped to a type (--btn-primary-bg: var(--accent))

The rule: no hardcoded hex values, font strings, font-size literals, or
font-weight numbers in any component CSS file. All values come from tokens.

See `web-frontend-design.md` for the full globals.css section order, token
taxonomy, and the complete 6-layer design system.

**Why it fits:**
- One file change cascades everywhere
- Theme switching is a block of overrides, not a hunt through 30 files
- Claude Code reads globals.css and knows every available token before
  writing a single component rule
- Prevents drift: same value hand-typed in 12 places

**Reference:** befish.cc — src/app/globals.css, 533 lines, 181 variables.
Established before any component was written. Audit of static site found the
same hex values repeated dozens of times across component files.

---

## 5. Typography scale

**When this comes up:**
Building globals.css (always), or auditing a site where font sizes are drifting
(0.86rem and 0.88rem doing the same job in different components).

**The pattern: fixed scale defined once, components pick from it**

```css
--fs-xs:   0.68rem;   /* badges, eyebrow labels */
--fs-sm:   0.76rem;   /* captions, metadata */
--fs-base: 0.88rem;   /* body copy */
--fs-md:   1rem;      /* subheadings, card names */
--fs-lg:   1.2rem;    /* section subheads, card values */
--fs-xl:   1.5rem;    /* h3, nav logo */
--fs-2xl:  2rem;      /* h2 */
--fs-3xl:  clamp(2rem, 5vw, 3.5rem);  /* hero h1, fluid */

--fw-regular: 400;
--fw-medium:  600;
--fw-bold:    700;
--fw-black:   800;
```

No component invents a size. If a needed size is not on the scale, add a step
to the scale — never add a one-off value in a component file.

Two font-family tokens only:
```css
--font-display: 'YourDisplayFont', sans-serif;
--font-body:    'YourBodyFont', sans-serif;
```

Never type a font-family string in a component CSS rule.

**Reference:** befish.cc — discovered during style audit that "font-family: Fredoka One"
appeared in 35 separate CSS rules. Replaced with var(--font-display) in one globals
entry, eliminating all 35 repetitions.

---

## 6. Button system

**When this comes up:**
Any web project that has more than one type of clickable action element.

**The pattern: two global classes, no per-component redefinition**

Define exactly two button classes in globals.css:
- .btn-primary — filled, high-contrast CTA
- .btn-secondary — outlined, same shape

With size modifiers: .btn--sm, .btn--lg

All button styling (color, padding, radius, transition) lives in globals.
Component module CSS files never redefine button colors, padding, or radius.
Use the classes directly in JSX/HTML:

```tsx
<a href="/fishdex" className="btn-primary">Browse Fish Dex</a>
<a href="/how-to-play" className="btn-secondary">How to Play</a>
```

**When NOT to use it:**
- A design system with 6+ button variants — then a proper component with
  variant props is justified
- Icon-only buttons with radically different sizing needs

**Reference:** befish.cc static site had .compare-action-btn--primary and
.profile-action-btn--primary as byte-for-byte identical CSS blocks. Next.js
rebuild uses .btn-primary and .btn-secondary globally — one definition, used everywhere.

---

## 7. Component token groups

**When this comes up:**
Before building any new component that will appear more than once on the site,
or when a component needs values that differ between themes.

**The pattern: define a token group in globals before writing the module CSS**

```css
/* globals.css — written before InfoCard.module.css */
:root {
  --info-card-bg:          var(--card-bg-alt);
  --info-card-border:      var(--border-card);
  --info-card-val-color:   var(--color-cyan);
  --info-card-label-color: var(--text-low);
}

[data-theme="light"] {
  --info-card-val-color: var(--color-orange);
  --info-card-border:    rgba(255, 170, 0, 0.25);
}
```

The module CSS file references these tokens — it does not set values.
This is the contract between globals and the component.

**Why it fits:**
- If the same property appears in more than one component (e.g. card border),
  it changes in one place
- The module CSS becomes a layout file, not a design file
- Theme switching is automatic — only globals needs updating
- InfoCard tokens were reused for boost cards, pass cards, and gem cards
  without any extra CSS

**Reference:** befish.cc — --info-card-bg, --info-card-border, --info-card-val-color
defined in globals section 10. Four different card types all use the same tokens,
so they all switch themes identically with zero per-component changes.

---

## 8. Border alpha scale

**When this comes up:**
Any time you are about to write rgba(0, 240, 222, 0.08) in a CSS file, or
you find the same rgba alpha value hand-typed in multiple places.

**The pattern: named alpha tokens in globals**

```css
:root {
  --border-card:    rgba(0, 240, 222, 0.08);
  --border-card-hi: rgba(0, 240, 222, 0.18);
  --border-section: rgba(170, 0, 255, 0.15);
}

[data-theme="light"] {
  --border-card:    rgba(255, 170, 0, 0.12);
  --border-card-hi: rgba(255, 170, 0, 0.28);
  --border-section: rgba(255, 170, 0, 0.15);
}
```

Switching themes = changing which RGB base the borders use. One change
cascades to every border in the site.

When a new alpha value is needed during component build (as happened during
Search and TipBox components), add a named token to globals rather than
hand-typing the rgba value in the component.

**Reference:** befish.cc style audit found rgba(0, 240, 222, 0.08) hand-typed
6 times across component files. During the Search component build, two new
tokens were added: --border-interactive and --border-interactive-hover.
During the TipBox build, --tip-box-bg was added. Each time, a token was added
rather than a raw value used.

---

## 9. Theme switching

**When this comes up:**
Any site with light and dark modes, or any two visual themes.

**The pattern: semantic alias layer + theme override block**

Never let components reference primitive colors directly for theme-sensitive
properties. Always go through a semantic alias:

```css
/* WRONG — component references primitive */
.title { color: var(--color-purple); }

/* RIGHT — component references semantic alias */
.title { color: var(--section-header); }

/* globals.css controls what --section-header means per theme */
:root                { --section-header: var(--color-purple); }
[data-theme="light"] { --section-header: var(--color-orange); }
```

Theme override block only overrides what changes. Fixed values (rarity colors,
brand colors, data colors) never appear in the theme override block.

Some elements intentionally resist theme switching. Give these their own token
group and document that they never get theme overrides:
```css
/* Nav — always dark in both themes */
:root {
  --nav-text: #8899bb;
  --nav-bg:   #04080f;
}
/* These never appear in [data-theme="light"] */
```

**An important design decision to document per project:**
Which colors are theme-independent (accent, interactive, brand) vs. which
switch between themes (primary UI color, section headers, CTA). Document this
explicitly in CLAUDE.md so every session starts with the same understanding.

befish.cc example:
- Cyan: theme-independent — interactive color in both themes
- Purple (dark) / Orange (light): primary UI color, switches between themes
- Orange: theme-independent CTA on the home page hero

**Reference:** befish.cc — --section-header switches purple to orange between
themes. --accent (cyan) intentionally stays the same in both. Documented in
CLAUDE.md design theme section after this distinction was discovered mid-build.

---

## 10. Font tokens

**When this comes up:**
Any project using custom fonts, or any audit where font-family strings appear
in component CSS.

**The pattern: two tokens, no exceptions**

```css
:root {
  --font-display: 'DisplayFont', sans-serif;
  --font-body:    'BodyFont', sans-serif;
}
```

Every CSS file uses only these two tokens. Never write a font-family string
in a component rule. Two families maximum.

**Reference:** befish.cc style audit — "font-family: Fredoka One, sans-serif"
appeared in 35 CSS rules. "font-family: Nunito, sans-serif" appeared in 28 more.
Both replaced with var(--font-display) and var(--font-body).

---

## 11. Variable lookup rule

**When this comes up:**
Every time you or Claude Code writes a value in a component CSS file.

**The pattern: check globals first, match by meaning not name**

Before writing any value in a .module.css file:
1. Open globals.css and check if a token exists for this value
2. Match by meaning, not just name — if semantics match, use the global token
   even if its name is not what you expected
3. A local CSS variable is only justified if the value is genuinely unique
   to that component with no global equivalent
4. No hardcoded hex values, font strings, size literals, or weight numbers

The anti-pattern to watch for: a variable invented locally that duplicates
a global token's meaning. Example: --nat-text defined in Nav.module.css when
--nav-text already exists in globals with the same value and intent.

Add this to every project's CLAUDE.md:
```md
### Variable lookup rule
Before writing any value in a .module.css file:
1. Check globals.css first — use the token if one exists
2. Match by meaning, not just name
3. Local variable only if genuinely unique to this component
4. No hardcoded hex, font strings, font-size literals, or font-weight numbers
```

**Reference:** befish.cc — Nav.module.css had `color: var(--nat-text)` where
--nat-text was never defined. The correct token was --nav-text, already in globals.
This broke nav link colors silently (resolved to nothing).

---

## 12. CSS audit

**When this comes up:**
Inheriting a project with organic CSS growth, or before starting a token system
on an existing site.

**The pattern: three-phase audit before touching any code**

Phase 1 — Element inventory by category:
Group every class by what it is, not where it lives. Categories: Typography,
Buttons, Cards, Navigation, Layouts, Badges, Sections. For each class list:
font-size, font-weight, color, background. This is where you spot classes
doing the same job under different names.

Phase 2 — Duplication flags:
Identify pairs where two class names have identical or near-identical properties.
For each pair, decide: Consolidate / Base+modifier / Keep separate (document why).

Phase 3 — Hardcoded value report:
Every hex, font string, font-size literal, or font-weight number outside :root
or a theme block. Categorize:
- 3a: Duplicates an existing variable — replace with var(...)
- 3b: Alpha variant of an existing color — add to border alpha scale
- 3c: Unique value with no token — add token to globals, then replace
- 3d: Font-family literals — replace with font tokens
- 3e: Font-size with no scale — the whole scale is missing, add it

Remediation order: add missing tokens, replace 3a, replace 3b, add and replace
3c, replace 3d, consolidate duplicates.

Output as a .md file in the repo with three sections matching the three phases.
Phase 2 as a decision table. Phase 3 as a table with a "suggested variable name"
column. This file becomes the source of truth for the cleanup work.

**Reference:** befish.cc — style-audit.md produced for style.css before the
Next.js rebuild. Identified 35 font-family repetitions, 6+ alpha value
repetitions, and multiple exact-duplicate class pairs. The audit directly
informed the entire globals.css token system for the rebuild.

---

## 13. Style Dictionary

**When this comes up:**
A project that needs the same design tokens on multiple platforms simultaneously
(web + iOS + Android, or web + React Native).

**The pattern: single JSON source, platform-specific outputs**

Define tokens once in JSON. Style Dictionary transforms them into CSS custom
properties, Swift UIColor, Android XML, JS constants, Figma JSON — whatever
each platform needs. One source, every platform stays in sync.

**When NOT to use it:**
- Web-only projects — globals.css is the right tool, Style Dictionary adds
  build complexity with no benefit for a single platform
- Prototypes

**When it becomes relevant:**
- A companion mobile app alongside the web version
- A design system shared between web and native
- A Figma-to-code workflow where tokens need to stay in sync with design files

The JSON source file looks almost identical to what is in globals.css for a
web project. Converting an existing token system to Style Dictionary is mostly
a reformatting exercise — the thinking is already done.

**Reference:** befish.cc is web-only. Noted as future consideration if a
mobile companion app is built.

---

*This document grows with real project work.*
*When a new pattern is discovered, add it here with a real project reference.*
*Last updated: September 2026 — patterns from befish.cc rebuild.*
