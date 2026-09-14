## Frontend Product Design Workflow

For any significant frontend redesign or analytics UI change:

1. Read `.claude/skills/pubg-product-design/SKILL.md`.
2. Inspect both repositories:
   - `pubg-insight-frontend`
   - `pubg-insight-backend`
3. Perform a data inventory before proposing UI changes.
4. Identify backend capabilities that are not currently surfaced in the frontend.
5. Define the user question each section should answer.
6. Select the appropriate visualization pattern for each data type.
7. Present the proposed information hierarchy before modifying code.
8. Only then implement.

Do not default to Card + Typography for analytics.

For every major analytics element, explicitly decide whether the appropriate pattern is:
- hero metric
- comparison
- radar
- chart
- ranked list
- evidence block
- timeline
- distribution
- progress indicator
- coaching action
- badge/archetype
- other justified visualization

If multiple components contain the same kind of information, use a consistent visual system.

For UI work, prioritize:
1. information architecture
2. data coverage
3. hierarchy
4. visualization selection
5. aesthetics
6. micro-interactions

Do not solve information-design problems using spacing/font-size changes alone.