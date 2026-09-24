import { router, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

import Avatar from "@/components/Avatar";
import BibleModal, { BibleSelection } from "@/components/BibleModal";
import VerseText from "@/components/bible/VerseText";
import { useToast } from "@/components/Toast";
import { useApp } from "@/context/app-context";
import { createPostSmart } from "@/libs/firebase/posts";
import { getAllUsersSortedByLastUpload } from "@/libs/firebase/users";
import {
  AtSign,
  BookOpen,
  ChevronLeft,
  Hash,
  Image,
  X,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Curated topics offered as #hashtag suggestions while typing. */
const TOPIC_SUGGESTIONS = [
  "faith",
  "growth",
  "love",
  "purpose",
  "testimony",
  "bible",
  "prayer",
  "community",
  "hope",
  "gratitude",
];

export default function ShareThought() {
  const { verses, mention, mentionUid, mentionUsername } =
    useLocalSearchParams<{
      verses?: string;
      mention?: string;
      mentionUid?: string;
      mentionUsername?: string;
    }>();
  const { top } = useSafeAreaInsets();

  // Parse initial verses if passed from bible page
  const initialVerses = useMemo(() => {
    try {
      return JSON.parse(verses as string);
    } catch {
      return [];
    }
  }, [verses]);

  const mentionExtracted = useMemo(() => {
    try {
      return JSON.parse(mention as string);
    } catch {
      return {};
    }
  }, [mention]);

  // The user we're replying to (passed from a status note / post). Prefer the
  // primitive params (reliable on native); fall back to the legacy JSON blob.
  const [mentionTarget, setMentionTarget] = useState<{
    uid?: string;
    username?: string;
  } | null>(() => {
    if (mentionUid || mentionUsername) {
      return { uid: mentionUid, username: mentionUsername };
    }
    return mentionExtracted?.user || null;
  });

  // Anything typed in the composer. If we started from a mention, pre-fill the
  // @username so the reply is naturally tied to the recipient.
  const [thought, setThought] = useState(
    mentionTarget?.username ? `@${mentionTarget.username} ` : "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [showBibleModal, setShowBibleModal] = useState(false);

  // Ref so the "Add topics" shortcut can focus the composer.
  const inputRef = useRef<TextInput>(null);

  // Pull #hashtags (e.g. "#growth") out of the typed body. Tags are stored
  // lowercased and without the "#" prefix, matching the feed's tag chips.
  const extractedTags = useMemo(() => {
    const matches = thought.match(/#[a-zA-Z0-9_]+/g) || [];
    return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
  }, [thought]);

  // Users available for @mention suggestions (loaded once).
  const [mentionUsers, setMentionUsers] = useState<
    { uid: string; username: string; avatar: number }[]
  >([]);

  useEffect(() => {
    let active = true;
    getAllUsersSortedByLastUpload()
      .then((list) => {
        if (!active) return;
        setMentionUsers(
          list.map((u) => ({
            uid: u.uid,
            username: u.username,
            avatar: u.avatar ?? 0,
          })),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

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

  const { user, isOnline } = useApp();
  const { showToast } = useToast();

  const canPost = thought.trim().length > 0 || !!selectedVerse;

  // Detect a trailing "@query" or "#query" the user is actively typing so we
  // can surface a suggestion list right above/after the composer.
  const activeToken = useMemo(() => {
    const m = thought.match(/(?:^|\s)([@#])([a-zA-Z0-9_]*)$/);
    if (!m || m[2].length < 1) return null;
    return { trigger: m[1], query: m[2].toLowerCase() };
  }, [thought]);

  const mentionSuggestions = useMemo(() => {
    if (activeToken?.trigger !== "@") return [];
    const q = activeToken.query;
    return mentionUsers
      .filter((u) => u.uid !== user?.uid)
      .filter(
        (u) =>
          u.username?.toLowerCase().startsWith(q) ||
          u.username?.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [activeToken, mentionUsers, user?.uid]);

  const hashtagSuggestions = useMemo(() => {
    if (activeToken?.trigger !== "#") return [];
    const q = activeToken.query;
    return TOPIC_SUGGESTIONS.filter((t) => t.includes(q)).slice(0, 6);
  }, [activeToken]);

  // Apply an @mention or #tag suggestion, replacing the trailing partial token.
  const applySuggestion = useCallback((trigger: string, value: string) => {
    setThought((prev) =>
      prev.replace(
        /([ \n\t]*)[@#][a-zA-Z0-9_]*$/,
        (_, ws) => `${ws}${trigger}${value} `,
      ),
    );
  }, []);

  // All @handles in the body, resolved against known users so the post persists
  // structured mentions — covering both the prefilled reply and typed mentions.
  const mentionList = useMemo(() => {
    const handles = thought.match(/@([a-zA-Z0-9_]+)/g) || [];
    const seen = new Set<string>();
    const out: { uid: string; username: string }[] = [];
    for (const h of handles) {
      const username = h.slice(1);
      const key = username.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      const known = mentionUsers.find(
        (u) => u.username?.toLowerCase() === key,
      );
      out.push({ uid: known?.uid || "", username });
    }
    return out;
  }, [thought, mentionUsers]);

  const handleBibleSelect = useCallback((selection: BibleSelection) => {
    setSelectedVerse(selection);
  }, []);

  // Detach the reply. Also strips the prefilled "@username" from the body.
  const removeMention = useCallback(() => {
    const handle = mentionTarget?.username;
    if (handle) {
      setThought((prev) =>
        prev.replace(new RegExp(`^@${handle.trim()}\\s*`), ""),
      );
    }
    setMentionTarget(null);
  }, [mentionTarget]);

  // Shortcut for the "Add topics" row — drops a "#" in the composer and focuses
  // it so the user can start typing their hashtag.
  const insertHashtag = useCallback(() => {
    setThought((prev) => {
      const trimmed = prev.trimEnd();
      const startsHash = trimmed.endsWith("#");
      if (startsHash) return trimmed;
      return trimmed ? `${trimmed} #` : "#";
    });
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleShare = async () => {
    if (!canPost || submitting) return;

    try {
      setSubmitting(true);
      const uid = user?.uid;
      if (!uid) {
        router.replace("/(auth)/signin");
        return;
      }

      const res = await createPostSmart(
        {
          uid,
          thought: thought.trim() || "Shared a scripture",
          verseText: selectedVerse?.text || "",
          verseReference: selectedVerse?.reference || "",
          tags: [
            "faith",
            ...(selectedVerse ? ["bible"] : []),
            ...extractedTags,
          ],
          mentions: mentionList,
        },
        isOnline,
      );

      showToast(
        res.offline ? "Saved — will post when online" : "Post shared!",
        "success",
      );
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
        <View className="flex-row items-center justify-between px-5 pb-4 border-b border-line">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-card-2 items-center justify-center"
          >
            <ChevronLeft color="white" size={17} />
          </Pressable>
          <Text className="text-primary text-base font-sora-semibold">
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
                className={`text-sm font-sora-medium ${
                  canPost ? "text-black" : "text-tertiary"
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
            <Avatar index={user?.avatar} diameter={36} />
            <View className="ml-3">
              <Text className="text-primary text-sm font-sora-semibold">
                {user?.username || "You"}
              </Text>
              <Text className="text-tertiary text-[10px] font-sora">
                {user?.spiritStage || "Kindled Flame"}
              </Text>
            </View>
          </View>

          {/* Thought Input */}
          <View className="px-5 mb-4">
            {mentionTarget?.username && (
              <View className="flex-row items-center bg-card-1 rounded-full pl-3 pr-2 py-1.5 mb-2 self-start">
                <AtSign size={13} color="#fbbf24" />
                <Text className="text-primary text-xs font-sora-medium ml-1.5">
                  Replying to @{mentionTarget.username}
                </Text>
                <Pressable
                  onPress={removeMention}
                  hitSlop={8}
                  className="ml-2 w-5 h-5 rounded-full bg-overlay items-center justify-center"
                >
                  <X size={11} color="#888" />
                </Pressable>
              </View>
            )}
            <TextInput
              ref={inputRef}
              value={thought}
              onChangeText={setThought}
              placeholder={
                selectedVerse
                  ? "What does this verse mean to you?"
                  : "Share a thought, prayer, or testimony..."
              }
              placeholderTextColor="#555"
              multiline
              className="text-primary/90 font-sora text-[15px] leading-7 min-h-30"
              textAlignVertical="top"
            />

            {/* @mention suggestions */}
            {activeToken?.trigger === "@" && mentionSuggestions.length > 0 && (
              <View className="mt-2 bg-card-1 rounded-2xl overflow-hidden border border-line">
                <View className="px-4 py-2 border-b border-line">
                  <Text className="text-tertiary text-[10px] font-sora-medium uppercase tracking-widest">
                    People
                  </Text>
                </View>
                {mentionSuggestions.map((u, i) => (
                  <Pressable
                    key={u.uid || u.username}
                    onPress={() => applySuggestion("@", u.username)}
                    className={`flex-row items-center px-4 py-2.5 active:opacity-60 ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <Avatar index={u.avatar} diameter={24} />
                    <Text className="text-primary text-xs font-sora-semibold ml-2.5 flex-1">
                      {u.username}
                    </Text>
                    <Text className="text-tertiary text-[10px] font-sora">
                      @{u.username.toLowerCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* #hashtag suggestions */}
            {activeToken?.trigger === "#" && hashtagSuggestions.length > 0 && (
              <View className="mt-2 bg-card-1 rounded-2xl overflow-hidden border border-line">
                <View className="px-4 py-2 border-b border-line">
                  <Text className="text-tertiary text-[10px] font-sora-medium uppercase tracking-widest">
                    Topics
                  </Text>
                </View>
                {hashtagSuggestions.map((t, i) => (
                  <Pressable
                    key={t}
                    onPress={() => applySuggestion("#", t)}
                    className={`flex-row items-center px-4 py-3 active:opacity-60 ${
                      i > 0 ? "border-t border-line" : ""
                    }`}
                  >
                    <Hash size={13} color="#fbbf24" />
                    <Text className="text-primary text-xs font-sora-medium ml-2.5">
                      #{t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Bible Verse Section */}
          <View className="px-5">
            {selectedVerse ? (
              <View className="bg-card-2 rounded-3xl overflow-hidden">
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
                  <Text className="text-primary text-lg font-serif mb-2">
                    {selectedVerse.reference}
                  </Text>
                  <VerseText
                    text={selectedVerse.text}
                    bodyClassName="text-primary/80 text-[14px] leading-7 font-serif"
                    noteClassName="text-tertiary/60 text-[11px] leading-4 font-serif-italic mt-1.5"
                  />
                </View>

                {/* Actions bar */}
                <View className="flex-row border-t border-line">
                  <Pressable
                    onPress={() => setShowBibleModal(true)}
                    className="flex-1 flex-row items-center justify-center py-3 border-r border-line"
                  >
                    <BookOpen size={13} color="#888" />
                    <Text className="text-tertiary text-[10px] font-sora-medium ml-1.5">
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
                className="bg-card-1 rounded-3xl px-5 py-5 flex-row items-center"
              >
                <View className="w-9 h-9 rounded-full bg-amber-500/10 items-center justify-center mr-3">
                  <BookOpen size={16} color="#fbbf24" />
                </View>
                <View className="flex-1">
                  <Text className="text-primary text-sm font-sora-semibold">
                    Add a Bible verse
                  </Text>
                  <Text className="text-tertiary text-[10px] font-sora mt-0.5">
                    Include scripture in your post
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          {/* Post extras */}
          <View className="px-5 mt-6">
            <Pressable
              onPress={insertHashtag}
              className="bg-card-1 rounded-[20px] px-5 py-4 flex-row items-center active:opacity-70"
            >
              <View className="w-8 h-8 rounded-full bg-overlay items-center justify-center mr-3">
                <Hash size={14} color="#666" />
              </View>
              <View className="flex-1">
                <Text className="text-primary text-sm font-sora-medium">
                  Add topics
                </Text>
                <Text className="text-quaternary text-[10px] font-sora mt-0.5">
                  Type #topic to add hashtags
                </Text>
              </View>
            </Pressable>

            <View className="bg-card-1 rounded-[20px] px-5 py-4 flex-row items-center mt-2 opacity-50">
              <View className="w-8 h-8 rounded-full bg-overlay items-center justify-center mr-3">
                <Image size={14} color="#666" />
              </View>
              <Text className="text-tertiary text-sm font-sora-medium flex-1">
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
