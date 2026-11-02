/**
 * MemoryBody — "Verse Memory": a concentration / memory-match puzzle.
 *
 * Every authored word appears on two cards, shuffled into a deck. The player
 * flips two cards at a time; matching pairs stay face-up, mismatches flip back.
 * Pure tap interaction — no drag gestures — so it's dead simple and robust.
 */

import React, { useCallback, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { MemorySession } from "@/libs/puzzles";

import { CARD, MissionLine, PuzzleFooter } from "./PuzzleChrome";

type Props = {
  session: MemorySession;
  mission: string;
  reference: string;
  accent: string;
  isDark: boolean;
  hintsLeft: number;
  hintText: string | null;
  onHint: () => void;
  /** Called with the indices of a newly matched pair. */
  onMatch: (indices: number[]) => void;
  /** Called when two cards are flipped (correct if they match). */
  onFeedback: (correct: boolean) => void;
};

const CARD_SIZE = 76;
const FLIP_BACK_MS = 900;
const cardBack = (isDark: boolean) => (isDark ? "#1c1a1a" : "#fbf6ee");

export default function MemoryBody({
  session,
  mission,
  reference,
  accent,
  isDark,
  hintsLeft,
  hintText,
  onHint,
  onMatch,
  onFeedback,
}: Props) {
  const { cards, matched } = session;
  const pairCount = cards.length / 2;

  // Locally-managed ephemeral flip state — not persisted in the session.
  const [flipped, setFlipped] = useState<number[]>([]);
  const lockRef = useRef(false);

  // Keep a ref synced with `matched` so tap callbacks never read stale data.
  const matchedRef = useRef<Set<number>>(new Set(matched));
  matchedRef.current = new Set(matched);

  const isMatched = (i: number) => matchedRef.current.has(i);
  const isFlipped = (i: number) => flipped.includes(i);

  const progress = cards.length === 0 ? 0 : matched.length / cards.length;

  const tap = useCallback(
    (i: number) => {
      if (lockRef.current) return;
      if (isMatched(i) || isFlipped(i)) return;

      const next = [...flipped, i];
      setFlipped(next);

      if (next.length === 2) {
        lockRef.current = true;
        const [a, b] = next;
        const correct = cards[a] === cards[b];
        onFeedback(correct);

        if (correct) {
          onMatch([a, b]);
          setFlipped([]);
          lockRef.current = false;
        } else {
          setTimeout(() => {
            setFlipped([]);
            lockRef.current = false;
          }, FLIP_BACK_MS);
        }
      }
    },
    [cards, flipped, onFeedback, onMatch, isMatched, isFlipped],
  );

  return (
    <View>
      <MissionLine text={mission} accent={accent} />

      <View
        className="rounded-3xl p-3 mb-4"
        style={{ backgroundColor: CARD(isDark) }}
      >
        <View className="flex-row flex-wrap" style={{ gap: 8 }}>
          {cards.map((word, i) => {
            const show = isMatched(i) || isFlipped(i);
            return (
              <Pressable
                key={i}
                disabled={isMatched(i) || lockRef.current}
                onPress={() => tap(i)}
                className="items-center justify-center"
                style={{
                  width: CARD_SIZE,
                  height: CARD_SIZE,
                  backgroundColor: isMatched(i)
                    ? accent + "3A"
                    : show
                      ? accent + "1F"
                      : cardBack(isDark),
                  borderWidth: 1.5,
                  borderColor: isMatched(i)
                    ? accent
                    : show
                      ? accent + "66"
                      : "rgba(150,150,150,0.28)",
                  borderRadius: 12,
                }}
              >
                <Text
                  className="font-sora-bold"
                  style={{
                    fontSize: 16,
                    color: isMatched(i)
                      ? accent
                      : show
                        ? isDark
                          ? "#e5e5e5"
                          : "#3f372d"
                        : "transparent",
                  }}
                >
                  {show ? word : ""}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="text-quaternary text-[10px] font-sora mt-3">{reference}</Text>
      </View>

      <PuzzleFooter
        label={
          matched.length === cards.length
            ? "All pairs matched — submit!"
            : `${pairCount - matched.length / 2} pair(s) to go`
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
