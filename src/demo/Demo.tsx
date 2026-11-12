import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { Brand } from "../brand/Logo";
import { Avatar } from "../brand/Avatar";
import { Device, type DeviceKind } from "../ui/Device";
import { ACTORS, actor, CLEAN, EMBED, storageKey, type ActorId, type LogEvent } from "./engine";
import { mockFabric } from "./fabric";
import { LiveRoot, type LiveInfo } from "./live";
import { UnfoundProvider, useUnfound } from "./store";
import { FabricLog } from "./ui";
import { CHAPTERS, STORY, type Callout } from "./story";
import { play, setMuted, unlockSfx, useMuted, whoosh, type Sfx } from "../motion/sfx";
import { ease } from "../motion/tokens";
import { Admin } from "./screens/Admin";
import { Approver } from "./screens/Approver";
import { Police } from "./screens/Police";
import { Service } from "./screens/Service";
import { Survivor } from "./screens/Survivor";
import { Gate, IrisOut, type Iris } from "./Gate";
import { TideStack } from "./TideStack";

const PERSONA_KEY = storageKey("unfound-demo-persona");

const DEVICE: Record<ActorId, DeviceKind> = {
  linh: "iphone",
  school: "macbook",
  gp: "macbook",
  dan: "macbook",
  mai: "macbook",
  ruth: "macbook",
  officer: "ipad",
};

const ABOUT: Record<ActorId, string> = {
  linh: "Survivor. Seals her new address and sees who asked for it.",
  school: "School registrar. Can confirm the zone, never the street.",
  gp: "Clinic reception. Can reach patients through a relay number.",
  dan: "Agency IT admin. Full admin rights, no key.",
  mai: "Caseworker lead. One of three independent approvers.",
  ruth: "Independent advocate. One of three independent approvers.",
  officer: "Police. Emergency access needs two witnesses and lasts one view.",
};

function Screen({ who }: { who: ActorId }) {
  switch (who) {
    case "linh": return <Survivor />;
    case "school": return <Service who="school" />;
    case "gp": return <Service who="gp" />;
    case "dan": return <Admin />;
    case "mai": return <Approver who="mai" />;
    case "ruth": return <Approver who="ruth" />;
    case "officer": return <Police />;
  }
}

// Every Tide operation has its own sound, so the demo can be followed with eyes closed.
function soundFor(e: LogEvent): Sfx | null {
  if (e.detail.includes("412")) return "blocked";
  if (e.result === "denied") return "denied";
  if (e.result === "pending") return "pending";
  if (e.op === "doEncrypt") return "seal";
  if (e.op === "commit" || e.op === "revoke") return "quorum";
  if (e.op === "authorize") return "approve";
  if (e.op === "doDecrypt") return "reveal";
  return null;
}

function useDemoSounds(log: LogEvent[]) {
  // Arriving on the dashboard: the curtain lifts with a falling whoosh and a soft chime.
  useEffect(() => {
    if (EMBED) return;
    const t1 = window.setTimeout(() => whoosh("down", 0.6, 0.16), 60);
    const t2 = window.setTimeout(() => play("chime"), 520);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);
  // A semantic sound for each new Tide operation (newest only, so bursts stay clean).
  const last = useRef(log[0]?.id ?? 0);
  useEffect(() => {
    const top = log[0];
    if (!top || top.id === last.current) return;
    last.current = top.id;
    const s = soundFor(top);
    if (s) window.setTimeout(() => play(s), 60);
  }, [log]);
}

function SoundToggle() {
  const muted = useMuted();
  return (
    <button className="btn ghost sm mute" data-sfx="none" onClick={() => setMuted(!muted)} aria-pressed={!muted} title={muted ? "Turn sound on" : "Turn sound off"}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
        {muted ? <path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" strokeWidth="1.4" /> : <path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.8a6 6 0 0 1 0 8.4" fill="none" stroke="currentColor" strokeWidth="1.4" />}
      </svg>
      <span className="hide-sm">{muted ? "Sound off" : "Sound on"}</span>
    </button>
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Plays STORY against the real screens: switches persona, zooms the device onto a feature,
// pops a callout, then clicks the same button a person would.
function useStory(stage: React.RefObject<HTMLDivElement>, layer: React.RefObject<HTMLDivElement>) {
  const { current, setCurrent, reset } = useUnfound();
  const [scene, setScene] = useState(-1);
  const [callout, setCallout] = useState<(Callout & { key: string }) | null>(null);
  const [status, setStatus] = useState<"idle" | "playing" | "done">("idle");
  const run = useRef(0);
  const currentRef = useRef(current);
  currentRef.current = current;

  const post = (msg: object) => {
    if (EMBED) window.parent?.postMessage({ source: "unfound", ...msg }, window.location.origin);
  };

  const find = async (target: string, alive: () => boolean) => {
    for (let i = 0; i < 40 && alive(); i++) {
      const el = stage.current?.querySelector<HTMLElement>(`[data-demo="${target}"]`);
      if (el) return el;
      await sleep(100);
    }
    return null;
  };

  const zoomTo = (el: HTMLElement, scale = 1.32) => {
    const lay = layer.current;
    // The phone scrolls inside the layer (under the island); the other devices scroll the screen.
    const scr = lay && getComputedStyle(lay).overflowY === "auto" ? lay : lay?.parentElement;
    if (!lay || !scr) return;
    const sr = scr.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    scr.scrollTo({ top: scr.scrollTop + er.top - sr.top - sr.height / 2 + er.height / 2, behavior: "smooth" });
    window.setTimeout(() => {
      const lr = lay.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      lay.style.transformOrigin = `${r.left - lr.left + r.width / 2}px ${r.top - lr.top + r.height / 2}px`;
      lay.style.transform = `scale(${Math.min(scale, (sr.width * 0.92) / Math.max(r.width, 1))})`;
      el.classList.add("spot");
    }, 260);
  };

  const unzoom = (el?: HTMLElement | null) => {
    if (layer.current) layer.current.style.transform = "";
    el?.classList.remove("spot");
  };

  const stop = useCallback(() => {
    run.current++;
    setStatus("idle");
    setScene(-1);
    setCallout(null);
    unzoom();
    post({ type: "step", scene: -1, chapter: -1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(async () => {
    unlockSfx();
    const id = ++run.current;
    const alive = () => run.current === id;
    setStatus("playing");
    setCallout(null);
    unzoom();
    reset();
    play("enter");
    await sleep(500);
    for (let i = 0; i < STORY.length; i++) {
      if (!alive()) return;
      const sc = STORY[i];
      setScene(i);
      post({ type: "step", scene: i, chapter: sc.chapter });
      if (currentRef.current !== sc.who) {
        play("switch");
        setCurrent(sc.who);
        await sleep(900);
      } else {
        await sleep(300);
      }
      for (const op of sc.ops) {
        if (!alive()) return;
        if (op.do === "wait") {
          await sleep(op.ms);
        } else if (op.do === "click") {
          const el = await find(op.target, alive);
          if (!el || !alive()) continue;
          el.classList.add("pressing");
          play("tap");
          await sleep(240);
          el.classList.remove("pressing");
          el.click();
          await sleep(700);
        } else {
          const el = await find(op.target, alive);
          if (!el || !alive()) continue;
          zoomTo(el, op.zoom);
          await sleep(320);
          setCallout({ ...op.callout, key: `${i}-${op.target}-${op.callout.title}` });
          play("pop");
          await sleep(op.hold ?? 2600);
          if (!alive()) return;
          setCallout(null);
          unzoom(el);
          await sleep(520);
        }
      }
    }
    if (!alive()) return;
    setStatus("done");
    play("quorum");
    post({ type: "done" });
  }, [reset, setCurrent]);

  // The landing page drives the embedded demo with postMessage.
  useEffect(() => {
    if (!EMBED) return;
    const on = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.source !== "unfound-landing") return;
      if (e.data.type === "play") void start();
      if (e.data.type === "stop") stop();
    };
    window.addEventListener("message", on);
    post({ type: "ready" });
    return () => window.removeEventListener("message", on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, stop]);

  return { scene, callout, status, start, stop, setStatus };
}

function Shell({ live }: { live?: LiveInfo }) {
  const { state, current, setCurrent, reset, fabric } = useUnfound();
  const pending = state.requests.filter((c) => c.status === "PENDING").length;
  const stage = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const { scene, callout, status, start, stop, setStatus } = useStory(stage, layer);
  // The sidebar shows either the raw Fabric log or which part of the Tide stack each step runs on.
  // ?panel=stack opens on the stack, for walking someone through the technology.
  const [panel, setPanel] = useState<"log" | "stack">(() => (new URLSearchParams(window.location.search).get("panel") === "stack" ? "stack" : "log"));
  useDemoSounds(state.log);
  // /demo?story=1 (the landing's "Play the story") starts the guided run once the curtain has lifted.
  useEffect(() => {
    if (EMBED || !new URLSearchParams(window.location.search).has("story")) return;
    const t = window.setTimeout(() => void start(), 1100);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const kind = DEVICE[current];
  const playing = status === "playing";
  const sc = scene >= 0 ? STORY[scene] : null;
  const me = actor(current);

  const screen = (
    <div className="zoom-layer" ref={layer}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current}
          className="screen-body"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: ease.out } }}
          exit={{ opacity: 0, y: -6, transition: { duration: 0.12, ease: ease.out } }}
        >
          <Screen who={current} />
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return (
    <div className={`app ${EMBED ? "embed" : ""} ${CLEAN ? "clean" : ""} ${playing ? "is-playing" : ""}`}>
      <motion.header className="topbar" initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: ease.out, delay: EMBED ? 0 : 0.35 }}>
        <div className="topbar-inner">
          {!EMBED && <Brand to="/" sfx="whoosh" />}
          {live && (
            <div className="row">
              <span className="muted" style={{ fontSize: 13 }}>{live.authenticated ? `Signed in as ${live.username}` : live.initializing ? "Connecting to TideCloak…" : "Not signed in"}</span>
              {live.authenticated ? (
                <button className="btn outline sm" onClick={live.logout}>Switch user</button>
              ) : (
                <button className="btn sm" onClick={live.login}>Sign in with Tide</button>
              )}
            </div>
          )}
          {(
            <LayoutGroup id="personas">
              <nav className="personas" aria-label="Act as">
                {ACTORS.map((a, i) => (
                  <motion.button
                    key={a.id}
                    className="persona-btn"
                    data-sfx="switch"
                    aria-pressed={current === a.id}
                    disabled={playing}
                    onClick={() => setCurrent(a.id)}
                    title={`${a.name} · ${a.title}`}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: ease.out, delay: (EMBED ? 0 : 0.45) + i * 0.035 }}
                  >
                    {current === a.id && <motion.span className="persona-pill" layoutId="persona-pill" transition={{ type: "spring", stiffness: 520, damping: 40 }} />}
                    <Avatar id={a.id} size={24} />
                    <span className="persona-name">{a.name.split(" ")[0]}</span>
                    {(a.id === "mai" || a.id === "ruth") && pending > 0 && <span className="persona-count">{pending}</span>}
                  </motion.button>
                ))}
              </nav>
            </LayoutGroup>
          )}
          <div className="spacer" />
          {!EMBED && (
            <>
              {playing ? (
                <button className="btn sm outline" data-sfx="hide" onClick={stop}>Stop</button>
              ) : (
                <button className="btn sm lam" data-sfx="none" onClick={() => void start()}>
                  <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></svg>
                  {status === "done" ? "Replay the story" : "Play the story"}
                </button>
              )}
              <SoundToggle />
              <button className="btn ghost sm" data-sfx="hide" onClick={() => { stop(); reset(); }} disabled={playing}>Reset</button>
            </>
          )}
        </div>
      </motion.header>

      <div className="workspace">
        <main className="stage" ref={stage}>
          {live?.error && <div className="notice dark">TideCloak: {live.error}</div>}
          {EMBED ? (
            <div className="embed-screen">{screen}</div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={kind}
                className={`device-slot slot-${kind}`}
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 26 } }}
                exit={{ opacity: 0, scale: 0.96, y: -8, transition: { duration: 0.18, ease: ease.out } }}
              >
                <Device kind={kind}>{screen}</Device>
              </motion.div>
            </AnimatePresence>
          )}

          <AnimatePresence>
            {callout && (
              <motion.div
                key={callout.key}
                className="callout"
                role="status"
                initial={{ opacity: 0, scale: 0.85, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 480, damping: 26 } }}
                exit={{ opacity: 0, scale: 0.95, y: 6, transition: { duration: 0.16 } }}
              >
                <span className="callout-dot" aria-hidden="true" />
                <div>
                  <b>{callout.title}</b>
                  <p>{callout.body}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {status === "done" && !EMBED && (
              <motion.div className="endcard" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 26 }}>
                <span className="eyebrow">End to end</span>
                <h2>No master key. <span className="muted">Anywhere.</span></h2>
                <p className="muted">Sealed on the phone, shared by tag, guarded by a 2 of 3 quorum, and every attempt on record.</p>
                <div className="row">
                  <button className="btn lam" data-sfx="none" onClick={() => void start()}>Replay the story</button>
                  <button className="btn outline" onClick={() => setStatus("idle")}>Explore on your own</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!EMBED && (
            <div className="caption-bar" aria-live="polite">
              <Avatar id={current} size={36} />
              <div className="caption-text">
                <b>{me.name} <span className="muted">· {me.title}</span></b>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={sc ? `s${scene}` : current} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
                    {sc ? sc.caption : ABOUT[current]}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          )}
        </main>

        {!EMBED && (
          <aside className="side">
            <div className="story-panel">
              <div className="row between">
                <span className="eyebrow">The story</span>
                <span className="muted" style={{ fontSize: 12 }}>{playing ? `${scene + 1} / ${STORY.length}` : "≈ 70 s, sound on"}</span>
              </div>
              <ol className="chapters">
                {CHAPTERS.map((c, i) => {
                  const active = sc?.chapter === i;
                  return (
                    <li key={c} className={active ? "on" : ""}>
                      <span className="ch-n">0{i + 1}</span>
                      <span>{c}</span>
                      {active && <motion.span className="ch-bar" layoutId="ch-bar" transition={{ type: "spring", stiffness: 400, damping: 36 }} />}
                    </li>
                  );
                })}
              </ol>
              <div className="progress-track" aria-hidden="true">
                <motion.div className="progress-fill" animate={{ scaleX: playing ? (scene + 1) / STORY.length : status === "done" ? 1 : 0 }} transition={{ duration: 0.6, ease: ease.out }} />
              </div>
            </div>
            <div className="tabs side-tabs" role="tablist" aria-label="Sidebar">
              {(["log", "stack"] as const).map((p) => (
                <button key={p} className="tab" role="tab" aria-selected={panel === p} data-sfx="switch" onClick={() => setPanel(p)}>
                  {p === "log" ? "Fabric log" : "Tide stack"}
                  {panel === p && <motion.span className="tab-line" layoutId="side-tab-line" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                </button>
              ))}
            </div>
            {panel === "log" ? <FabricLog log={state.log} mode={fabric.mode} /> : <TideStack log={state.log} mode={fabric.mode} live={live} />}
          </aside>
        )}
      </div>
    </div>
  );
}

function MockDemo() {
  const [current, setCurrent] = useState<ActorId>(() => {
    try {
      return (localStorage.getItem(PERSONA_KEY) as ActorId) || "linh";
    } catch {
      return "linh";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(PERSONA_KEY, current);
    } catch {
      /* ignore */
    }
  }, [current]);
  return (
    <UnfoundProvider fabric={mockFabric} current={current} setCurrent={setCurrent}>
      <Shell />
    </UnfoundProvider>
  );
}

// /demo opens on a welcome gate: sign in with Tide (live) or explore on the mock fabric.
// ?story, ?embed, ?clean and ?mode=live|mock skip the gate; returning from the Tide sign-in
// (/auth/redirect, or a remembered choice) goes straight back to live.
const MODE_KEY = "unfound-demo-mode";

export function Demo() {
  const params = new URLSearchParams(window.location.search);
  const remembered = (() => {
    try {
      return sessionStorage.getItem(MODE_KEY);
    } catch {
      return null;
    }
  })();
  const initial: "gate" | "mock" | "live" =
    EMBED || CLEAN || params.has("story") || params.get("mode") === "mock" || import.meta.env.VITE_UNFOUND_MODE === "mock"
      ? "mock"
      : params.get("mode") === "live" || window.location.pathname === "/auth/redirect" || remembered === "live"
        ? "live"
        : "gate";
  const [mode, setMode] = useState(initial);
  const [liveReady, setLiveReady] = useState(false);

  useEffect(() => {
    fetch("/tidecloak.json", { cache: "no-store" })
      .then((r) => (r.ok && (r.headers.get("content-type") ?? "").includes("json") ? r.json() : null))
      .then((cfg) => setLiveReady(!!cfg && !!(cfg.realm || cfg["auth-server-url"])))
      .catch(() => setLiveReady(false));
  }, []);

  const [iris, setIris] = useState<Iris | null>(null);
  const choose = (m: "mock" | "live", i?: Iris) => {
    try {
      sessionStorage.setItem(MODE_KEY, m);
    } catch {
      /* ignore */
    }
    if (i) setIris(i);
    setMode(m);
  };

  if (mode === "gate") {
    return (
      <Gate
        liveReady={liveReady}
        onLive={(i) => choose("live", i)}
        onMock={(i) => choose("mock", i)}
        onStory={(i) => {
          window.history.replaceState(null, "", "/demo?story=1");
          choose("mock", i);
        }}
      />
    );
  }
  const out = iris && <IrisOut key="iris" iris={iris} />;
  if (mode === "mock") return <>{<MockDemo />}{out}</>;
  return (
    <>
    {out}
    <LiveRoot>
      {({ fabric, current, setCurrent, live }) => (
        <UnfoundProvider fabric={fabric} current={current} setCurrent={setCurrent}>
          <Shell live={live} />
        </UnfoundProvider>
      )}
    </LiveRoot>
    </>
  );
}
