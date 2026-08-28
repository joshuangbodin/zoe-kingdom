export const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  if (hour < 21) {
    return "Good evening";
  }

  return "Good night";
};

/**
 * Derive a short, single-token first name for a username for use in compact UI
 * (e.g. the home greeting). Handles:
 *   "Joshua"          -> "Joshua"
 *   "Joshua Bodin"    -> "Joshua"
 *   "joshua_4821"     -> "Joshua"   (generated usernames)
 * Falls back to a friendly placeholder so a long username can never blow out
 * the layout.
 */
export const getFirstName = (username?: string | null) => {
  const firstToken = (username || "").trim().split(/[\s_]+/)[0];

  if (!firstToken) return "Friend";

  const cleaned = firstToken.replace(/[^a-zA-Z0-9'’-]/g, "");

  if (!cleaned) return "Friend";

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};