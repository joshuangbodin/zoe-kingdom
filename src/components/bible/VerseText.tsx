import React, { memo } from "react";
import { Text, View } from "react-native";

import { parseVerse } from "@/libs/bible/verse-annotations";

/**
 * Renders a single Bible verse with its inline annotations styled as faint
 * italic "supplied words" (KJV italic) and its long trailing annotations moved
 * below the verse in an even fainter, smaller editorial line.
 *
 * Pure / safe: if `text` has no annotations it is rendered exactly as before.
 */
export type VerseTextProps = {
  text: string | null | undefined;
  /** Color class for the main verse text (handles selected / red-letter). */
  colorClass?: string;
  /** Optional container class, e.g. "flex-1" to expand inside a row. */
  containerClassName?: string;
  /**
   * Full className for the main body text. When omitted it defaults to
   * `text-base leading-8 font-serif ${colorClass}` (the reader style).
   * Provide this to reuse the component in compact contexts like post cards.
   */
  bodyClassName?: string;
  /** Full className for the trailing-notes line (defaults to a faint italic). */
  noteClassName?: string;
  /** Whether trailing annotations are rendered (defaults to true). */
  showNotes?: boolean;
};

export default memo(
  function VerseText({
    text,
    colorClass = "text-primary",
    containerClassName,
    bodyClassName,
    noteClassName,
    showNotes = true,
  }: VerseTextProps) {
    const parts = parseVerse(text);
    if (!parts.length) return null;

    const body: React.ReactNode[] = [];
    const notes: string[] = [];

    const bodyClass = bodyClassName ?? `text-base leading-8 font-serif ${colorClass}`;
    const noteClass =
      noteClassName ?? "text-tertiary/60 text-[11px] leading-4 font-serif-italic mt-1.5";

    for (const part of parts) {
      if (part.type === "text") {
        body.push(<Text key={body.length}>{part.text}</Text>);
      } else if (part.type === "inline") {
        body.push(
          <Text
            key={body.length}
            className="text-secondary/80 font-serif-italic"
            style={{ fontStyle: "italic" }}
          >
            {part.text}
          </Text>,
        );
      } else {
        notes.push(part.text);
      }
    }

    return (
      <View className={containerClassName}>
        <Text className={bodyClass}>{body}</Text>

        {showNotes && notes.length > 0 && (
          <Text
            className={noteClass}
            style={{ fontStyle: "italic" }}
          >
            {notes.join(" ")}
          </Text>
        )}
      </View>
    );
  },
  (prev, next) =>
    prev.text === next.text &&
    prev.colorClass === next.colorClass &&
    prev.containerClassName === next.containerClassName &&
    prev.bodyClassName === next.bodyClassName &&
    prev.noteClassName === next.noteClassName &&
    prev.showNotes === next.showNotes,
);