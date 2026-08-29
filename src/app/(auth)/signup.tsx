import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";
import { ArrowRight, Check, ChevronLeft } from "lucide-react-native";

import Avatar from "@/components/Avatar";
import { Avatars } from "@/constants/avatar";
import { useApp } from "@/context/app-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SPIRIT_MODES = [
  "Disciplined",
  "Prayerful",
  "Focused",
  "Graceful",
  "Thankful",
  "Calm",
];

export default function SignUp() {
  const { user, updateUser } = useApp();
  const top = useSafeAreaInsets().top;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [spiritMode, setSpiritMode] = useState("Disciplined");
  const [avatar, setAvatar] = useState(user?.avatar ?? 0);
  const [avatarModal, setAvatarModal] = useState(false);
  const [error, setError] = useState("");

  // Prefill from the Google user the provider already hydrated.
  useEffect(() => {
    if (user) {
      setUsername((prev) => prev || user.username || "");
      setStatusNote((prev) => prev || user.statusNote || "");
      setSpiritMode(user.spiritStage || "Disciplined");
      setAvatar(user.avatar ?? 0);
    }
  }, [user]);

  const handleFinish = async () => {
    if (!username.trim()) {
      setError("Please choose a username to continue.");
      return;
    }

    try {
      setLoading(true);
      await updateUser({
        username: username.trim(),
        avatar,
        spiritStage: spiritMode,
        statusNote: statusNote.trim(),
      });
      router.replace("/(tabs)/home");
    } catch (e) {
      console.error(e);
      setError("Could not save your profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: top + 8 }}>
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-5 mb-2">
        <Pressable
          onPress={() =>
            step > 1 ? setStep(step - 1) : router.replace("/onboarding")
          }
          className="w-10 h-10 rounded-xl bg-card-2 items-center justify-center"
        >
          <ChevronLeft color="white" size={18} />
        </Pressable>

        <Text className="text-primary text-xs font-sora-medium">{step}/3</Text>

        <View className="w-10 h-10" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          <Text className="text-muted text-lg font-sora-bold">
            Finish your <Text className="text-primary">profile</Text>
          </Text>
          <Text className="text-muted text-sm mt-2 leading-5">
            Signed in as {user?.email || "your Google account"}. Tell the
            community who you are.
          </Text>

          {/* STEP 1 — AVATAR + USERNAME */}
          {step === 1 && (
            <View className="mt-10">
              <Text className="text-primary text-sm font-sora-semibold">Avatar</Text>
              <Text className="text-muted font-sora text-xs mt-1">
                Choose your identity
              </Text>

              <View className="items-center mt-8">
                <Pressable
                  onPress={() => setAvatarModal(true)}
                  className="w-28 h-28 rounded-full bg-card-2 items-center justify-center"
                >
                  <Avatar diameter={90} index={avatar} />
                </Pressable>
                <Text className="text-primary mt-3 text-sm font-sora-semibold">
                  @{username || "zoe"}
                </Text>
                <Pressable onPress={() => setAvatarModal(true)} className="mt-2">
                  <Text className="text-muted font-sora text-xs">Change avatar</Text>
                </Pressable>

                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Choose a username"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  className="mt-8 bg-card-1 text-primary font-sora rounded-2xl px-4 py-4 w-full text-sm"
                />
              </View>
            </View>
          )}

          {/* STEP 2 — SPIRITUAL FOCUS */}
          {step === 2 && (
            <View className="mt-10">
              <Text className="text-primary text-sm font-sora-semibold">Spiritual Focus</Text>
              <Text className="text-muted text-xs mt-1">Pick what describes your walk</Text>

              <View className="mt-6">
                {SPIRIT_MODES.map((mode) => {
                  const selected = spiritMode === mode;
                  return (
                    <Pressable
                      key={mode}
                      onPress={() => setSpiritMode(mode)}
                      className={`px-4 py-3 rounded-xl mb-3 ${
                        selected ? "bg-white" : "bg-card-1"
                      }`}
                    >
                      <Text className={`text-xs font-sora-medium ${selected ? "text-black" : "text-primary"}`}>
                        {mode}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
          {/* STEP 3 — STATUS NOTE */}
          {step === 3 && (
            <View className="mt-10">
              <Text className="text-primary text-sm font-sora-semibold">Status Note</Text>
              <Text className="text-muted text-xs mt-1">Share a thought or scripture</Text>

              <TextInput
                value={statusNote}
                onChangeText={setStatusNote}
                placeholder="e.g. Trusting God's timing today ✨"
                placeholderTextColor="#666"
                multiline
                className="bg-card-1 text-primary font-sora rounded-2xl px-4 py-4 mt-4 min-h-32 text-sm"
              />

              <View className="bg-card-1 rounded-2xl p-4 mt-5">
                <View className="flex-row items-center">
                  <Avatar index={avatar} />
                  <View className="ml-3">
                    <Text className="text-primary font-sora text-sm">
                      {username || "username"}
                    </Text>
                    <Text className="text-muted text-xs">{spiritMode}</Text>
                  </View>
                </View>
                <Text className="text-primary font-sora text-sm mt-4">
                  {statusNote || "Your status will appear here..."}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {error && (
          <Text className="mx-5 text-red-50 font-sora-semibold text-center py-3 rounded-xl mb-4 bg-red-800">
            {error}
          </Text>
        )}

        <Pressable
          onPress={() => {
            if (step < 3) setStep(step + 1);
            else handleFinish();
          }}
          disabled={loading}
          className="bg-white mx-5 mb-6 rounded-xl h-14 justify-center items-center"
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <View className="flex-row items-center">
              <Text className="text-black text-sm font-sora-bold">
                {step === 3 ? "Create Account" : "Continue"}
              </Text>
              {step !== 3 && (
                <ArrowRight color="black" size={16} style={{ marginLeft: 6 }} />
              )}
            </View>
          )}
        </Pressable>
      </KeyboardAvoidingView>

      {/* AVATAR MODAL */}
      <Modal visible={avatarModal} animationType="slide">
        <View style={{ paddingTop: top + 8 }} className="flex-1 bg-bg px-5">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-primary text-sm font-sora-semibold">Select Avatar</Text>
            <Pressable onPress={() => setAvatarModal(false)}>
              <Text className="text-primary font-sora text-xs">Done</Text>
            </Pressable>
          </View>
          <ScrollView>
            <View className="flex-row flex-wrap justify-between">
              {Avatars.map((_, index) => {
                const selected = avatar === index;
                return (
                  <Pressable
                    key={index}
                    onPress={() => setAvatar(index)}
                    className={`w-[22%] aspect-square mb-4 rounded-xl items-center justify-center bg-card-1 border ${
                      selected ? "border-primary" : "border-transparent"
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
      </Modal>
    </View>
  );
}


