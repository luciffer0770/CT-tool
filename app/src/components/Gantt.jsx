import React, { useEffect, useMemo, useRef, useState } from "react";

export default function Gantt({
  steps = [],
  totalCT = 0,
  takt = 240,
  tickEvery = 20,
  labelWidth = 140,
  showTakt = true,
  showDeps = false,
  heatmap = false,
  height = 36,
  compact = false,
  onStepClick,
}) {
  const wrapRef = useRef(null);
  const [w, setW] = useState(800);
  const [tip, setTip] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setW(el.clientWidth));
    obs.observe(el);
    setW(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const rowH = compact ? 30 : height;
  const trackWidth = Math.max(200, w - labelWidth - 16);
  const maxX = Math.max(totalCT, takt) * 1.05 || 1;
  const scale = trackWidth / maxX;

  const ticks = useMemo(() => {
    const arr = [];
    for (let t = 0; t <= maxX; t += tickEvery) {
      arr.push({ t, x: t * scale, major: t % (tickEvery * 2) === 0 });
    }
    return arr;
  }, [maxX, scale, tickEvery]);

  const byId = {};
  steps.forEach(s => { byId[s.id] = s; });

  const rowY = (i) => i * rowH + 26 + 16;

  return (
    <div className="gantt" ref={wrapRef} style={{ "--tick": `${tickEvery * scale}px` }}>
      <div className="gantt-head">
        <div style={{ borderRight: "1px solid var(--border)", padding: "6px 8px" }}>STEP</div>
        <div className="gantt-axis">
          {ticks.map((tk, i) => (
            <div key={i} className={`tick ${tk.major ? "major" : ""}`} style={{ left: tk.x }}>
              {tk.major ? `${tk.t}s` : ""}
            </div>
          ))}
        </div>
      </div>

      {steps.map((s, i) => {
        // Heatmap color based on delay severity: ratio of waitTime to cycleTime
        const delayRatio = (s.cycleTime || 1) === 0 ? 0 : Math.min(1, (s.waitTime || 0) / Math.max(1, s.cycleTime));
        const heatStyle = heatmap
          ? { background: `linear-gradient(90deg, rgba(34,197,94,${1 - delayRatio}) 0%, rgba(225,29,46,${delayRatio}) 100%)` }
          : {};

        return (
          <div
            key={s.id}
            className={`gantt-row ${s.bottleneck ? "bottleneck" : ""}`}
            style={{ height: rowH }}
            onClick={() => onStepClick && onStepClick(s)}
          >
            <div className="gantt-label" title={s.name}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {s.name}
              </span>
              {s.groupId && (
                <span className="group-badge" title={`Parallel group ${s.groupId}`}>‖</span>
              )}
              {s.bottleneck && <span className="tag red" style={{ marginLeft: "auto" }}>B/N</span>}
            </div>
            <div className="gantt-track" style={heatStyle}>
              {/* wait bar */}
              {s.waitTime > 0 && (
                <div
                  className="bar wait"
                  style={{ left: (s.startTime - s.waitTime) * scale, width: s.waitTime * scale, top: 8, height: 20 }}
                  onMouseEnter={(e) => setTip({ x: e.clientX, y: e.clientY, s, kind: "Wait", v: s.waitTime })}
                  onMouseMove={(e) => setTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => setTip(null)}
                >
                  {s.waitTime * scale > 30 ? `WAIT ${s.waitTime}s` : ""}
                </div>
              )}
              {s.setupTime > 0 && (
                <div
                  className="bar setup"
                  style={{ left: s.startTime * scale, width: s.setupTime * scale, top: 8, height: 20 }}
                  onMouseEnter={(e) => setTip({ x: e.clientX, y: e.clientY, s, kind: "Setup", v: s.setupTime })}
                  onMouseMove={(e) => setTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => setTip(null)}
                >
                  {s.setupTime * scale > 30 ? `SET ${s.setupTime}s` : ""}
                </div>
              )}
              {s.machineTime > 0 && (
                <div
                  className={`bar machine ${s.bottleneck ? "bottleneck" : ""}`}
                  style={{ left: (s.startTime + s.setupTime) * scale, width: s.machineTime * scale, top: 8, height: 20 }}
                  onMouseEnter={(e) => setTip({ x: e.clientX, y: e.clientY, s, kind: "Machine", v: s.machineTime })}
                  onMouseMove={(e) => setTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => setTip(null)}
                >
                  {s.machineTime * scale > 30 ? `MACH ${s.machineTime}s` : ""}
                </div>
              )}
              {s.operatorTime > 0 && (
                <div
                  className="bar op"
                  style={{ left: (s.startTime + s.setupTime + s.machineTime) * scale, width: s.operatorTime * scale, top: 8, height: 20 }}
                  onMouseEnter={(e) => setTip({ x: e.clientX, y: e.clientY, s, kind: "Operator", v: s.operatorTime })}
                  onMouseMove={(e) => setTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => setTip(null)}
                >
                  {s.operatorTime * scale > 30 ? `OP ${s.operatorTime}s` : ""}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {showTakt && steps.length > 0 && (
        <div style={{ position: "relative", height: 0 }}>
          <div
            className="takt-line"
            style={{
              left: labelWidth + takt * scale,
              top: -steps.length * rowH - 26,
              height: steps.length * rowH + 26,
            }}
          />
        </div>
      )}

      {/* SVG overlay for dependency lines */}
      {showDeps && steps.length > 0 && (
        <DependencyOverlay
          steps={steps}
          byId={byId}
          rowH={rowH}
          labelWidth={labelWidth}
          scale={scale}
        />
      )}

      {tip && (
        <div className="tooltip" style={{ left: tip.x, top: tip.y }}>
          <div className="ttl">{tip.s.name}</div>
          <div className="row"><span>{tip.kind}</span><span className="v">{tip.v}s</span></div>
          <div className="row"><span>Start / End</span><span className="v">{tip.s.startTime}s → {tip.s.endTime}s</span></div>
          <div className="row"><span>Total step</span><span className="v">{tip.s.cycleTime}s</span></div>
          {tip.s.waitTime > 0 && <div className="row"><span>Wait</span><span className="v" style={{color:'#FCA5A5'}}>{tip.s.waitTime}s</span></div>}
          {tip.s.groupId && <div className="row"><span>Group</span><span className="v">{tip.s.groupId}</span></div>}
          {tip.s.bottleneck && <div className="row"><span style={{color:'#FCA5A5'}}>Bottleneck</span><span className="v" style={{color:'#F87171'}}>On critical path</span></div>}
        </div>
      )}
    </div>
  );
}

function DependencyOverlay({ steps, byId, rowH, labelWidth, scale }) {
  // Draw simple dashed arrows from end of dep step to start of step
  const indexById = {};
  steps.forEach((s, i) => { indexById[s.id] = i; });
  const paths = [];
  steps.forEach((s, i) => {
    (s.dependencies || []).forEach(d => {
      const dep = byId[d];
      if (!dep) return;
      const fromY = 26 + indexById[d] * rowH + rowH / 2;
      const toY = 26 + i * rowH + rowH / 2;
      const fromX = labelWidth + dep.endTime * scale;
      const toX = labelWidth + s.startTime * scale;
      paths.push({ k: `${s.id}-${d}`, d: `M ${fromX},${fromY} C ${fromX + 20},${fromY} ${toX - 20},${toY} ${toX},${toY}` });
    });
  });
  const height = 26 + steps.length * rowH;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, right: 0, height, pointerEvents: "none" }} width="100%">
      {paths.map(p => <path key={p.k} d={p.d} className="dep-line"/>)}
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#8A92A6"/>
        </marker>
      </defs>
    </svg>
  );
}
