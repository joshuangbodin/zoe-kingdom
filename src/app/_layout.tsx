import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { useColorScheme } from "react-native";
import "../global.css";

import { initDB } from "@/libs/sqlite/db";
import { Stack } from "expo-router";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // initialize sqlite database
  useEffect(() => {
    initDB();
  }, []);


  // load fonts
  const [loaded, error] = useFonts({
    "Sora-Regular": require("@/assets/font/Sora/Sora-Regular.ttf"),
    "Sora-Medium": require("@/assets/font/Sora/Sora-Medium.ttf"),
    "Sora-SemiBold": require("@/assets/font/Sora/Sora-SemiBold.ttf"),
    "Sora-Bold": require("@/assets/font/Sora/Sora-Bold.ttf"),

    // serif
    "Serif-Regular": require("@/assets/font/Serif/NotoSerif-Regular.ttf"),
    "Serif-Italic": require("@/assets/font/Serif/NotoSerif-Italic.ttf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
