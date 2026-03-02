// rf.js — Random Forest Regression (no library) — optimized
// Dataset expected: [{ai,dt,kb,ki,es,final}, ...] from localStorage key: gradeai_dataset

const FEATURE_KEYS = ["ai", "dt", "kb", "ki", "es"];
const TARGET_KEY = "final";

// ---------- Small helpers ----------
const $ = (id) => document.getElementById(id);

function clamp01(x) { return Math.max(0, Math.min(1, x)); }
function mean(arr) { return arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length); }

function mse(yTrue, yPred) {
  let s = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const d = yTrue[i] - yPred[i];
    s += d * d;
  }
  return s / Math.max(1, yTrue.length);
}

function mae(yTrue, yPred) {
  let s = 0;
  for (let i = 0; i < yTrue.length; i++) s += Math.abs(yTrue[i] - yPred[i]);
  return s / Math.max(1, yTrue.length);
}

function r2(yTrue, yPred) {
  const yBar = mean(yTrue);
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < yTrue.length; i++) {
    ssRes += (yTrue[i] - yPred[i]) ** 2;
    ssTot += (yTrue[i] - yBar) ** 2;
  }
  return ssTot === 0 ? 0 : (1 - ssRes / ssTot);
}

// Seeded RNG (deterministic)
function makeRNG(seed = 42) {
  let s = seed >>> 0;
  return function rand() {
    // LCG
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function shuffleInPlace(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function bootstrapSample(data, rand) {
  const n = data.length;
  const out = new Array(n);
  for (let i = 0; i < n; i++) out[i] = data[Math.floor(rand() * n)];
  return out;
}

function featureSubset(keys, rate, rand) {
  const k = Math.max(1, Math.floor(keys.length * rate));
  const copy = keys.slice();
  shuffleInPlace(copy, rand);
  return copy.slice(0, k);
}

// variance with precomputed mean
function variance(values) {
  const m = mean(values);
  let s = 0;
  for (let i = 0; i < values.length; i++) {
    const d = values[i] - m;
    s += d * d;
  }
  return s / Math.max(1, values.length);
}

function splitData(data, feat, thr) {
  const left = [];
  const right = [];
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[feat] <= thr) left.push(row);
    else right.push(row);
  }
  return [left, right];
}

/**
 * OPTIMIZATION:
 * - Threshold candidates are sampled (not all unique values)
 * - Fewer evaluations, faster training
 */
function bestSplit(data, features, rand) {
  const yAll = data.map(r => r[TARGET_KEY]);
  const baseVar = variance(yAll);

  let best = null;

  for (const feat of features) {
    // sorted values for candidate thresholds
    const vals = data.map(r => r[feat]).sort((a, b) => a - b);
    if (vals.length < 2) continue;

    // pick up to 10 candidate thresholds by index (quantile-like)
    const candidates = [];
    const steps = Math.min(10, Math.max(2, Math.floor(vals.length / 5)));
    for (let i = 1; i < steps; i++) {
      const idx = Math.floor((i / steps) * (vals.length - 1));
      candidates.push(vals[idx]);
    }
    // also add 1 random candidate to diversify a bit
    candidates.push(vals[Math.floor(rand() * vals.length)]);

    for (const thr of candidates) {
      const [L, R] = splitData(data, feat, thr);
      if (L.length === 0 || R.length === 0) continue;

      const vL = variance(L.map(r => r[TARGET_KEY]));
      const vR = variance(R.map(r => r[TARGET_KEY]));
      const wVar = (L.length / data.length) * vL + (R.length / data.length) * vR;

      const gain = baseVar - wVar;
      if (!best || gain > best.gain) {
        best = { feat, thr, gain, left: L, right: R };
      }
    }
  }

  return best;
}

// ---------- Tree ----------
function buildTree(data, depth, maxDepth, minSamples, featRate, importance, rand) {
  if (depth >= maxDepth || data.length < minSamples) {
    return { type: "leaf", value: mean(data.map(r => r[TARGET_KEY])) };
  }

  const feats = featureSubset(FEATURE_KEYS, featRate, rand);
  const split = bestSplit(data, feats, rand);

  if (!split || split.gain <= 1e-9) {
    return { type: "leaf", value: mean(data.map(r => r[TARGET_KEY])) };
  }

  importance[split.feat] = (importance[split.feat] || 0) + 1;

  return {
    type: "node",
    feat: split.feat,
    thr: split.thr,
    left: buildTree(split.left, depth + 1, maxDepth, minSamples, featRate, importance, rand),
    right: buildTree(split.right, depth + 1, maxDepth, minSamples, featRate, importance, rand),
  };
}

function predictTree(node, x) {
  while (node.type !== "leaf") {
    node = (x[node.feat] <= node.thr) ? node.left : node.right;
  }
  return node.value;
}

// ---------- Forest ----------
async function trainForestAsync(data, nTrees, maxDepth, minSamples, featRate, seed, onProgress) {
  const rand = makeRNG(seed);
  const trees = [];
  const importance = {};

  for (let t = 0; t < nTrees; t++) {
    const sample = bootstrapSample(data, rand);
    const tree = buildTree(sample, 0, maxDepth, minSamples, featRate, importance, rand);
    trees.push(tree);

    if (typeof onProgress === "function") onProgress(t + 1, nTrees);

    // Yield every few trees to keep UI responsive
    if ((t + 1) % 5 === 0) await new Promise(r => setTimeout(r, 0));
  }

  return { trees, importance };
}

function predictForest(model, x) {
  let s = 0;
  for (let i = 0; i < model.trees.length; i++) {
    s += predictTree(model.trees[i], x);
  }
  return s / Math.max(1, model.trees.length);
}

// ---------- Dataset ----------
function normalizeDataset(arr) {
  return (arr || [])
    .filter(r => FEATURE_KEYS.every(k => typeof r[k] === "number") && typeof r[TARGET_KEY] === "number")
    .map(r => ({
      ai: r.ai, dt: r.dt, kb: r.kb, ki: r.ki, es: r.es, final: r.final
    }));
}

function loadDatasetFromLS() {
  const raw = localStorage.getItem("gradeai_dataset");
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    return normalizeDataset(arr);
  } catch {
    return null;
  }
}

function makeDemoDataset(n = 60, seed = 42) {
  const rand = makeRNG(seed);
  const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
  const rows = [];

  for (let i = 0; i < n; i++) {
    const ai = clamp(55 + rand() * 45);
    const dt = clamp(50 + rand() * 50);
    const kb = clamp(45 + rand() * 55);
    const ki = clamp(50 + rand() * 50);
    const es = clamp(40 + rand() * 60);
    const noise = (rand() - 0.5) * 8;
    const final = clamp(0.22 * ai + 0.20 * dt + 0.20 * kb + 0.20 * ki + 0.18 * es + noise);

    rows.push({ ai, dt, kb, ki, es, final });
  }
  return rows;
}

// ---------- Theme + mobile nav ----------
(function initUI() {
  const root = document.documentElement;
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;

  $("themeToggle")?.addEventListener("click", () => {
    const current = root.dataset.theme || "dark";
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
  });

  const burger = $("burger");
  const mobileNav = $("mobileNav");
  burger?.addEventListener("click", () => {
    const isHidden = mobileNav.hasAttribute("hidden");
    if (isHidden) mobileNav.removeAttribute("hidden");
    else mobileNav.setAttribute("hidden", "");
  });
  mobileNav?.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) mobileNav.setAttribute("hidden", "");
  });
})();

// ---------- App state ----------
let model = null;
let dataset = null;

function setStatus(text, type = "ok") {
  const pill = $("statusPill");
  pill.textContent = text;

  // tiny visual change by type
  pill.style.opacity = "1";
  if (type === "warn") pill.style.filter = "brightness(1.05)";
  if (type === "busy") pill.style.filter = "brightness(1.15)";
}

function renderDatasetMeta() {
  $("dsMeta").textContent = dataset ? `${dataset.length} qator` : "yo‘q";
}

function resetMetricsUI() {
  $("mseBadge").textContent = "-";
  $("maeBadge").textContent = "-";
  $("r2Badge").textContent = "-";
  $("splitInfo").textContent = "Train/Test: -";
  $("weightsInfo").textContent = "Feature importance: -";
  $("trainedAt").textContent = "Trained at: -";
  $("predBadge").textContent = "-";
}

function renderSavedMetrics() {
  const raw = localStorage.getItem("gradeai_model_metrics");
  if (!raw) return;
  try {
    const m = JSON.parse(raw);
    $("mseBadge").textContent = (m.mse ?? "-") === "-" ? "-" : Number(m.mse).toFixed(2);
    $("maeBadge").textContent = (m.mae ?? "-") === "-" ? "-" : Number(m.mae).toFixed(2);
    $("r2Badge").textContent = (m.r2 ?? "-") === "-" ? "-" : Number(m.r2).toFixed(3);
    $("trainedAt").textContent = `Trained at: ${m.trainedAt || "-"}`;
  } catch {}
}

function importanceText(importance) {
  const total = Object.values(importance).reduce((a, b) => a + b, 0) || 1;
  const labelMap = { ai: "AI", dt: "DT", kb: "KB", ki: "KI", es: "ES" };

  const ordered = FEATURE_KEYS
    .map(k => ({ k, v: (importance[k] || 0) / total }))
    .sort((a, b) => b.v - a.v);

  return ordered.map(o => `${labelMap[o.k]}=${(o.v * 100).toFixed(0)}%`).join(" | ");
}

// ---------- Train / Predict ----------
async function train() {
  if (!dataset || dataset.length < 20) {
    $("trainStatus").textContent = "Dataset topilmadi yoki juda kichik. Dataset sahifasini ochib keling yoki Demo ni tanlang.";
    setStatus("Dataset yo‘q", "warn");
    return;
  }

  const nTrees = parseInt($("nTrees").value, 10);
  const maxDepth = parseInt($("maxDepth").value, 10);
  const minSamples = parseInt($("minSamples").value, 10);
  const featRate = clamp01(parseFloat($("featRate").value));
  const testSize = clamp01(parseFloat($("testSize").value));
  const seed = parseInt($("seed").value, 10) || 42;

  setStatus("Training...", "busy");
  $("trainStatus").textContent = "Training boshlandi...";

  // split
  const idx = [...Array(dataset.length).keys()];
  const rand = makeRNG(seed);
  shuffleInPlace(idx, rand);

  const splitAt = Math.max(1, Math.floor(dataset.length * (1 - testSize)));
  const trainIdx = idx.slice(0, splitAt);
  const testIdx = idx.slice(splitAt);

  const trainData = trainIdx.map(i => dataset[i]);
  const testData = testIdx.map(i => dataset[i]);

  // train async
  model = await trainForestAsync(
    trainData,
    nTrees,
    maxDepth,
    minSamples,
    featRate,
    seed,
    (done, total) => {
      $("trainStatus").textContent = `Training... (${done}/${total} trees)`;
    }
  );

  // eval
  const yTrue = testData.map(r => r.final);
  const yPred = testData.map(r => predictForest(model, r));

  const MSE = mse(yTrue, yPred);
  const MAE = mae(yTrue, yPred);
  const R2 = r2(yTrue, yPred);

  $("mseBadge").textContent = MSE.toFixed(2);
  $("maeBadge").textContent = MAE.toFixed(2);
  $("r2Badge").textContent = R2.toFixed(3);
  $("splitInfo").textContent = `Train/Test: ${trainData.length} / ${testData.length} | Trees=${nTrees}, Depth=${maxDepth}`;
  $("weightsInfo").textContent = "Feature importance: " + importanceText(model.importance);

  const trainedAt = new Date().toLocaleString();
  $("trainedAt").textContent = `Trained at: ${trainedAt}`;

  // persist metrics
  localStorage.setItem("gradeai_model_metrics", JSON.stringify({
    mse: MSE,
    mae: MAE,
    r2: R2,
    nTrees,
    maxDepth,
    minSamples,
    featRate,
    testSize,
    seed,
    trainedAt
  }));

  $("trainStatus").textContent = "Training tugadi ✅";
  setStatus("Trained ✅", "ok");
}

function predict() {
  if (!model) {
    $("predBadge").textContent = "Avval Train qiling";
    setStatus("Model yo‘q", "warn");
    return;
  }

  const x = {
    ai: Number($("inAI").value),
    dt: Number($("inDT").value),
    kb: Number($("inKB").value),
    ki: Number($("inKI").value),
    es: Number($("inES").value),
  };

  const pred = predictForest(model, x);
  $("predBadge").textContent = `${pred.toFixed(1)} / 100`;
  setStatus("Predict ✅", "ok");
}

// ---------- Controls ----------
function useDatasetFromLS() {
  const data = loadDatasetFromLS();
  if (!data || data.length === 0) {
    dataset = null;
    $("trainStatus").textContent = "LocalStorage’da dataset topilmadi. Dataset sahifasida data yarating yoki Demo ni tanlang.";
    setStatus("Dataset yo‘q", "warn");
  } else {
    dataset = data;
    $("trainStatus").textContent = `Dataset yuklandi ✅ (${dataset.length} qator)`;
    setStatus("Dataset OK", "ok");
  }
  renderDatasetMeta();
}

function useDemoDataset() {
  dataset = makeDemoDataset(60, 42);
  $("trainStatus").textContent = `Demo dataset yuklandi ✅ (${dataset.length} qator)`;
  setStatus("Demo OK", "ok");
  renderDatasetMeta();
}

function fillExample() {
  $("inAI").value = 82;
  $("inDT").value = 71;
  $("inKB").value = 76;
  $("inKI").value = 88;
  $("inES").value = 69;
}

// ---------- Init ----------
(function init() {
  resetMetricsUI();
  renderSavedMetrics();

  $("trainBtn")?.addEventListener("click", train);
  $("predictBtn")?.addEventListener("click", predict);

  $("loadFromLSBtn")?.addEventListener("click", useDatasetFromLS);
  $("useDemoBtn")?.addEventListener("click", useDemoDataset);

  $("resetMetricsBtn")?.addEventListener("click", () => {
    localStorage.removeItem("gradeai_model_metrics");
    resetMetricsUI();
    setStatus("Reset ✅", "ok");
  });

  $("fillExampleBtn")?.addEventListener("click", fillExample);

  // Auto try load from LS first
  useDatasetFromLS();
})();