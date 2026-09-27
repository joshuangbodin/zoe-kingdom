import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Bookmark, Flag, Pencil, Share2, Trash2, X } from "lucide-react-native";
import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/theme-context";

export type PostActionsPayload = {
  isOwn: boolean;
  isSaved: boolean;
  onShare?: () => void;
  onSave?: () => void;
  onReport?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export type PostActionsSheetHandle = {
  present: (payload: PostActionsPayload) => void;
  dismiss: () => void;
};

type RowProps = {
  icon: React.ReactNode;
  label: string;
  tone?: "default" | "destructive";
  onPress?: () => void;
};

function ActionRow({ icon, label, tone = "default", onPress }: RowProps) {
  const { isDark } = useTheme();
  const color =
    tone === "destructive"
      ? "#ef4444"
      : isDark
        ? "#fff"
        : "#0c0c0c";

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-2xl px-4 py-3.5"
      style={{ backgroundColor: isDark ? "#1c1a1a" : "#ffffff" }}
    >
      <View
        className="w-9 h-9 rounded-xl items-center justify-center"
        style={{
          backgroundColor:
            tone === "destructive" ? "rgba(239,68,68,0.15)" : "#f1e8da",
        }}
      >
        {icon}
      </View>
      <Text className="ml-3 text-[13px] font-sora-semibold" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

const PostActionsSheet = forwardRef<PostActionsSheetHandle>(
  function PostActionsSheet(_, ref) {
    const sheetRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const { isDark } = useTheme();
    const [payload, setPayload] = useState<PostActionsPayload | null>(null);

    const snapPoints = useMemo(() => ["55%"], []);

    useImperativeHandle(ref, () => ({
      present: (p) => {
        setPayload(p);
        requestAnimationFrame(() => sheetRef.current?.present());
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }));

    const dismiss = () => sheetRef.current?.dismiss();

    return (
      <BottomSheetModal
        ref={sheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: isDark ? "#121111" : "#fbf6ee" }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#3a3a3a" : "#d9cbb5",
          width: 42,
        }}
      >
        <BottomSheetView
          className="flex-1 px-5"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-primary text-lg font-sora-semibold">
                Post options
              </Text>
              <Text className="text-tertiary text-[11px] font-sora">
                Choose an action for this post
              </Text>
            </View>
            <Pressable
              onPress={dismiss}
              className="w-9 h-9 rounded-full bg-overlay items-center justify-center"
              hitSlop={8}
            >
              <X size={17} color={isDark ? "#fff" : "#0c0c0c"} />
            </Pressable>
          </View>

          <View className="gap-2.5">
            {payload?.isOwn ? (
              <>
                <ActionRow
                  icon={<Pencil size={16} color={isDark ? "#fff" : "#0c0c0c"} />}
                  label="Edit post"
                  onPress={() => {
                    dismiss();
                    payload?.onEdit?.();
                  }}
                />
                <ActionRow
                  icon={<Trash2 size={16} color="#ef4444" />}
                  label="Delete post"
                  tone="destructive"
                  onPress={() => {
                    dismiss();
                    payload?.onDelete?.();
                  }}
                />
              </>
            ) : null}

            <ActionRow
              icon={<Share2 size={16} color={isDark ? "#fff" : "#0c0c0c"} />}
              label="Share post"
              onPress={() => {
                dismiss();
                payload?.onShare?.();
              }}
            />

            <ActionRow
              icon={
                <Bookmark
                  size={16}
                  color={payload?.isSaved ? "#f59e0b" : isDark ? "#fff" : "#0c0c0c"}
                  fill={payload?.isSaved ? "#f59e0b" : "transparent"}
                />
              }
              label={payload?.isSaved ? "Remove from saved" : "Save post"}
              onPress={() => {
                dismiss();
                payload?.onSave?.();
              }}
            />

            {!payload?.isOwn ? (
              <ActionRow
                icon={<Flag size={16} color="#ef4444" />}
                label="Report post"
                tone="destructive"
                onPress={() => {
                  dismiss();
                  payload?.onReport?.();
                }}
              />
            ) : null}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default PostActionsSheet;