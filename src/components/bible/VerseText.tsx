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
  text: string;
  /** Color class for the main verse text (handles selected / red-letter). */
  colorClass?: string;
  /** Optional container class, e.g. "flex-1" to expand inside a row. */
  containerClassName?: string;
};

export default memo(
  function VerseText({
    text,
    colorClass = "text-primary",
    containerClassName,
  }: VerseTextProps) {
    const parts = parseVerse(text);
    if (!parts.length) return null;

    const body: React.ReactNode[] = [];
    const notes: string[] = [];

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
        <Text className={`text-base leading-8 font-serif ${colorClass}`}>
          {body}
        </Text>

        {notes.length > 0 && (
          <Text
            className="text-tertiary/60 text-[11px] leading-4 font-serif-italic mt-1.5"
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
    prev.containerClassName === next.containerClassName,
);