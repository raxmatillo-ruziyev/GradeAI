// dataset.js

const PAGE_SIZE = 20;
let currentPage = 1;

// 100 ta sun'iy data generatsiya (xohlasang keyin real data array bilan almashtirasan)
function generateData(n = 100) {
  // deterministic bo‘lishi uchun oddiy pseudo-random
  let seed = 42;
  const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

  const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

  const rows = [];
  for (let i = 0; i < n; i++) {
    const ai = clamp(55 + rand() * 45);
    const dt = clamp(50 + rand() * 50);
    const kb = clamp(45 + rand() * 55);
    const ki = clamp(50 + rand() * 50);
    const es = clamp(40 + rand() * 60);

    // final_score (taxminiy): fanlar aralashmasi + kichik shovqin
    const noise = (rand() - 0.5) * 8;
    const final = clamp(0.22*ai + 0.20*dt + 0.20*kb + 0.20*ki + 0.18*es + noise);

    rows.push({ ai, dt, kb, ki, es, final });
  }
  return rows;
}

const data = generateData(100);

// DOM
const tbody = document.getElementById("tbody");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const downloadBtn = document.getElementById("downloadBtn");

function totalPages() {
  return Math.ceil(data.length / PAGE_SIZE);
}

function renderTable() {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, data.length);
  const pageRows = data.slice(start, end);

  tbody.innerHTML = pageRows.map((r, idx) => {
    const number = start + idx + 1;
    return `
      <tr>
        <td>${number}</td>
        <td>${r.ai}</td>
        <td>${r.dt}</td>
        <td>${r.kb}</td>
        <td>${r.ki}</td>
        <td>${r.es}</td>
        <td><b>${r.final}</b></td>
      </tr>
    `;
  }).join("");

  const tp = totalPages();
  pageInfo.textContent = `${currentPage} / ${tp}`;

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === tp;
}

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentPage < totalPages()) {
    currentPage++;
    renderTable();
  }
});

function toCSV(rows) {
  const header = [
    "suniy_intelekt_asoslari",
    "differensial_tenglama",
    "kiberxavfsizlik_asoslari",
    "kompyuter_injenering_kirish",
    "ehtimollar_statistika",
    "final_score"
  ].join(",");

  const body = rows.map(r => [r.ai, r.dt, r.kb, r.ki, r.es, r.final].join(",")).join("\n");
  return header + "\n" + body;
}

downloadBtn.addEventListener("click", () => {
  const csv = toCSV(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "gradeai_dataset.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
});

// Init
renderTable();
// dataset.js - data tayyor bo'lgandan keyin qo'shing:
localStorage.setItem("gradeai_dataset", JSON.stringify(data));