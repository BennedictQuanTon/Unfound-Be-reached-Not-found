import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "motion/react";
import { Brand, Mark } from "../brand/Logo";
import { BarChart, RatioChart, StackedColumns, UnitChart } from "./Charts";
import { HeroScene } from "./HeroScene";
import { Showcase } from "./Showcase";
import { WhoSees } from "./WhoSees";
import { Stack } from "./Stack";
import { Prototype } from "./Prototype";
import { Approach } from "./Approach";
import { Compare, References } from "./Compare";
import { Scope } from "./Scope";
import { CountUp, Reveal, ScrollWords, Words } from "../motion/primitives";
import { Intro, introSeen } from "../motion/Intro";
import { ease } from "../motion/tokens";

// Clutch's hero move: the headline sits in light gray and one phrase at a time turns black.
const PHRASES = ["Every school.", "Every clinic.", "No one looks you up."];

function HeroHeadline({ play, delay }: { play: boolean; delay: number }) {
  const [on, setOn] = useState(-1);
  useEffect(() => {
    if (!play) return;
    let i = PHRASES.length - 1;
    let iv = 0;
    const first = window.setTimeout(() => {
      setOn(i);
      iv = window.setInterval(() => {
        i = (i + 1) % PHRASES.length;
        setOn(i);
      }, 2200);
    }, (delay + 0.8) * 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(iv);
    };
  }, [play, delay]);
  return (
    <h1 aria-label={PHRASES.join(" ")}>
      {PHRASES.map((p, i) => (
        <span key={p} aria-hidden="true">
          <motion.span
            className={`phrase ${on === i ? "on" : ""}`}
            style={{ display: "inline-block" }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={play ? { opacity: 1, scale: 1 } : undefined}
            transition={{ duration: 0.7, ease: ease.out, delay: delay + i * 0.12 }}
          >
            {p}
          </motion.span>
          {i < PHRASES.length - 1 ? " " : null}
        </span>
      ))}
    </h1>
  );
}

function Nav() {
  const { scrollY, scrollYProgress } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 8);
    setHidden(y > 240 && y > prev + 2 ? true : y < prev - 2 ? false : hidden);
  });
  return (
    <motion.header
      className={`nav ${scrolled ? "scrolled" : ""}`}
      animate={{ y: hidden ? "-100%" : "0%" }}
      transition={{ duration: 0.35, ease: ease.out }}
    >
      <div className="container nav-inner">
        <Brand />
        <nav className="nav-links" aria-label="Sections">
          <a href="#problem"><span>Problem</span></a>
          <a href="#approach"><span>Approach</span></a>
          <a href="#how"><span>How it works</span></a>
          <a href="#prototype"><span>Prototype</span></a>
        </nav>
        <Link to="/demo" className="btn" data-sfx="whoosh">Open demo</Link>
      </div>
      <motion.div className="progress" style={{ scaleX: progress }} />
    </motion.header>
  );
}

const rise = (play: boolean, delay: number) => ({
  initial: { opacity: 0, scale: 0.98 },
  animate: play ? { opacity: 1, scale: 1 } : undefined,
  transition: { duration: 0.7, ease: ease.out, delay },
});

export function Landing() {
  const [showIntro] = useState(() => !introSeen());
  const [ready, setReady] = useState(!showIntro);
  const onIntroDone = useCallback(() => setReady(true), []);

  // Hero parallax: the scene sinks a little as you scroll away.
  const { scrollY } = useScroll();
  const sceneY = useTransform(scrollY, [0, 800], [0, 90]);
  const copyOpacity = useTransform(scrollY, [0, 420], [1, 0.3]);
  const base = showIntro ? 0.15 : 0.35; // after a route change, wait for the curtain to lift

  return (
    <>
      {showIntro && <Intro onDone={onIntroDone} />}
      <Nav />

      <div className="rails">
      <main>
        <section className="container hero">
          <motion.div className="hero-copy" style={{ opacity: copyOpacity }}>
            <HeroHeadline play={ready} delay={base} />
            <motion.p className="lede" {...rise(ready, base + 0.4)}>
              A safe address for family-violence survivors.<br />
              Services can reach you.<br />
              No single admin can look you up.
            </motion.p>
            <motion.div className="hero-ctas" {...rise(ready, base + 0.5)}>
              <Link to="/demo?story=1" className="btn lam lg" data-sfx="whoosh">Play the story</Link>
              <a href="#problem" className="btn outline lg">See the problem <span className="arrow">→</span></a>
            </motion.div>
          </motion.div>
          <motion.div className="hero-scene-wrap" style={{ y: sceneY }}>
            {ready && <HeroScene />}
          </motion.div>
        </section>

        <section id="problem" className="section fog">
          <div className="container">
            <div className="section-head">
              <Reveal><span className="eyebrow">The problem</span></Reveal>
              <h2><Words text="A new address is the *most* *dangerous* *data* a survivor owns." /></h2>
              <Reveal delay={0.15}>
                <p>
                  Leaving is when the risk peaks. Every service a survivor uses afterwards stores the new address in plain text,
                  readable by staff and every administrator. Her children's records carry it too. One lookup, or one misdirected letter, is enough.
                </p>
              </Reveal>
            </div>

            <div className="stats">
              <Reveal as="article" className="card stat" delay={0}>
                <div className="stat-top"><span className="eyebrow">AU · Partner violence</span></div>
                <div className="stat-num"><CountUp value={1.5} decimals={1} suffix="M" /></div>
                <p className="stat-claim">Australian women have experienced violence from a <b>previous</b> partner, about nine times more than from a current one. The threat is someone who no longer knows where you live.</p>
                <BarChart
                  label="Share of Australian adults who experienced cohabiting partner violence since age 15"
                  max={20}
                  ticks={["0%", "5%", "10%", "15%", "20%"]}
                  bars={[
                    { label: "Women · previous partner", value: 16, display: "16% · 1.5M", tone: "seal" },
                    { label: "Men · previous partner", value: 4.5, display: "4.5% · 425,400", tone: "ctx" },
                    { label: "Women · current partner", value: 1.7, display: "1.7% · 173,300", tone: "ink" },
                  ]}
                />
                <p className="source">ABS, Personal Safety Survey 2021–22, Partner violence.</p>
              </Reveal>

              <Reveal as="article" className="card stat" delay={0.08}>
                <div className="stat-top"><span className="eyebrow">AU · Leaving</span></div>
                <div className="stat-num"><CountUp value={64} suffix="%" /></div>
                <p className="stat-claim">of those women moved out when the relationship ended: <b>866,700</b> new addresses that school, GP, bank and electoral records all ask for.</p>
                <UnitChart on={64} label="64 of 100 squares filled: 64% moved out at final separation" />
                <div className="legend">
                  <span><i style={{ background: "var(--color-seal)" }} />Moved out at separation · 64%</span>
                  <span><i style={{ background: "var(--color-slate-mist)" }} />Did not · 36%</span>
                </div>
                <p className="source">ABS, Personal Safety Survey 2021–22. Women who lived with a violent previous partner.</p>
              </Reveal>

              <Reveal as="article" className="card stat" delay={0}>
                <div className="stat-top"><span className="eyebrow">NSW · Separation</span></div>
                <div className="stat-num">~2 in 3</div>
                <p className="stat-claim">women killed by a male intimate partner were killed <b>after leaving or while separating</b>: just over a third after the relationship ended, another third as it was ending.</p>
                <RatioChart on={2} of={3} label="About two in three women killed by an intimate partner in NSW were killed after leaving or while separating" />
                <p className="source">NSW Domestic Violence Death Review Team, Report 2021–23, as reported by the Canberra Times.</p>
              </Reveal>

              <Reveal as="article" className="card stat" delay={0.08}>
                <div className="stat-top"><span className="eyebrow">UK · Survivors</span></div>
                <div className="stat-num"><CountUp value={40} suffix="%" /></div>
                <p className="stat-claim">of survivors had their new address disclosed to the abuser, <b>mostly by agencies such as their child's school or the council</b>. With children, it was 52%.</p>
                <BarChart
                  label="Survivors whose new address was disclosed to the perpetrator, Great Britain, survey of 1,019 survivors"
                  max={100}
                  ticks={["0%", "25%", "50%", "75%", "100%"]}
                  bars={[
                    { label: "All survivors", value: 40, display: "40%", tone: "seal" },
                    { label: "Survivors with children", value: 52, display: "52%", tone: "ink" },
                  ]}
                />
                <p className="source">Citizens Advice and Opinium, survey of 1,019 survivors (fieldwork 2019), published February 2020.</p>
              </Reveal>

              <Reveal as="article" className="card stat" delay={0}>
                <div className="stat-top"><span className="eyebrow">AU · Insiders</span></div>
                <div className="stat-num"><CountUp value={2215} comma /></div>
                <p className="stat-claim">allegations of misused confidential information in four years, across just seven Queensland agencies. Outside the police they grew <b>4.8×</b>, in health, schools and corrections.</p>
                <StackedColumns
                  label="Misuse of confidential information allegations by financial year, Queensland, 2015/16 to 2018/19"
                  max={700}
                  ticks={[0, 200, 400, 600]}
                  ctxName="Police (QPS)"
                  growName="Health, education, corrections, transport"
                  data={[
                    { year: "15/16", ctx: 488, grow: 65 },
                    { year: "16/17", ctx: 439, grow: 73 },
                    { year: "17/18", ctx: 371, grow: 174 },
                    { year: "18/19", ctx: 293, grow: 312 },
                  ]}
                />
                <p className="source">Crime and Corruption Commission QLD, Operation Impala, Exhibit 95 (2019).</p>
              </Reveal>

              <Reveal as="article" className="card stat" delay={0.08}>
                <div className="stat-top"><span className="eyebrow">UK · Regulator</span></div>
                <div className="stat-num"><CountUp value={4} suffix=" of 7" /></div>
                <p className="stat-claim">organisations reprimanded in 15 months for breaching domestic-abuse victims' data had <b>revealed a safe address to the alleged abuser</b>. The seven included a benefits agency, police, councils and a hospital trust.</p>
                <BarChart
                  label="UK Information Commissioner reprimands for data breaches affecting domestic abuse victims, June 2022 to September 2023"
                  max={8}
                  ticks={["0", "2", "4", "6", "8"]}
                  bars={[
                    { label: "Reprimands · victims' data", value: 7, display: "7", tone: "ctx" },
                    { label: "Safe address sent to the abuser", value: 4, display: "4", tone: "seal" },
                  ]}
                />
                <p className="source">UK Information Commissioner's Office, statement of 29 September 2023.</p>
              </Reveal>
            </div>

            <div className="cases">
              <Reveal className="case">
                <span className="eyebrow">Queensland · 2014</span>
                <p>A senior constable searched the police database and passed a survivor's new address to her abuser, his friend. A tribunal found the police service liable for failing to control access.</p>
              </Reveal>
              <Reveal className="case" delay={0.1}>
                <span className="eyebrow">Queensland · 2024</span>
                <p>The same system auto-filled survivors' addresses into forms served on offenders. In 2025 the Information Commissioner found police had known the risk "since at least 2017".</p>
              </Reveal>
              <Reveal className="case" delay={0.2}>
                <span className="eyebrow">England · 2023</span>
                <p>A council filed a survivor's new address in a notes field, then posted a letter containing it to her old home. Her ex-partner opened it. The regulator issued a reprimand.</p>
              </Reveal>
            </div>
          </div>
        </section>

        <Approach />
        <Showcase />
        <WhoSees />
        <Stack />
        <Prototype />
        <Scope />
        <Compare />
        <References />

        <section className="section fog tall">
          <div className="container section-head" style={{ marginBottom: 0 }}>
            <Reveal><span className="eyebrow">What changes</span></Reveal>
            <ScrollWords text="Survivors stop choosing between *help* and *hiding.* Services stop being the leak." />
            <Reveal delay={0.1}>
              <p>Agencies can prove that no single employee, including their own admins, can reveal where someone lives.</p>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="stack">
            <div className="row"><Mark size={22} /><b>unfound</b></div>
            <p className="muted">Be reached, not found. All data in this prototype is synthetic.</p>
            <a href="https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked" target="_blank" rel="noreferrer">
              <img src="https://tide.org/badges/built-with-tidecloak.svg" alt="Built with TideCloak" height={28} />
            </a>
          </div>
          <ol>
            <li>ABS, Personal Safety, Australia 2021–22 (Partner violence).</li>
            <li>CCC Queensland, Operation Impala Exhibit 95, 2019.</li>
            <li>UK Information Commissioner's Office, domestic abuse data breaches, 29 Sep 2023; Charnwood Borough Council reprimand, 29 Nov 2023.</li>
            <li>NSW Domestic Violence Death Review Team, Report 2021–23. Citizens Advice / Opinium survivor survey, February 2020.</li>
            <li>QCAT decision on Queensland Police Service, reported 2018–2019; Queensland Information Commissioner, Prioritising privacy to keep victims safe, Dec 2025.</li>
          </ol>
        </div>
      </footer>
      </div>
    </>
  );
}
