import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportReportToPDF({ project, schedule, reportId = `R-${Date.now()}`, title = "Cycle Time Report" }) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  // Colored prism bar on top
  const bar = [["#E11D2E", 0.2], ["#6D28D9", 0.2], ["#1E40AF", 0.2], ["#06B6D4", 0.2], ["#22C55E", 0.2]];
  let x = 40;
  const w = (pageW - 80) / 5;
  bar.forEach(([c]) => {
    doc.setFillColor(c);
    doc.rect(x, 36, w, 5, "F");
    x += w;
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("CYCLE TIME REPORT", 40, 60);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text(title, 40, 80);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90);
  const meta = `${project?.line || "LINE-07"} · ${project?.shift || "Shift B"} · ${new Date().toLocaleString()}`;
  doc.text(meta, 40, 96);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`ID ${reportId}   REV v${(project?.versionCount || 14)}`, pageW - 40, 60, { align: "right" });

  // KPI boxes
  const kpi = [
    { label: "CYCLE TIME", val: `${schedule.totalCycleTime}s` },
    { label: "TAKT", val: `${schedule.takt}s` },
    { label: "EFFICIENCY", val: `${schedule.efficiency}%` },
    { label: "BOTTLENECK", val: schedule.bottleneck?.name || "—" },
  ];
  const boxW = (pageW - 80) / 4 - 8;
  let kx = 40;
  const ky = 120;
  kpi.forEach(k => {
    doc.setDrawColor(210);
    doc.rect(kx, ky, boxW, 50);
    doc.setFontSize(7); doc.setTextColor(130);
    doc.text(k.label, kx + 10, ky + 15);
    doc.setFontSize(16); doc.setTextColor(20);
    doc.setFont("helvetica", "bold");
    doc.text(String(k.val), kx + 10, ky + 38);
    doc.setFont("helvetica", "normal");
    kx += boxW + 10;
  });

  // Steps table
  autoTable(doc, {
    startY: 190,
    head: [["#", "Step", "Machine", "Operator", "Setup", "Cycle", "Start", "End", "Wait", "Status"]],
    body: schedule.steps.map((s, i) => [
      i + 1,
      s.name,
      `${s.machineTime}s`,
      `${s.operatorTime}s`,
      `${s.setupTime}s`,
      `${s.cycleTime}s`,
      `${s.startTime}s`,
      `${s.endTime}s`,
      `${s.waitTime}s`,
      s.bottleneck ? "BOTTLENECK" : s.critical ? "CRITICAL" : "OPTIMAL",
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 9) {
        const v = data.cell.raw;
        if (v === "BOTTLENECK") {
          doc.setFillColor(253, 236, 238);
          doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
          doc.setTextColor(225, 29, 46);
          doc.setFont("helvetica", "bold");
          doc.text(v, data.cell.x + 4, data.cell.y + data.cell.height - 5);
          doc.setTextColor(20);
          doc.setFont("helvetica", "normal");
        }
      }
    },
  });

  // Page 2 — Gantt snapshot
  doc.addPage();
  doc.setFont("helvetica", "bold"); doc.setFontSize(14);
  doc.text("Gantt Snapshot", 40, 50);
  drawGantt(doc, schedule, 40, 70, pageW - 80, 400);

  // Footer
  const nPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= nPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8); doc.setTextColor(140);
    doc.text(`CYCLE TIME ANALYZER · INDUSTRIAL EDITION`, 40, doc.internal.pageSize.getHeight() - 20);
    doc.text(`PAGE ${i} / ${nPages}`, pageW - 40, doc.internal.pageSize.getHeight() - 20, { align: "right" });
  }

  doc.save(`${reportId}.pdf`);
}

function drawGantt(doc, schedule, x, y, w, h) {
  const steps = schedule.steps;
  if (!steps.length) return;
  const total = Math.max(schedule.totalCycleTime, schedule.takt) * 1.05;
  const labelW = 120;
  const trackW = w - labelW;
  const rowH = Math.max(14, Math.min(26, (h - 30) / steps.length));
  // axis ticks
  doc.setDrawColor(220);
  const tickEvery = 20;
  for (let t = 0; t <= total; t += tickEvery) {
    const tx = x + labelW + (t / total) * trackW;
    doc.line(tx, y, tx, y + steps.length * rowH);
  }
  doc.setFontSize(8); doc.setTextColor(120);
  for (let t = 0; t <= total; t += tickEvery * 2) {
    const tx = x + labelW + (t / total) * trackW;
    doc.text(`${t}s`, tx, y - 2);
  }
  // takt line
  const tktx = x + labelW + (schedule.takt / total) * trackW;
  doc.setDrawColor(225, 29, 46);
  doc.setLineDashPattern([3, 3], 0);
  doc.line(tktx, y, tktx, y + steps.length * rowH);
  doc.setLineDashPattern([], 0);
  doc.setTextColor(225, 29, 46);
  doc.text(`TAKT ${schedule.takt}s`, tktx + 2, y + 10);

  steps.forEach((s, i) => {
    const ry = y + i * rowH + 2;
    doc.setTextColor(40); doc.setFontSize(8);
    doc.text(s.name.slice(0, 20), x, ry + rowH / 2 + 2);
    // setup
    const setupX = x + labelW + (s.startTime / total) * trackW;
    const setupW = (s.setupTime / total) * trackW;
    const machX = setupX + setupW;
    const machW = (s.machineTime / total) * trackW;
    const opX = machX + machW;
    const opW = (s.operatorTime / total) * trackW;
    doc.setFillColor("#6D28D9"); doc.rect(setupX, ry, setupW, rowH - 6, "F");
    doc.setFillColor(s.bottleneck ? "#E11D2E" : "#1E40AF"); doc.rect(machX, ry, machW, rowH - 6, "F");
    doc.setFillColor("#06B6D4"); doc.rect(opX, ry, opW, rowH - 6, "F");
  });
}

export function exportKPIsToPDF({ schedule, title = "KPI Snapshot" }) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  doc.setFont("helvetica", "bold"); doc.setFontSize(18);
  doc.text(title, 40, 50);
  const rows = [
    ["Total Cycle Time", `${schedule.totalCycleTime}s`],
    ["Takt", `${schedule.takt}s`],
    ["Efficiency", `${schedule.efficiency}%`],
    ["VA Ratio", `${schedule.vaPct}%`],
    ["Bottleneck", schedule.bottleneck?.name || "—"],
    ["Step Count", `${schedule.steps.length}`],
    ["Total Wait", `${schedule.totalWait}s`],
  ];
  autoTable(doc, {
    startY: 80, head: [["Metric", "Value"]], body: rows,
    headStyles: { fillColor: [30, 64, 175] },
  });
  doc.save(`kpi-${Date.now()}.pdf`);
}
