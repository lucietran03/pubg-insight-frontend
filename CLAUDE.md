I need you to review and improve the current PUBG Insight homepage based on the current implementation and screenshots.

There are two separate areas to address:

1. Homepage UI/UX
2. Gemini AI Insights API failure

Please treat them separately and do not mix visual redesign work with backend debugging.

==================================================
PART 1 — HOMEPAGE UI/UX FEEDBACK
==================================================

The current homepage is functional, but visually it still feels too compressed toward the center and not polished enough for a production-ready PUBG analytics platform.

The overall page feels like multiple blocks have simply been stacked in the middle instead of forming a strong, balanced desktop dashboard.

I want you to refine the current design rather than redesign it from scratch.

The existing dark theme, PUBG yellow accent, general card style, and typography direction can remain.

The issues below should be addressed.

--------------------------------------------------
1. Overall page composition
--------------------------------------------------

The whole page still feels too visually concentrated in the center.

Although the content width has been increased, the layout still feels like several large rectangles stacked vertically rather than a deliberate analytics dashboard.

Please improve:

- horizontal balance
- spacing rhythm
- visual hierarchy
- relationship between sections
- information density
- use of the available desktop width

The page should feel more like a real gaming analytics product and less like a centered assignment prototype.

Do not simply increase padding or spacing.

Use the available width more intelligently.

--------------------------------------------------
2. Search area
--------------------------------------------------

The search area is functional but visually underwhelming.

The search input and button currently feel like a basic form placed at the top of the page.

Please improve its visual integration with the rest of the PUBG design language.

Consider:

- stronger visual hierarchy
- cleaner alignment
- better proportions between input and Search button
- more tactical / PUBG-like styling
- subtle separation from the analytics content below

Do not make it overly decorative.

--------------------------------------------------
3. Player Overview card
--------------------------------------------------

The current Player Overview layout does not look balanced.

Currently:

TGLTN is aligned toward the left

STEAM badge is pushed toward the right

The two elements feel disconnected.

This does not look intentional.

Please redesign the internal layout of the Player Overview card so that the player identity feels cohesive.

For example, the player name, platform, match activity and any supporting metadata should visually belong together instead of being placed at opposite edges.

The Season Performance card beside it currently looks considerably better.

Try to make Player Overview visually equal in quality to Season Performance.

--------------------------------------------------
4. Recent Matches interaction is confusing
--------------------------------------------------

This is currently one of the biggest UX problems.

At the moment:

- the first three recent matches are shown as large cards
- the remaining matches are shown as many small "Match 4", "Match 5", "Match 6", etc. pills
- clicking a match shows its detail below

Even after looking at the page, the interaction model is not immediately understandable.

A user should not need to figure out why three matches appear as cards while the rest appear as numbered pills.

Please redesign this interaction so it is obvious how recent matches are selected.

I would prefer a design where recent matches are identified by meaningful information rather than internal ordering such as:

Match 4
Match 5
Match 6

Possible useful labels include:

date
time
placement
map
game mode

For example:

Sep 6 · #18

or

Sep 6, 23:42 · #18

or another concise format that makes each match recognizable.

Do not make "Match 17" the main identifier.

--------------------------------------------------
5. Recent Matches layout
--------------------------------------------------

The three recent match cards currently cluster on the left side of the Recent Matches container.

This creates a large unused empty area on the right.

It looks visually unfinished.

The three most recent matches should be distributed more intentionally across the available width.

Possible approaches include:

- equal-width three-column layout
- a horizontal carousel
- a stronger card grid
- another balanced desktop layout

Choose the approach that provides the clearest UX.

The important requirement is that the section should not look like three cards accidentally placed on the left side of a very large container.

--------------------------------------------------
6. Too many match pills
--------------------------------------------------

The many rows of Match 4, Match 5, Match 6, etc. look repetitive and visually weak.

They create a large block of gray pills with very little information.

This section currently feels boring and unnecessarily dense.

Please replace this interaction with something more useful.

Possible options:

- date grouping
- compact match list
- horizontal scrolling
- pagination
- dropdown / date selector
- timeline
- carousel

Choose the interaction that best fits the current application.

The user should be able to access older matches without displaying dozens of nearly identical pills at once.

--------------------------------------------------
7. Use date-oriented navigation
--------------------------------------------------

I would prefer users to understand recent match history through dates rather than arbitrary "Match X" numbering.

If technically reasonable, allow the user to browse or select matches based on date.

For example:

Today
Yesterday
Sep 5
Sep 4

or a compact date selector.

The exact implementation is flexible, but the interaction should make chronological sense.

--------------------------------------------------
8. Raw PUBG values should not be shown directly
--------------------------------------------------

The UI currently displays values such as:

Baltic_Main

This appears to be an internal PUBG map identifier rather than a user-friendly map name.

Do not expose raw internal PUBG codes directly when a human-readable mapping exists.

For example:

Baltic_Main
→ Erangel

Likewise, the "squad" badge should clearly represent game mode.

Review other raw PUBG fields currently rendered in the UI and convert them to user-friendly labels where appropriate.

--------------------------------------------------
9. Selected Match analytics
--------------------------------------------------

The selected match card currently shows:

Placement
Kills
Headshot
Damage
Survived

The numbers technically work, but visually they feel like generic stat boxes.

I want this section to feel closer to the PUBG end-of-match statistics screen.

Do NOT copy PUBG directly.

Instead, take inspiration from the way PUBG presents post-game performance information.

The selected match should feel like a match performance summary rather than five unrelated numbers.

Possible improvements:

- stronger placement emphasis
- clearer relationship between combat metrics
- better visual grouping
- icons where appropriate
- more intentional hierarchy
- subtle visual indicators or performance bars

Keep the design clean and analytics-focused.

--------------------------------------------------
10. Selected Match card hierarchy
--------------------------------------------------

The current selected match section uses a lot of horizontal space but does not create a strong focal point.

Improve the hierarchy so the user immediately understands:

1. which match is selected
2. map
3. mode
4. placement
5. combat performance
6. survival information

The information should tell a story instead of presenting five equally weighted boxes.

--------------------------------------------------
11. General visual polish
--------------------------------------------------

Please review:

- border radius
- card spacing
- vertical rhythm
- alignment
- section titles
- typography hierarchy
- button proportions
- unused empty space
- card heights
- consistency between cards

The current design is not bad, but it still feels visually unfinished.

Do not introduce:

- neon cyberpunk colors
- glassmorphism
- excessive gradients
- huge animations
- excessive rounded pills
- unnecessary decorative assets

Keep the PUBG dark / tactical / industrial direction.

==================================================
PART 2 — GEMINI AI INSIGHTS ERROR
==================================================

There is also a functional problem with Generate AI Insights.

Current behavior:

1. User selects a match.
2. User clicks "GENERATE AI INSIGHTS".
3. The frontend waits for approximately 3 seconds.
4. The frontend displays:

"PUBG service is temporarily unavailable. Please try again later."

5. Browser/network request receives HTTP 502.

However, the actual backend error is not related to the PUBG API.

The backend log shows:

Gemini API call failed

403 Forbidden

"Method doesn't allow unregistered callers (callers without established identity). Please use API Key or other form of API consumer identity to call this API."

Therefore, the current error handling is misleading.

The real flow appears to be:

Frontend
→ Spring Boot
→ Gemini API
→ 403 PERMISSION_DENIED
→ GeminiApiException
→ GlobalExceptionHandler
→ 502
→ frontend displays PUBG service unavailable

This must be corrected.

--------------------------------------------------
12. Investigate Gemini authentication
--------------------------------------------------

Inspect the Gemini integration and determine why Gemini considers the request unauthenticated.

Check at minimum:

- Gemini API key configuration
- environment-variable loading
- application.yml / application-local.yml
- Gemini client configuration
- request URL
- query parameters
- headers
- API key injection
- model endpoint
- Spring RestClient configuration

Verify whether the API key is actually being sent with the request.

Do not assume that the environment variable exists simply because configuration code exists.

Trace the actual runtime value and request construction safely without logging the secret itself.

--------------------------------------------------
13. Do not expose the Gemini key
--------------------------------------------------

Never print the Gemini API key in:

- logs
- frontend
- API responses
- screenshots
- source code

Only verify whether it is present and correctly loaded.

--------------------------------------------------
14. Fix Gemini error semantics
--------------------------------------------------

The frontend currently says:

"PUBG service is temporarily unavailable."

This is incorrect because the failure comes from Gemini.

The application should distinguish between:

PUBG API errors

Gemini API errors

backend errors

rate-limit errors

For example:

Gemini authentication/configuration failure
→ "AI Insights service is currently unavailable."

Gemini rate limit
→ "AI Insights rate limit reached. Please try again later."

PUBG API failure
→ "PUBG data service is temporarily unavailable."

Do not show technical stack traces to the user.

--------------------------------------------------
15. Investigate the 502 mapping
--------------------------------------------------

Review the current GlobalExceptionHandler and custom exception hierarchy.

Determine whether a Gemini 403 should remain 403 internally, be mapped to 502 as an upstream dependency failure, or be represented through another application-level error strategy.

The key requirement is:

The frontend must know that the failure belongs to the AI service rather than PUBG.

Preserve clear error semantics.

--------------------------------------------------
16. Verify AI Insights after the fix
--------------------------------------------------

After fixing Gemini authentication, verify the full flow:

Selected Match
→ backend prepares structured metrics
→ Gemini API receives request
→ Gemini returns analysis
→ backend transforms response
→ frontend renders AI insights

The feature should produce the intended output sections:

- Performance Summary
- Strengths
- Weaknesses
- Recommendations

Do not send unnecessary raw PUBG telemetry to Gemini.

Gemini should receive processed match metrics.

==================================================
WORKING METHOD
==================================================

Before implementing anything, first provide:

1. UI/UX issues you identified from the current implementation.
2. Your proposed layout and interaction changes.
3. The current Recent Matches interaction model and why it is confusing.
4. The Gemini root cause you found.
5. The exact files you expect to modify.

Then implement changes incrementally.

Do not rewrite unrelated components.

Do not change the project architecture.

Do not replace Material UI.

Do not add unnecessary dependencies.

Do not break currently working Player Search or Match Analytics.

==================================================
ACCEPTANCE CRITERIA
==================================================

The work is complete only when:

- Homepage feels balanced on desktop.
- Player Overview looks intentional and visually consistent with Season Performance.
- Recent Matches selection is immediately understandable.
- Three recent match cards no longer cluster awkwardly on the left.
- Older matches are not presented as dozens of meaningless numbered pills.
- Dates or meaningful match metadata are used for navigation.
- Raw values such as Baltic_Main are converted to human-readable values such as Erangel.
- Selected Match feels like a PUBG-inspired performance summary rather than generic stat boxes.
- Generate AI Insights successfully authenticates with Gemini.
- Gemini errors are no longer incorrectly labelled as PUBG errors.
- Frontend handles Gemini failures gracefully.
- Existing Player Search and Match Analytics continue to work.

At the end, provide:

- files changed
- UI changes
- Gemini root cause
- Gemini authentication fix
- final error mapping
- manual test steps