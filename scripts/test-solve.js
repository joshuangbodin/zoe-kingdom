/* Reproduce the solve path against a real SQLite DB. Run: node scripts/test-solve.js */
const path = require("path");
const fs = require("fs");
const Module = require("module");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, ".puzzletest");

// Resolve "@/..." like Metro does.
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) {
    const rel = request.slice(2);
    for (const c of [
      path.join(OUT, rel),
      path.join(OUT, rel + ".js"),
      path.join(OUT, rel, "index.js"),
    ]) {
      try {
        return originalResolve.call(this, c, ...rest);
      } catch {}
    }
  }
  return originalResolve.call(this, request, ...rest);
};

// Stub expo-sqlite so story.ts can load outside React Native.
const dbPath = path.join(ROOT, ".puzzletest", "test.db");
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const store = {
  energy: [{ id: 1, energy: 30, lastSeen: null }],
  progress: [],
  spirit: [{ id: 1, totalXP: 0, level: 1, spiritStage: "seed" }],
};

const fake = {
  execAsync: async () => {},
  runAsync: async (sql, params = []) => {
    if (/INSERT OR IGNORE INTO story_energy/.test(sql)) return;
    if (/UPDATE story_energy SET energy/.test(sql)) {
      store.energy[0] = { id: 1, energy: params[0], lastSeen: params[1] };
      return;
    }
    if (/INSERT OR REPLACE INTO story_progress/.test(sql)) {
      store.progress.push({
        nodeId: params[0],
        chapterId: params[1],
        xpEarned: params[2],
        stars: params[3],
        mistakes: params[4],
        hintsUsed: params[5],
        completedAt: params[6],
      });
      return;
    }
    if (/UPDATE story_progress SET stars/.test(sql)) {
      const row = store.progress.find((r) => r.nodeId === params[3]);
      if (row) row.stars = params[0];
      return;
    }
    if (/UPDATE spirit_state/.test(sql)) {
      store.spirit[0] = { id: 1, totalXP: params[0], level: params[1] };
      return;
    }
  },
  getAllAsync: async (sql) => {
    if (/FROM story_progress/.test(sql))
      return store.progress.map((r) => ({ ...r }));
    if (/table_info/.test(sql))
      return [
        { name: "nodeId" },
        { name: "chapterId" },
        { name: "xpEarned" },
        { name: "stars" },
        { name: "mistakes" },
        { name: "hintsUsed" },
        { name: "completedAt" },
      ];
    return [];
  },
  getFirstAsync: async (sql, params = []) => {
    if (/FROM story_energy/.test(sql)) return { ...store.energy[0] };
    if (/FROM story_progress WHERE nodeId/.test(sql))
      return store.progress.find((r) => r.nodeId === params[0]);
    if (/FROM story_progress/.test(sql)) return store.progress[0];
    if (/SUM\(stars\)/.test(sql))
      return { total: store.progress.reduce((a, r) => a + (r.stars || 0), 0) };
    if (/FROM spirit_state/.test(sql)) return { ...store.spirit[0] };
    return null;
  },
};

const expoSqlite = require.resolve("expo-sqlite", { paths: [ROOT] });
require.cache[expoSqlite] = {
  id: expoSqlite,
  filename: expoSqlite,
  loaded: true,
  exports: { openDatabaseSync: () => fake },
};

const story = require(path.join(OUT, "libs/sqlite/story"));
const puzzles = require(path.join(OUT, "libs/puzzles/index"));
const data = require(path.join(OUT, "data/story/index"));
const { LEVELS } = data;
const { buildSession, gradeSession } = puzzles;

let failures = 0;
const check = (name, fn) => {
  try {
    fn();
    console.log("  ok  ", name);
  } catch (e) {
    failures++;
    console.log("  FAIL", name, "->", e.message);
  }
};

(async () => {
  console.log("\n=== SOLVE PATH ===");

  // Reset the balance so each level can be afforded.
  store.energy[0].energy = 30;

  for (const level of LEVELS) {
    // Keep the balance topped up so this test exercises the SOLVE path rather
    // than the energy gate (which is covered by its own assertions below).
    store.energy[0].energy = 30;
    const label = `${level.id} (${level.puzzle.kind})`;
    let res;
    try {
      res = await story.solveNode(level, { mistakes: 0, hintsUsed: 0 });
    } catch (e) {
      failures++;
      console.log(`  FAIL ${label} threw ->`, e.message);
      continue;
    }
    if (!res || res.ok !== true) {
      failures++;
      console.log(`  FAIL ${label} -> not ok`, JSON.stringify(res));
      continue;
    }
    if (res.stars < 1 || res.stars > 3) {
      failures++;
      console.log(`  FAIL ${label} -> stars ${res.stars}`);
    }
    console.log(
      `  ok   ${label}  stars=${res.stars} xp=${res.reward} energy=${res.energyLeft}`,
    );
  }

  console.log("\n=== REPLAY (should not throw, no double XP) ===");
  check("replay level 1 does not throw", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    story.solveNode(LEVELS[0], { mistakes: 0, hintsUsed: 0 });
  });
  const replay = await story.solveNode(LEVELS[0], { mistakes: 0, hintsUsed: 0 });
  check("replay awards 0 XP", () => {
    if (replay.reward !== 0) throw new Error(`got ${replay.reward}`);
  });

  console.log("\n=== STAR MAP ===");
  const starMap = await story.getStarsByNode();
  check("star map has all 30 levels", () => {
    if (Object.keys(starMap).length !== LEVELS.length)
      throw new Error(`${Object.keys(starMap).length}/${LEVELS.length}`);
  });
  check("every star value is 1..3", () => {
    Object.values(starMap).forEach((v) => {
      if (v < 1 || v > 3) throw new Error(`got ${v}`);
    });
  });

  console.log("\n=== SESSION BUILD + GRADE (all 30) ===");
  for (const level of LEVELS) {
    try {
      const s = buildSession(level);
      gradeSession(s);
      console.log(`  ok   ${level.id} session built`);
    } catch (e) {
      failures++;
      console.log(`  FAIL ${level.id} ->`, e.message);
    }
  }

  console.log("\n================================");
  console.log(failures ? `FAILURES: ${failures}` : "SOLVE PATH OK");
  process.exit(failures ? 1 : 0);
})();
