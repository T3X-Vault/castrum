import type { GameState } from "./sim";

const RUN_KEY = "castrum-run-v1";
const SCORES_KEY = "castrum-scores-v1";
const SCORE_LIMIT = 20;

export type SavedRun = {
  version: 1;
  state: GameState;
  speed: 1 | 2 | 3;
  paused: boolean;
};

export type ScoreRow = {
  name: string;
  gloria: number;
  waves: number;
  result: "victory" | "defeat";
  at: number;
};

function isState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const s = value as GameState;
  return (
    typeof s.gold === "number" &&
    typeof s.fort === "number" &&
    typeof s.fortMax === "number" &&
    typeof s.wave === "number" &&
    typeof s.masonry === "number" &&
    (s.outcome === "play" || s.outcome === "victory" || s.outcome === "defeat") &&
    Array.isArray(s.towers) &&
    Array.isArray(s.enemies) &&
    Array.isArray(s.projectiles) &&
    Array.isArray(s.patches) &&
    Array.isArray(s.schedule)
  );
}

export function loadRun(): SavedRun | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(RUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedRun>;
    if (parsed.version !== 1 || !isState(parsed.state) || parsed.state.outcome !== "play") return null;
    const speed = parsed.speed === 2 || parsed.speed === 3 ? parsed.speed : 1;
    return { version: 1, state: parsed.state, speed, paused: Boolean(parsed.paused) };
  } catch {
    return null;
  }
}

export function hasRun(): boolean {
  return loadRun() != null;
}

export function writeRun(run: SavedRun) {
  try {
    localStorage.setItem(RUN_KEY, JSON.stringify(run));
  } catch {
    /* private mode */
  }
}

export function clearRun() {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    /* private mode */
  }
}

export function loadScores(): ScoreRow[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreRow[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row) =>
          row &&
          typeof row.name === "string" &&
          typeof row.gloria === "number" &&
          (row.result === "victory" || row.result === "defeat"),
      )
      .slice(0, SCORE_LIMIT);
  } catch {
    return [];
  }
}

export function rememberScore(input: { name: string; gloria: number; waves: number; result: "victory" | "defeat" }): ScoreRow | null {
  const name = input.name.replace(/\s+/g, " ").trim().slice(0, 18);
  if (!name) return null;
  const row: ScoreRow = {
    name,
    gloria: Math.max(0, Math.round(input.gloria)),
    waves: Math.max(0, Math.round(input.waves)),
    result: input.result,
    at: Date.now(),
  };
  const next = [row, ...loadScores()].sort((a, b) => b.gloria - a.gloria || b.at - a.at).slice(0, SCORE_LIMIT);
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(next));
  } catch {
    return null;
  }
  return row;
}
