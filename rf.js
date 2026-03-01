// rf.js — Random Forest Regression (no library)

const FEATURE_KEYS = ["ai", "dt", "kb", "ki", "es"];
const TARGET_KEY = "final";

// ---------- Utils ----------
function clamp01(x){ return Math.max(0, Math.min(1, x)); }
function mean(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }
function mse(yTrue, yPred){
  let s = 0;
  for (let i=0;i<yTrue.length;i++){
    const d = yTrue[i]-yPred[i];
    s += d*d;
  }
  return s / yTrue.length;
}
function mae(yTrue, yPred){
  let s = 0;
  for (let i=0;i<yTrue.length;i++){
    s += Math.abs(yTrue[i]-yPred[i]);
  }
  return s / yTrue.length;
}
function r2(yTrue, yPred){
  const yBar = mean(yTrue);
  let ssRes = 0, ssTot = 0;
  for (let i=0;i<yTrue.length;i++){
    ssRes += (yTrue[i]-yPred[i])**2;
    ssTot += (yTrue[i]-yBar)**2;
  }
  return ssTot === 0 ? 0 : (1 - ssRes/ssTot);
}

function shuffle(arr){
  for (let i=arr.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

function bootstrapSample(data){
  const n = data.length;
  const out = [];
  for (let i=0;i<n;i++){
    out.push(data[Math.floor(Math.random()*n)]);
  }
  return out;
}

function featureSubset(keys, rate){
  const k = Math.max(1, Math.floor(keys.length * rate));
  const copy = keys.slice();
  shuffle(copy);
  return copy.slice(0, k);
}

function variance(values){
  const m = mean(values);
  let s = 0;
  for (const v of values) s += (v-m)**2;
  return s / values.length;
}

function splitData(data, feat, threshold){
  const left = [];
  const right = [];
  for (const row of data){
    if (row[feat] <= threshold) left.push(row);
    else right.push(row);
  }
  return [left, right];
}

function bestSplit(data, features){
  // Choose split that maximizes variance reduction
  const yAll = data.map(r => r[TARGET_KEY]);
  const baseVar = variance(yAll);

  let best = null;

  for (const feat of features){
    // Candidate thresholds: take some unique sorted values (sample to keep fast)
    const vals = data.map(r => r[feat]).sort((a,b)=>a-b);
    const uniq = [];
    for (let i=0;i<vals.length;i++){
      if (i===0 || vals[i] !== vals[i-1]) uniq.push(vals[i]);
    }
    if (uniq.length < 2) continue;

    // sample candidate thresholds (avoid too many)
    const step = Math.max(1, Math.floor(uniq.length / 12));
    for (let i=step; i<uniq.length; i+=step){
      const thr = uniq[i];

      const [L, R] = splitData(data, feat, thr);
      if (L.length === 0 || R.length === 0) continue;

      const vL = variance(L.map(r=>r[TARGET_KEY]));
      const vR = variance(R.map(r=>r[TARGET_KEY]));
      const wVar = (L.length/data.length)*vL + (R.length/data.length)*vR;

      const gain = baseVar - wVar; // variance reduction
      if (!best || gain > best.gain){
        best = { feat, thr, gain, left: L, right: R };
      }
    }
  }

  return best; // can be null
}

// ---------- Tree ----------
function buildTree(data, depth, maxDepth, minSamples, featRate, importance){
  // Stopping conditions
  if (depth >= maxDepth || data.length < minSamples){
    return { type: "leaf", value: mean(data.map(r=>r[TARGET_KEY])) };
  }

  const feats = featureSubset(FEATURE_KEYS, featRate);
  const split = bestSplit(data, feats);

  if (!split || split.gain <= 1e-9){
    return { type: "leaf", value: mean(data.map(r=>r[TARGET_KEY])) };
  }

  importance[split.feat] = (importance[split.feat] || 0) + 1;

  return {
    type: "node",
    feat: split.feat,
    thr: split.thr,
    left: buildTree(split.left, depth+1, maxDepth, minSamples, featRate, importance),
    right: buildTree(split.right, depth+1, maxDepth, minSamples, featRate, importance)
  };
}

function predictTree(node, x){
  if (node.type === "leaf") return node.value;
  if (x[node.feat] <= node.thr) return predictTree(node.left, x);
  return predictTree(node.right, x);
}

// ---------- Forest ----------
function trainForest(data, nTrees, maxDepth, minSamples, featRate){
  const trees = [];
  const importance = {}; // feature usage count

  for (let t=0; t<nTrees; t++){
    const sample = bootstrapSample(data);
    const tree = buildTree(sample, 0, maxDepth, minSamples, featRate, importance);
    trees.push(tree);
  }

  return { trees, importance };
}

function predictForest(model, x){
  const preds = model.trees.map(tr => predictTree(tr, x));
  return mean(preds);
}

// ---------- UI wiring ----------
const $ = (id) => document.getElementById(id);

let model = null;
let cachedData = null;

function loadDataset(){
  const raw = localStorage.getItem("gradeai_dataset");
  if (!raw) return null;

  const arr = JSON.parse(raw);

  // Dataset format check: expecting [{ai,dt,kb,ki,es,final}, ...]
  // If your stored format differs, adapt here.
  return arr
    .filter(r => FEATURE_KEYS.every(k => typeof r[k] === "number") && typeof r[TARGET_KEY] === "number")
    .map(r => ({
      ai: r.ai, dt: r.dt, kb: r.kb, ki: r.ki, es: r.es, final: r.final
    }));
}

function train(){
  const data = cachedData || loadDataset();
  if (!data || data.length < 30){
    $("trainStatus").textContent = "Dataset topilmadi yoki juda kichik. Avval dataset sahifani ochib keling.";
    return;
  }

  const nTrees = parseInt($("nTrees").value, 10);
  const maxDepth = parseInt($("maxDepth").value, 10);
  const minSamples = parseInt($("minSamples").value, 10);
  const featRate = clamp01(parseFloat($("featRate").value));

  $("trainStatus").textContent = "Training boshlandi...";

  // Train/Test split (80/20)
  const idx = [...Array(data.length).keys()];
  shuffle(idx);

  const splitAt = Math.floor(data.length * 0.8);
  const trainIdx = idx.slice(0, splitAt);
  const testIdx = idx.slice(splitAt);

  const trainData = trainIdx.map(i => data[i]);
  const testData = testIdx.map(i => data[i]);

  // Train forest
  model = trainForest(trainData, nTrees, maxDepth, minSamples, featRate);

  // Evaluate on test
  const yTrue = testData.map(r => r.final);
  const yPred = testData.map(r => predictForest(model, r));

  const MSE = mse(yTrue, yPred);
  const MAE = mae(yTrue, yPred);
  const R2 = r2(yTrue, yPred);

  $("mseBadge").textContent = `MSE: ${MSE.toFixed(2)}`;
  $("maeBadge").textContent = `MAE: ${MAE.toFixed(2)}`;
  $("r2Badge").textContent = `R²: ${R2.toFixed(3)}`;
  $("splitInfo").textContent = `Train/Test split: ${trainData.length} / ${testData.length} | Trees=${nTrees}, Depth=${maxDepth}`;

  // Feature importance (normalize)
  const imp = model.importance;
  const total = Object.values(imp).reduce((a,b)=>a+b,0) || 1;
  const ordered = FEATURE_KEYS
    .map(k => ({k, v: (imp[k]||0)/total}))
    .sort((a,b)=>b.v-a.v);

  const labelMap = { ai:"AI", dt:"DT", kb:"KB", ki:"KI", es:"ES" };
  $("weightsInfo").textContent =
    "Feature importance: " + ordered.map(o => `${labelMap[o.k]}=${(o.v*100).toFixed(0)}%`).join(" | ");

  $("trainStatus").textContent = "Training tugadi ✅";
}

function predict(){
  if (!model){
    $("predBadge").textContent = "Pred: avval Train qiling";
    return;
  }

  const x = {
    ai: parseFloat($("inAI").value),
    dt: parseFloat($("inDT").value),
    kb: parseFloat($("inKB").value),
    ki: parseFloat($("inKI").value),
    es: parseFloat($("inES").value),
  };

  const pred = predictForest(model, x);
  $("predBadge").textContent = `Pred: ${pred.toFixed(1)} / 100`;
}

// Init
cachedData = loadDataset();
$("trainBtn").addEventListener("click", train);
$("predictBtn").addEventListener("click", predict);

if (!cachedData){
  $("trainStatus").textContent = "Dataset topilmadi. Avval dataset.html ni ochib, keyin bu sahifaga keling.";
} else {
  $("trainStatus").textContent = `Dataset yuklandi ✅ (${cachedData.length} qator)`;
}


// rf.js train() ichida, MSE/MAE/R2 hisoblangandan keyin qo'shing:
localStorage.setItem("gradeai_model_metrics", JSON.stringify({
  mse: MSE,
  mae: MAE,
  r2: R2,
  nTrees,
  maxDepth,
  trainedAt: new Date().toLocaleString()
}));