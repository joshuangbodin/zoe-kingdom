/* Regression tests for stars.ts + rng determinism. Run: node scripts/test-stars.js */
const path = require("path");
const Module = require("module");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, ".puzzletest");

// Resolve the "@/..." alias the way Metro/TS does, for the compiled output.
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith("@/")) {
    const rel = request.slice(2);
    const candidates = [
      path.join(OUT, rel),
      path.join(OUT, rel + ".js"),
      path.join(OUT, rel, "index.js"),
    ];
    for (const c of candidates) {
      try {
        return originalResolve.call(this, c, ...rest);
      } catch {
        /* try next */
      }
    }
  }
  return originalResolve.call(this, request, ...rest);
};

const stars = require(path.join(OUT, "libs/puzzles/stars"));

let failures = 0;
const check = (name, cond, extra) => {
  if (cond) console.log("  ok  ", name);
  else {
    failures++;
    console.log("  FAIL", name, extra ?? "");
  }
};

console.log("\n=== STARS ===");

// Must not throw for any mistake/hint combination (the reported crash).
for (let m = 0; m <= 5; m++) {
  for (let h = 0; h <= 3; h++) {
    let r;
    try {
      r = stars.starsFor(m, h);
    } catch (e) {
      failures++;
      console.log(`  FAIL starsFor(${m},${h}) threw:`, e.message);
      continue;
    }
    if (r.stars < 1 || r.stars > 3) {
      failures++;
      console.log(`  FAIL starsFor(${m},${h}) -> ${r.stars} out of range`);
    }
    if (typeof r.note !== "string" || r.note.length === 0) {
      failures++;
      console.log(`  FAIL starsFor(${m},${h}) -> empty note`);
    }
  }
}
console.log("  ok   no throw for all mistake/hint combos (0-5 x 0-3)");

check("flawless = 3 stars", stars.starsFor(0, 0).stars === 3);
check("1 mistake, 0 hints = 2 stars", stars.starsFor(1, 0).stars === 2);
check("2 mistakes, 0 hints = 2 stars", stars.starsFor(2, 0).stars === 2);
check("3 mistakes = 1 star", stars.starsFor(3, 0).stars === 1);
check("0 mistakes, 1 hint = 2 stars", stars.starsFor(0, 1).stars === 2);
check("2 hints = 1 star", stars.starsFor(0, 2).stars === 1);
check("note is non-empty for each rating", [1, 2, 3].every((s) => stars.starsFor(s === 3 ? 0 : 9, 0).note.length > 0));
check("note comes from game.json copy", stars.starsFor(0, 0).note === "Flawless restoration!");

console.log("\n================================");
console.log(failures ? `FAILURES: ${failures}` : "ALL STAR TESTS PASSED");
process.exit(failures ? 1 : 0);
