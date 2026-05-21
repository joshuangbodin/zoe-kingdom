import { View, Text } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "600" }}>
        Zoe Kingdom 👑
      </Text>

      <Text style={{ marginTop: 10 }}>
        Your Spirit Man will appear here
      </Text>
    </View>
  );
}