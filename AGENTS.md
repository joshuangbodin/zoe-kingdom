# Resolved Issues

## ✅ 1. Posts use uid reference instead of user snapshots
`createPost` now only stores the user's `uid`. The feed resolves `username` and `avatar` in real-time via a `useUserCache` hook that subscribes to the Firestore `users/{uid}` document for each unique post author. When a user updates their name or avatar, all their posts will reflect the changes immediately.

## ✅ 2. Commenting system implemented
- **`post.tsx`** (`/(network)/post`): A dedicated post detail page that shows the full post, a comments list, and a comment input field.
- Tapping the 💬 icon on any post in the feed navigates to this page.
- Comments are stored in `posts/{postId}/comments` subcollection and subscribed to in real-time via `subscribeToComments`.

## ✅ 3. StatusNote modal implemented
- Tapping a user's story circle (with a status note badge) opens a modal showing the full status note text.
- The badge in the feed truncates long notes with an ellipsis (…).