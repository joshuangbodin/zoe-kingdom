/**
 * A real crossword generator.
 *
 * Given a list of `{ clue, answer }` entries it produces a proper crossing grid:
 *
 *  1. Words are placed longest-first (standard crossword practice) with the
 *     first word horizontally in the middle of a generously-sized canvas.
 *  2. Every subsequent word must share at least one letter with an already
 *     placed word and cross it PERPENDICULARLY. We enumerate every legal
 *     intersection (every matching letter pair), score each candidate placement
 *     and keep the best one.
 *  3. A placement is rejected when it would (a) run off the canvas, (b) clash
 *     with a different letter, or (c) run immediately alongside an existing word
 *     without crossing it — that is what separates a crossword from word soup.
 *  4. The canvas is then cropped to the used bounding box and cells are numbered
 *     in reading order (across before down), exactly like a printed puzzle.
 *
 * Grading is per-cell, so the player can type letter by letter and we can tell
 * them how many letters are right — which is what drives the progress bar and
 * the mid-puzzle praise bursts.
 */

import { createRng } from "./rng";

export type CrosswordClue = {
  dir: "across" | "down";
  clue: string;
  answer: string;
  /** 1-based number shown in the grid, assigned during generation. */
  number: number;
  /** Grid position of the answer's first letter (post-crop). */
  row: number;
  col: number;
  /** Index into the generated clue list. */
  id: number;
};

export type CrosswordCell = {
  row: number;
  col: number;
  /** The solution letter, or null for a blocked cell. */
  solution: string | null;
  /** Clue ids that start on this cell (can be both across and down). */
  starts: number[];
  /** Clue id passing through this cell horizontally. */
  acrossId: number | null;
  /** Clue id passing through this cell vertically. */
  downId: number | null;
};

export type CrosswordGrid = {
  rows: number;
  cols: number;
  cells: CrosswordCell[][];
  clues: CrosswordClue[];
};

type Placed = {
  word: string;
  row: number;
  col: number;
  dir: "across" | "down";
  id: number;
};

type Dir = "across" | "down";

const dirVec = (dir: Dir) => (dir === "across" ? { dr: 0, dc: 1 } : { dr: 1, dc: 0 });

export const normalizeWord = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, "");

/** Free canvas allowed around the words before cropping. */
const PAD = 2;

/**
 * Can `word` be placed at (row, col) in `dir` on `board`?
 *
 * `board` is a sparse map keyed `row,col` holding already-placed letters. The
 * rules enforce genuine crossword structure:
 *  - every cell must be in bounds;
 *  - a cell either is empty, or already holds the SAME letter (a real crossing);
 *  - the cells immediately before and after the word must be empty, so words
 *    never abut end-to-end;
 *  - for every cell the word passes through that is NOT a crossing, the cells
 *    perpendicular to the word must be empty, so parallel words never touch.
 */
const canPlace = (
  board: Map<string, string>,
  rows: number,
  cols: number,
  word: string,
  row: number,
  col: number,
  dir: Dir,
): boolean => {
  const { dr, dc } = dirVec(dir);
  const len = word.length;

  // End caps must be empty (no word-butting-word).
  if (board.get(`${row - dr},${col - dc}`)) return false;
  if (board.get(`${row + dr * len},${col + dc * len}`)) return false;

  let crossings = 0;

  for (let i = 0; i < len; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;

    const existing = board.get(`${r},${c}`);
    if (existing) {
      if (existing !== word[i]) return false;
      crossings++;
    } else {
      // Non-crossing cells must not touch a perpendicular neighbour, otherwise
      // two words would sit side by side without interlocking.
      if (board.get(`${r - dc},${c - dr}`)) return false;
      if (board.get(`${r + dc},${c + dr}`)) return false;
    }
  }

  // A crossword word must actually cross something (the seed word is exempt —
  // it is placed directly, never through this function).
  return crossings > 0;
};

const writeWord = (
  board: Map<string, string>,
  word: string,
  row: number,
  col: number,
  dir: Dir,
) => {
  const { dr, dc } = dirVec(dir);
  for (let i = 0; i < word.length; i++) {
    board.set(`${row + dr * i},${col + dc * i}`, word[i]);
  }
};

const countCrossings = (
  board: Map<string, string>,
  word: string,
  row: number,
  col: number,
  dir: Dir,
): number => {
  const { dr, dc } = dirVec(dir);
  let n = 0;
  for (let i = 0; i < word.length; i++) {
    if (board.get(`${row + dr * i},${col + dc * i}`) === word[i]) n++;
  }
  return n;
};

/**
 * Prefer tight, central, heavily-crossed grids. Higher is better.
 */
const scorePlacement = (
  placed: Placed[],
  cand: { row: number; col: number; crossings: number },
  centerRow: number,
  centerCol: number,
): number => {
  const centrality =
    120 -
    (Math.abs(cand.row - centerRow) + Math.abs(cand.col - centerCol));
  const compactness = placed.reduce((acc, p) => {
    const gap = Math.min(
      Math.abs(p.row - cand.row),
      Math.abs(p.col - cand.col),
    );
    return acc + Math.max(0, 25 - gap);
  }, 0);
  return cand.crossings * 70 + centrality + compactness;
};

/**
 * Build the crossword grid for a set of authored clues.
 *
 * The returned `clues` are in reading order (across first, then down, each by
 * number) and each carries the authored `clue` text plus its solved position,
 * so the UI can render a numbered clue list beside the grid.
 *
 * If a word cannot be legally woven in it is skipped rather than forced, so the
 * grid is always a valid crossword even when the authored clues are awkward.
 */
export const buildCrossword = (
  input: { clue: string; answer: string }[],
  seed: string,
): CrosswordGrid => {
  const rng = createRng(seed);

  // Longest first — the classic heuristic that yields the fewest dead words.
  const entries = input
    .map((e, id) => ({ ...e, word: normalizeWord(e.answer), id }))
    .filter((e) => e.word.length >= 2)
    .sort((a, b) => b.word.length - a.word.length || a.id - b.id);

  const totalLen = entries.reduce((s, e) => s + e.word.length, 0);
  const longest = entries.reduce((m, e) => Math.max(m, e.word.length), 0);
  // A canvas sized to the total ink is always roomy enough; we crop after.
  const span = Math.max(longest, Math.ceil(Math.sqrt(totalLen)) + 2) + PAD * 2;
  const rows = span;
  const cols = span;

  const board = new Map<string, string>();
  const placed: Placed[] = [];

  entries.forEach((entry, i) => {
    if (i === 0) {
      // Seed the grid with the longest word, horizontally, dead centre.
      const row = Math.floor(rows / 2);
      const col = Math.max(0, Math.floor((cols - entry.word.length) / 2));
      writeWord(board, entry.word, row, col, "across");
      placed.push({ ...entry, row, col, dir: "across" });
      return;
    }

    const centerRow = Math.floor(rows / 2);
    const centerCol = Math.floor(cols / 2);

    type Cand = { row: number; col: number; dir: Dir; crossings: number };
    const candidates: Cand[] = [];

    // Enumerate every legal perpendicular crossing against all placed words.
    for (const other of placed) {
      const newDir: Dir = other.dir === "across" ? "down" : "across";
      const ov = dirVec(other.dir);

      for (let oi = 0; oi < other.word.length; oi++) {
        const orow = other.row + ov.dr * oi;
        const ocol = other.col + ov.dc * oi;
        // Every offset in the new word carrying the same letter can cross here.
        for (let ni = 0; ni < entry.word.length; ni++) {
          if (entry.word[ni] !== other.word[oi]) continue;
          const row = newDir === "down" ? orow - ni : orow;
          const col = newDir === "across" ? ocol - ni : ocol;
          if (!canPlace(board, rows, cols, entry.word, row, col, newDir)) continue;
          candidates.push({
            row,
            col,
            dir: newDir,
            crossings: countCrossings(board, entry.word, row, col, newDir),
          });
        }
      }
    }

    if (candidates.length === 0) return; // unweavable word: skip, never force it

    // Shuffle first so equal-scoring placements vary per level seed.
    const pool = rng.shuffle(candidates);
    let best = pool[0];
    let bestScore = scorePlacement(placed, pool[0], centerRow, centerCol);
    for (const c of pool) {
      const s = scorePlacement(placed, c, centerRow, centerCol);
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }

    writeWord(board, entry.word, best.row, best.col, best.dir);
    placed.push({ ...entry, row: best.row, col: best.col, dir: best.dir });
  });

  /* ------------------------- Crop to the bounding box ---------------------- */

  let minR = Infinity;
  let minC = Infinity;
  let maxR = -Infinity;
  let maxC = -Infinity;
  for (const key of board.keys()) {
    const [r, c] = key.split(",").map(Number);
    if (r < minR) minR = r;
    if (c < minC) minC = c;
    if (r > maxR) maxR = r;
    if (c > maxC) maxC = c;
  }
  if (!isFinite(minR)) {
    minR = minC = 0;
    maxR = maxC = 0;
  }

  const outRows = maxR - minR + 1;
  const outCols = maxC - minC + 1;

  const cells: CrosswordCell[][] = Array.from({ length: outRows }, (_, r) =>
    Array.from({ length: outCols }, (_, c) => ({
      row: r,
      col: c,
      solution: board.get(`${r + minR},${c + minC}`) ?? null,
      starts: [] as number[],
      acrossId: null as number | null,
      downId: null as number | null,
    })),
  );

  /* -------------------- Number cells in reading order ---------------------- */

  const clues: CrosswordClue[] = [];
  let number = 0;

  for (let r = 0; r < outRows; r++) {
    for (let c = 0; c < outCols; c++) {
      const cell = cells[r][c];
      if (!cell.solution) continue;

      const startsAcross =
        (c === 0 || !cells[r][c - 1].solution) &&
        c + 1 < outCols &&
        !!cells[r][c + 1].solution;
      const startsDown =
        (r === 0 || !cells[r - 1][c].solution) &&
        r + 1 < outRows &&
        !!cells[r + 1][c].solution;

      if (startsAcross || startsDown) {
        number++;
        cell.starts.push(number);
      }

      // Cells reference the CLUE ARRAY INDEX, not the printed number, so a
      // shared cell (one number, two clues) grades each direction separately.
      if (startsAcross) {
        const id = clues.length;
        let len = 0;
        while (c + len < outCols && cells[r][c + len].solution) {
          cells[r][c + len].acrossId = id;
          len++;
        }
        clues.push({
          dir: "across",
          number,
          clue: "",
          answer: "",
          row: r,
          col: c,
          id,
        });
      }

      if (startsDown) {
        const id = clues.length;
        let len = 0;
        while (r + len < outRows && cells[r + len][c].solution) {
          cells[r + len][c].downId = id;
          len++;
        }
        clues.push({
          dir: "down",
          number,
          clue: "",
          answer: "",
          row: r,
          col: c,
          id,
        });
      }
    }
  }

  /* ------ Map authored clue text onto the numbered grid positions ---------- */

  for (const entry of placed) {
    const r = entry.row - minR;
    const c = entry.col - minC;
    const cell = cells[r]?.[c];
    if (!cell?.solution) continue;

    const id = entry.dir === "across" ? cell.acrossId : cell.downId;
    const target = id == null ? undefined : clues[id];
    const authored = input[entry.id];
    if (!target || !authored) continue;
    target.clue = authored.clue;
    target.answer = normalizeWord(authored.answer);
  }

  // Reading order: across clues before down clues, each by number.
  clues.sort((a, b) =>
    a.dir === b.dir ? a.number - b.number : a.dir === "across" ? -1 : 1,
  );

  return { rows: outRows, cols: outCols, cells, clues };
};

/* --------------------------------- Grading -------------------------------- */

export type CrosswordState = {
  /** `entries[y][x]` = the letter the player typed, or "" when empty. */
  entries: string[][];
};

export const createCrosswordState = (grid: CrosswordGrid): CrosswordState => ({
  entries: Array.from({ length: grid.rows }, () =>
    Array.from({ length: grid.cols }, () => ""),
  ),
});

export type CrosswordGrade = {
  /** Fraction 0..1 of fillable cells holding the correct letter. */
  progress: number;
  correctCells: number;
  totalCells: number;
  /** Clue ids every one of whose letters is correct. */
  solvedClues: number[];
  complete: boolean;
};

/**
 * Per-cell grading so the UI can praise partial progress ("3 more letters!")
 * rather than only pass/fail.
 */
export const gradeCrossword = (
  grid: CrosswordGrid,
  state: CrosswordState,
): CrosswordGrade => {
  let total = 0;
  let correct = 0;
  const solved = new Set<number>();
  const tainted = new Set<number>();

  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const sol = grid.cells[r][c].solution;
      if (!sol) continue;
      total++;
      const typed = (state.entries[r]?.[c] ?? "").toUpperCase();
      const isRight = typed === sol;
      if (isRight) correct++;

      const { acrossId, downId } = grid.cells[r][c];
      if (acrossId != null) (isRight ? solved : tainted).add(acrossId);
      if (downId != null) (isRight ? solved : tainted).add(downId);
    }
  }

  return {
    progress: total === 0 ? 0 : correct / total,
    correctCells: correct,
    totalCells: total,
    solvedClues: [...solved].filter((id) => !tainted.has(id)),
    complete: total > 0 && correct === total,
  };
};

/** The cells a clue occupies, in order. */
export const cellsForClue = (
  grid: CrosswordGrid,
  clue: CrosswordClue,
): { row: number; col: number }[] => {
  const { dr, dc } = dirVec(clue.dir);
  const out: { row: number; col: number }[] = [];
  for (let i = 0; ; i++) {
    const r = clue.row + dr * i;
    const c = clue.col + dc * i;
    if (!grid.cells[r]?.[c]?.solution) break;
    out.push({ row: r, col: c });
  }
  return out;
};

/**
 * Fill one clue's letters into a copy of the state. Used by the hint button:
 * the hinted clue's letters light up so the player keeps the rest.
 */
export const applyClueToState = (
  grid: CrosswordGrid,
  state: CrosswordState,
  clueId: number,
): CrosswordState => {
  const clue = grid.clues[clueId];
  if (!clue) return state;
  const next = state.entries.map((row) => [...row]);
  cellsForClue(grid, clue).forEach((cell, i) => {
    next[cell.row][cell.col] = clue.answer[i] ?? "";
  });
  return { entries: next };
};

/** Ids of clues that are still unsolved (for hint selection). */
export const unsolvedClueIds = (
  grid: CrosswordGrid,
  grade: CrosswordGrade,
): number[] =>
  grid.clues.map((c) => c.id).filter((id) => !grade.solvedClues.includes(id));
