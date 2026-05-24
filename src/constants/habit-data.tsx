import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";

export const CATEGORIES = [
  {
    id: "prayer",
    label: "Prayer",
    icon: "pray",
    color: "#7C3AED",
  },

  {
    id: "bible",
    label: "Bible",
    icon: "bible",
    color: "#2563EB",
  },

  {
    id: "worship",
    label: "Worship",
    icon: "music",
    color: "#EC4899",
  },

  {
    id: "fasting",
    label: "Fasting",
    icon: "fire",
    color: "#EA580C",
  },

  {
    id: "discipline",
    label: "Discipline",
    icon: "shield-alt",
    color: "#10B981",
  },
];

export const frequencyData = [
  {
    id: "morning",
    label: "Morning",
    icon: "sun",
  },

  {
    id: "evening",
    label: "Evening",
    icon: "moon",
  },

  {
    id: "twice_daily",
    label: "Twice Daily",
    icon: "sync",
  },

  {
    id: "weekly",
    label: "Weekly",
    icon: "calendar",
  },

  {
    id: "throughout_day",
    label: "Anytime",
    icon: "cloud-sun",
  },
];


// CATEGORY ICON
export const getCategoryIcon = (
  cat: string,
  size: number = 18,
  color: string = "#fff"
) => {

  const found =
    CATEGORIES.find(
      (c) => c.id === cat
    );

  return (
    <FontAwesome5
      name={(found?.icon ||
        "sparkles") as any}
      size={size}
      color={color}
      solid
    />
  );
};


// CATEGORY COLOR
export const getCategoryColor = (
  cat: string
) => {

  const found =
    CATEGORIES.find(
      (c) => c.id === cat
    );

  return (
    found?.color || "#ffffff"
  );
};


// CATEGORY LABEL
export const getCategoryLabel = (
  cat: string
) => {

  const found =
    CATEGORIES.find(
      (c) => c.id === cat
    );

  return (
    found?.label || "Habit"
  );
};


// FREQUENCY ICON
export const getFrequencyIcon = (
  frequency: string,
  size: number = 16,
  color: string = "#999"
) => {

  const found =
    frequencyData.find(
      (f) => f.id === frequency
    );

  return (
    <FontAwesome5
      name={(found?.icon ||
        "clock") as any}
      size={size}
      color={color}
      solid
    />
  );
};