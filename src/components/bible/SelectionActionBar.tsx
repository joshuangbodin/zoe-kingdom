import React from "react";
import { Pressable, Text, View } from "react-native";

import {
  BookmarkCheck,
  Copy,
  Highlighter,
  Share2,
  SquarePen,
} from "lucide-react-native";

/**
 * Floating action bar shown while verses are selected in the Bible reader.
 * Replaces the old single "Share (n)" pill with a cluster of icon actions:
 *
 *   [n]  Copy  |  Share  |  Post  |  Save
 *
 *   Copy   → copy the cleaned verse + reference to the clipboard
 *   Share  → open the native OS share sheet
 *   Post   → compose a community post (writes to the composer)
 *   Save   → toggle the verses into / out of the local saved list
 */
export type SelectionActionBarProps = {
  isDark: boolean;
  count: number;
  allSaved: boolean;
  onCopy: () => void;
  onShare: () => void;
  onPost: () => void;
  onToggleSave: () => void;
};

type ActionButtonProps = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  color: string;
  onPress: () => void;
};

function ActionButton({ icon, label, color, onPress }: ActionButtonProps) {
  const Icon = icon;
  return (
    <Pressable onPress={onPress} className="items-center gap-1 w-14 py-0.5">
      <View className="w-9 h-9 rounded-full bg-card-2 items-center justify-center">
        <Icon size={18} color={color} />
      </View>
      <Text className="text-tertiary text-[9px] font-sora-medium leading-3">
        {label}
      </Text>
    </Pressable>
  );
}

export default function SelectionActionBar({
  isDark,
  count,
  allSaved,
  onCopy,
  onShare,
  onPost,
  onToggleSave,
}: SelectionActionBarProps) {
  const iconColor = isDark ? "#fff" : "#0c0c0c";
  const saveColor = allSaved ? "#f59e0b" : iconColor;

  return (
    <View className="absolute bottom-6 z-50 self-center">
      <View className="flex-row items-center gap-1.5 bg-card-1 rounded-[22px] px-2 py-1.5">
        <View className="ml-1 bg-white rounded-full px-2.5 py-1">
          <Text className="text-black text-[11px] font-sora-bold">{count}</Text>
        </View>

        {/* <ActionButton icon={Copy} label="Copy" color={iconColor} onPress={onCopy} /> */}
        <ActionButton icon={Share2} label="Share" color={iconColor} onPress={onShare} />
        <ActionButton icon={SquarePen} label="Post" color={iconColor} onPress={onPost} />

        <ActionButton
          icon={allSaved ? BookmarkCheck : Highlighter}
          label={allSaved ? "Saved" : "Save"}
          color={saveColor}
          onPress={onToggleSave}
        />
      </View>
    </View>
  );
}