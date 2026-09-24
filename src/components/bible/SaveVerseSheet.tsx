import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Bookmark, PenLine, X } from "lucide-react-native";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useTheme } from "@/context/theme-context";

/* ---------------------------- TYPES ---------------------------- */

export type SaveVersePayload = {
  /** Display reference like "Genesis 1:1-3". */
  reference: string;
  /** True when the selected verses are already saved (edit vs. create). */
  alreadySaved: boolean;
  /** Pre-fill values for an already-saved verse. */
  note?: string;
  color?: string | null;
};

export type SaveVerseSheetHandle = {
  present: (payload: SaveVersePayload) => void;
  dismiss: () => void;
};

export type SaveVerseSheetProps = {
  /** Fired on confirm with the note + color tag the reader picked. */
  onSave: (note: string, color: string | null) => void;
  /** Fired when the reader removes the verse(s) from saved. */
  onRemove: () => void;
};

/* ---------------------------- COLOR TAGS ---------------------------- */

const TAG_COLORS = [
  "#f59e0b", // amber – highlight
  "#2563eb", // blue
  "#10b981", // green
  "#ef4444", // red
  "#7c3aed", // purple
  "#0ea5e9", // sky
  "#ec4899", // pink
];

/* ---------------------------- SHEET ---------------------------- */

const SaveVerseSheet = forwardRef<SaveVerseSheetHandle, SaveVerseSheetProps>(
  function SaveVerseSheet({ onSave, onRemove }, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const { isDark } = useTheme();

    const [reference, setReference] = useState("");
    const [alreadySaved, setAlreadySaved] = useState(false);
    const [note, setNote] = useState("");
    const [color, setColor] = useState<string | null>(null);

    const snapPoints = useMemo(() => ["55%", "70%"], []);

    const dismiss = () => sheetRef.current?.dismiss();

    useImperativeHandle(ref, () => ({
      present: (payload: SaveVersePayload) => {
        setReference(payload.reference);
        setAlreadySaved(!!payload.alreadySaved);
        setNote(payload.note ?? "");
        setColor(payload.color ?? null);
        requestAnimationFrame(() => sheetRef.current?.present());
      },
      dismiss,
    }));

    const accent = isDark ? "#ffffff" : "#0c0c0c";
    const iconColor = isDark ? "#ffffff" : "#0c0c0c";

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={{ backgroundColor: isDark ? "#121111" : "#fbf6ee" }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#3a3a3a" : "#d9cbb5",
          width: 42,
        }}
      >
        <BottomSheetView className="flex-1 px-5 pb-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-1">
            <View className="flex-row items-center gap-2">
              <View className="w-9 h-9 rounded-xl bg-amber-500/15 items-center justify-center">
                <Bookmark size={16} color="#f59e0b" />
              </View>
              <View>
                <Text className="text-primary text-lg font-sora-semibold leading-6">
                  {alreadySaved ? "Edit saved verse" : "Save verse"}
                </Text>
                <Text className="text-tertiary text-[11px] font-sora">
                  {reference}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={dismiss}
              hitSlop={8}
              className="w-9 h-9 rounded-full bg-overlay items-center justify-center"
            >
              <X size={17} color={iconColor} />
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
            className="flex-1 mt-6 -mx-5 px-5"
          >
            {/* Note */}
            <Text className="text-primary text-xs font-sora-medium mb-2">
              Add a note
            </Text>
            <View className="flex-row items-center rounded-2xl bg-card-2 px-3.5 mb-5">
              <PenLine size={15} color={isDark ? "#71717a" : "#a1a1aa"} />
              <BottomSheetTextInput
                value={note}
                onChangeText={setNote}
                placeholder="Why does this verse matter to you?"
                placeholderTextColor={isDark ? "#555" : "#a1a1aa"}
                multiline
                numberOfLines={3}
                autoCorrect
                className="flex-1 px-3 py-3.5 text-primary text-sm font-sora"
                style={{
                  color: isDark ? "#ffffff" : "#0c0c0c",
                  textAlignVertical: "top",
                }}
              />
            </View>
{/* Color tag */}
            <Text className="text-primary text-xs font-sora-medium mb-2.5">
              Highlight color
            </Text>
            <View className="flex-row flex-wrap gap-2.5 mb-2">
              <Pressable
                onPress={() => setColor(null)}
                className={`w-11 h-11 rounded-full items-center justify-center ${
                  color === null ? "border-2 border-line" : "bg-card-2"
                }`}
              >
                <Text
                  className={
                    color === null ? "text-primary text-sm" : "text-tertiary text-base"
                  }
                >
                  ×
                </Text>
              </Pressable>
              {TAG_COLORS.map((c) => {
                const active = color === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    className="w-11 h-11 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: c,
                      borderWidth: active ? 3 : 0,
                      borderColor: isDark ? "#ffffff" : "#0c0c0c",
                    }}
                  >
                    {active && (
                      <Text className="text-white text-lg leading-none">✓</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="flex-row items-center gap-3 mt-2">
            {alreadySaved && (
              <Pressable
                onPress={() => {
                  onRemove();
                  dismiss();
                }}
                className="rounded-2xl px-4 py-3.5"
                style={{ backgroundColor: isDark ? "#1f1e1e" : "#f7f7f1" }}
              >
                <Text className="text-red-400 text-[13px] font-sora-semibold">
                  Unsave
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                onSave(note.trim(), color);
                dismiss();
              }}
              className="flex-1 rounded-2xl items-center"
              style={{ backgroundColor: accent }}
            >
              <Text
                className="text-[14px] font-sora-semibold my-3.5"
                style={{ color: isDark ? "#0c0c0c" : "#ffffff" }}
              >
                {alreadySaved ? "Save changes" : "Save verse"}
              </Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default SaveVerseSheet;