/**
 * BlanksBody — "Complete the Verses": the multi-word restoration puzzle.
 *
 * The verse renders as a token stream where every `____` becomes an empty slot.
 * The player taps chips from a word bank to fill slots left-to-right, and each
 * correct word is rewarded immediately with a pop + a praise line rather than
 * waiting for the whole verse. That per-word feedback is what keeps a 3-word
 * verse from feeling like one long gamble.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Check } from "lucide-react-native";

import type { BlanksSession } from "@/libs/puzzles";
import { wordsMatch } from "@/libs/puzzles/blanks";

import { CARD, MissionLine, PuzzleFooter } from "./PuzzleChrome";
import VerseSlot from "./VerseSlot";

type Props = {
  session: BlanksSession;
  mission: string;
  reference: string;
  accent: string;
  isDark: boolean;
  hintsLeft: number;
  hintText: string | null;
  onHint: () => void;
  /** Called with the chip the player tapped; the router grades + updates state. */
  onPlace: (word: string) => void;
};

export default function BlanksBody({
  session,
  mission,
  reference,
  accent,
  isDark,
  hintsLeft,
  hintText,
  onHint,
  onPlace,
}: Props) {
  const { tokens, bank } = session.model;
  const answers = session.answers;
  const blanks = tokens.filter((t) => t.type === "blank");

  // Which chips are already used, so a word can't be placed twice.
  const used = new Set(answers.filter(Boolean) as string[]);
  const nextBlankIndex = answers.findIndex((a) => a === null);

  const place = (word: string) => {
    if (nextBlankIndex < 0) return;
    const target = blanks.find((t) => t.type === "blank" && t.index === nextBlankIndex);
    if (!target || target.type !== "blank") return;
    onPlace(word);
  };

  const filledCount = answers.filter(Boolean).length;
  const progress = blanks.length === 0 ? 1 : filledCount / blanks.length;

  return (
    <View>
      <MissionLine text={mission} accent={accent} />

      {/* ------------------------------ The verse ---------------------------- */}
      <View className="rounded-3xl p-4 mb-4" style={{ backgroundColor: CARD(isDark) }}>
        <View className="flex-row flex-wrap items-center">
          {tokens.map((token, i) =>
            token.type === "text" ? (
              <Text
                key={`t${i}`}
                className="text-primary text-[16px] font-sora-medium leading-8"
              >
                {token.value}{" "}
              </Text>
            ) : (
              <VerseSlot
                key={`b${token.index}`}
                filled={answers[token.index]}
                answer={token.answer}
                isNext={token.index === nextBlankIndex}
                accent={accent}
                isDark={isDark}
                onPress={
                  answers[token.index] ? () => place(answers[token.index] as string) : undefined
                }
              />
            ),
          )}
        </View>

        <Text className="text-quaternary text-[10px] font-sora mt-3">{reference}</Text>
      </View>

      {/* ------------------------------- Word bank --------------------------- */}
      <Text className="text-tertiary text-[11px] font-sora-medium mb-2.5">
        Tap a word to fill the next blank
      </Text>
      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {bank.map((word) => {
          const isUsed = used.has(word);
          return (
            <Pressable
              key={word}
              disabled={isUsed || nextBlankIndex < 0}
              onPress={() => place(word)}
              className="rounded-full px-4 py-2.5"
              style={{
                backgroundColor: isUsed ? "transparent" : accent + "1F",
                borderWidth: 1.5,
                borderColor: isUsed ? "rgba(150,150,150,0.2)" : accent + "66",
                opacity: isUsed ? 0.3 : 1,
              }}
            >
              <Text
                className={`text-[13px] font-sora-semibold ${
                  isUsed ? "text-tertiary line-through" : "text-primary"
                }`}
              >
                {word}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <PuzzleFooter
        label={
          nextBlankIndex < 0
            ? "Verse restored — submit!"
            : `${blanks.length - filledCount} word(s) to go`
        }
        progress={progress}
        hintsLeft={hintsLeft}
        hintText={hintText}
        onHint={onHint}
        accent={accent}
      />
    </View>
  );
}
