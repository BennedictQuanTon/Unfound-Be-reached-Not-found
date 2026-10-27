import { motion, type Variants } from "motion/react";
import { Avatar, type AvatarKey } from "../brand/Avatar";
import { Reveal, Words } from "../motion/primitives";
import { ease } from "../motion/tokens";

const ROWS: { who: AvatarKey; name: string; today: string; unfound: string; tag: string }[] = [
  { who: "school", name: "Her son's school", today: "Full address in the enrolment file", unfound: "In Footscray North zone ✓", tag: "addrzone" },
  { who: "gp", name: "GP clinic", today: "Address and mobile number", unfound: "Footscray · relay 0400 000 117", tag: "addrcontact" },
  { who: "court", name: "Court mail", today: "Address in a clerk's Word file", unfound: "Opened only as the label prints", tag: "addrfull" },
  { who: "officer", name: "Police", today: "Search the database any time", unfound: "One view after 2 of 3 approve", tag: "break-glass" },
  { who: "dan", name: "Admin, DBA, operator", today: "Everything", unfound: "Ciphertext. A self-grant gets 412", tag: "QEA" },
];

// Compositor-only motion (opacity, transform, clip-path) so scrolling never triggers layout.
const row: Variants = {
  hide: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: ease.out } },
};
const strike: Variants = {
  hide: { scaleX: 0 },
  show: { scaleX: 1, transition: { duration: 0.6, ease: ease.outExpo, delay: 0.35 } },
};
const wipe: Variants = {
  hide: { clipPath: "inset(0% 100% 0% 0%)" },
  show: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 0.8, ease: ease.outExpo, delay: 0.55 } },
};

export function WhoSees() {
  return (
    <section id="who" className="section">
      <div className="container">
        <div className="section-head">
          <Reveal><span className="eyebrow">Who sees what</span></Reveal>
          <h2><Words text="Every service can reach her. None can look her up." /></h2>
        </div>
        <ol className="ws-list">
          {ROWS.map((r, i) => (
            <motion.li key={r.name} className="ws-row" variants={row} initial="hide" whileInView="show" viewport={{ once: true, amount: 0.5 }}>
              <span className="ws-n">0{i + 1}</span>
              <div className="ws-who">
                <Avatar id={r.who} size={52} />
                <div>
                  <b>{r.name}</b>
                  <span className="mono">{r.tag}</span>
                </div>
              </div>
              <div className="ws-today">
                <span className="ws-label">Today</span>
                <span className="ws-strike">
                  {r.today}
                  <motion.i variants={strike} />
                </span>
              </div>
              <motion.div className="ws-now" variants={wipe}>
                <span className="ws-label">With Unfound</span>
                <span className="ws-now-text">{r.unfound}</span>
              </motion.div>
            </motion.li>
          ))}
        </ol>
        <p className="source" style={{ marginTop: 16 }}>Illustrations: Notionists by Zoish (CC0), rendered with DiceBear.</p>
      </div>
    </section>
  );
}
