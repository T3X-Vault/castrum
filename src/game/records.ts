import type { GameState } from "./sim";

const RUN_KEY = "castrum-run-v1";
const SCORES_KEY = "castrum-scores-v1";
const MERIT_KEY = "castrum-merit-v1";
/** Cleared waves across games. A few full watches fill the bar. */
export const MERIT_WAVES = 36;
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

const SLOTS_KEY = "castrum-slots-v1";
export const SLOT_IDS = [1, 2, 3, 4] as const;

export type SlotRecord = {
  id: number;
  name: string;
  at: number;
  run: SavedRun;
};

function asRun(value: unknown): SavedRun | null {
  if (!value || typeof value !== "object") return null;
  const parsed = value as Partial<SavedRun>;
  if (parsed.version !== 1 || !isState(parsed.state) || parsed.state.outcome !== "play") return null;
  const speed = parsed.speed === 2 || parsed.speed === 3 ? parsed.speed : 1;
  return { version: 1, state: parsed.state, speed, paused: Boolean(parsed.paused) };
}

function readSlots(): SlotRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SlotRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((row) => {
      const run = asRun(row?.run);
      if (!run || typeof row.id !== "number" || !SLOT_IDS.includes(row.id as (typeof SLOT_IDS)[number])) return [];
      const name = typeof row.name === "string" && row.name.trim() ? row.name.trim().slice(0, 18) : `Slot ${row.id}`;
      return [{ id: row.id, name, at: typeof row.at === "number" ? row.at : 0, run }];
    });
  } catch {
    return [];
  }
}

function storeSlots(slots: SlotRecord[]) {
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

export function listSlots(): SlotRecord[] {
  return readSlots().sort((a, b) => a.id - b.id);
}

export function readSlot(id: number): SlotRecord | null {
  return readSlots().find((slot) => slot.id === id) ?? null;
}

export function saveSlot(id: number, run: SavedRun, name: string): string | null {
  if (!SLOT_IDS.includes(id as (typeof SLOT_IDS)[number])) return null;
  const kept = name.replace(/\s+/g, " ").trim().slice(0, 18) || `Slot ${id}`;
  const next = readSlots().filter((slot) => slot.id !== id);
  next.push({ id, name: kept, at: Date.now(), run });
  try {
    storeSlots(next);
    writeRun(run);
  } catch {
    return null;
  }
  return kept;
}

export function deleteSlot(id: number) {
  const next = readSlots().filter((slot) => slot.id !== id);
  try {
    storeSlots(next);
    const newest = next.sort((a, b) => b.at - a.at)[0];
    if (newest) writeRun(newest.run);
    else clearRun();
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

export type Merit = { waves: number; claimed: boolean; percent: number };

function meritPercent(waves: number): number {
  return Math.max(0, Math.min(100, Math.floor((waves / MERIT_WAVES) * 100)));
}

export function readMerit(): Merit {
  if (typeof localStorage === "undefined") return { waves: 0, claimed: false, percent: 0 };
  try {
    const parsed = JSON.parse(localStorage.getItem(MERIT_KEY) ?? "") as Partial<Merit>;
    const waves = Math.max(0, Math.min(MERIT_WAVES, Math.round(Number(parsed.waves) || 0)));
    const claimed = Boolean(parsed.claimed);
    return { waves, claimed, percent: claimed ? 100 : meritPercent(waves) };
  } catch {
    return { waves: 0, claimed: false, percent: 0 };
  }
}

export function noteWaveCleared(): Merit {
  const current = readMerit();
  if (current.claimed || current.waves >= MERIT_WAVES) return current;
  const next = { waves: current.waves + 1, claimed: false, percent: meritPercent(current.waves + 1) };
  try {
    localStorage.setItem(MERIT_KEY, JSON.stringify({ waves: next.waves, claimed: false }));
  } catch {
    return current;
  }
  return next;
}

export function markMeritClaimed(): Merit {
  const current = readMerit();
  const next = { waves: MERIT_WAVES, claimed: true, percent: 100 };
  try {
    localStorage.setItem(MERIT_KEY, JSON.stringify({ waves: MERIT_WAVES, claimed: true }));
  } catch {
    return current;
  }
  return next;
}
