
/**
 * ChoiceBody + OrderBody
 *
 * Choice presents a faith scenario with selectable answers.
 * Selecting an answer locks the choice and reveals the explanation.
 *
 * Order asks the player to rebuild a promise or verse by arranging
 * fragments in the correct sequence.
 */

import React from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowUp, Check, X } from "lucide-react-native";

import type { ChoiceSession, OrderSession } from "@/libs/puzzles";

import { CARD, MissionLine, PuzzleFooter } from "./PuzzleChrome";

/* --------------------------------- Choice --------------------------------- */

type ChoiceBodyProps = {
  session: ChoiceSession;
  mission: string;
  accent: string;
  isDark: boolean;
  reveal: string;
  onChange: (session: ChoiceSession) => void;
  onFeedback: (correct: boolean) => void;
};

export function ChoiceBody({
  session,
  mission,
  accent,
  isDark,
  reveal,
  onChange,
  onFeedback,
}: ChoiceBodyProps) {
  const { puzzle, order, picked } = session;
  const answered = picked !== null;

  const handlePick = (optionIndex: number) => {
    if (answered) return;

    const selectedOption = puzzle.options[optionIndex];

    if (!selectedOption) return;

    onChange({
      ...session,
      picked: optionIndex,
    });

    onFeedback(selectedOption.correct);
  };

  return (
    <View>
      <MissionLine text={mission} accent={accent} />

      <Text className="text-primary text-[16px] font-sora-semibold mb-4 leading-6">
        {puzzle.prompt}
      </Text>

      <View style={{ gap: 9 }}>
        {order.map((optionIndex, index) => {
          const option = puzzle.options[optionIndex];

          if (!option) return null;

          const isPicked = picked === optionIndex;
          const isCorrect = answered && option.correct;
          const isWrong = answered && isPicked && !option.correct;

          const borderColor = isCorrect
            ? "#22c55e"
            : isWrong
              ? "#ef4444"
              : isPicked
                ? accent
                : isDark
                  ? "rgba(255,255,255,0.10)"
                  : "rgba(55,65,52,0.12)";

          const backgroundColor = isCorrect
            ? "#22c55e14"
            : isWrong
              ? "#ef444414"
              : isPicked
                ? accent
                : CARD(isDark);

          return (
            <Animated.View
              key={optionIndex}
              entering={FadeInDown.delay(index * 50).duration(220)}
            >
              <Pressable
                onPress={() => handlePick(optionIndex)}
                disabled={answered}
                accessibilityRole="button"
                accessibilityState={{
                  selected: isPicked,
                  disabled: answered,
                }}
                accessibilityLabel={`${option.label}${
                  isCorrect
                    ? ", correct answer"
                    : isWrong
                      ? ", incorrect answer"
                      : ""
                }`}
                style={({ pressed }) => ({
                  minHeight: 54,
                  paddingHorizontal: 15,
                  paddingVertical: 14,
                  borderRadius: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor,
                  borderWidth: 1,
                  borderColor,
                  opacity: pressed && !answered ? 0.75 : 1,
                })}
              >
                <View
                  className="w-7 h-7 rounded-full items-center justify-center mr-3"
                  style={{
                    backgroundColor: isCorrect
                      ? "#22c55e20"
                      : isWrong
                        ? "#ef444420"
                        : isPicked
                          ? "rgba(255,255,255,0.18)"
                          : isDark
                            ? "rgba(255,255,255,0.06)"
                            : "rgba(55,65,52,0.06)",
                  }}
                >
                  {isCorrect ? (
                    <Check size={14} color="#22c55e" strokeWidth={2.8} />
                  ) : isWrong ? (
                    <X size={14} color="#ef4444" strokeWidth={2.8} />
                  ) : (
                    <Text
                      className="text-[11px] text-primary font-sora-semibold"
                      // style={{
                      //   color: isPicked ? "#ffffff" : undefined,
                      // }}
                    >
                      {String.fromCharCode(65 + index)}
                    </Text>
                  )}
                </View>

                <Text
                  className="text-[13px] text-primary font-sora-medium leading-5 flex-1"
                  // style={{
                  //   color: isPicked && !answered ? "#ffffff" : undefined,
                  // }}
                >
                  {option.label}
                </Text>

                {isCorrect && (
                  <Check
                    size={17}
                    color="#22c55e"
                    strokeWidth={2.8}
                  />
                )}

                {isWrong && (
                  <X
                    size={17}
                    color="#ef4444"
                    strokeWidth={2.8}
                  />
                )}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {answered && (
        <Animated.View
          entering={FadeInDown.springify()}
          className="mt-4"
        >
          <View
            className="flex-row items-center mb-2"
            style={{ gap: 7 }}
          >
            <View
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: puzzle.options[picked]?.correct
                  ? "#22c55e"
                  : "#ef4444",
              }}
            />

            <Text
              className="text-[11px] font-sora-bold uppercase tracking-wider"
              style={{
                color: puzzle.options[picked]?.correct
                  ? "#22c55e"
                  : "#ef4444",
              }}
            >
              {puzzle.options[picked]?.correct
                ? "Well done"
                : "Keep growing"}
            </Text>
          </View>

          <Text className="text-secondary text-[12px] font-sora leading-5">
            {reveal}
          </Text>
        </Animated.View>
      )}

      {/* <PuzzleFooter
        label={answered ? "Answer completed" : "Choose your answer"}
        progress={answered ? 1 : 0}
        hintsLeft={0}
        hintText={null}
        onHint={() => {}}
        accent={accent}
      /> */}
    </View>
  );
}

/* ---------------------------------- Order --------------------------------- */

type OrderBodyProps = {
  session: OrderSession;
  mission: string;
  prompt: string;
  accent: string;
  isDark: boolean;
  onPlace: (itemIndex: number) => void;
  onRemove: (position: number) => void;
  onMoveUp: (position: number) => void;
};

export function OrderBody({
  session,
  mission,
  prompt,
  accent,
  isDark,
  onPlace,
  onRemove,
  onMoveUp,
}: OrderBodyProps) {
  const { puzzle, pool, placed } = session;
  const total = puzzle.items.length;

  const progress = total > 0 ? placed.length / total : 1;

  return (
    <View>
      <MissionLine text={mission} accent={accent} />

      <Text className="text-primary text-[15px] font-sora-semibold mb-4 leading-6">
        {prompt}
      </Text>

      {/* Sequence being assembled */}
      <View className="mb-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-muted text-[11px] font-sora-semibold uppercase tracking-wider">
            Your sequence
          </Text>

          <Text
            className="text-[11px] font-sora-bold tabular-nums"
            style={{ color: accent }}
          >
            {placed.length}/{total}
          </Text>
        </View>

        {placed.length === 0 ? (
          <View
            className="rounded-xl px-4 py-5 items-center justify-center"
            style={{
              backgroundColor: isDark
                ? "rgba(255,255,255,0.035)"
                : "rgba(55,65,52,0.035)",
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: isDark
                ? "rgba(255,255,255,0.15)"
                : "rgba(55,65,52,0.15)",
            }}
          >
            <Text className="text-muted text-[12px] font-sora text-center">
              Select the fragments below to build the sequence.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {placed.map((itemIndex, position) => (
              <Animated.View
                key={`${itemIndex}-${position}`}
                entering={FadeInDown.duration(180)}
                className="flex-row items-center"
                style={{ gap: 8 }}
              >
                <Text
                  className="text-[11px] text-primary font-sora-bold w-5 text-center"
                  // style={{ color: accent }}
                >
                  {position + 1}
                </Text>

                <Pressable
                  onPress={() => onRemove(position)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${puzzle.items[itemIndex]}`}
                  className="flex-1 rounded-xl px-3.5 py-3 flex-row items-center"
                  style={({ pressed }) => ({
                    backgroundColor: accent + "16",
                    borderWidth: 1,
                    borderColor: accent + "35",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text className="text-primary text-[13px] font-sora-medium flex-1 leading-5">
                    {puzzle.items[itemIndex]}
                  </Text>

                  <X size={14} color={accent} />
                </Pressable>

                {position > 0 && (
                  <Pressable
                    onPress={() => onMoveUp(position)}
                    accessibilityRole="button"
                    accessibilityLabel={`Move fragment ${position + 1} up`}
                    className="w-9 h-9 rounded-xl items-center justify-center bg-overlay"
                    hitSlop={5}
                  >
                    <ArrowUp
                      size={14}
                      color={isDark ? "#c7c7c7" : "#626a60"}
                    />
                  </Pressable>
                )}
              </Animated.View>
            ))}
          </View>
        )}
      </View>

      {/* Available fragments */}
      {pool.length > 0 && (
        <View>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-muted text-[11px] font-sora-semibold uppercase tracking-wider">
              Available fragments
            </Text>

            <Text className="text-tertiary text-[10px] font-sora">
              Tap to add
            </Text>
          </View>

          <View style={{ gap: 8 }}>
            {pool.map((itemIndex, index) => (
              <Animated.View
                key={itemIndex}
                entering={FadeInDown.delay(index * 35).duration(180)}
              >
                <Pressable
                  onPress={() => onPlace(itemIndex)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${puzzle.items[itemIndex]} to sequence`}
                  className="rounded-xl px-3.5 py-3 flex-row items-center"
                  style={({ pressed }) => ({
                    backgroundColor: CARD(isDark),
                    borderWidth: 1,
                    borderColor: isDark
                      ? "rgba(255,255,255,0.09)"
                      : "rgba(55,65,52,0.11)",
                    opacity: pressed ? 0.7 : 1,
                    transform: [
                      { scale: pressed ? 0.99 : 1 },
                    ],
                  })}
                >
                  <View
                    className="w-6 h-6 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: accent + "18" }}
                  >
                    <Text
                      className="text-[10px] font-sora-bold"
                      style={{ color: accent }}
                    >
                      +
                    </Text>
                  </View>

                  <Text className="text-primary text-[13px] font-sora-medium flex-1 leading-5">
                    {puzzle.items[itemIndex]}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>
      )}

      {placed.length === total && total > 0 && (
        <Animated.View
          entering={FadeInDown.springify()}
          className="flex-row items-center mt-4"
        >
          <Check size={14} color="#22c55e" strokeWidth={2.8} />

          <Text className="text-[11px] font-sora-semibold text-green-500 ml-2">
            All fragments assembled. Ready to submit.
          </Text>
        </Animated.View>
      )}

      <PuzzleFooter
        label={`${placed.length} of ${total} fragments placed`}
        progress={progress}
        hintsLeft={0}
        hintText={null}
        onHint={() => {}}
        accent={accent}
      />
    </View>
  );
}
