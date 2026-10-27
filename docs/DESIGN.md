# Unfound — Design System
> Gallery-white walls, black type, one light-blue seal. Every screen should feel like a quiet room where nothing about you is on display.

**Theme:** light only
**Derived from:** the Clutch Security style reference (clutch.security), adapted for Unfound. Clutch gives us the structure: gallery-white canvas, mixed-weight grotesk headlines, 6px corners, 1px hairlines, no decorative shadows. Unfound adds its own touch: a raw 2D mark instead of 3D renders, a light-blue "seal" colour for protected data, and ciphertext shown as a design material.

This file is the single source of truth for the landing page (`/`) and the demo app (`/demo`). The CSS tokens in `src/styles.css` mirror it one-to-one. If the two disagree, fix the code.

---

## Brand

| Item | Value |
|------|-------|
| Name | **Unfound** (un·found). Wordmark is lowercase: `unfound` |
| Slogan | **Be reached, not found.** |
| Support line | Your address, held by no one. |
| Mark | "The pin with no point": a map-pin head drawn as an open arch with a dot inside. The point that would land on a location is missing. Read twice, it is also a doorway. |
| Mark geometry | 64×64 grid. Arch stroke 9 units, butt caps, centre dot r = 5.5. Flat Obsidian. No gradients, no shadows, no 3D. |
| Voice | Short, calm, factual. Say "survivor" in the product. Never show violence. Name what people can now do, not the security mechanism. |

---

## Tokens — Colors

Black, white, greys and light blue. Nothing else.

| Name | Value | Token | Role |
|------|-------|-------|------|
| Obsidian | `#000000` | `--color-obsidian` | All primary text, the mark, Filled Black buttons, DENIED badges, the primary chart series |
| Canvas | `#ffffff` | `--color-canvas` | Page background, card surfaces, text on dark fills |
| Fog | `#f9fafb` | `--color-fog` | Alternating section background, sidebar and log panels |
| Slate Mist | `#e5e7eb` | `--color-slate-mist` | Primary 1px hairline borders, table rows, chart tracks |
| Pewter | `#dfdfdf` | `--color-pewter` | Card edges, input outlines |
| Stone | `#c9c9c9` | `--color-stone` | Context series in charts, disabled fills |
| Graphite | `#6e6e6e` | `--color-graphite` | Secondary text, captions, sources |
| Lam Wash | `#e2eeff` | `--color-periwinkle-wash` | **Seal surface**: protected fields, SEALED badges |
| Lam Seal | `#8dbbff` | `--color-seal` | **Unfound's touch**: the light azure data colour. Highlight series in charts, the sealed-field stripe, unit-chart fills |
| Lam | `#3d8bff` | `--color-lam` | One primary CTA per page ("Try the prototype"), focus rings. Lighter than Clutch's `#004dff` by request. Never a chart colour |
| Rail | `#dfdfdf` | `--color-rail` | 0.5px vertical rails and section dividers (Clutch `border-gray-600`) |

**Rules**
- Charts use only Obsidian, Stone, Seal Blue and Slate Mist tracks. Light blue = the number we want you to remember.
- Status uses form and words, not red/green. **SEALED** = Periwinkle badge with lock glyph. **DENIED** = Obsidian badge, white text. **PENDING** = outlined Obsidian badge. **APPROVED** = Seal Blue badge.
- Lam appears at most once per screen.

---

## Tokens — Typography

| Role | Family | Clutch original | Weights |
|------|--------|-----------------|---------|
| Display / headings / eyebrows | **PP Radio Grotesk** if the licensed file is in `public/fonts/PPRadioGrotesk-Variable.ttf`, otherwise **Geist** (Google Fonts) | PP Radio Grotesk (Pangram Pangram, commercial) | 400, 500, 600 |
| UI / body | **Inter** (Google Fonts) | Inter | 400, 500, 700 |
| Ciphertext and logs | `ui-monospace, SFMono-Regular, Menlo, monospace` (system, not loaded) | — | 400 |

**Signature move (measured on clutch.security):** every heading is set at weight 600. Emphasis comes from colour, not weight: the hero sits in Stone `#c9c9c9` and one phrase at a time turns Obsidian (300 ms ease-in-out, cycling every 2.4 s). "What changes" uses the same gray-to-black, driven by scroll.

### Type scale

| Role | Size | Line height | Tracking | Token |
|------|------|-------------|----------|-------|
| caption / eyebrow | 10–12px uppercase | 1.3 | 0.14em | `--text-caption` |
| body | 16px | 1.5 | -0.02em | `--text-body` |
| subheading | 20px | 1.4 | -0.01em | `--text-subheading` |
| heading-sm | 26px | 1.3 | -0.01em | `--text-heading-sm` |
| heading | 38px | 1.2 | -0.01em | `--text-heading` |
| heading-lg | 56px | 1.1 | -0.01em | `--text-heading-lg` |
| display | 68px (clamps to 40px on phones) | 1.1 | -0.01em | `--text-display` |
| stat number | 56px display face 500, tabular | 1.0 | -0.02em | `--text-stat` |

---

## Spacing, shape, elevation

- Base unit 8px. Scale: 8, 16, 24, 32, 40, 48, 64, 80, 96.
- Page max-width 1200px. Section gap 80px (48px on phones). Card padding 24px. Element gap 16px.
- Radius 6px on cards, buttons, inputs, badges. The mark tile on the hero orbit is the only round element.
- Borders 1px Slate Mist or Pewter. Never 2px+.
- One shadow only: `rgba(0,0,0,0.16) 0 2px 6px` on hover of interactive cards.

---

## Components

**Nav header.** Canvas, sticky, hides on scroll down. Left: mark + wordmark. Centre: Inter 15px links separated by 1px Rail ticks, underline draws in on hover. Right: black "Open demo".

**Rails.** The content column is framed by 0.5px Rail lines left and right, and sections are separated by 0.5px Rail rules, as on clutch.security.

**Buttons (Clutch `button-primary`).** Black gradient `#191919 → #000`, shadow `0 2px 6px #00000029`, Inter 14px/500, -0.02em, radius 6px, height 38px (44px large), hover adds a 10% white overlay, arrows nudge 2px. Variants: Lam (one per page), Outlined (1px inset Obsidian), Ghost.

**Eyebrow label.** Text only, no fill or box: display face 11px/500, uppercase, 0.16em tracking, Graphite (Clutch `label-text-s`).

**Stat card (landing).** Canvas, 1px Slate Mist, 24px padding. Eyebrow with country flag code (AU / VN), stat number 56px, one-sentence claim, chart, source line in Graphite 12px.

**Sealed field (app).** Periwinkle Wash background, 3px Seal Blue left stripe, lock glyph, label "Sealed", ciphertext preview in monospace Graphite truncated with "…".

**Badge.** SEALED / DENIED / PENDING / APPROVED as defined above. 11px uppercase.

**Fabric log (app).** Fog panel, monospace 12px, one line per Tide operation: time · actor · operation · result. This is the "technical output" judges see on screen.

**Persona switcher (app).** Segmented control of avatars (initials in 28px circles, Obsidian on Canvas, selected = Obsidian fill). In live mode it becomes "Sign in as…".

**Hero visual.** The mark large in the centre, a dashed Slate Mist orbit, and service tokens (School, GP, Court mail, Police, Admin) on Canvas circles with Pewter borders. Flat 2D only.

---

## Charts

- Bars: 16px tall, Slate Mist track, Seal Blue or Obsidian fill, 4px rounded data end.
- Stacked columns: Stone (context) at the bottom, Seal Blue (what grew) on top, 2px Canvas gap between segments.
- Unit chart: 10×10 squares, Seal Blue = the share, Slate Mist = the rest.
- Values and labels are always text in Obsidian or Graphite, never in the series colour.
- Every chart has a source line.

---

## Layout

- Landing: Nav → Hero → Problem (4 stats, 2×2 grid) → Real cases → How it works (3 steps) → Who sees what → Prototype → What changes → Footer.
- Demo app: top bar (mark, mode badge, persona switcher, reset) → two columns on desktop (persona screen 2/3, Fabric log 1/3) → single column on phones with the log below.
- The survivor screen is designed phone-first (max 420px column) so it can be shown in a phone mockup. Admin, service and approver screens are desktop-first for laptop mockups.

## Hero scene, devices and people

- **Hero scene** (after clutch.security's orbit): a dark radial platform with film grain, the Unfound mark extruded as a door (18 dark layers, pale Lam front face), and 20 coins (Lucide icons) floating around it. Lam coins are services that can reach her; black coins are everything that must not find her. Coins drop in on a spring, bob on 4–7 s loops, follow the pointer with depth parallax, and a Lam ring pings out of the door every 1.8 s.
- **Hero headline**: three phrases on two lines ("Every school. Every clinic. / No one looks you up."), Stone by default, one phrase at a time turns Obsidian.
- **Devices**: flat CSS iPhone, iPad and MacBook frames (`src/ui/Device.tsx`). Survivor screens run in the iPhone, police in the iPad, everyone else in the MacBook.
- **People**: Notionists (Zoish, CC0) generated locally with DiceBear, line-drawn, on Fog or Lam Wash circles.
- **Demo story**: callouts are Obsidian cards with a Seal dot, spring in with the pop sound; the device zooms (scale ≤ 1.32) onto the feature and rings it in Lam.

## Do / Don't

- Do keep 80% of every screen Canvas + Obsidian.
- Do show ciphertext. It is the proof, and it looks good.
- Don't add new colours, gradients, 3D renders, photos or emoji.
- Don't use red for errors. A DENIED badge in Obsidian is louder on a white page.
- Don't centre body text. Only hero headline and short CTAs are centred.

---

## Motion

References: Emil Kowalski (animations.dev: strong ease-out, sub-300ms UI feedback, never ease-in), Rauno Freiberg ("Invisible details of interaction design": motion that explains state), and the restraint of Linear and Vercel (one choreographed moment per page, everything else quiet).

**Rules**
- Animate only `transform`, `opacity` and `clip-path`. Never width, height, top or left. Measured: scroll stays at 60 fps (p99 frame 16.8 ms, 0 dropped frames in a 40-wheel-step test).
- Anything the user triggers responds in ≤ 220 ms with ease-out. Choreographed moments (intro, curtain, reveals) may run 0.6–0.9 s.
- One signature per surface: the landing has the intro and the scroll-lit headline; the demo has the ciphertext scramble.
- `prefers-reduced-motion: reduce` turns everything off: no intro, no smooth scroll, charts drawn at rest.

| Token | Value | Use |
|-------|-------|-----|
| `ease.out` | `cubic-bezier(0.23, 1, 0.32, 1)` | All UI feedback, reveals |
| `ease.outExpo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Words rising, count-ups, chart draw |
| `ease.inOut` | `cubic-bezier(0.77, 0, 0.175, 1)` | Curtain and intro wipe only |
| press | 120 ms, scale 0.97 | Buttons |
| ui | 220 ms | Tabs, persona switch, badges |
| reveal | 800 ms, y 24 → 0 | Sections on scroll |
| curtain | 500 ms cover + 600 ms lift | Route change |

**Choreography**
- **Intro** (first visit per session, 1.25 s, click or key skips): the mark's arch draws itself, the dot springs in, "unfound" rises letter by letter, then the white sheet wipes up and the hero starts underneath.
- **Hero**: the two phrases fade in from scale 0.98 (Clutch's entrance), then take turns turning black, lede and CTAs follow, the orbit's spokes draw, the five service tokens pop in and then float on a 6 s loop. Scrolling sinks the orbit (parallax 0 → 110 px) and fades the copy.
- **Nav**: hides on scroll down, returns on scroll up. A 1 px Obsidian progress line tracks the page.
- **Smooth scroll**: Lenis (lerp 0.12) on wheel; touch keeps native scrolling. Anchor links glide with a 72 px offset.
- **Problem**: stat numbers count up; bars draw left to right with clip-path; the 100-square unit chart fills row by row; stacked columns grow police first, then the growing agencies.
- **What changes**: the headline lights up word by word as it scrolls through the viewport.
- **Route change**: an Obsidian curtain rises from the bottom over the old page, the mark flashes, and it lifts off the new page. The demo chunk is prefetched while the landing is idle, so the curtain never waits.
- **Demo**: top bar and persona chips drop in; the active persona is a black pill that slides between chips (shared layout); screens cross-fade 14 px up; tab underline slides; ciphertext and revealed plaintext decode from random glyphs; new Fabric log lines slide in with a Periwinkle flash that fades over 1.4 s; DENIED and the 412 notice shake once; status badges pop.

---

## Sound

Kenney "Interface Sounds" (CC0), converted to mono MP3, about 70 KB in total, in `public/sfx/`. Played through Web Audio from decoded buffers, so there is no latency. Audio unlocks on the first tap. The topbar toggle mutes it, and the choice persists.

| Sound | Kenney source | Plays on |
|-------|---------------|----------|
| tap | click_002 | Any button or link press, on every page |
| pop | pluck_002 | The intro's dot landing |
| chime | bong_001 | Arriving on the dashboard |
| whoosh | synthesised (band-passed noise sweep) | Curtain rising (up) and lifting (down), intro wipe |
| switch | tick_002 | Persona, tab, Legacy/Unfound toggle |
| seal | confirmation_002 | `doEncrypt` OK |
| reveal / hide | maximize_004 / minimize_004 | `doDecrypt` OK, Hide |
| pending | drop_002 | Change set created (202) |
| approve | select_003 | A quorum vote |
| quorum | confirmation_004 | Quorum met, one-time role revoked |
| denied | error_004 | Decrypt refused |
| blocked | error_008 | `412 QUORUM_NOT_MET` |

The semantic sound follows the Fabric log, so every Tide operation can be followed by ear in the video.

---

## CSS custom properties

```css
:root {
  --color-obsidian: #000000;
  --color-canvas: #ffffff;
  --color-fog: #f9fafb;
  --color-slate-mist: #e5e7eb;
  --color-pewter: #dfdfdf;
  --color-stone: #c9c9c9;
  --color-graphite: #6e6e6e;
  --color-periwinkle-wash: #e2eeff;
  --color-seal: #8dbbff;
  --color-lam: #3d8bff;
  --color-rail: #dfdfdf;

  --font-display: 'PP Radio Grotesk', 'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-ui: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

  --text-caption: 11px;
  --text-body: 16px;
  --text-subheading: 20px;
  --text-heading-sm: 26px;
  --text-heading: 38px;
  --text-heading-lg: 56px;
  --text-display: 68px;
  --text-stat: 56px;

  --radius: 6px;
  --shadow-sm: rgba(0, 0, 0, 0.16) 0px 2px 6px 0px;
  --page-max-width: 1200px;
  --section-gap: 80px;
  --card-padding: 24px;
  --element-gap: 16px;
}
```
