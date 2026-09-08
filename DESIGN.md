---
name: Frontend Helpdesk Design System
description: >
  Agent-readable design guidance for the helpdesk frontend. Follow the current
  implemented visual language from frontend-helpdesk and preserve its clean,
  practical, admin-dashboard feel.
colors:
  brand:
    primary:
      value: "#2563EB"
      usage: Primary CTA, active navigation, links, focused interactive emphasis.
    primary-hover:
      value: "#1D4ED8"
      usage: Hover state for primary actions.
    primary-focus:
      value: "#3B82F6"
      usage: Focus ring and focus border.
    primary-disabled:
      value: "#60A5FA"
      usage: Disabled primary buttons.
  layout:
    app-bg:
      value: "#F3F4F6"
      usage: Main page background.
    surface:
      value: "#FFFFFF"
      usage: Cards, forms, tables, modals, headers.
    sidebar:
      value: "#0F172A"
      usage: Dashboard sidebar background.
    sidebar-hover:
      value: "#1E293B"
      usage: Sidebar hover state.
    sidebar-muted:
      value: "#CBD5E1"
      usage: Inactive sidebar label text.
    sidebar-surface:
      value: "#F1F5F9"
      usage: Logo panel inside sidebar.
  text:
    strong:
      value: "#1F2937"
      usage: Main headings and important body text.
    body:
      value: "#4B5563"
      usage: Default readable body text.
    muted:
      value: "#6B7280"
      usage: Secondary descriptions and metadata.
    inverse:
      value: "#FFFFFF"
      usage: Text on dark or primary surfaces.
  border:
    subtle:
      value: "#E5E7EB"
      usage: Cards, tables, inputs, headers, modal outlines.
    input:
      value: "#D1D5DB"
      usage: Default input border.
  feedback:
    danger:
      value: "#DC2626"
      usage: Error text and destructive emphasis.
    danger-bg:
      value: "#FEE2E2"
      usage: Error banners and badges.
    danger-strong:
      value: "#EF4444"
      usage: Destructive button background.
    success:
      value: "#16A34A"
      usage: Success action and confirmation emphasis.
    success-hover:
      value: "#15803D"
      usage: Hover state for success actions.
    success-bg:
      value: "#DCFCE7"
      usage: Success banners and status badges.
    warning:
      value: "#A16207"
      usage: Medium priority text.
    warning-bg:
      value: "#FEF9C3"
      usage: Medium priority badge background.
    assigned:
      value: "#C2410C"
      usage: Assigned status text.
    assigned-bg:
      value: "#FFEDD5"
      usage: Assigned status badge background.
    progress:
      value: "#7E22CE"
      usage: In progress status text.
    progress-bg:
      value: "#F3E8FF"
      usage: In progress status badge background.
    neutral-status:
      value: "#374151"
      usage: Closed or neutral state text.
    neutral-status-bg:
      value: "#E5E7EB"
      usage: Closed or neutral state badge background.
typography:
  font-family:
    base: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    usage: Use a plain modern sans serif. Do not introduce a decorative font.
  sizes:
    hero:
      value: "2.25rem"
      usage: Landing page title.
    page-title:
      value: "1.5rem"
      usage: Dashboard and section titles.
    card-title:
      value: "1.125rem"
      usage: Card, form, and table section titles.
    body:
      value: "1rem"
      usage: Standard body text and labels.
    small:
      value: "0.875rem"
      usage: Metadata, helper text, badges, table labels.
    xs:
      value: "0.75rem"
      usage: Dense chip content only.
  weights:
    regular: 400
    medium: 500
    semibold: 600
    bold: 700
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
shadows:
  card: "0 1px 2px rgba(0, 0, 0, 0.06)"
  modal: "0 25px 50px rgba(0, 0, 0, 0.18)"
motion:
  popup:
    value: "0.3s ease-out"
    usage: Lightweight modal or popup entrance only.
---

# Overview

This product should feel like a practical internal IT helpdesk, not a marketing site.
The interface should look clean, calm, and operational: light canvas, white working surfaces, clear blue actions, and a dark slate sidebar for dashboard navigation.

The current implementation already establishes the visual identity. Future UI work must extend that identity instead of replacing it.

# Visual Theme

Use a straightforward enterprise dashboard aesthetic:

- light gray application background
- white cards, tables, forms, and modal surfaces
- strong blue accent for primary actions and active states
- dark slate sidebar for navigation and app chrome
- restrained use of semantic colors for ticket state and feedback

Avoid trends that would clash with the current product:

- no glassmorphism
- no neon palettes
- no playful illustrations unless explicitly requested
- no loud gradients as a default background treatment
- no overly rounded consumer-app styling

# Color Rules

## Primary brand color

Use `#2563EB` as the main accent. It should appear in:

- primary buttons
- active navigation items
- interactive links
- focus affordances
- user avatar circles or compact emphasis blocks

Use `#1D4ED8` for hover on primary controls. Use `#3B82F6` for focus rings and focus borders. Use `#60A5FA` for disabled primary states.

## Base surfaces

- App background: `#F3F4F6`
- Main surfaces: `#FFFFFF`
- Default borders: `#E5E7EB`
- Input borders: `#D1D5DB`

Keep surfaces flat and readable. If elevation is needed, prefer a subtle border plus a small shadow before adding stronger shadow depth.

## Dark navigation

Sidebar and dense navigation areas should stay in the slate family:

- sidebar background: `#0F172A`
- hover background: `#1E293B`
- inactive nav text: `#CBD5E1`

Do not convert the product into a full dark theme unless the task explicitly asks for one.

## Semantic states

Reserve semantic colors for status, alerts, and irreversible actions:

- error: `#FEE2E2` background with `#DC2626` text
- destructive button: `#EF4444`, hover darker red
- success: `#DCFCE7` background with `#16A34A` or `#15803D`
- priority medium: `#FEF9C3` background with `#A16207`
- assigned status: `#FFEDD5` background with `#C2410C`
- in progress status: `#F3E8FF` background with `#7E22CE`
- closed or neutral status: `#E5E7EB` background with `#374151`

Only use semantic colors where the meaning is real. Do not use them as decoration.

# Typography

Use a neutral sans serif stack. The current UI does not define a branded display font, so stay with a clean system-like sans approach.

Typography should follow this hierarchy:

- landing title: bold, large, blue or strong neutral
- page title: bold, `1.5rem`
- section title: bold, `1.125rem`
- body text: `1rem`
- support text and metadata: `0.875rem`
- compact chips: `0.75rem`

Tone should feel direct and readable. Prefer sentence case or lower-case operational labels that match the existing dashboard style.

# Spacing And Shape

Use a compact-but-comfortable admin layout:

- default control padding should feel medium density, not spacious marketing density
- cards and forms usually use `1.5rem` internal padding
- page sections usually use `1.5rem` to `2rem` spacing
- table rows should remain compact and scannable

Corner radius should stay moderate:

- inputs and buttons: `0.5rem`
- cards and tables: `0.75rem`
- logo container or larger panels: `1rem`

Do not exaggerate rounding. The product should feel professional and utilitarian.

# Layout Principles

For dashboard pages:

- keep the slate sidebar as the persistent navigation anchor on desktop
- keep page content on a light gray canvas
- place white cards on top of the canvas for grouped content
- use a white top header with a subtle bottom border
- favor simple grids and stacked sections over asymmetrical editorial layouts

For auth and single-purpose pages:

- center the content vertically when appropriate
- use a single white card on a light gray background
- keep the visual weight focused on the form

# Components

## Buttons

Use three main button patterns:

- primary: blue background, white text, medium to bold weight, darker blue hover
- secondary: white background, gray text, gray border, soft gray hover
- destructive or confirmational: semantic color only when the action truly needs it

Buttons should be visually solid, never outlined in brand blue unless a specific feature requires it.

## Inputs

Inputs should use:

- white surface
- gray border
- dark readable text
- blue focus ring and blue focus border
- rounded medium corners

Do not use heavy shadows, inset effects, or tinted input backgrounds.

## Cards

Cards are the main structural container. They should use:

- white background
- subtle gray border
- small shadow
- medium or large radius

Section headers inside cards may use a bottom border to separate heading from content.

## Tables

Tables should stay simple and operational:

- white table surface
- light gray header row
- subtle row separators
- hover state with soft gray tint
- links in blue
- badges for priority and status

Prioritize scannability over visual novelty.

## Status Badges

Badges should be small rounded pills with:

- light semantic background
- darker semantic text
- semibold text
- no icons unless the context truly benefits

## Modals

Modals should use:

- dark semi-transparent overlay
- centered white panel
- slightly stronger shadow than cards
- concise title and supporting text
- clear primary and cancel actions

If using entrance animation, keep the current popup motion pattern subtle and fast.

# Interaction

Interactions should feel dependable and unsurprising:

- hover states should darken or tint slightly, never jump dramatically
- focus states must be visible and use the blue focus color
- disabled states should reduce contrast and show non-interactive cursor behavior
- destructive actions should be clearly separated from neutral actions

Micro-interaction should stay minimal. The UI is task-oriented, so speed and clarity matter more than flourish.

# Responsive Behavior

On mobile and narrow tablet widths:

- stack content vertically
- preserve comfortable horizontal padding
- allow tables or dense controls to reflow into cards or stacked blocks when needed
- keep primary actions easy to reach
- avoid shrinking text below the documented scale

Do not preserve desktop density at the cost of readability.

# Do

- extend the existing blue, white, gray, and slate language
- keep the product looking like an internal operations dashboard
- use semantic colors only for meaningful states
- favor bordered white surfaces over ornamental decoration
- keep UI copy concise and functional

# Do Not

- introduce a new brand color as a second dominant accent
- replace the slate sidebar with a bright or gradient navigation
- add heavy shadows, blur, or frosted panels
- overuse purple, orange, or green outside status meaning
- redesign pages into a consumer or marketing aesthetic

# Agent Instructions

When generating new UI for this project:

1. Read existing frontend patterns first and continue them.
2. Use the token values in this file before inventing new styles.
3. Prefer Tailwind utility classes that map closely to the documented palette and spacing.
4. If a new component is needed, derive it from the current button, card, table, modal, and form patterns.
5. If a requested design conflicts with this file, preserve the current implemented system unless the user explicitly asks for a redesign.
