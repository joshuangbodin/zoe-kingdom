import React, { useState } from "react";
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
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Lock,
  Mail,
} from "lucide-react-native";

import Avatar from "@/components/Avatar";
import InputField from "@/components/InputField";
import { Avatars } from "@/constants/avatar";
import { registerUser } from "@/libs/firebase/auth";
import { getFirebaseErrorMessage } from "@/libs/firebase/firebaseErrorMap";
import { updateUserProfile } from "@/libs/firebase/users";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { serverTimestamp } from "firebase/firestore";

const SPIRIT_MODES = [
  "Disciplined",
  "Prayerful",
  "Focused",
  "Graceful",
  "Thankful",
  "Calm",
];

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const getPasswordStrength = (password: string) => {
  let score = 0;

  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score; // 0 - 5
};

export default function SignUp() {
  const [step, setStep] = useState(1);
  const top = useSafeAreaInsets().top;
  const bottom = useSafeAreaInsets().top;

  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const [avatar, setAvatar] = useState(0);
  const [avatarModal, setAvatarModal] = useState(false);

  const [error, setError] = useState("");

  const [spiritMode, setSpiritMode] = useState("Disciplined");

  const emailValid = email.length > 0 && isValidEmail(email);
  const passwordScore = getPasswordStrength(password);

  const handleRegister = async () => {
    if (!email || !password) return;

    try {
      setLoading(true);

      const signedInUser = await registerUser(email, password, username);

      // update user data
      await updateUserProfile(signedInUser.uid, {
        avatar,
        statusNote: statusNote ?? spiritMode,
        lastUploaded: serverTimestamp,
      });

      router.replace("/(tabs)/home");
    } catch (e) {
      setError(getFirebaseErrorMessage(e));

      let et = setTimeout(() => setError(""), 5000);

      return () => clearTimeout(et);
    } finally {
      setLoading(false);
    }
  };

  const canContinue = step < 4;

  return (
    <View
      className="flex-1 bg-bg"
      style={{ paddingTop: top + 8, paddingBottom: bottom + 8 }}
    >
      {/* HEADER */}
      <View className="flex-row items-center justify-between px-5 mb-2">
        <Pressable
          onPress={() => (step > 1 ? setStep(step - 1) : router.back())}
          className="w-10 h-10 rounded-xl bg-card-2 items-center justify-center"
        >
          <ChevronLeft color="white" size={18} />
        </Pressable>

        <Text className="text-white  text-xs font-sora-medium">
          Step {step}/4
        </Text>

        <View className="w-10 h-10" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
          {/* TITLE */}
          <Text className="text-muted  text-lg font-sora-bold">
            Join <Text className="text-white">The Zoe Network</Text>
          </Text>

          <Text className="text-muted text-sm mt-2 leading-5">
            Grow spiritually, share scripture thoughts, and stay connected.
          </Text>

          {/* STEP 1 */}
          {step === 1 && (
            <View className="mt-8">
              <Text className="text-white text-sm mb-4 font-sora-semibold">
                Create your account
              </Text>
              {/* 
              <InputField
                label="Username"
                icon={User}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
              /> */}

              <InputField
                label="Email"
                icon={Mail}
                value={email}
                autoCapitalize={"none"}
                keyboardType="email-address"
                autoCorrect={false}
                onChangeText={setEmail}
                placeholder="Enter your email"
              />

              <InputField
                label="Password"
                icon={Lock}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                secureTextEntry
              />

              {/* VALIDATION FEEDBACK */}
              <View>
                <Text className="text-white text-xs mt-2 font-sora-semibold mb-3">
                  Account Requirements
                </Text>

                {/* EMAIL CHECK */}
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-sora text-muted">
                    Valid email address
                  </Text>
                  <Text
                    className={`text-xs font-sora-medium ${
                      email.length === 0
                        ? "text-gray-400"
                        : emailValid
                          ? "text-green-400"
                          : "text-red-400"
                    }`}
                  >
                    {email.length === 0
                      ? "Pending"
                      : emailValid
                        ? "Valid"
                        : "Invalid"}
                  </Text>
                </View>

                {/* PASSWORD LENGTH */}
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-sora text-muted">
                    At least 6 characters
                  </Text>
                  <Text
                    className={`text-xs font-sora-medium ${
                      password.length === 0
                        ? "text-gray-400"
                        : password.length >= 6
                          ? "text-green-400"
                          : "text-red-400"
                    }`}
                  >
                    {password.length === 0
                      ? "Pending"
                      : password.length >= 6
                        ? "Met"
                        : "Too short"}
                  </Text>
                </View>

                {/* PASSWORD STRENGTH */}
                <View className="mt-2">
                  <Text className="text-xs font-sora text-muted mb-1">
                    Password strength
                  </Text>

                  <View className="flex-row gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <View
                        key={level}
                        className={`flex-1 h-1 rounded-full ${
                          passwordScore >= level
                            ? passwordScore <= 2
                              ? "bg-red-400"
                              : passwordScore <= 3
                                ? "bg-yellow-400"
                                : "bg-green-400"
                            : "bg-gray-700"
                        }`}
                      />
                    ))}
                  </View>

                  <Text className="text-[10px] font-sora text-muted mt-2">
                    {passwordScore <= 2
                      ? "Weak password"
                      : passwordScore <= 3
                        ? "Moderate password"
                        : "Strong password"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <View className="mt-10">
              <Text className="text-white  text-sm font-sora-semibold">
                Avatar
              </Text>

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

                <Text className="text-white mt-3 text-sm font-sora-semibold">
                  @{username || "zoe"}
                </Text>

                <Pressable
                  onPress={() => setAvatarModal(true)}
                  className="mt-2"
                >
                  <Text className="text-muted font-sora text-xs">
                    Change avatar
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <View className="mt-10">
              <Text className="text-white  text-sm font-sora-semibold">
                Spiritual Focus
              </Text>

              <Text className="text-muted text-xs mt-1">
                Pick what describes your walk
              </Text>

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
                      <Text
                        className={`text-xs font-sora-medium ${
                          selected ? "text-black" : "text-white font-sora"
                        }`}
                      >
                        {mode}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <View className="mt-10">
              <Text className="text-white  text-sm font-sora-semibold">
                Status Note
              </Text>

              <Text className="text-muted text-xs mt-1">
                Share a thought or scripture
              </Text>

              <TextInput
                value={statusNote}
                onChangeText={setStatusNote}
                multiline
                placeholder="Walking by faith today..."
                placeholderTextColor="#666"
                className="bg-card-1 text-white font-sora rounded-2xl px-4 py-4 mt-4 min-h-40 text-sm"
              />

              <View className="bg-card-1 rounded-2xl p-4 mt-5">
                <View className="flex-row items-center">
                  <Avatar index={avatar} />
                  <View className="ml-3">
                    <Text className="text-white font-sora text-sm">
                      {username || "username"}
                    </Text>
                    <Text className="text-muted text-xs">{spiritMode}</Text>
                  </View>
                </View>

                <Text className="text-white font-sora text-sm mt-4">
                  {statusNote || "Your status will appear here..."}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* BUTTON */}

        {error && (
          <Text className="mx-5 text-red-50 font-sora-semibold text-center py-3 rounded-xl mb-4  bg-red-800 ">
            {error}
          </Text>
        )}
        <Pressable
          onPress={() => {
            if (step < 4) setStep(step + 1);
            else handleRegister();
          }}
          disabled={loading}
          className="bg-white mx-5 mb-6 rounded-xl h-14 justify-center items-center"
        >
          {loading ? (
            <ActivityIndicator color="black" />
          ) : (
            <View className="flex-row items-center">
              <Text className="text-black text-sm font-sora-bold">
                {step === 4 ? "Create Account" : "Continue"}
              </Text>

              {step !== 4 && (
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
            <Text className="text-white  text-sm font-sora-semibold">
              Select Avatar
            </Text>

            <Pressable onPress={() => setAvatarModal(false)}>
              <Text className="text-primary text-white font-sora text-xs">
                Done
              </Text>
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
      </Modal>
    </View>
  );
}
