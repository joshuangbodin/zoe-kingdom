import React, { useEffect, useMemo, useRef, useState } from "react";

import { Pressable, ScrollView, Text, View } from "react-native";

import { getYearContributions } from "../libs/sqlite/contributions";

// const COLORS: any = {
//   0: "#1f1f1f",
//   1: "#3b2f1d",
//   2: "#8b5e34",
//   3: "#d4a373",
//   4: "#ffd700",
// };

const COLORS: any = {
  0: "#1f1f1f",
  1: "#ffffff40",
  2: "#ffffff60",
  3: "#ffffff80",
  4: "#ffffff",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CELL_SIZE = 16;
const CELL_GAP = 4;
const WEEK_WIDTH = CELL_SIZE + CELL_GAP;

export default function ContributionGraph() {
  const scrollRef = useRef<ScrollView>(null);

  const [year, setYear] = useState(new Date().getFullYear());

  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, [year]);

  const load = async () => {
    const res = await getYearContributions(year);
    setData(res);
  };
  /**
   * Split into week columns
   */
  const weeks = useMemo(() => {
    const grouped: any[][] = [];

    for (let i = 0; i < data.length; i += 7) {
      grouped.push(data.slice(i, i + 7));
    }

    return grouped;
  }, [data]);

  /**
   * Auto-scroll to latest week
   */
  useEffect(() => {
    if (!weeks.length) return;

    /**
     * Find last active week
     */
    let lastActiveWeek = 0;

    weeks.forEach((week, weekIndex) => {
      const hasActivity = week.some((day) => (day.level || 0) > 0);

      if (hasActivity) {
        lastActiveWeek = weekIndex;
      }
    });

    /**
     * Calculate x offset
     */
    const x = lastActiveWeek * (CELL_SIZE + CELL_GAP + 4);

    setTimeout(() => {
      scrollRef.current?.scrollTo({
        x: Math.max(x - 120, 0),
        animated: true,
      });
    }, 100);
  }, [weeks]);

  return (
    <View className="mt-12 ">
      {/* HEADER */}
      <View className="flex-row justify-between items-center mb-5">
        <View>
          <Text className="text-white text-base font-sora-bold">
            Consistency Map
          </Text>

          <Text className="text-muted font-sora text-xs mt-1">
            Your spiritual activity this year
          </Text>
        </View>

        {/* YEAR SWITCHER */}
        <View className="flex-row items-center">
          <Pressable
            onPress={() => setYear(year - 1)}
            className="w-8 h-8 items-center justify-center"
          >
            <Text className="text-gray-400 text-lg">←</Text>
          </Pressable>

          <Text className="text-white font-semibold mx-2">{year}</Text>

          <Pressable
            onPress={() => setYear(year + 1)}
            className="w-8 h-8 items-center justify-center"
          >
            <Text className="text-gray-400 text-lg">→</Text>
          </Pressable>
        </View>
      </View>

      {/* GRAPH AREA */}
      <View className="flex-row">
        {/* DAY LABELS */}
        <View
          style={{
            height: 7 * (CELL_SIZE + CELL_GAP),
          }}
          className="justify-between mr-3"
        >
          {DAYS.map((day) => (
            <Text key={day} className="text-[10px] text-gray-500">
              {day}
            </Text>
          ))}
        </View>

        {/* HORIZONTAL SCROLL */}
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces
        >
          <View className="flex-row">
            {weeks.map((week, weekIndex) => (
              <View
                key={weekIndex}
                style={{
                  marginRight: CELL_GAP,
                }}
              >
                {week.map((day, dayIndex) => (
                  <View
                    key={dayIndex}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      marginBottom: CELL_GAP,
                      borderRadius: 5,
                      backgroundColor: COLORS[day.level || 0],
                    }}
                  />
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* LEGEND */}
      <View className="flex-row items-center justify-end mt-5">
        <Text className="text-gray-500 text-xs mr-2">Less</Text>

        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              marginHorizontal: 2,
              backgroundColor: COLORS[level],
            }}
          />
        ))}

        <Text className="text-gray-500 text-xs ml-2">More</Text>
      </View>
    </View>
  );
}
