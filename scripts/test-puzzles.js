/* Puzzle engine tests. Run: node scripts/test-puzzles.js */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, ".puzzletest");
const req = (p) => require(path.join(OUT, p));

let failures = 0;
const check = (name, cond, extra) => {
  if (cond) console.log("    ok  ", name);
  else {
    failures++;
    console.log("    FAIL", name, extra === undefined ? "" : `-> ${JSON.stringify(extra)}`);
  }
};

const chapters = [];
for (let i = 1; i <= 6; i++) {
  chapters.push(
    JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "src/data/story/chapters", `ch${i}.json`),
        "utf8",
      ),
    ),
  );
}
const allLevels = chapters.flatMap((c) => c.levels);

/* ------------------------------- CROSSWORD ------------------------------- */
console.log("\n=== CROSSWORD ===");
const cw = req("libs/puzzles/crossword");
const crosswords = allLevels.filter((l) => l.puzzle.kind === "crossword");
console.log(`  ${crosswords.length} levels\n`);

crosswords.forEach((lvl) => {
  const grid = cw.buildCrossword(lvl.puzzle.clues, lvl.id);
  console.log(`  ${lvl.id}  ${grid.rows}x${grid.cols}  ${grid.clues.length} clues`);
  check("every authored clue placed", grid.clues.length === lvl.puzzle.clues.length, {
    got: grid.clues.length,
    want: lvl.puzzle.clues.length,
  });
  check("every clue has text", grid.clues.every((c) => c.clue.length > 0));
  check("every clue has an answer", grid.clues.every((c) => c.answer.length >= 2));

  const spelled = grid.clues.map((cl) => {
    const dr = cl.dir === "down" ? 1 : 0;
    const dc = cl.dir === "across" ? 1 : 0;
    let s = "";
    for (let i = 0; i < cl.answer.length; i++)
      s += grid.cells[cl.row + dr * i]?.[cl.col + dc * i]?.solution ?? "?";
    return s;
  });
  check("grid spells every answer", spelled.every((s, i) => s === grid.clues[i].answer), spelled);
  check(
    "deterministic",
    JSON.stringify(cw.buildCrossword(lvl.puzzle.clues, lvl.id).cells) ===
      JSON.stringify(grid.cells),
  );

  const st = cw.createCrosswordState(grid);
  check("empty grades 0", cw.gradeCrossword(grid, st).progress === 0);
  grid.clues.forEach((cl) => {
    const dr = cl.dir === "down" ? 1 : 0;
    const dc = cl.dir === "across" ? 1 : 0;
    for (let i = 0; i < cl.answer.length; i++)
      st.entries[cl.row + dr * i][cl.col + dc * i] = cl.answer[i];
  });
  const full = cw.gradeCrossword(grid, st);
  check("full solve is complete", full.complete && full.progress === 1);
  check("all clues reported solved", full.solvedClues.length === grid.clues.length, full.solvedClues.length);
  check("hint fills a clue", (() => {
    const after = cw.applyClueToState(grid, cw.createCrosswordState(grid), 0);
    return cw.gradeCrossword(grid, after).progress > 0;
  })());
  console.log(
    "    " + grid.cells.map((r) => r.map((c) => c.solution ?? ".").join("")).join("\n    ") + "\n",
  );
});

/* ------------------------------ WORD SEARCH ------------------------------ */
console.log("=== WORD SEARCH ===");
const wsm = req("libs/puzzles/wordsearch");
const searches = allLevels.filter((l) => l.puzzle.kind === "wordsearch");
console.log(`  ${searches.length} levels\n`);

searches.forEach((lvl) => {
  const size = 11;
  const opts = { diagonal: true, reverse: true };
  const g = wsm.buildWordSearch(lvl.puzzle.words, size, lvl.id, opts);
  console.log(`  ${lvl.id}  ${g.size}x${g.size}`);
  check("all words placed", g.placements.length === lvl.puzzle.words.length, {
    got: g.placements.map((p) => p.word),
    want: lvl.puzzle.words,
  });
  check("grid fully lettered", g.grid.every((r) => r.every((ch) => /^[A-Z]$/.test(ch))));
  check("placements verified on grid", g.placements.every((p) => {
    const v = wsm.verifyWordOnGrid(g.grid, p.word);
    return !!v && v.cells.length === p.word.length;
  }));
  check(
    "placement cells match letters",
    g.placements.every((p) => p.cells.every((c, i) => g.grid[c.row][c.col] === p.word[i])),
  );
  check(
    "deterministic",
    JSON.stringify(wsm.buildWordSearch(lvl.puzzle.words, size, lvl.id, opts).grid) ===
      JSON.stringify(g.grid),
  );
  check("horizontal drag", wsm.cellsForSelection({ row: 0, col: 0 }, { row: 0, col: 3 }).length === 4);
  check("vertical drag", wsm.cellsForSelection({ row: 0, col: 0 }, { row: 3, col: 0 }).length === 4);
  check("diagonal drag", wsm.cellsForSelection({ row: 0, col: 0 }, { row: 3, col: 3 }).length === 4);
  check("reverse diagonal", wsm.cellsForSelection({ row: 3, col: 3 }, { row: 0, col: 0 }).length === 4);
  check("junk drag rejected", wsm.cellsForSelection({ row: 0, col: 0 }, { row: 1, col: 5 }) === null);
  check("sloppy diagonal snaps", wsm.cellsForSelection({ row: 0, col: 0 }, { row: 3, col: 4 }).length === 5);
  check("junk drag rejected", wsm.cellsForSelection({ row: 0, col: 0 }, { row: 1, col: 5 }) === null);
  check("selection spells letters", wsm.selectionWord(g.grid, g.placements[0].cells) === g.placements[0].word);
  console.log("    " + g.grid.map((r) => r.join(" ")).join("\n    ") + "\n");
});

/* -------------------------------- BLANKS -------------------------------- */
console.log("=== BLANKS ===");
const bl = req("libs/puzzles/blanks");
const blanks = allLevels.filter((l) => l.puzzle.kind === "blanks");
console.log(`  ${blanks.length} levels\n`);

blanks.forEach((lvl) => {
  const p = lvl.puzzle;
  const m = bl.buildBlanks(p.verse, p.answer, p.bank, lvl.id);
  const blankCount = (p.verse.match(/____/g) || []).length;
  check("blank count matches answers", m.slotCount === blankCount && m.slotCount === p.answer.length, {
    m: m.slotCount,
    verse: blankCount,
  });
  check("bank has no dupes", new Set(m.bank).size === m.bank.length);
  check("bank contains all answers", p.answer.every((a) => m.bank.includes(a)));
  const g0 = bl.gradeBlanks(m, p.answer.map(() => null));
  check("empty grades 0", g0.progress === 0 && !g0.complete);
  const gFull = bl.gradeBlanks(m, p.answer);
  check("correct grades complete", gFull.complete && gFull.progress === 1);
  const gHalf = bl.gradeBlanks(m, p.answer.map((a, i) => (i === 0 ? a : null)));
  if (p.answer.length > 1)
    check("partial progress is fractional", gHalf.progress > 0 && gHalf.progress < 1, gHalf.progress);
  else check("single-blank solve is complete", gHalf.complete && gHalf.progress === 1);
  check(
    "case-insensitive match",
    bl.gradeBlanks(m, p.answer.map((a) => a.toUpperCase())).complete,
  );
});

console.log("\n================================");
console.log(failures ? `FAILURES: ${failures}` : "ALL PUZZLE ENGINE TESTS PASSED");
process.exit(failures ? 1 : 0);
