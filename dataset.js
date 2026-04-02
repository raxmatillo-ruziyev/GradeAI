
  window.onload = () => {
    setTimeout(() => document.getElementById("page-loader").classList.add("loader-hidden"), 800);
    renderTable();
  };


(function () {
  const STORAGE_KEY = "gradeai_dataset_v1";

  // ==========================================
  // 1. DATASET VA AI KONFIGURATSIYASI
  // ==========================================
  const uzbekNames = {
    firstNames: ["Raxmatillo", "Shaxzod", "Asrorbek", "Abbosbek", "Sardor", "Mirfayz", "Javoxir", "Qudrat", "Dilmurod", "Akrom", "Baxodir", "Doston", "Elbek", "Farrux", "Gairat", "Hamid", "Ilxom", "Jalol", "Karim", "Mirjon", "Nasrulla", "Oybek", "Qayyum", "Rahmon", "Sanjar", "Toir", "Ulug'bek", "Vali", "Zafar", "Aziz"],
    lastNames: ["Ruziyev", "Azimjonov", "Abdunosirov", "Ziyoratquliyev", "Karimov", "Toshmatov", "Abdulloyev", "Mirxolov", "Ortiqov", "Qo'chqarov", "Shodmonov", "Turaev", "Uralov", "Valiyev", "Xalilov", "Yusupov", "Zaynalov", "Boboyev", "Choriyev", "Daminov", "Esonov", "G'aniyev", "Haydarov", "Ibrohimov", "Jalolov"],
    patronymics: ["Rustamali o'g'li", "Majidali o'g'li", "Abdumalikov o'g'li", "Hamidali o'g'li", "Rashidali o'g'li", "Sultonali o'g'li", "Alimali o'g'li", "Qudratali o'g'li", "Mirhadiali o'g'li", "Bobirali o'g'li", "Nazarali o'g'li", "Ismoili o'g'li"]
  };

  class GradePredictorAI {
    constructor() {
      this.weights = { ai: 0.22, dt: 0.2, kb: 0.2, ki: 0.2, es: 0.18 };
      this.bias = 0.5;
      this.learningRate = 0.00001;
    }

    train(data, iterations = 500) {
      if (!data || data.length === 0) return;
      for (let i = 0; i < iterations; i++) {
        data.forEach(row => {
          const pred = (row.ai * this.weights.ai) + (row.dt * this.weights.dt) + 
                       (row.kb * this.weights.kb) + (row.ki * this.weights.ki) + 
                       (row.es * this.weights.es) + this.bias;
          const error = row.final_score - pred;
          this.weights.ai += error * row.ai * this.learningRate;
          this.weights.dt += error * row.dt * this.learningRate;
          this.weights.kb += error * row.kb * this.learningRate;
          this.weights.ki += error * row.ki * this.learningRate;
          this.weights.es += error * row.es * this.learningRate;
          this.bias += error * this.learningRate;
        });
      }
    }

    predict(ai, dt, kb, ki, es) {
      const p = (ai * this.weights.ai) + (dt * this.weights.dt) + 
                (kb * this.weights.kb) + (ki * this.weights.ki) + 
                (es * this.weights.es) + this.bias;
      return Math.max(0, Math.min(100, Math.round(p + (Math.random() * 2 - 1))));
    }
  }

  const AI = new GradePredictorAI();
  let data = [];
  let currentPage = 1;
  const PAGE_SIZE = 10;
  let editingId = null;

  // DOM
  const tbody = document.getElementById("tbody");
  const modal = document.getElementById("modal");
  const form = document.getElementById("form");
  const loader = document.getElementById("page-loader");

  // ==========================================
  // 2. FUNKSIYALAR
  // ==========================================

  function showLoader() { loader?.classList.remove("loader-hidden"); }
  function hideLoader() { loader?.classList.add("loader-hidden"); }

  function generateDataset(count) {
    const records = [];
    for (let i = 0; i < count; i++) {
      const fName = uzbekNames.firstNames[Math.floor(Math.random() * uzbekNames.firstNames.length)];
      const lName = uzbekNames.lastNames[Math.floor(Math.random() * uzbekNames.lastNames.length)];
      const patr = uzbekNames.patronymics[Math.floor(Math.random() * uzbekNames.patronymics.length)];
      const base = 55 + Math.random() * 40;
      const r = {
        id: crypto.randomUUID(),
        lastName: lName, firstName: fName, patronymic: patr,
        ai: Math.round(base + (Math.random() - 0.5) * 10),
        dt: Math.round(base + (Math.random() - 0.5) * 10),
        kb: Math.round(base + (Math.random() - 0.5) * 10),
        ki: Math.round(base + (Math.random() - 0.5) * 10),
        es: Math.round(base + (Math.random() - 0.5) * 10),
      };
      r.final_score = Math.round(r.ai*0.22 + r.dt*0.2 + r.kb*0.2 + r.ki*0.2 + r.es*0.18);
      records.push(r);
    }
    return records;
  }

  function renderTable() {
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageRows = data.slice(start, start + PAGE_SIZE);
    document.getElementById("statCount").textContent = data.length;
    
    tbody.innerHTML = pageRows.map((r, idx) => `
      <tr>
        <td>${start + idx + 1}</td>
        <td>${r.lastName} ${r.firstName}</td>
        <td>${r.ai}</td><td>${r.dt}</td><td>${r.kb}</td><td>${r.ki}</td><td>${r.es}</td>
        <td style="color:var(--brand)"><b>${r.final_score}</b></td>
        <td>
          <button class="mini-btn" onclick="editRow('${r.id}')">Tahrir</button>
          <button class="mini-btn danger" onclick="deleteRow('${r.id}')">O'chirish</button>
        </td>
      </tr>
    `).join("");
    document.getElementById("pageInfo").textContent = `${currentPage} / ${Math.ceil(data.length / PAGE_SIZE) || 1}`;
  }

  function saveData(rows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    AI.train(rows, 100);
  }

  // ==========================================
  // 3. INIT VA HODISALAR
  // ==========================================

  window.onload = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    data = raw ? JSON.parse(raw) : generateDataset(20);
    AI.train(data);
    renderTable();
    setTimeout(hideLoader, 2800); // Sahifa tayyor bo'lgach loader yopiladi
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const scores = {
      ai: Number(document.getElementById("ai").value),
      dt: Number(document.getElementById("dt").value),
      kb: Number(document.getElementById("kb").value),
      ki: Number(document.getElementById("ki").value),
      es: Number(document.getElementById("es").value)
    };
    const final = AI.predict(scores.ai, scores.dt, scores.kb, scores.ki, scores.es);
    const payload = {
      ...scores,
      lastName: document.getElementById("lastName").value,
      firstName: document.getElementById("firstName").value,
      patronymic: document.getElementById("patronymic").value,
      final_score: final,
      id: editingId || crypto.randomUUID()
    };

    if (editingId) data = data.map(r => r.id === editingId ? payload : r);
    else data.unshift(payload);

    saveData(data);
    modal.hidden = true;
    renderTable();
  };

  // CRUD va Navigatsiya
  window.editRow = (id) => {
    const r = data.find(x => x.id === id);
    if (!r) return;
    editingId = id;
    ["lastName", "firstName", "patronymic", "ai", "dt", "kb", "ki", "es"].forEach(k => document.getElementById(k).value = r[k]);
    modal.hidden = false;
  };

  window.deleteRow = (id) => { if(confirm("O'chirilsinmi?")) { data = data.filter(x => x.id !== id); saveData(data); renderTable(); }};

  document.getElementById("addBtn").onclick = () => { editingId = null; form.reset(); modal.hidden = false; };
  document.getElementById("closeModal").onclick = () => modal.hidden = true;
  document.getElementById("seedBtn").onclick = () => { showLoader(); setTimeout(() => { data = generateDataset(100); saveData(data); renderTable(); hideLoader(); }, 500); };
  document.getElementById("clearBtn").onclick = () => { data = []; saveData(data); renderTable(); };
  document.getElementById("prevBtn").onclick = () => { if(currentPage > 1) { currentPage--; renderTable(); }};
  document.getElementById("nextBtn").onclick = () => { if(currentPage < Math.ceil(data.length/PAGE_SIZE)) { currentPage++; renderTable(); }};

})();