import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type RefObject } from "react";
import {
  BookOpen,
  Castle,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Crosshair,
  Flag,
  Flame,
  LogOut,
  Maximize,
  Minimize,
  Pause,
  Play,
  Save,
  Settings,
  Shield,
  Target,
  Volume2,
  VolumeX,
  Vibrate,
  X,
  Zap,
} from "lucide-react";
import { ENEMIES, ENEMY_KINDS, MASONRY, TOWER_KINDS, TOWERS, type TargetMode, type TowerKind } from "@/game/balance";
import { unlockAudio } from "@/game/audio";
import { send, type Command } from "@/game/commands";
import { getHud, subscribeHud } from "@/game/hud";
import { hasRun, loadScores, rememberScore, type ScoreRow } from "@/game/records";
import { WalletDock } from "@/components/WalletDock";

const ICONS: Record<TowerKind, typeof Crosshair> = {
  scorpio: Zap,
  sagittarii: Target,
  cohort: Shield,
  ballista: Crosshair,
  naphtha: Flame,
  onager: CircleDot,
};

const MODES: TargetMode[] = ["first", "last", "near", "strong"];
const MODE_NAME: Record<TargetMode, string> = {
  first: "First",
  last: "Last",
  near: "Near",
  strong: "Strong",
};

function useHud() {
  return useSyncExternalStore(subscribeHud, getHud, getHud);
}

function press(command: Command) {
  unlockAudio();
  send(command);
}

type FullscreenEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
type FullscreenDoc = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function useFullscreen(root: RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const doc = document as FullscreenDoc;
    const el = document.documentElement as FullscreenEl;
    setSupported(Boolean(el.requestFullscreen || el.webkitRequestFullscreen));
    const sync = () => setActive(Boolean(document.fullscreenElement || doc.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, []);

  const toggle = () => {
    const doc = document as FullscreenDoc;
    const current = document.fullscreenElement || doc.webkitFullscreenElement;
    if (current) {
      const exit = document.exitFullscreen?.bind(document) ?? doc.webkitExitFullscreen?.bind(doc);
      void exit?.();
      return;
    }
    const el = (root.current ?? document.documentElement) as FullscreenEl;
    const enter = el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen?.bind(el);
    void Promise.resolve(enter?.()).catch(() => undefined);
  };

  return { active, supported, toggle };
}

export function Castrum() {
  const hud = useHud();
  const [bootError, setBootError] = useState<string | null>(null);
  const [armory, setArmory] = useState(true);
  const [gearOpen, setGearOpen] = useState(false);
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [savedRun, setSavedRun] = useState(false);
  const [leftName, setLeftName] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const screen = useFullscreen(rootRef);
  const fightingRef = useRef(hud.fighting);
  const choosing = !hud.fighting;

  useEffect(() => {
    setScores(loadScores());
    setSavedRun(hasRun());
    if (hud.phase === "playing" || hud.phase === "paused" || hud.phase === "menu") setLeftName("");
  }, [hud.phase]);

  function leaveScore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = hud.phase === "victory" ? "victory" : "defeat";
    if (hud.phase !== "victory" && hud.phase !== "defeat") return;
    const row = rememberScore({
      name: String(new FormData(event.currentTarget).get("name") ?? ""),
      gloria: hud.gloria,
      waves: hud.cleared,
      result,
    });
    if (!row) return;
    setLeftName(row.name);
    setScores(loadScores());
  }

  useEffect(() => {
    const was = fightingRef.current;
    fightingRef.current = hud.fighting;
    if (hud.phase !== "playing" && hud.phase !== "paused") return;
    if (hud.fighting && !was) setArmory(false);
    else if (!hud.fighting && was) setArmory(true);
  }, [hud.fighting, hud.phase]);

  useEffect(() => {
    const gl = document.querySelector<HTMLCanvasElement>("canvas.gl");
    const fx = document.querySelector<HTMLCanvasElement>("canvas.fx");
    const stage = document.querySelector<HTMLElement>(".stage");
    if (!gl || !fx || !stage) return;
    let dead = false;
    let handle: { dispose: () => void } | null = null;
    void import("@/game/runtime")
      .then((mod) => {
        if (dead) return;
        try {
          handle = mod.mountGame(gl, fx, stage);
        } catch (err) {
          setBootError(err instanceof Error ? err.message : "The battlefield failed to open.");
        }
      })
      .catch((err: unknown) => {
        setBootError(err instanceof Error ? err.message : "The battlefield failed to open.");
      });
    return () => {
      dead = true;
      handle?.dispose();
    };
  }, []);

  const gatePct = hud.fortMax > 0 ? Math.max(0, Math.min(100, (hud.fort / hud.fortMax) * 100)) : 0;
  const inMatch = hud.phase === "playing" || hud.phase === "paused";
  const showShop = inMatch && armory;

  return (
    <div className="castrum" ref={rootRef} data-quiet={hud.fighting ? "true" : "false"}>
      {hud.phase !== "menu" && (
        <header className="hud">
          <div className="hud-main">
          <div className="readout">
            <span className="readout-bit">
              <span>Denarii</span>
              <strong className="bump" key={hud.gold}>
                {hud.gold}
              </strong>
            </span>
            <span className="readout-bit gate">
              <span>Gate {hud.fort}</span>
              <span className="gate-bar" aria-hidden="true">
                <span className="gate-fill" style={{ width: `${gatePct}%` }} />
              </span>
            </span>
            <span className="readout-bit">
              <span>Wave</span>
              <strong>{hud.wave === 0 ? "—" : hud.endless ? String(hud.wave) : `${hud.wave}/15`}</strong>
            </span>
            {hud.boss && (
              <span className="readout-bit boss">
                <span>
                  {hud.boss.name} {Math.ceil(hud.boss.hp)}
                </span>
                <span className="gate-bar">
                  <span className="gate-fill" style={{ width: `${Math.max(0, (hud.boss.hp / hud.boss.max) * 100)}%` }} />
                </span>
              </span>
            )}
          </div>
          <div className="hud-marks">
            <img src="/brand/futuret3ch-mark.png" alt="Supported by Futuret3ch" width={28} height={26} />
            <img src="/brand/t3x-badge.png" alt="T3X" width={26} height={28} />
          </div>
          </div>
          <div className="hud-actions">
            {choosing && (
              <button className="ghost horn" disabled={!hud.canStart} onClick={() => press({ t: "wave" })}>
                Horn
              </button>
            )}
            {inMatch && (
              <button
                className="ghost tray"
                data-on={armory ? "true" : "false"}
                aria-pressed={armory}
                onClick={() => setArmory((open) => !open)}
              >
                {armory ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronUp size={16} aria-hidden="true" />}
                Engines
              </button>
            )}
            <div className="gear">
              <button
                className="icon-btn"
                data-on={gearOpen ? "true" : "false"}
                aria-expanded={gearOpen}
                aria-label="Settings"
                onClick={() => setGearOpen((open) => !open)}
              >
                <Settings size={18} />
              </button>
              {gearOpen && (
                <div className="gear-panel" role="group" aria-label="Settings">
                  <button className="ghost" onClick={() => press({ t: "pause" })}>
                    {hud.phase === "paused" ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
                    {hud.phase === "paused" ? "Resume" : "Pause"}
                  </button>
                  <button className="ghost" data-on={hud.muted ? "false" : "true"} onClick={() => press({ t: "mute" })}>
                    {hud.muted ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
                    {hud.muted ? "Sound off" : "Sound on"}
                  </button>
                  <button className="ghost" data-on={hud.shakeOn ? "true" : "false"} onClick={() => press({ t: "shake" })}>
                    <Vibrate size={16} aria-hidden="true" />
                    {hud.shakeOn ? "Vibration on" : "Vibration off"}
                  </button>
                  <button
                    className="ghost"
                    onClick={() => {
                      setGearOpen(false);
                      press({ t: "manual", open: true });
                    }}
                  >
                    <BookOpen size={16} aria-hidden="true" />
                    Manual
                  </button>
                  {inMatch && (
                    <>
                      <button
                        className="ghost"
                        data-testid="save-run"
                        onClick={() => {
                          setGearOpen(false);
                          press({ t: "save" });
                        }}
                      >
                        <Save size={16} aria-hidden="true" />
                        Save
                      </button>
                      <button
                        className="ghost danger"
                        data-testid="surrender"
                        onClick={() => {
                          setGearOpen(false);
                          press({ t: "surrender" });
                        }}
                      >
                        <Flag size={16} aria-hidden="true" />
                        Surrender
                      </button>
                      <button
                        className="ghost"
                        data-testid="quit"
                        onClick={() => {
                          setGearOpen(false);
                          press({ t: "quit" });
                        }}
                      >
                        <LogOut size={16} aria-hidden="true" />
                        Quit
                      </button>
                    </>
                  )}
                  <button className="ghost" onClick={() => press({ t: "speed" })}>
                    Speed ×{hud.speed}
                  </button>
                  <button className="ghost" onClick={() => press({ t: "masonry" })} disabled={hud.masonryCost == null}>
                    <Castle size={16} aria-hidden="true" />
                    {hud.masonryNext ?? "Walls complete"}
                    {hud.masonryCost != null ? ` · ${hud.masonryCost}` : ""}
                  </button>
                  {screen.supported && (
                    <button className="ghost" onClick={screen.toggle}>
                      {screen.active ? <Minimize size={16} aria-hidden="true" /> : <Maximize size={16} aria-hidden="true" />}
                      {screen.active ? "Leave fullscreen" : "Fill the screen"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {hud.phase !== "menu" && hud.banner && (
        <button
          type="button"
          className="banner"
          data-hot={hud.fighting ? "true" : "false"}
          onClick={() => press({ t: "dismiss" })}
          aria-label={`Dismiss announcement: ${hud.banner}`}
        >
          <span>{hud.banner}</span>
          <X size={16} aria-hidden="true" />
        </button>
      )}

      <div className="stage">
        <canvas className="gl" aria-label="Roman battlefield" />
        <canvas className="fx" aria-hidden="true" />
        {bootError && <p className="boot-error">{bootError}</p>}

        {hud.phase === "menu" && (
          <>
            <img className="menu-mark" src="/brand/futuret3ch-mark.png" alt="Supported by Futuret3ch" width={72} height={66} />
            <p className="trailer-chip">Trailer</p>
            <section className="menu">
              <h1>CASTRUM</h1>
              <p className="lede">Hold the ford.</p>
              <div className="menu-actions">
                <button className="primary" data-testid="begin" onClick={() => press({ t: "start" })}>
                  Start game
                </button>
                {savedRun && (
                  <button className="ghost" data-testid="continue" onClick={() => press({ t: "continue" })}>
                    Continue
                  </button>
                )}
                <WalletDock />
              </div>
              <p className="wallet-note">Solana wallets only. Connect is accepted when the wallet holds T3X. Otherwise buy it first.</p>
              {hud.best > 0 && <p className="best">Best gloria {hud.best}</p>}
              {scores.length > 0 && (
                <>
                  <p className="board-label">Scores</p>
                  <ol className="board">
                    {scores.slice(0, 5).map((row) => (
                      <li key={`${row.at}-${row.name}`}>
                        <span>{row.name}</span>
                        <span>
                          {row.gloria.toLocaleString()} · {row.result === "victory" ? "held" : "fell"}
                        </span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
              <p className="credit">Created by Futuret3ch</p>
            </section>
          </>
        )}

        {hud.phase === "paused" && (
          <section className="pause-card">
            <p className="eyebrow">Standards lowered</p>
            <h2>PAUSED</h2>
            <p className="lede">The host waits. So can you.</p>
            <button className="primary" onClick={() => press({ t: "pause" })}>
              Resume the watch
            </button>
          </section>
        )}

        {(hud.phase === "victory" || hud.phase === "defeat") && (
          <section className="endcard">
            <p className="eyebrow">
              {hud.phase === "victory" ? "The ford holds" : hud.fort > 0 ? "The legion yields" : "The gate is broken"}
            </p>
            <h2>{hud.phase === "victory" ? "ROME REMEMBERS" : "FALL BACK"}</h2>
            <p className="lede">
              Gloria {hud.gloria}. Waves held {hud.cleared}. Kills {hud.kills}. Gate {hud.fort}.
            </p>
            <p className="best">Best gloria {hud.best}</p>
            {leftName ? (
              <p className="wallet-note" role="status">
                Left under {leftName}.
              </p>
            ) : (
              <form className="score-form" onSubmit={leaveScore}>
                <label className="sr" htmlFor="score-name">
                  Name
                </label>
                <input id="score-name" name="name" maxLength={18} required placeholder="Your name" autoComplete="nickname" />
                <button className="primary" type="submit" data-testid="leave-score">
                  Leave a score
                </button>
              </form>
            )}
            <p className="board-label">Scores</p>
            {scores.length === 0 ? (
              <p className="wallet-note">No scores on this device yet.</p>
            ) : (
              <ol className="board">
                {scores.slice(0, 8).map((row) => (
                  <li key={`${row.at}-${row.name}`}>
                    <span>{row.name}</span>
                    <span>
                      {row.gloria.toLocaleString()} · {row.result === "victory" ? "held" : "fell"}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <div className="end-actions">
              <button className="primary" onClick={() => press({ t: "again" })}>
                March again
              </button>
              {hud.phase === "victory" && (
                <button className="ghost" onClick={() => press({ t: "endless" })}>
                  Hold the night
                </button>
              )}
              <button className="ghost" onClick={() => press({ t: "camp" })}>
                Return to camp
              </button>
            </div>
          </section>
        )}

        {hud.manual && (
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="manual-title">
            <header>
              <h2 id="manual-title">FIELD MANUAL</h2>
              <button className="icon-btn" onClick={() => press({ t: "manual", open: false })} aria-label="Close manual">
                <X size={18} />
              </button>
            </header>
            <p>
              Engines shoot whoever is furthest down the road unless you change their aim. First protects the gate.
              Stones and oil punish armor, rams, and elephants. The engines tray is open while you choose, and it folds
              away when the horn sounds. Engines brings it back. Pause, sound, vibration, the manual, save, surrender,
              quit, speed, and the walls live under the cog. Drag to orbit the field, right-drag or Shift-drag to slide, scroll or pinch to zoom, R
              resets the eye. WASD and the arrows move the view. Keys: 1–6 arm an engine, Space calls the host, U
              improves the selected engine, M raises the fort, T cycles aim, Q changes speed, Esc pauses.
            </p>
            <div className="manual-grid">
              {TOWER_KINDS.map((kind) => {
                const tower = TOWERS[kind];
                return (
                  <article key={kind}>
                    <p className="latin">
                      {tower.latin} · {tower.cost}
                    </p>
                    <h3>{tower.name}</h3>
                    <p>{tower.blurb}</p>
                  </article>
                );
              })}
              {ENEMY_KINDS.map((kind) => {
                const foe = ENEMIES[kind];
                return (
                  <article key={kind}>
                    <p className="latin">Hostile · {foe.gold} denarii</p>
                    <h3>{foe.name}</h3>
                    <p>{foe.blurb}</p>
                  </article>
                );
              })}
              {MASONRY.slice(1).map((tier) => (
                <article key={tier.name}>
                  <p className="latin">Masonry · {tier.cost}</p>
                  <h3>{tier.name}</h3>
                  <p>{tier.blurb}</p>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {showShop && (
        <footer className="dock">
          {hud.selected && (
            <div className="inspector">
              <div className="who">
                <strong>
                  {TOWERS[hud.selected.kind].name} · {hud.selected.level}
                </strong>
                <span className="meta">{hud.selected.kills} kills</span>
              </div>
              {MODES.map((mode) => (
                <button
                  key={mode}
                  className="chip"
                  data-on={hud.selected?.mode === mode ? "true" : "false"}
                  onClick={() => press({ t: "mode", mode })}
                >
                  {MODE_NAME[mode]}
                </button>
              ))}
              <button className="ghost" disabled={hud.selected.upgrade == null} onClick={() => press({ t: "upgrade" })}>
                Improve{hud.selected.upgrade != null ? ` · ${hud.selected.upgrade}` : ""}
              </button>
              <button className="danger" onClick={() => press({ t: "sell" })}>
                Dismantle · {hud.selected.sell}
              </button>
            </div>
          )}
          {showShop && (
            <>
              <p className="dock-note">{hud.preview}</p>
              <div className="cards">
                {TOWER_KINDS.map((kind) => {
                  const tower = TOWERS[kind];
                  const Icon = ICONS[kind];
                  const poor = hud.gold < tower.cost;
                  return (
                    <button
                      key={kind}
                      className="tcard"
                      data-on={hud.armed === kind ? "true" : "false"}
                      data-poor={poor && hud.armed !== kind ? "true" : "false"}
                      onClick={() => press({ t: "arm", kind })}
                    >
                      <span className="top">
                        <Icon size={16} aria-hidden="true" />
                        <span className="pip" style={{ ["--pip" as string]: tower.pennant }} />
                        <span className="kbd">{tower.hotkey}</span>
                      </span>
                      <b>{tower.name}</b>
                      <span className="meta">{tower.cost} denarii</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </footer>
      )}
    </div>
  );
}
