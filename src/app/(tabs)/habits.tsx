import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "react-native-pressable-scale";

import { createHabit, getHabits, Habit } from "@/libs/sqlite/habits";

import HabitCard from "@/components/habits/HabitCard";
import {
  CATEGORIES,
  frequencyData,
  getCategoryIcon,
} from "@/constants/habit-data";
import { useApp } from "@/context/app-context";
import { sqlite } from "@/libs/sqlite/db";

// Daily verses that rotate based on the day of year
const DAILY_VERSES = [
  { ref: "Philippians 4:13", text: "I can do all things through Christ which strengtheneth me.", book: "Philippians", chapter: 4 },
  { ref: "Jeremiah 29:11", text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.", book: "Jeremiah", chapter: 29 },
  { ref: "Isaiah 40:31", text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.", book: "Isaiah", chapter: 40 },
  { ref: "Joshua 1:9", text: "Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.", book: "Joshua", chapter: 1 },
  { ref: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path.", book: "Psalms", chapter: 119 },
  { ref: "2 Corinthians 5:17", text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.", book: "2 Corinthians", chapter: 5 },
  { ref: "Romans 8:28", text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.", book: "Romans", chapter: 8 },
  { ref: "Proverbs 3:5", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", book: "Proverbs", chapter: 3 },
  { ref: "Psalm 37:4", text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart.", book: "Psalms", chapter: 37 },
  { ref: "Matthew 6:33", text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.", book: "Matthew", chapter: 6 },
  { ref: "Psalm 23:4", text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.", book: "Psalms", chapter: 23 },
  { ref: "Isaiah 43:2", text: "When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee.", book: "Isaiah", chapter: 43 },
  { ref: "Psalm 27:1", text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?", book: "Psalms", chapter: 27 },
  { ref: "Romans 15:13", text: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.", book: "Romans", chapter: 15 },
  { ref: "Psalm 46:10", text: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.", book: "Psalms", chapter: 46 },
  { ref: "1 Corinthians 16:14", text: "Let all your things be done with charity.", book: "1 Corinthians", chapter: 16 },
  { ref: "Psalm 34:8", text: "O taste and see that the LORD is good: blessed is the man that trusteth in him.", book: "Psalms", chapter: 34 },
  { ref: "Psalm 121:1", text: "I will lift up mine eyes unto the hills, from whence cometh my help.", book: "Psalms", chapter: 121 },
  { ref: "Psalm 51:10", text: "Create in me a clean heart, O God; and renew a right spirit within me.", book: "Psalms", chapter: 51 },
  { ref: "Psalm 19:14", text: "Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD, my strength, and my redeemer.", book: "Psalms", chapter: 19 },
  { ref: "Psalm 16:8", text: "I have set the LORD always before me: because he is at my right hand, I shall not be moved.", book: "Psalms", chapter: 16 },
  { ref: "Psalm 62:8", text: "Trust in him at all times; ye people, pour out your heart before him: God is a refuge for us.", book: "Psalms", chapter: 62 },
  { ref: "Psalm 18:2", text: "The LORD is my rock, and my fortress, and my deliverer; my God, my strength, in whom I will trust.", book: "Psalms", chapter: 18 },
  { ref: "Psalm 20:7", text: "Some trust in chariots, and some in horses: but we will remember the name of the LORD our God.", book: "Psalms", chapter: 20 },
  { ref: "Psalm 25:4", text: "Shew me thy ways, O LORD; teach me thy paths.", book: "Psalms", chapter: 25 },
  { ref: "Psalm 31:24", text: "Be of good courage, and he shall strengthen your heart, all ye that hope in the LORD.", book: "Psalms", chapter: 31 },
  { ref: "Psalm 33:20", text: "Our soul waiteth for the LORD: he is our help and our shield.", book: "Psalms", chapter: 33 },
  { ref: "Psalm 40:1", text: "I waited patiently for the LORD; and he inclined unto me, and heard my cry.", book: "Psalms", chapter: 40 },
  { ref: "Psalm 55:22", text: "Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved.", book: "Psalms", chapter: 55 },
  { ref: "Psalm 56:3", text: "What time I am afraid, I will trust in thee.", book: "Psalms", chapter: 56 },
  { ref: "Psalm 91:1", text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.", book: "Psalms", chapter: 91 },
  { ref: "Psalm 103:1", text: "Bless the LORD, O my soul: and all that is within me, bless his holy name.", book: "Psalms", chapter: 103 },
  { ref: "Psalm 118:24", text: "This is the day which the LORD hath made; we will rejoice and be glad in it.", book: "Psalms", chapter: 118 },
  { ref: "Psalm 136:1", text: "O give thanks unto the LORD; for he is good: for his mercy endureth for ever.", book: "Psalms", chapter: 136 },
  { ref: "Psalm 139:14", text: "I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.", book: "Psalms", chapter: 139 },
  { ref: "Psalm 143:8", text: "Cause me to hear thy lovingkindness in the morning; for in thee do I trust: cause me to know the way wherein I should walk.", book: "Psalms", chapter: 143 },
  { ref: "Psalm 145:18", text: "The LORD is nigh unto all them that call upon him, to all that call upon him in truth.", book: "Psalms", chapter: 145 },
  { ref: "Psalm 150:6", text: "Let every thing that hath breath praise the LORD. Praise ye the LORD.", book: "Psalms", chapter: 150 },
  { ref: "Proverbs 3:6", text: "In all thy ways acknowledge him, and he shall direct thy paths.", book: "Proverbs", chapter: 3 },
  { ref: "Proverbs 4:23", text: "Keep thy heart with all diligence; for out of it are the issues of life.", book: "Proverbs", chapter: 4 },
  { ref: "Proverbs 9:10", text: "The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding.", book: "Proverbs", chapter: 9 },
  { ref: "Proverbs 16:3", text: "Commit thy works unto the LORD, and thy thoughts shall be established.", book: "Proverbs", chapter: 16 },
  { ref: "Proverbs 18:10", text: "The name of the LORD is a strong tower: the righteous runneth into it, and is safe.", book: "Proverbs", chapter: 18 },
  { ref: "Isaiah 26:3", text: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.", book: "Isaiah", chapter: 26 },
  { ref: "Isaiah 41:10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee.", book: "Isaiah", chapter: 41 },
  { ref: "Isaiah 43:19", text: "Behold, I will do a new thing; now it shall spring forth; shall ye not know it? I will even make a way in the wilderness.", book: "Isaiah", chapter: 43 },
  { ref: "Isaiah 55:8", text: "For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD.", book: "Isaiah", chapter: 55 },
  { ref: "Jeremiah 17:7", text: "Blessed is the man that trusteth in the LORD, and whose hope the LORD is.", book: "Jeremiah", chapter: 17 },
  { ref: "Jeremiah 33:3", text: "Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not.", book: "Jeremiah", chapter: 33 },
  { ref: "Lamentations 3:22", text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not.", book: "Lamentations", chapter: 3 },
  { ref: "Lamentations 3:23", text: "They are new every morning: great is thy faithfulness.", book: "Lamentations", chapter: 3 },
  { ref: "Nahum 1:7", text: "The LORD is good, a strong hold in the day of trouble; and he knoweth them that trust in him.", book: "Nahum", chapter: 1 },
  { ref: "Zephaniah 3:17", text: "The LORD thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy.", book: "Zephaniah", chapter: 3 },
  { ref: "Malachi 3:10", text: "Bring ye all the tithes into the storehouse, that there may be meat in mine house, and prove me now herewith, saith the LORD.", book: "Malachi", chapter: 3 },
  { ref: "Matthew 5:16", text: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.", book: "Matthew", chapter: 5 },
  { ref: "Matthew 11:28", text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.", book: "Matthew", chapter: 11 },
  { ref: "Matthew 22:37", text: "Jesus said unto him, Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind.", book: "Matthew", chapter: 22 },
  { ref: "John 3:16", text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.", book: "John", chapter: 3 },
  { ref: "John 14:6", text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.", book: "John", chapter: 14 },
  { ref: "John 15:5", text: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit.", book: "John", chapter: 15 },
  { ref: "Romans 8:38", text: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come.", book: "Romans", chapter: 8 },
  { ref: "Romans 12:1", text: "I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God.", book: "Romans", chapter: 12 },
  { ref: "1 Corinthians 13:13", text: "And now abideth faith, hope, charity, these three; but the greatest of these is charity.", book: "1 Corinthians", chapter: 13 },
  { ref: "Galatians 5:22", text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith.", book: "Galatians", chapter: 5 },
  { ref: "Ephesians 2:8", text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.", book: "Ephesians", chapter: 2 },
  { ref: "Ephesians 6:10", text: "Finally, my brethren, be strong in the Lord, and in the power of his might.", book: "Ephesians", chapter: 6 },
  { ref: "Philippians 4:6", text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", book: "Philippians", chapter: 4 },
  { ref: "Colossians 3:23", text: "And whatsoever ye do, do it heartily, as to the Lord, and not unto men.", book: "Colossians", chapter: 3 },
  { ref: "Hebrews 11:1", text: "Now faith is the substance of things hoped for, the evidence of things not seen.", book: "Hebrews", chapter: 11 },
  { ref: "Hebrews 13:8", text: "Jesus Christ the same yesterday, and to day, and for ever.", book: "Hebrews", chapter: 13 },
  { ref: "James 1:2", text: "My brethren, count it all joy when ye fall into divers temptations.", book: "James", chapter: 1 },
  { ref: "James 1:17", text: "Every good gift and every perfect gift is from above, and cometh down from the Father of lights.", book: "James", chapter: 1 },
  { ref: "1 Peter 5:7", text: "Casting all your care upon him; for he careth for you.", book: "1 Peter", chapter: 5 },
  { ref: "1 John 4:19", text: "We love him, because he first loved us.", book: "1 John", chapter: 4 },
  { ref: "Revelation 3:20", text: "Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him.", book: "Revelation", chapter: 3 },
  { ref: "Revelation 21:4", text: "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying.", book: "Revelation", chapter: 21 },
];

const getDailyVerse = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = (now.getTime() - start.getTime()) + (now.getTimezoneOffset() * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return DAILY_VERSES[dayOfYear % DAILY_VERSES.length];
};

export default function Habits() {
  const router = useRouter();
  const { top } = useSafeAreaInsets();

  const {habits, setHabits} = useApp()
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");

  const [duration, setDuration] = useState(10);

  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);

  const [frequency, setFrequency] = useState<
    "morning" | "evening" | "twice_daily" | "weekly" | "throughout_day"
  >("throughout_day");

  const [filterFrequency, setFilterFrequency] = useState("All");

  // LOAD
  const loadHabits = async () => {
    const data = await getHabits();
    setHabits(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, []),
  );

  // FILTER
  const filteredHabits = useMemo(() => {
    if (filterFrequency.toLowerCase() === "all") {
      return habits;
    }

    return habits.filter(
      (h: any) => h.frequency?.toLowerCase() === filterFrequency.toLowerCase(),
    );
  }, [habits, filterFrequency]);

  // CREATE
  const handleCreateHabit = async () => {
    if (!title.trim()) return;

    try {
      setLoading(true);

      await createHabit({
        title,
        category: selectedCategory.id,
        icon: selectedCategory.icon,
        color: selectedCategory.color,
        frequency,
        duration,
      });

      setTitle("");
      setOpen(false);

      await loadHabits();
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{ paddingTop: top + 8 }}
      className="flex-1 bg-bg"
    >
      {/* HEADER */}
      <View className="px-5 flex-row items-center justify-between mb-2">
        <View>
          <Text className="text-white text-base font-sora-semibold">
            Habits
          </Text>
          <Text className="text-zinc-500 text-[10px] font-sora mt-0.5">Spiritual disciplines</Text>
        </View>

        <PressableScale
          activeScale={0.9}
          onPress={() => setOpen(true)}
          className="w-9 h-9 rounded-full items-center justify-center bg-white/10"
        >
          <Plus color={"white"} size={18} />
        </PressableScale>
      </View>

      {/* CONTENT */}
      <FlatList
        data={filteredHabits}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 140,
        }}
        ListHeaderComponent={
          <>
            {/* Daily Scripture Card */}
            {(() => {
              const dailyVerse = getDailyVerse();
              return (
                <View className="bg-card-1 rounded-2xl p-5 pb-12 overflow-hidden mb-6">
                  <Text className="text-zinc-500 text-[10px] font-sora uppercase tracking-wider">
                    {dailyVerse.ref}
                  </Text>
                  <Text className="text-white/80 text-sm font-serif leading-7 mt-2">
                    {dailyVerse.text}
                  </Text>
                  <Pressable
                    onPress={() => {
                      router.push({
                        pathname: "/(tabs)/bible",
                        params: {
                          book: dailyVerse.book,
                          chapter: dailyVerse.chapter,
                        },
                      });
                    }}
                    className="absolute bottom-0 right-0 bg-white/10 px-4 py-2 rounded-tl-2xl"
                  >
                    <Text className="text-white/60 text-[10px] font-sora">Read full</Text>
                  </Pressable>
                </View>
              );
            })()}

            {/* Filters */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              <View className="flex-row items-center">
                {[{ label: "All" }, ...frequencyData].map(
                  (item: any, index) => {
                    const active =
                      item.label.toLowerCase() ===
                      filterFrequency.toLowerCase();

                    return (
                      <Pressable
                        key={index}
                        onPress={() => setFilterFrequency(item.label)}
                        className={`px-4 py-2 rounded-full mr-2 ${
                          active ? "bg-white" : "bg-card-1"
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-sora-medium ${
                            active ? "text-black" : "text-zinc-400"
                          }`}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  },
                )}
              </View>
            </ScrollView>
          </>
        }
        ListEmptyComponent={
          <View className="items-center mt-24">
            <Text className="text-white/60 text-base font-sora-semibold">
              No Habits Yet
            </Text>
            <Text className="text-zinc-500 text-center mt-2 px-10 text-xs font-sora leading-5">
              Create your first spiritual habit and begin growing consistently.
            </Text>
          </View>
        }
        renderItem={({ item }: any) => <HabitCard item={item} />}
      />

      {/* FAB */}
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute bottom-6 right-5 w-11 h-11 rounded-full bg-white items-center justify-center"
        style={{
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 12,
        }}
      >
        <Plus color={"black"} size={18} strokeWidth={2.2} />
      </Pressable>

      {/* Create Modal */}
      <Modal visible={open} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-[#111] rounded-t-[32px] px-5 pt-6 pb-10">
            <Text className="text-white text-lg font-sora-semibold mb-6">
              Create Habit
            </Text>

            {/* Title */}
            <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-1.5">Title</Text>
            <TextInput
              placeholder="Morning Prayer..."
              placeholderTextColor="#555"
              value={title}
              onChangeText={setTitle}
              className="bg-card-1 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora mb-5"
            />

            {/* Category */}
            <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-2.5">Category</Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory.id === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat)}
                    className="px-4 py-3 rounded-xl flex-row items-center"
                    style={{
                      backgroundColor: active ? cat.color + "30" : "#1A1A1A",
                      borderWidth: 1,
                      borderColor: active ? cat.color : "transparent",
                    }}
                  >
                    <View className="mr-2">
                      {getCategoryIcon(cat.id, 14, active ? cat.color : "#888")}
                    </View>
                    <Text className="text-white/80 text-xs font-sora-medium">
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Frequency */}
            <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-2.5">Frequency</Text>
            <View className="flex-row flex-wrap gap-2 mb-5">
              {frequencyData.map((f) => {
                const active = frequency === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setFrequency(f.id as any)}
                    className={`px-4 py-2.5 rounded-xl ${
                      active ? "bg-white" : "bg-card-1"
                    }`}
                  >
                    <Text
                      className={`text-xs font-sora-medium ${
                        active ? "text-black" : "text-white/70"
                      }`}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Duration */}
            <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-2.5">Duration (minutes)</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {[1, 2, 3, 5, 10, 15, 20, 30].map((min) => {
                const active = duration === min;
                return (
                  <Pressable
                    key={min}
                    onPress={() => setDuration(min)}
                    className={`px-4 py-2.5 rounded-xl ${
                      active ? "bg-white" : "bg-card-1"
                    }`}
                  >
                    <Text
                      className={`text-xs font-sora-medium ${
                        active ? "text-black" : "text-white/70"
                      }`}
                    >
                      {min}m
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Actions */}
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setOpen(false)}
                className="flex-1 bg-card-1 rounded-xl py-3.5 items-center"
              >
                <Text className="text-white/70 text-xs font-sora-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                disabled={loading}
                onPress={handleCreateHabit}
                className="flex-1 bg-white rounded-xl py-3.5 items-center"
              >
                <Text className="text-black text-xs font-sora-bold">
                  {loading ? "Creating..." : "Create"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}