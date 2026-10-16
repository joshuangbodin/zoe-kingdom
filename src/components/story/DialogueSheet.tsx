/**
 * DialogueSheet — the animated cut-scene that plays when a level is tapped.
 *
 * Each level opens with a real conversation between the cast (the Keeper, the
 * villagers, the Shadow) that establishes the scene, makes the stakes personal,
 * and ends on an explicit MISSION BRIEF telling the player exactly what to do.
 * Lines reveal with a typewriter effect; tapping advances, or first completes
 * the current line so nobody gets rushed.
 */

import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOut } from "react-native-reanimated";

import { useTheme } from "@/context/theme-context";
import {
  getCharacter,
  getChapterOfLevel,
  type StoryLevel,
} from "@/data/story";

import MissionBrief from "./MissionBrief";
import SceneHeader, { SpeechBubble } from "./SceneHeader";

export type DialogueSheetHandle = {
  present: (level: StoryLevel) => void;
  dismiss: () => void;
};

type Props = {
  /** Fired when the player accepts the mission and wants to play. */
  onBegin: (level: StoryLevel) => void;
};

const TYPE_MS = 18;

export default forwardRef<DialogueSheetHandle, Props>(
  function DialogueSheet({ onBegin }, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ["78%"], []);

    const [level, setLevel] = useState<StoryLevel | null>(null);
    const [beat, setBeat] = useState(0);
    const [typed, setTyped] = useState("");
    const [phase, setPhase] = useState<"dialogue" | "brief">("dialogue");

    const reset = useCallback((l: StoryLevel | null) => {
      setLevel(l);
      setBeat(0);
      setTyped("");
      setPhase("dialogue");
    }, []);

    useImperativeHandle(ref, () => ({
      present: (l) => {
        reset(l);
        requestAnimationFrame(() => sheetRef.current?.present());
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const dialogue = level?.dialogue ?? [];
    const current = dialogue[beat];
    const fullText = current?.text ?? "";

    useEffect(() => {
      if (!fullText) return;
      setTyped("");
      let i = 0;
      // Reveal in chunks so even a long line finishes in well under a second.
      const step = Math.max(1, Math.ceil(fullText.length / 70));
      const timer = setInterval(() => {
        i += step;
        setTyped(fullText.slice(0, i));
        if (i >= fullText.length) clearInterval(timer);
      }, TYPE_MS);
      return () => clearInterval(timer);
    }, [fullText, beat]);

    const doneTyping = typed.length >= fullText.length;

    const advance = useCallback(() => {
      // First tap completes the line, second tap moves on — never skip a line.
      if (!doneTyping) {
        setTyped(fullText);
        return;
      }
      if (beat + 1 < dialogue.length) setBeat(beat + 1);
      else setPhase("brief");
    }, [beat, dialogue.length, doneTyping, fullText]);

    const bg = isDark ? "#121111" : "#fbf6ee";
    const chapter = level ? getChapterOfLevel(level.id) : undefined;
    const accent = chapter?.color ?? "#f59e0b";
    const speaker = current ? getCharacter(current.who) : null;

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: bg }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#3a3a3a" : "#d9cbb5",
          width: 42,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 24 }}
        >
          {level && (
            <SceneHeader
              title={level.title}
              setting={level.setting}
              chapterTitle={chapter?.title}
              chapterIndex={chapter?.index}
            />
          )}

          {phase === "dialogue" && current && speaker ? (
            <SpeechBubble
              key={beat}
              speaker={speaker}
              beat={beat + 1}
              total={dialogue.length}
              emotion={current.emotion}
              typed={typed}
              doneTyping={doneTyping}
              accent={accent}
              onPress={advance}
            />
          ) : level ? (
            <MissionBrief
              level={level}
              accent={accent}
              dialogue={dialogue}
              onBegin={onBegin}
            />
          ) : null}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);
