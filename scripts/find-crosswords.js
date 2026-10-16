/* Find crossword word sets that fully interlock. Run: node scripts/find-crosswords.js */
const path = require("path");
const OUT = path.join(__dirname, "..", ".puzzletest");
const cw = require(path.join(OUT, "libs/puzzles/crossword"));

const groups = {
  "ch5 Philippians": [
    ["NOTHING", "PRAYER", "PEACE", "GOD", "MINDS"],
    ["NOTHING", "PRAYER", "PEACE", "HEART", "KEEP"],
    ["PRAYER", "PEACE", "HEART", "MIND", "KEEP"],
    ["PRAYER", "HEART", "KEEP", "PEACE", "HOPE"],
    ["NOTHING", "PRAYER", "PEACE", "HEART", "ART"],
    ["PRAYER", "PEACE", "HEART", "THANK", "PEER"],
    ["NOTHING", "PRAYER", "HEART", "MERCY", "ART"],
    ["PRAYER", "HEART", "PEACE", "MERCY", "NAME"],
  ],
};

Object.entries(groups).forEach(([name, sets]) => {
  console.log(`\n--- ${name} ---`);
  sets.forEach((set, i) => {
    const clues = set.map((w) => ({ clue: "x", answer: w }));
    const g = cw.buildCrossword(clues, `probe-${name}-${i}`);
    const ok = g.clues.length === set.length;
    console.log(`${ok ? "OK  " : "PART"} ${JSON.stringify(set)} -> ${g.clues.length}/${set.length}  ${g.rows}x${g.cols}`);
    if (ok)
      console.log("     " + g.cells.map((r) => r.map((c) => c.solution ?? ".").join("")).join("\n     "));
  });
});
