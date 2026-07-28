# Resolved Issues

## ✅ 1. Posts use uid reference instead of user snapshots
`createPost` stores only the user's `uid`. Feed resolves `username`/`avatar` in real-time via `useUserCache` hook subscribing to Firestore `users/{uid}`. Updates to name/avatar reflect immediately on all posts.

## ✅ 2. Commenting system implemented
- **`post.tsx`**: Full post detail page with real-time comments list + comment input
- 💬 icon in feed navigates to post detail
- Comments stored in `posts/{postId}/comments` subcollection

## ✅ 3. StatusNote modal implemented
- Tapping a user's story circle with badge opens full status note modal
- Badge truncates long notes with ellipsis

## ✅ 4. Toast feedback system
- `Toast.tsx`: Reusable toast with `ToastProvider` context + `useToast` hook
- Animated slide-in with success (green), error (red), info (purple) variants
- Auto-dismisses after 3 seconds, tap to dismiss
- Integrated into: feed likes, habit creation, habit completion, post sharing, commenting, errors

## ✅ 5. Pull-to-refresh everywhere
- Feed (`FlatList` refreshing/onRefresh)
- Habits (`FlatList` refreshing/onRefresh)

## ✅ 6. Streak logic fixed
- `streak.ts`: Now properly handles current-day gaps — if user hasn't completed today, it checks from yesterday, preventing premature streak breaks

## ✅ 7. UI consistency
- All screens use consistent `bg-bg`, `bg-card-1`, `bg-card-2`, `font-sora-*`, `font-serif` classes
- Consistent button styles, header patterns, padding, border styles across feed, habits, bible, sharethought, post detail
- Consistent `rounded-xl`/`rounded-2xl`/`rounded-[24px]` pattern matching the app's design system