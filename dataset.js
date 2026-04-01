(function () {
  const STORAGE_KEY = "gradeai_dataset_v1";

  // ==========================================
  // 1. HAQIQIY AI MODELI (Linear Regression)
  // ==========================================
  class GradePredictorAI {
    constructor() {
      // Dastlabki tasodifiy vaznlar
      this.weights = { ai: 0.25, dt: 0.2, kb: 0.2, ki: 0.2, es: 0.15 };
      this.bias = 1.5;
      this.learningRate = 0.00001; 
    }

    // Modelni dataset asosida o'qitish (Gradient Descent)
    train(data, iterations = 500) {
      if (!data || data.length === 0) return;
      
      for (let i = 0; i < iterations; i++) {
        data.forEach(row => {
          const prediction = (row.ai * this.weights.ai) + 
                             (row.dt * this.weights.dt) + 
                             (row.kb * this.weights.kb) + 
                             (row.ki * this.weights.ki) + 
                             (row.es * this.weights.es) + this.bias;

          const error = row.final_score - prediction;

          // Vaznlarni yangilash
          this.weights.ai += error * row.ai * this.learningRate;
          this.weights.dt += error * row.dt * this.learningRate;
          this.weights.kb += error * row.kb * this.learningRate;
          this.weights.ki += error * row.ki * this.learningRate;
          this.weights.es += error * row.es * this.learningRate;
          this.bias += error * this.learningRate;
        });
      }
      console.log("GradeAI o'qitildi. Yangi parametrlar:", this.weights);
    }

    // Bashorat berish
    predict(ai, dt, kb, ki, es) {
      let p = (ai * this.weights.ai) + (dt * this.weights.dt) + 
              (kb * this.weights.kb) + (ki * this.weights.ki) + 
              (es * this.weights.es) + this.bias;
      
      // Realistiklik uchun biroz tebranish (Noise)
      const noise = (Math.random() * 2) - 1; 
      return Math.max(0, Math.min(100, Math.round(p + noise)));
    }
  }

  const AI = new GradePredictorAI();

  // ==========================================
  // 2. DATASET BOSHQARUVI
  // ==========================================
  let PAGE_SIZE = 5;
  let currentPage = 1;
  let editingId = null;
  let data = [];

  function loadData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return generateInitialData(20);
    return JSON.parse(raw);
  }

  function saveData(rows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    // Har safar ma'lumot saqlanganda AI o'qitiladi
    AI.train(rows);
  }

  function generateInitialData(n) {
    const rows = [];
    for (let i = 0; i < n; i++) {
      const base = 60 + Math.random() * 30;
      const row = {
        id: crypto.randomUUID(),
        lastName: "Talaba", firstName: i + 1 + "-son", patronymic: "",
        ai: Math.round(base + Math.random() * 5),
        dt: Math.round(base - Math.random() * 5),
        kb: Math.round(base + Math.random() * 2),
        ki: Math.round(base - Math.random() * 3),
        es: Math.round(base + Math.random() * 4)
      };
      // Dastlabki ma'lumotlar uchun o'rtacha hisoblab turamiz
      row.final_score = Math.round((row.ai + row.dt + row.kb + row.ki + row.es) / 5);
      rows.push(row);
    }
    return rows;
  }

  data = loadData();
  AI.train(data); // Dasturni boshida AIni o'qitib olamiz

  // ---------- DOM Elementlar ----------
  const tbody = document.getElementById("tbody");
  const statCount = document.getElementById("statCount");
  const modal = document.getElementById("modal");
  const form = document.getElementById("form");

  // ---------- Render ----------
  function renderTable() {
    const filtered = data; // Qidiruv logikasi qo'shilsa shu yerga tushadi
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageRows = filtered.slice(start, start + PAGE_SIZE);

    statCount.textContent = filtered.length;
    document.getElementById("tableTag").textContent = `${filtered.length} records`;

    tbody.innerHTML = pageRows.map((r, idx) => `
      <tr>
        <td>${start + idx + 1}</td>
        <td>${r.lastName} ${r.firstName}</td>
        <td>${r.ai}</td>
        <td>${r.dt}</td>
        <td>${r.kb}</td>
        <td>${r.ki}</td>
        <td>${r.es}</td>
        <td style="color:var(--brand)"><b>${r.final_score}</b></td>
        <td>
          <button class="mini-btn" onclick="editRow('${r.id}')">Tahrirlash</button>
          <button class="mini-btn danger" onclick="deleteRow('${r.id}')">O'chirish</button>
        </td>
      </tr>
    `).join("");

    document.getElementById("pageInfo").textContent = `${currentPage} / ${Math.ceil(data.length / PAGE_SIZE)}`;
  }

  // ---------- CRUD Operatsiyalar ----------
  window.editRow = (id) => {
    const row = data.find(r => r.id === id);
    if (!row) return;
    editingId = id;
    document.getElementById("lastName").value = row.lastName;
    document.getElementById("firstName").value = row.firstName;
    document.getElementById("ai").value = row.ai;
    document.getElementById("dt").value = row.dt;
    document.getElementById("kb").value = row.kb;
    document.getElementById("ki").value = row.ki;
    document.getElementById("es").value = row.es;
    modal.hidden = false;
  };

  window.deleteRow = (id) => {
    if(confirm("O'chirilsinmi?")) {
      data = data.filter(r => r.id !== id);
      saveData(data);
      renderTable();
    }
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const vals = {
      ai: Number(document.getElementById("ai").value),
      dt: Number(document.getElementById("dt").value),
      kb: Number(document.getElementById("kb").value),
      ki: Number(document.getElementById("ki").value),
      es: Number(document.getElementById("es").value)
    };

    // BASHORAT QILISH (AI ISHLAMOQDA)
    const final_score = AI.predict(vals.ai, vals.dt, vals.kb, vals.ki, vals.es);

    const payload = {
      ...vals,
      lastName: document.getElementById("lastName").value,
      firstName: document.getElementById("firstName").value,
      patronymic: document.getElementById("patronymic").value,
      final_score: final_score
    };

    if (editingId) {
      data = data.map(r => r.id === editingId ? { ...r, ...payload } : r);
    } else {
      payload.id = crypto.randomUUID();
      data.unshift(payload);
    }

    saveData(data);
    modal.hidden = true;
    renderTable();
  };

  // Tugmalar
  document.getElementById("addBtn").onclick = () => { editingId = null; form.reset(); modal.hidden = false; };
  document.getElementById("closeModal").onclick = () => modal.hidden = true;
  document.getElementById("seedBtn").onclick = () => { data = generateInitialData(100); saveData(data); renderTable(); };
  document.getElementById("clearBtn").onclick = () => { data = []; saveData(data); renderTable(); };
  
  // Pagination
  document.getElementById("prevBtn").onclick = () => { if(currentPage > 1) { currentPage--; renderTable(); } };
  document.getElementById("nextBtn").onclick = () => { if(currentPage < Math.ceil(data.length/PAGE_SIZE)) { currentPage++; renderTable(); } };

  // Theme Toggle
  document.getElementById("themeToggle").onclick = () => {
    const root = document.documentElement;
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", root.dataset.theme);
  };

  // Init
  window.onload = () => {
    setTimeout(() => document.getElementById("page-loader").classList.add("loader-hidden"), 800);
    renderTable();
  };

})();