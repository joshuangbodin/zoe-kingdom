import React, { createContext, useCallback, useContext, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { useEffect, useRef } from "react";

/* ---------------------------- TYPES ---------------------------- */

type ToastType = "success" | "error" | "info";

type ToastMessage = {
  id: string;
  text: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (text: string, type?: ToastType) => void;
};

/* ---------------------------- CONTEXT ---------------------------- */

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

/* ---------------------------- TOAST PROVIDER ---------------------------- */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((text: string, type: ToastType = "info") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, text, type }]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "#10B981";
      case "error":
        return "#EF4444";
      case "info":
        return "#6366F1";
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container */}
      <View className="absolute top-16 left-4 right-4 z-[9999] gap-2">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            color={getToastColor(toast.type)}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

/* ---------------------------- TOAST ITEM ---------------------------- */

function ToastItem({
  toast,
  color,
  onDismiss,
}: {
  toast: ToastMessage;
  color: string;
  onDismiss: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY }] }}
    >
      <Pressable
        onPress={onDismiss}
        className="flex-row items-center rounded-2xl px-5 py-4 shadow-lg"
        style={{ backgroundColor: color + "E6" }}
      >
        <View className="w-2 h-2 rounded-full bg-white/60 mr-3" />
        <Text className="text-white text-xs font-sora-semibold flex-1 leading-5">
          {toast.text}
        </Text>
        <Pressable onPress={onDismiss} className="ml-2">
          <Text className="text-white/60 text-[10px] font-sora">Dismiss</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}