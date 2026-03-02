// analysis.js — GradeAI Analytics (optimized)
// Dataset key: gradeai_dataset_v1 (fallback: gradeai_dataset)
// Model metrics key: gradeai_model_metrics

(() => {
  const DATASET_KEYS = ["gradeai_dataset_v1", "gradeai_dataset"];
  const METRICS_KEY = "gradeai_model_metrics";

  const FEATURE_KEYS = ["ai", "dt", "kb", "ki", "es"];
  const LABELS = {
    ai: "Sun’iy intellekt asoslari",
    dt: "Differensial tenglama",
    kb: "Kiberxavfsizlik asoslari",
    ki: "Kompyuter injeneringga kirish",
    es: "Ehtimollar va statistika",
    final: "final_score"
  };

  const $ = (id) => document.getElementById(id);

  // ---------- Loaders ----------
  function loadDataset() {
    for (const key of DATASET_KEYS) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      try {
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) continue;

        // supports both:
        // {ai,dt,kb,ki,es,final}
        // {id,fio,ai,dt,kb,ki,es,final}
        const cleaned = arr
          .filter(r => r && typeof r === "object")
          .filter(r => FEATURE_KEYS.every(k => typeof r[k] === "number") && typeof r.final === "number")
          .map(r => ({
            ai: r.ai, dt: r.dt, kb: r.kb, ki: r.ki, es: r.es, final: r.final
          }));

        if (cleaned.length) return { key, data: cleaned };
      } catch { }
    }
    return null;
  }

  function loadModelMetrics() {
    const raw = localStorage.getItem(METRICS_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  // ---------- Math ----------
  const mean = (a) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
  const min = (a) => Math.min(...a);
  const max = (a) => Math.max(...a);

  function pearsonCorr(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    const mx = mean(x), my = mean(y);
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

  // Simple linear regression (y = a + b x) for trendline
  function linearRegression(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return { a: 0, b: 0 };
    const mx = mean(x), my = mean(y);
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx;
      num += dx * (y[i] - my);
      den += dx * dx;
    }
    const b = den === 0 ? 0 : (num / den);
    const a = my - b * mx;
    return { a, b };
  }

  // ---------- Theme / Canvas utils ----------
  function theme() {
    const s = getComputedStyle(document.documentElement);
    return {
      cardBg: s.getPropertyValue("--card2").trim() || "rgba(255,255,255,.06)",
      border: s.getPropertyValue("--border").trim() || "rgba(255,255,255,.12)",
      text: s.getPropertyValue("--text").trim() || "#e8eefc",
      muted: s.getPropertyValue("--muted").trim() || "rgba(255,255,255,.7)",
      ink: s.getPropertyValue("--brand").trim() || "#6ae4ff",
      ink2: s.getPropertyValue("--brand2").trim() || "#7c5cff"
    };
  }

  function setupCanvas(canvas) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(10, Math.floor(rect.width));
    const h = Math.max(10, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
    return { ctx, w, h };
  }

  function clear(ctx, w, h, t) {
    ctx.clearRect(0, 0, w, h);
    // background
    ctx.fillStyle = t.cardBg;
    ctx.fillRect(0, 0, w, h);
    // border
    ctx.strokeStyle = t.border;
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }

  function drawGrid(ctx, plot, t, xSteps = 6, ySteps = 4) {
    ctx.strokeStyle = withAlpha(t.border, 0.6);
    ctx.lineWidth = 1;

    for (let i = 1; i < xSteps; i++) {
      const x = plot.x + (plot.w / xSteps) * i;
      ctx.beginPath();
      ctx.moveTo(x, plot.y);
      ctx.lineTo(x, plot.y + plot.h);
      ctx.stroke();
    }
    for (let i = 1; i < ySteps; i++) {
      const y = plot.y + (plot.h / ySteps) * i;
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.w, y);
      ctx.stroke();
    }
  }

  function withAlpha(color, a) {
    // crude: if already rgba, keep; else fallback
    if (color.startsWith("rgba")) return color;
    if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `, ${a})`);
    // best effort
    return `rgba(255,255,255,${a})`;
  }

  function text(ctx, str, x, y, t, size = 12, bold = false, color = t.text) {
    ctx.fillStyle = color;
    ctx.font = `${bold ? "800" : "500"} ${size}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.fillText(str, x, y);
  }

  // ---------- Tables ----------
  function renderStats(data) {
    const cols = [...FEATURE_KEYS, "final"];
    const body = $("statsBody");
    body.innerHTML = cols.map((k) => {
      const arr = data.map(r => r[k]);
      return `
        <tr>
          <td style="text-align:left;"><b>${LABELS[k] || k}</b></td>
          <td>${min(arr).toFixed(1)}</td>
          <td>${max(arr).toFixed(1)}</td>
          <td>${mean(arr).toFixed(2)}</td>
        </tr>
      `;
    }).join("");
  }

  function calcCorrRows(data) {
    const y = data.map(r => r.final);
    return FEATURE_KEYS.map(k => {
      const x = data.map(r => r[k]);
      return { key: k, corr: pearsonCorr(x, y) };
    }).sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
  }

  function renderCorrTable(rows) {
    const body = $("corrBody");
    body.innerHTML = rows.map(r => `
      <tr>
        <td style="text-align:left;"><b>${LABELS[r.key]}</b></td>
        <td>${r.corr.toFixed(3)}</td>
      </tr>
    `).join("");
  }

  // ---------- Charts ----------
  function drawHistogram(canvas, values, bins = 10) {
    const t = theme();
    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h, t);

    const pad = 36;
    const plot = { x: pad, y: 18, w: w - pad - 12, h: h - 18 - 34 };
    drawGrid(ctx, plot, t);

    const vmin = Math.min(...values);
    const vmax = Math.max(...values);
    const range = (vmax - vmin) || 1;
    const binSize = range / bins;

    const counts = new Array(bins).fill(0);
    for (const v of values) {
      let idx = Math.floor((v - vmin) / binSize);
      if (idx < 0) idx = 0;
      if (idx >= bins) idx = bins - 1;
      counts[idx]++;
    }

    const maxCount = Math.max(...counts) || 1;
    const barW = plot.w / bins;

    // bars (use brand color)
    ctx.fillStyle = withAlpha(t.ink, 0.9);
    for (let i = 0; i < bins; i++) {
      const bh = (counts[i] / maxCount) * plot.h;
      const x = plot.x + i * barW + 4;
      const y = plot.y + plot.h - bh;
      ctx.fillRect(x, y, Math.max(1, barW - 8), bh);
    }

    // title & axis notes
    text(ctx, "final_score taqsimoti (Histogram)", plot.x, 14, t, 12, true);
    text(ctx, `${vmin.toFixed(0)}`, plot.x, h - 10, t, 11, false, t.muted);
    text(ctx, `${vmax.toFixed(0)}`, plot.x + plot.w - 30, h - 10, t, 11, false, t.muted);
  }

  function drawScatter(canvas, xVals, yVals, xLabel) {
    const t = theme();
    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h, t);

    const pad = 44;
    const plot = { x: pad, y: 18, w: w - pad - 12, h: h - 18 - 34 };
    drawGrid(ctx, plot, t);

    const xmin = Math.min(...xVals);
    const xmax = Math.max(...xVals);
    const ymin = Math.min(...yVals);
    const ymax = Math.max(...yVals);

    const sx = (x) => plot.x + ((x - xmin) / ((xmax - xmin) || 1)) * plot.w;
    const sy = (y) => plot.y + plot.h - ((y - ymin) / ((ymax - ymin) || 1)) * plot.h;

    // points
    ctx.fillStyle = withAlpha(t.ink2, 0.9);
    for (let i = 0; i < xVals.length; i++) {
      const x = sx(xVals[i]);
      const y = sy(yVals[i]);
      ctx.beginPath();
      ctx.arc(x, y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // trendline (linear regression)
    const { a, b } = linearRegression(xVals, yVals);
    const x1 = xmin, x2 = xmax;
    const y1 = a + b * x1;
    const y2 = a + b * x2;

    ctx.strokeStyle = withAlpha(t.ink, 0.95);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx(x1), sy(y1));
    ctx.lineTo(sx(x2), sy(y2));
    ctx.stroke();

    // labels
    text(ctx, `Scatter: ${xLabel} → final_score`, plot.x, 14, t, 12, true);
    text(ctx, `y = ${a.toFixed(2)} + ${b.toFixed(2)}x`, plot.x, h - 10, t, 11, false, t.muted);
  }

  function drawCorrBars(canvas, rows) {
    const t = theme();
    const { ctx, w, h } = setupCanvas(canvas);
    clear(ctx, w, h, t);

    const padL = 170;
    const padT = 22;
    const padB = 22;
    const plot = { x: padL, y: padT, w: w - padL - 14, h: h - padT - padB };
    drawGrid(ctx, plot, t, 4, rows.length);

    // axis center for 0 correlation
    const zeroX = plot.x + plot.w / 2;

    // center line
    ctx.strokeStyle = withAlpha(t.border, 0.9);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(zeroX, plot.y);
    ctx.lineTo(zeroX, plot.y + plot.h);
    ctx.stroke();

    const rowH = plot.h / rows.length;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const y = plot.y + i * rowH + rowH * 0.18;
      const barH = rowH * 0.64;

      const v = Math.max(-1, Math.min(1, r.corr));
      const barW = Math.abs(v) * (plot.w / 2);
      const x = v >= 0 ? zeroX : (zeroX - barW);

      // color: positive brand, negative brand2
      ctx.fillStyle = v >= 0 ? withAlpha(t.ink, 0.85) : withAlpha(t.ink2, 0.85);
      ctx.fillRect(x, y, barW, barH);

      // label on left
      text(ctx, LABELS[r.key], 12, y + barH * 0.72, t, 12, true, t.text);

      // value on right edge of bar
      const valText = r.corr.toFixed(3);
      const tx = v >= 0 ? (x + barW + 8) : (x - 56);
      text(ctx, valText, tx, y + barH * 0.72, t, 11, false, t.muted);
    }

    text(ctx, "Correlation bar chart (feature → final_score)", plot.x, 14, t, 12, true);
  }

  function renderCharts(data) {
    const feature = $("featureSelect").value;
    const y = data.map(r => r.final);
    const x = data.map(r => r[feature]);

    drawHistogram($("histCanvas"), y, 10);
    drawScatter($("scatterCanvas"), x, y, LABELS[feature]);

    const corrRows = calcCorrRows(data);
    drawCorrBars($("corrCanvas"), corrRows);

    const c = pearsonCorr(x, y);
    $("dataNote").textContent =
      `Dataset: ${data.length} qator | Corr(${feature}, final_score) = ${c.toFixed(3)} | Vizual + statistik tahlil tayyor ✅`;
  }

  // ---------- Model metrics ----------
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

    const pill = $("trainedAtPill");
    if (m.trainedAt && pill) {
      pill.style.display = "inline-flex";
      pill.textContent = `Train: ${m.trainedAt}`;
    }

    const extra = [];
    if (m.nTrees) extra.push(`Trees=${m.nTrees}`);
    if (m.maxDepth) extra.push(`Depth=${m.maxDepth}`);
    if (m.featRate) extra.push(`FeatRate=${Number(m.featRate).toFixed(2)}`);

    $("modelNote").textContent = extra.length ? extra.join(" | ") : "Model natijalari yuklandi ✅";
  }

  // ---------- Init ----------
  function init() {
    const ds = loadDataset();

    if (!ds) {
      $("dsSource").textContent = "Topilmadi";
      $("dsCount").textContent = "-";
      $("dataNote").textContent = "Dataset topilmadi. Avval dataset.html ni ochib dataset yarating/tahrir qiling.";
      $("statsBody").innerHTML = "";
      $("corrBody").innerHTML = "";
      renderModelMetrics();
      return;
    }

    $("dsSource").textContent = ds.key;
    $("dsCount").textContent = `${ds.data.length} ta`;

    renderStats(ds.data);
    const rows = calcCorrRows(ds.data);
    renderCorrTable(rows);

    renderCharts(ds.data);
    renderModelMetrics();

    $("redrawBtn").addEventListener("click", () => {
      const re = loadDataset();
      if (re) renderCharts(re.data);
    });

    $("featureSelect").addEventListener("change", () => {
      const re = loadDataset();
      if (re) renderCharts(re.data);
    });

    // re-render charts on theme change (dark/light)
    window.addEventListener("gradeai-theme-change", () => {
      const re = loadDataset();
      if (re) renderCharts(re.data);
    });

    // also rerender on resize (debounced)
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const re = loadDataset();
        if (re) renderCharts(re.data);
      }, 120);
    });
  }

  init();
})();