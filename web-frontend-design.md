# Web Frontend Design Standards

> Companion to `web-app-framework.md`. That document covers data, logic, and architecture.
> This one covers design: tokens, typography, CSS structure, and visual consistency.
> When building any web project with a visual interface, read both.

---

## Why this exists

Design drift is a code quality problem. A site built without a token system accumulates
hardcoded hex values, one-off font sizes, and duplicate class names that do the same job
under different names. The result is a codebase where changing one color means a
find-and-replace across a dozen files — and you still miss some.

This standard prevents that. Every visual property that repeats across a site belongs in
one place. Components reference tokens. They never invent values.

The same principle that drives the 15-layer app framework applies here:
> Design the system before building the components. Never bolt it on later.

---

## The 6 design system layers

Every web project built to this standard includes all 6 layers before any component is written.

1. **Token foundation** — all design values defined as CSS custom properties in `globals.css`
2. **Typography scale** — a fixed set of sizes and weights; components pick from the scale
3. **Color system** — brand palette + semantic aliases + component tokens; no hardcoded hex values
4. **Component token groups** — per-component variables scoped in globals, not in module files
5. **Global base styles** — reusable classes (buttons, utilities) defined once in globals
6. **Variable lookup rule** — the enforcement mechanism that keeps the system intact

---

## Layer 1 — Token foundation

### What it is
A single CSS file (`globals.css` or `tokens.css`) that defines every repeating design value
as a named custom property. All other CSS files reference these tokens — never raw values.

### The rule
> No hardcoded hex value, font-family string, font-size literal, or font-weight number
> anywhere in a component CSS file. All values come from tokens.

### What belongs in globals
- Font family tokens
- Typography scale (sizes + weights + line heights)
- Core brand palette
- Background colors
- Text colors
- Border colors and alpha variants
- Semantic aliases (what a color *means*, not what it *is*)
- Component token groups (buttons, cards, badges, etc.)
- Layout constants (max-width, nav height, spacing scale)
- Theme overrides (`[data-theme="light"]` or `[data-theme="dark"]`)

### What does not belong in globals
- Styles unique to one component (those live in the component's `.module.css`)
- Hardcoded values of any kind — if a value repeats, it's a token; if it's truly unique,
  it still uses tokens for its properties

### File structure
```
src/
  app/
    globals.css       ← all tokens + base styles + global utility classes
  components/
    Nav/
      Nav.module.css  ← references globals tokens only, no raw values
    FishCard/
      FishCard.module.css
```

### globals.css section order
Organize in this order so the token dependency chain is always readable top to bottom:

```
1.  Font tokens
2.  Typography scale
3.  Core palette (fixed brand colors)
4.  Backgrounds
5.  Text
6.  Borders
7.  Nav (theme-independent)
8.  Semantic aliases
9.  Component tokens — Buttons
10. Component tokens — Cards
11. Component tokens — Section blocks
12. Component tokens — Badges & labels
13. Component tokens — [additional groups as needed]
14. Fixed data colors (e.g. rarity/tier — never theme-switched)
15. Misc layout tokens
16. Theme overrides [data-theme="light"] or [data-theme="dark"]
17. Reset & base
18. Typography base styles
19. Global utility classes (buttons, eyebrow, caption, etc.)
20. Layout utilities
21. Scrollbar
```

---

## Layer 2 — Typography scale

### The rule
> A fixed scale of sizes and weights is defined once. Components pick from the scale.
> No component invents a size. If a size isn't on the scale, the scale needs a new step —
> not a one-off value.

### Standard scale
```css
:root {
  /* Size scale — rem values, named by role */
  --fs-xs:   0.68rem;   /* badges, eyebrow labels, tiny metadata */
  --fs-sm:   0.76rem;   /* captions, secondary metadata, small chips */
  --fs-base: 0.88rem;   /* body copy, descriptions, list items */
  --fs-md:   1rem;      /* card names, subheadings, modal titles */
  --fs-lg:   1.2rem;    /* card values, section subheads */
  --fs-xl:   1.5rem;    /* nav logo, h3 headings */
  --fs-2xl:  2rem;      /* h2 headings */
  --fs-3xl:  clamp(2rem, 5vw, 3.5rem); /* hero h1 — fluid */

  /* Weight scale */
  --fw-regular: 400;
  --fw-medium:  600;
  --fw-bold:    700;
  --fw-black:   800;

  /* Line heights */
  --lh-tight:  1.2;   /* headings */
  --lh-normal: 1.6;   /* body default */
  --lh-loose:  1.75;  /* descriptive copy, prose */
}
```

### Font family tokens
```css
:root {
  --font-display: 'YourDisplayFont', sans-serif;  /* headings, logo, display text */
  --font-body:    'YourBodyFont', sans-serif;     /* all other text */
}
```

Two families maximum. If one family works for everything, use one. Never type a
font-family string directly in a component rule — always reference the token.

### Base heading styles
Apply scale tokens to HTML elements globally so components inherit correct sizing:

```css
h1, h2, h3, h4 {
  font-family: var(--font-display);
  line-height: var(--lh-tight);
  color: var(--text-hi);
}

h1 { font-size: var(--fs-3xl); }
h2 { font-size: var(--fs-2xl); }
h3 { font-size: var(--fs-xl);  }
h4 { font-size: var(--fs-lg);  }

p {
  color: var(--text-mid);
  font-size: var(--fs-base);
  line-height: var(--lh-loose);
}
```

---

## Layer 3 — Color system

### Three tiers of color tokens

**Tier 1 — Core palette (brand primitives)**
Fixed hex values. Never theme-switched. These are what your brand colors *are*.

```css
:root {
  --color-primary:   #hex;   /* main brand accent */
  --color-secondary: #hex;   /* secondary accent */
  --color-cta:       #hex;   /* call-to-action color */
}
```

**Tier 2 — Semantic tokens (theme-switched)**
What a color *means* in context. These change between themes. Components use these —
never Tier 1 directly (unless the value never changes between themes).

```css
:root {
  /* Backgrounds */
  --page-bg:     #hex;
  --card-bg:     #hex;
  --card-bg-alt: #hex;
  --nav-bg:      #hex;
  --footer-bg:   #hex;

  /* Text */
  --text-hi:       #hex;   /* primary content */
  --text-mid:      #hex;   /* secondary content */
  --text-low:      #hex;   /* placeholders, subtle labels */
  --text-disabled: #hex;   /* inactive elements */

  /* Borders */
  --border:         var(--color-cta);
  --border-card:    rgba(...);   /* subtle card edges */
  --border-card-hi: rgba(...);   /* hover/focus state */

  /* Semantic aliases */
  --accent:         var(--color-primary);
  --section-header: var(--color-secondary);
  --cta:            var(--color-cta);
}
```

**Tier 3 — Component tokens**
Specific values scoped to a component type. These point to Tier 1 or Tier 2 tokens —
never to raw hex values. Covered in Layer 4.

### Theme overrides
Dark mode as default, light as override (or reverse — match the project):

```css
[data-theme="light"] {
  /* Override only what changes */
  --page-bg:  #hex;
  --card-bg:  #hex;
  --text-hi:  #hex;
  --text-mid: #hex;
  /* etc. */
}
```

### Fixed colors (never theme-switched)
Some values are data identity, not UI chrome — game rarity colors, status colors,
brand partner colors. These go in `:root` and are never overridden in theme blocks.

```css
:root {
  /* Example: game rarity colors */
  --rarity-common:   #hex;
  --rarity-rare:     #hex;
  --rarity-epic:     #hex;
  /* etc. */
}
```

### Border alpha scale
Never hand-type `rgba(0,144,184,0.15)` repeatedly. Define a small alpha scale:

```css
:root {
  --border-card:    rgba(PRIMARY_RGB, 0.08);   /* subtle edges */
  --border-card-hi: rgba(PRIMARY_RGB, 0.18);   /* hover/active edges */
  --border-section: rgba(SECONDARY_RGB, 0.15); /* section dividers */
}
```

---

## Layer 4 — Component token groups

### What it is
Before building a component, define a token group for it in `globals.css`. This is the
contract between globals and the module file. The module file references these tokens —
it doesn't set values.

### Why this matters
Without component tokens, the same value gets set independently in every component that
uses it. The first time you need to change it, you find it in six places. Component tokens
collapse that to one.

### Button tokens (always present)
```css
:root {
  /* Primary button */
  --btn-primary-bg:         var(--color-primary);
  --btn-primary-bg-hover:   var(--color-secondary);
  --btn-primary-text:       #hex;
  --btn-primary-text-hover: #hex;

  /* Secondary button */
  --btn-secondary-bg:           transparent;
  --btn-secondary-bg-hover:     var(--color-primary);
  --btn-secondary-text:         var(--color-primary);
  --btn-secondary-text-hover:   #hex;
  --btn-secondary-border:       var(--color-primary);

  /* Shared shape */
  --btn-font-size:   var(--fs-base);
  --btn-font-weight: var(--fw-bold);
  --btn-padding:     0.65rem 1.5rem;
  --btn-radius:      8px;
  --btn-transition:  background 0.15s ease, color 0.15s ease,
                     border-color 0.15s ease, transform 0.1s ease;
}
```

### Card tokens
```css
:root {
  --card-radius:  14px;
  --card-padding: 1.5rem;
  --card-shadow:  0 2px 16px rgba(0, 0, 0, 0.35);

  --info-card-bg:          var(--card-bg-alt);
  --info-card-border:      var(--border-card);
  --info-card-val-color:   var(--accent);
  --info-card-label-color: var(--text-low);
}
```

### Badge & label tokens
```css
:root {
  --eyebrow-font-size:      var(--fs-xs);
  --eyebrow-font-weight:    var(--fw-black);
  --eyebrow-color:          var(--text-low);
  --eyebrow-letter-spacing: 0.07em;
}
```

### Pattern: adding a new component token group
When you need a new component type, add its token group to globals *before* writing
the component's module CSS. Follow this format:

```css
/* ── Component tokens — [ComponentName] ── */
:root {
  --[component]-bg:      var(--card-bg);
  --[component]-border:  var(--border-card);
  --[component]-radius:  var(--card-radius);
  --[component]-color:   var(--text-hi);
  /* etc. */
}
```

---

## Layer 5 — Global base styles

### What belongs here
Styles for elements that appear across multiple components, defined once in globals so
they're never duplicated:

**Buttons** — Two classes defined in globals, used directly in JSX/HTML:
```css
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-body);
  font-size: var(--btn-font-size);
  font-weight: var(--btn-font-weight);
  padding: var(--btn-padding);
  border-radius: var(--btn-radius);
  border: 2px solid transparent;
  cursor: pointer;
  transition: var(--btn-transition);
  white-space: nowrap;
}

.btn-primary { background: var(--btn-primary-bg); color: var(--btn-primary-text); }
.btn-primary:hover { background: var(--btn-primary-bg-hover); color: var(--btn-primary-text-hover); }

.btn-secondary { background: var(--btn-secondary-bg); color: var(--btn-secondary-text); border-color: var(--btn-secondary-border); }
.btn-secondary:hover { background: var(--btn-secondary-bg-hover); color: var(--btn-secondary-text-hover); }

/* Size modifiers */
.btn--sm { font-size: var(--fs-sm); padding: 0.4rem 1rem; }
.btn--lg { font-size: var(--fs-md); padding: 0.85rem 2rem; }

/* Disabled — both types */
.btn-primary:disabled,
.btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
```

**Typography utilities:**
```css
.eyebrow {
  font-size: var(--eyebrow-font-size);
  font-weight: var(--eyebrow-font-weight);
  color: var(--eyebrow-color);
  letter-spacing: var(--eyebrow-letter-spacing);
  text-transform: uppercase;
}

.caption {
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  color: var(--text-low);
}
```

**Layout utilities:**
```css
.page-wrap {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  flex: 1;
}
```

### What does not belong here
Any style that is specific to one component. If `.fish-card` only appears in
`FishCard.module.css`, it stays there. The test: does this class appear in more
than one component? If yes, it belongs in globals.

---

## Layer 6 — Variable lookup rule

### The enforcement mechanism
This is what keeps the system intact as the project grows. Apply it on every new
component, every new CSS rule, every Claude Code session.

**Before writing any value in a `.module.css` file:**
1. Check `globals.css` first
2. Match by *meaning*, not just name — if a token semantically fits, use it even
   if the name isn't identical
3. A local CSS variable is only justified if the value is genuinely unique to that
   one component with no global equivalent
4. If a local variable is needed, name it descriptively and comment why it's local

**Signs the rule is being violated:**
- A hex value appears in a `.module.css` file
- A font-family string appears in a `.module.css` file
- Two different class names have identical CSS properties
- A variable is defined in a module file that matches the meaning of a globals token
- The same component token appears in more than one module file

### The CLAUDE.md instruction
Add this to every web project's CLAUDE.md so Claude Code applies the rule in every session:

```md
### Variable lookup rule
Before writing any value in a `.module.css` file:
1. Check `globals.css` first — use the global token if one exists,
   even if the name isn't identical
2. A local CSS variable is only justified if the value is genuinely unique
   to that component with no global equivalent
3. No hardcoded hex values, font-family strings, font-size literals, or
   font-weight numbers in any `.module.css` — all values come from tokens
```

---

## Audit process

When inheriting a project or identifying drift in an existing one, run this audit
before touching any code. The output becomes the source of truth for the cleanup.

### Phase 1 — Element inventory
Scan the CSS file(s) and produce a table per category:
Typography · Buttons · Cards · Navigation · Layouts · Form Controls · Badges · Section Blocks

For each class list: font-size, font-weight, color, background.

### Phase 2 — Duplication flags
Identify pairs or groups where two class names have identical or near-identical properties.
For each: Class A, Class B, differing properties, suggested action:
- **Consolidate** — merge into one class
- **Base + modifier** — keep shared base, extract differences as modifiers
- **Keep separate** — genuinely different enough (document why)

### Phase 3 — Hardcoded value report
Every hex value, font-family string, font-size, or font-weight literal that appears
outside `:root` or a theme block. Categorize as:
- **3a** — hardcoded value that duplicates an existing variable (just replace with `var(...)`)
- **3b** — alpha variant of an existing color (add to border alpha scale)
- **3c** — unique value with no existing token (needs a new token)
- **3d** — font-family literals (replace with `--font-display` / `--font-body`)
- **3e** — font-size/weight with no scale (the entire scale is missing — add it)

### Phase 4 — Remediation order
1. Add any missing tokens to globals (scale, border alpha, new semantic tokens)
2. Replace all 3a hardcoded values with their existing variable
3. Replace all 3b alpha variants with border scale variables
4. Add new 3c tokens to globals, then replace the hardcoded values
5. Replace 3d font literals with font tokens
6. Consolidate duplicate classes (Phase 2 decisions)
7. Rename specificity-dependent overrides to explicit modifier classes

---

## Design theme documentation

Every project's CLAUDE.md should describe the design intent in plain language —
not hex values. Hex values go in `globals.css` and will be looked up from there.
CLAUDE.md describes what to *choose*, not what to type.

### Template: design theme block for CLAUDE.md
```md
### Design theme

[One sentence describing the overall visual mood and audience.]

- **[Primary color role]** — [what it's used for: headings, links, etc.]
- **[Secondary color role]** — [what it's used for: section headers, etc.]
- **[CTA color role]** — [one consistent role: CTAs and active states only]
- **[Fixed/data colors]** — [describe any colors that are identity, not UI chrome]

The design should feel [adjectives]. It should not feel [what to avoid].
```

### Why no hex values in CLAUDE.md
Hex values in the project guide go stale the first time a color is adjusted. They also
describe what to *type*, not what to *decide*. When Claude Code encounters a situation
the token map doesn't explicitly cover, it needs to know the intent — not the value —
to make the right choice.

---

## New project checklist

Before writing any component CSS, these must exist:

- [ ] `globals.css` created with all 6 layers
- [ ] Font families chosen, loaded (Google Fonts or local), and tokenized
- [ ] Typography scale defined (`--fs-*`, `--fw-*`, `--lh-*`)
- [ ] Core palette defined (`--color-*`)
- [ ] Background tokens defined and theme-switched
- [ ] Text tokens defined and theme-switched
- [ ] Border tokens and alpha scale defined
- [ ] Semantic aliases defined (`--accent`, `--section-header`, `--cta`, etc.)
- [ ] Button component tokens defined
- [ ] Card component tokens defined
- [ ] Any other recurring component types have token groups
- [ ] `.btn-primary` and `.btn-secondary` global classes written in globals
- [ ] Typography utility classes written (`eyebrow`, `caption`, etc.)
- [ ] `page-wrap` layout utility written
- [ ] Light/dark theme overrides in place
- [ ] Variable lookup rule added to project's CLAUDE.md
- [ ] Design theme description added to project's CLAUDE.md (no hex values)
- [ ] globals.css token map table added to project's CLAUDE.md

---

## Reference: CLAUDE.md token map table format

Copy this into the project's CLAUDE.md, updated with the actual section numbers
and token names for that project:

```md
### Token map (globals.css sections)

| # | Section | Key tokens |
|---|---------|------------|
| 1 | Font families | `--font-display`, `--font-body` |
| 2 | Type scale | `--fs-xs` → `--fs-3xl`, `--fw-regular` → `--fw-black` |
| 3 | Core palette | `--color-primary`, `--color-secondary`, `--color-cta` |
| 4 | Backgrounds | `--page-bg`, `--nav-bg`, `--card-bg`, `--card-bg-alt`, `--footer-bg` |
| 5 | Text | `--text-hi`, `--text-mid`, `--text-low`, `--text-disabled` |
| 6 | Borders | `--border`, `--border-card`, `--border-card-hi`, `--border-section` |
| 7 | Nav | `--nav-text`, `--nav-text-hi`, `--nav-text-active`, `--nav-height` |
| 8 | Semantic aliases | `--accent`, `--section-header`, `--cta` |
| 9 | Buttons | `--btn-primary-*`, `--btn-secondary-*`, `--btn-font-*`, `--btn-radius` |
| 10 | Cards | `--card-radius`, `--info-card-*` |
| 11+ | [Additional component groups] | [tokens] |
```

---

*This document is derived from real project work on befish.cc (September 2026).*
*When a new pattern is established in a web project, add it here.*
*Last updated: September 2026*
