# Bon Creator Design System

## Direction

Bon Creator feels sharp, composed, capable. It is a high-end campaign workspace, not generic SaaS. Chrome recedes; campaign work carries visual weight.

## Color

Source: Bon Intelligence brand book. Cool blue palette.

- Background: cool white (`#F0F6FA`) light / dark navy (`#030E1D`) dark. Never warm tones.
- Primary: brand light blue `#0AA4EC` (`--primary`) for actions, active nav, links, focus rings.
- Accent use stays below 10% of a surface. No gradient text, no decorative glass.
- Success, warning, error remain functional and quiet.

Key tokens: `--primary #0AA4EC`, `--background #F0F6FA / #030E1D`, `--sidebar #E8F1F8 / #061425`.

## Typography

- Display + Body/UI: Geist via `--font-display` and `--font-sans` (grotesque, no serif).
- Mono: Geist Mono via `--font-mono` for section numbers, tabular details, eyebrow accents.
- Hero titles use tight tracking and large scale: `text-[3rem] md:text-[4rem]`, occasionally larger on auth.
- Section titles use display at `text-2xl` with tight tracking.

## Layout

Default page structure:

1. Editorial hero header with small uppercase eyebrow, large display title, concise context.
2. Sections separated by horizontal rules, not card containers.
3. Desktop sections use two columns: `md:grid-cols-[220px_1fr] md:gap-16`.
4. Left gutter carries section number, title, short explanatory note.
5. Right column carries actual controls, lists, charts, or grids.

Cards are reserved for content tiles where tile shape matters: product visuals, style cards, generated image previews. Avoid wrapping whole forms or sections in cards.

## Components

### Sidebar

- Grotesque wordmark, quiet metadata label.
- Active nav uses left border accent and faint tint.
- No logo box, no glow, no avatar chip.

### Lists

- Use `divide-y divide-border` and border-y containers.
- Rows carry strong name, quiet metadata, compact status chip, minimal text actions.
- Avoid card-per-row layouts.

### Forms

- Hero title doubles as object identity where useful.
- Form groups are numbered editorial sections.
- Text inputs prefer transparent background and bottom border for primary identity fields.
- Textareas may use faint background tint when longer copy benefits from enclosure.

### Charts

- Chart leads dashboard. No hero-metric card grid.
- Metrics appear as typographic stats, not icon cards.
- Use accent in chart sparingly.

### Confirmations

- Destructive actions use `ConfirmDialog`.
- Expensive actions use inline pre-flight confirmation.
- Browser `window.confirm` is banned.

## Motion

- Subtle fade/slide already present is enough.
- No bounce or elastic motion.
- Respect `prefers-reduced-motion`.

## Bans

- No gradient text.
- No decorative glassmorphism.
- No hero-metric template.
- No identical icon-card grids.
- No card chrome around every section.
- No `window.confirm`.
