---
name: figma_project
description: >-
  Redraw the ENTIRE MaMoney project (every screen, modal and the tab bar) in
  Figma with a better, modern UI than the current app, using the Figma MCP.
  Always draws all pages, never just one. Use when the user calls
  /figma_project, or says "draw my project on Figma", "redesign the UI in
  Figma", "design all screens in Figma", "make a better UI in Figma".
---

# figma_project

Draw **all pages** of this React Native (Expo) app in Figma, redesigned with a
better UI, so the user opens Figma and finds the whole project there.

Rules that never change:
- EVERY run draws ALL pages. There is no per-screen argument. If the user names
  one screen, still draw all and mention that one first in the report.
- Do not modify anything under `src/`. This skill only produces Figma output.
- Never print, log or store the Figma token. It lives in the user-scope MCP
  config (`figma` server, `FIGMA_API_KEY`).
- Keep the real app copy, features and data fields. Do not invent features.

Optional argument: a style direction (e.g. "dark, playful"). Default: clean,
modern fintech look.

## Step 0 - Preflight (Figma MCP)

1. Load the Figma tools with ToolSearch (query `figma`). Check which are
   available.
2. The token-based `figma` server (`figma-developer-mcp`) is mostly read-only
   (get file / nodes / images). Drawing needs WRITE tools (create frames, text,
   components, styles, variables), for example the official Figma MCP
   (`mcp__plugin_design_figma__*`, OAuth) or a plugin-bridge MCP.
3. If no write-capable tool exists: stop drawing, tell the user exactly what is
   missing, and offer to start sign-in with
   `mcp__plugin_design_figma__authenticate` /
   `complete_authentication`. Do not pretend to draw.
4. Ask which Figma file/team to draw into only if it cannot be created
   automatically. Default target: a new file named `MaMoney - Redesign` in the
   user's Drafts.

## Step 1 - Enumerate every page (build the checklist)

Do this at run time so new screens are never missed:

1. `ls src/screens/*.tsx` (ignore `__tests__`). Currently: Login, Home,
   AddTransaction, EditTransaction, TransactionList, Ask, Settings.
2. Read `src/App.tsx` for navigation: stack, bottom tabs, tab icons/order.
3. List modals/overlays in `src/components/` (e.g. `DayTransactionsModal`) and
   include each as its own frame.
4. Write the checklist (page name -> source file) and keep it visible; tick off
   each as it is drawn.
5. Read each screen and the components it uses: layout, copy, states (empty,
   loading, error), data fields. Read `src/theme/colors.ts` for current tokens
   (`C.primary #00BFA5`, `C.bg #F5F7FA`, `C.textDark #1a1a2e`, income green,
   expense red) and `src/styles/`.

## Step 2 - Design direction (better than current)

Apply to every page:
- Tokens: extend `C` into primary / surface / elevated / on-surface tones; 8pt
  spacing scale; type scale (Display 32, Title 22, Body 16, Caption 12);
  radii 12 / 16 / 24; soft shadows; income/expense semantic colors.
- Hierarchy: a hero balance card on Home, clear income vs expense, calendar and
  charts in rounded cards with breathing room, transaction list grouped by date
  headers, one primary action per screen, FAB kept and polished.
- Accessibility: touch targets >= 44pt, text contrast >= 4.5:1.
- Provide light mode; add a dark variant of key screens when the style allows.

## Step 3 - Build in Figma via the MCP

Order matters:
1. Create the file with pages: `Tokens`, `Components`, `Screens`.
2. `Tokens`: color styles/variables, text styles, spacing, radius, shadows.
3. `Components`: Button, Input, Card, StatisticsCard, TransactionRow,
   SegmentedControl, PeriodFilter, FAB, Tab bar, Modal sheet, chart cards.
   Use auto-layout and variants (states).
4. `Screens`: one 390x844 frame per page from the checklist, laid out in a
   left-to-right grid with labels, built from the components above. Layer names
   follow `Screen/Section/Element`.
5. If the file already has frames from a previous run, ask before overwriting,
   then update them in place so the file holds the full current set.

## Step 4 - Verify (fail the run on mismatch)

- Fetch the created file back through the MCP (nodes + screenshots).
- Drawn screen frame count MUST equal the checklist count. Any missing page:
  draw it, then re-check.
- Check styles/variables are used (no stray hardcoded colors) and text is not
  clipped.

## Step 5 - Report

Return:
- The Figma file link and where to find it (Drafts / file name).
- The checklist of pages with a tick for each drawn frame.
- Token map: old `C.*` value -> new token.
- For each page, a short Current vs Expected note, with the box-drawing wireframe
  (never Mermaid), per the user's global drawing rule.
- Anything not possible via the MCP (e.g. missing write access) and how it was
  handled.
