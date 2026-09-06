# AI Agent Instructions — pubg-insight-frontend

You are an AI software engineer working on this repository.

Before making any changes, read `docs/PROJECT_CONTEXT.md` and `docs/TASK.md` (kept identical to the backend repo's copies — same status, one source of truth). For system architecture, sequence diagrams, and design decisions, read `docs/ARCHITECTURE.md` **in the pubg-insight-backend repo** — this repo doesn't have its own copy.

This repo owns UI, components, charts, and API communication only. It never contains business logic, and never calls PUBG or Gemini directly — every request goes through the backend (`src/api/axios.ts` is the only external call surface; verify this stays true).

---

# Current Status

Built: Player Search, Match Analytics (map/placement/kills/headshot/damage/survival), Season Win Rate, AI Insights (Gemini) UI. All on a single page — no routing yet (react-router-dom is installed but unused; add it when a second page, like History or the Dashboard, actually needs one). Not built: Analysis History UI, Analytics Dashboard (Feature 5) — both depend on backend AWS work (DynamoDB/S3/Athena) that hasn't been deployed yet.

---

# Design System (established — follow these, don't reinvent)

Built from an explicit design brief (industrial/tactical/premium/minimal, PUBG's own branding — not neon/cartoon/glassmorphism). Current conventions, in `src/theme.ts` and the components:

- **Palette**: dark charcoal background (`#121212`/`#1C1C1C`), PUBG-yellow primary accent (`#F2A900`), olive-green secondary (`#4B5320`). Don't introduce new accent colors.
- **Border radius**: Cards 8px (theme default), buttons/inputs 6px (`MuiButton`/`MuiOutlinedInput` overrides), small stat tiles/inset panels 6px via explicit `sx={{ borderRadius: "6px" }}` (not the `2`-unit shorthand — that resolves against `theme.shape.borderRadius` and drifts if the theme changes). Only `Chip` stays pill-shaped (MUI's own default, don't override).
- **Layout**: `Container maxWidth="lg"` (~1200px), not a narrow centered column. Content is split into separate `Card`s per logical section (Player Overview / Season Performance / Recent Matches), not one mega-card.
- **Typography hierarchy**: hero numbers (Win Rate) as `variant="h3"` with `sx={{ fontWeight: 800 }}`; section labels as `variant="overline"` with `color="text.secondary"`; stat tile values as `variant="h6"` bold + `variant="caption"` muted label underneath.
- **Match previews**: only the first few recent matches (see `PREVIEW_COUNT` in `MatchList.tsx`) get an automatic rich preview card (map/mode/placement/kills/damage) — PUBG has no batch-fetch endpoint, so this is deliberately capped low to stay within the 10 req/min free-tier rate limit alongside the other calls a single search already makes (player + season stats). Don't raise this without checking `docs/ARCHITECTURE.md`'s known-limitations section on API call budget first.

**MUI version note**: this project's installed MUI version does NOT accept several common shorthand props directly on components — `fontWeight`, `letterSpacing`, `lineHeight` on `Typography`, `justifyContent`/`alignItems`/`flexWrap` on `Stack`. All of these must go through the `sx` prop instead (e.g. `sx={{ fontWeight: 700 }}`, not `fontWeight={700}`). This has caused real build failures more than once — check this first if a new component fails to typecheck with a "no overload matches" error mentioning a `component` prop.

---

# Error Handling Convention (established, follow this)

Every service call's `catch` block should route through `src/utils/errorMessage.ts`'s `getErrorMessage(err, notFoundMessage)`, which distinguishes 404 (not found) / 429 (PUBG rate limited) / other error status (service unavailable) / no response (can't reach backend) into different user-facing messages. Don't write a new generic catch-all message for a new component — reuse this util, or extend it if a new distinct case is needed.

---

# Coding Principles

Keep components small. Business logic belongs in the backend, never here. Avoid unnecessary abstractions — most components in this app are plain function components with local `useState`/`useEffect`, no context/reducer machinery, because the app doesn't need it yet. Don't add one preemptively.

---

# Before Writing Code

1. Does this belong here or in the backend? (If it needs to call PUBG/Gemini/AWS, it belongs in the backend.)
2. Does a backend endpoint already exist for this, or does the backend need to change first? Never build UI against an API that isn't stable yet.
3. Does this match the established design system above, or does it need a real, explained reason to deviate?

---

# Out of Scope

Business logic, direct external API calls, a different UI framework, routing/state management machinery the app doesn't need yet.

---

# If You Are Unsure

Never guess. Explain assumptions, propose alternatives, ask for clarification.
