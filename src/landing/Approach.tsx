import { motion } from "motion/react";
import { Reveal, Words } from "../motion/primitives";
import { ease } from "../motion/tokens";
import { FilmPlayer } from "./Film";

// How Unfound uses the Tide ecosystem: who talks to whom, and where the authority actually lives.
type Node = { id: string; x: number; y: number; w: number; title: string; sub: string; dark?: boolean };

const NODES: Node[] = [
  { id: "phone", x: 30, y: 40, w: 230, title: "Survivor's phone", sub: "doEncrypt · 3 tags" },
  { id: "server", x: 30, y: 300, w: 230, title: "Unfound server", sub: "Ciphertext only · pilot build" },
  { id: "tc", x: 385, y: 40, w: 230, title: "TideCloak", sub: "BYOiD sign-in · roles · tokens", dark: true },
  { id: "fabric", x: 385, y: 300, w: 230, title: "Tide Fabric", sub: "Independent ORK nodes · threshold", dark: true },
  { id: "svc", x: 740, y: 40, w: 230, title: "School · GP · Police", sub: "One role per tag" },
  { id: "quorum", x: 740, y: 300, w: 230, title: "Quorum of admins", sub: "Mai · Ruth · Dan · 2 of 3" },
];

const H = 64;
const mid = (n: Node, side: "l" | "r" | "t" | "b") =>
  side === "l" ? [n.x, n.y + H / 2] : side === "r" ? [n.x + n.w, n.y + H / 2] : side === "t" ? [n.x + n.w / 2, n.y] : [n.x + n.w / 2, n.y + H];
const by = (id: string) => NODES.find((n) => n.id === id)!;

const EDGES: { d: string; label: string; lx: number; ly: number; dur: number }[] = (() => {
  const [px, py] = mid(by("phone"), "b"), [sx, sy] = mid(by("server"), "t");
  const [pr, prY] = mid(by("phone"), "r"), [tl, tlY] = mid(by("tc"), "l");
  const [vl, vlY] = mid(by("svc"), "l"), [tr, trY] = mid(by("tc"), "r");
  const [vb, vbY] = mid(by("svc"), "b"), [fr, frY] = mid(by("fabric"), "r");
  const [ql, qlY] = mid(by("quorum"), "l");
  const [tb, tbY] = mid(by("tc"), "b"), [ft, ftY] = mid(by("fabric"), "t");
  return [
    { d: `M${px} ${py} L${sx} ${sy}`, label: "sealed parts", lx: px + 10, ly: (py + sy) / 2, dur: 2.4 },
    { d: `M${pr} ${prY} L${tl} ${tlY}`, label: "sign in", lx: (pr + tl) / 2 - 22, ly: prY - 10, dur: 2.2 },
    { d: `M${vl} ${vlY} L${tr} ${trY}`, label: "sign in", lx: (vl + tr) / 2 - 22, ly: vlY - 10, dur: 2.2 },
    { d: `M${vb} ${vbY} C${vb} ${vbY + 110} ${fr + 90} ${frY} ${fr} ${frY}`, label: "decrypt + token", lx: vb - 140, ly: vbY + 80, dur: 2.8 },
    { d: `M${ql} ${qlY} L${fr} ${frY + 14}`, label: "threshold-signed change", lx: fr + 40, ly: qlY + 34, dur: 2.6 },
    { d: `M${tb} ${tbY} L${ft} ${ftY}`, label: "policy · roles", lx: tb + 10, ly: (tbY + ftY) / 2, dur: 2.4 },
  ];
})();

function Diagram() {
  return (
    <svg className="ap-diagram" viewBox="0 0 1000 400" role="img" aria-label="The survivor's phone encrypts to the Unfound server, which stores ciphertext only. TideCloak signs people in. Services ask Tide's Fabric to decrypt with their token. Role changes need a 2 of 3 quorum of admins, signed by threshold.">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10z" fill="#c9c9c9" />
        </marker>
      </defs>
      {EDGES.map((e, i) => (
        <g key={i}>
          <motion.path
            d={e.d}
            fill="none"
            stroke="#c9c9c9"
            strokeWidth="1.2"
            markerEnd="url(#arrow)"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.9, ease: ease.out, delay: 0.3 + i * 0.12 }}
          />
          <circle r="3.5" fill="#3d8bff">
            <animateMotion dur={`${e.dur}s`} repeatCount="indefinite" path={e.d} begin={`${1.4 + i * 0.3}s`} />
          </circle>
          <text x={e.lx} y={e.ly} fontFamily="Inter, sans-serif" fontSize="11.5" fill="#6e6e6e">{e.label}</text>
        </g>
      ))}
      {NODES.map((n, i) => (
        <motion.g
          key={n.id}
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: ease.out, delay: i * 0.06 }}
          style={{ transformOrigin: `${n.x + n.w / 2}px ${n.y + H / 2}px` }}
        >
          <rect x={n.x} y={n.y} width={n.w} height={H} rx="8" fill={n.dark ? "#000" : "#fff"} stroke={n.dark ? "#000" : "#dfdfdf"} />
          <text x={n.x + 16} y={n.y + 27} fontFamily="Geist, Inter, sans-serif" fontWeight="600" fontSize="16" fill={n.dark ? "#fff" : "#000"}>{n.title}</text>
          <text x={n.x + 16} y={n.y + 47} fontFamily="Inter, sans-serif" fontSize="12" fill={n.dark ? "#c9c9c9" : "#6e6e6e"}>{n.sub}</text>
          {n.id === "fabric" && [0, 1, 2, 3, 4].map((k) => (
            <circle key={k} className="ork" cx={n.x + n.w - 22 - k * 13} cy={n.y + 18} r="4" fill="#8dbbff" style={{ animationDelay: `${k * 0.25}s` }} />
          ))}
        </motion.g>
      ))}
    </svg>
  );
}

const PILLARS = [
  {
    t: "Sign in without a password store",
    b: "People sign in through TideCloak with Tide's bring-your-own-identity. There is no password hash in our database for anyone, insider or outsider, to take.",
    tide: "TideCloak · BYOiD · OIDC",
  },
  {
    t: "Encrypt at the edge",
    b: "The address is split into three tagged parts and encrypted in the survivor's browser. Our server stores ciphertext and never holds a key.",
    tide: "Hermetic E2EE · doEncrypt",
  },
  {
    t: "Authority that emerges",
    b: "Decryption happens across Tide's Fabric of independent nodes, only for a token that carries the right tag role. No node, server or person holds a whole key.",
    tide: "Tide Fabric · _tide_<tag>.selfdecrypt",
  },
  {
    t: "Governance nobody can skip",
    b: "Giving anyone a role is a change set. Two of three realm admins must sign it, by threshold signature, and every vote is on record.",
    tide: "Quorum-Enforced Governance",
  },
];

export function Approach() {
  return (
    <section id="approach" className="section">
      <div className="container">
        <div className="section-head">
          <Reveal><span className="eyebrow">Approach</span></Reveal>
          <h2><Words text="Take the key out of the system." /></h2>
          <Reveal delay={0.1}>
            <p>
              Most privacy fixes add another lock and hand someone the key. Unfound builds on Tide's ecosystem so the power to read an
              address only exists when the right people line up. It never sits in our code, our server or our admins' hands.
            </p>
          </Reveal>
        </div>

        <FilmPlayer />

        <Reveal className="ap-figure">
          <Diagram />
        </Reveal>

        <ol className="ap-pillars">
          {PILLARS.map((p, i) => (
            <Reveal as="li" key={p.t} delay={i * 0.08} className="ap-pillar">
              <span className="ap-n">0{i + 1}</span>
              <h3>{p.t}</h3>
              <p>{p.b}</p>
              <span className="ap-tide">{p.tide}</span>
            </Reveal>
          ))}
        </ol>

        <Reveal className="ap-nots">
          <span className="eyebrow">What we chose not to build</span>
          <ul>
            <li>Server-side decryption</li>
            <li>An admin override</li>
            <li>Plaintext logs</li>
            <li>A master key</li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
