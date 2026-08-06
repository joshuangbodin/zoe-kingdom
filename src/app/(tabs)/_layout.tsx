import { Tabs } from "expo-router";
import {
  BookPlus,
  CheckSquare,
  Home,
  Newspaper,
  User,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, View } from "react-native";
import { useApp } from "@/context/app-context";

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
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarStyle: {
            backgroundColor: "#181818",
            borderTopWidth: 0,
            borderTopColor: "#e5e7eb",
            height: insets.bottom + 80,
            paddingTop: 8,
            paddingBottom: insets.bottom + 10,
          },

          tabBarInactiveTintColor: "#fff9",
          tabBarActiveTintColor: "#fff",

          tabBarLabelStyle: {
            fontSize: 12,
            marginTop: 4,
            fontFamily: "Sora-Regular",
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

