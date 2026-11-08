
import { auth } from "@/libs/firebase";

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
  Alert,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import Avatar from "@/components/Avatar";
import VerseText from "@/components/bible/VerseText";
import { useToast } from "@/components/Toast";

import { useApp } from "@/context/app-context";
import { useTheme } from "@/context/theme-context";

import {
  createCommentSmart,
  deletePostSmart,
  hasUserLikedPost,
  likePostSmart,
  subscribeToComments,
  updatePostSmart,
} from "@/libs/firebase/posts";

import { getUserProfile, UserProfile } from "@/libs/firebase/users";

import {
  BookOpen,
  ChevronLeft,
  Heart,
  MoreHorizontal,
  Send,
  X,
} from "lucide-react-native";

export default function PostDetail() {
  const {
    id,
    uid,
    thought,
    verseText,
    verseReference,
    likesCount,
  } = useLocalSearchParams<{
    id: string;
    uid: string;
    thought: string;
    verseText: string;
    verseReference: string;
    likesCount: string;
  }>();

  const { top, bottom } = useSafeAreaInsets();

  const { isOnline, user: currentUser } = useApp();
  const { isDark } = useTheme();
  const { showToast } = useToast();

  const paddingBottom = bottom + 12;

  // Comment bottom sheet
  const commentSheetRef = useRef<BottomSheetModal>(null);

  const commentSnapPoints = useMemo(
    () => ["35%", "40%"],
    [],
  );

  // Post and user state
  const [author, setAuthor] = useState<UserProfile | null>(null);
  const [currentProfile, setCurrentProfile] =
    useState<UserProfile | null>(null);

  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(
    parseInt(likesCount || "0", 10) || 0,
  );
  const [likeProcessing, setLikeProcessing] = useState(false);

  // Edit post
  const [editVisible, setEditVisible] = useState(false);
  const [editText, setEditText] = useState(thought || "");

  // Open and close comment sheet
  const openCommentSheet = useCallback(() => {
    commentSheetRef.current?.present();
  }, []);

  const closeCommentSheet = useCallback(() => {
    commentSheetRef.current?.dismiss();
  }, []);

  // Load author
  useEffect(() => {
    if (!uid) return;

    getUserProfile(uid).then(setAuthor).catch(console.error);
  }, [uid]);

  // Load current user profile
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    getUserProfile(user.uid)
      .then(setCurrentProfile)
      .catch(console.error);
  }, []);

  // Check if post is liked
  useEffect(() => {
    const user = auth.currentUser;

    if (!user || !id) return;

    let mounted = true;

    hasUserLikedPost(id, user.uid)
      .then((liked) => {
        if (mounted) {
          setIsLiked(liked);
        }
      })
      .catch((err) => {
        console.error("Error checking like:", err);
      });

    return () => {
      mounted = false;
    };
  }, [id]);

  // Subscribe to comments
  useEffect(() => {
    if (!id) return;

    const unsub = subscribeToComments(id, setComments);

    return () => unsub();
  }, [id]);

  // Like post
  const handleLike = useCallback(async () => {
    const user = auth.currentUser;
    const userId = currentUser?.uid || user?.uid;

    if (!userId || !id || likeProcessing) return;

    const previousLiked = isLiked;
    const previousCount = likeCount;

    const nextLiked = !previousLiked;
    const nextCount = Math.max(
      0,
      previousCount + (nextLiked ? 1 : -1),
    );

    setIsLiked(nextLiked);
    setLikeCount(nextCount);
    setLikeProcessing(true);

    try {
      await likePostSmart(id, userId, isOnline);

      showToast(
        nextLiked
          ? isOnline
            ? "Post liked!"
            : "Like saved — will sync"
          : isOnline
            ? "Like removed"
            : "Unlike saved — will sync",
        "success",
      );
    } catch (error) {
      console.error("Error updating like:", error);

      setIsLiked(previousLiked);
      setLikeCount(previousCount);

      showToast("Could not update like", "error");
    } finally {
      setLikeProcessing(false);
    }
  }, [
    id,
    currentUser?.uid,
    isLiked,
    likeCount,
    likeProcessing,
    isOnline,
    showToast,
  ]);

  // Submit comment
  const handleComment = useCallback(async () => {
    if (!commentText.trim() || submitting || !id) return;

    const user = auth.currentUser;
    const userId = currentUser?.uid || user?.uid;

    if (!userId) {
      closeCommentSheet();
      router.push("/(auth)/signin");
      return;
    }

    try {
      setSubmitting(true);

      const profile =
        currentProfile || (await getUserProfile(userId));

      await createCommentSmart(
        id,
        {
          uid: userId,
          username: profile?.username || "anonymous",
          avatar: profile?.avatar ?? 0,
          text: commentText.trim(),
        },
        isOnline,
      );

      setCommentText("");
      closeCommentSheet();

      showToast(
        isOnline
          ? "Comment added!"
          : "Comment saved — will sync",
        "success",
      );
    } catch (err) {
      console.error("Error commenting:", err);
      showToast("Failed to comment", "error");
    } finally {
      setSubmitting(false);
    }
  }, [
    commentText,
    submitting,
    id,
    currentProfile,
    currentUser?.uid,
    isOnline,
    showToast,
    closeCommentSheet,
  ]);

  // Open Bible verse
  const openBibleVerse = useCallback((reference: string) => {
    if (!reference) return;

    const match = reference.match(/^(.+?)\s(\d+):(\d+)/);

    if (match) {
      router.push({
        pathname: "/(tabs)/bible",
        params: {
          book: match[1],
          chapter: match[2],
          verse: match[3],
        },
      });
    }
  }, []);

  const isOwner = !!currentUser && currentUser.uid === uid;

  // Post actions
  const openPostActions = useCallback(() => {
    if (!isOwner) return;

    Alert.alert("Your Post", "What would you like to do?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Edit",
        onPress: () => {
          setEditText(typeof thought === "string" ? thought : "");
          setEditVisible(true);
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete Post",
            "This cannot be undone.",
            [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  if (!id) return;

                  try {
                    await deletePostSmart(
                      id,
                      uid as string,
                      isOnline,
                    );

                    showToast("Post deleted", "success");
                    router.back();
                  } catch {
                    showToast(
                      "Could not delete post",
                      "error",
                    );
                  }
                },
              },
            ],
          );
        },
      },
    ]);
  }, [isOwner, id, uid, thought, isOnline, showToast]);

  // Save edited post
  const saveEdit = useCallback(async () => {
    if (!id || !editText.trim()) return;

    try {
      await updatePostSmart(
        id,
        uid as string,
        editText.trim(),
        isOnline,
      );

      showToast("Post updated", "success");
      setEditVisible(false);
    } catch {
      showToast("Could not update post", "error");
    }
  }, [id, uid, editText, isOnline, showToast]);

  // Render individual comment
  const renderComment = ({ item }: any) => (
    <View className="flex-row items-start mb-5">
      <Avatar index={item.avatar} diameter={28} />

      <View className="ml-3 flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-primary text-xs font-sora-semibold">
            {item.username}
          </Text>

          <Text className="text-quaternary text-[10px] font-sora ml-2">
            {item.createdAt?.toDate
              ? new Date(
                  item.createdAt.toDate(),
                ).toLocaleDateString()
              : ""}
          </Text>
        </View>

        <Text className="text-primary/80 text-sm font-sora leading-5">
          {item.text}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-bg">
      {/* HEADER */}
      <View
        style={{ paddingTop: top + 10 }}
        className="flex-1"
      >
        <View className="flex-row items-center px-5 pb-3 border-b border-line">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-xl bg-card-2 items-center justify-center mr-3"
          >
            <ChevronLeft
              color={isDark ? "#fff" : "#000"}
              size={17}
            />
          </Pressable>

          <Text className="text-primary text-base font-sora-semibold">
            Post
          </Text>
        </View>

        {/* POST AND COMMENTS */}
        <View className="flex-1">
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 30,
            }}
            ListHeaderComponent={
              <>
                {/* POST CONTENT */}
                <View className="mb-6 bg-card-1 p-4 rounded-xl">
                  {/* AUTHOR */}
                  <View className="flex-row items-center mb-3">
                    <Avatar
                      index={author?.avatar}
                      diameter={32}
                    />

                    <View className="ml-2.5 flex-1">
                      <Text className="text-primary text-sm font-sora-semibold">
                        {author?.username || "Loading..."}
                      </Text>

                      <Text className="text-tertiary text-[10px] font-sora">
                        @{author?.username?.toLowerCase() || "..."}
                      </Text>
                    </View>

                    {isOwner && (
                      <Pressable
                        onPress={openPostActions}
                        className="p-1.5"
                      >
                        <MoreHorizontal
                          size={16}
                          color="#666"
                        />
                      </Pressable>
                    )}
                  </View>

                  {/* THOUGHT */}
                  {thought && (
                    <Text className="text-primary/85 text-sm leading-6 font-sora mb-3">
                      {thought}
                    </Text>
                  )}

                  {/* VERSE CARD */}
                  {!!verseReference && (
                    <Pressable
                      onPress={() =>
                        openBibleVerse(verseReference)
                      }
                      className="bg-card-2 rounded-xl overflow-hidden active:opacity-80 mb-3"
                    >
                      <View className="p-4">
                        <View className="flex-row items-center mb-2">
                          <BookOpen
                            size={12}
                            color="#fbbf24"
                          />

                          <Text className="text-amber-400/70 text-[10px] font-sora-medium ml-1.5">
                            Scripture
                          </Text>
                        </View>

                        <Text className="text-primary text-sm font-serif mb-1.5">
                          {verseReference}
                        </Text>

                        <VerseText
                          text={verseText}
                          bodyClassName="text-secondary text-[12px] leading-6 font-serif"
                          noteClassName="text-secondary/60 text-[11px] leading-4 font-serif-italic mt-1"
                        />
                      </View>
                    </Pressable>
                  )}

                  {/* LIKE */}
                  <View className="flex-row items-center border-t border-line pt-3">
                    <Pressable
                      onPress={handleLike}
                      disabled={likeProcessing}
                      className="flex-row items-center active:opacity-70"
                    >
                      <Heart
                        color={isLiked ? "#ef4444" : "#666"}
                        size={17}
                        fill={
                          isLiked ? "#ef4444" : "transparent"
                        }
                      />

                      {likeCount > 0 && (
                        <Text className="text-tertiary text-xs ml-1.5 font-sora">
                          {likeCount}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* COMMENTS HEADER */}
                <Text className="text-primary text-sm font-sora-semibold mb-4">
                  Comments ({comments.length})
                </Text>
              </>
            }
            ListEmptyComponent={
              <View className="items-center pt-8">
                <Text className="text-tertiary text-xs font-sora text-center">
                  No comments yet. Be the first to share your thoughts.
                </Text>
              </View>
            }
          />
        </View>

        {/* COMMENT TRIGGER */}
        <View style={{ paddingBottom }} className="px-5 pb-5 pt-3 border-t border-line bg-bg">
          <Pressable
            onPress={openCommentSheet}
            className="flex-row items-center bg-card-1 rounded-xl px-4 py-3 active:opacity-70"
          >
            <Text className="flex-1 text-quaternary text-xs font-sora">
              Write a comment...
            </Text>

            <Send size={15} color="#888" />
          </Pressable>
        </View>
      </View>

      {/* COMMENT BOTTOM SHEET */}
      <BottomSheetModal
        ref={commentSheetRef}
        index={0}
        snapPoints={commentSnapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustPan"
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.6}
            pressBehavior="close"
          />
        )}
        backgroundStyle={{
          backgroundColor: isDark ? "#1c1a1a" : " #FAFAF7",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? "#444" : "#d4c8b8",
          width: 42,
          height: 4,
        }}
      >
        <BottomSheetView
          className="flex-1 px-5"
          style={{
            paddingBottom: bottom + 12,
          }}
        >
          {/* SHEET HEADER */}
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-primary text-base font-sora-semibold">
                Add Comment
              </Text>

              <Text className="text-quaternary text-[10px] font-sora mt-1">
                Share your thoughts with the community
              </Text>
            </View>

            <Pressable
              onPress={closeCommentSheet}
              hitSlop={10}
              className="w-9 h-9 rounded-full bg-card-1 items-center justify-center"
            >
              <X
                size={17}
                color={isDark ? "#aaa" : "#777"}
              />
            </Pressable>
          </View>

          {/* COMMENT INPUT */}
          <View
            className="flex-row bg-card-1 rounded-2xl px-4 py-3"
            style={{
              // backgroundColor: isDark ? "#222020" : "#f1eadf",
              minHeight: 120,
            }}
          >
            <BottomSheetTextInput
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Share your thoughts..."
              placeholderTextColor={isDark ? "#666" : "#999"}
              multiline
              maxLength={1000}
              textAlignVertical="top"
              style={{
                flex: 1,
                color: isDark ? "#fff" : "#171717",
                fontSize: 12,
                fontFamily: "sora",
                maxHeight: 110,
                paddingTop: 4,
                paddingBottom: 4,
                // backgroundColor:"red"
              }}
            />

            <Pressable
              onPress={handleComment}
              disabled={submitting || !commentText.trim()}
              hitSlop={8}
              className="ml-3 w-9 h-9 rounded-full items-center justify-center"
              style={{
                backgroundColor: commentText.trim()
                  ? "#fbbf24"
                  : isDark
                    ? "#333"
                    : "#ded8ce",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator
                  size="small"
                  color="#171717"
                />
              ) : (
                <Send
                  size={16}
                  color={
                    commentText.trim() ? "#171717" : "#888"
                  }
                />
              )}
            </Pressable>
          </View>

          {/* SHEET FOOTER */}
          <View className="flex-row items-center justify-center mt-4">
            <Text className="text-quaternary text-[10px] font-sora">
              Your comment will appear below the post.
            </Text>
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* EDIT POST MODAL */}
      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setEditVisible(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card-2 rounded-t-4xl px-5 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-primary text-base font-sora-semibold">
                Edit Post
              </Text>

              <Pressable
                onPress={() => setEditVisible(false)}
                className="p-1.5"
              >
                <X size={18} color="#888" />
              </Pressable>
            </View>

            <TextInput
              value={editText}
              onChangeText={setEditText}
              multiline
              placeholder="Edit your post..."
              placeholderTextColor="#555"
              className="bg-card-1 rounded-xl px-4 py-3.5 text-primary/90 text-sm font-sora min-h-30"
              style={{
                color: isDark ? "#fff" : "#171717",
                textAlignVertical: "top",
              }}
            />

            <Pressable
              onPress={saveEdit}
              disabled={!editText.trim()}
              className="bg-white rounded-xl py-3.5 items-center mt-4"
              style={{
                opacity: editText.trim() ? 1 : 0.5,
              }}
            >
              <Text className="text-black text-sm font-sora-semibold">
                Save Changes
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
