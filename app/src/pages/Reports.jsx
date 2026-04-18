import React, { useMemo, useState } from "react";
import Icon from "../components/Icon.jsx";
import Gantt from "../components/Gantt.jsx";
import { useStore } from "../store/useStore.js";
import { exportReportToPDF } from "../engine/pdf.js";
import { exportStepsToExcel } from "../engine/excel.js";

export default function Reports({ schedule }) {
  const versions = useStore(s => s.versions);
  const settings = useStore(s => s.settings);
  const steps = useStore(s => s.steps);

  const [selectedReport, setSelectedReport] = useState(0);

  const reportList = useMemo(() => {
    const today = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, "");
    const base = [
      { id: `R-${fmt(today)}-B`, name: `Shift B · ${today.toLocaleDateString()}`, status: "open" },
    ];
    const fromVers = versions.slice(0, 10).map((v) => ({
      id: `R-${v.id}`, name: v.label + " — " + new Date(v.date).toLocaleString(), status: "ready", version: v,
    }));
    return base.concat(fromVers);
  }, [versions]);

  const selected = reportList[selectedReport] || reportList[0];

  const onExportPDF = () => {
    exportReportToPDF({
      project: { line: settings.line, shift: settings.shift, versionCount: versions.length + 14 },
      schedule,
      reportId: selected?.id || `R-${Date.now()}`,
      title: `Cycle Time Report — ${settings.line} · ${settings.shift}`,
    });
  };

  return (
    <>
      <div className="crumbs">WORKSPACE <span className="sep">/</span> {settings.line} <span className="sep">/</span> REPORTS</div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reports</h1>
          <div className="page-sub">Generate shift reports and export to PDF/Excel for quality &amp; engineering reviews.</div>
        </div>
        <div className="toolbar">
          <button className="btn" onClick={() => window.print()}><Icon name="report" size={13}/> Print</button>
          <button className="btn" onClick={() => exportStepsToExcel(steps, schedule)}><Icon name="download" size={13}/> Export Excel</button>
          <button className="btn primary" onClick={onExportPDF}><Icon name="download" size={13}/> Export PDF</button>
        </div>
      </div>

      <div className="section-row">
        <div className="card col-4">
          <div className="card-head"><h3>Saved Reports</h3><span className="sub">{reportList.length}</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {reportList.map((r, i) => (
              <div
                key={r.id}
                className="report-row"
                onClick={() => setSelectedReport(i)}
                style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: i === selectedReport ? "var(--blue-50)" : "transparent" }}
              >
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.name}</div>
                  <div className="mono muted" style={{ fontSize: 10, marginTop: 2 }}>{r.id}</div>
                </div>
                <span className={`tag ${r.status === "open" ? "blue" : "green"}`}>{r.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card col-8">
          <div className="card-head">
            <div>
              <h3>Preview — {selected?.id}</h3>
              <div className="sub" style={{ marginTop: 2 }}>{settings.shift} · {settings.line} · {new Date().toLocaleDateString()}</div>
            </div>
            <div className="toolbar">
              <button className="btn ghost">Page 1 / 2</button>
              <button className="btn"><Icon name="chev-right" size={13}/></button>
            </div>
          </div>
          <div className="card-body" style={{ background: "var(--bg-2)", padding: 16 }}>
            <div className="report-paper" style={{ background: "white", padding: 28, boxShadow: "var(--shadow-md)", border: "1px solid var(--border)", borderTop: "3px solid var(--blue)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div className="mono muted" style={{ fontSize: 10, letterSpacing: ".14em" }}>CYCLE TIME REPORT</div>
                  <h2 style={{ fontFamily: "var(--font-head)", fontSize: 22, margin: "4px 0 0", fontWeight: 600, color: "#0B1020" }}>{settings.line} · {settings.shift}</h2>
                  <div style={{ fontSize: 12, color: "#5B6274", marginTop: 4 }}>Prepared by M. Becker, Process Engineering · Plant 3</div>
                </div>
                <div className="mono muted" style={{ textAlign: "right", fontSize: 10, color: "#5B6274" }}>
                  <div>DATE&nbsp;&nbsp;&nbsp;{new Date().toLocaleDateString()}</div>
                  <div>REV&nbsp;&nbsp;&nbsp;&nbsp;v{(versions.length || 14)}</div>
                  <div>ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{selected?.id}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 18 }}>
                {[
                  { k: "CYCLE TIME", v: schedule.totalCycleTime + "s", c: "var(--blue)" },
                  { k: "TAKT", v: schedule.takt + "s", c: "#0B1020" },
                  { k: "EFFICIENCY", v: schedule.efficiency + "%", c: "var(--green)" },
                  { k: "BOTTLENECK", v: schedule.bottleneck?.name?.split(" ")[0] || "—", c: "var(--red)", small: true },
                ].map(m => (
                  <div key={m.k} style={{ border: "1px solid #E2E6EF", padding: "10px 12px" }}>
                    <div className="mono muted" style={{ fontSize: 9, letterSpacing: ".12em" }}>{m.k}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: m.small ? 14 : 22, fontWeight: 600, color: m.c, marginTop: 2 }}>{m.v}</div>
                  </div>
                ))}
              </div>

              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 13, marginTop: 22, marginBottom: 8, letterSpacing: ".04em", textTransform: "uppercase", color: "#5B6274" }}>Step Breakdown</h3>
              <table className="tbl">
                <thead><tr><th>#</th><th>Step</th><th style={{ textAlign: "right" }}>M</th><th style={{ textAlign: "right" }}>Op</th><th style={{ textAlign: "right" }}>Set</th><th style={{ textAlign: "right" }}>Total</th><th style={{ textAlign: "right" }}>Wait</th></tr></thead>
                <tbody>
                  {schedule.steps.map((s, i) => (
                    <tr key={s.id}>
                      <td className="num" style={{ color: "#8A92A6" }}>{String(i + 1).padStart(2, "0")}</td>
                      <td style={{ color: "#0B1020" }}>{s.name}</td>
                      <td className="num" style={{ textAlign: "right" }}>{s.machineTime}</td>
                      <td className="num" style={{ textAlign: "right" }}>{s.operatorTime}</td>
                      <td className="num" style={{ textAlign: "right" }}>{s.setupTime}</td>
                      <td className="num" style={{ textAlign: "right", fontWeight: 600, color: s.bottleneck ? "var(--red)" : "#0B1020" }}>{s.cycleTime}s</td>
                      <td className="num" style={{ textAlign: "right", color: s.waitTime > 0 ? "var(--red)" : "#8A92A6" }}>{s.waitTime}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ fontFamily: "var(--font-head)", fontSize: 13, marginTop: 22, marginBottom: 8, letterSpacing: ".04em", textTransform: "uppercase", color: "#5B6274" }}>Gantt Snapshot</h3>
              <div style={{ border: "1px solid #E2E6EF", padding: 8 }}>
                <Gantt steps={schedule.steps} totalCT={schedule.totalCycleTime} takt={schedule.takt} tickEvery={40} labelWidth={130}/>
              </div>

              <div className="mono muted" style={{ marginTop: 22, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8A92A6" }}>
                <span>CYCLE TIME ANALYZER · INDUSTRIAL EDITION</span>
                <span>PAGE 1 / 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
