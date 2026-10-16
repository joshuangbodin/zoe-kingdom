/**
 * StoryMap — the campaign map.
 *
 * Modeled on the Candy-Crush / Two-Dots school of level maps rather than a
 * settings list, because that is what makes a puzzle game feel like a game:
 *
 *  - Chapters are full-width BANNERS with their own palette and progress count.
 *  - Levels sit on a WINDING PATH drawn as a single SVG polyline through every
 *    node, so the eye follows the journey instead of scanning a list.
 *  - Nodes are round, numbered buttons with states: completed (filled + stars),
 *    playable (glowing, gently bobbing), locked (dimmed with a lock).
 *  - The next playable node gets a "PLAY" call-to-action ring so the player
 *    never has to work out what to do next.
 *
 * Layout math: node x positions alternate along a sine-ish offset so the path
 * curves without needing per-level hand-authored coordinates.
 */

import React, { useEffect, useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Check, Lock, Play, Star } from "lucide-react-native";

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

const NODE = 52;
const ROW_GAP = 84;

/** x offset per row, alternating to create the winding path. */
const offsetFor = (i: number): number => [0, 34, 12, -30, -12, 30][i % 6];

export default function StoryMap({
  completed,
  stars,
  energy,
  onNodePress,
}: Props) {
  const { isDark } = useTheme();

  return (
    <View>
      {CHAPTERS.map((chapter) => {
        const doneCount = chapter.levels.filter((l) => completed.has(l.id)).length;
        const allDone = doneCount === chapter.levels.length && chapter.levels.length > 0;

        return (
          <View key={chapter.id} className="mb-6">
            {/* ---------------------------- Chapter banner ---------------------- */}
            <View
              className="rounded-3xl px-4 py-3.5 mb-5 overflow-hidden border"
              style={{
                backgroundColor: chapter.color + "1A",
                borderColor: chapter.color + "44",
              }}
            >
              <View className="flex-row items-center">
                <View
                  className="w-11 h-11 rounded-2xl items-center justify-center mr-3"
                  style={{ backgroundColor: chapter.color + "33" }}
                >
                  <Text style={{ fontSize: 22 }}>{chapter.emoji}</Text>
                </View>

                <View className="flex-1 min-w-0">
                  <Text className="text-quaternary text-[9px] font-sora-bold tracking-widest">
                    CHAPTER {chapter.index}
                  </Text>
                  <Text className="text-primary text-[16px] font-sora-semibold mt-0.5">
                    {chapter.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    className="text-tertiary text-[11px] font-sora mt-0.5"
                  >
                    {chapter.subtitle}
                  </Text>
                </View>

                <View className="items-end">
                  <Text
                    className="text-[11px] font-sora-bold tabular-nums"
                    style={{ color: chapter.color }}
                  >
                    {doneCount}/{chapter.levels.length}
                  </Text>
                  {allDone && (
                    <View className="flex-row items-center mt-1">
                      <Star size={10} color="#fbbf24" fill="#fbbf24" />
                      <Text className="text-amber-400 text-[9px] font-sora-bold ml-1">
                        CLEARED
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* ------------------------------ Level path ----------------------- */}
            <ChapterPath
              chapterId={chapter.id}
              color={chapter.color}
              levels={chapter.levels}
              spineColor={isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)"}
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

/* ------------------------------- Chapter path ------------------------------ */

type PathProps = {
  chapterId: string;
  color: string;
  spineColor: string;
  levels: StoryLevel[];
  completed: Set<string>;
  stars: Record<string, number>;
  energy: number;
  onNodePress: (level: StoryLevel) => void;
};

/**
 * Renders one chapter's levels plus the SVG spine connecting them.
 *
 * The spine is drawn from the same offset math the nodes use, so it always
 * passes exactly through the centre of every node — including the final boss,
 * which is rendered larger.
 */
function ChapterPath({
  color,
  spineColor,
  levels,
  completed,
  stars,
  energy,
  onNodePress,
}: PathProps) {
  // The next level the player should play, for the "PLAY" call to action.
  const nextId = useMemo(() => {
    const found = levels.find(
      (l) => !completed.has(l.id) && isLevelUnlocked(l.id, completed),
    );
    return found?.id ?? null;
  }, [levels, completed]);

  const positions = levels.map((_, i) => ({
    x: offsetFor(i),
    y: i * ROW_GAP,
  }));

  const spine = buildSpinePath(positions);

  return (
    <View style={{ paddingLeft: 34 }}>
      {/* Spine sits behind the nodes, inset to the node column */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: -34 + 26, top: 26 }}
      >
        <Svg width={120} height={positions.length * ROW_GAP + 40}>
          <Path
            d={spine(120)}
            stroke={spineColor}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={spine(120)}
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${positions.length * ROW_GAP} ${positions.length * ROW_GAP}`}
            strokeDashoffset={
              positions.length * ROW_GAP -
              (levels.filter((l) => completed.has(l.id)).length /
                Math.max(levels.length, 1)) *
                positions.length *
                ROW_GAP
            }
          />
        </Svg>
      </View>

      {levels.map((level, i) => {
        const isCompleted = completed.has(level.id);
        const unlocked = isLevelUnlocked(level.id, completed);
        const affordable = energy >= (level.cost ?? COST_PER_LEVEL);
        const state: NodeState = isCompleted
          ? "completed"
          : unlocked && affordable
            ? "playable"
            : "locked";
        const isBoss = level.kind === "boss" || level.kind === "finale";
        const isNext = level.id === nextId;

        return (
          <View
            key={level.id}
            className="flex-row items-center"
            style={{ height: ROW_GAP, transform: [{ translateX: positions[i].x }] }}
          >
            <LevelNode
              level={level}
              index={i}
              state={state}
              color={color}
              isBoss={isBoss}
              stars={stars[level.id] ?? 0}
              onPress={() => onNodePress(level)}
            />

            <View className="flex-1 ml-3 min-w-0">
              <Text
                numberOfLines={1}
                className="text-primary text-[13px] font-sora-semibold"
                style={{ opacity: state === "locked" ? 0.5 : 1 }}
              >
                {level.index}. {level.title}
              </Text>

              <View className="flex-row items-center mt-0.5">
                {isCompleted ? (
                  <>
                    <StarRow stars={stars[level.id] ?? 0} size={10} />
                    <Text className="text-tertiary text-[10px] font-sora ml-2">
                      +{level.reward} XP
                    </Text>
                  </>
                ) : state === "playable" ? (
                  <Text
                    className="text-[10px] font-sora-bold"
                    style={{ color }}
                  >
                    {isNext ? "▶ PLAY NOW" : `${level.cost} energy`}
                  </Text>
                ) : (
                  <Text className="text-quaternary text-[10px] font-sora">
                    {unlocked
                      ? `⚡ Needs ${level.cost} energy`
                      : "🔒 Finish the previous level"}
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

/**
 * A smooth polyline through every node centre, drawn inside `width` px.
 *
 * Node centres are at x = 26 + offset and y = 26 + i * ROW_GAP in the SVG's own
 * coordinate space (the container is already offset by -34 + 26), so we offset
 * each point to stay inside the canvas.
 */
const buildSpinePath =
  (positions: { x: number; y: number }[]) => (width: number) => {
    if (positions.length === 0) return "";
    const pts = positions.map((p) => ({
      x: 60 + p.x * 0.5,
      y: 26 + p.y,
    }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const midY = (prev.y + cur.y) / 2;
      d += ` C ${prev.x} ${midY}, ${cur.x} ${midY}, ${cur.x} ${cur.y}`;
    }
    return d;
  };

/* -------------------------------- Level node ------------------------------- */

/**
 * One level button on the map.
 *
 * Playable nodes idle-bob and pulse a halo so the map feels alive even when the
 * player is just looking at it. Boss nodes are larger and get a double ring,
 * which is the visual promise that something bigger is waiting.
 */
function LevelNode({
  level,
  state,
  color,
  isBoss,
  stars,
  onPress,
}: {
  level: StoryLevel;
  index: number;
  state: NodeState;
  color: string;
  isBoss: boolean;
  stars: number;
  onPress: () => void;
}) {
  const size = isBoss ? NODE + 8 : NODE;
  const playable = state === "playable";

  const bob = useSharedValue(0);
  const halo = useSharedValue(0);

  useEffect(() => {
    if (!playable) return;
    bob.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    halo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playable]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bob.value * -3 }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: (1 - halo.value) * 0.5,
    transform: [{ scale: 1 + halo.value * 0.7 }],
  }));

  const emoji =
    level.kind === "finale" ? "👑" : isBoss ? "💀" : level.index % 5 === 1 ? "✨" : null;

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      {playable && (
        <Animated.View
          pointerEvents="none"
          className="absolute rounded-full"
          style={[
            {
              width: size,
              height: size,
              backgroundColor: color + "55",
            },
            haloStyle,
          ]}
        />
      )}

      <Animated.View style={playable ? bobStyle : undefined}>
        <Pressable
          onPress={onPress}
          disabled={state !== "playable"}
          accessibilityLabel={`Level ${level.index}: ${level.title}`}
          className="rounded-full items-center justify-center"
          style={{
            width: size,
            height: size,
            backgroundColor:
              state === "completed"
                ? color
                : state === "playable"
                  ? color + "2E"
                  : "rgba(128,128,128,0.16)",
            borderWidth: isBoss ? 3 : 2.5,
            borderColor:
              state === "locked" ? "rgba(150,150,150,0.35)" : color,
            opacity: state === "locked" ? 0.65 : 1,
          }}
        >
          {state === "completed" ? (
            <Check size={size * 0.42} color="#fff" strokeWidth={3.4} />
          ) : state === "playable" ? (
            emoji ? (
              <Text style={{ fontSize: size * 0.42 }}>{emoji}</Text>
            ) : (
              <Play size={size * 0.34} color={color} fill={color} />
            )
          ) : (
            <Lock size={size * 0.34} color="#9ca3af" />
          )}
        </Pressable>
      </Animated.View>

      {/* Stars badge on completed nodes */}
      {state === "completed" && stars > 0 && (
        <View
          className="absolute rounded-full items-center justify-center"
          style={{
            bottom: -4,
            right: -6,
            minWidth: 20,
            height: 16,
            paddingHorizontal: 4,
            backgroundColor: "#12111a",
            borderWidth: 1,
            borderColor: "#fbbf24",
          }}
        >
          <View className="flex-row items-center">
            <Star size={8} color="#fbbf24" fill="#fbbf24" />
            <Text className="text-amber-400 text-[9px] font-sora-bold ml-0.5">
              {stars}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
