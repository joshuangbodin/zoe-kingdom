import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { getYearContributions } from "../libs/sqlite/contributions";

const COLORS = {
  0: "#e5e7eb",
  1: "#bbf7d0",
  2: "#86efac",
  3: "#22c55e",
  4: "#15803d",
} as any;

export default function ContributionGraph() {
  const [year, setYear] = useState(2026);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, [year]);

  const load = async () => {
    const res = await getYearContributions(year);
    setData(res);
  };

  // split into weeks (7 columns like GitHub)
  const weeks: any[][] = [];

  for (let i = 0; i < data.length; i += 7) {
    weeks.push(data.slice(i, i + 7));
  }

  return (
    <View className="mt-6">

      {/* HEADER */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="font-bold text-lg">
          Contribution Graph
        </Text>

        <View className="flex-row gap-2">
          <Pressable onPress={() => setYear(year - 1)}>
            <Text className="text-gray-500">◀</Text>
          </Pressable>

          <Text className="font-semibold">{year}</Text>

          <Pressable onPress={() => setYear(year + 1)}>
            <Text className="text-gray-500">▶</Text>
          </Pressable>
        </View>
      </View>

      {/* GRID */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {weeks.map((week, i) => (
          <View key={i} style={{ flexDirection: "column", marginRight: 3 }}>
            {week.map((day, j) => (
              <View
                key={j}
                style={{
                  width: 10,
                  height: 10,
                  marginBottom: 3,
                  borderRadius: 2,
                  backgroundColor: COLORS[day.level],
                }}
              />
            ))}
          </View>
        ))}
      </View>

    </View>
  );
}