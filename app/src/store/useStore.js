import { create } from "zustand";
import { saveProject, loadProject, saveVersion, loadVersions, deleteVersion, saveSettings, loadSettings } from "../engine/storage.js";
import { DEFAULT_STEPS, DEFAULT_TAKT, TEMPLATES } from "../data/templates.js";
import { INITIAL_ACTIVITY } from "../data/activity.js";

const DEFAULT_SETTINGS = {
  units: "sec",
  defaultTakt: 240,
  rounding: "1",
  refresh: "5s",
  theme: "light",
  accent: "#1E40AF",
  compact: false,
  grid: true,
  line: "LINE-07",
  shift: "SHIFT B",
};

function genId(prefix = "s") {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

const stored = loadProject();
const storedSettings = loadSettings();

const initialSteps = stored?.steps?.length ? stored.steps : deepClone(DEFAULT_STEPS);
const initialTakt = stored?.taktTime ?? DEFAULT_TAKT;

export const useStore = create((set, get) => ({
  steps: initialSteps,
  taktTime: initialTakt,
  baselineSteps: stored?.baselineSteps ?? deepClone(DEFAULT_STEPS),
  selectedId: stored?.selectedId ?? initialSteps[0]?.id ?? null,
  settings: { ...DEFAULT_SETTINGS, ...(storedSettings || {}) },
  versions: loadVersions(),
  activity: stored?.activity ?? INITIAL_ACTIVITY.slice(),
  page: stored?.page || localStorage.getItem("cta_page") || "dashboard",
  heatmap: false,
  showDeps: true,
  multilines: stored?.multilines || [], // for multi-line comparison
  toasts: [],

  /* ---- navigation ---- */
  setPage: (page) => {
    localStorage.setItem("cta_page", page);
    set({ page });
  },

  /* ---- steps / project ---- */
  setSteps: (steps) => { set({ steps }); get()._autosave(); },
  setTakt: (takt) => { set({ taktTime: takt }); get()._autosave(); },
  setSelectedId: (id) => set({ selectedId: id }),
  setHeatmap: (on) => set({ heatmap: on }),
  setShowDeps: (on) => set({ showDeps: on }),

  addStep: (step) => {
    const s = {
      id: step?.id || genId(),
      name: step?.name || "New Step",
      machineTime: step?.machineTime ?? 10,
      operatorTime: step?.operatorTime ?? 5,
      setupTime: step?.setupTime ?? 2,
      transferTime: step?.transferTime ?? 0,
      dependencies: step?.dependencies || [],
      groupId: step?.groupId || null,
      isValueAdded: step?.isValueAdded ?? true,
      stationId: step?.stationId || null,
      variability: step?.variability ?? 5,
    };
    set(state => ({ steps: state.steps.concat([s]), selectedId: s.id }));
    get().pushActivity(`Added step "${s.name}"`, "edit");
    get()._autosave();
    return s;
  },

  updateStep: (id, patch) => {
    set(state => ({
      steps: state.steps.map(s => s.id === id ? { ...s, ...patch } : s),
    }));
    get()._autosave();
  },

  removeStep: (id) => {
    const name = get().steps.find(s => s.id === id)?.name || id;
    set(state => ({
      steps: state.steps
        .filter(s => s.id !== id)
        .map(s => ({ ...s, dependencies: (s.dependencies || []).filter(d => d !== id) })),
      selectedId: state.selectedId === id ? (state.steps[0]?.id || null) : state.selectedId,
    }));
    get().pushActivity(`Removed step "${name}"`, "edit");
    get()._autosave();
  },

  duplicateStep: (id) => {
    const src = get().steps.find(s => s.id === id);
    if (!src) return;
    const copy = { ...src, id: genId(), name: `${src.name} (copy)`, dependencies: [...(src.dependencies || [])] };
    set(state => {
      const idx = state.steps.findIndex(s => s.id === id);
      const next = state.steps.slice();
      next.splice(idx + 1, 0, copy);
      return { steps: next, selectedId: copy.id };
    });
    get()._autosave();
  },

  reorderSteps: (fromId, toId) => {
    if (fromId === toId) return;
    set(state => {
      const from = state.steps.findIndex(s => s.id === fromId);
      const to = state.steps.findIndex(s => s.id === toId);
      if (from < 0 || to < 0) return state;
      const next = state.steps.slice();
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return { steps: next };
    });
    get()._autosave();
  },

  addToGroup: (stepIds, groupId) => {
    const gid = groupId || genId("g");
    set(state => ({
      steps: state.steps.map(s => stepIds.includes(s.id) ? { ...s, groupId: gid } : s),
    }));
    get().pushActivity(`Grouped ${stepIds.length} steps into parallel group`, "edit");
    get()._autosave();
    return gid;
  },

  ungroup: (stepIds) => {
    set(state => ({
      steps: state.steps.map(s => stepIds.includes(s.id) ? { ...s, groupId: null } : s),
    }));
    get()._autosave();
  },

  setDependencies: (id, deps) => {
    set(state => ({
      steps: state.steps.map(s => s.id === id ? { ...s, dependencies: [...new Set(deps)] } : s),
    }));
    get()._autosave();
  },

  replaceSteps: (newSteps) => {
    set({ steps: newSteps, selectedId: newSteps[0]?.id || null });
    get().pushActivity(`Loaded ${newSteps.length}-step process`, "imp");
    get()._autosave();
  },

  resetToBaseline: () => {
    const baseline = get().baselineSteps;
    set({ steps: deepClone(baseline) });
    get().pushActivity("Reset to baseline", "sys");
    get()._autosave();
  },

  setBaseline: (steps) => {
    set({ baselineSteps: deepClone(steps) });
    get()._autosave();
  },

  loadTemplate: (templateId) => {
    const t = TEMPLATES.find(x => x.id === templateId);
    if (!t) return;
    set({
      steps: deepClone(t.steps),
      baselineSteps: deepClone(t.steps),
      taktTime: t.taktTime,
      selectedId: t.steps[0]?.id,
    });
    get().pushActivity(`Loaded template "${t.name}"`, "imp");
    get()._autosave();
  },

  /* ---- versions ---- */
  saveNewVersion: (label) => {
    const project = { steps: get().steps, taktTime: get().taktTime, settings: get().settings };
    const v = saveVersion(label, project);
    set({ versions: loadVersions() });
    get().pushActivity(`Saved version ${v.label}`, "save");
    get().toast(`Saved ${v.label}`, "success");
    return v;
  },

  restoreVersion: (id) => {
    const v = get().versions.find(v => v.id === id);
    if (!v) return;
    set({
      steps: deepClone(v.project.steps || []),
      taktTime: v.project.taktTime ?? get().taktTime,
    });
    get().pushActivity(`Restored version ${v.label}`, "sys");
    get().toast(`Restored ${v.label}`, "success");
    get()._autosave();
  },

  deleteVersion: (id) => {
    const next = deleteVersion(id);
    set({ versions: next });
  },

  /* ---- settings ---- */
  setSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    saveSettings(next);
    applyThemeDom(next);
  },

  /* ---- activity ---- */
  pushActivity: (text, tag = "edit", who = "M. Becker") => {
    set(state => ({
      activity: [{ when: "now", who, act: text, tag }, ...state.activity].slice(0, 40),
    }));
  },

  /* ---- multi-line ---- */
  addLineSnapshot: (label) => {
    const snap = { id: genId("line"), label: label || `Line-${Date.now() % 1000}`, steps: deepClone(get().steps), taktTime: get().taktTime };
    set(state => ({ multilines: state.multilines.concat(snap) }));
    get()._autosave();
    return snap;
  },
  removeLineSnapshot: (id) => {
    set(state => ({ multilines: state.multilines.filter(m => m.id !== id) }));
    get()._autosave();
  },

  /* ---- toasts ---- */
  toast: (msg, kind = "info") => {
    const id = Math.random().toString(36).slice(2, 8);
    set(state => ({ toasts: state.toasts.concat([{ id, msg, kind }]) }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 2500);
  },

  /* ---- clearing ---- */
  resetAll: () => {
    set({
      steps: deepClone(DEFAULT_STEPS),
      baselineSteps: deepClone(DEFAULT_STEPS),
      taktTime: DEFAULT_TAKT,
      selectedId: DEFAULT_STEPS[0]?.id,
      versions: [],
      multilines: [],
    });
    // wipe storage
    localStorage.removeItem("cta_project_v1");
    localStorage.removeItem("cta_versions_v1");
    get().pushActivity("Data reset to defaults", "sys");
  },

  /* ---- autosave internal ---- */
  _autosave: () => {
    const { steps, taktTime, selectedId, baselineSteps, activity, multilines, page } = get();
    saveProject({ steps, taktTime, selectedId, baselineSteps, activity, multilines, page });
  },
}));

function deepClone(x) { return JSON.parse(JSON.stringify(x)); }

function applyThemeDom(settings) {
  if (typeof document === "undefined") return;
  const b = document.body;
  b.classList.toggle("theme-dark", settings.theme === "dark");
  b.classList.toggle("compact", !!settings.compact);
}

// Apply theme on boot
if (typeof window !== "undefined") {
  setTimeout(() => applyThemeDom(useStore.getState().settings), 0);
}
