import { sqlite } from "./db";

export type ContributionDay = {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3;
};

// normalize date
const formatDate = (d: Date) => d.toISOString().split("T")[0];

export const getYearContributions = async (year: number) => {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const logs = await sqlite.getAllAsync<any>(`
    SELECT completedAt
    FROM habit_logs
    WHERE completedAt BETWEEN ? AND ?
  `, [start, end]);

  const map: Record<string, number> = {};

  logs.forEach((log) => {
    const date = log.completedAt.split("T")[0];
    map[date] = (map[date] || 0) + 1;
  });

  const result: ContributionDay[] = [];

  for (let i = 0; i < 365; i++) {
    const date = new Date(year, 0, 1 + i);
    const key = formatDate(date);

    const count = map[key] || 0;

    let level: 0 | 1 | 2 | 3 = 0;

    if (count === 0) level = 0;
    else if (count === 1) level = 1;
    else if (count <= 2) level = 2;
    else level = 3;

    result.push({ date: key, count, level });
  }

  return result;
};