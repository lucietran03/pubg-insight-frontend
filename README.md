# PUBG Insight — Frontend

A React + TypeScript dashboard for PUBG performance analytics. Search a player, review their season stats and recent matches, and generate an AI coaching report for any match — all backed by a separate Spring Boot API (`pubg-insight-backend`).

## Overview

PUBG Insight lets you look up a player by name and see:

- Season-level stats (win rate, K/D, a six-axis performance radar) and a derived playstyle archetype
- Recent matches (last ~14 days, as exposed by PUBG's own API), each with combat/survival detail and a weapon/body-part breakdown
- Per-match comparisons against the player's own season average and against every match the app has ever analyzed (population comparison)
- An AI-generated coaching insight per match, with a copyable public share link
- A history of recently analyzed matches for the current player

This repo is the frontend only. All PUBG/Gemini/AWS access happens server-side — the app's only call surface to the backend is a single Axios instance (`src/api/axios.ts`), plus a second, independent call to a Lambda-backed share API for public share links.

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 8** (dev server, build tooling)
- **MUI (Material UI) 9** for components and theming (`src/theme.ts`)
- **Recharts** and hand-rolled SVG (radar chart, weapon gauges) for data visualization
- **Axios** for HTTP calls
- **React Router** (installed; app currently renders as a single view driven by query-string deep links rather than routed pages)

## Features

- **Player search** — look up a PUBG player by name (Sidebar), with a live backend health indicator ("API Online/Offline")
- **Season Performance** — win rate, K/D and other season stats, a six-axis radar (Combat, Precision, Aggression, Consistency, Support, Survival), an archetype label, and a recent-form chip vs. the previous season
- **Recent Matches** — paginated list of recent matches; selecting one loads full match detail (placement, kills, damage, headshot rate, survival time)
- **Comparisons** — per-match "vs season average" deltas (damage, survival time, headshot rate) and a "vs all players" population comparison (backed by an Athena query on the backend) once enough cached data exists
- **Weapon & Body-Part Breakdown** — kills by weapon, kills by shot distance, and damage by body part for the selected match
- **AI Insights** — on-demand, Gemini-generated coaching report per match (strengths, weaknesses, risk factors, action plan, playstyle diagnosis, long-term development priorities), recorded to analysis history once generated
- **Share Link** — "Copy Share Link" on a generated insight copies a public URL served by a separate Lambda + API Gateway backend, showing a read-only summary of that analysis independent of the main app
- **Deep Linking** — opening the app with `?playerId=&matchId=` in the URL (as the share page's "View full analysis" link does) automatically loads that player and pre-selects that match
- **Recently Analyzed** — a per-player history list in the sidebar, refreshed after each new AI Insight is generated

## Getting Started / Local Setup

Requires Node.js and npm.

```bash
npm install
npm run dev
```

This starts the Vite dev server (defaults to `http://localhost:5173`). By default it talks to a locally running backend at `http://localhost:8080` — see [pubg-insight-backend](../pubg-insight-backend) for running that separately, or point `VITE_API_BASE_URL` at a deployed instance.

Other scripts:

```bash
npm run build    # type-check (tsc -b) then production build to dist/
npm run lint     # ESLint
npm run preview  # preview the production build locally
```

## Environment Variables

Configured via Vite env files (`.env` for local dev, `.env.production` for production builds — both untracked; see `.gitignore` / `*.local`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the main Spring Boot backend (player search, season stats, matches, AI insights, history, population comparison). Points at `http://localhost:8080` locally, at the deployed backend's CloudFront URL in production. |
| `VITE_SHARE_API_BASE_URL` | Base URL of the standalone share API (API Gateway + Lambda) used to build "Copy Share Link" URLs (`/share/{playerId}/{matchId}`). Independent of the main backend. |

## Build & Deploy

```bash
npm run build
aws s3 sync dist/ s3://pubg-insight-frontend/ --delete
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*"
```

The production build (`dist/`) is synced to an S3 bucket (`pubg-insight-frontend`, static website hosting) and served through a CloudFront distribution for HTTPS and edge caching. Bust the CloudFront cache after each deploy so clients pick up the new build.

## Related Repo

This frontend depends on [`pubg-insight-backend`](../pubg-insight-backend) (Spring Boot) for all PUBG/Gemini/AWS data access, reached via `VITE_API_BASE_URL`. The share-link feature additionally depends on a small, independent Lambda + API Gateway service, reached via `VITE_SHARE_API_BASE_URL`.
