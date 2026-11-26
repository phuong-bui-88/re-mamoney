---
name: verify
description: >-
  Verify a change in the MaMoney app by running it and exercising the changed
  feature in a real browser, checking console/network for errors, and showing
  proof. Use before declaring any UI or behavioral change done. The canonical
  instructions and feature map live in .claude/skills/verify/ — read them and
  follow them.
license: MIT
compatibility: opencode
metadata:
  category: verification
---

# Verify (opencode)

The canonical version of this skill lives at
`.claude/skills/verify/SKILL.md` with the feature map at
`.claude/skills/verify/features.md`. **Read both files and follow them
exactly** — they are the single source of truth shared by all agents.

Summary of the flow:

1. Run `./scripts/verify/start-app.sh` → app at `http://localhost:8081`.
2. Log in with `d2@gmail.com` / `123456` using the Playwright MCP configured
   in `opencode.json`.
3. Look up the changed feature in `.claude/skills/verify/features.md`, exercise
   it in the browser, check console/network for errors.
4. Show proof: screenshots under `.verify/`, test output, steps taken; state
   anything that could not be verified.
5. For bug fixes: reproduce first, failing test, fix, show it passing.
