import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Heart,
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react-native";

import { auth } from "@/libs/firebase";

import Avatar from "@/components/Avatar";
import { createPost, likePost, subscribeToFeed } from "@/libs/firebase/posts";

const TAGS = ["All", "#faith", "#growth", "#love", "#purpose", "#testimony"];

export default function Feed() {
  const { top } = useSafeAreaInsets();

  const [posts, setPosts] = useState<any[]>([]);

  const [userStories , setUserStories]= useState([])

  const [content, setContent] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [selectedTag, setSelectedTag] = useState("All");

  /* -------------------------------------------------------------------------- */
  /*                               REALTIME FEED                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const unsubscribe = subscribeToFeed(setPosts);

    return () => unsubscribe();
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                               CREATE POST                                  */
  /* -------------------------------------------------------------------------- */

  const handleCreatePost = useCallback(async () => {
    if (!content.trim() || submitting) return;

    try {
      setSubmitting(true);

      const user = auth.currentUser;

      if (!user) return;

      await createPost({
        uid: user.uid,

        username: "Joshua",

        avatar: 0,

        spiritStage: "Kindled Flame",

        thought: content.trim(),

        tags: ["faith"],
      });

      setContent("");
    } catch (error) {
      console.log(error);
    } finally {
      setSubmitting(false);
    }
  }, [content, submitting]);

  /* -------------------------------------------------------------------------- */
  /*                                 FILTERED                                   */
  /* -------------------------------------------------------------------------- */

  const filteredPosts = useMemo(() => {
    if (selectedTag === "All") {
      return posts;
    }

    return posts.filter((post) =>
      post.tags?.includes(selectedTag.replace("#", "")),
    );
  }, [posts, selectedTag]);

  /* -------------------------------------------------------------------------- */
  /*                                STORIES UI                                  */
  /* -------------------------------------------------------------------------- */

  const renderStory = ({ item, index }: any) => {
    return (
      <View className="mr-5 items-center">
        <View>
          {/* VERSE BUBBLE */}
          {index % 2 === 0 && (
            <View className="absolute -top-9 left-1 z-10 bg-card-2 px-4 py-2 rounded-2xl">
              <Text className="text-white text-xs font-sora-medium">
                Heb 11:1
              </Text>

              <View className="absolute bottom-[-6px] left-5 w-3 h-3 bg-card-2 rotate-45" />
            </View>
          )}

          {/* AVATAR */}
          <View
            className="w-24 h-24 rounded-full items-center justify-center"
            style={{
              backgroundColor: [
                "#FACC15",
                "#FB923C",
                "#06B6D4",
                "#F43F5E",
                "#14B8A6",
              ][index % 5],
            }}
          >
            <Avatar/>
          </View>
        </View>

        <Text className="text-white mt-3 text-sm font-sora-medium">
          @{item.username}
        </Text>
      </View>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                                POST CARD                                   */
  /* -------------------------------------------------------------------------- */

  const renderPost = ({ item }: any) => {
    return (
      <View className="bg-card-1 rounded-[34px] p-6 mb-5">
        {/* USER */}
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center flex-1">
            <Image
              source={{
                uri: `https://api.dicebear.com/7.x/adventurer/png?seed=${item.username}`,
              }}
              className="w-14 h-14 rounded-full"
            />

            <View className="ml-4 flex-1">
              <Text className="text-white text-lg font-sora-semibold">
                {item.username}
              </Text>

              <Text className="text-muted text-sm mt-1">
                @{item.username?.toLowerCase()}
              </Text>
            </View>
          </View>

          <Pressable className="p-2">
            <MoreVertical size={20} color="white" />
          </Pressable>
        </View>

        {/* THOUGHT */}
        <Text className="text-white text-[17px] leading-8 mt-8 font-sora">
          {item.thought}
        </Text>

        {/* VERSE CARD */}
        {!!item.verseReference && (
          <View className="bg-card-2 rounded-[30px] mt-6 overflow-hidden">
            <View className="p-6">
              <Text className="text-white text-2xl font-serif">
                {item.verseReference}
              </Text>

              <Text className="text-zinc-300 mt-5 leading-9 text-[17px] font-serif">
                {item.verseText}
              </Text>
            </View>

            <Pressable className="absolute bottom-0 right-0 bg-white px-7 py-4 rounded-tl-[28px]">
              <Text className="text-black font-sora-semibold">Read full</Text>
            </Pressable>
          </View>
        )}

        {/* ACTIONS */}
        <View className="flex-row items-center mt-7">
          <Pressable
            onPress={() => likePost(item.id, auth.currentUser?.uid || "")}
            className="mr-6"
          >
            <Heart color="white" size={28} />
          </Pressable>

          <Pressable>
            <MessageCircle color="white" size={26} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View
      style={{
        paddingTop: top + 8,
      }}
      className="flex-1 bg-bg"
    >
      {/* HEADER */}
      <View className="px-5">
        <View className="flex-row items-center justify-between">
          {/* LEFT */}
          <View className="flex-row items-center">
            <Avatar />

            <View className="w-4 h-4 rounded-full bg-green-500 absolute bottom-0 right-0 border-[2px] border-bg" />
          </View>

          {/* TITLE */}
          <Text className="text-white text-lg font-sora-bold">
            The Zoe Network
          </Text>

          {/* PLUS */}
          <Pressable className="p-2">
            <Plus color="white" size={34} />
          </Pressable>
        </View>

        {/* SEARCH */}
        <View className="mt-6 bg-card-1 rounded-xl px-5 py-4 flex-row items-center">
          <Search color="#888" size={24} />

          <TextInput
            placeholder="Search Scripture, interest or thought"
            placeholderTextColor="#888"
            className="ml-4 flex-1 text-white text-sm"
          />
        </View>
      </View>

      {/* STORIES */}
      <View className="mt-8">
        <FlatList
          horizontal
          data={posts.slice(0, 10)}
          renderItem={renderStory}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
          }}
        />
      </View>

      {/* TAGS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-10  max-h-18"
        contentContainerStyle={{
          paddingHorizontal: 20,
          alignItems: "center",
        }}
      >
        {TAGS.map((tag) => {
          const active = selectedTag === tag;

          return (
            <Pressable
              key={tag}
              onPress={() => setSelectedTag(tag)}
              className={`mr-8 ${
                active ? "bg-card-1 px-5 py-3 rounded-full" : ""
              }`}
            >
              <Text
                className={`text-[17px] ${
                  active ? "text-white font-sora-semibold" : "text-zinc-300"
                }`}
              >
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* FEED */}
      <FlatList
        data={filteredPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 180,
        }}
      />

      {/* FLOATING BUTTON */}
      <Pressable
        onPress={handleCreatePost}
        className="absolute bottom-32 right-6 w-20 h-20 rounded-full bg-white items-center justify-center"
      >
        {submitting ? (
          <ActivityIndicator color="black" />
        ) : (
          <Plus color="black" size={42} />
        )}
      </Pressable>
    </View>
  );
}
