import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { BookOpen, Bookmark, ChevronLeft, PenLine, X } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import VerseText from "@/components/bible/VerseText";
import { useTheme } from "@/context/theme-context";
import {
  getSavedVerses,
  unsaveVerses,
} from "@/libs/sqlite/saved-verses";

export default function SavedVerses() {
  const { top } = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [items, setItems] = useState<
    {
      id: string;
      book: string;
      chapter: number;
      verse: number;
      note?: string | null;
      color?: string | null;
      text?: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSavedVerses()
        .then((list) => {
          if (!active) return;
          setItems(list);
          setLoading(false);
        })
        .catch(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const openVerse = useCallback((item: (typeof items)[number]) => {
    router.push({
      pathname: "/(tabs)/bible",
      params: {
        book: item.book,
        chapter: String(item.chapter),
        verse: String(item.verse),
      },
    });
  }, []);

  const remove = useCallback(async (id: string) => {
    await unsaveVerses([id]);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const iconColor = isDark ? "#fff" : "#0c0c0c";

  const renderItem = useCallback(
    ({ item }: { item: (typeof items)[number] }) => {
      const tag = item.color ?? null;
      return (
        <Pressable
          onPress={() => openVerse(item)}
          className="bg-card-1 rounded-2xl pl-4 pr-3 py-4 mb-3 overflow-hidden active:opacity-80"
        >
          <View style={{ flexDirection: "row" }}>
            {tag && (
              <View
                className="absolute left-0 top-0 bottom-0"
                style={{ backgroundColor: tag, width: 4 }}
              />
            )}
            <View className="flex-1">
              {/* Reference + remove */}
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-amber-400 font-serif text-sm font-semibold">
                  {item.book} {item.chapter}:{item.verse}
                </Text>
                <Pressable
                  onPress={() => remove(item.id)}
                  hitSlop={8}
                  className="p-1.5"
                >
                  <X size={16} color={isDark ? "#888" : "#a1a1aa"} />
                </Pressable>
              </View>

              {/* Verse body (parsed like the reader) */}
              <VerseText
                text={item.text}
                bodyClassName="text-primary text-sm leading-6 font-serif"
                noteClassName="text-tertiary/60 text-[11px] leading-4 font-serif-italic mt-1"
              />

              {/* Personal note */}
              {!!item.note && (
                <View
                  className="flex-row items-start mt-2.5 pl-2.5 border-l-2"
                  style={{ borderColor: tag ?? (isDark ? "#3a3a3a" : "#d4d4d8") }}
                >
                  <PenLine size={11} color="#a1a1aa" style={{ marginTop: 3 }} />
                  <Text className="text-secondary/85 text-[11px] leading-4 font-sora ml-1.5 flex-1">
                    {item.note}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      );
    },
    [isDark, openVerse, remove],
  );

  return (
    <View style={{ paddingTop: top + 8 }} className="flex-1 bg-bg">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 bg-card-1 rounded-xl items-center justify-center"
        >
          <ChevronLeft size={20} color={iconColor} />
        </Pressable>
        <View className="flex-1 flex-row items-center ml-3">
          <Bookmark size={16} color="#fbbf24" />
          <Text className="text-primary text-lg font-sora-semibold ml-2">
            Saved Verses
          </Text>
        </View>
        <Text className="text-tertiary text-xs font-sora">
          {items.length}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={iconColor} />
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <View className="w-16 h-16 rounded-3xl bg-amber-500/10 items-center justify-center mb-4">
            <BookOpen size={26} color="#fbbf24" />
          </View>
          <Text className="text-primary text-base font-sora-semibold text-center">
            No saved verses yet
          </Text>
          <Text className="text-tertiary text-xs font-sora text-center mt-2 leading-5">
            Open the Bible, select a verse and tap{" "}
            <Text className="text-amber-400 font-sora-medium">Save</Text> to keep
            it here with a note and color.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        />
      )}
    </View>
  );
}