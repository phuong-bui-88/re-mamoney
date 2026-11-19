# MaMoney – Feature List

MaMoney is a personal money tracker for Vietnamese users (amounts in VND). It is an Expo / React Native + TypeScript app backed by Firebase (Auth + Firestore). It runs on Android, iOS and web.

The app has four bottom tabs: **Dashboard**, **Transactions**, **Ask AI** and **Settings**. It also has two stacked screens: **Add Transaction** and **Edit Transaction**.

---

## 1. Authentication & accounts

- **Sign in / sign up** with email and password (Firebase Auth). One screen toggles between the two modes.
- **Persistent session**: the app listens for Firebase auth state, so a signed-in user goes straight to the Dashboard.
- **Accounts on this device**: every successful sign-in is saved to the Firestore `deviceUsers` collection, keyed by a per-device ID.
- **Account switching** (Settings): lists every account used on this device. **Switch** shows that account's data and resets the selected period to the current month.
- **Sign out** from Settings.

## 2. Adding transactions (chat-style quick entry)

You add transactions by typing natural text into a chat-style feed, not by filling in a form.

- **Free-text input**, e.g. `Coffee 30k`, `hủ tiếu 25k`, `Grab 120k yesterday`, `salary 20m`.
- **Multiple transactions per message**: separate them with newlines or commas (`lunch 80k, taxi 120k`). One message can also be a pasted multi-line list.
- **Paste from clipboard** button.
- **Two-step parsing**:
  1. **Local parser** (offline, instant). Supported amount formats:
     - `k` / `ca` = ×1,000
     - `m`, `tr`, `t`, `triệu` / `trieu` = ×1,000,000
     - Dotted thousands (`20.000`)
     - Plain numbers of 1,000 or more
     - Optional `đ`, `d` or `vnd` suffix

     Local results default to an expense in the *food* category, dated today.
  2. **AI parser fallback**: GPT-4.1 via GitHub Models. It runs when the local parser finds nothing. It sets the category, the type (income or expense) and relative dates ("yesterday", "last Friday", "3 days ago", `20/06`). It also understands `tỉ`/`b` and converts USD at 1 USD = 25,000 VND.
- **Inline errors**: when a message can't be parsed, the feed shows a hint (e.g. "Try 'Coffee 30k'…") or the API error (missing token, 401, 429, network).
- **Recent feed**: shows transactions from the last 3 days in date order.
- **Grouped entries**: transactions created from one multi-line message appear as a **GROUP** card. The card shows the group total and highlights the source line for each item.
- **Today's total**: today's net spend appears at the top of the screen.
- **Swipe to delete** any transaction in the feed.
- **Tap to edit** opens the Edit Transaction screen.
- After each send, the input field keeps focus and the feed scrolls to the newest item.

## 3. Editing transactions

The Edit Transaction screen has these fields:

- **Description** (required).
- **Amount**, with a **×1000 toggle**: typing `30` with the toggle on stores 30,000. A live formatted preview shows the result.
- **Type** badge (Income or Expense), read-only.
- **Category picker**: a dropdown with icons. It lists only the categories for the transaction's type.
- **Date**: a dd/MM/yyyy field plus a calendar popup with month navigation, **Today**, **OK** and **Cancel**.
- **Validation**: description required, amount above 0, valid date. Saving updates Firestore and returns to the previous screen.

## 4. Dashboard (Home tab)

- **Year selector**: a dropdown covering the current year −5 to +1.
- **Monthly Net chart**: a bar chart of income minus expenses for each month of the selected year.
  - Drag or fling the 5-month strip; it snaps to a month.
  - The Y-axis rescales to the months on screen.
  - Tapping a bar selects that month for the whole app.
  - An ⓘ button explains how the chart is calculated.
- **Net Change card**: net change, total income and total expenses for the selected month. Tapping **Expense** scrolls down to the category breakdown. An ⓘ button explains the card.
- **Category Breakdown**:
  - Donut chart with an Expense / Income toggle.
  - Each slice has a badge with the category icon and its percentage.
  - The legend lists each category's amount and percentage, sorted largest first.
  - Tapping a category drills into a list of that category's transactions for the month. Each row can be edited (tap) or deleted (swipe).
- **Floating "+" button** opens Add Transaction.

## 5. Transactions tab (calendar view)

- **Month calendar** (weeks start Monday):
  - Each day shows its net amount in compact form (`+50k`, `-20k`, `+1.5M`), colored green or red.
  - Today is highlighted.
  - Tapping the header opens a month and year picker.
- **Monthly net total**: the net total for the selected month appears below the calendar.
- **Day popup**: tapping a day opens a modal for that date with:
  - The day's transactions, each editable (tap) or deletable (swipe), plus the day's net total.
  - A **"+" quick add** that works like the chat entry: text input, paste and send. New transactions are saved with the selected date.
- The popup closes when you change month or year, or leave the tab.

## 6. Ask AI (financial Q&A)

- A chat where you ask questions about your own money, e.g. "How much did I spend on food this month?".
- The 30 most recent transactions are sent to GPT-4.1 (GitHub Models) as context.
- Answers are short, use VND formatting, and say so when the data can't answer the question.
- Chat history is stored in the Firestore `chatMessages` collection and syncs in real time.
- Error messages cover a missing token, an invalid token (401) and rate limits (429).

## 7. Settings tab

- Shows the account's email and display name.
- **Quick action**: Add Transaction.
- **Accounts on this device**, with the switch action.
- **Sign Out**.

## 8. Categories

| Type | Categories |
|---|---|
| Income | Salary, Bonus, Freelance, Investment, Other |
| Expense | Food & Dining, Transport, Utilities, Entertainment, Health & Medical, Shopping, Other |

Each category has its own Ionicons icon and chart color.

## 9. Data, sync & formatting

- **Real-time sync**: Firestore `onSnapshot` listeners update the transaction and chat lists live.
- **Shared period state**: the selected month and year are shared by the Dashboard and Transactions tabs, so totals stay consistent.
- **Firestore collections**: `transactions`, `chatMessages`, `deviceUsers`. Security rules are in `firestore.rules`.
- **Formatting**: VND currency (`vi-VN`), dd/MM/yyyy dates, and compact amounts (`k`, `M`).
- **Search helper**: matching ignores Vietnamese accents (`đ` matches `d`).

## 10. Configuration

Settings go in `.env.local` (see `.env.local.example`):

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_FIREBASE_*` | Firebase project config (required) |
| `EXPO_PUBLIC_GITHUB_TOKEN` | GitHub Models token for the AI parser and Ask AI (optional; without it only the local parser works) |

## 11. Developer tooling

- Jest + React Testing Library tests for screens, components, store and utils, with Firebase mocked.
- Strict TypeScript, ESLint and Prettier (100-character lines).
- `scripts/reload-app.sh` reloads the running Expo app through Metro in a tmux session.
- Docker / docker-compose and EAS build config.
