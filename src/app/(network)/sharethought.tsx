import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { sqlite } from "@/libs/sqlite/db";

export default function ShareThought() {
  const { verses } = useLocalSearchParams();

  const parsed = useMemo(() => {
    try {
      return JSON.parse(verses as string);
    } catch {
      return [];
    }
  }, [verses]);

  const scriptureMeta = useMemo(() => {
    if (!parsed.length) return null;

    const book = parsed[0].book;
    const chapter = parsed[0].chapter;

    const verseNumbers = parsed.map((v: any) => v.verse);

    const startVerse = Math.min(...verseNumbers);
    const endVerse = Math.max(...verseNumbers);

    return {
      book,
      chapter,
      range:
        startVerse === endVerse ? `${startVerse}` : `${startVerse}-${endVerse}`,
    };
  }, [parsed]);

  const [text, setText] = useState("");

  const canPost = text.trim().length > 0;

  const saveThought = async () => {
    if (!canPost) return;

    const firstVerse = parsed?.[0];

    await sqlite.runAsync(
      `INSERT INTO verse_thoughts 
      (id, book, chapter, verse, verseText, thought, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Date.now().toString(),
        firstVerse?.book,
        firstVerse?.chapter,
        firstVerse?.verse,
        parsed.map((v: any) => v.text).join("\n"),
        text,
        Date.now(),
      ],
    );

    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg"
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        {/* HEADER */}
        <Text className="text-white text-2xl font-bold mb-6">
          Share your thought
        </Text>

        {/* VERSES PREVIEW (Twitter-style quote block) */}
        <View className="bg-card rounded-2xl p-4 mb-6">
          <Text className="text-white font-semibold mb-2">
            {scriptureMeta?.book} {scriptureMeta?.chapter}:
            {scriptureMeta?.range}
          </Text>

          {parsed.map((v: any) => (
            <Text key={v.id} className="text-white text-base leading-6 mb-3">
              “{v.text}”
            </Text>
          ))}
        </View>

        {/* INPUT BOX */}
        <View className="bg-card rounded-2xl p-4 min-h-[180px]">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write your reflection..."
            placeholderTextColor="#666"
            multiline
            style={{
              color: "white",
              fontSize: 16,
              lineHeight: 24,
              minHeight: 150,
            }}
          />
        </View>

        {/* ACTION BUTTON */}
        <Pressable
          onPress={saveThought}
          disabled={!canPost}
          className={`mt-6 py-4 rounded-2xl items-center ${
            canPost ? "bg-white" : "bg-gray-600"
          }`}
        >
          <Text
            className={`font-bold ${canPost ? "text-black" : "text-gray-300"}`}
          >
            Share thought
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
