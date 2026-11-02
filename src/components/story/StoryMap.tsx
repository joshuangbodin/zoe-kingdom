
import React from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Check, Lock, Play, Star, Zap } from "lucide-react-native";

import { useTheme } from "@/context/theme-context";
import {
  CHAPTERS,
  isLevelUnlocked,
  type StoryLevel,
} from "@/data/story";
import { COST_PER_LEVEL } from "@/libs/sqlite/story";

import StarRow from "./StarRow";

export type NodeState = "completed" | "playable" | "locked";

type Props = {
  completed: Set<string>;
  stars: Record<string, number>;
  energy: number;
  onNodePress: (level: StoryLevel) => void;
};

const NODE_SIZE = 48;
const BOSS_SIZE = 54;
const NODE_SLOT = 58;
const ROW_GAP = 78;
const PATH_WIDTH = 132;
const LEFT_PADDING = 32;

const offsetFor = (index: number): number =>
  [0, 30, 12, -26, -10, 24][index % 6];

const getLevelCost = (level: StoryLevel) =>
  level.cost ?? COST_PER_LEVEL;

export default function StoryMap({
  completed,
  stars,
  energy,
  onNodePress,
}: Props) {
  const { isDark } = useTheme();

  const spineColor = isDark
    ? "rgba(255,255,255,0.10)"
    : "rgba(55,65,52,0.11)";

  return (
    <View>
      {CHAPTERS.map((chapter) => {
        const total = chapter.levels.length;
        const doneCount = chapter.levels.filter((level) =>
          completed.has(level.id),
        ).length;

        const progress = total > 0 ? doneCount / total : 0;
        const allDone = total > 0 && doneCount === total;

        return (
          <View key={chapter.id} className="mb-8">
            <View className="mb-3">
              <View className="flex-row items-end justify-between">
                <View className="flex-1 min-w-0">
                  <Text className="text-[9px] font-sora-semibold text-tertiary">
                    Chapter {chapter.index}
                  </Text>

                  <Text className="text-primary text-[17px] font-sora-semibold mt-1">
                    {chapter.title}
                  </Text>

                  {!!chapter.subtitle && (
                    <Text
                      numberOfLines={1}
                      className="text-secondary text-[11px] font-sora mt-1"
                    >
                      {chapter.subtitle}
                    </Text>
                  )}
                </View>

                <View className="items-end ml-4 pb-0.5">
                  <Text className="text-primary text-[11px] font-sora-semibold tabular-nums">
                    {doneCount}
                    <Text className="text-tertiary font-sora">
                      {" "}
                      / {total}
                    </Text>
                  </Text>

                  <Text
                    className="font-sora-medium mt-1 text-[10px]"
                    style={{
                      color: allDone ? "green" : undefined,
                    }}
                  >
                    {allDone ? "Completed" : `${Math.round(progress * 100)}%`}
                  </Text>
                </View>
              </View>
            </View>

            <ChapterPath
              color={chapter.color}
              spineColor={spineColor}
              levels={chapter.levels}
              completed={completed}
              stars={stars}
              energy={energy}
              onNodePress={onNodePress}
            />
          </View>
        );
      })}
    </View>
  );
}

type PathProps = {
  color: string;
  spineColor: string;
  levels: StoryLevel[];
  completed: Set<string>;
  stars: Record<string, number>;
  energy: number;
  onNodePress: (level: StoryLevel) => void;
};

function ChapterPath({
  color,
  spineColor,
  levels,
  completed,
  stars,
  energy,
  onNodePress,
}: PathProps) {
  const positions = levels.map((_, index) => ({
    x: offsetFor(index),
    y: ROW_GAP / 2 + index * ROW_GAP,
  }));

  const path = buildSpinePath(positions);

  const nextLevel = levels.find(
    (level) =>
      !completed.has(level.id) &&
      isLevelUnlocked(level.id, completed),
  );

  return (
    <View style={{ paddingLeft: LEFT_PADDING }}>
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PATH_WIDTH,
        }}
      >
        <Svg
          width={PATH_WIDTH}
          height={Math.max(levels.length * ROW_GAP, ROW_GAP)}
        >
          <Path
            d={path}
            stroke={spineColor}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>

      {levels.map((level, index) => {
        const isCompleted = completed.has(level.id);
        const unlocked = isLevelUnlocked(level.id, completed);
        const cost = getLevelCost(level);
        const affordable = energy >= cost;
        const isBoss =
          level.kind === "boss" || level.kind === "finale";
        const isNext = level.id === nextLevel?.id;

        const state: NodeState = isCompleted
          ? "completed"
          : unlocked && affordable
            ? "playable"
            : "locked";

        return (
          <View
            key={level.id}
            className="flex-row items-center"
            style={{
              height: ROW_GAP,
              transform: [{ translateX: positions[index].x }],
            }}
          >
            <LevelNode
              level={level}
              state={state}
              color={color}
              isBoss={isBoss}
              isActive={isNext && affordable}
              stars={stars[level.id] ?? 0}
              onPress={() => onNodePress(level)}
            />

            <View className="flex-1 ml-3 min-w-0">
              <Text
                numberOfLines={1}
                className="text-primary text-[12px] font-sora-semibold"
                style={{
                  opacity: state === "locked" ? 0.45 : 1,
                }}
              >
                {level.index}. {level.title}
              </Text>

              <View className="flex-row items-center mt-1">
                {isCompleted ? (
                  <>
                    <StarRow
                      stars={stars[level.id] ?? 0}
                      size={10}
                    />
                    <Text className="text-tertiary text-[10px] font-sora ml-2">
                      +{level.reward} XP
                    </Text>
                  </>
                ) : unlocked ? (
                  affordable ? (
                    <View className="flex-row items-center">
                      <View
                        className="w-1.5 h-1.5 rounded-full mr-1.5"
                        style={{ backgroundColor: color }}
                      />
                      <Text
                        className="text-[10px] font-sora-medium"
                        style={{ color }}
                      >
                        {isNext ? "READY TO BEGIN" : `${cost} energy`}
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center">
                      <Zap size={10} color="#C18A35" />
                      <Text className="text-tertiary text-[10px] font-sora ml-1">
                        {cost} energy required
                      </Text>
                    </View>
                  )
                ) : (
                  <Text className="text-quaternary text-[10px] font-sora">
                    Complete the previous level
                  </Text>
                )}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function buildSpinePath(
  positions: { x: number; y: number }[],
): string {
  if (!positions.length) return "";

  const points = positions.map((position) => ({
    x: NODE_SLOT / 2 + LEFT_PADDING + position.x,
    y: position.y,
  }));

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 1; index < points.length; index++) {
    const previous = points[index - 1];
    const current = points[index];
    const middleY = (previous.y + current.y) / 2;

    path += ` C ${previous.x} ${middleY}, ${current.x} ${middleY}, ${current.x} ${current.y}`;
  }

  return path;
}

type NodeProps = {
  level: StoryLevel;
  state: NodeState;
  color: string;
  isBoss: boolean;
  isActive: boolean;
  stars: number;
  onPress: () => void;
};

function LevelNode({
  level,
  state,
  color,
  isBoss,
  isActive,
  stars,
  onPress,
}: NodeProps) {
  const { isDark } = useTheme();

  const size = isBoss ? BOSS_SIZE : NODE_SIZE;
  const isCompleted = state === "completed";
  const isPlayable = state === "playable";

  const surfaceColor = isDark ? "#0C0C0C" : "#F5F5F1";

  const nodeBackground = isCompleted
    ? color
    : isPlayable
      ? `${color}50`
      : surfaceColor;

  const nodeBorder =
    state === "locked"
      ? isDark
        ? "rgba(255,255,255,0.16)"
        : "rgba(55,65,52,0.19)"
      : color;

  return (
    <View
      style={{
        width: NODE_SLOT,
        height: NODE_SLOT,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {isActive && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: size + 10,
            height: size + 10,
            borderRadius: (size + 10) / 2,
            borderWidth: 2,
            borderColor: `${color}35`,
          }}
        />
      )}

      {isBoss && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            width: size + 7,
            height: size + 7,
            borderRadius: (size + 7) / 2,
            borderWidth: 1,
            borderColor:
              isCompleted || isPlayable
                ? `${color}65`
                : nodeBorder,
          }}
        />
      )}

      <Pressable
        onPress={onPress}
        disabled={!isPlayable}
        accessibilityRole="button"
        accessibilityLabel={`Level ${level.index}: ${level.title}, ${state}`}
        accessibilityState={{ disabled: !isPlayable }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: nodeBackground,
          borderWidth: isBoss ? 2 : 1.5,
          borderColor: nodeBorder,
        }}
      >
        {isCompleted ? (
          <Check
            size={size * 0.4}
            color="#FFFFFF"
            strokeWidth={2.8}
          />
        ) : isPlayable ? (
          <Play
            size={size * 0.3}
            color={color}
            fill={color}
            strokeWidth={1.8}
          />
        ) : (
          <Lock
            size={size * 0.27}
            color={isDark ? "#777B75" : "#92978D"}
            strokeWidth={1.8}
          />
        )}
      </Pressable>

      {isCompleted && stars > 0 && (
        <View
          pointerEvents="none"
          className="absolute -bottom-1 -right-1 flex-row items-center rounded-full px-1.5 py-0.5"
          style={{
            backgroundColor: isDark ? "#24231F" : "#F5F2E9",
            borderWidth: 1,
            borderColor: isDark
              ? "rgba(251,191,36,0.3)"
              : "rgba(161,120,39,0.25)",
          }}
        >
          <Star
            size={8}
            color="#C18A35"
            fill="#C18A35"
          />
          <Text className="text-[9px] font-sora-semibold text-amber-600 ml-0.5">
            {stars}
          </Text>
        </View>
      )}
    </View>
  );
}
