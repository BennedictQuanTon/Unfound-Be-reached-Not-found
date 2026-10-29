// Live mode: the same demo, wired to a real TideCloak realm through @tidecloak/react.
// Encrypt/decrypt run through Tide's network; role grants go through real QEA change sets.

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { TideCloakContextProvider, useTideCloak } from "@tidecloak/react";
import { ACTORS, LINH_ID, role, type ActorId } from "./engine";
import { DeniedError, type Fabric } from "./fabric";
import { useUnfound } from "./store";

// doEncrypt may return a string or bytes. Bytes are stored as "b64:<base64>" so the exact value can be
// handed back to doDecrypt; decrypted bytes are UTF-8 text.
const B64 = "b64:";
function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
function packCiphertext(x: string | Uint8Array): string {
  return typeof x === "string" ? x : B64 + toB64(x);
}
function unpackCiphertext(s: string): string | Uint8Array {
  return s.startsWith(B64) ? Uint8Array.from(atob(s.slice(B64.length)), (c) => c.charCodeAt(0)) : s;
}
function plaintext(x: string | Uint8Array): string {
  return typeof x === "string" ? x : new TextDecoder().decode(x);
}

export function LiveRoot({ children }: { children: (props: { fabric: Fabric; current: ActorId; setCurrent: (id: ActorId) => void; live: LiveInfo }) => ReactNode }) {
  // Load the exported adapter and turn DPoP on (sender-bound tokens; public/tide_dpop_auth.html is the
  // relay page). "auto" binds tokens whenever the realm supports it, as Tide's realm template does.
  const [config, setConfig] = useState<Record<string, unknown> | "loading" | "failed">("loading");
  useEffect(() => {
    fetch("/tidecloak.json", { cache: "no-store" })
      .then((r) => (r.ok && (r.headers.get("content-type") ?? "").includes("json") ? r.json() : null))
      .then((cfg) => setConfig(!!cfg && !!(cfg.realm || cfg["auth-server-url"]) ? { ...cfg, useDPoP: { mode: "auto", alg: "ES256" } } : "failed"))
      .catch(() => setConfig("failed"));
  }, []);
  if (config === "loading") return null;
  if (config === "failed") {
    return (
      <div className="notice dark" role="alert">
        TideCloak is not set up on this machine: /tidecloak.json is missing or empty. Run <code>bash scripts/setup-local.sh</code>, or <a href="/demo?mode=mock">explore without an account</a>.
      </div>
    );
  }
  return (
    <TideCloakContextProvider config={config}>
      <LiveBridge>{children}</LiveBridge>
    </TideCloakContextProvider>
  );
}

export interface LiveInfo {
  authenticated: boolean;
  username: string | null;
  login: () => void;
  logout: () => void;
  initializing: boolean;
  error: string | null;
}

function LiveBridge({ children }: { children: Parameters<typeof LiveRoot>[0]["children"] }) {
  const tc = useTideCloak();
  const username: string | null = tc.authenticated ? tc.getValueFromIdToken("preferred_username") ?? tc.getValueFromToken("preferred_username") ?? null : null;
  // A realm user named after a persona starts on that persona's screen; screens can still be switched,
  // and every Tide call runs as the signed-in identity.
  // Realm usernames need 3+ characters, so the gp persona signs in as "gpclinic".
  const fromToken = ACTORS.find((a) => a.id === (username === "gpclinic" ? "gp" : username))?.id;
  const [picked, setPicked] = useState<ActorId | null>(null);
  const current = picked ?? fromToken ?? "linh";

  const fabric = useMemo<Fabric>(
    () => ({
      mode: "live",
      async encrypt(_as, _roles, items) {
        const out = await tc.doEncrypt(items.map((i) => ({ data: i.data, tags: i.tags })));
        return out.map(packCiphertext);
      },
      async decrypt(_as, _roles, items) {
        try {
          const out = await tc.doDecrypt(items.map((i) => ({ encrypted: unpackCiphertext(i.encrypted), tags: i.tags })));
          return out.map(plaintext);
        } catch (e) {
          const tag = items[0]?.tags[0];
          throw new DeniedError(tag ? role(tag, "selfdecrypt") : "unknown", `Tide refused: ${(e as Error).message}`);
        }
      },
    }),
    // doEncrypt/doDecrypt change identity with the session
    [tc.doEncrypt, tc.doDecrypt],
  );

  const live: LiveInfo = {
    authenticated: tc.authenticated,
    username,
    login: () => void tc.login(),
    logout: () => void tc.logout(),
    initializing: tc.isInitializing,
    error: tc.initError ? tc.initError.message : null,
  };

  return <>{children({ fabric, current, setCurrent: setPicked, live })}</>;
}

// Runs Dan's self-grant against the real TideCloak Admin API (QEA change sets).
export function LiveAdminPanel() {
  const tc = useTideCloak();
  const { note } = useUnfound();
  const [busy, setBusy] = useState(false);
  const roleName = role("addrfull", "selfdecrypt");

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      const res = await fn();
      note(`TideCloak ${label}`, typeof res === "string" ? res : JSON.stringify(res ?? "ok").slice(0, 240), "ok", LINH_ID);
    } catch (e) {
      const msg = (e as Error).message;
      note(`TideCloak ${label}`, msg.slice(0, 240), msg.includes("202") ? "pending" : "denied", LINH_ID);
    } finally {
      setBusy(false);
    }
  };

  const me = async () => {
    const users = (await tc.AdminAPI.getUsers({ search: "dan" })) as { id: string; username: string }[];
    const dan = users.find((u) => u.username === "dan");
    if (!dan) throw new Error("No user 'dan' in this realm. Create the demo users first (see README).");
    return dan;
  };

  return (
    <div className="card stack">
      <b>Run it on the real realm</b>
      <span className="muted" style={{ fontSize: 13 }}>Signed in as a realm admin. Each call goes to TideCloak and its result lands in the Fabric log.</span>
      <div className="row">
        <button className="btn sm" disabled={busy} onClick={() => run("addUserRoles", async () => {
          const dan = await me();
          const r = await tc.AdminAPI.getRole(roleName);
          return tc.AdminAPI.addUserRoles(dan.id, [r]);
        })}>1 · Assign role to myself</button>
        <button className="btn outline sm" disabled={busy} onClick={() => run("getPendingChangeSets", () => tc.AdminAPI.getPendingChangeSets())}>2 · List change sets</button>
        <button className="btn outline sm" disabled={busy} onClick={() => run("commitChangeSet", async () => {
          const sets = (await tc.AdminAPI.getPendingChangeSets()) as { changeSetId?: string; draftRecordId?: string; actionType: string; changeSetType: string; role?: string }[];
          const cs = sets[0];
          if (!cs) throw new Error("No pending change set to commit.");
          return tc.AdminAPI.commitChangeSet({ changeSetId: cs.changeSetId ?? cs.draftRecordId, actionType: cs.actionType, changeSetType: cs.changeSetType });
        })}>3 · Commit</button>
      </div>
      <span className="muted" style={{ fontSize: 13 }}>Approvers can vote in the TideCloak admin console under the QEA approvals inbox.</span>
    </div>
  );
}
