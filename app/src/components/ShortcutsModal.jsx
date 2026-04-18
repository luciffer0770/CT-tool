import React from "react";
import { useStore } from "../store/useStore.js";

const SHORTCUTS = [
  ["Cmd/Ctrl + K", "Open command palette"],
  ["?", "Show this shortcuts help"],
  ["Cmd/Ctrl + Z", "Undo"],
  ["Cmd/Ctrl + Shift + Z", "Redo"],
  ["Cmd/Ctrl + S", "Save version"],
  ["G then D", "Dashboard"],
  ["G then B", "Cycle Builder"],
  ["G then G", "Gantt View"],
  ["G then A", "Analytics"],
  ["G then S", "Simulation"],
  ["G then R", "Reports"],
  ["G then T", "Industrial Tools"],
  ["G then ,", "Settings"],
  ["N (on Builder)", "Add step"],
  ["Shift + Click (Builder)", "Multi-select step for bulk / parallelise"],
  ["Drag step card", "Reorder"],
];

export default function ShortcutsModal() {
  const open = useStore(s => s.shortcuts);
  const toggle = useStore(s => s.toggleShortcuts);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) toggle(false); }}>
      <div className="modal">
        <div className="modal-head">
          <h3>Keyboard shortcuts</h3>
          <button className="btn xs" onClick={() => toggle(false)}>Close</button>
        </div>
        <div className="modal-body">
          {SHORTCUTS.map(([k, v]) => (
            <div key={k} className="kbd-row">
              <div><code>{k}</code></div>
              <div>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
