/* One-off validator for the story JSON data. Run: node scripts/validate-story.js */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src", "data", "story");
let errors = [];
let total = 0;
const kinds = {};
const charIds = new Set();

const game = JSON.parse(fs.readFileSync(path.join(ROOT, "game.json"), "utf8"));
game.characters.forEach((c) => charIds.add(c.id));
console.log(
  "game.json OK — cost/level:",
  game.energy.costPerLevel,
  "max:",
  game.energy.maxEnergy,
);

for (let i = 1; i <= 6; i++) {
  const p = path.join(ROOT, "chapters", `ch${i}.json`);
  const c = JSON.parse(fs.readFileSync(p, "utf8"));
  total += c.levels.length;
  if (!c.intro || !c.intro.length) errors.push(`${c.id}: no intro`);
  c.levels.forEach((l) => {
    if (!l.id) errors.push("level with no id");
    if (!l.dialogue || !l.dialogue.length) errors.push(`${l.id}: no dialogue`);
    if (!l.mission) errors.push(`${l.id}: no mission`);
    if (!l.puzzle || !l.puzzle.kind) errors.push(`${l.id}: no puzzle kind`);
    if (l.cost !== 2) errors.push(`${l.id}: cost is ${l.cost}, expected 2`);
    if (!l.reward) errors.push(`${l.id}: no reward`);
    l.dialogue.forEach((d, di) => {
      if (!charIds.has(d.who))
        errors.push(`${l.id} beat ${di}: unknown speaker '${d.who}'`);
      if (!d.text) errors.push(`${l.id} beat ${di}: empty text`);
    });
    const k = l.puzzle.kind;
    kinds[k] = (kinds[k] || 0) + 1;
    if (k === "blanks") {
      const blanks = (l.puzzle.verse.match(/____/g) || []).length;
      if (blanks !== l.puzzle.answer.length)
        errors.push(
          `${l.id}: ${blanks} blanks but ${l.puzzle.answer.length} answers`,
        );
      const uniq = new Set(l.puzzle.bank);
      if (uniq.size !== l.puzzle.bank.length)
        errors.push(`${l.id}: duplicate words in bank`);
      l.puzzle.answer.forEach((a) => {
        if (!l.puzzle.bank.includes(a))
          errors.push(`${l.id}: answer '${a}' missing from bank`);
      });
    }
    if (k === "crossword") {
      l.puzzle.clues.forEach((cl, ci) => {
        if (!cl.answer || !cl.clue) errors.push(`${l.id} clue ${ci}: malformed`);
      });
    }
    if (k === "wordsearch") {
      l.puzzle.words.forEach((w) => {
        if (w !== w.toUpperCase()) errors.push(`${l.id}: '${w}' not uppercase`);
      });
    }
    if (k === "order") {
      const a = [...l.puzzle.items].sort().join("|");
      const b = [...l.puzzle.correctOrder].sort().join("|");
      if (a !== b) errors.push(`${l.id}: items and correctOrder differ`);
      if (l.puzzle.items.length !== new Set(l.puzzle.items).size)
        errors.push(`${l.id}: duplicate items`);
    }
    if (k === "choice") {
      const correct = l.puzzle.options.filter((o) => o.correct).length;
      if (correct !== 1) errors.push(`${l.id}: ${correct} correct options`);
      if (new Set(l.puzzle.options.map((o) => o.label)).size !== l.puzzle.options.length)
        errors.push(`${l.id}: duplicate option labels`);
    }
  });
  console.log(
    `ch${i} ${c.title} — ${c.levels.length} levels —`,
    c.levels.map((l) => l.puzzle.kind).join(", "),
  );
}

// Level indexes must be 1..N contiguous.
console.log("TOTAL LEVELS:", total);
console.log("PUZZLE MIX:", JSON.stringify(kinds));
if (errors.length) {
  console.log("\nERRORS:");
  errors.forEach((e) => console.log("  -", e));
  process.exit(1);
}
console.log("\nALL STORY DATA VALID ✓");
