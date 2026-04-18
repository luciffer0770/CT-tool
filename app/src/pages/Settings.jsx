import React, { useState } from "react";
import Icon from "../components/Icon.jsx";
import { useStore } from "../store/useStore.js";
import { TEMPLATES } from "../data/templates.js";
import { computeSchedule } from "../engine/calc.js";

export default function Settings() {
  const settings = useStore(s => s.settings);
  const setSettings = useStore(s => s.setSettings);
  const versions = useStore(s => s.versions);
  const saveNewVersion = useStore(s => s.saveNewVersion);
  const restoreVersion = useStore(s => s.restoreVersion);
  const deleteVersion = useStore(s => s.deleteVersion);
  const loadTemplate = useStore(s => s.loadTemplate);
  const resetAll = useStore(s => s.resetAll);
  const multilines = useStore(s => s.multilines);
  const addLineSnapshot = useStore(s => s.addLineSnapshot);
  const removeLineSnapshot = useStore(s => s.removeLineSnapshot);
  const toast = useStore(s => s.toast);
  const taktTime = useStore(s => s.taktTime);
  const steps = useStore(s => s.steps);

  const [versionLabel, setVersionLabel] = useState("");
  const [lineLabel, setLineLabel] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const schedule = computeSchedule(steps, taktTime);

  const set = (patch) => setSettings(patch);

  return (
    <>
      <div className="crumbs">WORKSPACE <span className="sep">/</span> {settings.line} <span className="sep">/</span> SETTINGS</div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-sub">Line configuration, version control, templates and workspace preferences.</div>
        </div>
        <div className="toolbar">
          <button className="btn accent" onClick={() => toast("Settings saved", "success")}><Icon name="check" size={13}/> Save</button>
        </div>
      </div>

      <div className="section-row">
        <div className="card col-6">
          <div className="card-head"><h3>Units &amp; Defaults</h3><span className="sub">GLOBAL</span></div>
          <div className="card-body" style={{ display: "grid", gap: 14 }}>
            <Row label="Time units" help="Used across cycle, takt and reports.">
              <Seg value={settings.units} options={["sec", "min"]} onChange={(v) => set({ units: v })}/>
            </Row>
            <Row label="Default takt time" help="Applied to new lines.">
              <div className="search" style={{ minWidth: 120, width: 160 }}>
                <input type="number" value={settings.defaultTakt} onChange={(e) => set({ defaultTakt: Number(e.target.value) })}/>
                <span className="mono muted" style={{ fontSize: 10 }}>s</span>
              </div>
            </Row>
            <Row label="Line" help="Label for this production line.">
              <input className="input" value={settings.line} onChange={(e) => set({ line: e.target.value })}/>
            </Row>
            <Row label="Shift" help="Current shift label.">
              <input className="input" value={settings.shift} onChange={(e) => set({ shift: e.target.value })}/>
            </Row>
            <Row label="Data refresh" help="Pull rate from OPC-UA source.">
              <Seg value={settings.refresh} options={["1s", "5s", "15s", "off"]} onChange={(v) => set({ refresh: v })}/>
            </Row>
          </div>
        </div>

        <div className="card col-6">
          <div className="card-head"><h3>Appearance</h3><span className="sub">WORKSPACE</span></div>
          <div className="card-body" style={{ display: "grid", gap: 14 }}>
            <Row label="Theme" help="Light (industrial) or dark (night shift).">
              <Seg value={settings.theme} options={["light", "dark"]} onChange={(v) => set({ theme: v })}/>
            </Row>
            <Row label="Accent" help="Used on primary actions.">
              <div style={{ display: "flex", gap: 6 }}>
                {["#1E40AF", "#6D28D9", "#06B6D4", "#22C55E", "#E11D2E"].map(c => (
                  <button key={c} onClick={() => set({ accent: c })} style={{ width: 24, height: 24, border: settings.accent === c ? "2px solid var(--ink)" : "1px solid var(--border)", borderRadius: 4, background: c, cursor: "pointer" }}/>
                ))}
              </div>
            </Row>
            <Row label="Compact density" help="Tighter spacing in tables and cards.">
              <Toggle value={settings.compact} onChange={(v) => set({ compact: v })}/>
            </Row>
            <Row label="Show grid backgrounds" help="Engineering grid in Gantt / canvas views.">
              <Toggle value={settings.grid} onChange={(v) => set({ grid: v })}/>
            </Row>
          </div>
        </div>

        {/* Version control */}
        <div className="card col-6">
          <div className="card-head">
            <h3>Version Control</h3>
            <span className="sub">{versions.length} SAVED</span>
          </div>
          <div className="card-body" style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="input" style={{ flex: 1 }} placeholder="Version label (e.g. 'Shift B Morning')" value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)}/>
              <button className="btn accent" onClick={() => { saveNewVersion(versionLabel); setVersionLabel(""); }}><Icon name="save" size={13}/> Save</button>
            </div>
            <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid var(--border)", borderRadius: 4 }}>
              {versions.length === 0 && <div className="muted" style={{ padding: 14, fontSize: 12 }}>No versions saved yet.</div>}
              {versions.map(v => (
                <div key={v.id} className="version-row">
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>{v.label}</div>
                    <div className="mono muted" style={{ fontSize: 10 }}>{new Date(v.date).toLocaleString()} · {v.project.steps?.length || 0} steps · takt {v.project.taktTime || 0}s</div>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn xs" onClick={() => restoreVersion(v.id)}><Icon name="history" size={11}/> Restore</button>
                    <button className="btn xs danger" onClick={() => deleteVersion(v.id)}><Icon name="trash" size={11}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Multi-line */}
        <div className="card col-6">
          <div className="card-head">
            <h3>Multi-line Comparison</h3>
            <span className="sub">{multilines.length} LINES</span>
          </div>
          <div className="card-body" style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 6 }}>
              <input className="input" style={{ flex: 1 }} placeholder="Line snapshot label (e.g. 'Line-8 pilot')" value={lineLabel} onChange={(e) => setLineLabel(e.target.value)}/>
              <button className="btn" onClick={() => { addLineSnapshot(lineLabel); setLineLabel(""); }}><Icon name="plus" size={13}/> Add snapshot</button>
            </div>
            <div style={{ maxHeight: 260, overflow: "auto", border: "1px solid var(--border)", borderRadius: 4 }}>
              {multilines.length === 0 && <div className="muted" style={{ padding: 14, fontSize: 12 }}>No snapshots. Use this to compare multiple lines side-by-side.</div>}
              {multilines.map(m => {
                const sc = computeSchedule(m.steps, m.taktTime);
                return (
                  <div key={m.id} className="version-row">
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{m.label}</div>
                      <div className="mono muted" style={{ fontSize: 10 }}>CT {sc.totalCycleTime}s · Eff {sc.efficiency}% · B/N {sc.bottleneck?.name?.split(" ")[0] || "—"}</div>
                    </div>
                    <button className="btn xs danger" onClick={() => removeLineSnapshot(m.id)}><Icon name="trash" size={11}/></button>
                  </div>
                );
              })}
              {multilines.length > 0 && (
                <div className="version-row" style={{ background: "var(--surface-2)" }}>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600 }}>Current (live)</div>
                    <div className="mono muted" style={{ fontSize: 10 }}>CT {schedule.totalCycleTime}s · Eff {schedule.efficiency}% · B/N {schedule.bottleneck?.name?.split(" ")[0] || "—"}</div>
                  </div>
                  <span className="tag blue">LIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="card col-12">
          <div className="card-head"><h3>Process Template Library</h3><span className="sub">{TEMPLATES.length} TEMPLATES</span></div>
          <div className="card-body" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {TEMPLATES.map(t => (
              <div key={t.id} className="template-card" onClick={() => { if (confirm(`Load "${t.name}"? This replaces current steps.`)) { loadTemplate(t.id); toast(`Loaded ${t.name}`, "success"); } }}>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4, minHeight: 30 }}>{t.description}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <span className="tag blue">{t.sector}</span>
                  <span className="tag">{t.steps.length} steps</span>
                  <span className="tag cyan">takt {t.taktTime}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card col-12" style={{ borderColor: "rgba(225,29,46,.25)" }}>
          <div className="card-head">
            <h3 style={{ color: "var(--red)" }}>Danger zone</h3>
            <span className="tag red">DESTRUCTIVE</span>
          </div>
          <div className="card-body" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Reset all data</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>Restore default Bosch-style 10-step cycle. Deletes versions &amp; snapshots.</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button
                className="btn danger"
                onClick={() => {
                  if (confirmReset) { resetAll(); setConfirmReset(false); toast("All data reset", "success"); }
                  else setConfirmReset(true);
                }}
              >{confirmReset ? "Click again to confirm" : "Reset data"}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, help, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, alignItems: "center" }}>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink)" }}>{label}</div>
        {help && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{help}</div>}
      </div>
      <div style={{ justifySelf: "start" }}>{children}</div>
    </div>
  );
}

function Seg({ value, options, onChange }) {
  return (
    <div style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 4, padding: 2, background: "var(--surface-2)" }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          border: 0, background: value === o ? "var(--surface)" : "transparent",
          boxShadow: value === o ? "var(--shadow-sm)" : "none",
          padding: "5px 12px", fontSize: 11.5, fontWeight: 600,
          color: value === o ? "var(--ink)" : "var(--ink-3)",
          fontFamily: "var(--font-mono)", cursor: "pointer", borderRadius: 3,
        }}>{o.toUpperCase()}</button>
      ))}
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 40, height: 22, borderRadius: 12, border: "1px solid var(--border)",
      background: value ? "var(--blue)" : "var(--bg-2)", position: "relative", cursor: "pointer", transition: "all 200ms var(--ease)",
    }}>
      <span style={{
        position: "absolute", top: 2, left: value ? 20 : 2, width: 16, height: 16,
        borderRadius: 10, background: "white", transition: "all 200ms var(--ease)", boxShadow: "0 1px 2px rgba(0,0,0,.15)",
      }}/>
    </button>
  );
}
