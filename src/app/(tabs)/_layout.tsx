import { useApp } from "@/context/app-context";
import { useTheme } from "@/context/theme-context";
import { Tabs } from "expo-router";
import {
  BookPlus,
  CheckSquare,
  Gamepad2,
  Home,
  Newspaper,
  User,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// The offline notice is intentionally subtle for an offline-first app and
// auto-hides after a few minutes so it never becomes nagging.
const OFFLINE_AUTO_HIDE_MS = 12000; // ~3 minutes

function SyncBanner() {
  const { isOnline, pendingSync } = useApp();
  const insets = useSafeAreaInsets();
  const [offlineHidden, setOfflineHidden] = useState(false);


  // When connectivity drops, show a small notice, then fade it out after a while.
  useEffect(() => {
    if (isOnline) {
      setOfflineHidden(false);
      return;
    }
    setOfflineHidden(false);
    const t = setTimeout(() => setOfflineHidden(true), OFFLINE_AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [isOnline]);

  // Nothing to show when online with no pending writes, or when the offline
  // notice already auto-hid.
  if (isOnline && pendingSync === 0) return null;
  if (!isOnline && offlineHidden) return null;

  return (
    <View
      style={{ top: insets.top + 6, zIndex: 100 }}
      className="absolute left-4 right-4 rounded-full px-4 py-1.5 bg-card-1/90 self-start"
      pointerEvents="none"
    >
      {isOnline ? (
        <Text className="text-tertiary text-[10px] font-sora-medium text-center">
          Syncing {pendingSync} change{pendingSync === 1 ? "" : "s"}…
        </Text>
      ) : (
        <View className="flex-row items-center justify-center">
          <View className="w-1.5 h-1.5 rounded-full bg-tertiary mr-2" />
          <Text className="text-tertiary text-[10px] font-sora-medium text-center">
            Offline — saving locally
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarStyle: {
            backgroundColor: isDark ? "#181818" : "#fbf6ee",
            borderTopWidth: 0,
            borderTopColor: isDark ? "#000" : "#eadfcb",
            height: insets.bottom + 80,
            paddingTop: 8,
            paddingBottom: insets.bottom + 10,
          },

          tabBarInactiveTintColor: isDark ? "#fff9" : "#8b7f6e",
          tabBarActiveTintColor: isDark ? "#fff" : "#3f372d",

          tabBarLabelStyle: {
            fontSize: 10,
            marginTop: 1,
            fontFamily: "Geist-Regular",
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ size, color }) => <Home size={17} color={color} />,
          }}
        />

        <Tabs.Screen
          name="habits"
          options={{
            title: "Habits",
            tabBarIcon: ({ size, color }) => (
              <CheckSquare size={17} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="feed"
          options={{
            title: "Feed",
            tabBarIcon: ({ size, color }) => (
              <Newspaper size={17} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="bible"
          options={{
            title: "Bible",
            tabBarIcon: ({ size, color }) => (
              <BookPlus size={17} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="games"
          options={{
            title: "Arena",
            tabBarIcon: ({ size, color }) => (
              <Gamepad2 size={17} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ size, color }) => <User size={17} color={color} />,
          }}
        />
      </Tabs>
      <SyncBanner />
    </>
  );
}
