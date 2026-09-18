export const getLevelFromXP = (xp: number) => {
  return Math.floor(xp / 50) + 1;
};

export const getXPForNextLevel = (level: number) => {
  return level * 50;
};

export const getCurrentLevelXP = (level: number) => {
  return (level - 1) * 50;
};

export const getProgressPercentage = (xp: number) => {
  const level = getLevelFromXP(xp);

  const currentLevelXP = getCurrentLevelXP(level);

  const nextLevelXP = getXPForNextLevel(level);

  const xpIntoLevel = xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  if (xpNeeded <= 0) return 100;

  const progress = (xpIntoLevel / xpNeeded) * 100;

  return Math.min(progress, 100);
};


export const getFireStatus = (level: number) => {
  if (level < 5) {
    return {
      title: "Kindled",
      animation: "spark",
    };
  }

  if (level < 10) {
    return {
      title: "Ignited",
      animation: "oil",
    };
  }

  if (level < 20) {
    return {
      title: "Burning",
      animation: "fire",
    };
  }

  return {
    title: "Crowned",
    animation: "crown",
  };
};



/**
 * The four Altar Fire stages (spiritual status tiers). Each maps to a bundled
 * Lottie animation and a level requirement.
 */
export type FireStage = {
  title: string;
  animation: "spark" | "oil" | "fire" | "crown";
  minLevel: number;
  nextLevel: number | null;
  requirement: string;
  blurb: string;
};

export const FIRE_STAGES: FireStage[] = [
  {
    title: "Kindled",
    animation: "spark",
    minLevel: 1,
    nextLevel: 5,
    requirement: "Start your journey",
    blurb: "A small flame begins to glow within.",
  },
  {
    title: "Ignited",
    animation: "oil",
    minLevel: 5,
    nextLevel: 10,
    requirement: "Reach Level 5",
    blurb: "The fire takes hold and burns steady.",
  },
  {
    title: "Burning",
    animation: "fire",
    minLevel: 10,
    nextLevel: 20,
    requirement: "Reach Level 10",
    blurb: "Your devotion is a blazing, unquenchable flame.",
  },
  {
    title: "Crowned",
    animation: "crown",
    minLevel: 20,
    nextLevel: null,
    requirement: "Reach Level 20",
    blurb: "The altar fire is crowned in glory.",
  },
];

/** Index into FIRE_STAGES for a level (mirrors getFireStatus tiers). */
export const getFireStageIndex = (level: number): number => {
  if (level >= 20) return 3;
  if (level >= 10) return 2;
  if (level >= 5) return 1;
  return 0;
};
