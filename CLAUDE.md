# AI Agent Instructions — pubg-insight-frontend

You are an AI software engineer working on this repository.

Before making any changes, read `docs/decisions/PROJECT_CONTEXT.md` and `docs/decisions/TASK.md` (kept identical to the backend repo's copies — same status, one source of truth). For system architecture, sequence diagrams, and design decisions, read `docs/deliverables/ARCHITECTURE.md` **in the pubg-insight-backend repo** — this repo doesn't have its own copy.

This repo owns UI, components, charts, and API communication only. It never contains business logic, and never calls PUBG or Gemini directly — every request goes through the backend (`src/api/axios.ts` is the only external call surface; verify this stays true).

---

# Current Status

Built: Player Search, Match Analytics (map/placement/kills/headshot/damage/survival), Season Win Rate, AI Insights (Gemini) UI. All on a single page — no routing yet (react-router-dom is installed but unused; add it when a second page, like History or the Dashboard, actually needs one). Not built: Analysis History UI, Analytics Dashboard (Feature 5) — both depend on backend AWS work (DynamoDB/S3/Athena) that hasn't been deployed yet.

The homepage went through two UI passes: a layout pass (top bar, standalone search bar, wider `xl` container, Recent Matches redesign) and a polish pass (retryable error states, skeleton loading, responsive breakpoints, consistent resting borders) — see Design System below for the conventions both left behind. A real bug was also fixed: `errorMessage.ts` used to hardcode "PUBG service unavailable" for any non-404/429 failure, which mislabeled Gemini failures as PUBG failures — fixed by reading the backend's own per-exception message instead of guessing from the HTTP status.

**Known, deliberately-not-done**: "vs. your average" style comparisons on match stat tiles would need a new backend metric (per-stat season averages) that doesn't exist yet (`SeasonStatsDto` only has wins/roundsPlayed/winRate) — flagged, not implemented, since it's a backend+frontend change and this pass was scoped frontend-only.

---

# Design System (established — follow these, don't reinvent)

Built from an explicit design brief (industrial/tactical/premium/minimal, PUBG's own branding — not neon/cartoon/glassmorphism). Current conventions, in `src/theme.ts` and the components:

- **Palette**: dark charcoal background (`#121212`/`#1C1C1C`), PUBG-yellow primary accent (`#F2A900`), olive-green secondary (`#4B5320`). Don't introduce new accent colors.
- **Border radius**: Cards 8px (theme default), buttons/inputs 6px (`MuiButton`/`MuiOutlinedInput` overrides), small stat tiles/inset panels 6px via explicit `sx={{ borderRadius: "6px" }}` (not the `2`-unit shorthand — that resolves against `theme.shape.borderRadius` and drifts if the theme changes). Only `Chip` stays pill-shaped (MUI's own default, don't override).
- **Resting vs. selected borders**: every clickable card/row (`MatchPreviewCard`, `OlderMatchRow`, etc.) uses `border: "1px solid"` with `borderColor: "divider"` at rest and `borderColor: "primary.main"` (gold) only when selected/active. Don't use `"transparent"` for the resting state — that was the earlier, inconsistent version (some elements had a visible gray resting border, some had none at all).
- **Layout**: `Container maxWidth="xl"` inside a top bar (`App.tsx`) — brand and API status live in a full-width bar, not centered text. The search input lives in its own bordered `background.paper` bar (`PlayerSearch.tsx`), visually separated from the results below it. Results are split into separate `Card`s per logical section (Player Overview / Season Performance / Recent Matches), not one mega-card. Inside Player Overview, keep identity elements (name, shard chip, match count) grouped together as one block — don't spread them to opposite edges of the card with `justifyContent: "space-between"`, that reads as disconnected.
- **Typography hierarchy**: hero numbers (Win Rate, match Placement) as `variant="h3"` with `sx={{ fontWeight: 800 }}`; section labels as `variant="overline"` with `color="text.secondary"`; stat tile values as `variant="h6"` bold + `variant="caption"` muted label underneath.
- **Match previews and identifiers**: the first `PREVIEW_COUNT` recent matches (`MatchList.tsx`, currently 7) get an *immediate* rich preview (map/mode/placement/kills/damage), rendered as an explicit equal-width grid (responsive `1fr` → `repeat(2,1fr)` → `repeat(3,1fr)`), not `auto-fill` (which leaves dead space instead of spanning the full row). The list is also capped overall at `MAX_MATCHES_DISPLAYED` (currently 50, out of possibly many more PUBG returns for an active player over ~14 days) — a caption tells the user when matches are being hidden by this cap rather than silently dropping them. Both numbers are deliberately conservative to stay within PUBG's 10 req/min free-tier rate limit alongside the other calls a single search already makes (player + season stats) — don't raise either without checking `docs/deliverables/ARCHITECTURE.md`'s known-limitations section first, and note that `PREVIEW_COUNT` was already raised once (3→7) and the background-queue pacing had to be slowed down in response (see below) after real 429s. Matches beyond `PREVIEW_COUNT` are **never** labeled "Match N" (a raw index is not a meaningful identifier to a user), but they **do** all load automatically in the end, up to the display cap — real per-match info (date/map/placement) costs one PUBG call each, so a background queue (see the constants + effect above `MatchList`'s `runQueue`) fetches them one at a time, paced ~9s apart, instead of firing all at once. A click on any row still works and jumps that one match ahead of the queue immediately (`handleSelect`). If a background fetch gets a 429, it backs off (using `Retry-After` if present, a fixed default otherwise) and retries a few times before giving up on that one match — the queue itself never gets abandoned by a single rate-limited item. **This was a deliberate reversal of an earlier "never auto-load the rest" rule** — the user explicitly asked for the older matches to appear without tapping, so the trade-off was re-made consciously (paced background load instead of instant-but-rate-limit-breaking, or forever-manual), then re-tuned again (slower pacing, capped total) after that first version still produced real 429s in practice. If this happens again, the fix is more pacing/a lower cap, not less — don't "solve" 429s by removing the backoff logic.
- **Human-readable fields**: `mapName` and `gameMode` arrive from the backend already translated to display form (e.g. `Erangel`, `Squad FPP`) — the backend's `MatchMapper` does this translation, not the frontend. Never re-map or re-format these strings here; if a new raw PUBG code shows up untranslated, that's a backend `MatchMapper` gap, not something to patch around in a component.
- **Dates**: `Match.createdAt` is an ISO 8601 string from the backend. Format it with the `formatMatchDate` helper in `MatchList.tsx` (or an equivalent local helper) — don't hand-roll date parsing per component.
- **Loading states**: use MUI's `Skeleton` shaped like the content that's about to appear (text-width/height matched to the real typography, `variant="rounded"` for tile-shaped blocks) for anything with a known layout — match cards, stat panels, the AI Insights result area. Reserve a bare `CircularProgress` for actions with no predictable result shape (there currently are none left; if you add a spinner back, ask whether a skeleton fits better first).
- **Error states are retryable, not dead ends**: a failed fetch shows a muted message (`text.secondary`, a `⚠` glyph — not a wall of red `error` color) plus a `"Tap to retry"` affordance in `primary.main`, and clicking the failed element itself re-triggers the same fetch. See `MatchPreviewCard`/`OlderMatchRow` (retry via `handleSelect`'s existing "if cached state is `error`, refetch" branch) and `SeasonStats` (retry via a `retryToken` state that's bumped to re-run the fetch effect — **don't** reset `loading`/`error` synchronously at the top of a `useEffect` body to implement this, that's the `react-hooks/set-state-in-effect` issue that's already bitten this component once; do the reset in the click handler and let the effect only react to a changed dependency).
- **Responsive breakpoints**: grids and stacks that are fixed-column/fixed-direction on desktop should collapse on `xs`/`sm` (single column, or `column` stack direction) rather than staying fixed-width — see the stat-tile grid (`repeat(4,1fr)` → `repeat(2,1fr)` under `sm`) and the selected-match header (`row` → `column` under `sm`) for the pattern.

**MUI version note**: this project's installed MUI version does NOT accept several common shorthand props directly on components — `fontWeight`, `letterSpacing`, `lineHeight` on `Typography`, `justifyContent`/`alignItems`/`flexWrap` on `Stack`. All of these must go through the `sx` prop instead (e.g. `sx={{ fontWeight: 700 }}`, not `fontWeight={700}`). This has caused real build failures more than once — check this first if a new component fails to typecheck with a "no overload matches" error mentioning a `component` prop. `TextField`'s `slotProps={{ input: {...} }}` is supported and preferred over the older `InputProps` for styling the underlying input.

---

# Error Handling Convention (established, follow this)

Every service call's `catch` block should route through `src/utils/errorMessage.ts`'s `getErrorMessage(err, notFoundMessage)`. It special-cases 404 (uses the caller-supplied `notFoundMessage`, which is more specific than the backend's raw text) and "no response at all" (can't reach the backend), but for every other case it **surfaces the backend's own `error.response.data.error` string** rather than guessing a message from the HTTP status code. The backend (`GlobalExceptionHandler` in the backend repo) already returns a distinct, correct message per failure type — PUBG failure, Gemini failure, either service's rate limit, history/DynamoDB failure — so the frontend's job is just to display it, not to re-derive it from a status code. Do not add new hardcoded per-status strings here; if a new backend exception needs a distinct user-facing message, give it a distinct message in `GlobalExceptionHandler`, not a new branch in this file.

---

# Coding Principles

Keep components small. Business logic belongs in the backend, never here. Avoid unnecessary abstractions — most components in this app are plain function components with local `useState`/`useEffect`, no context/reducer machinery, because the app doesn't need it yet. Don't add one preemptively.

---

# Before Writing Code

1. Does this belong here or in the backend? (If it needs to call PUBG/Gemini/AWS, it belongs in the backend.)
2. Does a backend endpoint already exist for this, or does the backend need to change first? Never build UI against an API that isn't stable yet.
3. Does this match the established design system above, or does it need a real, explained reason to deviate?
4. If it's a raw-value-to-label translation (map codes, game modes, statuses), does it belong in the backend's mapper layer instead of here?

---

# Out of Scope

Business logic, direct external API calls, a different UI framework, routing/state management machinery the app doesn't need yet.

---

# If You Are Unsure

Never guess. Explain assumptions, propose alternatives, ask for clarification.
