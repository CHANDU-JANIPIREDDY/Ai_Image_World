# UI/UX Design System — AI Image World

| | |
|---|---|
| **Document** | UI/UX Design Documentation & Wireframes |
| **Version** | 1.0 |
| **Date** | 19 June 2026 |
| **Prepared by** | Senior UI/UX Designer |
| **Style DNA** | Pinterest (masonry discovery) · Lexica (prompt-first detail) · Dribbble (polish) · Krea AI (dark, glassy, modern) |
| **Theme** | Dark-first, modern SaaS, glassmorphism |

---

## 1. Design Philosophy

**AI Image World** is a *discovery-first* product. The interface should feel like a premium, immersive gallery where the **image is the hero** and the UI dissolves into the background. Three principles guide every decision:

1. **Content over chrome** — Dark canvas, minimal borders, imagery edge-to-edge. UI elements use translucent glass so they float above content without stealing focus.
2. **Frictionless discovery** — Masonry grid, instant search, one-tap prompt copy. Every image is two clicks from inspiration to reuse.
3. **Calm, premium motion** — Subtle hover lifts, soft glows, smooth fades. Nothing jarring; everything intentional.

> **Mood:** A dark studio gallery at night — images glow against deep neutral surfaces, with a single electric accent guiding the eye.

---

## 2. Design System

### 2.1 Foundations overview
| Token group | Purpose |
|---|---|
| Color | Dark neutrals + single vibrant accent + semantic states |
| Typography | One geometric sans for UI + one mono for prompts |
| Spacing | 4px base scale (4/8/12/16/24/32/48/64) |
| Radius | Soft, generous (cards 16–24px, pills full) |
| Elevation | Glass blur + soft shadow + subtle border |
| Motion | 150–300ms ease-out; reduced-motion respected |

### 2.2 Spacing scale (4px base)
```
xs 4   sm 8   md 12   lg 16   xl 24   2xl 32   3xl 48   4xl 64
```
Used consistently for padding, gaps, and section rhythm. Grid gutter = 16px (desktop), 12px (mobile).

### 2.3 Corner radius
| Element | Radius |
|---|---|
| Image cards | 16px |
| Modals / panels | 24px |
| Buttons / inputs | 12px |
| Pills / tags / chips | 9999 (full) |
| Avatars | full |

### 2.4 Elevation & glassmorphism
The signature surface treatment. Glass panels (navbar, search bar, detail sidebar, admin cards):
```
background:        rgba(255,255,255, 0.04 – 0.08)
backdrop-filter:   blur(16–24px) saturate(140%)
border:            1px solid rgba(255,255,255, 0.08)
shadow:            0 8px 32px rgba(0,0,0, 0.40)
```
| Level | Use | Treatment |
|---|---|---|
| E0 | Page canvas | Flat, no shadow |
| E1 | Cards | Subtle border + soft shadow |
| E2 | Glass nav / search | Blur + border + shadow |
| E3 | Modals / popovers | Stronger blur + larger shadow + accent ring on focus |

### 2.5 Iconography
- **Library:** Lucide / Phosphor (thin, consistent stroke ~1.5px).
- Outline icons by default; filled only for active states.
- Size scale: 16 / 20 / 24px.

### 2.6 Motion
| Interaction | Effect | Duration |
|---|---|---|
| Card hover | Scale 1.02 + lift + image zoom 1.05 (masked) | 200ms ease-out |
| Button hover | Bg lighten + soft accent glow | 150ms |
| Modal open | Fade + scale 0.96→1 | 250ms |
| Copy success | Toast slide-up + checkmark morph | 200ms |
| Skeleton load | Shimmer sweep | 1200ms loop |
- Respect `prefers-reduced-motion` → cross-fades only, no transforms.

---

## 3. Color Palette

### 3.1 Dark theme (primary)
| Token | Hex | Use |
|---|---|---|
| `bg/base` | `#0A0A0F` | App background (near-black, slight blue) |
| `bg/surface` | `#13131A` | Cards, raised sections |
| `bg/elevated` | `#1B1B24` | Popovers, hover surfaces |
| `glass/fill` | `rgba(255,255,255,0.05)` | Glass panels |
| `glass/border` | `rgba(255,255,255,0.08)` | Glass & card borders |
| `text/primary` | `#F4F4F6` | Headlines, primary text |
| `text/secondary` | `#A1A1AD` | Body, labels |
| `text/muted` | `#6B6B78` | Captions, placeholders |

### 3.2 Accent & gradient
| Token | Hex | Use |
|---|---|---|
| `accent/primary` | `#7C5CFF` | Primary buttons, links, active nav (electric violet) |
| `accent/secondary` | `#2DD4BF` | Secondary highlights, success-ish accents (teal) |
| `accent/hover` | `#9277FF` | Hover state |
| `gradient/brand` | `linear-gradient(135deg,#7C5CFF,#2DD4BF)` | Hero text, logo, CTA glows |
| `gradient/glow` | `radial-gradient(#7C5CFF33, transparent)` | Ambient background glows behind hero/cards |

> **Why violet→teal:** echoes Krea/Lexica's energetic-but-premium feel; high contrast on near-black, distinctive vs. typical blue SaaS.

### 3.3 Semantic states
| Token | Hex | Use |
|---|---|---|
| `success` | `#34D399` | Confirmations, "Copied!" |
| `warning` | `#FBBF24` | Scheduled status, alerts |
| `danger` | `#F87171` | Delete, errors |
| `info` | `#60A5FA` | Neutral notices |

### 3.4 Status badges (image lifecycle)
| Status | Fill | Text |
|---|---|---|
| Draft | `#6B6B78` (muted) | light |
| Published | `#34D399` (success) | dark |
| Scheduled | `#FBBF24` (warning) | dark |

### 3.5 Contrast & accessibility
- Body text on `bg/base` meets **WCAG AA** (≥ 4.5:1).
- Accent on dark passes AA for large text/UI; never use accent for long body copy.
- Focus ring: 2px `accent/primary` + 2px offset on all interactive elements.

---

## 4. Typography

### 4.1 Typefaces
| Role | Font | Rationale |
|---|---|---|
| UI / Display | **Inter** (or Geist) | Geometric, neutral, excellent at all sizes; SaaS-standard clarity |
| Prompts / code | **JetBrains Mono** (or IBM Plex Mono) | Monospace signals "copyable text"; mirrors Lexica's prompt treatment |

### 4.2 Type scale
| Token | Size / Line | Weight | Use |
|---|---|---|---|
| Display | 48 / 56 | 700 | Hero headline |
| H1 | 36 / 44 | 700 | Page titles |
| H2 | 28 / 36 | 600 | Section titles ("Trending") |
| H3 | 22 / 30 | 600 | Card titles, modal headers |
| Body-L | 18 / 28 | 400 | Lead paragraphs |
| Body | 16 / 24 | 400 | Default text |
| Body-S | 14 / 20 | 400 | Secondary, table text |
| Caption | 12 / 16 | 500 | Labels, meta, tags |
| Mono | 14 / 22 | 400 | Prompt text |

### 4.3 Rules
- Headlines: tight tracking (-0.02em); body: default.
- Hero headline may use `gradient/brand` as text fill.
- Prompt blocks always mono, in a glass container with the copy button.
- Max line length for prompts/body: ~72ch for readability.

---

## 5. Layout Structure

### 5.1 Responsive breakpoints
| Name | Width | Masonry columns |
|---|---|---|
| Mobile | < 640px | 2 |
| Tablet | 640–1024px | 3 |
| Desktop | 1024–1440px | 4 |
| Wide | > 1440px | 5 |

- Container max-width: 1440px, centered, 24px side padding (16px mobile).
- Masonry: CSS columns / library, 16px gutter, lazy-loaded, progressive blur-up on load.

### 5.2 Public layout regions
```
┌───────────────────────────────────────────────┐
│  Glass Navbar (sticky, blur)                    │  ← E2
├───────────────────────────────────────────────┤
│  [Hero / Search]                                │
│  [Featured Categories — pill row]               │
│  [Trending — horizontal scroll / grid]          │
│  [Latest — masonry grid (infinite scroll)]      │
├───────────────────────────────────────────────┤
│  Footer                                         │
└───────────────────────────────────────────────┘
```

### 5.3 Admin layout regions
```
┌──────────┬────────────────────────────────────┐
│          │  Glass Topbar (search, profile)     │
│ Sidebar  ├────────────────────────────────────┤
│ (fixed)  │  Page content (cards / table / form)│
│          │                                     │
└──────────┴────────────────────────────────────┘
```

---

## 6. Homepage Wireframe

```
╔═══════════════════════════════════════════════════════════════════╗
║  ◆ AI Image World        [ Home  Categories  Trending ]   🔍  [☾]  ║  ← glass navbar (sticky)
╠═══════════════════════════════════════════════════════════════════╣
║                                                                     ║
║        ✦ ambient violet→teal glow ✦                                ║
║                                                                     ║
║            Discover AI Art & the Prompts Behind It                  ║  ← Display, gradient text
║         Explore thousands of AI images. Copy any prompt.            ║  ← Body-L, secondary
║                                                                     ║
║      ┌─────────────────────────────────────────────────────┐      ║
║      │ 🔍  Search images, styles, prompts…           [ ⏎ ] │      ║  ← glass search (E2), large
║      └─────────────────────────────────────────────────────┘      ║
║         #portraits  #fantasy  #3d  #anime  #logos  →                ║  ← quick tag pills
║                                                                     ║
╠═══════════════════════════════════════════════════════════════════╣
║  Featured Categories                                                ║  ← H2
║  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            ║
║  │ img  │ │ img  │ │ img  │ │ img  │ │ img  │ │ img  │   →scroll   ║  ← glass category cards
║  │Fantasy│ │Portrait│ │ 3D  │ │Anime│ │Logos│ │Nature│            ║     w/ label overlay
║  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘            ║
╠═══════════════════════════════════════════════════════════════════╣
║  🔥 Trending Now                                   [ View all → ]   ║  ← H2 + link
║  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                          ║
║  │ 🖼  │ │ 🖼  │ │ 🖼  │ │ 🖼  │ │ 🖼  │     → horizontal scroll  ║  ← image cards, hover lift
║  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                          ║
╠═══════════════════════════════════════════════════════════════════╣
║  ✨ Latest Images                                                   ║  ← H2
║  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                                  ║
║  │ 🖼  │ │ 🖼  │ │ 🖼  │ │ 🖼  │     ← MASONRY (4 col desktop)    ║
║  ├─────┤ └─────┘ ├─────┤ └─────┘     varying heights              ║
║  │ 🖼  │ ┌─────┐ │ 🖼  │ ┌─────┐                                  ║
║  └─────┘ │ 🖼  │ └─────┘ │ 🖼  │     infinite scroll ↓           ║
║  ┌─────┐ └─────┘ ┌─────┐ └─────┘                                  ║
║  │ 🖼  │ ┌─────┐ │ 🖼  │ ┌─────┐                                  ║
╠═══════════════════════════════════════════════════════════════════╣
║  Footer · About · Categories · Privacy · © AI Image World          ║
╚═══════════════════════════════════════════════════════════════════╝
```

**Image card (hover) anatomy**
```
┌───────────────────┐
│                   │
│      image        │ ← zoom 1.05 on hover, masked by radius
│                   │
│ ░░ glass overlay ░│ ← fades in bottom-up
│ Title        👁 1.2k│ ← title + view count
│ [📋 Copy prompt]   │ ← quick-copy on hover
└───────────────────┘
```

---

## 7. Image Detail Wireframe

Two-column on desktop (image left, info panel right); stacked on mobile. The info panel is a **glass sidebar**.

```
╔═══════════════════════════════════════════════════════════════════╗
║  ◆ AI Image World   ← Back to gallery                     🔍  [☾]  ║
╠═══════════════════════════════════════════════════════════════════╣
║                                          ┌────────────────────────┐ ║
║   ┌──────────────────────────────┐       │  GLASS INFO PANEL  E3  │ ║
║   │                              │       │                        │ ║
║   │                              │       │  Cosmic Dreamscape     │ ║ ← H2 title
║   │         HERO IMAGE           │       │  Category: Fantasy ›   │ ║ ← link pill
║   │     (full res, contained)    │       │  👁 12.4k   📋 3.1k     │ ║ ← view & copy stats
║   │                              │       │                        │ ║
║   │                              │       │  ── PROMPT ──────────  │ ║ ← Caption label
║   │                              │       │ ┌────────────────────┐ │ ║
║   └──────────────────────────────┘       │ │ mono prompt text   │ │ ║ ← glass mono block
║                                          │ │ "a surreal cosmic  │ │ ║
║   [ ⤓ Download ]  [ ⇗ Share ]            │ │  dreamscape, neon… │ │ ║
║                                          │ │                    │ │ ║
║                                          │ │   [ 📋 Copy Prompt]│ │ ║ ← primary accent btn
║                                          │ └────────────────────┘ │ ║   → toast "Copied!"
║                                          │                        │ ║
║                                          │  ── NEGATIVE PROMPT ─  │ ║
║                                          │ ┌────────────────────┐ │ ║
║                                          │ │ blurry, low quality│ │ ║ ← collapsible mono
║                                          │ └────────────────────┘ │ ║
║                                          │                        │ ║
║                                          │  Tags: #neon #cosmic   │ ║ ← pills
║                                          │  AI Tool: Midjourney   │ ║ ← source badge
║                                          │  Published: Jun 2026   │ ║ ← meta
║                                          └────────────────────────┘ ║
╠═══════════════════════════════════════════════════════════════════╣
║  More like this                                                     ║  ← H2 (related, same category)
║  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    masonry row            ║
║  │ 🖼  │ │ 🖼  │ │ 🖼  │ │ 🖼  │ │ 🖼  │                          ║
║  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                          ║
╚═══════════════════════════════════════════════════════════════════╝
```

**Interaction notes**
- **Copy Prompt** = primary accent button with glow; on click → checkmark morph + "Copied!" toast + `promptCopyCount` increments.
- Prompt block has a hover copy icon too (like Lexica).
- Negative prompt collapsed by default to keep panel calm.
- View count increments on page load; sticky panel on scroll (desktop).
- Background uses a blurred, darkened version of the hero image as ambient backdrop.

---

## 8. Admin Dashboard Wireframe

### 8.1 Dashboard (overview)
```
╔═══════════╦═══════════════════════════════════════════════════════╗
║  ◆ AIW    ║  Search…                              🔔   ◯ Admin ▾   ║ ← glass topbar
║           ╠═══════════════════════════════════════════════════════╣
║ ▣ Dashboard║  Dashboard                                             ║ ← H1
║ ▦ Images   ║                                                        ║
║ ⬚ Categories║ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      ║
║ 📈 Analytics║ │Total    │ │Today    │ │This Mo. │ │Images   │      ║ ← analytics cards
║ ⚙ Settings ║ │Visitors │ │Visitors │ │Visitors │ │Published│      ║   (glass, accent
║           ║ │ 248,910 │ │  3,204  │ │ 71,540  │ │  1,284  │      ║    icon + ▲ trend)
║           ║ │  ▲ 12%  │ │  ▲ 4%   │ │  ▲ 9%   │ │  +18    │      ║
║           ║ └─────────┘ └─────────┘ └─────────┘ └─────────┘      ║
║           ║                                                        ║
║           ║ ┌───────────────────────────┐ ┌────────────────────┐ ║
║           ║ │ Visitors (30 days)        │ │ Top Categories     │ ║
║           ║ │   ╭╮      ╭─╮             │ │ Fantasy   ████ 32% │ ║ ← area chart
║           ║ │  ╭╯╰─╮ ╭─╯  ╰╮   line/    │ │ Portrait  ███ 24%  │ ║   + bar list
║           ║ │ ╭╯   ╰─╯     ╰─ area glow │ │ 3D Art    ██ 18%   │ ║
║           ║ │                           │ │ Anime     ██ 14%   │ ║
║           ║ └───────────────────────────┘ └────────────────────┘ ║
║           ║                                                        ║
║           ║ ┌───────────────────────────────────────────────────┐ ║
║           ║ │ Most Viewed Images                                │ ║
║           ║ │ ┌──┐ Cosmic Dreamscape   Fantasy   👁12.4k  📋3.1k│ ║ ← mini table
║           ║ │ ┌──┐ Neon City          3D Art    👁 9.8k  📋2.2k│ ║   w/ thumbnails
║           ║ │ ┌──┐ Forest Spirit      Fantasy   👁 8.1k  📋1.9k│ ║
║           ║ └───────────────────────────────────────────────────┘ ║
╚═══════════╩═══════════════════════════════════════════════════════╝
```

### 8.2 Images — list + upload form
```
╔═══════════╦═══════════════════════════════════════════════════════╗
║ Sidebar   ║  Images                              [ + Add Image ]   ║ ← H1 + primary CTA
║           ║  🔍 Filter…   Status ▾  Category ▾  Sort ▾             ║ ← toolbar
║           ║ ┌───────────────────────────────────────────────────┐ ║
║           ║ │ ☐ │Thumb│ Title         │Category│Status   │Views │ ║ ← DataTable
║           ║ │ ☐ │ 🖼 │ Cosmic Dream  │Fantasy │●Publish │12.4k │ ║   status badge
║           ║ │ ☐ │ 🖼 │ Neon City     │3D Art  │●Draft   │  0   │ ║   row actions ⋯
║           ║ │ ☐ │ 🖼 │ Sky Temple    │Fantasy │●Schedule│  —   │ ║   (edit/delete)
║           ║ └───────────────────────────────────────────────────┘ ║
║           ║                          ‹ 1 2 3 … 12 ›                ║ ← pagination
╚═══════════╩═══════════════════════════════════════════════════════╝

  ── Add / Edit Image (slide-over glass panel, E3) ──────────────────
  ┌─────────────────────────────────────────────────────────────────┐
  │  Add Image                                              ✕        │
  │ ┌───────────────────┐   Title         [____________________]     │
  │ │   ⤓ Drag & drop   │   Slug (auto)   [____________________]     │
  │ │   or click to     │   Category      [ Fantasy        ▾ ]      │
  │ │   upload          │   Tags          [ #neon #cosmic +  ]      │
  │ │  (Cloudinary)     │   Prompt        [ mono textarea     ]      │
  │ │  [preview thumb]  │   Negative      [ mono textarea     ]      │
  │ └───────────────────┘   Source AI     [ Midjourney    ▾ ]      │
  │   SEO Title    [______]  Status  ( Draft | Published | Sched )   │
  │   SEO Desc     [______]  Schedule at [ date/time ]  ☐ Featured   │
  │                                                                   │
  │                         [ Cancel ]   [ Save Image ]  ← accent     │
  └─────────────────────────────────────────────────────────────────┘
```

### 8.3 Categories — management
```
╔═══════════╦═══════════════════════════════════════════════════════╗
║ Sidebar   ║  Categories                       [ + Add Category ]   ║
║           ║ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        ║
║           ║ │ [thumb] │ │ [thumb] │ │ [thumb] │ │ [thumb] │        ║ ← glass cards
║           ║ │ Fantasy │ │ Portrait│ │ 3D Art  │ │  Anime  │        ║
║           ║ │ 312 imgs│ │ 248 imgs│ │ 190 imgs│ │ 156 imgs│        ║ ← imageCount
║           ║ │ ✏  🗑   │ │ ✏  🗑   │ │ ✏  🗑   │ │ ✏  🗑   │        ║ ← edit/delete
║           ║ └─────────┘ └─────────┘ └─────────┘ └─────────┘        ║
╚═══════════╩═══════════════════════════════════════════════════════╝
```

**Admin design notes**
- Sidebar: fixed, dark glass, accent highlight + left bar on active item; icons + labels; collapsible to icons-only.
- Analytics cards: glass, accent-tinted icon chip, big number, trend delta (green ▲ / red ▼).
- Charts: dark grid, gradient-filled area/line in `accent/primary`, soft glow; tooltips on glass.
- Forms: slide-over panels (not full page) for quick add/edit; inline validation; prompt fields mono.
- Delete: confirmation modal; warn if category contains images (per DB design guard).

---

## 9. Component States (key UX details)

| Component | States covered |
|---|---|
| Image card | default · hover (lift+zoom+overlay) · loading (skeleton/blur-up) · focus ring |
| Copy button | idle · hover (glow) · success ("Copied!" + check) · error |
| Search bar | empty (placeholder) · typing (debounced) · results · no-results (EmptyState) |
| Buttons | primary · secondary · ghost · destructive · disabled · loading (spinner) |
| Inputs | default · focus (accent ring) · error (danger ring + msg) · disabled |
| Status badge | draft (muted) · published (green) · scheduled (amber) |
| Toast | success · error · info — glass, top-right, auto-dismiss |

---

## 10. Accessibility & Responsiveness Checklist

- [ ] All text meets WCAG AA contrast on dark surfaces.
- [ ] Visible focus rings on every interactive element (accent, 2px + offset).
- [ ] Masonry grid reflows 5→4→3→2 columns across breakpoints.
- [ ] Detail page stacks (image → panel) on mobile; copy button stays thumb-reachable.
- [ ] Admin tables become scrollable cards / horizontal scroll on small screens.
- [ ] `prefers-reduced-motion` disables transforms, keeps fades.
- [ ] All images have alt text (from title); icons have aria-labels.
- [ ] Keyboard: search focus shortcut, grid arrow-nav, modal focus trap + Esc to close.
- [ ] Light theme deferred (dark-first) — tokens structured to allow it later.

---

## 11. Deliverables Summary

| Deliverable | Status |
|---|---|
| Design System (tokens, spacing, radius, elevation, motion) | ✅ §2 |
| Color Palette (dark, accent, semantic, badges) | ✅ §3 |
| Typography (faces, scale, rules) | ✅ §4 |
| Layout Structure (breakpoints, regions) | ✅ §5 |
| Homepage Wireframe | ✅ §6 |
| Image Detail Wireframe | ✅ §7 |
| Admin Dashboard Wireframe | ✅ §8 |
| Component states & a11y | ✅ §9–10 |

---

*End of Document — AI Image World UI/UX Design v1.0*
