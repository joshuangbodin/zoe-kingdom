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
import { auth, db } from "@/libs/firebase";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  LogOut,
  Settings,
  BookOpen,
  Heart,
  Target,
  ChevronRight,
  Edit3,
  Shield,
  Info,
  Check,
  X,
  Camera,
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

type SettingsItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  danger?: boolean;
};

export default function Profile() {
  const { top } = useSafeAreaInsets();
  const { setUser } = useApp();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [spiritState, setSpiritState] = useState<any>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [editUsername, setEditUsername] = useState("");
  const [editStatusNote, setEditStatusNote] = useState("");
  const [editSpiritMode, setEditSpiritMode] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);

  const firebaseUser = auth.currentUser;

  const SPIRIT_MODES = [
    "Disciplined", "Prayerful", "Focused", "Graceful", "Thankful", "Calm",
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      if (!firebaseUser) return;

      const snap = await getDoc(doc(db, "users", firebaseUser.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserData(data);
        setEditUsername(data.username || "");
        setEditStatusNote(data.statusNote || "");
        setEditSpiritMode(data.spiritStage || "Disciplined");
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

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            setUser(null);
            router.replace("/onboarding");
          } catch { Alert.alert("Error", "Failed to sign out."); }
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!firebaseUser) return;
    if (!editUsername.trim()) { Alert.alert("Error", "Username cannot be empty"); return; }
    try {
      setSaving(true);
      await updateDoc(doc(db, "users", firebaseUser.uid), {
        username: editUsername.trim(),
        statusNote: editStatusNote.trim(),
        spiritStage: editSpiritMode,
        updatedAt: serverTimestamp(),
      });
      setUserData((prev: any) => ({ ...prev, username: editUsername.trim(), statusNote: editStatusNote.trim(), spiritStage: editSpiritMode }));
      setShowEditProfile(false);
    } catch { Alert.alert("Error", "Failed to update profile."); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!firebaseUser?.email) return;
    if (newPassword !== confirmPassword) { Alert.alert("Error", "Passwords do not match"); return; }
    if (newPassword.length < 6) { Alert.alert("Error", "Password must be at least 6 characters"); return; }
    try {
      setSaving(true);
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      setShowPasswordModal(false);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      Alert.alert("Success", "Password updated");
    } catch (err: any) {
      Alert.alert("Error", err.code === "auth/wrong-password" ? "Current password is incorrect" : "Failed to update password.");
    } finally { setSaving(false); }
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "This action is irreversible. All your data will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            if (!firebaseUser) return;
            await updateDoc(doc(db, "users", firebaseUser.uid), { archived: true, updatedAt: serverTimestamp() });
            await firebaseUser.delete();
            setUser(null);
            router.replace("/onboarding");
          } catch { Alert.alert("Error", "Failed to delete account."); }
        },
      },
    ]);
  };

  const level = userData?.level || spiritState?.level || 1;
  const xp = userData?.xp || spiritState?.totalXP || 0;
  const fireStatus = getFireStatus(level);
  const nextLevelXP = getXPForNextLevel(level);
  const progress = getProgressPercentage(xp);

  const settingsItems: SettingsItem[] = [
    { id: "edit-profile", label: "Edit Profile", icon: <Edit3 size={16} color="#fff" />, action: () => setShowEditProfile(true) },
    { id: "change-password", label: "Change Password", icon: <Shield size={16} color="#fff" />, action: () => setShowPasswordModal(true) },
    { id: "about", label: "About Zoe Kingdom", icon: <Info size={16} color="#fff" />, action: () => Alert.alert("Zoe Kingdom", "Version 1.0.0\n\nA spiritual growth app.\n\nPowered by Christ.") },
    { id: "delete", label: "Delete Account", icon: <Trash2 size={16} color="#ef4444" />, action: handleDeleteAccount, danger: true },
  ];

  if (loading) {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        <ActivityIndicator color="white" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: top + 8 }}>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-5">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-lg font-sora-semibold">Profile</Text>
          <Pressable onPress={() => setShowSettings(true)} className="w-9 h-9 rounded-full bg-card-1 items-center justify-center">
            <Settings size={16} color="#fff" />
          </Pressable>
        </View>

        {/* Profile Card */}
        <View className="bg-card-1 rounded-2xl p-5">
          <View className="flex-row items-center">
            <Pressable onPress={() => setShowAvatarPicker(true)} className="relative">
              <Avatar index={userData?.avatar ?? 0} diameter={64} />
              <View className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white/20 items-center justify-center border border-card-1">
                <Camera size={10} color="white" />
              </View>
            </Pressable>
            <View className="ml-4 flex-1">
              <Text className="text-white text-base font-sora-semibold">@{userData?.username || "zoe"}</Text>
              {userData?.statusNote && (
                <Text className="text-zinc-400 text-xs mt-1 font-sora" numberOfLines={1}>{userData.statusNote}</Text>
              )}
              <Text className="text-zinc-500 text-[10px] mt-1 font-sora">{fireStatus.title}</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row mt-5 pt-4 border-t border-white/5">
            {[
              { label: "Level", value: level },
              { label: "XP", value: xp },
              { label: "Streak", value: streak },
              { label: "Today", value: todayCompleted },
            ].map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <View className="w-px bg-white/5" />}
                <View className="flex-1 items-center">
                  <Text className="text-white text-base font-sora-semibold">{stat.value}</Text>
                  <Text className="text-zinc-500 text-[10px] font-sora mt-0.5">{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          {/* XP Bar */}
          <View className="mt-4">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-zinc-500 text-[10px] font-sora">Progress</Text>
              <Text className="text-zinc-500 text-[10px] font-sora">{xp}/{nextLevelXP} XP</Text>
            </View>
            <View className="h-1 bg-card-2 rounded-full overflow-hidden">
              <View className="h-full rounded-full bg-white/60" style={{ width: `${Math.min(progress, 100)}%` }} />
            </View>
          </View>
        </View>

        {/* Quick Access */}
        <Text className="text-zinc-400 text-[11px] font-sora-semibold uppercase tracking-wider mt-8 mb-3">Quick Access</Text>
        <View className="gap-2">
          {[
            { label: "Habits", desc: "Track spiritual disciplines", icon: <Target size={18} color="#818cf8" />, bg: "bg-indigo-500/10", route: "/(tabs)/habits" },
            { label: "The Zoe Network", desc: "Community feed", icon: <Heart size={18} color="#f472b6" />, bg: "bg-pink-500/10", route: "/(tabs)/feed" },
            { label: "Bible", desc: "Read and share scripture", icon: <BookOpen size={18} color="#fbbf24" />, bg: "bg-amber-500/10", route: "/(tabs)/bible" },
          ].map((item) => (
            <Pressable key={item.label} onPress={() => router.push(item.route as any)} className="bg-card-1 rounded-2xl p-4 flex-row items-center">
              <View className={`w-10 h-10 rounded-xl ${item.bg} items-center justify-center`}>{item.icon}</View>
              <View className="flex-1 ml-3">
                <Text className="text-white text-sm font-sora-semibold">{item.label}</Text>
                <Text className="text-zinc-500 text-[10px] font-sora mt-0.5">{item.desc}</Text>
              </View>
              <ChevronRight size={16} color="#444" />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable onPress={handleLogout} className="mt-8 mb-10 rounded-2xl py-3.5 items-center border border-white/5">
          <View className="flex-row items-center">
            <LogOut size={14} color="#ef4444" />
            <Text className="text-red-400 text-xs font-sora-semibold ml-2">Sign Out</Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Settings Modal */}
      <Modal visible={showSettings} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[32px] max-h-[80%]">
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
              <Text className="text-white text-base font-sora-semibold">Settings</Text>
              <Pressable onPress={() => setShowSettings(false)} className="p-1.5"><X size={18} color="#fff" /></Pressable>
            </View>
            <ScrollView className="px-5 pt-4">
              <View className="bg-card-1 rounded-xl overflow-hidden mb-8">
                {settingsItems.map((item, index) => (
                  <Pressable key={item.id} onPress={() => { setShowSettings(false); item.action(); }} className={`flex-row items-center px-4 py-3.5 ${index < settingsItems.length - 1 ? "border-b border-white/5" : ""}`}>
                    <View className={`w-7 h-7 rounded-lg items-center justify-center ${item.danger ? "bg-red-500/10" : "bg-white/5"}`}>{item.icon}</View>
                    <Text className={`flex-1 ml-3 font-sora text-sm ${item.danger ? "text-red-400" : "text-white"}`}>{item.label}</Text>
                    <ChevronRight size={14} color="#444" />
                  </Pressable>
                ))}
              </View>
              <View className="h-8" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal visible={showEditProfile} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[32px] px-5 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-base font-sora-semibold">Edit Profile</Text>
              <Pressable onPress={() => setShowEditProfile(false)} className="p-1.5"><X size={18} color="#fff" /></Pressable>
            </View>
            <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-1.5">Username</Text>
            <TextInput value={editUsername} onChangeText={setEditUsername} placeholder="Your username" placeholderTextColor="#555" className="bg-card-1 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora mb-4" />
            <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-1.5">Status</Text>
            <TextInput value={editStatusNote} onChangeText={setEditStatusNote} placeholder="Share a thought..." placeholderTextColor="#555" multiline className="bg-card-1 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora min-h-[60px] mb-4" />
            <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-2.5">Spiritual Focus</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {SPIRIT_MODES.map((mode) => {
                const selected = editSpiritMode === mode;
                return (
                  <Pressable key={mode} onPress={() => setEditSpiritMode(mode)} className={`px-4 py-2.5 rounded-xl ${selected ? "bg-white" : "bg-card-1"}`}>
                    <Text className={`text-xs font-sora-medium ${selected ? "text-black" : "text-white/70"}`}>{mode}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={handleSaveProfile} disabled={saving} className="bg-white rounded-xl py-3.5 items-center">
              {saving ? <ActivityIndicator color="black" /> : <Text className="text-black text-sm font-sora-semibold">Save Changes</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Avatar Picker Modal */}
      <Modal visible={showAvatarPicker} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#111] rounded-t-[32px] px-5 pt-6 pb-10 max-h-[70%]">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-white text-base font-sora-semibold">Choose Avatar</Text>
              <Pressable onPress={() => setShowAvatarPicker(false)} className="p-1.5"><X size={18} color="#fff" /></Pressable>
            </View>
            <ScrollView>
              <View className="flex-row flex-wrap justify-between">
                {Avatars.map((_, index) => {
                  const selected = (userData?.avatar ?? 0) === index;
                  return (
                    <Pressable key={index} onPress={async () => {
                      if (!firebaseUser) return;
                      try {
                        await updateDoc(doc(db, "users", firebaseUser.uid), { avatar: index, updatedAt: serverTimestamp() });
                        setUserData((prev: any) => ({ ...prev, avatar: index }));
                        setShowAvatarPicker(false);
                      } catch { Alert.alert("Error", "Failed to update avatar"); }
                    }} className={`w-[22%] aspect-square mb-4 rounded-xl items-center justify-center bg-card-1 border ${selected ? "border-white" : "border-transparent"}`}>
                      <Avatar index={index} diameter={55} />
                      {selected && <View className="absolute bottom-1 right-1 bg-white rounded-full p-1"><Check size={10} color="black" /></View>}
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
          <View className="bg-[#111] rounded-t-[32px] px-5 pt-6 pb-10">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-base font-sora-semibold">Change Password</Text>
              <Pressable onPress={() => setShowPasswordModal(false)} className="p-1.5"><X size={18} color="#fff" /></Pressable>
            </View>
            <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-1.5">Current Password</Text>
            <TextInput value={currentPassword} onChangeText={setCurrentPassword} placeholder="Enter current password" placeholderTextColor="#555" secureTextEntry className="bg-card-1 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora mb-4" />
            <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-1.5">New Password</Text>
            <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="Enter new password" placeholderTextColor="#555" secureTextEntry className="bg-card-1 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora mb-4" />
            <Text className="text-zinc-400 text-[10px] font-sora-semibold uppercase tracking-wider mb-1.5">Confirm New Password</Text>
            <TextInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor="#555" secureTextEntry className="bg-card-1 rounded-xl px-4 py-3.5 text-white/90 text-sm font-sora mb-6" />
            <Pressable onPress={handleChangePassword} disabled={saving || !currentPassword || !newPassword || !confirmPassword} className="bg-white rounded-xl py-3.5 items-center">
              {saving ? <ActivityIndicator color="black" /> : <Text className="text-black text-sm font-sora-semibold">Update Password</Text>}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}