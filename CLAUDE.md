---
name: pubg-product-design
description: Audit and redesign PUBG Insight frontend using repository data, product hierarchy, analytics visualization, and coaching UX. Use before modifying major UI sections.
allowed-tools: Read, Grep, Glob
---

# PUBG Insight Product Design Skill

Before modifying any major UI component, follow this workflow.

## 1. Data Inventory

Inspect the frontend and backend repositories first.

Identify:

- backend DTO fields
- derived analytics
- season metrics
- match metrics
- radar scores
- archetype data
- AI insight fields
- previous-season comparisons
- cached/historical data
- any implemented AWS-backed data

Create a temporary mapping:

Backend data
→ frontend API type
→ currently displayed?
→ current component
→ best visualization

Do not assume that currently displayed data represents all available backend capabilities.

## 2. Information Architecture

Before coding, determine which user question each section answers.

Examples:

Player Overview
→ Who am I as a player?

Season Performance
→ How strong is my current season?

Performance Profile
→ What are my strongest and weakest dimensions?

Match Analysis
→ What happened in this match?

Comparison
→ How unusual was this performance?

AI Coach
→ Why did it happen and what should I do next?

Do not add UI elements unless they support a clear user question.

## 3. Visual Pattern Selection

Do NOT default every value to Card + Typography.

For each data type choose an appropriate visualization.

Examples:

- multidimensional profile → radar chart
- current vs baseline → delta visualization
- trend → line / sparkline
- distribution → bars / histogram
- hierarchy → ranked list
- categorical profile → archetype/badge
- coaching priorities → numbered action plan
- strengths/weaknesses → evidence-backed comparison blocks
- body/target data → spatial/body visualization if supported
- map/mode distribution → comparative bars
- loading analysis → staged progress sequence

Explain why each chosen pattern is appropriate before implementing.

## 4. Design Direction

PUBG Insight should feel like:

Tactical performance intelligence
+
collectible player dossier
+
subtle cat/doll personality

The interface may include:

- soft toy-like geometry
- playful micro details
- small cat motifs
- collectible badge language
- charming loading states
- softer rounded elements

But it must NOT become:

- childish
- generic pink kawaii
- cluttered
- low-contrast
- unrelated to PUBG analytics

Analytics remain the primary function.

## 5. Hierarchy

Every screen must have:

Primary insight
Secondary evidence
Supporting details

Do not give every element equal visual weight.

Important numbers must visually dominate.

Secondary metadata must remain quiet.

## 6. AI Coaching

AI output must not appear as a text dump.

Organize coaching as:

1. Overall verdict
2. What worked
3. What hurt performance
4. Why
5. Immediate coaching advice
6. Long-term training priorities

Every claim should reference actual metrics where available.

Avoid generic statements unsupported by data.

## 7. Before Coding

Always provide:

- UX problem
- available data
- proposed hierarchy
- chosen visualization pattern
- components affected

Then implement.

## 8. Guardrails

Do not fabricate data.
Do not create fake historical series.
Do not add backend-dependent features unless backend already exposes the data.
Do not fetch many matches in a frontend loop.
Do not rewrite unrelated components.
Do not change backend contracts without explicit approval.