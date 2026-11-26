---
name: verify
description: >-
  Verify a change in the MaMoney app by running it and exercising the changed
  feature in a real browser, checking console/network for errors, and showing
  proof. Use before declaring any UI or behavioral change done. Covers launch,
  login, the feature map, evidence capture, and cleanup.
license: MIT
compatibility: claude, devin, opencode
metadata:
  category: verification
---

# Verify

Prove a change works in the running app — not just in unit tests. This is the
project's "definition of done" for observable behavior.

## Launch

```bash
./scripts/verify/start-app.sh
```

This ensures Expo/Metro is running (reuses `scripts/reload-app.sh`, which
manages the `expo` tmux session on WSL2) and waits until the web app responds.
App URL: **http://localhost:8081** (react-native-web, not a real device).

If the app is already running, this is fast — it just confirms the URL serves
HTML. After code edits, `scripts/reload-app.sh` (or this script) reloads the
bundle.

## Drive the browser

Use whatever browser automation is configured:

- **Playwright MCP** — preferred; already configured for opencode
  (`opencode.json`) and provided via `.mcp.json` for Claude Code.
- **Chrome DevTools MCP** — equivalent alternative.
- Manual browser — acceptable fallback; say so in the report.

Navigate to `http://localhost:8081`, then **log in with the test account**:

- Email: `d2@gmail.com`
- Password: `123456`

The login screen has "Email"/"Password" placeholders and a "Sign In" button.
After login you land on the **Dashboard** tab.

## Feature map

Read `features.md` (same directory) to find how to reach the feature you
changed, which selectors/testIDs to use, and what result to expect. If your
change adds, removes, or renames UI, **update `features.md` in the same commit**
so the map stays truthful.

## Exercise the change

1. Perform the user actions that exercise the changed behavior (tap the real
   buttons/inputs — don't just assert on the DOM).
2. Check the **browser console** and **network tab** for errors, failed
   requests, and red-screen crashes. Firebase errors count.
3. Capture proof:
   - Screenshot(s) of the exercised state — save under `.verify/` in the repo
     root (gitignored) or next to existing `*.png` proofs.
   - Console/network excerpt if anything looked suspicious (and confirm clean
     if asked).
   - Relevant `npm test` / `npm run type-check` output.
4. For a **bug fix**: reproduce the bug first (screenshot or failing test),
   write a failing test, fix it, then show the test passing and the fixed
   behavior in the browser.

## Data safety

The app uses a real Firebase backend. Only use the `d2@gmail.com` test
account, and don't delete other accounts' data or run destructive operations
(Settings → Switch only switches between accounts saved on this device).
Transactions you create during verification are real — you may delete the ones
you added if the feature allows it.

## Record the result

Before reporting, update `features.md` — the map is the record of what has
been proven in the running app:

- **Passed** → set the feature's Status to `verified <today's date>` and add
  the proof path (e.g. `verified 2026-11-26 · .verify/dashboard.png`).
- **Failed** → set Status to `broken — <one-line reason>` and report it; do
  not describe the task as done.
- **New feature with no row** → add the row first (Feature / How to reach /
  Selector / Expected result), then verify it.
- The `features.md` update goes in the **same commit** as the change.

## Report

End with:

- What you did (steps taken in the app)
- Proof: screenshot paths, console/network status, test output
- Anything you could **not** verify automatically and how you checked it
  manually — never silently skip an unverifiable area

## Cleanup

- Leave the Expo server running (the user may be using it); do not kill the
  `expo` tmux session.
- If you created test transactions, remove them via the app's edit/delete flow
  when practical.
