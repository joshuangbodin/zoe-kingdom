import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

import { useFocusEffect } from "@react-navigation/native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { useTheme } from "@/context/theme-context";

import { getYearContributions } from "../libs/sqlite/contributions";

const LIGHT_COLORS: Record<number, string> = {
  0: "rgba(0,0,0,0.05)",
  1: "rgba(0,0,0,0.35)",
  2: "rgba(0,0,0,0.65)",
  3: "rgba(0,0,0,1)",
};

const DARK_COLORS: Record<number, string> = {
  0: "rgba(255,255,255,0.05)",
  1: "rgba(255,255,255,0.35)",
  2: "rgba(255,255,255,0.65)",
  3: "#ffffff",
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
  const [scrollWidth, setScrollWidth] = useState(0);

  const load = useCallback(async () => {
    const res = await getYearContributions(year);
    setData(res);
  }, [year]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const weeks = useMemo(() => {
    if (!data.length) return [];

    const contributionMap: Record<string, any> = {};

    data.forEach((item) => {
      contributionMap[item.date] = item;
    });

    const result: any[][] = [];

    const firstDate = new Date(`${year}-01-01T00:00:00`);
    const lastDate = new Date(`${year}-12-31T00:00:00`);

    const getDayIndex = (date: Date) => {
      return (date.getDay() + 6) % 7;
    };

    const calendarStart = new Date(firstDate);

    calendarStart.setDate(firstDate.getDate() - getDayIndex(firstDate));

    const calendarEnd = new Date(lastDate);

    calendarEnd.setDate(lastDate.getDate() + (6 - getDayIndex(lastDate)));

    const current = new Date(calendarStart);

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

  const handleScrollLayout = useCallback((event: LayoutChangeEvent) => {
    setScrollWidth(event.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    if (!weeks.length || !scrollWidth) return;

    let lastActiveWeek = -1;

    weeks.forEach((week, weekIndex) => {
      const hasActivity = week.some((day) => (day.level || 0) > 0);

      if (hasActivity) {
        lastActiveWeek = weekIndex;
      }
    });

    if (lastActiveWeek === -1) return;

    /**
     * Position the most recent active week close to the
     * right side of the visible viewport.
     */
    const targetX = lastActiveWeek * WEEK_WIDTH - scrollWidth + WEEK_WIDTH * 2;

    const maxScrollX = Math.max(weeks.length * WEEK_WIDTH - scrollWidth, 0);

    const x = Math.min(Math.max(targetX, 0), maxScrollX);

    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({
        x,
        animated: true,
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [weeks, scrollWidth]);

  return (
    <View className="mt-12">
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
            className="w-8 h-8 items-center bg-card-1 rounded-l-3xl justify-center"
          >
            <ChevronLeft color={chevronColor} />
          </Pressable>

          <Text className="text-primary text-xs font-sora-semibold mx-2">
            {year}
          </Text>

          <Pressable
            onPress={() => setYear(year + 1)}
            className="w-8 h-8 items-center bg-card-1 rounded-r-3xl justify-center"
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
        <View className="flex-1" onLayout={handleScrollLayout}>
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces
            contentContainerStyle={{
              paddingRight: WEEK_WIDTH,
            }}
          >
            <View className="flex-row">
              {weeks.map((week, weekIndex) => (
                <View
                  key={weekIndex}
                  style={{
                    width: CELL_SIZE,
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
      </View>

      {/* LEGEND */}
      <View className="flex-row items-center justify-end mt-5">
        <Text className="text-secondary text-xs mr-2">Less</Text>

        {[0, 1, 2, 3].map((level) => (
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
