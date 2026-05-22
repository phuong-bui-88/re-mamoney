# Migration Guide: Flutter to React Native

This document outlines the conversion of the MaMoney project from Flutter/Dart to React Native/TypeScript.

## Overview

The project has been successfully converted from Flutter to React Native with TypeScript. All core functionality remains the same, but the implementation details have changed to follow React Native and web standards.

## Key Changes

### 1. Language & Framework
- **From:** Flutter (Dart, Google's framework)
- **To:** React Native (JavaScript/TypeScript, React-based cross-platform framework)
- **Advantage:** Larger community, more web-friendly, JavaScript ecosystem

### 2. Project Structure
```
Flutter Structure          →    React Native Structure
lib/                       →    src/
├── main.dart             →    ├── App.tsx
├── screens/              →    ├── screens/
├── services/             →    ├── services/
├── models/               →    ├── types/
├── utils/                →    ├── utils/
└── widgets/              →    ├── components/
```

### 3. State Management
- **From:** Provider (ChangeNotifierProvider)
- **To:** Zustand (lightweight, hook-based store)

**Migration Example:**

```dart
// Flutter Provider
final provider = Provider.of<TransactionProvider>(context);
provider.addTransaction(transaction);
```

```typescript
// React Native Zustand
const { addTransaction } = useTransactionStore();
addTransaction(transaction);
```

### 4. Firebase Integration
- **From:** `flutter_fire` packages
- **To:** Firebase Web SDK (`firebase` npm package)

Both achieve the same Firebase operations (Auth, Firestore, Storage) but with different APIs.

### 5. UI Components
- **From:** Flutter Material Design widgets
- **To:** React Native built-in components

```dart
// Flutter
Text('Hello'),
FloatingActionButton(onPressed: () => {}),
```

```typescript
// React Native
<Text>Hello</Text>
<TouchableOpacity onPress={() => {}} />
```

### 6. Testing
- **From:** Flutter test framework
- **To:** Jest + React Testing Library

### 7. Build & Development
- **From:** `flutter pub get`, `flutter run`
- **To:** `npm install`, `npm start`

## File Mappings

| Flutter File | React Native File | Notes |
|---|---|---|
| `lib/main.dart` | `src/App.tsx` | Entry point and navigation setup |
| `lib/screens/` | `src/screens/` | Screen components (same structure) |
| `lib/services/firebase_service.dart` | `src/services/firebase.ts` | Firebase operations |
| `lib/services/auth_provider.dart` | `src/store/index.ts` (AuthStore) | Auth state management |
| `lib/services/transaction_provider.dart` | `src/store/index.ts` (TransactionStore) | Transaction state |
| `lib/models/` | `src/types/` | TypeScript interfaces |
| `lib/utils/` | `src/utils/` | Utility functions |
| `test/` | `src/**/*.test.ts` | Jest tests |
| `pubspec.yaml` | `package.json` | Dependencies |
| `analysis_options.yaml` | `.eslintrc.json` | Linting rules |
| `.prettierrc` | `.prettierrc.json` | Code formatting (same concept) |

## Breaking Changes

### 1. Import Paths
```dart
// Flutter
import 'package:mamoney/services/firebase_service.dart';
```

```typescript
// React Native
import firebaseService from '@services/firebase';
```

### 2. Type System
```dart
// Flutter (dynamic typing with type hints)
final amount = 1000.50;
```

```typescript
// React Native (strict TypeScript)
const amount: number = 1000.50;
```

### 3. Async Operations
```dart
// Flutter
final result = await transactionProvider.loadTransactions();
```

```typescript
// React Native
const { loadTransactions } = useTransactionStore();
await loadTransactions(filter);
```

### 4. Navigation
```dart
// Flutter
Navigator.push(context, ...);
```

```typescript
// React Native
navigation.navigate('ScreenName');
```

## Dependency Equivalents

| Flutter | React Native | Purpose |
|---------|--------------|---------|
| `provider` | `zustand` | State management |
| `firebase_core` | `firebase` | Firebase initialization |
| `cloud_firestore` | `firebase/firestore` | Database |
| `firebase_auth` | `firebase/auth` | Authentication |
| `intl` | `date-fns` or `intl` | Date/formatting |
| `flutter_lints` | `eslint` | Linting |
| `flutter_test` | `jest` | Testing |
| `uuid` | `uuid` | ID generation |

## New Dependencies Added

- **react**: Core React library
- **react-native**: Mobile framework
- **react-native-web**: Web support
- **expo**: Development platform
- **@react-navigation**: Navigation library
- **zustand**: State management
- **typescript**: Type safety
- **jest**: Testing
- **eslint/prettier**: Code quality

## Migration Checklist

For future developers converting Flutter features to React Native:

- [ ] Create TypeScript interfaces in `src/types/`
- [ ] Create Firebase service methods in `src/services/firebase.ts`
- [ ] Create Zustand store hooks in `src/store/index.ts`
- [ ] Create React components in `src/screens/` or `src/components/`
- [ ] Create unit tests in `src/**/*.test.ts`
- [ ] Add utility functions to `src/utils/`
- [ ] Update navigation in `src/App.tsx` if adding new screens
- [ ] Run `npm run format` and `npm run lint:fix`
- [ ] Run `npm test` to verify all tests pass
- [ ] Run `npm run type-check` for TypeScript errors

## Running the App

```bash
# Install dependencies
npm install

# Start development server
npm start

# Choose platform:
# - Press 'w' for web
# - Press 'i' for iOS
# - Press 'a' for Android
```

## Common Issues & Solutions

### Issue: Module not found
**Solution:** Check import paths match the `tsconfig.json` path aliases

### Issue: Firebase initialization error
**Solution:** Verify `.env.local` has correct Firebase credentials

### Issue: Type errors
**Solution:** Run `npm run type-check` to identify and fix TypeScript issues

### Issue: Tests failing
**Solution:** Check that Firebase mocks in `src/test/setup.ts` are properly configured

## Benefits of React Native

1. **Larger Ecosystem:** More npm packages and community support
2. **Web-First:** Easier web development with React Native Web
3. **JavaScript Standard:** Developers familiar with JavaScript can contribute
4. **Faster Development:** Hot reload and faster iteration
5. **Better Tooling:** VS Code, ESLint, Prettier are all standard

## Resources

- [React Native Documentation](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Zustand](https://github.com/pmndrs/zustand)
- [Firebase Web SDK](https://firebase.google.com/docs/web)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
