// analysis.js (FULL) — GradeAI
// Dataset: localStorage key = "gradeai_dataset"
// Model metrics: localStorage key = "gradeai_model_metrics"

const FEATURE_KEYS = ["ai", "dt", "kb", "ki", "es"];

const LABELS = {
  ai: "Sun’iy intellekt asoslari",
  dt: "Differensial tenglama",
  kb: "Kiberxavfsizligi asoslari",
  ki: "Kompyuter injeneringgiga kirish",
  es: "Ehtimollar va statistika",
  final: "final_score"
};

const $ = (id) => document.getElementById(id);

// -------------------- Data loaders --------------------
function loadDataset() {
  const raw = localStorage.getItem("gradeai_dataset");
  if (!raw) return null;

  try {
    const arr = JSON.parse(raw);

    // Expect: [{ai,dt,kb,ki,es,final}, ...]
    const cleaned = arr
      .filter(r => r && typeof r === "object")
      .filter(r => FEATURE_KEYS.every(k => typeof r[k] === "number") && typeof r.final === "number");

    return cleaned.length ? cleaned : null;
  } catch (e) {
    return null;
  }
}

function loadModelMetrics() {
  const raw = localStorage.getItem("gradeai_model_metrics");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// -------------------- Math helpers --------------------
function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function arrMin(arr) {
  return Math.min(...arr);
}

function arrMax(arr) {
  return Math.max(...arr);
}

// Pearson correlation
function pearsonCorr(x, y) {
  const n = x.length;
  const mx = mean(x);
  const my = mean(y);

  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }

  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : (num / den);
}

// -------------------- Theme for canvas --------------------
function getCanvasTheme() {
  const s = getComputedStyle(document.documentElement);
  return {
    bg: s.getPropertyValue("--card2").trim() || "#0c132a",
    border: s.getPropertyValue("--border").trim() || "#22305a",
    text: s.getPropertyValue("--muted2").trim() || "#d7def7",
    muted: s.getPropertyValue("--muted").trim() || "#a8b3d6",
    ink: "#cfe0ff",
    inkSoft: "rgba(207,224,255,.35)"
  };
}

function paintBackground(ctx, w, h, theme) {
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, w, h);
}

function clearCanvas(ctx, w, h, theme) {
  ctx.clearRect(0, 0, w, h);
  paintBackground(ctx, w, h, theme);
}

function drawAxes(ctx, w, h, theme) {
  const pad = 35;

  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1;

  // Y axis
  ctx.beginPath();
  ctx.moveTo(pad, 10);
  ctx.lineTo(pad, h - pad);
  ctx.stroke();

  // X axis
  ctx.beginPath();
  ctx.moveTo(pad, h - pad);
  ctx.lineTo(w - 10, h - pad);
  ctx.stroke();

  return { pad };
}

// Optional: light grid (looks pro)
function drawGrid(ctx, w, h, theme, pad, xSteps = 5, ySteps = 4) {
  ctx.strokeStyle = theme.inkSoft;
  ctx.lineWidth = 1;

  const plotW = (w - pad - 15);
  const plotH = (h - pad - 15);

  // vertical grid
  for (let i = 1; i <= xSteps; i++) {
    const x = pad + (plotW / xSteps) * i;
    ctx.beginPath();
    ctx.moveTo(x, 10);
    ctx.lineTo(x, h - pad);
    ctx.stroke();
  }

  // horizontal grid
  for (let i = 1; i <= ySteps; i++) {
    const y = (h - pad) - (plotH / ySteps) * i;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - 10, y);
    ctx.stroke();
  }
}

// -------------------- Render tables --------------------
function renderStats(data) {
  const cols = [...FEATURE_KEYS, "final"];
  const body = $("statsBody");

  body.innerHTML = cols.map((k) => {
    const arr = data.map(r => r[k]);
    return `
      <tr>
        <td style="text-align:left;"><b>${LABELS[k] || k}</b></td>
        <td>${arrMin(arr).toFixed(1)}</td>
        <td>${arrMax(arr).toFixed(1)}</td>
        <td>${mean(arr).toFixed(2)}</td>
      </tr>
    `;
  }).join("");
}

function renderCorr(data) {
  const y = data.map(r => r.final);
  const body = $("corrBody");

  const rows = FEATURE_KEYS.map((k) => {
    const x = data.map(r => r[k]);
    const c = pearsonCorr(x, y);
    return { key: k, corr: c };
  }).sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));

  body.innerHTML = rows.map(r => `
    <tr>
      <td style="text-align:left;"><b>${LABELS[r.key]}</b></td>
      <td>${r.corr.toFixed(3)}</td>
    </tr>
  `).join("");
}

// -------------------- Charts --------------------
function drawHistogram(canvas, values, bins = 10) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;

  const theme = getCanvasTheme();
  clearCanvas(ctx, w, h, theme);

  const { pad } = drawAxes(ctx, w, h, theme);
  drawGrid(ctx, w, h, theme, pad);

  const vmin = Math.min(...values);
  const vmax = Math.max(...values);
  const binSize = (vmax - vmin) / bins || 1;

  const counts = new Array(bins).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - vmin) / binSize);
    if (idx >= bins) idx = bins - 1;
    if (idx < 0) idx = 0;
    counts[idx]++;
  }

  const maxCount = Math.max(...counts) || 1;
  const plotW = (w - pad - 15);
  const plotH = (h - pad - 15);
  const barW = plotW / bins;

  // Bars
  ctx.fillStyle = theme.ink;
  for (let i = 0; i < bins; i++) {
    const barH = (counts[i] / maxCount) * plotH;
    const x = pad + i * barW + 2;
    const y = (h - pad) - barH;
    ctx.fillRect(x, y, Math.max(1, barW - 4), barH);
  }

  // Labels
  ctx.fillStyle = theme.text;
  ctx.font = "12px system-ui";
  ctx.fillText("Histogram: final_score", pad, 18);
  ctx.fillStyle = theme.muted;
  ctx.fillText(`${vmin.toFixed(0)}`, pad, h - 10);
  ctx.fillText(`${vmax.toFixed(0)}`, w - 45, h - 10);
}

function drawScatter(canvas, xVals, yVals, xLabel, yLabel) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;

  const theme = getCanvasTheme();
  clearCanvas(ctx, w, h, theme);

  const { pad } = drawAxes(ctx, w, h, theme);
  drawGrid(ctx, w, h, theme, pad);

  const xmin = Math.min(...xVals);
  const xmax = Math.max(...xVals);
  const ymin = Math.min(...yVals);
  const ymax = Math.max(...yVals);

  const plotW = (w - pad - 15);
  const plotH = (h - pad - 15);

  const scaleX = (x) => pad + ((x - xmin) / ((xmax - xmin) || 1)) * plotW;
  const scaleY = (y) => (h - pad) - ((y - ymin) / ((ymax - ymin) || 1)) * plotH;

  // points
  ctx.fillStyle = theme.ink;
  for (let i = 0; i < xVals.length; i++) {
    const x = scaleX(xVals[i]);
    const y = scaleY(yVals[i]);
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // labels
  ctx.fillStyle = theme.text;
  ctx.font = "12px system-ui";
  ctx.fillText(`Scatter: ${xLabel} vs ${yLabel}`, pad, 18);
}

function renderCharts(data) {
  const histCanvas = $("histCanvas");
  const scatterCanvas = $("scatterCanvas");

  const feature = $("featureSelect").value;

  const y = data.map(r => r.final);
  const x = data.map(r => r[feature]);

  drawHistogram(histCanvas, y, 10);
  drawScatter(scatterCanvas, x, y, LABELS[feature], "final_score");

  const c = pearsonCorr(x, y);
  $("dataNote").textContent = `Dataset: ${data.length} qator | Corr(${feature}, final_score) = ${c.toFixed(3)}`;
}

// -------------------- Model metrics render --------------------
function renderModelMetrics() {
  const m = loadModelMetrics();

  if (!m) {
    $("modelNote").textContent =
      "Hali model train qilinmagan. model.html sahifaga kirib “Train Model” bosing — natijalar bu yerda ham chiqadi.";
    return;
  }

  $("mseBadge").textContent = `MSE: ${Number(m.mse).toFixed(2)}`;
  $("maeBadge").textContent = `MAE: ${Number(m.mae).toFixed(2)}`;
  $("r2Badge").textContent = `R²: ${Number(m.r2).toFixed(3)}`;

  const extra = [];
  if (m.nTrees) extra.push(`Trees=${m.nTrees}`);
  if (m.maxDepth) extra.push(`Depth=${m.maxDepth}`);
  if (m.trainedAt) extra.push(`So‘nggi train: ${m.trainedAt}`);

  $("modelNote").textContent = extra.length ? extra.join(" | ") : "Model natijalari yuklandi ✅";
}

// -------------------- Init --------------------
function init() {
  const dataset = loadDataset();

  if (!dataset) {
    $("dataNote").textContent = "Dataset topilmadi. Avval dataset.html ni ochib, keyin bu sahifaga keling.";
    // jadval body'larni ham bo'sh qilib qo'yamiz
    $("statsBody").innerHTML = "";
    $("corrBody").innerHTML = "";
  } else {
    renderStats(dataset);
    renderCorr(dataset);
    renderCharts(dataset);
  }

  renderModelMetrics();

  $("redrawBtn").addEventListener("click", () => {
    const d = loadDataset();
    if (d) renderCharts(d);
  });

  $("featureSelect").addEventListener("change", () => {
    const d = loadDataset();
    if (d) renderCharts(d);
  });
}

init();