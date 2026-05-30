import { Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import { Pressable, Text, TextInput, TextInputProps, View } from "react-native";

const InputField = ({
  label,
  icon: Icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  ...props
}: TextInputProps & {
  label: string;
  icon: any;
  error?: boolean;
}) => {
  const [hidden, setHidden] = useState(secureTextEntry);

  return (
    <View className="mb-4">
      {/* LABEL */}
      <Text className="text-muted uppercase tracking-wider text-[10px] mb-2 font-sora">
        {label}
      </Text>

      {/* INPUT WRAPPER */}
      <View className="flex-row items-center bg-card-1 rounded-xl px-4 h-14">
        {/* LEFT ICON */}
        <Icon size={16} color="#888" />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#666"
          secureTextEntry={hidden}
          className="flex-1 text-white text-sm ml-3 font-sora"
          //   autoCapitalize="none"
          //   autoCorrect={false}
          //   keyboardType="email-address"
          {...props}
        />

        {/* RIGHT ICON */}
        {secureTextEntry ? (
          <Pressable onPress={() => setHidden(!hidden)}>
            {hidden ? (
              <Eye size={16} color="#888" />
            ) : (
              <EyeOff size={16} color="#888" />
            )}
          </Pressable>
        ) : (
          <View style={{ width: 16 }} />
        )}
      </View>
    </View>
  );
};

export default InputField;
