import { Tabs } from "expo-router";
import {
  BookPlus,
  CheckSquare,
  Home,
  Newspaper,
  User,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: "#181818",
          borderTopWidth: 0,
          borderTopColor: "#e5e7eb",
          height: insets.bottom + 60,
          paddingTop: 8,
          paddingBottom: insets.bottom + 10,
        },

        tabBarInactiveTintColor: "#c7c7c7",
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
          tabBarIcon: ({ size, color }) => <Home size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="habits"
        options={{
          title: "Habits",
          tabBarIcon: ({ size, color }) => (
            <CheckSquare size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="feed"
        options={{
          title: "Feed",
          tabBarIcon: ({ size, color }) => (
            <Newspaper size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="bible"
        options={{
          title: "Bible",
          tabBarIcon: ({ size, color }) => <BookPlus size={22} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ size, color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
