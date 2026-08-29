import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { X } from "lucide-react-native";

import {
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import { useTheme } from "@/context/theme-context";

export type EditPostSheetHandle = {
  present: (text: string) => void;
  dismiss: () => void;
};

export type EditPostSheetProps = {
  onSave?: (text: string) => Promise<void> | void;
};

/**
 * Slidable bottom sheet for editing one of your own posts. Uses
 * BottomSheetTextInput so the keyboard plays nicely with the sheet.
 */
const EditPostSheet = forwardRef<EditPostSheetHandle, EditPostSheetProps>(
  function EditPostSheet({ onSave }, ref) {
    const { isDark } = useTheme();
    const sheetRef = useRef<BottomSheetModal>(null);
    const [text, setText] = useState("");
    const [saving, setSaving] = useState(false);

    const snapPoints = useMemo(() => ["55%"], []);

    useImperativeHandle(ref, () => ({
      present: (initial) => {
        setText(initial);
        requestAnimationFrame(() => sheetRef.current?.present());
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const dismiss = () => sheetRef.current?.dismiss();

    const handleSave = async () => {
      if (!text.trim() || saving) return;
      setSaving(true);
      try {
        await onSave?.(text.trim());
        dismiss();
      } finally {
        setSaving(false);
      }
    };

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backgroundStyle={{ backgroundColor: isDark ? "#111" : "#ffffff" }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#3a3a3a" : "#d4d4d8",
          width: 40,
        }}
      >
        <BottomSheetView className="flex-1 px-5 pb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-primary text-base font-sora-semibold">
              Edit Post
            </Text>
            <Pressable onPress={dismiss} className="w-8 h-8 rounded-full bg-overlay items-center justify-center" hitSlop={8}>
              <X size={16} color="#888" />
            </Pressable>
          </View>

          <BottomSheetTextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Edit your post..."
            placeholderTextColor="#555"
            style={{
              backgroundColor: isDark ? "#1c1a1a" : "#f4f4f5",
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 14,
              color: isDark ? "#ffffffcc" : "#000000cc",
              fontSize: 14,
              fontFamily: "Geist-Regular",
              minHeight: 140,
              textAlignVertical: "top",
            }}
          />

          <Pressable
            onPress={handleSave}
            disabled={saving || !text.trim()}
            className="bg-white rounded-xl py-3.5 items-center mt-4 active:opacity-80"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className="text-black text-sm font-sora-semibold">
                Save Changes
              </Text>
            )}
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default EditPostSheet;