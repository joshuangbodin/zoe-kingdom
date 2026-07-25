# Zoe Kingdom - Spiritual Social Network

## Architecture Overview
- **Framework**: Expo (React Native) with Expo Router
- **Styling**: TailwindCSS via Uniwind
- **Database**: SQLite (local) + Firebase Firestore (remote)
- **Auth**: Firebase Auth with AsyncStorage persistence
- **State**: React Context (AppProvider)

## Key Screens
- `index.tsx` - Splash/Auth redirect
- `onboarding.tsx` - First-time user onboarding
- `(auth)/signup.tsx` - Multi-step registration
- `(auth)/signin.tsx` - Login
- `(tabs)/home.tsx` - Dashboard with growth stats
- `(tabs)/habits.tsx` - Spiritual habit tracking
- `(tabs)/feed.tsx` - Social feed for sharing thoughts
- `(tabs)/bible.tsx` - Bible reader with verse selection
- `(tabs)/profile.tsx` - User profile & settings
- `(habit)/completehabit.tsx` - Habit completion with timer
- `(network)/sharethought.tsx` - Share Bible verses

## Data Flow
- **Local**: SQLite for habits, habit_logs, spirit_state, bible_verses
- **Remote**: Firebase Firestore for users, posts, comments, likes
- **Auth**: Firebase Auth with onAuthStateChanged listener