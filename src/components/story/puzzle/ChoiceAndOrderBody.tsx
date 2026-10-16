/**
 * ChoiceBody + OrderBody — the two lighter puzzle kinds.
 *
 * Choice presents the faith scenario as tappable cards; picking locks it in and
 * immediately colours the right/wrong answer so the teaching moment IS the
 * feedback. Order asks the player to rebuild a torn promise by tapping fragments
 * into a sequence, with per-piece praise as the verse reassembles.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react-native";

import type { ChoicePuzzle } from "@/data/story";
import type { ChoiceSession, OrderSession } from "@/libs/puzzles";

import { CARD, MissionLine, PuzzleFooter } from "./PuzzleChrome";

/* --------------------------------- Choice --------------------------------- */

export function ChoiceBody({
  session,
  mission,
  accent,
  isDark,
  reveal,
}: {
  session: ChoiceSession;
  mission: string;
  accent: string;
  isDark: boolean;
  reveal: string;
}) {
  const { puzzle, order, picked } = session;
  const answered = picked !== null;

  return (
    <View>
      <MissionLine text={mission} accent={accent} />

      <Text className="text-primary text-[16px] font-sora-semibold mb-4 leading-6">
        {puzzle.prompt}
      </Text>

      <View style={{ gap: 9 }}>
        {order.map((optIdx, i) => {
          const opt = puzzle.options[optIdx];
          const isPicked = picked === optIdx;
          const showRight = answered && opt.correct;
          const showWrong = answered && isPicked && !opt.correct;

          return (
            <Animated.View key={optIdx} entering={FadeInDown.delay(i * 60)}>
              <Pressable
                disabled={answered}
                className="rounded-2xl px-4 py-3.5 flex-row items-center"
                style={{
                  backgroundColor: showRight
                    ? "#22c55e22"
                    : showWrong
                      ? "#ef444422"
                      : isPicked
                        ? accent
                        : CARD(isDark),
                  borderWidth: 1.5,
                  borderColor: showRight
                    ? "#22c55e"
                    : showWrong
                      ? "#ef4444"
                      : isPicked
                        ? accent
                        : "rgba(150,150,150,0.25)",
                }}
              >
                <Text
                  className="text-[13px] font-sora-medium leading-5 flex-1"
                  style={{ color: isPicked && !answered ? "#fff" : undefined }}
                >
                  {opt.label}
                </Text>
                {showRight && <Check size={15} color="#22c55e" strokeWidth={3} />}
                {showWrong && <X size={15} color="#ef4444" strokeWidth={3} />}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {answered && (
        <Animated.View
          entering={FadeInDown.springify()}
          className="rounded-2xl px-3.5 py-3 mt-4"
          style={{ backgroundColor: accent + "14" }}
        >
          <Text className="text-secondary text-[12px] font-sora leading-5">
            {reveal}
          </Text>
        </Animated.View>
      )}

      <PuzzleFooter
        label={answered ? "Answer locked in" : "Choose the wise response"}
        progress={answered ? 1 : 0}
        hintsLeft={0}
        hintText={null}
        onHint={() => {}}
        accent={accent}
      />
    </View>
  );
}

/* ---------------------------------- Order --------------------------------- */

export function OrderBody({
  session,
  mission,
  prompt,
  accent,
  isDark,
  onPlace,
  onRemove,
  onMoveUp,
}: {
  session: OrderSession;
  mission: string;
  prompt: string;
  accent: string;
  isDark: boolean;
  onPlace: (itemIndex: number) => void;
  onRemove: (position: number) => void;
  onMoveUp: (position: number) => void;
}) {
  const { puzzle, pool, placed } = session;
  const total = puzzle.items.length;

  return (
    <View>
      <MissionLine text={mission} accent={accent} />

      <Text className="text-primary text-[15px] font-sora-semibold mb-3 leading-6">
        {prompt}
      </Text>

      {/* Placed sequence */}
      <View
        className="rounded-2xl p-3.5 mb-4 min-h-20"
        style={{ backgroundColor: CARD(isDark) }}
      >
        {placed.length === 0 ? (
          <Text className="text-quaternary text-[12px] font-sora">
            Tap the fragments below in the right order…
          </Text>
        ) : (
          <View style={{ gap: 7 }}>
            {placed.map((itemIdx, pos) => (
              <View key={`${itemIdx}-${pos}`} className="flex-row items-center">
                <Text
                  className="font-sora-bold w-5 text-[11px]"
                  style={{ color: accent }}
                >
                  {pos + 1}
                </Text>
                <Pressable
                  onPress={() => onRemove(pos)}
                  className="flex-1 rounded-xl px-3 py-2.5 mr-1"
                  style={{ backgroundColor: accent + "1A" }}
                >
                  <Text className="text-primary text-[13px] font-sora-medium">
                    {puzzle.items[itemIdx]}
                  </Text>
                </Pressable>
                {pos > 0 && (
                  <Pressable
                    onPress={() => onMoveUp(pos)}
                    className="w-8 h-8 rounded-full bg-overlay items-center justify-center"
                  >
                    <ArrowUp size={13} color="#9ca3af" />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Pool */}
      {pool.length > 0 && (
        <>
          <Text className="text-tertiary text-[11px] font-sora-medium mb-2">
            Remaining fragments
          </Text>
          <View style={{ gap: 7 }}>
            {pool.map((itemIdx) => (
              <Pressable
                key={itemIdx}
                onPress={() => onPlace(itemIdx)}
                className="rounded-xl px-3.5 py-3 flex-row items-center"
                style={{
                  backgroundColor: CARD(isDark),
                  borderWidth: 1.5,
                  borderColor: "rgba(150,150,150,0.25)",
                }}
              >
                <ArrowDown size={12} color="#9ca3af" />
                <Text className="text-primary text-[13px] font-sora-medium ml-2 flex-1">
                  {puzzle.items[itemIdx]}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <PuzzleFooter
        label={`${placed.length}/${total} fragments placed`}
        progress={total === 0 ? 1 : placed.length / total}
        hintsLeft={0}
        hintText={null}
        onHint={() => {}}
        accent={accent}
      />
    </View>
  );
}
