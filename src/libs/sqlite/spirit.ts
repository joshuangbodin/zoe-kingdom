import { sqlite } from "./db";
import { getLevelFromXP } from "@/constants/levels";
import { emitLevelUp } from "@/libs/levelup/events";

export const getSpiritState = async () => {
  const result = await sqlite.getFirstAsync(
    `SELECT * FROM spirit_state LIMIT 1`
  );

  return result;
};

export const initializeSpirit = async () => {
  const existing = await getSpiritState();

  if (!existing) {
    await sqlite.runAsync(`
      INSERT INTO spirit_state
      (totalXP, level, spiritStage)
      VALUES (0, 1, 'seed')
    `);
  }
};

export const addXP = async (xp: number) => {
  const current: any = await getSpiritState();

  if (!current) return;

  const beforeLevel = getLevelFromXP(current.totalXP);
  const totalXP = current.totalXP + xp;
  const level = getLevelFromXP(totalXP);

  await sqlite.runAsync(
    `UPDATE spirit_state SET totalXP = ?, level = ? WHERE id = ?`,
    [totalXP, level, current.id]
  );

  // Celebrate crossing into a new level (matches the LEVEL N shown in the UI).
  if (level > beforeLevel) {
    emitLevelUp({ level, totalXP });
  }
};
