import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import {
  Bookmark,
  BookOpen,
  ChevronLeft,
  PenLine,
  X,
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import VerseText from "@/components/bible/VerseText";
import { useTheme } from "@/context/theme-context";

import { getSavedVerses, unsaveVerses } from "@/libs/sqlite/saved-verses";

type SavedVerse = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  note?: string | null;
  color?: string | null;
  text?: string | null;
};

export default function SavedVerses() {
  const { top } = useSafeAreaInsets();
  const { isDark } = useTheme();

  const [items, setItems] = useState<SavedVerse[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setLoading(true);

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

  const openVerse = useCallback((item: SavedVerse) => {
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

    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const iconColor = isDark ? "#fff" : "#0c0c0c";

  const renderItem = useCallback(
    ({ item }: { item: SavedVerse }) => {
      const tag = item.color ?? null;

      return (
        <Pressable
          onPress={() => openVerse(item)}
          className="bg-card-1 rounded-2xl mb-3 overflow-hidden active:opacity-80"
        >
          <View className="px-4 pt-4 pb-4">
            {/* top row */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View
                  style={tag && { backgroundColor: tag }}
                  className="w-1 h-4 rounded-full bg-card-1 mr-2.5"
                />

                <Text className="text-primary font-serif text-sm font-semibold">
                  {item.book} {item.chapter}:{item.verse}
                </Text>
              </View>

              <Pressable
                onPress={() => remove(item.id)}
                hitSlop={10}
                className="w-8 h-8 rounded-full items-center justify-center"
              >
                <X size={16} color={isDark ? "#888" : "#a1a1aa"} />
              </Pressable>
            </View>

            {/* verse */}
            <View className="pr-1">
              <VerseText
                text={item.text}
                bodyClassName="text-primary text-sm leading-6 font-serif"
                noteClassName="text-tertiary/60 text-[11px] leading-4 font-serif-italic mt-1"
              />
            </View>

            {/* metadata */}
            <View className="flex-row items-center mt-4 pt-3 ">
              <View className="flex-row items-center flex-1">
                <Text className="text-tertiary text-[11px] font-sora">Tag</Text>

                {tag ? (
                  <View
                    className="w-4 h-4 rounded-full ml-2"
                    style={{
                      backgroundColor: tag,
                    }}
                  />
                ) : (
                  <View className="ml-2 w-4 h-4 rounded-full border border-border" />
                )}
              </View>

              {item.note ? (
                <View className="flex-row items-center">
                  <PenLine size={11} color={isDark ? "#888" : "#a1a1aa"} />

                  <Text className="text-tertiary text-[10px] font-sora ml-1.5">
                    Personal note
                  </Text>
                </View>
              ) : null}
            </View>

            {/* personal note */}
            {!!item.note && (
              <View
                className="flex-row items-start mt-3 pt-3 border-t"
                style={{
                  borderColor: tag ?? (isDark ? "#3a3a3a" : "#d9cbb5"),
                }}
              >
                <View className="w-7 h-7 rounded-lg bg-card-1 items-center justify-center mr-2">
                  <PenLine size={12} color={isDark ? "#888" : "#a1a1aa"} />
                </View>

                <Text className="text-secondary/85 text-[11px] leading-5 font-sora flex-1 pt-0.5">
                  {item.note}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      );
    },
    [isDark, openVerse, remove],
  );

  return (
    <View style={{ paddingTop: top + 8 }} className="flex-1 bg-bg">
      {/* header */}
      <View className="flex-row items-center px-4 pb-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 bg-card-1 rounded-xl items-center justify-center active:opacity-70"
        >
          <ChevronLeft size={20} color={iconColor} />
        </Pressable>

        <View className="flex-1 flex-row items-center ml-3">
          <Bookmark size={16} color="#fbbf24" />

          <Text className="text-primary text-lg font-sora-semibold ml-2">
            Saved Verses
          </Text>
        </View>

        <View className="min-w-7 h-7 px-2 rounded-full bg-card-1 items-center justify-center">
          <Text className="text-tertiary text-[11px] font-sora-medium">
            {items.length}
          </Text>
        </View>
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
            <Text className="text-amber-400 font-sora-medium">Save</Text> to
            keep it here with a note and color.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 2,
            paddingBottom: 40,
          }}
        />
      )}
    </View>
  );
}
