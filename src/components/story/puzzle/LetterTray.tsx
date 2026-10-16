/**
 * LetterTray — the on-screen A-Z keyboard for the crossword.
 *
 * `preferred` is the letter the active cell actually wants. We do NOT hide the
 * rest of the alphabet (that would trivialise the puzzle), but we do surface the
 * correct letters of the active clue at a higher opacity once the player has
 * made a couple of attempts — a gentle assist that still requires them to think.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Props = {
  disabled: boolean;
  isDark: boolean;
  /** The letter the active cell actually wants (soft assist hint). */
  preferred: string | null;
  onType: (letter: string) => void;
};

export default function LetterTray({
  disabled,
  isDark,
  preferred,
  onType,
}: Props) {
  return (
    <View className="flex-row flex-wrap justify-center" style={{ gap: 5 }}>
      {ALPHABET.map((letter) => {
        const hinted = !!preferred && letter === preferred;
        return (
          <Pressable
            key={letter}
            disabled={disabled}
            onPress={() => onType(letter)}
            className="rounded-lg items-center justify-center"
            style={{
              width: 30,
              height: 34,
              backgroundColor: isDark ? "#212225" : "#efe6d8",
              borderWidth: hinted ? 1.5 : 0,
              borderColor: "#fbbf24",
              opacity: disabled ? 0.35 : 1,
            }}
          >
            <Text className="text-primary text-[13px] font-sora-semibold">
              {letter}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
