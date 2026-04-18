import React, { useState } from "react";
import Icon from "../components/Icon.jsx";
import Gantt from "../components/Gantt.jsx";
import { HBar } from "../components/Charts.jsx";
import { useStore } from "../store/useStore.js";

export default function GanttView({ schedule }) {
  const taktTime = useStore(s => s.taktTime);
  const heatmap = useStore(s => s.heatmap);
  const setHeatmap = useStore(s => s.setHeatmap);
  const showDeps = useStore(s => s.showDeps);
  const setShowDeps = useStore(s => s.setShowDeps);
  const setPage = useStore(s => s.setPage);
  const setSelectedId = useStore(s => s.setSelectedId);
  const [density, setDensity] = useState("normal");
  const [tickEvery, setTickEvery] = useState(20);

  const overTakt = schedule.totalCycleTime > taktTime;

  const exportSVG = () => {
    const svg = document.querySelector(".gantt");
    if (!svg) return;
    // convert to image via window.print of the card
    window.print();
  };

  return (
    <>
      <div className="crumbs">WORKSPACE <span className="sep">/</span> LINE-07 <span className="sep">/</span> GANTT</div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Gantt View</h1>
          <div className="page-sub">Full schedule with dependencies, parallelism and takt reference.</div>
        </div>
        <div className="toolbar">
          <button className={`btn ${showDeps ? "accent" : ""}`} onClick={() => setShowDeps(!showDeps)}><Icon name="link" size={13}/> Dependencies</button>
          <button className={`btn ${heatmap ? "accent" : ""}`} onClick={() => setHeatmap(!heatmap)}><Icon name="flame" size={13}/> Heatmap</button>
          <button className="btn" onClick={() => setTickEvery(Math.max(5, tickEvery - 5))}><Icon name="minus" size={13}/></button>
          <span className="chip mono">{tickEvery}s/tick</span>
          <button className="btn" onClick={() => setTickEvery(Math.min(60, tickEvery + 5))}><Icon name="plus" size={13}/></button>
          <button className="btn primary" onClick={exportSVG}><Icon name="download" size={13}/> Print / PDF</button>
        </div>
      </div>

      <div className="ribbon">
        <span className="chip"><b>CT</b> {schedule.totalCycleTime}s</span>
        <span className="chip"><b>Takt</b> {taktTime}s</span>
        <span className="chip" style={{ background: overTakt ? "var(--red-50)" : "var(--green-50)", borderColor: overTakt ? "rgba(225,29,46,.25)" : "rgba(34,197,94,.25)" }}>
          <b style={{ color: overTakt ? "var(--red)" : "var(--green)" }}>
            {overTakt ? `OVER TAKT +${schedule.totalCycleTime - taktTime}s` : `WITHIN TAKT −${taktTime - schedule.totalCycleTime}s`}
          </b>
        </span>
        <span className="chip"><b>VA</b> {schedule.vaPct}%</span>
        <span className="chip"><b>Wait</b> {schedule.totalWait}s</span>
        <div className="legend" style={{ marginLeft: "auto" }}>
          <span className="item"><span className="swatch" style={{ background: "var(--blue)" }}/>Machine</span>
          <span className="item"><span className="swatch" style={{ background: "var(--cyan)" }}/>Operator</span>
          <span className="item"><span className="swatch" style={{ background: "var(--violet)" }}/>Setup</span>
          <span className="item"><span className="swatch" style={{ background: "repeating-linear-gradient(45deg, #FCA5A5 0 4px, #F87171 4px 8px)" }}/>Wait</span>
          <span className="item"><span className="swatch" style={{ background: "var(--green)" }}/>Optimal</span>
          <span className="item"><span className="swatch" style={{ background: "var(--red)" }}/>Bottleneck</span>
        </div>
      </div>

      <div className="card grid-bg">
        <div className="card-head">
          <h3>Schedule · {schedule.steps.length} steps</h3>
          <span className="sub">0 → {schedule.totalCycleTime}s</span>
        </div>
        <div className="card-body tight" style={{ minHeight: 540 }}>
          <Gantt
            steps={schedule.steps}
            totalCT={schedule.totalCycleTime}
            takt={taktTime}
            tickEvery={tickEvery}
            labelWidth={180}
            showDeps={showDeps}
            heatmap={heatmap}
            onStepClick={(s) => { setSelectedId(s.id); setPage("builder"); }}
          />
        </div>
      </div>

      <div style={{ height: 12 }}/>
      <div className="section-row">
        <div className="card col-6">
          <div className="card-head"><h3>Critical Path</h3><span className="sub">LONGEST CHAIN</span></div>
          <div className="card-body">
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {schedule.steps.filter(s => s.critical).map((s, i, arr) => (
                <React.Fragment key={s.id}>
                  <span className={`tag ${s.bottleneck ? "red" : "blue"}`} style={{ padding: "4px 8px", fontSize: 11 }}>{s.name}</span>
                  {i < arr.length - 1 && <Icon name="chev-right" size={12} style={{ color: "var(--ink-4)" }}/>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        <div className="card col-6">
          <div className="card-head"><h3>Parallel Groups</h3><span className="sub">SAVINGS</span></div>
          <div className="card-body" style={{ fontSize: 12, color: "var(--ink-2)" }}>
            {(() => {
              const groups = {};
              schedule.steps.forEach(s => { if (s.groupId) { groups[s.groupId] = groups[s.groupId] || []; groups[s.groupId].push(s); } });
              const entries = Object.entries(groups);
              if (!entries.length) return <div className="muted">No parallel groups — shift-select in Builder to create one.</div>;
              return entries.map(([gid, members]) => {
                const maxCt = Math.max(...members.map(m => m.cycleTime));
                const sumCt = members.reduce((a, b) => a + b.cycleTime, 0);
                const savings = sumCt - maxCt;
                return <HBar key={gid} label={`${members.map(m => m.name.split(" ")[0]).join(" ‖ ")} (${gid.slice(0,6)})`} value={savings} max={Math.max(30, sumCt)} color="var(--green)"/>;
              });
            })()}
          </div>
        </div>
      </div>
    </>
  );
}
