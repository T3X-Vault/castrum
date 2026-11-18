import type { TargetMode, TowerKind } from "./balance";

export type Command =
  | { t: "start" }
  | { t: "march"; chapter: number }
  | { t: "wave" }
  | { t: "trailer" }
  | { t: "again" }
  | { t: "camp" }
  | { t: "quit" }
  | { t: "surrender" }
  | { t: "save"; slot: number; name: string }
  | { t: "continue"; slot?: number }
  | { t: "endless" }
  | { t: "pause" }
  | { t: "speed" }
  | { t: "arm"; kind: TowerKind | null }
  | { t: "upgrade" }
  | { t: "sell" }
  | { t: "mode"; mode?: TargetMode }
  | { t: "masonry" }
  | { t: "mute" }
  | { t: "shake" }
  | { t: "manual"; open: boolean }
  | { t: "dismiss" };

const queue: Command[] = [];

export function send(command: Command) {
  queue.push(command);
}

export function drain(): Command[] {
  return queue.splice(0, queue.length);
}