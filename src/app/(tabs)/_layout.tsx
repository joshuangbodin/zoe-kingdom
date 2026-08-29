import { Tabs } from "expo-router";
import {
  BookPlus,
  CheckSquare,
  Gamepad2,
  Home,
  Newspaper,
  User,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View } from "react-native";
import { useApp } from "@/context/app-context";
import { useTheme } from "@/context/theme-context";

function SyncBanner() {
  const { isOnline, pendingSync } = useApp();
  const insets = useSafeAreaInsets();

  if (isOnline && pendingSync === 0) return null;

  return (
    <View
      style={{ top: insets.top + 4, zIndex: 100 }}
      className="absolute left-4 right-4 rounded-full px-4 py-2 bg-amber-500/90"
    >
      {isOnline ? (
        <Text className="text-black text-[11px] font-sora-semibold text-center">
          Syncing {pendingSync} pending change{pendingSync === 1 ? "" : "s"}…
        </Text>
      ) : (
        <Text className="text-black text-[11px] font-sora-semibold text-center">
          You're offline — changes will sync automatically
        </Text>
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
            backgroundColor: isDark ? "#181818" : "#ffffff",
            borderTopWidth: 0,
            borderTopColor: isDark ? "#000" : "#e5e7eb",
            height: insets.bottom + 80,
            paddingTop: 8,
            paddingBottom: insets.bottom + 10,
          },

          tabBarInactiveTintColor: isDark ? "#fff9" : "#71717a",
          tabBarActiveTintColor: isDark ? "#fff" : "#0c0c0c",

          tabBarLabelStyle: {
            fontSize: 12,
            marginTop: 4,
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
          name="games"
          options={{
            title: "Arena",
            tabBarIcon: ({ size, color }) => (
              <Gamepad2 size={17} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="bible"
          options={{
            title: "Bible",
            tabBarIcon: ({ size, color }) => <BookPlus size={17} color={color} />,
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

