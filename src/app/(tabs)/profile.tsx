import React, { useCallback, useEffect, useState } from "react";
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
import { auth, db } from "@/libs/firebase";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LogOut,
  Settings,
  User,
  Flame,
  BookOpen,
  Heart,
  Target,
  ChevronRight,
  Edit3,
  Shield,
  HelpCircle,
  Info,
  Moon,
  Sun,
  Check,
  X,
  Camera,
  Award,
  Clock,
  TrendingUp,
  Share2,
  Trash2,
  AlertTriangle,
} from "lucide-react-native";
import Avatar from "@/components/Avatar";
import { Avatars } from "@/constants/avatar";
import { getLevelFromXP, getFireStatus, getXPForNextLevel, getProgressPercentage } from "@/constants/levels";
import { useApp } from "@/context/app-context";
import { getDailyStreak } from "@/libs/sqlite/streak";
import { getTodayCompletedCount } from "@/libs/sqlite/habits";
import { getSpiritState } from "@/libs/sqlite/spirit";
import { router } from "expo-router";

type SettingsSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: SettingsItem[];
};

type SettingsItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  danger?: boolean;
};

export default function Profile() {
  const { top } = useSafeAreaInsets();
  const { user, setUser } = useApp();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [spiritState, setSpiritState] = useState<any>(null);

  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit profile fields
  const [editUsername, setEditUsername] = useState("");
  const [editStatusNote, setEditStatusNote] = useState("");
  const [editSpiritMode, setEditSpiritMode] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);

  const firebaseUser = auth.currentUser;

  const SPIRIT_MODES = [
    "Disciplined",
    "Prayerful",
    "Focused",
    "Graceful",
    "Thankful",
    "Calm",
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      if (!firebaseUser) return;

      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setEditUsername(data.username || "");
        setEditStatusNote(data.statusNote || "");
        setEditSpiritMode(data.spiritStage || "Disciplined");
      }

      const s = await getDailyStreak();
      setStreak(s);

      const completed = await getTodayCompletedCount();
      setTodayCompleted(completed);

      const spirit = await getSpiritState();
      setSpiritState(spirit);
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              setUser(null);
              router.replace("/onboarding");
            } catch (err) {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!firebaseUser) return;
    if (!editUsername.trim()) {
      Alert.alert("Error", "Username cannot be empty");
      return;
    }

    try {
      setSaving(true);
      const ref = doc(db, "users", firebaseUser.uid);
      await updateDoc(ref, {
        username: editUsername.trim(),
        statusNote: editStatusNote.trim(),
        spiritStage: editSpiritMode,
        updatedAt: serverTimestamp(),
      });

      setUserData((prev: any) => ({
        ...prev,
        username: editUsername.trim(),
        statusNote: editStatusNote.trim(),
        spiritStage: editSpiritMode,
      }));

      setShowEditProfile(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!firebaseUser || !firebaseUser.email) return;
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      setSaving(true);
      const credential = EmailAuthProvider.credential(
        firebaseUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Success", "Password updated successfully!");
    } catch (err: any) {
      if (err.code === "auth/wrong-password") {
        Alert.alert("Error", "Current password is incorrect");
      } else {
        Alert.alert("Error", "Failed to update password. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is irreversible. All your data will be permanently deleted. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (!firebaseUser) return;
              // Delete user data from Firestore
              await updateDoc(doc(db, "users", firebaseUser.uid), {
                archived: true,
                updatedAt: serverTimestamp(),
              });
              await firebaseUser.delete();
              setUser(null);
              router.replace("/onboarding");
            } catch (err) {
              Alert.alert("Error", "Failed to delete account. You may need to re-authenticate.");
            }
          },
        },
      ]
    );
  };

  const level = userData?.level || spiritState?.level || 1;
  const xp = userData?.xp || spiritState?.totalXP || 0;
  const fireStatus = getFireStatus(level);
  const nextLevelXP = getXPForNextLevel(level);
  const progress = getProgressPercentage(xp);

  const settingsSections: SettingsSection[] = [
    {
      id: "account",
      title: "Account",
      icon: <User size={18} color="#fff" />,
      items: [
        {
          id: "edit-profile",
          label: "Edit Profile",
          icon: <Edit3 size={18} color="#fff" />,
          action: () => setShowEditProfile(true),
        },
        {
          id: "change-password",
          label: "Change Password",
          icon: <Shield size={18} color="#fff" />,
          action: () => setShowPasswordModal(true),
        },
      ],
    },
    {
      id: "preferences",
      title: "Preferences",
      icon: <Settings size={18} color="#fff" />,
      items: [
        {
          id: "spiritual-focus",
          label: "Spiritual Focus",
          icon: <Target size={18} color="#fff" />,
          action: () => {
            setShowSettings(false);
            setShowEditProfile(true);
          },
        },
      ],
    },
    {
      id: "support",
      title: "Support",
      icon: <HelpCircle size={18} color="#fff" />,
      items: [
        {
          id: "help",
          label: "Help & FAQ",
          icon: <HelpCircle size={18} color="#fff" />,
          action: () => Alert.alert("Help", "For support, contact support@zoekingdom.app"),
        },
        {
          id: "about",
          label: "About",
          icon: <Info size={18} color="#fff" />,
          action: () => Alert.alert("Zoe Kingdom", "Version 1.0.0\n\nA spiritual growth and social networking app.\n\nPowered by Christ."),
        },
      ],
    },
    {
      id: "danger",
      title: "Danger Zone",
      icon: <AlertTriangle size={18} color="#ef4444" />,
      items: [
        {
          id: "delete",
          label: "Delete Account",
          icon: <Trash2 size={18} color="#ef4444" />,
          action: () => setShowDeleteConfirm(true),
          danger: true,
        },
      ],
    },
  ];

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="white" size="large" />
        <Text className="text-white mt-4 font-sora">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: top + 8 }}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-2xl font-sora-bold">Profile</Text>
          <Pressable
            onPress={() => setShowSettings(true)}
            className="w-10 h-10 rounded-xl bg-card-2 items-center justify-center"
          >
            <Settings size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Profile Card */}
        <View className="bg-card-1 rounded-[34px] p-6 items-center">
          <Pressable onPress={() => setShowAvatarPicker(true)} className="relative">
            <Avatar index={userData?.avatar ?? 0} diameter={90} />
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white items-center justify-center">
              <Camera size={16} color="black" />
            </View>
          </Pressable>

          <Text className="text-white text-xl font-sora-bold mt-4">
            @{userData?.username || "zoe"}
          </Text>

          {userData?.statusNote && (
            <View className="bg-card-2 rounded-full px-4 py-2 mt-3">
              <Text className="text-muted text-xs font-sora">
                {userData.statusNote}
              </Text>
            </View>
          )}

          <View className="flex-row items-center mt-4 gap-4">
            <View className="items-center">
              <Text className="text-white text-lg font-sora-bold">{level}</Text>
              <Text className="text-muted text-[10px] font-sora">Level</Text>
            </View>
            <View className="w-px h-8 bg-card-2" />
            <View className="items-center">
              <Text className="text-white text-lg font-sora-bold">{xp}</Text>
              <Text className="text-muted text-[10px] font-sora">Total XP</Text>
            </View>
            <View className="w-px h-8 bg-card-2" />
            <View className="items-center">
              <Text className="text-white text-lg font-sora-bold">{streak}</Text>
              <Text className="text-muted text-[10px] font-sora">Day Streak</Text>
            </View>
          </View>

          {/* Fire Status */}
          <View className="bg-card-2 rounded-2xl px-4 py-3 mt-4 w-full flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Flame size={18} color="#facc15" />
              <Text className="text-white text-sm font-sora-medium ml-2">
                {fireStatus.title}
              </Text>
            </View>
            <Text className="text-muted text-xs font-sora">
              {xp}/{nextLevelXP} XP
            </Text>
          </View>

          {/* XP Progress Bar */}
          <View className="w-full h-2 bg-card-2 rounded-full overflow-hidden mt-3">
            <View
              className="h-full rounded-full bg-white"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-3 mt-5">
          <View className="flex-1 bg-card-1 rounded-2xl p-4">
            <View className="w-10 h-10 rounded-xl bg-green-500/20 items-center justify-center mb-3">
              <Check size={20} color="#4ade80" />
            </View>
            <Text className="text-white text-xl font-sora-bold">{todayCompleted}</Text>
            <Text className="text-muted text-xs font-sora mt-1">Today's Habits</Text>
          </View>
          <View className="flex-1 bg-card-1 rounded-2xl p-4">
            <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mb-3">
              <BookOpen size={20} color="#60a5fa" />
            </View>
            <Text className="text-white text-xl font-sora-bold">{spiritState?.level || 1}</Text>
            <Text className="text-muted text-xs font-sora mt-1">Spirit Level</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mt-3">
          <View className="flex-1 bg-card-1 rounded-2xl p-4">
            <View className="w-10 h-10 rounded-xl bg-purple-500/20 items-center justify-center mb-3">
              <Award size={20} color="#c084fc" />
            </View>
            <Text className="text-white text-xl font-sora-bold">{fireStatus.title.split(" ")[0]}</Text>
            <Text className="text-muted text-xs font-sora mt-1">Fire Status</Text>
          </View>
          <View className="flex-1 bg-card-1 rounded-2xl p-4">
            <View className="w-10 h-10 rounded-xl bg-orange-500/20 items-center justify-center mb-3">
              <TrendingUp size={20} color="#fb923c" />
            </View>
            <Text className="text-white text-xl font-sora-bold">{streak > 0 ? `${streak}d` : "0d"}</Text>
            <Text className="text-muted text-xs font-sora mt-1">Best Streak</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text className="text-white text-lg font-sora-bold mt-8 mb-4">Quick Actions</Text>
        <View className="gap-3">
          <Pressable
            onPress={() => router.push("/(tabs)/habits")}
            className="bg-card-1 rounded-2xl p-4 flex-row items-center"
          >
            <View className="w-12 h-12 rounded-xl bg-indigo-500/20 items-center justify-center">
              <Target size={22} color="#818cf8" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white font-sora-semibold">Manage Habits</Text>
              <Text className="text-muted text-xs font-sora mt-1">View and track your spiritual habits</Text>
            </View>
            <ChevronRight size={20} color="#666" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/(tabs)/feed")}
            className="bg-card-1 rounded-2xl p-4 flex-row items-center"
          >
            <View className="w-12 h-12 rounded-xl bg-pink-500/20 items-center justify-center">
              <Heart size={22} color="#f472b6" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white font-sora-semibold">The Zoe Network</Text>
              <Text className="text-muted text-xs font-sora mt-1">Share thoughts and connect</Text>
            </View>
            <ChevronRight size={20} color="#666" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/(tabs)/bible")}
            className="bg-card-1 rounded-2xl p-4 flex-row items-center"
          >
            <View className="w-12 h-12 rounded-xl bg-amber-500/20 items-center justify-center">
              <BookOpen size={22} color="#fbbf24" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white font-sora-semibold">Read Bible</Text>
              <Text className="text-muted text-xs font-sora mt-1">Explore scripture and share verses</Text>
            </View>
            <ChevronRight size={20} color="#666" />
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/30 rounded-2xl py-4 items-center mt-8 mb-10"
        >
          <View className="flex-row items-center">
            <LogOut size={18} color="#ef4444" />
            <Text className="text-red-400 font-sora-semibold ml-2">Sign Out</Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[40px] max-h-[85%]">
            <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-[#222]">
              <Text className="text-white text-xl font-sora-bold">Settings</Text>
              <Pressable onPress={() => setShowSettings(false)} className="p-2">
                <X size={22} color="#fff" />
              </Pressable>
            </View>
            <ScrollView className="px-6 pt-4">
              {settingsSections.map((section) => (
                <View key={section.id} className="mb-6">
                  <Text className="text-muted text-xs font-sora-semibold uppercase tracking-wider mb-3">
                    {section.title}
                  </Text>
                  <View className="bg-card-1 rounded-2xl overflow-hidden">
                    {section.items.map((item, index) => (
                      <Pressable
                        key={item.id}
                        onPress={item.action}
                        className={`flex-row items-center px-4 py-4 ${
                          index < section.items.length - 1 ? "border-b border-[#222]" : ""
                        }`}
                      >
                        <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                          item.danger ? "bg-red-500/10" : "bg-card-2"
                        }`}>
                          {item.icon}
                        </View>
                        <Text
                          className={`flex-1 ml-3 font-sora-medium text-sm ${
                            item.danger ? "text-red-400" : "text-white"
                          }`}
                        >
                          {item.label}
                        </Text>
                        <ChevronRight size={16} color="#666" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
              <View className="h-10" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[40px] px-6 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-sora-bold">Edit Profile</Text>
              <Pressable onPress={() => setShowEditProfile(false)} className="p-2">
                <X size={22} color="#fff" />
              </Pressable>
            </View>

            <Text className="text-muted text-xs font-sora-semibold mb-2">Username</Text>
            <TextInput
              value={editUsername}
              onChangeText={setEditUsername}
              placeholder="Your username"
              placeholderTextColor="#666"
              className="bg-card-1 rounded-2xl px-5 py-4 text-white font-sora mb-4"
            />

            <Text className="text-muted text-xs font-sora-semibold mb-2">Status Note</Text>
            <TextInput
              value={editStatusNote}
              onChangeText={setEditStatusNote}
              placeholder="Share a thought or scripture..."
              placeholderTextColor="#666"
              multiline
              className="bg-card-1 rounded-2xl px-5 py-4 text-white font-sora min-h-[80px] mb-4"
            />

            <Text className="text-muted text-xs font-sora-semibold mb-3">Spiritual Focus</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {SPIRIT_MODES.map((mode) => {
                const selected = editSpiritMode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setEditSpiritMode(mode)}
                    className={`px-4 py-3 rounded-xl ${
                      selected ? "bg-white" : "bg-card-1"
                    }`}
                  >
                    <Text
                      className={`text-xs font-sora-medium ${
                        selected ? "text-black" : "text-white"
                      }`}
                    >
                      {mode}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleSaveProfile}
              disabled={saving}
              className="bg-white rounded-2xl py-4 items-center"
            >
              {saving ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className="text-black font-sora-bold">Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal visible={showAvatarPicker} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[40px] px-6 pt-6 pb-10 max-h-[70%]">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-sora-bold">Choose Avatar</Text>
              <Pressable onPress={() => setShowAvatarPicker(false)} className="p-2">
                <X size={22} color="#fff" />
              </Pressable>
            </View>
            <ScrollView>
              <View className="flex-row flex-wrap justify-between">
                {Avatars.map((_, index) => {
                  const selected = (userData?.avatar ?? 0) === index;
                  return (
                    <Pressable
                      key={index}
                      onPress={async () => {
                        if (!firebaseUser) return;
                        try {
                          await updateDoc(doc(db, "users", firebaseUser.uid), {
                            avatar: index,
                            updatedAt: serverTimestamp(),
                          });
                          setUserData((prev: any) => ({ ...prev, avatar: index }));
                          setShowAvatarPicker(false);
                        } catch (err) {
                          Alert.alert("Error", "Failed to update avatar");
                        }
                      }}
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

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[40px] px-6 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-sora-bold">Change Password</Text>
              <Pressable onPress={() => setShowPasswordModal(false)} className="p-2">
                <X size={22} color="#fff" />
              </Pressable>
            </View>

            <Text className="text-muted text-xs font-sora-semibold mb-2">Current Password</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor="#666"
              secureTextEntry
              className="bg-card-1 rounded-2xl px-5 py-4 text-white font-sora mb-4"
            />

            <Text className="text-muted text-xs font-sora-semibold mb-2">New Password</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#666"
              secureTextEntry
              className="bg-card-1 rounded-2xl px-5 py-4 text-white font-sora mb-4"
            />

            <Text className="text-muted text-xs font-sora-semibold mb-2">Confirm New Password</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#666"
              secureTextEntry
              className="bg-card-1 rounded-2xl px-5 py-4 text-white font-sora mb-6"
            />

            <Pressable
              onPress={handleChangePassword}
              disabled={saving || !currentPassword || !newPassword || !confirmPassword}
              className="bg-white rounded-2xl py-4 items-center"
            >
              {saving ? (
                <ActivityIndicator color="black" />
              ) : (
                <Text className="text-black font-sora-bold">Update Password</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-[#111] rounded-[40px] p-6">
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center mb-4">
                <AlertTriangle size={32} color="#ef4444" />
              </View>
              <Text className="text-white text-xl font-sora-bold text-center">
                Delete Account?
              </Text>
              <Text className="text-muted text-sm font-sora text-center mt-2 leading-6">
                This will permanently delete your account and all your data. This action cannot be undone.
              </Text>
            </View>

            <View className="flex-row gap-4">
              <Pressable
                onPress={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-card-1 rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-sora-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteAccount}
                className="flex-1 bg-red-500 rounded-2xl py-4 items-center"
              >
                <Text className="text-white font-sora-bold">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}