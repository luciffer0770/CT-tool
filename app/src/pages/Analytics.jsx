import React, { useMemo } from "react";
import Icon from "../components/Icon.jsx";
import { Donut, HBar, Histogram } from "../components/Charts.jsx";
import { useStore } from "../store/useStore.js";
import {
  bottleneckContribution, vaNvaRatio, taktGap, stepImpact,
  lineBalance, cycleStats, variationAnalysis, suggestOptimization, autoLineBalance,
} from "../engine/analytics.js";

export default function Analytics({ schedule }) {
  const steps = useStore(s => s.steps);
  const taktTime = useStore(s => s.taktTime);
  const setPage = useStore(s => s.setPage);
  const setSelectedId = useStore(s => s.setSelectedId);

  const contrib = useMemo(() => bottleneckContribution(schedule), [schedule]);
  const va = useMemo(() => vaNvaRatio(schedule), [schedule]);
  const gap = useMemo(() => taktGap(schedule), [schedule]);
  const lb = useMemo(() => lineBalance(steps), [steps]);
  const stats = useMemo(() => cycleStats(steps), [steps]);
  const variation = useMemo(() => variationAnalysis(steps), [steps]);
  const suggestions = useMemo(() => suggestOptimization(steps, taktTime), [steps, taktTime]);
  const autoBalance = useMemo(() => autoLineBalance(steps, Math.max(2, Object.keys(lb.load).length || 3)), [steps, lb]);

  const maxDur = Math.max(...steps.map(s => (s.machineTime || 0) + (s.operatorTime || 0) + (s.setupTime || 0)), 1);

  return (
    <>
      <div className="crumbs">WORKSPACE <span className="sep">/</span> LINE-07 <span className="sep">/</span> ANALYTICS</div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Analytics</h1>
          <div className="page-sub">Bottleneck analysis, value-added ratio, distributions and AI-driven suggestions.</div>
        </div>
        <div className="toolbar">
          <button className="btn"><Icon name="clock" size={13}/> Last 7 days</button>
          <button className="btn primary" onClick={() => setPage("sim")}><Icon name="play" size={13}/> Open Simulation</button>
        </div>
      </div>

      {suggestions[0] && (
        <div className="insight" style={{ marginBottom: 12 }}>
          <div className="ic"><Icon name="zap" size={15}/></div>
          <div className="txt">{suggestions[0].message}</div>
          <button className="btn accent sm" onClick={() => setPage("sim")}>Apply in simulation</button>
        </div>
      )}

      <div className="section-row">
        <div className="card col-8">
          <div className="card-head">
            <h3>Bottleneck Analysis</h3>
            <span className="sub">STEP DURATION RANKED</span>
          </div>
          <div className="card-body">
            {[...schedule.steps].sort((a, b) => b.cycleTime - a.cycleTime).map((s, i) => (
              <div
                key={s.id}
                className="hbar-row"
                style={{ gridTemplateColumns: "40px 160px 1fr 80px", cursor: "pointer" }}
                onClick={() => { setSelectedId(s.id); setPage("builder"); }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-4)" }}>#{i + 1}</div>
                <div className="lbl">{s.name}</div>
                <div className="track" style={{ height: 14, position: "relative" }}>
                  <div className="fill" style={{ width: `${(s.machineTime / maxDur) * 100}%`, background: "var(--blue)" }}/>
                  <div className="fill" style={{ left: `${(s.machineTime / maxDur) * 100}%`, width: `${(s.operatorTime / maxDur) * 100}%`, background: "var(--cyan)" }}/>
                  <div className="fill" style={{ left: `${((s.machineTime + s.operatorTime) / maxDur) * 100}%`, width: `${(s.setupTime / maxDur) * 100}%`, background: "var(--violet)" }}/>
                  {s.bottleneck && <div style={{ position: "absolute", inset: 0, border: "1.5px solid var(--red)", borderRadius: 2 }}/>}
                </div>
                <div className="v" style={{ fontWeight: s.bottleneck ? 600 : 500, color: s.bottleneck ? "var(--red)" : "var(--ink)" }}>{s.cycleTime}s</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card col-4">
          <div className="card-head"><h3>Value-added Ratio</h3><span className="sub">VA vs NVA</span></div>
          <div className="card-body">
            <div className="donut-wrap">
              <Donut parts={[
                { value: schedule.vaPct, color: "var(--green)" },
                { value: schedule.nvaPct, color: "var(--red)" },
              ]} centerValue={`${schedule.vaPct}%`}/>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="swatch" style={{ width: 10, height: 10, background: "var(--green)", borderRadius: 2, display: "inline-block" }}/>Value-added</span>
                  <span className="mono" style={{ fontWeight: 600 }}>{schedule.sumVA}s</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span className="swatch" style={{ width: 10, height: 10, background: "var(--red)", borderRadius: 2, display: "inline-block" }}/>Non VA (setup)</span>
                  <span className="mono" style={{ fontWeight: 600 }}>{schedule.sumNVA}s</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--ink-4)" }}>Target VA</span>
                  <span className="mono" style={{ fontWeight: 600 }}>≥ 85%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--ink-4)" }}>Takt gap</span>
                  <span className="mono" style={{ fontWeight: 600, color: gap.overTakt ? "var(--red)" : "var(--green)" }}>{gap.gap}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card col-6">
          <div className="card-head"><h3>Cycle Time Distribution</h3><span className="sub">SIMULATED · 30 UNITS</span></div>
          <div className="card-body">
            <Histogram totalCT={schedule.totalCycleTime} takt={taktTime}/>
          </div>
        </div>

        <div className="card col-6">
          <div className="card-head"><h3>Step Impact Analysis</h3><span className="sub">IF REDUCED BY 1s</span></div>
          <div className="card-body" style={{ maxHeight: 220, overflow: "auto" }}>
            {schedule.steps.map(s => {
              const impact = stepImpact(steps, taktTime, s.id, 1);
              return (
                <div key={s.id} className="hbar-row" style={{ gridTemplateColumns: "150px 1fr 80px" }}>
                  <div className="lbl" style={{ fontSize: 11.5 }}>{s.name}</div>
                  <div className="track"><div className="fill" style={{ width: `${Math.min(100, Math.abs(impact.savingsPct) * 20)}%`, background: impact.savingsSec > 0 ? "var(--green)" : "var(--ink-4)" }}/></div>
                  <div className="v" style={{ color: impact.savingsSec > 0 ? "var(--green)" : "var(--ink-4)" }}>
                    −{impact.savingsSec.toFixed(1)}s
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card col-6">
          <div className="card-head"><h3>Line Balancing</h3><span className="sub">LOAD PER STATION</span></div>
          <div className="card-body">
            {Object.entries(lb.load).length === 0 ? (
              <div className="muted" style={{ fontSize: 12 }}>No station assignments. Set <code>stationId</code> on steps to see station load.</div>
            ) : (
              Object.entries(lb.load).map(([st, load]) => (
                <HBar key={st} label={st} value={load} max={Math.max(lb.max, taktTime)} color={load > taktTime ? "var(--red)" : "var(--blue)"}/>
              ))
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
              <Stat k="Balance" v={`${lb.balanceScore}%`}/>
              <Stat k="Max" v={`${lb.max}s`}/>
              <Stat k="Min" v={`${lb.min}s`}/>
              <Stat k="Avg" v={`${Math.round(lb.avg)}s`}/>
            </div>
          </div>
        </div>

        <div className="card col-6">
          <div className="card-head"><h3>Step Variation</h3><span className="sub">MIN/AVG/MAX · σ</span></div>
          <div className="card-body" style={{ maxHeight: 240, overflow: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Step</th><th style={{ textAlign: "right" }}>Min</th><th style={{ textAlign: "right" }}>Avg</th><th style={{ textAlign: "right" }}>Max</th><th style={{ textAlign: "right" }}>σ</th></tr></thead>
              <tbody>
                {variation.map(v => (
                  <tr key={v.id}>
                    <td>{v.name}</td>
                    <td className="num" style={{ textAlign: "right" }}>{v.min}s</td>
                    <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{v.mean}s</td>
                    <td className="num" style={{ textAlign: "right" }}>{v.max}s</td>
                    <td className="num" style={{ textAlign: "right", color: v.std > 3 ? "var(--red)" : "var(--ink-3)" }}>±{v.std}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card col-12">
          <div className="card-head"><h3>Auto Line Balancing Suggestion</h3><span className="sub">REBALANCE</span></div>
          <div className="card-body" style={{ display: "grid", gridTemplateColumns: "repeat(" + autoBalance.length + ", 1fr)", gap: 12 }}>
            {autoBalance.map(st => (
              <div key={st.id} className="cmp-cell">
                <div className="mono" style={{ fontSize: 10, color: "var(--ink-4)" }}>{st.id}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600, color: st.total > taktTime ? "var(--red)" : "var(--ink)" }}>{st.total}s</div>
                <div style={{ fontSize: 10, color: "var(--ink-4)" }}>{st.steps.length} steps</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                  {st.steps.map(id => (
                    <span key={id} className="tag">{steps.find(s => s.id === id)?.name?.split(" ")[0] || id}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ k, v }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--ink-4)", letterSpacing: ".14em", textTransform: "uppercase" }}>{k}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, marginTop: 2 }}>{v}</div>
    </div>
  );
}
