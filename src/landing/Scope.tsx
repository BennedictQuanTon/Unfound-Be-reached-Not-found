import { Check, X } from "lucide-react";
import { Reveal, Words } from "../motion/primitives";

// The protection boundary, stated plainly: what Unfound interrupts, what it cannot, and how much of it is proven.
const COVERED: [string, string][] = [
  ["Lookups by staff or a compromised account", "Inside a participating service, each person opens only the part their role allows, and every attempt is logged."],
  ["An admin granting themselves access", "Every grant is a change set that needs two of three independent approvers."],
  ["A breach of Unfound's servers or database", "There is only ciphertext to take. No key is stored with it."],
  ["Letters and forms produced through Unfound", "The street is filled in only at the moment of printing, never saved into a template, note or export."],
];

const NOT_COVERED: [string, string][] = [
  ["Being followed, GPS trackers, shared location accounts", "Physical and device stalking need safety planning and tech-safety support."],
  ["People who already know the address", "Friends, family or neighbours are outside any system."],
  ["Copies held by services not on Unfound", "A bank or agency that keeps its own plain-text copy keeps the old exposure."],
  ["What an authorised person does after a legitimate view", "An officer who saw the address once can still write it down."],
  ["A survivor's own phone, if taken or compromised", "Nothing is shown by default; a quick-exit control is on the roadmap. This is reduced, not prevented."],
];

const STATUS: { k: string; t: string; d: string }[] = [
  { k: "Verified on live Tide", t: "Realm licensed, enrolment blocked", d: "A realm with Quorum-Enforced Governance was provisioned on 22 Oct 2026. Creating the first account failed when Tide's ORK network answered 3–7 of 20 nodes." },
  { k: "Implemented in code", t: "The live integration", d: "TideCloak sign-in with DPoP, doEncrypt and doDecrypt per tag, AdminAPI change sets, the six tag roles and a one-command setup." },
  { k: "Simulated in the prototype", t: "The whole story", d: "The eight scenes run on a mock fabric with the same role and quorum rules. Relay numbers, court printing and the one-view revoke are simulated." },
];

export function Scope() {
  return (
    <section id="scope" className="section fog">
      <div className="container">
        <div className="section-head">
          <Reveal><span className="eyebrow">Scope</span></Reveal>
          <h2><Words text="What Unfound protects, and what it *doesn't.*" /></h2>
          <Reveal delay={0.1}>
            <p>Unfound closes one dangerous path: services that hold a survivor's address and leak it through a lookup, a permission change or a letter. It is one part of a safety plan, not a replacement for it.</p>
          </Reveal>
        </div>

        <div className="scope-grid">
          <Reveal className="scope-col">
            <span className="scope-k">Covered</span>
            <ul>
              {COVERED.map(([h, d]) => (
                <li key={h}>
                  <span className="scope-ic yes"><Check size={14} strokeWidth={2.4} aria-hidden="true" /></span>
                  <div><b>{h}</b><span>{d}</span></div>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="scope-col" delay={0.1}>
            <span className="scope-k">Not covered</span>
            <ul>
              {NOT_COVERED.map(([h, d]) => (
                <li key={h}>
                  <span className="scope-ic no"><X size={14} strokeWidth={2.4} aria-hidden="true" /></span>
                  <div><b>{h}</b><span>{d}</span></div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <div className="scope-status">
          {STATUS.map((s, i) => (
            <Reveal key={s.k} className={`scope-stage ${i === 0 ? "warn" : ""}`} delay={i * 0.08}>
              <span className="scope-k">{s.k}</span>
              <b>{s.t}</b>
              <span>{s.d}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
