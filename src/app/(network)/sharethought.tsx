import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
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
import {
  ChevronLeft,
  BookOpen,
  Image,
  Hash,
  Sparkles,
} from "lucide-react-native";
import BibleModal, { BibleSelection } from "@/components/BibleModal";
import Avatar from "@/components/Avatar";
import { useToast } from "@/components/Toast";

export default function ShareThought() {
  const { verses } = useLocalSearchParams();
  const { top } = useSafeAreaInsets();

  // Parse initial verses if passed from bible page
  const initialVerses = useMemo(() => {
    try {
      return JSON.parse(verses as string);
    } catch {
      return [];
    }
  }, [verses]);

  const [thought, setThought] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showBibleModal, setShowBibleModal] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<BibleSelection | null>(
    initialVerses.length > 0
      ? {
          verses: initialVerses,
          reference: (() => {
            const book = initialVerses[0].book;
            const chapter = initialVerses[0].chapter;
            const vNums = initialVerses.map((v: any) => v.verse);
            const start = Math.min(...vNums);
            const end = Math.max(...vNums);
            const range = start === end ? `${start}` : `${start}-${end}`;
            return `${book} ${chapter}:${range}`;
          })(),
          text: initialVerses.map((v: any) => v.text).join(" "),
        }
      : null,
  );

  const [profile, setProfile] = useState<any>(null);
  const { showToast } = useToast();

  // Load profile on mount
  React.useEffect(() => {
    const load = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const data = await getUserProfile(user.uid);
      setProfile(data);
    };
    load();
  }, []);

  const canPost = thought.trim().length > 0 || !!selectedVerse;

  const handleBibleSelect = useCallback((selection: BibleSelection) => {
    setSelectedVerse(selection);
  }, []);

  const handleShare = async () => {
    if (!canPost || submitting) return;

    try {
      setSubmitting(true);
      const user = auth.currentUser;
      if (!user) {
        router.replace("/(auth)/signin");
        return;
      }

      const p = profile || (await getUserProfile(user.uid));

      await createPost({
        uid: user.uid,
        thought: thought.trim() || "Shared a scripture",
        verseText: selectedVerse?.text || "",
        verseReference: selectedVerse?.reference || "",
        tags: ["faith", ...(selectedVerse ? ["bible"] : [])],
      });

      showToast("Post shared!", "success");
      router.back();
    } catch (err) {
      console.error("Error sharing thought:", err);
      showToast("Failed to share post", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg"
    >
      <View style={{ paddingTop: top + 10 }} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pb-4 border-b border-white/5">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-card-2 items-center justify-center"
          >
            <ChevronLeft color="white" size={17} />
          </Pressable>
          <Text className="text-white text-base font-sora-semibold">
            New Post
          </Text>
          <Pressable
            onPress={handleShare}
            disabled={submitting || !canPost}
            className={`px-5 py-2 rounded-xl ${
              canPost ? "bg-white" : "bg-card-1"
            }`}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="black" />
            ) : (
              <Text
                className={`text-sm font-sora-semibold ${
                  canPost ? "text-black" : "text-zinc-500"
                }`}
              >
                Share
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* User Row */}
          <View className="flex-row items-center px-5 pt-5 pb-4">
            <Avatar index={profile?.avatar} diameter={36} />
            <View className="ml-3">
              <Text className="text-white text-sm font-sora-semibold">
                {profile?.username || "You"}
              </Text>
              <Text className="text-zinc-500 text-[10px] font-sora">
                {profile?.spiritStage || "Kindled Flame"}
              </Text>
            </View>
          </View>

          {/* Thought Input */}
          <View className="px-5 mb-4">
            <TextInput
              value={thought}
              onChangeText={setThought}
              placeholder={
                selectedVerse
                  ? "What does this verse mean to you?"
                  : "Share a thought, prayer, or testimony..."
              }
              placeholderTextColor="#555"
              multiline
              className="text-white/90 font-sora text-[15px] leading-7 min-h-[120px]"
              textAlignVertical="top"
            />
          </View>

          {/* Bible Verse Section */}
          <View className="px-5">
            {selectedVerse ? (
              <View className="bg-card-2 rounded-[24px] overflow-hidden">
                {/* Verse Header */}
                <View className="px-5 pt-5 pb-3">
                  <View className="flex-row items-center mb-2.5">
                    <View className="w-6 h-6 rounded-full bg-amber-500/20 items-center justify-center mr-2">
                      <BookOpen size={12} color="#fbbf24" />
                    </View>
                    <Text className="text-amber-400/80 text-[11px] font-sora-semibold uppercase tracking-widest">
                      Scripture
                    </Text>
                  </View>
                  <Text className="text-white text-lg font-serif mb-2">
                    {selectedVerse.reference}
                  </Text>
                  <Text className="text-zinc-300 text-[14px] leading-7 font-serif">
                    "{selectedVerse.text}"
                  </Text>
                </View>

                {/* Actions bar */}
                <View className="flex-row border-t border-white/5">
                  <Pressable
                    onPress={() => setShowBibleModal(true)}
                    className="flex-1 flex-row items-center justify-center py-3 border-r border-white/5"
                  >
                    <BookOpen size={13} color="#888" />
                    <Text className="text-zinc-500 text-[10px] font-sora-medium ml-1.5">
                      Read
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedVerse(null)}
                    className="flex-1 flex-row items-center justify-center py-3"
                  >
                    <Text className="text-red-400/60 text-[10px] font-sora-medium">
                      Remove
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Add Verse Button */
              <Pressable
                onPress={() => setShowBibleModal(true)}
                className="bg-card-1 rounded-[24px] px-5 py-5 flex-row items-center"
              >
                <View className="w-9 h-9 rounded-full bg-amber-500/10 items-center justify-center mr-3">
                  <BookOpen size={16} color="#fbbf24" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-sora-semibold">
                    Add a Bible verse
                  </Text>
                  <Text className="text-zinc-500 text-[10px] font-sora mt-0.5">
                    Include scripture in your post
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Post extras */}
          <View className="px-5 mt-6">
            <View className="bg-card-1 rounded-[20px] px-5 py-4 flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center mr-3">
                <Hash size={14} color="#666" />
              </View>
              <Text className="text-zinc-500 text-sm font-sora-medium flex-1">
                Add topics (coming soon)
              </Text>
            </View>

            <View className="bg-card-1 rounded-[20px] px-5 py-4 flex-row items-center mt-2 opacity-50">
              <View className="w-8 h-8 rounded-full bg-white/5 items-center justify-center mr-3">
                <Image size={14} color="#666" />
              </View>
              <Text className="text-zinc-500 text-sm font-sora-medium flex-1">
                Add image (coming soon)
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Bible Modal for selecting/reading verses */}
      <BibleModal
        visible={showBibleModal}
        onClose={() => setShowBibleModal(false)}
        onSelect={handleBibleSelect}
        selectionMode
        initialBook={selectedVerse?.verses?.[0]?.book}
        initialChapter={selectedVerse?.verses?.[0]?.chapter}
        initialVerse={selectedVerse?.verses?.[0]?.verse}
      />
    </KeyboardAvoidingView>
  );
}