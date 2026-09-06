import { Calendar, Check, Flame, Zap } from "lucide-react-native";
import React from "react";

export const iconFor = (name: string, size: number, color: string) => {
  switch (name) {
    case "Flame":
      return <Flame size={size} color={color} />;
    case "Check":
      return <Check size={size} color={color} />;
    case "Calendar":
      return <Calendar size={size} color={color} />;
    default:
      return <Zap size={size} color={color} />;
  }
};