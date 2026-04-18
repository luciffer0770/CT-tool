# Cycle Time Analyzer — Industrial Edition

Desktop-only React web application for manufacturing engineers to analyze, optimize, and simulate production cycle time. Built to feel like a Bosch / Siemens internal MES/SCADA tool — data-dense, engineering-first, no gimmicks.

## Features

Core:
- Cycle-time schedule engine with **DAG dependencies**, **parallel groups** (`groupId`), **critical-path detection**, **wait/slack** calculation, and **bottleneck identification**.
- Real-time, shared state across every page (Zustand) with automatic `localStorage` persistence.
- Full version history (save / restore / delete), multi-line snapshots for side-by-side comparison.

Pages:
- **Dashboard** — KPI cards with sparkline trends (cycle, efficiency, bottlenecks, throughput), live Gantt preview, bottleneck summary, activity feed, and an OEE cluster (Availability × Performance × Quality).
- **Cycle Builder** — 3-column workspace: draggable step cards (inline edit name/machine/operator/setup, delete, duplicate) on the left, live Gantt in the centre, Step Inspector (sliders, station, variability, value-added flag, dependency chips) + smart suggestions + validation warnings on the right. Shift+click multiple steps to create parallel groups.
- **Gantt View** — Full-screen schedule with dependency arrows, heatmap mode (wait-severity), tick density control, takt line overlay and critical-path inventory.
- **Analytics** — Bottleneck contribution bars, VA/NVA donut, cycle-time histogram, step impact analysis (if step reduced by 1 s → total reduces by X), station load with balance score, min/avg/max/σ variation table, and auto line-balancing suggestion.
- **Simulation** — Side-by-side BEFORE / AFTER Gantts, per-step machine/operator/setup sliders, what-if remove, Monte-Carlo 1,000-trial run using variability inputs, auto line-balancing, apply + save version.
- **Reports** — Paper-style preview with KPI tiles, step breakdown table, Gantt snapshot. One-click PDF export (jsPDF + autoTable).
- **Settings** — Units/defaults/line/shift/refresh, theme (light/dark), accent, compact density, version control (save/restore), multi-line comparison, pre-built process template library (Bosch assembly, CNC cell, injection moulding, packaging line), and danger-zone reset.

Data integration:
- **Excel / CSV import** via SheetJS. Tolerant column mapping (any of `machine/machine time/op time/setup/deps/group/station/variability/…` is recognised).
- **Excel export** — Steps with start/end/wait/critical/bottleneck flags plus a KPI sheet.
- **PDF export** — Report + Gantt snapshot on page 2 and KPI summary.
- **Template download** — Prefilled template spreadsheet ready for engineers to fill in.

Engineering correctness:
- Topological scheduling with deterministic critical-path walk.
- Cycle detection in validation (won't hang if user authors a loop).
- Parallel `groupId` handling — group start = max of all deps across members, group end = max(member end).
- Negative / unrealistic / zero-duration time values surfaced in the UI.

## Stack

- React 19 + Vite 8
- Zustand (state + localStorage persistence)
- SheetJS (`xlsx`)
- jsPDF + jspdf-autotable
- Pure CSS, industrial light theme with dark mode toggle

## Run locally

```bash
npm install
npm run dev
npm run build     # production
npm run preview
```

Desktop-only — designed against a 1440 px viewport, matching the provided HTML reference.

## Layout

```
src/
  App.jsx               App shell + routing (by zustand page)
  main.jsx              React root
  styles.css            Industrial light / dark theme
  components/
    Shell.jsx           Sidebar, TopBar, StatusBar, Toasts
    Icon.jsx            Line icon set
    Charts.jsx          Sparkline, Donut, HBar, Histogram, LineChart, GroupedBars
    Gantt.jsx           Gantt with heatmap, deps, tooltip
  pages/
    Dashboard.jsx
    Builder.jsx
    GanttView.jsx
    Analytics.jsx
    Simulation.jsx
    Reports.jsx
    Settings.jsx
  engine/
    calc.js             Schedule + critical path + groups + DAG
    analytics.js        Bottleneck/VA/NVA/takt/impact/balance/OEE/suggest/validate
    storage.js          localStorage persistence
    excel.js            SheetJS import/export
    pdf.js              jsPDF report + KPI export
  store/useStore.js     Zustand store (auto-saves every mutation)
  data/
    templates.js        Pre-built process templates
    activity.js         Seed activity feed
```

## Keyboard / interaction

- Shift / Ctrl / Cmd + click a step in Cycle Builder to add it to a multi-selection, then **Parallelize** to put them into one group.
- Drag step cards to reorder. The schedule re-computes live.
- Click a step anywhere (table rows, Gantt bars) to jump to it in the Cycle Builder.
