I'm working on PUBG Insight, a personal web app for looking up PUBG player stats (player search, season overview, recent matches list, match placement detail, and a "Generate AI Insights" feature). You have access to the repo — please explore the codebase first to understand the current structure, components, and styling approach before making changes.

I'd like you to review and improve the UI/UX. Specifically:

Failed-to-load match cards — Right now, some "Recent Matches" entries just show a red "Failed to load" label with no way to recover. Add a retry mechanism (button or auto-retry with backoff) and a clearer, less alarming error state (e.g., icon + short message instead of just red text).
Loading states — Check whether match cards and stat panels show skeleton loaders / spinners while fetching data, instead of popping in abruptly or showing blank/failed states prematurely.
Visual hierarchy & density — The "Older match · tap to view details" rows are visually flat and repetitive. Consider adding key info (placement, date, or an icon) directly in the collapsed row so users don't have to tap every one to get context.
Placement detail section — Review spacing and grouping between the Kills / Headshot / Damage / Survived stat tiles — see if it can be made more scannable (icons, better alignment, or a subtitle like "vs. your average").
Responsiveness — Check how this layout behaves on smaller screens (tablet/mobile widths), since it looks like a fairly wide fixed layout right now.
Consistency — Standardize spacing, border radius, and color usage (especially the accent gold vs. gray borders) across cards for a more polished, cohesive look.
"Generate AI Insights" button — Consider adding a loading/disabled state while insights are generating, and a clear result area for when insights come back.

Feel free to propose your own additional improvements based on what you find in the code (accessibility, performance, component reuse, etc.). Keep the existing dark theme and gold accent color.

— Tran Dong Nghi, S3914633, RMIT Vietnam University, 2026
