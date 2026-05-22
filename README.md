# MaMoney - Money Management App

A React Native + TypeScript money management application that helps you track your income and expenses using Firebase as the backend database. Works on Web, iOS, and Android.

## Features

- 🔐 **User Authentication**: Secure login and registration with Firebase Authentication
- 💰 **Income Tracking**: Record all sources of income
- 💸 **Expense Tracking**: Categorize and track all your expenses
- 📊 **Balance Dashboard**: View your total balance, income, and expenses at a glance
- 📱 **Beautiful UI**: Clean and intuitive Material Design interface
- ☁️ **Cloud Sync**: All data is synced with Firebase in real-time
- 📱 **Cross-Platform**: Works on Android, iOS, and Web platforms
- 🤖 **AI Chat**: Ask AI questions about your finances

## Project Structure

```
mamoney/
├── src/
│   ├── App.tsx                      # App entry point and navigation
│   ├── index.tsx                    # Expo entry point
│   ├── screens/
│   │   ├── LoginScreen.tsx          # Authentication
│   │   ├── HomeScreen.tsx           # Dashboard
│   │   ├── AddTransactionScreen.tsx # Add/edit transactions
│   │   ├── TransactionListScreen.tsx # View all transactions
│   │   ├── AskScreen.tsx            # AI chat interface
│   │   └── SettingsScreen.tsx       # User settings
│   ├── components/                  # Reusable UI components
│   ├── services/
│   │   └── firebase.ts              # Firebase integration
│   ├── store/
│   │   └── index.ts                 # Zustand state stores
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   ├── utils/
│   │   ├── currency.ts              # Currency formatting
│   │   └── categories.ts            # Transaction categories
│   └── test/
│       └── setup.ts                 # Jest test configuration
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── jest.config.js                   # Jest test configuration
├── babel.config.js                  # Babel configuration
├── .eslintrc.json                   # ESLint rules
├── .prettierrc.json                 # Prettier formatting
├── app.json                         # Expo configuration
├── FIREBASE_SETUP.md               # Firebase setup instructions
├── AGENTS.md                        # Development guide for agents
├── MIGRATION_GUIDE.md              # Flutter to React Native migration
└── README.md                       # This file
```

## Prerequisites

- **Node.js:** >=18.0.0
- **npm** or **yarn** - Package manager
- **Firebase Account** - For backend services
- **Expo Go App** - For testing on physical devices (optional)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

1. Create Firebase project at https://console.firebase.google.com
2. Enable Email/Password Authentication
3. Create Firestore Database
4. Create `.env.local` file with your Firebase credentials:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed instructions.

### 3. Start Development Server

```bash
npm start
```

Then choose your platform:
- Press `w` for Web (http://localhost:8081)
- Press `i` for iOS
- Press `a` for Android

### 4. Run on Specific Platform

```bash
# Web
npm run web:start

# iOS
npm run ios

# Android
npm run android
```

## Development Commands

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Build for web
npm run build:web
```

## State Management

The app uses **Zustand** for state management:

- **AuthStore**: Manages user authentication state and operations
- **TransactionStore**: Manages transactions with computed properties (income, expense, balance)

Example usage:

```typescript
import { useAuthStore, useTransactionStore } from '@store/index';

function MyComponent() {
  const { user, signOut } = useAuthStore();
  const { transactions, addTransaction } = useTransactionStore();
  
  // ...
}
```

## Firebase Integration

The app uses Firebase for:

- **Authentication**: User sign up, sign in, sign out
- **Firestore**: Real-time transaction storage and syncing
- **Storage**: Profile pictures and document storage

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed configuration.

## Testing

All tests use Jest + React Testing Library:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test src/utils/currency.test.ts
```

Tests are located alongside their implementations with `.test.ts` suffix.

## Code Quality

The project uses:

- **TypeScript** - Strict type checking
- **ESLint** - Code style enforcement
- **Prettier** - Automatic code formatting

Pre-commit checks:

```bash
npm run type-check  # Type checking
npm test           # Unit tests
npm run lint       # Linting
npm run format     # Formatting
```

## Architecture

### Navigation

- **Stack Navigator** for auth/main flow
- **Bottom Tab Navigator** for main app screens
- Uses React Navigation

### State Flow

1. Components use store hooks (`useAuthStore`, `useTransactionStore`)
2. Stores call Firebase service methods
3. Firebase service handles all backend operations
4. Real-time listeners update stores automatically

### Type Safety

All components, services, and stores are fully typed with TypeScript. Core types are defined in `src/types/index.ts`.

## Important Constraints

- **Node:** >=18.0.0
- **React Native:** 0.74+
- **TypeScript:** 5.3+
- **Firebase SDK:** 10.5+
- **Zustand:** 4.5+

## Platform-Specific Code

For platform-specific implementations:

```typescript
import { Platform } from 'react-native';

const fontSize = Platform.select({
  ios: 18,
  android: 16,
  web: 16,
});
```

## Environment

The app is built with:

- **Expo**: Managed React Native service
- **React Navigation**: Navigation library
- **Zustand**: State management
- **Firebase Web SDK**: Backend services
- **Jest**: Testing framework

## Debugging

### Chrome DevTools (Web)

```bash
npm run web:start
# Press F12 in browser to open DevTools
```

### Expo Go (Mobile)

1. Install Expo Go app on your device
2. Run `npm start`
3. Scan QR code with Expo Go
4. View logs in Expo Go or terminal

### Firebase Console

- Monitor authentication, database, and storage
- Check security rules and indexes
- View real-time activity

## Troubleshooting

### Firebase Connection Issues

- Verify `.env.local` has correct credentials
- Check Firestore rules in Firebase Console
- Ensure email/password auth is enabled

### Type Errors

```bash
npm run type-check
```

### Lint Issues

```bash
npm run lint:fix
```

### Test Failures

```bash
npm test -- --verbose
npm test -- --no-coverage
```

## Migration from Flutter

This project was migrated from Flutter to React Native. See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for details on:

- What changed in the architecture
- File mappings between Flutter and React Native
- Breaking changes and how to handle them
- Dependency equivalents

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and run tests: `npm test`
3. Ensure code quality: `npm run lint` and `npm run format`
4. Commit with clear message: `git commit -am 'Add feature'`
5. Push and create a pull request

## License

ISC

## Support

For issues or questions, please check:

- [AGENTS.md](AGENTS.md) - Development guide for agents
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Firebase configuration
- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) - Flutter to React Native migration
- [React Native Docs](https://reactnative.dev)
- [Expo Docs](https://docs.expo.dev)
- [Firebase Docs](https://firebase.google.com/docs)
