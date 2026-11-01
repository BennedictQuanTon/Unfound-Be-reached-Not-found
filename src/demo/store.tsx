import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  actor,
  decide,
  emptyState,
  role,
  THRESHOLD,
  type ActorId,
  type ChangeRequest,
  type DemoState,
  type LogEvent,
  type Result,
  type Tag,
  storageKey,
} from "./engine";
import { DeniedError, resetMockKeys, type Fabric } from "./fabric";

// Live ciphertexts come from Tide and mock ones from this browser, so they must never mix.
const stateKey = (mode: Fabric["mode"]) => storageKey(mode === "live" ? "unfound-demo-state-v1-live" : "unfound-demo-state-v1");

function load(mode: Fabric["mode"]): DemoState {
  try {
    const raw = localStorage.getItem(stateKey(mode));
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    /* fall through to a fresh state */
  }
  return emptyState();
}

export interface GrantInput {
  target: ActorId;
  tag: Tag;
  subject?: string;
  reason: string;
  oneTime?: boolean;
}

export interface Unfound {
  state: DemoState;
  fabric: Fabric;
  current: ActorId;
  setCurrent: (id: ActorId) => void;
  rolesOf: (id: ActorId) => string[];
  sealAddress: (recordId: string, values: Record<Tag, string>) => Promise<void>;
  open: (recordId: string, tag: Tag) => Promise<string>;
  requestGrant: (input: GrantInput) => ChangeRequest;
  requestRevoke: (input: GrantInput) => ChangeRequest;
  approve: (crId: string) => void;
  deny: (crId: string) => void;
  commit: (crId: string) => void;
  note: (op: string, detail: string, result: Result, subject?: string) => void;
  reset: () => void;
}

const Ctx = createContext<Unfound | null>(null);

export function useUnfound(): Unfound {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUnfound must be used inside <UnfoundProvider>");
  return v;
}

export class QuorumError extends Error {
  constructor(public have: number, public need: number) {
    super(`412 QUORUM_NOT_MET (${have}/${need})`);
  }
}

export function UnfoundProvider({
  fabric,
  current,
  setCurrent,
  children,
}: {
  fabric: Fabric;
  current: ActorId;
  setCurrent: (id: ActorId) => void;
  children: ReactNode;
}) {
  const [state, setState] = useState<DemoState>(() => load(fabric.mode));
  const ref = useRef(state);
  ref.current = state;
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    try {
      localStorage.setItem(stateKey(fabric.mode), JSON.stringify(state));
    } catch {
      /* storage blocked: the demo still works for this tab */
    }
  }, [state, fabric.mode]);

  const update = useCallback((fn: (s: DemoState) => DemoState) => {
    ref.current = fn(ref.current);
    setState(ref.current);
  }, []);

  const pushLog = useCallback(
    (s: DemoState, e: Omit<LogEvent, "id" | "at">): DemoState => ({
      ...s,
      seq: s.seq + 1,
      log: [{ ...e, id: s.seq, at: Date.now() }, ...s.log].slice(0, 200),
    }),
    [],
  );

  const note = useCallback(
    (op: string, detail: string, result: Result, subject?: string) =>
      update((s) => pushLog(s, { actor: currentRef.current, op, detail, result, subject })),
    [update, pushLog],
  );

  const rolesOf = useCallback((id: ActorId) => ref.current.roles[id] ?? [], []);

  // Seal the other synthetic records once, as the caseworker did at onboarding (mock only).
  useEffect(() => {
    if (fabric.mode !== "mock") return;
    const pending = ref.current.records.filter((r) => r.id !== "sv-001" && !r.sealed.addrfull);
    if (!pending.length) return;
    (async () => {
      for (const r of pending) {
        const tags: Tag[] = ["addrfull", "addrzone", "addrcontact"];
        const cts = await fabric.encrypt("mai", ref.current.roles.mai, tags.map((t) => ({ data: r.legacyPlain[t], tags: [t] })));
        update((s) => ({
          ...s,
          records: s.records.map((x) =>
            x.id === r.id ? { ...x, sealed: Object.fromEntries(tags.map((t, i) => [t, { tag: t, ct: cts[i] }])) } : x,
          ),
        }));
      }
    })();
  }, [fabric, update]);

  const sealAddress = useCallback(
    async (recordId: string, values: Record<Tag, string>) => {
      const me = currentRef.current;
      const tags = Object.keys(values) as Tag[];
      try {
        const cts = await fabric.encrypt(me, rolesOf(me), tags.map((t) => ({ data: values[t], tags: [t] })));
        update((s) =>
          pushLog(
            {
              ...s,
              records: s.records.map((r) =>
                r.id === recordId
                  ? { ...r, sealed: { ...r.sealed, ...Object.fromEntries(tags.map((t, i) => [t, { tag: t, ct: cts[i] }])) } }
                  : r,
              ),
            },
            { actor: me, op: "doEncrypt", detail: `${tags.join(", ")} → ${cts.length} ciphertexts stored, 0 plaintext`, result: "ok", subject: recordId },
          ),
        );
      } catch (e) {
        update((s) => pushLog(s, { actor: me, op: "doEncrypt", detail: (e as Error).message, result: "denied", subject: recordId }));
        throw e;
      }
    },
    [fabric, rolesOf, update, pushLog],
  );

  const open = useCallback(
    async (recordId: string, tag: Tag) => {
      const me = currentRef.current;
      const rec = ref.current.records.find((r) => r.id === recordId);
      const sealed = rec?.sealed[tag];
      if (!sealed) throw new Error("This record has not been sealed yet.");
      try {
        const [plain] = await fabric.decrypt(me, rolesOf(me), [{ encrypted: sealed.ct, tags: [tag] }]);
        update((s) => {
          let next = pushLog(s, { actor: me, op: "doDecrypt", detail: `${tag} → plaintext in ${actor(me).name}'s session only`, result: "ok", subject: recordId });
          // A break-glass grant works once. Revoke it as soon as it has been used.
          const used = next.requests.find((c) => c.status === "APPROVED" && c.oneTime && c.target === me && c.subject === recordId && c.role === role(tag, "selfdecrypt"));
          if (used) {
            next = {
              ...next,
              roles: { ...next.roles, [me]: next.roles[me].filter((r) => r !== used.role) },
              requests: next.requests.map((c) => (c.id === used.id ? { ...c, status: "USED" } : c)),
            };
            next = pushLog(next, { actor: me, op: "revoke", detail: `${used.id}: ${used.role} removed after one use`, result: "ok", subject: recordId });
          }
          return next;
        });
        return plain;
      } catch (e) {
        const msg = e instanceof DeniedError ? `${tag} → DENIED, ${e.message}` : `${tag} → ${(e as Error).message}`;
        update((s) => pushLog(s, { actor: me, op: "doDecrypt", detail: msg, result: "denied", subject: recordId }));
        throw e;
      }
    },
    [fabric, rolesOf, update, pushLog],
  );

  const makeRequest = useCallback(
    (action: "GRANT" | "REVOKE", input: GrantInput): ChangeRequest => {
      const me = currentRef.current;
      const cr: ChangeRequest = {
        id: `CR-${String(ref.current.requests.length + 1).padStart(3, "0")}`,
        action,
        target: input.target,
        role: role(input.tag, "selfdecrypt"),
        subject: input.subject,
        requestedBy: me,
        reason: input.reason,
        approvals: [],
        denials: [],
        status: "PENDING",
        oneTime: !!input.oneTime,
        createdAt: Date.now(),
      };
      update((s) =>
        pushLog(
          { ...s, requests: [cr, ...s.requests] },
          {
            actor: me,
            op: action === "GRANT" ? "assignRole" : "removeRole",
            detail: `${cr.id}: ${cr.role} → ${actor(cr.target).name} · 202 Accepted, change set PENDING (0/${THRESHOLD})`,
            result: "pending",
            subject: input.subject,
          },
        ),
      );
      return cr;
    },
    [update, pushLog],
  );

  const vote = useCallback(
    (crId: string, kind: "approve" | "deny") => {
      const me = currentRef.current;
      update((s) => {
        const cr = s.requests.find((c) => c.id === crId);
        if (!cr || cr.status !== "PENDING") return s;
        if (!actor(me).realmAdmin) {
          return pushLog(s, { actor: me, op: kind, detail: `${crId}: only tide-realm-admin holders can vote`, result: "denied" });
        }
        const next: ChangeRequest = {
          ...cr,
          approvals: kind === "approve" ? Array.from(new Set([...cr.approvals, me])) : cr.approvals.filter((a) => a !== me),
          denials: kind === "deny" ? Array.from(new Set([...cr.denials, me])) : cr.denials.filter((a) => a !== me),
        };
        next.status = decide(next);
        let out: DemoState = { ...s, requests: s.requests.map((c) => (c.id === crId ? next : c)) };
        out = pushLog(out, {
          actor: me,
          op: kind === "approve" ? "authorize" : "deny",
          detail: `${crId}: ${next.approvals.length}/${THRESHOLD} approvals${next.denials.length ? `, ${next.denials.length} denied` : ""}`,
          result: kind === "approve" ? "ok" : "denied",
          subject: cr.subject,
        });
        if (next.status === "APPROVED") {
          const roles = out.roles[next.target] ?? [];
          out = {
            ...out,
            roles: {
              ...out.roles,
              [next.target]: next.action === "GRANT" ? Array.from(new Set([...roles, next.role])) : roles.filter((r) => r !== next.role),
            },
          };
          out = pushLog(out, { actor: me, op: "commit", detail: `${crId}: quorum met, signed by threshold (TSS), change applied`, result: "ok", subject: cr.subject });
        }
        if (next.status === "DENIED") {
          out = pushLog(out, { actor: me, op: "commit", detail: `${crId}: quorum can no longer be reached, request closed`, result: "denied", subject: cr.subject });
        }
        return out;
      });
    },
    [update, pushLog],
  );

  const commit = useCallback(
    (crId: string) => {
      const me = currentRef.current;
      const cr = ref.current.requests.find((c) => c.id === crId);
      if (!cr) return;
      if (cr.approvals.length < THRESHOLD) {
        update((s) => pushLog(s, { actor: me, op: "commit", detail: `${crId}: 412 QUORUM_NOT_MET (${cr.approvals.length}/${THRESHOLD})`, result: "denied", subject: cr.subject }));
        throw new QuorumError(cr.approvals.length, THRESHOLD);
      }
      update((s) => pushLog(s, { actor: me, op: "commit", detail: `${crId}: already committed`, result: "ok", subject: cr.subject }));
    },
    [update, pushLog],
  );

  const reset = useCallback(() => {
    resetMockKeys();
    ref.current = emptyState();
    setState(ref.current);
  }, []);

  const value = useMemo<Unfound>(
    () => ({
      state,
      fabric,
      current,
      setCurrent,
      rolesOf: (id) => state.roles[id] ?? [],
      sealAddress,
      open,
      requestGrant: (i) => makeRequest("GRANT", i),
      requestRevoke: (i) => makeRequest("REVOKE", i),
      approve: (id) => vote(id, "approve"),
      deny: (id) => vote(id, "deny"),
      commit,
      note,
      reset,
    }),
    [state, fabric, current, setCurrent, sealAddress, open, makeRequest, vote, commit, note, reset],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
