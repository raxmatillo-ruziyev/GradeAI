// dataset.js (GradeAI) - UPDATED
// Fixes:
// - No forced reset back to 20 after user adds more
// - Added Reset UI / Demo(20) / Clear(0)

(function () {
  const STORAGE_KEY = "gradeai_dataset_v1";

  let PAGE_SIZE = 10;
  let currentPage = 1;
  let editingId = null;

  // ---------- Helpers ----------
  const clampScore = (v) => {
    const n = Number(v);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  };

  const calcFinalScore = (ai, dt, kb, ki, es) => {
    const base = 0.22 * ai + 0.20 * dt + 0.20 * kb + 0.20 * ki + 0.18 * es;
    return clampScore(base);
  };

  const makeFIO = (lastName, firstName, patronymic) => {
    return [lastName, firstName, patronymic].filter(Boolean).join(" ").trim();
  };

  // Demo dataset (100)
  function generateSeededData(n = 100) {
    let seed = 77;
    const rand = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

    const sampleNames = [
      ["Karimov", "Jasur", "Akmal o‘g‘li"],
      ["Ruziyev", "Raxmatillo", "Xolmat o‘g‘li"],
      ["Azimjonov", "Shaxzod", "Otabek o‘g‘li"],
      ["Abdunosirov", "Asrorbek", "Farrux o‘g‘li"],
      ["Ziyoratquliyev", "Abbosbek", "Sardor o‘g‘li"],
      ["Nurmatov", "Sardor", "Javlon o‘g‘li"],
      ["Tursunova", "Malika", "Botir qizi"],
      ["Rasulov", "Jamshid", "Anvar o‘g‘li"],
      ["Sodiqova", "Zarnigor", "Rustam qizi"],
      ["Qodirov", "Bekzod", "Odil o‘g‘li"],

      ["Ergashev", "Dilshod", "Baxtiyor o‘g‘li"],
      ["Ismoilov", "Shahzod", "Ulug‘bek o‘g‘li"],
      ["To‘xtayev", "Oybek", "Aziz o‘g‘li"],
      ["Xolmatov", "Doston", "Sherzod o‘g‘li"],
      ["Mamatov", "Javohir", "Said o‘g‘li"],
      ["Yuldashev", "Sanjar", "Akbar o‘g‘li"],
      ["G‘aniev", "Temur", "Bekzod o‘g‘li"],
      ["Raximov", "Azamat", "Karim o‘g‘li"],
      ["Usmonov", "Shukur", "Tursun o‘g‘li"],
      ["Abdullayev", "Sirojiddin", "Valijon o‘g‘li"],

      ["Nazarov", "Firdavs", "Sodiq o‘g‘li"],
      ["Husanov", "Kamol", "Botir o‘g‘li"],
      ["Rahmatov", "Sherzod", "Ilhom o‘g‘li"],
      ["Qosimov", "Jasurbek", "Olim o‘g‘li"],
      ["Polvonov", "Beknur", "Ravshan o‘g‘li"],
      ["Xudoyberdiyev", "Azizbek", "Nodir o‘g‘li"],
      ["Zokirov", "Davron", "Farhod o‘g‘li"],
      ["Sharipov", "Ibrohim", "Yunus o‘g‘li"],
      ["Matkarimov", "Sunnat", "Rahim o‘g‘li"],
      ["Rustamov", "Sarvar", "Jahongir o‘g‘li"],

      ["Bozorov", "Jamol", "Rashid o‘g‘li"],
      ["Olimov", "Shahram", "Xasan o‘g‘li"],
      ["Yo‘ldoshev", "Sardorbek", "Shavkat o‘g‘li"],
      ["Toshpulatov", "Zafar", "Ilhom o‘g‘li"],
      ["Qurbonov", "Oybek", "Javlon o‘g‘li"],
      ["Haqberdiyev", "Islom", "Botir o‘g‘li"],
      ["Abdurahmonov", "Diyor", "Farrux o‘g‘li"],
      ["Xo‘jayev", "Bekmurod", "Nazar o‘g‘li"],
      ["Norbo‘tayev", "Said", "Rustam o‘g‘li"],
      ["Raxmonov", "Ziyod", "Shavkat o‘g‘li"],

      ["Temirov", "Abdulaziz", "Aziz o‘g‘li"],
      ["Yusupov", "Shahzod", "Toshmat o‘g‘li"],
      ["Abdusalomov", "Kamron", "Dilshod o‘g‘li"],
      ["Turg‘unov", "Zokir", "Bahrom o‘g‘li"],
      ["Otaboyev", "Bekzod", "Shavkat o‘g‘li"],
      ["Murodov", "Azamat", "Bekzod o‘g‘li"],
      ["Jumaev", "Sherali", "Qodir o‘g‘li"],
      ["Erkinov", "Bobur", "Yodgor o‘g‘li"],
      ["Halimov", "Akbar", "Zafar o‘g‘li"],
      ["Saidov", "Nodir", "Tursun o‘g‘li"],

      ["Anvarov", "Bektemir", "Karim o‘g‘li"],
      ["Karimova", "Dilnoza", "Shavkat qizi"],
      ["Raximova", "Nigina", "Bahrom qizi"],
      ["Usmonova", "Madina", "Azamat qizi"],
      ["Qosimova", "Shahnoza", "Jasur qizi"],
      ["Islomova", "Zuhra", "Olim qizi"],
      ["Yo‘ldosheva", "Malohat", "Toshmat qizi"],
      ["Abdullayeva", "Sevara", "Dilshod qizi"],
      ["Husanova", "Gulnoza", "Sherzod qizi"],
      ["Rahmatova", "Nigora", "Ilhom qizi"],

      ["Sharipova", "Munira", "Rustam qizi"],
      ["Matkarimova", "Dilafruz", "Bekzod qizi"],
      ["Rustamova", "Aziza", "Jahongir qizi"],
      ["Bozorova", "Sabina", "Rashid qizi"],
      ["Olimova", "Shahlo", "Xasan qizi"],
      ["Toshpulatova", "Zilola", "Ilhom qizi"],
      ["Qurbonova", "Nilufar", "Javlon qizi"],
      ["Haqberdiyeva", "Malika", "Botir qizi"],
      ["Abdurahmonova", "Gulbahor", "Farrux qizi"],
      ["Xo‘jayeva", "Shaxnoza", "Nazar qizi"],

      ["Norbo‘tayeva", "Gulnoza", "Rustam qizi"],
      ["Raxmonova", "Dilrabo", "Shavkat qizi"],
      ["Temirova", "Nigora", "Aziz qizi"],
      ["Yusupova", "Shirin", "Toshmat qizi"],
      ["Abdusalomova", "Zarina", "Dilshod qizi"],
      ["Turg‘unova", "Malohat", "Bahrom qizi"],
      ["Otaboyeva", "Dildora", "Shavkat qizi"],
      ["Murodova", "Madina", "Bekzod qizi"],
      ["Jumaeva", "Sevinch", "Qodir qizi"],
      ["Erkinova", "Gulchehra", "Yodgor qizi"]
    ];

    const rows = [];
    for (let i = 0; i < n; i++) {
      const pick = sampleNames[i % sampleNames.length];

      const lastName = pick[0];
      const firstName = pick[1];
      const patronymic = pick[2];

    
      const base = 50 + rand() * 40;

      const ai = clampScore(base + rand() * 10);
      const dt = clampScore(base + rand() * 8);
      const kb = clampScore(base + rand() * 6);
      const ki = clampScore(base + rand() * 7);
      const es = clampScore(base + rand() * 9);

      rows.push({
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + i),
        lastName,
        firstName,
        patronymic,
        ai,
        dt,
        kb,
        ki,
        es,
        final_score: calcFinalScore(ai, dt, kb, ki, es)
      });
    }
    return rows;
  }

  function loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return generateSeededData(100); // first time only
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return generateSeededData(100);
      return parsed;
    } catch (e) {
      return generateSeededData(100);
    }
  }

  function saveData(rows) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    // optional: for analysis page compatibility
    localStorage.setItem("gradeai_dataset", JSON.stringify(rows));
  }

  let data = loadData();

  // ---------- DOM ----------
  const tbody = document.getElementById("tbody");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pageInfo = document.getElementById("pageInfo");

  const addBtn = document.getElementById("addBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  const resetUiBtn = document.getElementById("resetUiBtn");
  const seedBtn = document.getElementById("seedBtn");
  const clearBtn = document.getElementById("clearBtn");

  const searchInput = document.getElementById("searchInput");
  const pageSizeSelect = document.getElementById("pageSizeSelect");

  const statCount = document.getElementById("statCount");
  const statPageSize = document.getElementById("statPageSize");
  const tableTag = document.getElementById("tableTag");

  // Modal + form
  const modal = document.getElementById("modal");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelBtn");
  const form = document.getElementById("form");
  const modalTitle = document.getElementById("modalTitle");

  const lastNameEl = document.getElementById("lastName");
  const firstNameEl = document.getElementById("firstName");
  const patronymicEl = document.getElementById("patronymic");

  const aiEl = document.getElementById("ai");
  const dtEl = document.getElementById("dt");
  const kbEl = document.getElementById("kb");
  const kiEl = document.getElementById("ki");
  const esEl = document.getElementById("es");

  // ---------- Filtering ----------
  function getFilteredData() {
    const q = (searchInput?.value || "").trim().toLowerCase();
    if (!q) return data;

    return data.filter((r) => {
      const fio = makeFIO(r.lastName, r.firstName, r.patronymic).toLowerCase();
      return fio.includes(q);
    });
  }

  function totalPages(filtered) {
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  }

  function setStats(filtered) {
    if (statCount) statCount.textContent = String(filtered.length);
    if (statPageSize) statPageSize.textContent = String(PAGE_SIZE);
    if (tableTag) tableTag.textContent = `${filtered.length} records`;
  }

  // ---------- Render ----------
  function renderTable() {
    const filtered = getFilteredData();
    const tp = totalPages(filtered);

    if (currentPage > tp) currentPage = tp;
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, filtered.length);
    const pageRows = filtered.slice(start, end);

    setStats(filtered);

    if (!pageRows.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="padding:16px; color: var(--muted);">
            Hozircha ma’lumot yo‘q. <b>+ Talaba qo‘shish</b> tugmasi orqali qo‘shing.
          </td>
        </tr>
      `;
    } else {
      tbody.innerHTML = pageRows.map((r, idx) => {
        const number = start + idx + 1;
        const fio = makeFIO(r.lastName, r.firstName, r.patronymic);

        return `
          <tr>
            <td>${number}</td>
            <td class="fio-cell">
              <div class="fio">${fio}</div>
              <div class="muted small">ID: ${String(r.id).slice(0, 8)}...</div>
            </td>
            <td>${r.ai}</td>
            <td>${r.dt}</td>
            <td>${r.kb}</td>
            <td>${r.ki}</td>
            <td>${r.es}</td>
            <td><b>${r.final_score}</b></td>
            <td class="actions">
              <button class="mini-btn" data-edit="${r.id}">Edit</button>
              <button class="mini-btn danger" data-del="${r.id}">Delete</button>
            </td>
          </tr>
        `;
      }).join("");
    }

    pageInfo.textContent = `${currentPage} / ${tp}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === tp;
  }

  // ---------- Modal ----------
  function openModal(mode) {
    modal.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    modalTitle.textContent = mode === "edit" ? "Talabani tahrirlash" : "Talaba qo‘shish";
    lastNameEl.focus();
  }

  function closeModal() {
    modal.setAttribute("hidden", "");
    document.body.style.overflow = "";
    editingId = null;
    form.reset();
  }

  function fillForm(row) {
    lastNameEl.value = row.lastName || "";
    firstNameEl.value = row.firstName || "";
    patronymicEl.value = row.patronymic || "";

    aiEl.value = row.ai;
    dtEl.value = row.dt;
    kbEl.value = row.kb;
    kiEl.value = row.ki;
    esEl.value = row.es;
  }

  // ---------- CRUD ----------
  function addRow(payload) {
    const id = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now());
    data.unshift({ id, ...payload });
    saveData(data);
  }

  function updateRow(id, payload) {
    data = data.map((r) => (r.id === id ? { ...r, ...payload } : r));
    saveData(data);
  }

  function deleteRow(id) {
    data = data.filter((r) => r.id !== id);
    saveData(data);
  }

  // ---------- CSV ----------
  function toCSV(rows) {
    const header = [
      "last_name", "first_name", "patronymic",
      "ai_asoslari", "differensial_tenglama", "kiberxavfsizlik",
      "kompyuter_injenering", "ehtimollar_statistika", "final_score"
    ].join(",");

    const body = rows.map(r => ([
      JSON.stringify(r.lastName || ""),
      JSON.stringify(r.firstName || ""),
      JSON.stringify(r.patronymic || ""),
      r.ai, r.dt, r.kb, r.ki, r.es, r.final_score
    ].join(","))).join("\n");

    return header + "\n" + body;
  }

  function downloadCSV() {
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
  }

  // ---------- Events ----------
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  nextBtn.addEventListener("click", () => {
    const tp = totalPages(getFilteredData());
    if (currentPage < tp) {
      currentPage++;
      renderTable();
    }
  });

  pageSizeSelect.addEventListener("change", () => {
    PAGE_SIZE = Number(pageSizeSelect.value) || 5;
    currentPage = 1;
    renderTable();
  });

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderTable();
  });

  addBtn.addEventListener("click", () => {
    editingId = null;
    form.reset();
    openModal("add");
  });

  downloadBtn.addEventListener("click", downloadCSV);

  // ✅ Reset UI only (does NOT touch data)
  resetUiBtn.addEventListener("click", () => {
    currentPage = 1;
    searchInput.value = "";
    renderTable();
  });

  // ✅ Seed demo (20) ONLY if user wants it (confirm)
  // ✅ Seed demo (100)
  seedBtn.addEventListener("click", () => {
    const ok = confirm("Demo dataset (100 ta) bilan almashtirilsinmi? Hozirgi ma’lumotlar o‘chadi.");
    if (!ok) return;

    data = generateSeededData(100);
    saveData(data);

    currentPage = 1;
    searchInput.value = "";

    renderTable();
  });
  // ✅ Clear dataset (0) (confirm)
  clearBtn.addEventListener("click", () => {
    const ok = confirm("Datasetni tozalaysizmi? (0 ta bo‘ladi)");
    if (!ok) return;
    data = [];
    saveData(data);
    currentPage = 1;
    searchInput.value = "";
    renderTable();
  });

  closeModalBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  // backdrop close
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t?.dataset?.close === "1") closeModal();
  });

  // table actions
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const editId = btn.getAttribute("data-edit");
    const delId = btn.getAttribute("data-del");

    if (editId) {
      const row = data.find(r => r.id === editId);
      if (!row) return;
      editingId = editId;
      fillForm(row);
      openModal("edit");
    }

    if (delId) {
      const row = data.find(r => r.id === delId);
      const fio = row ? makeFIO(row.lastName, row.firstName, row.patronymic) : "ushbu talaba";
      const ok = confirm(`${fio} ma’lumotini o‘chirmoqchimisiz?`);
      if (!ok) return;
      deleteRow(delId);
      renderTable();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const lastName = (lastNameEl.value || "").trim();
    const firstName = (firstNameEl.value || "").trim();
    const patronymic = (patronymicEl.value || "").trim();

    const ai = clampScore(aiEl.value);
    const dt = clampScore(dtEl.value);
    const kb = clampScore(kbEl.value);
    const ki = clampScore(kiEl.value);
    const es = clampScore(esEl.value);

    const payload = {
      lastName, firstName, patronymic,
      ai, dt, kb, ki, es,
      final_score: calcFinalScore(ai, dt, kb, ki, es)
    };

    if (editingId) updateRow(editingId, payload);
    else addRow(payload);

    closeModal();
    renderTable();
  });

  // ---------- Init ----------
  pageSizeSelect.value = String(PAGE_SIZE);
  saveData(data); // ensure localStorage is consistent
  renderTable();
})();