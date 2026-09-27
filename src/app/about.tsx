import { useTheme } from "@/context/theme-context";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  ArrowUpRight,
  BookOpen,
  ChevronLeft,
  Gift,
  Heart,
  Share2,
  Sparkles,
  Users,
} from "lucide-react-native";
import React, { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ----------------------------------------------------------------------
 * GIVINGS
 * ----------------------------------------------------------------------
 * Each object renders a tappable giving button that opens `url` (a Flutterwave
 * payment link) in an in-app browser.
 *   method  -> the button label, e.g. "Donate to myZoeLife"
 *   detail  -> a short helper line shown under the label
 *   url     -> the Flutterwave donate link the button opens
 * -------------------------------------------------------------------- */
const GIVINGS: { method: string; detail: string; url: string }[] = [
  {
    method: "Donate to the growth of myZoeLife",
    detail: "One-time or recurring gift to support the mission.",
    url: "https://flutterwave.com/donate/zvidbyt7aewe",
  },
  {
    method: "Buy me a coffee",
    detail: "A small token to keep the coffee (and the app) flowing.",
    url: "https://flutterwave.com/donate/3vatswrmxliw",
  },
];

/* --------------------------- PAGE CONTENT --------------------------- */

const FEATURES = [
  {
    icon: BookOpen,
    title: "Daily Bible",
    body: "Read, search and save any passage — with red-letter words highlighted so Christ's voice stands out.",
  },
  {
    icon: Sparkles,
    title: "Holy Habits",
    body: "Build & grow consistent spiritual habits, track your streak and watch your spirit man flourish.",
  },
  {
    icon: Users,
    title: "Community",
    body: "Share thoughts, encourage one another and grow together in one Kingdom-centred feed.",
  },
  {
    icon: Heart,
    title: "Spirit-Led Growth",
    body: "Level up your faith journey and stay accountable to the person God is calling you to be.",
  },
];

const VALUES = [
  { icon: Heart, label: "Love first" },
  { icon: Sparkles, label: "Consistency over perfection" },
  { icon: Users, label: "We grow together" },
];

export default function About() {
  const { top, bottom } = useSafeAreaInsets();
  const { isDark } = useTheme();
  const iconColor = isDark ? "#fff" : "#0c0c0c";

  // Open a giving link (Flutterwave) in an in-app browser.
  const openGivingLink = useCallback(async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      console.warn("Unable to open giving link", e);
    }
  }, []);

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

        <Text className="flex-1 text-primary text-lg font-sora-semibold ml-3">
          About Zoe Kingdom
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: bottom + 40,
        }}
      >
        {/* MISSION */}
        <View className="rounded-3xl bg-card-1 p-6 mb-5">
          <Text className="text-amber-500 text-[11px] font-sora-semibold uppercase tracking-widest">
            Our Mission
          </Text>
          <Text className="text-primary text-xl font-sora-semibold  8 mt-3">
            To help every believer grow their{" "}
            <Text className="font-serif">spirit man</Text> — steadily, daily,
            and together.
          </Text>
          <Text className="text-secondary text-sm font-sora leading-6 mt-3">
            Zoe Kingdom is a spiritual-growth companion built around three
            pillars: consistent holy habits, the Word of God, and a
            Kingdom-centred community that cheers you on.
          </Text>
        </View>

        {/* VERSE */}
        <View className="rounded-3xl bg-card-2 p-6 mb-5">
          <Text className="text-primary font-serif text-base leading-7">
            “But grow in grace, and in the knowledge of our Lord and Saviour
            Jesus Christ.”
          </Text>
          <Text className="text-amber-500 text-xs font-sora-semibold mt-3">
            2 Peter 3:18 (KJV)
          </Text>
        </View>

        {/* WHAT YOU'LL FIND */}
        <Text className="text-secondary text-[11px] font-sora-semibold uppercase tracking-wider mb-3 px-1">
          What you’ll find
        </Text>
        {FEATURES.map((f) => (
          <View
            key={f.title}
            className="rounded-3xl bg-card-1 p-5 mb-3 flex-row"
          >
            <View className="w-11 h-11 rounded-2xl bg-amber-500/15 items-center justify-center mr-4">
              <f.icon size={20} color="#fbbf24" />
            </View>
            <View className="flex-1">
              <Text className="text-primary text-sm font-sora-semibold">
                {f.title}
              </Text>
              <Text className="text-secondary text-xs font-sora leading-5 mt-1">
                {f.body}
              </Text>
            </View>
          </View>
        ))}

        {/* CORE VALUES */}
        <Text className="text-secondary text-[11px] font-sora-semibold uppercase tracking-wider mb-3 px-1 mt-2">
          What we value
        </Text>
        <View className="rounded-3xl bg-card-1 p-5 mb-5 flex-row justify-between">
          {VALUES.map((v) => (
            <View key={v.label} className="items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-card-2 items-center justify-center mb-2">
                <v.icon size={18} color="#fbbf24" />
              </View>
              <Text className="text-primary text-[11px] font-sora-medium text-center px-1">
                {v.label}
              </Text>
            </View>
          ))}
        </View>

        {/* GIVINGS */}
        <View className="rounded-3xl bg-card-1 p-6 mb-5 border border-amber-500/30">
          <View className="flex-row items-center mb-4">
            <View className="w-11 h-11 rounded-2xl bg-amber-500/20 items-center justify-center mr-3">
              <Gift size={20} color="#fbbf24" />
            </View>
            <View className="flex-1">
              <Text className="text-primary text-base font-sora-semibold">
                Givings
              </Text>
              <Text className="text-amber-500 text-[11px] font-sora-medium">
                Support the mission
              </Text>
            </View>
          </View>

          <Text className="text-secondary text-xs font-sora leading-5 mb-4">
            Your generosity keeps Zoe Kingdom growing and helps us reach more
            people with the Gospel. Thank you for giving — every seed counts
            toward the Kingdom.
          </Text>

          {GIVINGS.map((g) => (
            <Pressable
              key={g.method}
              onPress={() => openGivingLink(g.url)}
              className="bg-card-2 rounded-2xl px-4 py-4 mb-3 flex-row items-center active:opacity-80"
            >
              <View className="flex-1">
                <Text className="text-primary text-sm font-sora-semibold">
                  {g.method}
                </Text>
                <Text className="text-secondary text-xs font-sora leading-5 mt-1">
                  {g.detail}
                </Text>
              </View>
              <View className="w-9 h-9 rounded-xl bg-amber-500/15 items-center justify-center ml-3">
                <ArrowUpRight size={18} color="#fbbf24" />
              </View>
            </Pressable>
          ))}

          <View className="mt-2 flex-row items-start">
            <Share2 size={15} color="#fbbf24" style={{ marginTop: 2 }} />
            <Text className="text-tertiary text-[11px] font-sora leading-5 ml-2 flex-1">
              “Bring ye all the tithes into the storehouse… and prove me now
              herewith, saith the LORD.” — Malachi 3:10 (KJV)
            </Text>
          </View>
        </View>

        {/* FOOTER */}
        <View className="items-center py-6">
          <Text className="text-tertiary text-xs font-sora">
            myZoeLife — Powered by{" "}
            <Text className="text-primary font-sora-semibold">Christ</Text>.
          </Text>
          <Text className="text-quaternary text-[11px] font-sora mt-1">
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
