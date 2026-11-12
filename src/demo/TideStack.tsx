import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ease } from "../motion/tokens";
import { fmtTime, shortCt, type LogEvent } from "./engine";
import type { LiveInfo } from "./live";
import { Badge } from "./ui";

// Which part of the Tide stack each demo step runs on, and whether it is real right now.
// Mock mode simulates the network in this browser; live mode calls a real TideCloak realm.
// Rows light up as the log records an operation that goes through them, so a viewer can watch
// the story and see the stack doing the work. Anything still app-level or planned says so.

type Status = { kind: "approved" | "sealed" | "neutral" | "pending" | "denied"; label: string };
type Layer = {
  id: string;
  name: string;
  what: string;
  uses?: (e: LogEvent) => boolean;
  status: (mode: "mock" | "live", live: LiveInfo | undefined, log: LogEvent[]) => Status;
};

const isCrypto = (e: LogEvent) => e.op === "doEncrypt" || e.op === "doDecrypt";
const isAdminApi = (e: LogEvent) => e.op.startsWith("TideCloak ");

const SIMULATED: Status = { kind: "neutral", label: "Simulated" };
const PLANNED: Status = { kind: "pending", label: "Planned" };

// A live layer only says "Live" once TideCloak has answered and someone is signed in;
// before that it says what it is waiting for, so the panel never claims more than ran.
function connected(live: LiveInfo | undefined, ok: Status): Status {
  if (!live || live.initializing) return { kind: "pending", label: "Connecting to TideCloak" };
  if (live.error) return { kind: "denied", label: "TideCloak error" };
  return live.authenticated ? ok : { kind: "pending", label: "Waiting for sign-in" };
}

const LAYERS: Layer[] = [
  {
    id: "sdk",
    name: "@tidecloak/react SDK",
    what: "Runs in the browser. Every seal, open and admin call goes through it.",
    uses: (e) => isCrypto(e) || isAdminApi(e),
    status: (mode, live) => (mode === "live" ? connected(live, { kind: "approved", label: "Live" }) : { kind: "neutral", label: "Mock fabric" }),
  },
  {
    id: "identity",
    name: "TideCloak sign-in · PRISM / BYOiD",
    what: "Zero-knowledge login: no password hash anywhere. The app gets standard OIDC tokens.",
    status: (mode, live) =>
      mode === "mock" ? { kind: "neutral", label: "Persona buttons" } : live?.authenticated ? { kind: "approved", label: `Signed in · ${live.username}` } : { kind: "pending", label: "Not signed in" },
  },
  {
    id: "dpop",
    name: "DPoP · ES256 (RFC 9449)",
    what: "Tokens are bound to this device's key, so a stolen token is useless anywhere else.",
    status: (mode, live) => {
      if (mode === "mock") return { kind: "neutral", label: "Not used" };
      if (live?.session?.dpopJkt) return { kind: "approved", label: "Bound" };
      return { kind: "pending", label: live?.authenticated ? "Not bound" : "Configured" };
    },
  },
  {
    id: "e2ee",
    name: "Hermetic E2EE · doEncrypt / doDecrypt",
    what: "The address is sealed in the browser. The store only ever holds ciphertext.",
    uses: isCrypto,
    status: (mode, live) => (mode === "live" ? connected(live, { kind: "approved", label: "Live" }) : { kind: "neutral", label: "AES-GCM in this browser" }),
  },
  {
    id: "tags",
    name: "Tag roles · _tide_<tag>.selfdecrypt",
    what: "One role per address part. Without it, the network refuses to help decrypt.",
    uses: (e) => e.op === "doDecrypt",
    status: (mode, live) => (mode === "live" ? connected(live, { kind: "approved", label: "Enforced by ORKs" }) : { kind: "neutral", label: "Same rules, app-checked" }),
  },
  {
    id: "fabric",
    name: "Tide Fabric · ORK nodes",
    what: "Key shards live on independent nodes and a threshold must cooperate. No node, and not Tide, holds the key.",
    uses: isCrypto,
    status: (mode, live) => (mode === "live" ? connected(live, { kind: "approved", label: host(live?.session?.homeOrk) ?? "Live" }) : SIMULATED),
  },
  {
    id: "qea",
    name: "Quorum-Enforced Governance · change sets",
    what: "Every role change is a change set. One admin alone gets 412 QUORUM_NOT_MET.",
    uses: (e) => ["assignRole", "removeRole", "authorize", "approve", "deny", "commit"].includes(e.op) || isAdminApi(e),
    status: (mode, _live, log) =>
      mode === "mock" ? SIMULATED : log.some(isAdminApi) ? { kind: "sealed", label: "Admin API live · votes simulated" } : { kind: "sealed", label: "Votes simulated · Admin API ready" },
  },
  {
    id: "forseti",
    name: "Forseti policy · decrypt once",
    what: "Today the app revokes break-glass after one view. Forseti would make the network refuse a second time.",
    uses: (e) => e.op === "revoke",
    status: () => PLANNED,
  },
  {
    id: "history",
    name: "Change-set history → \"Who looked\"",
    what: "The survivor's log. Today it is built from app events; next, from Tide's change-set history.",
    uses: () => true,
    status: () => ({ kind: "pending", label: "App log · Tide API planned" }),
  },
];

function host(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function TideStack({ log, mode, live }: { log: LogEvent[]; mode: "mock" | "live"; live?: LiveInfo }) {
  const s = live?.session;
  // Follow the action: when a new operation lands, bring the deepest layer it ran on into view
  // (the history row matches everything, so it never steals the scroll).
  const rows = useRef(new Map<string, HTMLLIElement>());
  const latest = log[0];
  useEffect(() => {
    if (!latest) return;
    const target = [...LAYERS].reverse().find((l) => l.id !== "history" && l.uses?.(latest));
    const el = target && rows.current.get(target.id);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Scroll the panel only, never the page underneath the story.
    const box = el?.closest<HTMLElement>(".tide-stack");
    if (!el || !box) return;
    const top = el.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTo({ top: Math.max(0, top - 12), behavior: reduce ? "auto" : "smooth" });
    }
  }, [latest]);
  return (
    <motion.section className="log tide-stack" aria-label="Tide stack" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: ease.out }}>
      <div className="row between">
        <span className="eyebrow">Tide stack</span>
        {mode === "live" ? <Badge kind="approved">Live TideCloak</Badge> : <Badge kind="neutral">Mock fabric</Badge>}
      </div>
      <p className="muted" style={{ fontSize: 13 }}>What each step runs on. A row lights up when the demo calls it.</p>

      <ol className="stack-list">
        {LAYERS.map((l) => {
          const hits = l.uses ? log.filter(l.uses) : [];
          const last = hits[0];
          const st = l.status(mode, live, log);
          return (
            <li key={l.id} className="stack-row" ref={(el) => void (el ? rows.current.set(l.id, el) : rows.current.delete(l.id))}>
              {last && <motion.span key={last.id} className="stack-flash" aria-hidden="true" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 1.4, ease: "easeOut" }} />}
              <div className="row between">
                <b>{l.name}</b>
                <Badge kind={st.kind}>{st.label}</Badge>
              </div>
              <span className="muted stack-what">{l.what}</span>
              {last && (
                <span className="stack-last">
                  ×{hits.length} · {fmtTime(last.at)} · {last.op} · <span className={last.result === "denied" ? "r-no" : undefined}>{last.result === "ok" ? "OK" : last.result === "denied" ? "DENIED" : "PENDING"}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>

      {mode === "live" && (
        <div className="stack-session">
          <span className="eyebrow">This session, from TideCloak</span>
          {s ? (
            <dl className="kv stack-kv">
              <dt>Realm</dt>
              <dd>{s.realm ?? "—"}</dd>
              <dt>TideCloak</dt>
              <dd>{host(s.server) ?? "—"}</dd>
              <dt>Home ORK</dt>
              <dd>{host(s.homeOrk) ?? "—"}</dd>
              <dt>Vendor ID</dt>
              <dd>{s.vendorId ? shortCt(s.vendorId, 18) : "—"}</dd>
              <dt>Signed in</dt>
              <dd>{live?.username ?? "—"}</dd>
              <dt>Tide roles</dt>
              <dd>{s.roles.length ? s.roles.join(", ") : "none in this token"}</dd>
              <dt>DPoP key</dt>
              <dd>{s.dpopJkt ? shortCt(s.dpopJkt, 18) : "not bound"}</dd>
              <dt>Token expires</dt>
              <dd>{s.tokenExp ? fmtTime(s.tokenExp * 1000) : "—"}</dd>
            </dl>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>Connecting to TideCloak…</p>
          )}
        </div>
      )}

      {mode === "mock" && (
        <p className="muted stack-note">
          Mock mode simulates the network with AES-GCM in this browser and the same role and quorum rules. It shows the experience, not the security
          guarantees. Sign in with Tide to run the real stack.
        </p>
      )}
    </motion.section>
  );
}
