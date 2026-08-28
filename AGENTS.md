# Zoe Kingdom — Home Page Spec

## ✅ Resolved — Dashboard (Home) premium pass
- Greeting now uses **first name only** (`getFirstName` in `src/constants/time.ts`) and is
  constrained with `numberOfLines={1}` + ellipsis, so a long username can never break the
  layout.
- The **header is now fixed/pinned** (outside the ScrollView) — it no longer scrolls away.
- Consistent premium typographic hierarchy across `home.tsx` + `GrowthStat.tsx`:
  micro-labels (uppercase, letter-spaced) → concise titles → big numeric values. The flame
  animation is a compact decorative accent instead of a 200px full-bleed block.
- Quick Actions standardized into balanced cards (icon tile + label + caption).

