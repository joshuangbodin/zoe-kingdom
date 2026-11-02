
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
  onBegin: (level: StoryLevel) => void;
};

const TYPE_MS = 22;
const TYPE_STEPS = 60;

export default forwardRef<DialogueSheetHandle, Props>(
  function DialogueSheet({ onBegin }, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);

    const { isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const snapPoints = useMemo(() => ["78%"], []);

    const [level, setLevel] = useState<StoryLevel | null>(null);
    const [beat, setBeat] = useState(0);
    const [revealedChars, setRevealedChars] = useState(0);
    const [phase, setPhase] = useState<"dialogue" | "brief">("dialogue");

    const reset = useCallback((nextLevel: StoryLevel | null) => {
      setLevel(nextLevel);
      setBeat(0);
      setRevealedChars(0);
      setPhase(
        nextLevel?.dialogue?.length ? "dialogue" : "brief",
      );
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        present: (nextLevel) => {
          reset(nextLevel);
          requestAnimationFrame(() => {
            sheetRef.current?.present();
          });
        },
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [reset],
    );

    const dialogue = level?.dialogue ?? [];
    const current = dialogue[beat];
    const fullText = current?.text ?? "";

    // Reveal the existing text progressively by character count.
    useEffect(() => {
      if (phase !== "dialogue" || !fullText) return;

      setRevealedChars(0);

      let index = 0;
      const step = Math.max(
        1,
        Math.ceil(fullText.length / TYPE_STEPS),
      );

      const timer = setInterval(() => {
        index = Math.min(index + step, fullText.length);
        setRevealedChars(index);

        if (index >= fullText.length) {
          clearInterval(timer);
        }
      }, TYPE_MS);

      return () => clearInterval(timer);
    }, [fullText, beat, phase]);

    const doneTyping = revealedChars >= fullText.length;

    // The first action completes the current line.
    // Once complete, it advances to the next line.
    const advance = useCallback(() => {
      if (!doneTyping) {
        setRevealedChars(fullText.length);
        return;
      }

      if (beat + 1 < dialogue.length) {
        setBeat((previous) => previous + 1);
      } else {
        setPhase("brief");
      }
    }, [doneTyping, fullText, beat, dialogue.length]);

    // Skip the remaining conversation and open the mission brief.
    const skipStory = useCallback(() => {
      setPhase("brief");
    }, []);

    const bg = isDark ? "#121111" : "#FBF6EE";
    const chapter = level
      ? getChapterOfLevel(level.id)
      : undefined;

    const accent = chapter?.color ?? "#F59E0B";
    const speaker = current
      ? getCharacter(current.who)
      : null;

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: bg }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#3A3A3A" : "#D9CBB5",
          width: 42,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            padding: 20,
            paddingBottom: insets.bottom + 24,
          }}
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
              speaker={speaker}
              beat={beat + 1}
              total={dialogue.length}
              emotion={current.emotion}
              text={fullText}
              revealedChars={revealedChars}
              doneTyping={doneTyping}
              accent={accent}
              onPrimaryPress={advance}
              onSkipStory={skipStory}
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
