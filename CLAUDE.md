You are a Senior Product Designer and Senior Frontend Engineer.

You are redesigning an existing React + Material UI application called **PUBG Insight**.

IMPORTANT:

This is NOT a redesign from scratch.

The current UI already has a strong foundation.

Your objective is to improve the existing design while preserving its overall visual identity.

Think like a product designer polishing a nearly finished application instead of replacing it.

---

# Design Direction

Target style:

- PUBG PC official website
- PUBG Esports
- Modern gaming analytics dashboard
- Industrial
- Tactical
- Premium
- Minimal
- Data-focused

Avoid:

- Cartoon
- Neon cyberpunk
- Glassmorphism
- Mobile-first look
- Rounded fintech style
- Excessive animations
- Overly decorative gaming UI

The application should feel like a professional analytics platform built for PUBG players.

---

# Existing Strengths (KEEP)

The current implementation already has several good qualities.

Preserve them.

- Dark color palette
- Yellow accent color
- Large PUBG INSIGHT title
- Clean typography
- Search-first workflow
- Card-based layout
- Minimal visual noise

Do NOT replace these.

Improve them.

---

# Main Problems

The current design has several UX issues.

## 1.

The page is far too narrow.

The content only occupies a small portion of the desktop viewport.

Large empty areas exist on both sides.

The application currently feels like a mobile layout centered on a desktop screen.

Increase the usable width significantly while keeping readability.

---

## 2.

Everything is inside one large card.

Split the information into logical sections.

Suggested sections:

Player Overview

Season Performance

Recent Matches

Selected Match

Future AI Insights

Future Performance Charts

Each section should feel independent while remaining visually connected.

---

## 3.

Recent Matches currently displays only match IDs.

This provides little value.

Instead, every recent match should display meaningful information.

Examples:

Map

Game Mode

Placement

Kills

Damage

Match Time

Match IDs should never be the primary information.

If needed, keep them hidden or secondary.

---

## 4.

The "Backend Connected" message currently feels like developer/debug information.

Replace it with a small API status indicator in the header.

Example:

● API Online

This should be subtle.

---

## 5.

The Match Detail section should become a proper analytics card.

Instead of showing scattered metrics, create a structured stat grid.

Example metrics:

Placement

Kills

Damage

Headshot Rate

Survival Time

Each metric should have:

large value

small label

consistent spacing

---

## 6.

Improve typography hierarchy.

Current typography lacks hierarchy.

Define clear visual levels.

Examples:

Large Hero Title

Section Titles

Metric Labels

Secondary Text

Muted Metadata

The user should immediately know where to look.

---

## 7.

Reduce excessive rounded corners.

Current border radius is slightly too soft.

Use approximately:

Main Cards

8px

Stat Cards

6px

Buttons

6px

Inputs

6px

Only badges should remain pill-shaped.

---

## 8.

Simplify gradients.

Current gradients are stronger than necessary.

Prefer flat dark surfaces with subtle elevation.

Use shadows sparingly.

---

## 9.

Improve information density.

Do NOT simply increase spacing.

Instead,

display more meaningful information.

The application should feel like an analytics dashboard rather than a demo page.

---

## 10.

Improve desktop layout.

Suggested maximum width:

1100–1200px

Use a responsive grid.

Do NOT center a narrow column.

---

# Color System

Preserve the existing visual language.

Background

Very dark charcoal

Surface

Slightly lighter charcoal

Primary Accent

PUBG yellow

Secondary Accent

Olive green for platform/mode badges

Text

White

Secondary text

Light gray

Muted text

Dark gray

Avoid introducing additional accent colors.

---

# Visual Atmosphere

The application currently feels slightly empty.

Add subtle atmosphere without distracting from the data.

Examples:

very light tactical grid

extremely subtle noise texture

soft radial background gradient

Do NOT use large background images.

---

# Components

Improve but do not redesign.

Search Bar

Player Card

Season Overview

Recent Matches

Stat Cards

Badges

Buttons

Cards

Keep the overall interaction model unchanged.

---

# UX Principles

Prioritize

clarity

information hierarchy

professional appearance

desktop usability

readability

Avoid unnecessary visual effects.

---

# Technical Constraints

The project uses

React

TypeScript

Material UI

Do NOT introduce a different UI framework.

Reuse existing components whenever possible.

Avoid unnecessary refactoring.

Only modify what is required to improve the design.

---

# Deliverables

Before writing code,

first explain:

1.

Your design strategy.

2.

What will be changed.

3.

What will remain unchanged.

4.

Why each change improves UX.

After that,

implement the redesign incrementally.

Do NOT rewrite the entire page at once.

Keep commits small and maintainable.
One final constraint:

Every design decision should make the application feel closer to a production-ready gaming analytics platform while preserving the existing implementation. Prefer refinement over replacement. If a component is already good, improve it instead of rebuilding it.