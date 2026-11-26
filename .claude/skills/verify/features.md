# MaMoney feature map

How to reach each feature in the running web app and what to expect.
App URL: `http://localhost:8081` — start with `./scripts/verify/start-app.sh`,
log in as `d2@gmail.com` / `123456`.

Selectors: React Native `testID` props render as `data-testid` on web. Where no
testID exists, use visible text / placeholder.

**Status column** — updated by the verify skill after every verification run:
`verified YYYY-MM-DD` (+ proof path), `broken — <reason>`, or `unverified`.
A status records the last date the feature was proven in the running app — it
is not a guarantee it still works.

| Feature | How to reach it | Selector / testID | Expected result | Status |
|---|---|---|---|---|
| Login | App start (logged out) | placeholders `Email`, `Password`; button `Sign In` | Dashboard tab loads; balance + charts visible | verified 2026-11-26 · `.verify/login-dashboard.png` |
| Dashboard | Bottom tab `Dashboard` | tab label `Dashboard`; FAB (floating `+` button, `FloatingActionButton`) | Balance/income/expense stats card, monthly chart, category chart | verified 2026-11-26 · `.verify/dashboard.png` |
| Monthly line chart | Dashboard | `monthly-line-chart`, `monthly-chart-info-btn`, `monthly-chart-drag-area`, `line-month-*` | SVG path `monthly-line-path` renders; dragging scrubs months | verified 2026-11-26 · `.verify/dashboard.png` |
| Chart mode toggle | Dashboard / charts | `chart-mode-toggle` | Switches between line/bar (or equivalent) chart modes | verified 2026-11-26 · `.verify/chart-mode-bar.png` |
| Category donut chart | Dashboard | `donut-icon-*`, `donut-pct-*`, `chart-back` | Donut segments per category; back button returns | verified 2026-11-26 · `.verify/dashboard.png` |
| Add Transaction (manual + NL) | Dashboard FAB, or header `+` | hidden tab `AddTransaction`; input placeholder `What did you spend?`; button `Send`; parsed segments `group-*` | Type e.g. `Coffee 30k yesterday` → parsed preview → Send → transaction saved, appears in lists | verified 2026-11-26 · `.verify/add-transaction.png` |
| Transactions list | Bottom tab `Transactions` | tab label `Transactions`; `transaction-list-scroll` | Scrollable list grouped by day, `group-*` testIDs per segment | verified 2026-11-26 · `.verify/transactions.png` |
| Month calendar | Transactions tab | `calendar-header`, `day-{n}`, `today-circle`, `selected-circle`, `matching-dot` | Month navigation; tapping a day filters/opens that day | verified 2026-11-26 · `.verify/transactions.png` |
| Day transactions modal | Tap a day in calendar | `day-modal-overlay`, `day-transactions-modal`, `day-modal-net-total`, `day-modal-input`, `day-modal-paste`, `day-modal-send`, `day-modal-close`, `day-modal-add` | Modal shows day's transactions + net total; input accepts NL/pasted transaction | verified 2026-11-26 · `.verify/day-14-transactions.png` |
| Edit Transaction | Tap a transaction item | stack screen `EditTransaction` | Pre-filled form; save updates the transaction everywhere | verified 2026-11-26 · `.verify/edit-transaction.png` (open only — save not exercised) |
| Ask AI | Bottom tab `Ask AI` | tab label `Ask AI`; input placeholder `Ask about your finances...`; button `Ask` | Chat answers finance questions; messages persist in chat store | broken — see Known issues |
| Settings | Bottom tab `Settings` | tab label `Settings` | Saved device accounts list; `Switch` buttons switch account | verified 2026-11-26 · `.verify/settings.png` |

## Known issues

- **Ask AI fails on web (found 2026-11-26):**
  1. `src/services/aiConfig.ts` calls `https://models.github.ai/inference/chat/completions`
     directly from the browser → blocked by CORS (`No 'Access-Control-Allow-Origin'`
     header). UI shows `API Error: undefined — Network Error`. Needs a proxy
     (e.g. a Vercel serverless function) before Ask AI works on web.
  2. `src/store/chatStore.ts` `sendMessage` calls `addMessage` locally AND the
     Firestore `subscribe` listener echoes the same doc → every message renders
     twice and React logs duplicate-key warnings (`AskScreen.tsx` keys on
     `msg.id`).

## Notes

- Tab bar labels: `Dashboard`, `Transactions`, `Ask AI`, `Settings`.
  `AddTransaction` and `EditTransaction` are stack/hidden screens — reach them
  via the FAB / transaction items, not the tab bar.
- Add Transaction parses natural language locally first
  (`localTransactionParser`) then falls back to the AI parser
  (`aiTransactionParser` → Firebase). Parse failures show
  "Could not parse. Try 'Coffee 30k' or 'Grab 120k yesterday'".
- Keyboard: on web the tab bar hides while the keyboard is open
  (`useWebKeyboard`) — don't treat a missing tab bar as a bug if an input is
  focused.
- Swipe-to-delete (`ReanimatedSwipeable`, `renderLeftActions` → delete on
  right-swipe) did not trigger via Playwright mouse drags on web — drags were
  treated as taps and opened EditTransaction. Verify delete on a real touch
  device, or delete via Firestore if automation is needed.
- Update this file whenever UI, routes, labels, or testIDs change — and after
  every verify run, update the Status column (see SKILL.md "Record the result").
