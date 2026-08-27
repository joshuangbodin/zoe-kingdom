import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LogOut,
  Settings,
  BookOpen,
  Heart,
  Target,
  ChevronRight,
  Edit3,
  Info,
  Check,
  X,
} from "lucide-react-native";
import Avatar from "@/components/Avatar";
import { Avatars } from "@/constants/avatar";
import {
  getLevelFromXP,
  getFireStatus,
  getXPForNextLevel,
  getProgressPercentage,
} from "@/constants/levels";
import { useApp } from "@/context/app-context";
import { getDailyStreak } from "@/libs/sqlite/streak";
import { getTodayCompletedCount } from "@/libs/sqlite/habits";
import { getSpiritState } from "@/libs/sqlite/spirit";
import { router } from "expo-router";

const SPIRIT_MODES = [
  "Disciplined",
  "Prayerful",
  "Focused",
  "Graceful",
  "Thankful",
  "Calm",
];

export default function Profile() {
  const { top } = useSafeAreaInsets();
  const { user, updateUser, logout } = useApp();
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [spiritState, setSpiritState] = useState<any>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [editUsername, setEditUsername] = useState("");
  const [editStatusNote, setEditStatusNote] = useState("");
  const [editSpiritMode, setEditSpiritMode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      if (user) {
        setEditUsername(user.username || "");
        setEditStatusNote(user.statusNote || "");
        setEditSpiritMode(user.spiritStage || "Disciplined");
      }
      const [s, completed, spirit] = await Promise.all([
        getDailyStreak(),
        getTodayCompletedCount(),
        getSpiritState(),
      ]);
      setStreak(s);
      setTodayCompleted(completed);
      setSpiritState(spirit);
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }
    try {
      setSaving(true);
      await updateUser({
        username: editUsername.trim(),
        statusNote: editStatusNote.trim(),
        spiritStage: editSpiritMode,
      });
      setShowEditProfile(false);
      Alert.alert("Success", "Profile updated");
    } catch {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(tabs)/home");
        },
      },
    ]);
  };

  const handlePickAvatar = async (index: number) => {
    await updateUser({ avatar: index });
    setShowAvatarPicker(false);
  };

  const level = user?.level || spiritState?.level || 1;
  const xp = user?.xp || spiritState?.totalXP || 0;
  const fireStatus = getFireStatus(level);
  const nextLevelXP = getXPForNextLevel(level);
  const progress = getProgressPercentage(xp);

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="white" />
      </View>
    );
  }

  // Guest mode (no account): show a friendly sign-in prompt instead of the
  // full profile editor / logout controls.
  if (!user) {
    return (
      <View className="flex-1 bg-bg" style={{ paddingTop: top + 8 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          className="flex-1 px-7"
        >
          <View className="items-center">
            <Avatar index={0} diameter={72} />
            <Text className="text-white text-xl font-sora-bold mt-5">
              Browsing as a guest
            </Text>
            <Text className="text-zinc-500 text-sm font-sora text-center mt-2 leading-6">
              Sign in to back up your habits, track your streak and join the
              community. Until then, feel free to explore.
            </Text>
            <Pressable
              onPress={() => router.push("/(auth)/signin")}
              className="mt-8 bg-white rounded-xl h-14 w-full items-center justify-center"
            >
              <Text className="text-black text-sm font-sora-bold">
                Sign in with Google
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.replace("/(tabs)/home")}
              className="mt-3 py-2"
            >
              <Text className="text-zinc-500 font-sora text-xs underline">
                Not now — keep browsing
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: top + 8 }}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5">
        {/* HEADER */}
        <View className="flex-row items-center justify-between mb-5">
          <View className="flex-row items-center">
            <Avatar index={user?.avatar} diameter={48} />
            <View className="ml-3">
              <Text className="text-white text-base font-sora-semibold">
                {user?.username || "User"}
              </Text>
              <Text className="text-zinc-500 text-[10px] font-sora mt-0.5">
                {user?.email || "Zoe Kingdom"}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setShowSettings(true)}
            className="w-9 h-9 rounded-xl bg-card-1 items-center justify-center"
          >
            <Settings size={16} color="#fff" />
          </Pressable>
        </View>

        {/* LEVEL CARD */}
        <View className="bg-card-1 rounded-3xl p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-sm font-sora-semibold">
              {fireStatus.title}
            </Text>
            <Text className="text-amber-400 text-[10px] font-sora-semibold uppercase tracking-wider">
              Lv {level}
            </Text>
          </View>
          <View className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full bg-white/80"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </View>
          <Text className="text-zinc-500 text-[10px] font-sora mt-2">
            {xp} / {nextLevelXP} XP
          </Text>
        </View>

        {/* DAILY STATS */}
        <View className="flex-row gap-3 mt-4">
          <View className="flex-1 bg-card-1 rounded-2xl p-4">
            <Text className="text-zinc-500 text-[10px] font-sora-semibold uppercase">Streak</Text>
            <Text className="text-white text-xl font-sora-bold mt-1">
              {streak}
              <Text className="text-xs text-zinc-500"> days</Text>
            </Text>
          </View>
          <View className="flex-1 bg-card-1 rounded-2xl p-4">
            <Text className="text-zinc-500 text-[10px] font-sora-semibold uppercase">Today</Text>
            <Text className="text-white text-xl font-sora-bold mt-1">
              {todayCompleted}
              <Text className="text-xs text-zinc-500"> habits</Text>
            </Text>
          </View>
        </View>
        {/* QUICK ACCESS */}
        <Text className="text-zinc-400 text-[11px] font-sora-semibold uppercase tracking-wider mt-8 mb-3">
          Quick Access
        </Text>
        <View className="gap-2">
          {[
            {
              label: "Habits",
              desc: "Track spiritual disciplines",
              icon: <Target size={18} color="#818cf8" />,
              bg: "bg-indigo-500/10",
              route: "/(tabs)/habits",
            },
            {
              label: "The Zoe Network",
              desc: "Community feed",
              icon: <Heart size={18} color="#f472b6" />,
              bg: "bg-pink-500/10",
              route: "/(tabs)/feed",
            },
            {
              label: "Bible",
              desc: "Read and share scripture",
              icon: <BookOpen size={18} color="#fbbf24" />,
              bg: "bg-amber-500/10",
              route: "/(tabs)/bible",
            },
          ].map((item) => (
            <Pressable
              key={item.label}
              onPress={() => router.push(item.route as any)}
              className="bg-card-1 rounded-2xl p-4 flex-row items-center"
            >
              <View className={`w-10 h-10 rounded-xl ${item.bg} items-center justify-center`}>
                {item.icon}
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-white text-sm font-sora-semibold">{item.label}</Text>
                <Text className="text-zinc-500 text-[10px] font-sora mt-0.5">{item.desc}</Text>
              </View>
              <ChevronRight size={16} color="#444" />
            </Pressable>
          ))}
        </View>

        {/* LOGOUT */}
        <Pressable
          onPress={handleLogout}
          className="mt-8 mb-10 rounded-2xl py-3.5 items-center border border-white/5"
        >
          <View className="flex-row items-center">
            <LogOut size={14} color="#ef4444" />
            <Text className="text-red-400 text-xs font-sora-semibold ml-2">Sign Out</Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* SETTINGS MODAL */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[32px] max-h-[80%]">
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
              <Text className="text-white text-base font-sora-semibold">Settings</Text>
              <Pressable onPress={() => setShowSettings(false)} className="p-1.5">
                <X size={18} color="#fff" />
              </Pressable>
            </View>
            <ScrollView className="px-5 pt-4">
              <View className="bg-card-1 rounded-xl overflow-hidden mb-8">
                {[
                  {
                    id: "edit-profile",
                    label: "Edit Profile",
                    icon: <Edit3 size={16} color="#fff" />,
                    action: () => setShowEditProfile(true),
                  },
                  {
                    id: "about",
                    label: "About Zoe Kingdom",
                    icon: <Info size={16} color="#fff" />,
                    action: () =>
                      Alert.alert(
                        "Zoe Kingdom",
                        "Version 1.0.0\n\nA spiritual growth app.\n\nPowered by Christ.",
                      ),
                  },
                ].map((item, index) => (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setShowSettings(false);
                      item.action();
                    }}
                    className={`flex-row items-center px-4 py-3.5 ${
                      index < 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <View className="w-7 h-7 rounded-lg items-center justify-center bg-white/5">
                      {item.icon}
                    </View>
                    <Text className="flex-1 ml-3 font-sora text-sm text-white">{item.label}</Text>
                    <ChevronRight size={14} color="#444" />
                  </Pressable>
                ))}
              </View>
              <View className="h-8" />
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* EDIT PROFILE MODAL */}
      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[32px] px-5 pt-6 pb-10 max-h-[88%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-base font-sora-semibold">Edit Profile</Text>
              <Pressable onPress={() => setShowEditProfile(false)} className="p-1.5">
                <X size={18} color="#fff" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-1.5">
                Username
              </Text>
              <TextInput
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Your username"
                placeholderTextColor="#555"
                className="bg-card-1 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora mb-4"
              />
              <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-1.5">
                Status
              </Text>
              <TextInput
                value={editStatusNote}
                onChangeText={setEditStatusNote}
                placeholder="Share a thought..."
                placeholderTextColor="#555"
                multiline
                className="bg-card-1 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora min-h-[60px] mb-4"
              />
              <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-2.5">
                Spiritual Focus
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {SPIRIT_MODES.map((mode) => {
                  const active = editSpiritMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => setEditSpiritMode(mode)}
                      className={`px-4 py-2.5 rounded-xl ${active ? "bg-white" : "bg-card-1"}`}
                    >
                      <Text className={`text-xs font-sora-medium ${active ? "text-black" : "text-white/70"}`}>
                        {mode}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                onPress={() => setShowAvatarPicker(true)}
                className="bg-card-1 rounded-xl py-3 mb-4 items-center"
              >
                <Text className="text-white/80 text-xs font-sora-semibold">Change Avatar</Text>
              </Pressable>
              <Pressable onPress={handleSaveProfile} disabled={saving} className="bg-white rounded-xl py-3.5 items-center">
                {saving ? (
                  <ActivityIndicator color="black" />
                ) : (
                  <Text className="text-black text-sm font-sora-semibold">Save Changes</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AVATAR PICKER MODAL */}
      <Modal visible={showAvatarPicker} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[32px] px-5 pt-6 pb-10 max-h-[85%]">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-white text-base font-sora-semibold">Choose Avatar</Text>
              <Pressable onPress={() => setShowAvatarPicker(false)} className="p-1.5">
                <X size={18} color="#fff" />
              </Pressable>
            </View>
            <ScrollView>
              <View className="flex-row flex-wrap justify-between">
                {Avatars.map((_, index) => {
                  const selected = (user?.avatar ?? 0) === index;
                  return (
                    <Pressable
                      key={index}
                      onPress={() => handlePickAvatar(index)}
                      className={`w-[22%] aspect-square mb-4 rounded-xl items-center justify-center bg-card-1 border ${
                        selected ? "border-white" : "border-transparent"
                      }`}
                    >
                      <Avatar index={index} diameter={55} />
                      {selected && (
                        <View className="absolute bottom-1 right-1 bg-white rounded-full p-1">
                          <Check size={10} color="black" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}



