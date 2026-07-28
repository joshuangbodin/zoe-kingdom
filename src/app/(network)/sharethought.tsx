import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { auth } from "@/libs/firebase";
import { createPost } from "@/libs/firebase/posts";
import { getUserProfile } from "@/libs/firebase/users";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, BookOpen } from "lucide-react-native";
import BibleModal from "@/components/BibleModal";

export default function ShareThought() {
  const { verses } = useLocalSearchParams();
  const { top } = useSafeAreaInsets();

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
      reference: `${book} ${chapter}:${startVerse === endVerse ? startVerse : `${startVerse}-${endVerse}`}`,
      text: parsed.map((v: any) => v.text).join(" "),
    };
  }, [parsed]);

  const [thought, setThought] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showBibleModal, setShowBibleModal] = useState(false);

  const canPost = thought.trim().length > 0 || parsed.length > 0;

  const handleShare = async () => {
    if (!canPost || submitting) return;

    try {
      setSubmitting(true);
      const user = auth.currentUser;
      if (!user) {
        router.replace("/(auth)/signin");
        return;
      }

      const profile = await getUserProfile(user.uid);

      await createPost({
        uid: user.uid,
        username: profile?.username || "anonymous",
        avatar: profile?.avatar ?? 0,
        spiritStage: profile?.spiritStage || "Kindled Flame",
        thought: thought.trim() || "Shared a scripture",
        verseText: scriptureMeta?.text || "",
        verseReference: scriptureMeta?.reference || "",
        tags: ["faith", "bible"],
      });

      router.back();
    } catch (err) {
      console.error("Error sharing thought:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg"
    >
      <View style={{ paddingTop: top + 10 }} className="flex-1 px-5">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-xl bg-card-2 items-center justify-center"
          >
            <ChevronLeft color="white" size={18} />
          </Pressable>
          <Text className="text-white text-lg font-sora-bold">Share Thought</Text>
          <View className="w-10" />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Verse Preview */}
          {scriptureMeta && (
            <Pressable
              onPress={() => {
                setShowBibleModal(true);
              }}
              className="bg-card-2 rounded-[30px] overflow-hidden mb-6"
            >
              <View className="p-6">
                <Text className="text-white text-2xl font-serif mb-2">
                  {scriptureMeta.reference}
                </Text>
                <Text className="text-zinc-300 leading-9 text-[17px] font-serif">
                  "{scriptureMeta.text}"
                </Text>
              </View>
              <View className="bg-white/10 px-6 py-3 flex-row items-center">
                <BookOpen size={12} color="white" />
                <Text className="text-white/60 text-xs font-sora ml-2">
                  Tap to read in Bible →
                </Text>
              </View>
            </Pressable>
          )}

          {/* Thought Input */}
          <Text className="text-white text-sm font-sora-semibold mb-3">
            Your Reflection
          </Text>
          <TextInput
            value={thought}
            onChangeText={setThought}
            placeholder={
              parsed.length > 0
                ? "What does this verse mean to you?"
                : "Share a thought, prayer, or testimony..."
            }
            placeholderTextColor="#666"
            multiline
            className="bg-card-1 rounded-[28px] px-5 py-5 text-white font-sora text-[16px] leading-7 min-h-[160px]"
            textAlignVertical="top"
          />

          {/* Share Button */}
          <Pressable
            onPress={handleShare}
            disabled={submitting || !canPost}
            className={`mt-8 rounded-2xl py-5 items-center ${
              canPost ? "bg-white" : "bg-card-1"
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="black" />
            ) : (
              <Text
                className={`font-sora-bold text-sm ${
                  canPost ? "text-black" : "text-muted"
                }`}
              >
                Share with The Zoe Network
              </Text>
            )}
          </Pressable>
        </ScrollView>
      </View>

      {/* Bible Modal for reading */}
      {scriptureMeta && (
        <BibleModal
          visible={showBibleModal}
          onClose={() => setShowBibleModal(false)}
          initialBook={scriptureMeta.book}
          initialChapter={scriptureMeta.chapter}
          initialVerse={
            scriptureMeta.range.includes("-")
              ? parseInt(scriptureMeta.range.split("-")[0], 10)
              : parseInt(scriptureMeta.range, 10)
          }
        />
      )}
    </KeyboardAvoidingView>
  );
}
