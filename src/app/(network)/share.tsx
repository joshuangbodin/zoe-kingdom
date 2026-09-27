import * as Clipboard from "expo-clipboard";
import { router, useLocalSearchParams } from "expo-router";
import {
  Check,
  ChevronLeft,
  Copy,
  Share2,
} from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Text, View, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Avatar from "@/components/Avatar";
import VerseText from "@/components/bible/VerseText";
import { useTheme } from "@/context/theme-context";
import { useToast } from "@/components/Toast";

/**
 * Share page — a clean, shareable preview of a single post (thought + verse).
 * Lets users copy a text summary or share it via the native share sheet.
 */
export default function SharePost() {
  const params = useLocalSearchParams<{
    id?: string;
    uid?: string;
    username?: string;
    avatar?: string;
    thought?: string;
    verseReference?: string;
    verseText?: string;
  }>();

  const { top } = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const username = params.username || "anonymous";
  const avatar = Number(params.avatar || 0);
  const id = params.id || "";

  const shareText = [
    params.thought ? `“${params.thought}”` : "",
    params.verseReference ? `${params.verseReference} · ${params.verseText || ""}` : "",
    `— shared via Zoe Kingdom`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const handleCopy = async () => {
    await Clipboard.setStringAsync(
      shareText + (id ? `\nhttps://zoekingdom.app/p/${id}` : ""),
    );
    setCopied(true);
    showToast("Copied to clipboard", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: shareText });
    } catch {
      showToast("Could not open share sheet", "error");
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: top + 8 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-3 border-b border-line">
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-xl bg-card-1 items-center justify-center"
          hitSlop={8}
        >
          <ChevronLeft size={18} color={isDark ? "#fff" : "#0c0c0c"} />
        </Pressable>
        <Text className="text-primary text-sm font-sora-semibold">
          Share Post
        </Text>
        <View className="w-9 h-9" />
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview */}
        <Text className="text-tertiary text-[10px] font-sora-semibold uppercase tracking-wider mt-5 mb-3">
          Preview
        </Text>

        <View className="bg-card-1 rounded-3xl p-4">
          <View className="flex-row items-center mb-3">
            <Avatar index={avatar} diameter={32} />
            <Text className="text-primary text-xs font-sora-semibold ml-2.5">
              {username}
            </Text>
          </View>

          {params.thought ? (
            <Text className="text-primary/85 text-xs leading-6 font-sora mb-3">
              {params.thought}
            </Text>
          ) : null}

          {!!params.verseReference && (
            <View className="bg-black/80 rounded-3xl p-4">
              <Text className="text-white text-xs font-sora mb-1.5">
                {params.verseReference}
              </Text>
              {params.verseText ? (
                <VerseText
                  text={params.verseText}
                  bodyClassName="text-white text-xs leading-5 font-serif"
                  noteClassName="text-white/55 text-[10px] leading-4 font-serif-italic mt-1"
                />
              ) : null}
            </View>
          )}
        </View>

        <View className="mt-8 gap-3">
          <Pressable
            onPress={handleShare}
            className="flex-row items-center justify-center rounded-2xl bg-white py-4"
          >
            <Share2 size={17} color="#0c0c0c" />
            <Text className="text-black text-sm font-sora-semibold ml-2.5">
              Share to other apps
            </Text>
          </Pressable>

          <Pressable
            onPress={handleCopy}
            className="flex-row items-center justify-center rounded-2xl bg-card-1 py-4"
          >
            {copied ? (
              <Check size={17} color="#10b981" />
            ) : (
              <Copy size={17} color={isDark ? "#fff" : "#0c0c0c"} />
            )}
            <Text
              className="text-sm font-sora-semibold ml-2.5"
              style={{ color: copied ? "#10b981" : isDark ? "#fff" : "#0c0c0c" }}
            >
              {copied ? "Copied!" : "Copy link & text"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}