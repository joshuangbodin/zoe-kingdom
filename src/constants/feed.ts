/**
 * Shared visual helpers for the Feed.
 *
 * STORY_COLORS is a curated palette of vivid hues used to tint each user's
 * story/status ring. Each user is mapped to a color deterministically from
 * their uid (via getStoryColor) so the result looks "random" and colourful,
 * but stays stable across renders — no flickering between reloads.
 */

export const STORY_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#F59E0B", // amber
  "#84CC16", // lime
  "#10B981", // emerald
  "#14B8A6", // teal
  "#06B6D4", // cyan
  "#3B82F6", // blue
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#D946EF", // fuchsia
  "#EC4899", // pink
];

/** Hash a string seed into a stable index within [0, STORY_COLORS.length). */
function hashSeed(seed: string | number): number {
  const s = String(seed);
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash % STORY_COLORS.length;
}

/**
 * Resolve a colour for a story ring.
 * @param seed Usually the user's `uid` so the colour is stable per user.
 */
export const getStoryColor = (seed?: string | number): string =>
  STORY_COLORS[hashSeed(seed ?? 0)];
