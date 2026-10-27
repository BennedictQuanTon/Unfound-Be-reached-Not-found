// Hand-built charts. Every width and height is value / axis max, so the marks are to scale.
// Marks are drawn in with clip-path once the chart is a third visible (no layout work, no distortion).

import type { CSSProperties } from "react";
import { useInClass } from "../motion/primitives";

export interface Bar {
  label: string;
  value: number;
  display: string;
  tone: "seal" | "ink" | "ctx";
}

const d = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;

export function BarChart({ bars, max, ticks, label }: { bars: Bar[]; max: number; ticks: string[]; label: string }) {
  const [ref, inCls] = useInClass<HTMLDivElement>();
  return (
    <div ref={ref} className={`bars draw ${inCls}`} role="img" aria-label={label}>
      {bars.map((b, i) => (
        <div key={b.label} title={`${b.label}: ${b.display}`}>
          <div className="bar-label">
            <span>{b.label}</span>
            <span>{b.display}</span>
          </div>
          <div className="track">
            <div className={`fill ${b.tone === "ctx" ? "" : b.tone}`} style={{ width: `${(b.value / max) * 100}%`, ...d(0.15 + i * 0.12) }} />
          </div>
        </div>
      ))}
      <div className="axis">
        {ticks.map((t) => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export function UnitChart({ on, label }: { on: number; label: string }) {
  const [ref, inCls] = useInClass<HTMLDivElement>();
  return (
    <div ref={ref} className={`units draw ${inCls}`} role="img" aria-label={label}>
      {Array.from({ length: 100 }, (_, i) => (
        <i key={i} className={i < on ? "on" : undefined} style={d(0.1 + (i % 10) * 0.025 + Math.floor(i / 10) * 0.035)} />
      ))}
    </div>
  );
}

// "n in m" as m large dots, n of them filled: for ratios that are reported approximately.
export function RatioChart({ on, of, label }: { on: number; of: number; label: string }) {
  const [ref, inCls] = useInClass<HTMLDivElement>();
  return (
    <div ref={ref} className={`ratio draw ${inCls}`} role="img" aria-label={label}>
      {Array.from({ length: of }, (_, i) => (
        <i key={i} className={i < on ? "on" : undefined} style={d(0.15 + i * 0.12)} />
      ))}
    </div>
  );
}

export interface StackedYear {
  year: string;
  ctx: number;
  grow: number;
}

export function StackedColumns({ data, max, ticks, label, ctxName, growName }: {
  data: StackedYear[];
  max: number;
  ticks: number[];
  label: string;
  ctxName: string;
  growName: string;
}) {
  const [ref, inCls] = useInClass<HTMLDivElement>();
  const pct = (v: number) => `${(v / max) * 100}%`;
  return (
    <div className="stack">
      <div className="legend">
        <span><i style={{ background: "var(--color-stone)" }} />{ctxName}</span>
        <span><i style={{ background: "var(--color-seal)" }} />{growName}</span>
      </div>
      <div ref={ref} className={`columns draw ${inCls}`} role="img" aria-label={label}>
        <div className="yaxis">
          {ticks.map((t) => (
            <span key={t} style={{ bottom: pct(t) }}>{t}</span>
          ))}
        </div>
        <div className="plot">
          {ticks.slice(1).map((t) => (
            <div key={t} className="gridline" style={{ bottom: pct(t) }} />
          ))}
          {data.map((y, i) => (
            <div className="col" key={y.year}>
              <div className="seg ctx" style={{ height: pct(y.ctx), ...d(0.1 + i * 0.1) }} title={`${y.year} · ${ctxName}: ${y.ctx}`} />
              <div className="seg grow" style={{ height: pct(y.grow), ...d(0.45 + i * 0.12) }} title={`${y.year} · ${growName}: ${y.grow}`} />
            </div>
          ))}
        </div>
        <div className="xlabels">
          {data.map((y) => (
            <span key={y.year}>
              {y.year}
              <br />
              {y.ctx + y.grow}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
