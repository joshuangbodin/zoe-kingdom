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
      title: "Kindled Flame ✨",
      animation: "spark",
    };
  }

  if (level < 10) {
    return {
      title: "Ignited Fire 🔥",
      animation: "oil",
    };
  }

  if (level < 20) {
    return {
      title: "Burning Altar 🔥",
      animation: "fire",
    };
  }

  return {
    title: "Crowned Flame 👑",
    animation: "crown",
  };
};
