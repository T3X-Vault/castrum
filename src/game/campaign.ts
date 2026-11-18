/** A chapter is a zone on the map. Three waves, then the zone is held or lost. */
export const CHAPTER_WAVES = 3;
export const CHAPTER_COUNT = 24;

const MAP_KEY = "castrum-map-v1";

export type Zone = {
  id: number;
  name: string;
  blurb: string;
  x: number;
  y: number;
};

const NAMES: Array<[string, string]> = [
  ["The Ford", "The first water. Raiders test the crossing."],
  ["Reed Bank", "Shields in the reeds. Do not let them form."],
  ["Oak Mile", "The trees hide a second line."],
  ["Shepherd's Rise", "High ground. Their bows reach further."],
  ["Broken Bridge", "The causeway is narrow. So is your time."],
  ["Ash Terrace", "A burned farm. They know this ground."],
  ["Wolf Cut", "A defile. Cavalry want the open end."],
  ["Red Ford", "The water runs dark. Hold the stones."],
  ["Stone Causeway", "Rams fit the road too well."],
  ["Eagle Spur", "The ridge looks down on your gate."],
  ["Night Orchard", "They come between the trees."],
  ["Iron Reeds", "Scale shirts. A light bow is a waste."],
  ["Queen's Mile", "Her standard is seen. She is not on it yet."],
  ["Burnt Villa", "Nothing left to hide behind."],
  ["High Vallum", "The wall is yours only if the road is."],
  ["Elephant Ground", "The big ones need the bolts."],
  ["Twin Banners", "King and queen share a bank."],
  ["Salt Marsh", "Slow ground. Slow enemies. Do not miss."],
  ["Last Bridge", "One span. Everything crosses it."],
  ["Gate of Dusk", "The light goes. The host does not."],
  ["The Queen's Road", "Her riders have learned the way."],
  ["Aquila Hill", "The eagle can see the whole march."],
  ["Both Banks", "They come from the water and the ridge."],
  ["The Far Bank", "Her banner, his banner, and the last gate."],
];

export const ZONES: Zone[] = NAMES.map(([name, blurb], index) => {
  const id = index + 1;
  const t = index / (CHAPTER_COUNT - 1);
  return {
    id,
    name,
    blurb,
    x: 50 + Math.sin(t * Math.PI * 3) * 30,
    y: 6 + t * 88,
  };
});

export function zoneById(id: number): Zone {
  return ZONES[Math.min(CHAPTER_COUNT, Math.max(1, id)) - 1]!;
}

/** Which scripted host this chapter's wave uses. Later zones draw later hosts. */
export function zoneWave(chapter: number, wave: number): number {
  const start = 1 + Math.round(((chapter - 1) / (CHAPTER_COUNT - 1)) * 21);
  return Math.min(CHAPTER_COUNT, start + wave - 1);
}

/** Later chapters hit harder. Chapter 24 is a little more than twice the first. */
export function zoneHardness(chapter: number): number {
  return 1 + (chapter - 1) * 0.055;
}

export function readHeld(): number[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(MAP_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((id) => Number(id))
      .filter((id) => id >= 1 && id <= CHAPTER_COUNT)
      .filter((id, index, all) => all.indexOf(id) === index)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

function writeHeld(ids: number[]) {
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify(ids));
  } catch {
    /* private mode */
  }
}

export function frontier(): number {
  const held = new Set(readHeld());
  for (let id = 1; id <= CHAPTER_COUNT; id++) if (!held.has(id)) return id;
  return CHAPTER_COUNT;
}

export function provinceHeld(): boolean {
  return readHeld().length >= CHAPTER_COUNT;
}

export function holdZone(id: number) {
  const next = new Set(readHeld());
  next.add(id);
  writeHeld([...next].sort((a, b) => a - b));
}

/** A lost march gives the zone back, and the ground you were standing on falls too. */
export function loseZone(id: number): number | null {
  const held = readHeld().filter((zone) => zone !== id);
  const behind = held.filter((zone) => zone < id);
  const dropped = behind.length ? Math.max(...behind) : null;
  writeHeld(dropped == null ? held : held.filter((zone) => zone !== dropped));
  return dropped;
}
