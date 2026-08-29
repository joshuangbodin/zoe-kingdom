import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import "../global.css";

import AppProvider from "@/context/app-context";
import { ThemeProvider, useTheme } from "@/context/theme-context";
import { ToastProvider } from "@/components/Toast";
import { initDB } from "@/libs/sqlite/db";
import { Stack } from "expo-router";

/** Bridges our theme preference into React Navigation's theme. */
function NavigationThemeBridge({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isDark } = useTheme();
  const navTheme = isDark ? DarkTheme : DefaultTheme;
  return (
    <NavigationThemeProvider value={navTheme}>{children}</NavigationThemeProvider>
  );
}

export default function TabLayout() {
  // initialize sqlite database
  useEffect(() => {
    initDB();
  }, []);

  // load fonts
  const [loaded, error] = useFonts({
    "Geist-Regular": require("@/assets/font/Geist/Geist-Regular.ttf"),
    "Geist-Medium": require("@/assets/font/Geist/Geist-Medium.ttf"),
    "Geist-SemiBold": require("@/assets/font/Geist/Geist-SemiBold.ttf"),
    "Geist-Bold": require("@/assets/font/Geist/Geist-Bold.ttf"),

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppProvider>
          <ToastProvider>
            <NavigationThemeBridge>
              <BottomSheetModalProvider>
                <Stack screenOptions={{ headerShown: false }} />
              </BottomSheetModalProvider>
            </NavigationThemeBridge>
          </ToastProvider>
        </AppProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
