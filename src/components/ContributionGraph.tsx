import React, { useEffect, useMemo, useRef, useState } from "react";

import { Pressable, ScrollView, Text, View } from "react-native";

import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useTheme } from "@/context/theme-context";
import { getYearContributions } from "../libs/sqlite/contributions";

/**
 * Snapchat-yellow intensity scale, tuned per theme so every level reads
 * clearly (intensity increases toward level 4) while the empty cell stays a
 * subtle, visible tint on the current background.
 */
const LIGHT_COLORS: Record<number, string> = {
  0: "rgba(0,0,0,0.05)", // inactive
  1: "#d8c363", // low
  2: "#bfa62f", // medium
  3: "#9e8509", // high
  4: "#7a6300", // peak
};

const DARK_COLORS: Record<number, string> = {
  0: "rgba(255,252,0,0.07)", // inactive
  1: "#5c4a10", // low
  2: "#8a6d10", // medium
  3: "#c2a21e", // high
  4: "#fffc00", // peak — Snapchat yellow
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const CELL_SIZE = 25;
const CELL_GAP = 1;
const WEEK_WIDTH = CELL_SIZE + CELL_GAP;

export default function ContributionGraph() {
  const scrollRef = useRef<ScrollView>(null);
  const { isDark } = useTheme();

  const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;
  const chevronColor = isDark ? "#ffffff" : "#0c0c0c";

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
    if (!data.length) return [];

    const contributionMap: Record<string, any> = {};

    data.forEach((item) => {
      contributionMap[item.date] = item;
    });

    const result: any[][] = [];

    const firstDate = new Date(`${year}-01-01T00:00:00`);
    const lastDate = new Date(`${year}-12-31T00:00:00`);

    // Convert JS weekday:
    // Sunday = 0
    // Monday = 1
    // ...
    //
    // Into:
    // Monday = 0
    // ...
    // Sunday = 6
    const getDayIndex = (date: Date) => {
      return (date.getDay() + 6) % 7;
    };

    // Find Monday containing Jan 1
    const calendarStart = new Date(firstDate);
    calendarStart.setDate(firstDate.getDate() - getDayIndex(firstDate));

    // Find Sunday containing Dec 31
    const calendarEnd = new Date(lastDate);
    calendarEnd.setDate(lastDate.getDate() + (6 - getDayIndex(lastDate)));

    let current = new Date(calendarStart);

    while (current <= calendarEnd) {
      const week: any[] = [];

      for (let i = 0; i < 7; i++) {
        const date = [
          current.getFullYear(),
          String(current.getMonth() + 1).padStart(2, "0"),
          String(current.getDate()).padStart(2, "0"),
        ].join("-");

        week.push(
          contributionMap[date] || {
            date,
            count: 0,
            level: 0,
          },
        );

        current.setDate(current.getDate() + 1);
      }

      result.push(week);
    }

    return result;
  }, [data, year]);

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
          <Text className="text-primary text-sm font-sora-bold">
            Consistency Map
          </Text>
        </View>

        {/* YEAR SWITCHER */}
        <View className="flex-row items-center">
          <Pressable
            onPress={() => setYear(year - 1)}
            className="w-8 h-8 items-center justify-center"
          >
            <ChevronLeft color={chevronColor} />
          </Pressable>

          <Text className="text-primary text-xs font-sora-semibold mx-2">{year}</Text>

          <Pressable
            onPress={() => setYear(year + 1)}
            className="w-8 h-8 items-center justify-center"
          >
            <ChevronRight color={chevronColor} />
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
            <Text key={day} className="text-[10px] font-sora text-muted">
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
                      borderRadius: 3,
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
        <Text className="text-secondary text-xs mr-2">Less</Text>

        {[0, 1, 2, 3, 4].map((level) => (
          <View
            key={level}
            style={{
              width: 18,
              height: 18,
              borderRadius: 3,
              marginHorizontal: 2,
              backgroundColor: COLORS[level],
            }}
          />
        ))}

        <Text className="text-secondary text-xs ml-2">More</Text>
      </View>
    </View>
  );
}
