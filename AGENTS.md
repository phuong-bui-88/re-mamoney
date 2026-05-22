# AGENTS.md – MaMoney React Native + TypeScript

**React Native + TypeScript** money-tracking app (Expo). Firebase backend, Zustand state, Jest tests.

**Node >=18.0.0 required.** See [README.md](README.md) for features overview; [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for credentials.

## Essential Commands

```bash
npm install
npm start                 # Choose: w (web), i (iOS), a (Android)
npm run web:start         # Web only
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

## Key Decisions

- **Expo** (not bare React Native) – live reload, web support, OTA capability
- **Firebase Web SDK** (not `@react-native-firebase/*` for web compat) – uses `firebase/app`, `firebase/auth`, `firebase/firestore`
- **Zustand** (not Redux) – minimal, hook-based, perfect for this scale
- **React Navigation** – standard; Bottom Tabs + Stack Navigator pattern
- **Strict TypeScript** – all code typed

## Debugging

**Web:** `npm run web:start` → F12 in browser → DevTools
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
