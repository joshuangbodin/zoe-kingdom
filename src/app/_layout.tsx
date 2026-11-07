import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavigationThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";

import { ToastProvider } from "@/components/Toast";
import LevelUpModal from "@/components/home/LevelUpModal";
import UpdatesSheet from "@/components/UpdatesSheet";
import HabitNotificationBootstrap from "@/components/reminders/HabitNotificationBootstrap";
import HabitReminderWorker from "@/components/reminders/HabitReminderWorker";
import AppProvider from "@/context/app-context";
import { ThemeProvider, useTheme } from "@/context/theme-context";
import { initDB } from "@/libs/sqlite/db";
import { Stack } from "expo-router";

/** Bridges our theme preference into React Navigation's theme. */
function NavigationThemeBridge({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const navTheme = isDark ? DarkTheme : DefaultTheme;
  return (
    <NavigationThemeProvider value={navTheme}>
      {children}
    </NavigationThemeProvider>
  );
}

export default function TabLayout() {
  // initialize sqlite database
  useEffect(() => {
    initDB();
  }, []);

  // load fonts
  const [loaded, error] = useFonts({
    "Poppins-Regular": require("@/assets/font/Poppins/Poppins-Regular.ttf"),
    "Poppins-Medium": require("@/assets/font/Poppins/Poppins-Medium.ttf"),
    "Poppins-SemiBold": require("@/assets/font/Poppins/Poppins-SemiBold.ttf"),
    "Poppins-Bold": require("@/assets/font/Poppins/Poppins-Bold.ttf"),

    // serif — Cardo (replaces Academy Engraved LET)
    "Cardo_400Regular": require("@/assets/font/Cardo/Cardo_400Regular.ttf"),
    "Cardo_400Regular_Italic": require("@/assets/font/Cardo/Cardo_400Regular_Italic.ttf"),
    "Cardo_700Bold": require("@/assets/font/Cardo/Cardo_700Bold.ttf"),
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
            <HabitReminderWorker />
            <HabitNotificationBootstrap />
            <LevelUpModal />
            <NavigationThemeBridge>
              <BottomSheetModalProvider>
                <UpdatesSheet />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "slide_from_right",
                  }}
                />
              </BottomSheetModalProvider>
            </NavigationThemeBridge>
          </ToastProvider>
        </AppProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
