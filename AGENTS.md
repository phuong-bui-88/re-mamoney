# AGENTS.md – MaMoney React Native + TypeScript

**React Native + TypeScript** money-tracking app (Expo). Firebase backend, Zustand state, Jest tests.

**Node >=18.0.0 required.** See [README.md](README.md) for features overview; [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for credentials.

## Essential Commands

```bash
npm install
npm start                 # Choose: w (web), i (iOS), a (Android)
npm run web:start         # Web only
npm run iphone            # Web app in Chrome as an iPhone + DevTools (DEVICE=se|15|15pm)
npm run ios / android     # Mobile only

npm run type-check        # TypeScript check (no emit)
npm test                  # Jest
npm run lint              # ESLint src/
npm run format            # Prettier (100 char line)
npm run lint:fix          # Auto-fix lint
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

**Pre-commit:** `npm run type-check && npm test && npm run lint && npm run format:check`

## Auto-Reload After Code Changes

**MANDATORY: After making ANY code changes (file edits, new files, refactoring), ALWAYS run:**

```bash
./scripts/reload-app.sh
```

This script:
1. Checks if Expo is running (creates tmux session if not)
2. Sends WebSocket reload command to Metro bundler
3. Works on WSL2 with tmux

**To attach to Expo session:** `tmux attach -t expo`
**To detach from tmux:** `Ctrl+b` then `d`

## Project Structure (React Native only)

Active code is in **`src/`**. Old Flutter files (`lib/`, `pubspec.yaml`, Android/iOS native Flutter dirs) are **NOT active** but still in repo—ignore them.

```
src/
├── App.tsx                         # Stack + Bottom Tab navigation
├── index.tsx                       # Expo entry
├── screens/                        # LoginScreen, HomeScreen, AddTransactionScreen, 
│                                   # TransactionListScreen, AskScreen, SettingsScreen
├── services/firebase.ts            # Firebase Auth/Firestore singleton
├── store/index.ts                  # Zustand: useAuthStore, useTransactionStore
├── types/index.ts                  # Interfaces: Transaction, User, ChatMessage
├── utils/
│   ├── currency.ts                 # Formatting, date helpers
│   └── categories.ts               # INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_LABELS, CATEGORY_ICONS
├── components/                     # (Minimal; mostly screen code)
└── test/setup.ts                   # Jest config: mocked Firebase

Config:
├── package.json                    # 80+ deps; all @react-native-firebase/* + @react-navigation/*
├── tsconfig.json                   # Strict mode; baseUrl + path aliases (@/, @screens/, etc.)
├── jest.config.js                  # Preset: react-native; ts-jest transformer; path aliases
├── babel.config.js                 # @babel/preset-react, @babel/preset-typescript
├── .eslintrc.json                  # ESLint + React + TypeScript
├── .prettierrc.json                # 100 char line width
└── app.json                        # Expo config

Scripts:
├── scripts/reload-app.sh           # Auto-reload Expo app (detects devices, sends reload)
├── scripts/test-reload.sh          # Test suite for reload script
└── package.json                    # "reload": "./scripts/reload-app.sh"
```

## State Management (Zustand)

Two stores in `src/store/index.ts`:

- **`useAuthStore`**: `user`, `signIn(email, password)`, `signUp(email, password)`, `signOut()`, `setUser()`
- **`useTransactionStore`**: `transactions` (array), `addTransaction()`, `editTransaction()`, `deleteTransaction()`, computed getters: `totalIncome`, `totalExpense`, `balance`

Both call `src/services/firebase.ts` functions. Firebase real-time listeners (`onSnapshot`) auto-update stores.

**Usage:**
```typescript
const { user, signIn } = useAuthStore();
const { transactions, balance } = useTransactionStore();
```

## Navigation

**`src/App.tsx` structure:**
- Stack Navigator: `if (!user)` → LoginScreen, else → BottomTabNavigator
- BottomTabNavigator: HomeScreen, TransactionListScreen, AskScreen, SettingsScreen

## Test Credentials

- **Email:** `d2@gmail.com`
- **Password:** `123456`

## Firebase Required

App **will not run** without `.env.local`:
```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## Testing

Jest + React Testing Library. Runs `src/test/setup.ts` first (Firebase mocked).

- Test files: `src/**/*.test.ts(x)` or `src/**/__tests__/*.ts(x)`
- Pattern: Arrange-Act-Assert; mock Firebase; isolated tests
- `npm test -- --no-coverage` to skip coverage (faster)

## TypeScript Quirks

- Strict mode enabled
- Path aliases in `tsconfig.json`: `@screens/`, `@store/`, `@services/`, `@utils/`, `@types/`, `@components/`, `@/`
- Import as: `import { useAuthStore } from '@store/index'` (not relative paths)

## Platform-Specific Code

Use platform-specific file extensions or `Platform.select()`:

```typescript
// File extensions (processed by Expo bundler)
Button.ts (shared), Button.ios.ts (iOS), Button.android.ts (Android)

// Or inline:
import { Platform } from 'react-native';
const fontSize = Platform.select({ ios: 18, android: 16, web: 16 });
```

## Theme & Styles

Color tokens and shared styles live in two folders:

- **`src/theme/`** — design tokens
  - `src/theme/index.ts` — barrel export: `import { C } from '@theme/index'`
  - `src/theme/colors.ts` — `C` object with all color constants (white, textDark, textLight, textMuted, blue, border, bg, green, greenLight, red, redLight, cardBg, grayLight, grayBorder, divider)
- **`src/styles/`** — shared `StyleSheet` objects
  - `src/styles/index.ts` — barrel export: `import { transItemStyles } from '@styles/index'`
  - `src/styles/transactionItem.ts` — styles for transaction feed bubbles and items

Import pattern:
```typescript
import { C } from '@theme/index';
import { transItemStyles } from '@styles/index';
```

## Key Decisions

- **Expo** (not bare React Native) – live reload, web support, OTA capability
- **Firebase Web SDK** (not `@react-native-firebase/*` for web compat) – uses `firebase/app`, `firebase/auth`, `firebase/firestore`
- **Zustand** (not Redux) – minimal, hook-based, perfect for this scale
- **React Navigation** – standard; Bottom Tabs + Stack Navigator pattern
- **Strict TypeScript** – all code typed

## Debugging

**Web:** `npm run web:start` → F12 in browser → DevTools
**iPhone (on Windows/WSL):** `npm run iphone` opens Chrome with an iPhone user agent, its own profile, and DevTools open. The first time, press Ctrl+Shift+M and pick the iPhone model; the profile remembers it. This is react-native-web, not real iOS (the iOS Simulator needs macOS).
**Mobile:** `npm start` → Scan QR in Expo Go app → logs in terminal + Expo Go
**Firebase:** Check [Firebase Console](https://console.firebase.google.com) for auth, Firestore, real-time activity

## Constraints

- **Node:** >=18.0.0
- **React Native:** 0.74+
- **TypeScript:** 5.3+
- **Expo:** 51.0+
- **Firebase SDK:** 10.5+
- **Zustand:** 4.5+

## References

- [README.md](README.md) – Features, quick start
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) – Firebase credentials step-by-step
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) – Flutter → React Native mapping (historical)
- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [Zustand Docs](https://github.com/pmndrs/zustand)

## Definition of Done (all AI agents)

Before declaring any UI or behavioral change "done":

- **Run the app and exercise the changed feature in the browser.** Start it with
  `./scripts/verify/start-app.sh` (app at `http://localhost:8081`), log in with
  the test account (`d2@gmail.com` / `123456`), and click through the real
  feature — use the browser MCP (Playwright) when available.
- **Check the console and network tab for errors** (including Firebase errors).
- **Show proof:** screenshots, test output, and the steps you took. Save
  screenshots under `.verify/`.
- **Bug fix:** reproduce it first, write a failing test, fix it, then show the
  test passing and the fixed behavior in the app.
- **If you could not verify something, say so** — never silently skip an
  unverifiable area.
- **Update `features.md` status for every feature you verified** (pass or
  fail) — the map is the record of what has been proven in the running app.

The `verify` skill (`.claude/skills/verify/`, mirrored for opencode in
`.opencode/skills/verify/`) has the full workflow and `features.md`, the feature
map of how to reach each screen. Update `features.md` when you change UI,
routes, labels, or testIDs.

## Verification Gate (Stop hook)

`.claude/hooks/verify.sh` is registered as a **Stop hook** in
`.claude/settings.json` (auto-imported by Devin; Claude Code reads it natively).
When the git tree has changes, the agent cannot stop until
`npm run type-check && npm test -- --no-coverage && npm run lint` pass — it gets
one retry (`stop_hook_active` guard), then CI remains the final gate. opencode
has no Stop-hook equivalent; follow this process manually there.

## Corrections Become Checks

When you correct an agent (or a bug comes back), prefer a permanent executable
check over another prose rule: a regression test, a lint rule, stricter types,
or a schema. Keep AGENTS.md for conventions, not for things a test can enforce.
