# Zoe Kingdom - Spiritual Social Network

## Architecture Overview
- **Framework**: Expo (React Native) with Expo Router
- **Styling**: TailwindCSS via Uniwind
- **Database**: SQLite (local) + Firebase Firestore (remote)
- **Auth**: Firebase Auth with Google Sign-In via `@react-native-google-signin/google-signin` (native, with Google Play Services check) — no email/password
- **Guest mode**: Users can browse habits / bible / feed (read-only) without an account; signing in is only required to post
- **State**: React Context (AppProvider) — single source of truth for user, guest flag, habits, posts, connectivity & the offline write queue
- **Offline-first**: Firestore offline persistence + AsyncStorage caches + a pending-write queue (`src/libs/offline/`) replayed when connectivity returns

## Key Screens
- `index.tsx` - Splash/Auth redirect (routes signed-in users or guests to tabs, else onboarding)
- `onboarding.tsx` - First-time welcome (Google sign-in or "continue without an account" → guest)
- `(auth)/signin.tsx` - Google sign-in (native, checks Play Services on Android)
- `(auth)/signup.tsx` - Post-Google profile completion (avatar / focus / status)
- `(tabs)/home.tsx` - Dashboard with growth stats
- `(tabs)/habits.tsx` - Spiritual habit tracking
- `(tabs)/feed.tsx` - Social feed (creators can edit/delete their own posts)
- `(tabs)/bible.tsx` - Bible reader with verse selection
- `(tabs)/profile.tsx` - User profile & settings
- `(habit)/completehabit.tsx` - Habit completion with timer
- `(network)/sharethought.tsx` - Share Bible verses (offline-safe)

## Data Flow
- **Local**: SQLite for habits, habit_logs, spirit_state, bible_verses
- **Remote**: Firebase Firestore for users, posts, comments, likes
- **Auth**: Firebase Auth with Google provider; AppProvider hydrates the user (with retry for first sign-in) into context
- **Offline**: `src/libs/offline/queue.ts` buffers writes; `src/libs/offline/sync.ts` replays them; `AppProvider` shows a syncing banner