/**
 * verse-annotations.ts
 *
 * The bundled KJV text embeds the translators' annotations directly inside the
 * verse string using curly braces, e.g.:
 *
 *   "And the earth was without form, and void; and darkness {was} upon the face
 *    of the deep. And the Spirit of God moved upon the face of the waters
 *    {the light from...: Heb. between the light and between the darkness}"
 *
 * Reading that raw string makes the notes collide with the scripture. This
 * module splits a verse into three kinds of parts so the UI can style each one:
 *
 *   text    – the actual verse (what you read out loud)
 *   inline  – short notes embedded mid-sentence ("{was}", "{and}", a short
 *             alternate reading like "{firmament: Heb. expansion}"). These are
 *             KJV's italicized supplied words → style italic + slightly faded.
 *   note    – the long trailing annotations ("{the day...: Heb. between the
 *             day and between the night}"). By inspection these always sit at
 *             the very end of the verse → render after the verse, more faded.
 *
 * The parser is deliberately defensive: it NEVER throws, never crashes, and
 * degrades gracefully on malformed input (unbalanced braces, no braces at all,
 * empty strings, nullish values). If it cannot make sense of something it
 * simply leaves the text as a plain `text` part.
 */

export type VersePart =
  | { type: "text"; text: string }
  | { type: "inline"; text: string }
  | { type: "note"; text: string };

const GROUP = /\{([^}]*)\}/g;

/**
 * Split a raw KJV verse string into ordered {@link VersePart}s.
 *
 * Classification rule (kept tiny on purpose so it holds up against every real
 * verse without exceptions):
 *   - If a group's content contains "..." it is a long trailing note.
 *   - Otherwise, if the group is the LAST thing in the verse (only whitespace
 *     follows), it is still a trailing note.
 *   - Anything else embedded mid-sentence is an inline note.
 */
export const parseVerse = (raw: string | null | undefined): VersePart[] => {
  if (!raw) return [];

  const parts: VersePart[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  GROUP.lastIndex = 0;
  while ((match = GROUP.exec(raw)) !== null) {
    const { index } = match;
    const full = match[0];

    // Plain run of text that precedes this annotation.
    if (index > cursor) {
      parts.push({ type: "text", text: raw.slice(cursor, index) });
    }

    const content = match[1];
    const after = raw.slice(index + full.length);
    const isAtEndOfVerse = after.trim().length === 0;

    if (content.includes("...") || isAtEndOfVerse) {
      parts.push({ type: "note", text: content });
    } else {
      parts.push({ type: "inline", text: content });
    }

    cursor = index + full.length;
  }

  // Trailing plain text after the last annotation (also handles an unclosed
  // `{` that never finds its `}`, which the regex simply ignores).
  if (cursor < raw.length) {
    parts.push({ type: "text", text: raw.slice(cursor) });
  }

  return parts;
};

/**
 * Returns a share-friendly, readable verse string with the translator
 * annotations removed:
 *   - trailing `note` parts are dropped entirely,
 *   - short `inline` alternate-readings (content contains a colon, e.g.
 *     "{firmament: Heb. expansion}") are dropped,
 *   - inline supplied words WITHOUT a colon (e.g. "{was}") are KEPT because the
 *     KJV printed them (italicised) as part of the sentence — dropping them
 *     would break the grammar ("and darkness  upon the face").
 */
export const cleanVerseText = (
  raw: string | null | undefined,
): string => {
  const parts = parseVerse(raw ?? "");
  const out: string[] = [];

  for (const p of parts) {
    if (p.type === "note") continue;
    if (p.type === "inline" && p.text.includes(":")) continue;
    out.push(p.text);
  }

  return out.join("").replace(/\s+/g, " ").trim();
};