# AGENTS.md - MaMoney Development Guide

Quick reference for agents working in this Flutter + Firebase project. See [README.md](README.md) for full details.

## Project Overview

**MaMoney** is a Flutter app for tracking income/expenses with Firebase backend. Multi-platform (web, Android, iOS, desktop). Containerized dev environment with DevContainer + Docker Compose.

## Commands You'll Need

### Core Flutter Commands

```bash
# Install dependencies
flutter pub get

# Run the app (web is the easiest target)
flutter run -d web

# Format code (required before commits)
dart format lib/

# Run all tests
flutter test

# Run a specific test file
flutter test test/services/ai_service_test.dart

# Run tests in a specific directory
flutter test test/services/

# Run tests with coverage
flutter test --coverage

# Analyze for lints
flutter analyze

# Build for web
flutter build web
```

### In DevContainer

If developing inside the container (recommended):

```bash
# Terminal is already inside the container; run Flutter commands normally
flutter run -d web
```

If running from host terminal:

```bash
# Use the helper script for Android/ADB-dependent commands
./flutter-in-container.sh run -d web
./flutter-in-container.sh test
```

**Note:** ADB is only available inside the container. Running `flutter doctor` on the host will show "Unable to locate Android SDK"—this is expected.

## Project Structure

```
lib/
├── main.dart                    # App entry point, Firebase init, MultiProvider setup
├── screens/                     # UI screens
│   ├── login_screen.dart
│   ├── home_screen.dart         # Dashboard
│   ├── main_navigation_screen.dart
│   ├── add_transaction_screen.dart
│   ├── add_transaction_view_model.dart
│   ├── ask_screen.dart          # AI chat interface
│   ├── edit_transaction_screen.dart
│   ├── invoice_preview_screen.dart
│   └── settings_screen.dart
├── models/
│   ├── transaction.dart         # Core transaction model
│   ├── user.dart
│   ├── chat_message.dart        # For ChatProvider (Firestore persistence)
│   ├── invoice_group.dart
│   ├── invoice_preview_state.dart
│   ├── transaction_filter.dart
│   └── transaction_sync_status.dart
├── services/
│   ├── firebase_service.dart    # Core Firebase operations (auth, Firestore)
│   ├── firebase_config.dart     # Firebase credentials (update with your config)
│   ├── auth_provider.dart       # Authentication state (ChangeNotifierProvider)
│   ├── transaction_provider.dart # Transaction state and computed properties
│   ├── chat_provider.dart       # Chat history state
│   ├── connectivity_provider.dart # Connectivity state
│   ├── ai_service.dart          # AI API calls and message parsing
│   ├── ai_config.dart           # AI configuration constants
│   ├── offline_queue_service.dart # Offline transaction queueing
│   ├── transaction_embeddings.dart # Vector embeddings for RAG
│   └── logging_service.dart     # Logging setup
├── widgets/                     # Reusable UI components
└── utils/                       # Utility functions (currency, formatters, etc.)

test/
├── models/
├── services/
├── screens/
└── utils/

firebase.json                   # Firebase emulator config
firestore.rules                 # Firestore security rules
```

## State Management

Uses **Provider** (ChangeNotifierProvider):

- **AuthProvider**: User authentication state
- **TransactionProvider**: Transaction list, filters, computed properties (totalIncome, totalExpense, etc.)
- **ChatProvider**: Chat message history (persisted to Firestore)
- **ConnectivityProvider**: Network connectivity state

Initialized in `main.dart` via `MultiProvider` before app startup.

## Firebase Setup Required

**Critical for running the app:**

1. Create Firebase project at https://console.firebase.google.com
2. Enable Email/Password Authentication
3. Create Firestore Database
4. Get config from Project Settings
5. Update `lib/services/firebase_config.dart` with:
   - `apiKey`
   - `appId`
   - `messagingSenderId`
   - `projectId`
   - `authDomain`
   - `databaseURL`
   - `storageBucket`

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed steps.

## Key Architectural Decisions

### Firebase Initialization

- Wrapped in try-catch in `main.dart` because Firebase is not supported on Linux desktop.
- App continues running without Firebase on unsupported platforms (useful for testing UI without backend).

### Offline Support

- `OfflineQueueService` queues transactions when offline.
- `ConnectivityProvider` monitors network state.
- `TransactionProvider` syncs queued transactions when connection restored.

### AI Features

- `AiService` calls external AI API for transaction parsing and chat.
- `TransactionEmbeddings` creates vector embeddings for RAG (retrieval-augmented generation).
- `ChatProvider` persists chat history to Firestore via `ChatMessage` model.

## Testing

**All tests must pass before merge:**

```bash
flutter test
```

Test structure by area:

- `test/models/` – Data model serialization/deserialization
- `test/services/` – State management, AI parsing, configuration
- `test/screens/` – Input formatting, widget behavior
- `test/utils/` – Utility functions (e.g., currency formatting)

**Total:** 170+ tests across 7 files. See [test/README.md](test/README.md) for breakdown.

### Test Patterns

- **Arrange-Act-Assert** structure
- No test interdependencies
- Descriptive test names
- Edge cases and error handling covered

## Linting & Analysis

```bash
flutter analyze
```

Uses `flutter_lints` (recommended Flutter lint set). See `analysis_options.yaml`.

## DevContainer Development

The project includes `.devcontainer/devcontainer.json` for containerized development:

```bash
# In VS Code: F1 → "Dev Containers: Reopen in Container"
# Automatically installs Flutter, Dart, Android SDK, Java, etc.
```

Inside the container, all Flutter commands work normally. The host must have Docker Desktop.

## Common Tasks

### Add a New Screen

1. Create file in `lib/screens/`
2. Add route in `main_navigation_screen.dart` or relevant navigation
3. Add Provider consumers if it needs state

### Add a New Model

1. Create file in `lib/models/`
2. Implement `toMap()` and `factory fromMap()` for Firestore serialization
3. Add tests in `test/models/`

### Add a New Service

1. Create file in `lib/services/`
2. If it's state-managed, extend `ChangeNotifier` and create Provider in `main.dart`
3. Add tests in `test/services/`

### Update Firebase Config

Edit `lib/services/firebase_config.dart`. Never commit real credentials—use environment variables in CI/CD.

## Debugging

### Web
- Use Chrome DevTools (F12 in browser)
- VS Code debugger integration available

### Android/iOS
- Use Android Studio/Xcode debuggers
- `flutter run -v` for verbose output

### Firebase
- Check Firebase Console for data and errors
- Enable Firestore logging: `firebase.initializeApp().firestore().enablePersistence()`

## Important Constraints

- **Dart SDK:** >=3.1.0 <4.0.0
- **Flutter:** Latest stable (3.x recommended)
- **Firebase:** Latest versions in pubspec.yaml
- **Provider:** ^6.0.0 (exact version pinned)

## Pre-commit Checklist

1. Run `flutter analyze` – no warnings
2. Run `flutter test` – all pass
3. Run `dart format lib/` – no formatting diffs
4. Commit message follows repo conventions
5. Run cd /workspace && flutter pub get

## References

- [README.md](README.md) – Full feature docs and setup
- [QUICKSTART.md](QUICKSTART.md) – 5-minute onboarding
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) – Firebase credential setup
- [DEVCONTAINER_SETUP.md](DEVCONTAINER_SETUP.md) – Container dev details
- [test/README.md](test/README.md) – Test suite details
- [Firebase Documentation](https://firebase.flutter.dev)
- [Provider Documentation](https://pub.dev/packages/provider)
