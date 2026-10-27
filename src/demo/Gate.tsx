import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mark } from "../brand/Logo";
import { Avatar } from "../brand/Avatar";
import { ACTORS } from "./engine";
import { ease } from "../motion/tokens";
import { play, unlockSfx, whoosh } from "../motion/sfx";

export type Iris = { x: number; y: number; color: string };

// The welcome screen in front of /demo: the cast gathers around the mark, and you choose how to run it.
// Choosing pops an iris of the button's colour out from the click point; Demo then opens it onto the app.
export function Gate({ liveReady, onLive, onMock, onStory }: {
  liveReady: boolean;
  onLive: (iris: Iris) => void;
  onMock: (iris: Iris) => void;
  onStory: (iris: Iris) => void;
}) {
  const [iris, setIris] = useState<Iris | null>(null);
  const [sorry, setSorry] = useState(false);
  const openSorry = () => {
    unlockSfx();
    setSorry(true);
    window.setTimeout(() => play("pop"), 120);
  };

  const go = (e: MouseEvent<HTMLButtonElement>, color: string, next: (i: Iris) => void) => {
    unlockSfx();
    const r = e.currentTarget.getBoundingClientRect();
    const i = { x: e.clientX || r.left + r.width / 2, y: e.clientY || r.top + r.height / 2, color };
    setIris(i);
    whoosh("up", 0.55, 0.2);
    window.setTimeout(() => next(i), 560);
  };

  const seats = ACTORS.map((a, i) => {
    const ang = (-90 + (i * 360) / ACTORS.length) * (Math.PI / 180);
    return { a, x: 50 + 44 * Math.cos(ang), y: 50 + 45 * Math.sin(ang), i };
  });

  return (
    <div className="gate">
      <div className="gate-stage" aria-hidden="true">
        {seats.map(({ a, x, y, i }) => (
          <motion.div
            key={a.id}
            className="gate-person"
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ opacity: 0, scale: 0.6, y: 20 }}
            animate={iris ? { opacity: 0, scale: 0.8, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            transition={iris ? { duration: 0.3 } : { type: "spring", stiffness: 260, damping: 18, delay: 0.5 + i * 0.07 }}
          >
            <div className="bob-soft" style={{ animationDelay: `${-i * 0.8}s` }}>
              <Avatar id={a.id} size={84} />
              <span>{a.name.split(" ")[0]}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="gate-center">
        <motion.div className="gate-brand" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: ease.out, delay: 0.2 }}>
          <Mark size={56} />
          <span>unfound</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: ease.out, delay: 0.35 }}>
          Welcome. <em>Pick a seat.</em>
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}>
          Seven people, one address, no master key.
        </motion.p>

        <div className="gate-choices">
          <motion.button
            className="gate-choice dark"
            data-sfx="tap"
            onClick={(e) => (liveReady ? go(e, "#000", onLive) : openSorry())}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 26, delay: 0.7 }}
          >
            <span className="gate-icon"><Mark size={28} color="#fff" /></span>
            <b>With a Tide account</b>
          </motion.button>

          <motion.button
            className="gate-choice"
            data-sfx="tap"
            onClick={(e) => go(e, "#e2eeff", onMock)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 26, delay: 0.8 }}
          >
            <span className="gate-icon faces">
              <Avatar id="linh" size={30} />
              <Avatar id="school" size={30} />
              <Avatar id="dan" size={30} />
            </span>
            <b>Without an account</b>
          </motion.button>
        </div>


        <motion.button className="gate-story" data-sfx="tap" onClick={(e) => go(e, "#ffffff", onStory)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor" /></svg>
          Watch the 70-second story
        </motion.button>
      </div>


      <AnimatePresence>
        {sorry && (
          <motion.div className="sorry-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSorry(false)}>
            <motion.div
              className="sorry"
              role="dialog"
              aria-modal="true"
              aria-labelledby="sorry-title"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.85, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
            >
              <div className="sorry-art">
                <motion.span initial={{ rotate: -8, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}>
                  <Avatar id="linh" size={88} />
                </motion.span>
                <span className="sorry-mark"><Mark size={26} color="#fff" /></span>
              </div>
              <h2 id="sorry-title">Sorry, <em>not on this one.</em></h2>
              <p>
                We couldn't create a Tide account during the hackathon: Tide's network failed every enrolment
                (13–17 of 20 ORKs not responding), so live sign-in can't run on this site.
              </p>
              <p>
                To test with Tide, run the project from GitHub on your own machine. One command sets up TideCloak, the realm and the app.
              </p>
              <div className="sorry-actions">
                <a className="btn lg" href="https://github.com/BennedictQuanTon/Unfound-Be-reached-Not-found#setup" target="_blank" rel="noreferrer">
                  Open on GitHub <span className="arrow">→</span>
                </a>
                <button className="btn lg outline" data-sfx="tap" onClick={(e) => { setSorry(false); go(e, "#e2eeff", onMock); }}>
                  Explore without an account
                </button>
              </div>
              <button className="sorry-close" aria-label="Close" data-sfx="hide" onClick={() => setSorry(false)}>×</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {iris && (
        <div className="iris">
          <IrisDisc iris={iris} from={0} to={1} />
          <motion.span className="iris-mark" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 16, delay: 0.28 }} onAnimationStart={() => window.setTimeout(() => play("pop"), 280)}>
            <Mark size={72} color={iris.color === "#000" ? "#fff" : "#000"} />
          </motion.span>
        </div>
      )}
    </div>
  );
}

// A disc big enough to cover the screen from (x, y), grown or shrunk with transform only.
function IrisDisc({ iris, from, to, delay = 0 }: { iris: Iris; from: number; to: number; delay?: number }) {
  const R = Math.hypot(Math.max(iris.x, window.innerWidth - iris.x), Math.max(iris.y, window.innerHeight - iris.y)) + 4;
  return (
    <div
      className={`iris-disc ${to > from ? "grow" : "shrink"}`}
      style={{ left: iris.x - R, top: iris.y - R, width: R * 2, height: R * 2, background: iris.color, animationDelay: `${delay}s` }}
    />
  );
}

// The second half of the pop: the colour closes back into the centre and the app is underneath.
export function IrisOut({ iris }: { iris: Iris }) {
  const centre = { ...iris, x: window.innerWidth / 2, y: window.innerHeight / 2 };
  return (
    <div className="iris" style={{ pointerEvents: "none" }}>
      <IrisDisc iris={centre} from={1} to={0} delay={0.1} />
      <motion.span className="iris-mark" initial={{ scale: 1, opacity: 1 }} animate={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <Mark size={72} color={iris.color === "#000" ? "#fff" : "#000"} />
      </motion.span>
    </div>
  );
}
