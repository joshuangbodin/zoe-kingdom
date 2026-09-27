import { doc, onSnapshot } from "firebase/firestore";
import {
  ChevronLeft,
  MessageCircle,
  UserCheck,
  UserPlus,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Avatar from "@/components/Avatar";
import VerseText from "@/components/bible/VerseText";
import { useToast } from "@/components/Toast";
import { useApp } from "@/context/app-context";
import { useTheme } from "@/context/theme-context";
import { getLevelFromXP } from "@/constants/levels";
import { db } from "@/libs/firebase";
import { getUserPosts } from "@/libs/firebase/posts";
import {
  followUserSmart,
  subscribeToFollow,
  unfollowUserSmart,
  UserProfile,
} from "@/libs/firebase/users";

export default function UserProfilePage() {
  const params = useLocalSearchParams<{ uid?: string }>();
  const uid = params.uid || "";

  const { top } = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { user: currentUser, isOnline } = useApp();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [following, setFollowing] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const isOwn = !!currentUser && currentUser.uid === uid;

  // Live profile (keeps follower count / level fresh).
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(doc(db, "users", uid), (snap) => {
      if (snap.exists()) setProfile(snap.data() as UserProfile);
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  // Live follow state.
  useEffect(() => {
    if (!uid || !currentUser || currentUser.uid === uid) return;
    const unsub = subscribeToFollow(currentUser.uid, uid, setFollowing);
    return () => unsub();
  }, [uid, currentUser, currentUser?.uid]);

  // Load their posts.
  useEffect(() => {
    if (!uid) return;
    getUserPosts(uid)
      .then(setPosts)
      .catch(() => {});
  }, [uid]);

  const levelData = useMemo(() => getLevelFromXP(profile?.xp ?? 0), [profile?.xp]);

  const handleFollow = async () => {
    const me = currentUser;
    if (!me) {
      router.push("/(auth)/signin");
      return;
    }
    if (toggling) return;
    setToggling(true);
    setFollowing((prev) => !prev);
    try {
      if (following) {
        await unfollowUserSmart(me.uid, uid, isOnline);
      } else {
        await followUserSmart(me.uid, uid, isOnline);
      }
    } catch {
      setFollowing((prev) => !prev);
      showToast("Could not update follow", "error");
    } finally {
      setToggling(false);
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
        <Text className="text-primary text-sm font-sora-semibold">Profile</Text>
        <View className="w-9 h-9" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={isDark ? "#fff" : "#0c0c0c"} />
        </View>
      ) : !profile ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-tertiary text-sm font-sora">
            This profile doesn&apos;t exist.
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }: { item: any }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(network)/post",
                  params: {
                    id: item.id,
                    uid: item.uid,
                    thought: item.thought || "",
                    verseText: item.verseText || "",
                    verseReference: item.verseReference || "",
                    likesCount: item.likesCount?.toString() || "0",
                  },
                } as never)
              }
              className="bg-card-1 rounded-3xl p-4 mb-3"
            >
              {item.thought ? (
                <Text className="text-primary/85 text-xs leading-6 font-sora mb-3">
                  {item.thought}
                </Text>
              ) : null}

              {!!item.verseReference && (
                <View className="bg-black/80 rounded-2xl px-4 py-3">
                  <Text className="text-white text-xs font-sora mb-1.5">
                    {item.verseReference}
                  </Text>
                  {item.verseText ? (
                    <VerseText
                      text={item.verseText}
                      bodyClassName="text-white text-xs leading-5 font-serif"
                      noteClassName="text-white/55 text-[10px] leading-4 font-serif-italic mt-1"
                    />
                  ) : null}
                </View>
              )}

              <View className="flex-row items-center mt-3">
                <MessageCircle size={14} color={isDark ? "#fff" : "#0c0c0c"} />
                <Text className="text-tertiary text-[11px] font-sora ml-1.5">
                  {(item.commentsCount ?? 0) > 0
                    ? item.commentsCount
                    : "Comment"}
                </Text>
              </View>
            </Pressable>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
          ListHeaderComponent={
            <View className="items-center mb-6">
              <Avatar index={profile?.avatar ?? 0} diameter={76} />
              <Text className="text-primary text-lg font-sora-bold mt-3">
                {profile?.username || "user"}
              </Text>
              {profile?.statusNote ? (
                <Text className="text-tertiary text-xs font-sora text-center mt-1 px-6 leading-5">
                  “{profile.statusNote}”
                </Text>
              ) : null}

              {/* <View className="flex-row gap-3 mt-4">
                <View className="bg-card-1 rounded-2xl px-5 py-3 items-center">
                  <Text className="text-primary text-lg font-sora-bold">
                    {profile?.followersCount ?? 0}
                  </Text>
                  <Text className="text-tertiary text-[10px] font-sora-medium">
                    Followers
                  </Text>
                </View>
                <View className="bg-card-1 rounded-2xl px-5 py-3 items-center">
                  <Text className="text-primary text-lg font-sora-bold">
                    {profile?.followingCount ?? 0}
                  </Text>
                  <Text className="text-tertiary text-[10px] font-sora-medium">
                    Following
                  </Text>
                </View>
                <View className="bg-card-1 rounded-2xl px-5 py-3 items-center">
                  <Text className="text-primary text-lg font-sora-bold">
                    {profile?.xp ?? 0}
                  </Text>
                  <Text className="text-tertiary text-[10px] font-sora-medium">
                    XP · Lv {levelData}
                  </Text>
                </View>
              </View> */}
{/* {!isOwn ? (
                <Pressable
                  onPress={handleFollow}
                  disabled={toggling}
                  className="flex-row items-center rounded-2xl px-8 py-3 mt-5"
                  style={{ backgroundColor: following ? "#1c1a1a" : "#ffffff" }}
                >
                  {following ? (
                    <UserCheck size={16} color={isDark ? "#fff" : "#0c0c0c"} />
                  ) : (
                    <UserPlus size={16} color="#0c0c0c" />
                  )}
                  <Text
                    className="ml-2 text-[13px] font-sora-semibold"
                    style={{
                      color: following
                        ? isDark
                          ? "#fff"
                          : "#0c0c0c"
                        : "#0c0c0c",
                    }}
                  >
                    {toggling ? "…" : following ? "Following" : "Follow"}
                  </Text>
                </Pressable>
              ) : null} */}

              <Text className="text-quaternary text-[10px] font-sora-semibold uppercase tracking-wider mt-6 mb-2 self-start">
                Their posts
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-tertiary text-xs font-sora">
                No posts yet.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}