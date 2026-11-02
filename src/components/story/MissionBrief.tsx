
import React from "react";
import { Pressable, Text, View } from "react-native";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Users,
  Zap,
} from "lucide-react-native";

import {
  CHARACTERS,
  getCharacter,
  type DialogueBeat,
  type SpeakerId,
  type StoryLevel,
} from "@/data/story";

export const puzzleLabel = (kind: string): string =>
  ({
    blanks: "Complete the Verses",
    choice: "Choose the Response",
    order: "Rebuild the Promise",
    crossword: "Crossword Lattice",
    memory: "Verse Memory",
  })[kind] ?? kind;

const castOf = (dialogue: DialogueBeat[]): SpeakerId[] => {
  const seen: SpeakerId[] = [];

  dialogue.forEach((beat) => {
    if (!seen.includes(beat.who) && CHARACTERS[beat.who]) {
      seen.push(beat.who);
    }
  });

  return seen;
};

export default function MissionBrief({
  level,
  accent,
  dialogue,
  onBegin,
}: {
  level: StoryLevel;
  accent: string;
  dialogue: DialogueBeat[];
  onBegin: (level: StoryLevel) => void;
}) {
  const cast = castOf(dialogue);

  return (
    <View className="mb-5">
      {/* mission card */}
      <View
        className="rounded-t-3xl overflow-hidden  mb-5"
        style={{
          backgroundColor: accent + "0D",
          borderColor: accent + "35",
        }}
      >
        <View className="p-5">
          <View className="flex-row items-center justify-between mb-5">
            <View className="flex-row items-center">
              

              <View>
                <Text
                  className="text-xs font-sora-medium "
                  style={{ color: accent }}
                >
                  Mission Brief
                </Text>
                <Text className="text-tertiary font-sora mt-0.5">
                  Your Next Assignment
                </Text>
              </View>
            </View>

           
          </View>

          <View
            className="w-8 h-0.75 rounded-full mb-4"
            style={{ backgroundColor: accent }}
          />

          <Text className="text-primary text-[19px] font-sora-semibold leading-7.25">
            {level.mission}
          </Text>

          <View
            className="mt-6 pt-4 border-t"
            style={{ borderColor: accent + "25" }}
          >
            <Text className="text-primary/80 text-xs font-sora-medium mb-3">
              Mission Details
            </Text>

            <View className="flex-row items-center">
              <View className="flex-1 flex-row items-center">
                <View
                  className="w-8 h-8 rounded-xl items-center justify-center mr-2"
                  style={{ backgroundColor: "#F59E0B18" }}
                >
                  <Zap size={15} color="#F59E0B" fill="#F59E0B" />
                </View>

                <View>
                  <Text className="text-primary text-[12px] font-sora-bold">
                    {level.cost}
                  </Text>
                  <Text className="text-tertiary text-[9px] font-sora">
                    Energy cost
                  </Text>
                </View>
              </View>

             
              <View className="items-end">
                <Text className="text-emerald-500 text-[16px] font-sora-bold">
                  +{level.reward}
                </Text>
                <Text className="text-tertiary text-[9px] font-sora">
                  XP reward
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* scene cast */}
      {cast.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            
            <Text className="text-primary/80  text-xs font-sora-medium ml-2">
              Your Companions
            </Text>
          </View>

          <View className="flex-row flex-wrap" style={{ gap: 9 }}>
            {cast.map((id) => {
              const character = getCharacter(id);

              return (
                <View
                  key={id}
                  className="flex-row items-center rounded-full py-2 pl-2 pr-3 "
                  style={{
                    backgroundColor: character.tint,
                    
                  }}
                >
                  <View
                    className="w-8 h-8 rounded-xl items-center justify-center"
                    style={{ backgroundColor: character.tint + "22" }}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {character.emoji}
                    </Text>
                  </View>

                  <Text className="text-white text-[11px] font-sora-semibold ml-2">
                    {character.name}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* begin mission */}
      <Pressable
        onPress={() => onBegin(level)}
        style={({ pressed }) => ({
          backgroundColor: accent,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        })}
        className="rounded-2xl min-h-14.5 flex-row items-center justify-center px-5"
      >
        <Text className="text-white text-[14px] font-sora-semibold ">
          Begin Mission
        </Text>

      
      </Pressable>

      <View className="flex-row items-center justify-center mt-3">
        <CheckCircle2 size={11} color="#969B90" />
        <Text className="text-primary/80 text-[10px] font-sora ml-1.5">
          {level.cost} energy will be spent when you finish the puzzle
        </Text>
      </View>
    </View>
  );
}
