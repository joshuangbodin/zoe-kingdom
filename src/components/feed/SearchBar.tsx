import React from "react";
import { View, TextInput } from "react-native";
import { Search } from "lucide-react-native";

export interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({ placeholder = "Search Scripture, interest or thought" }: SearchBarProps) {
  return (
    <View className="mt-6 bg-card-1 rounded-xl px-5 py-4 flex-row items-center">
      <Search color="#888" size={24} />

      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#888"
        className="ml-4 flex-1 text-white text-sm"
      />
    </View>
  );
}
