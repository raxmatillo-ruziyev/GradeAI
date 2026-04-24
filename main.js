(() => {
  const THEME_KEY = "theme";
  const DATASET_KEY = "gradeai_dataset_v2";
  const MODEL_KEY = "gradeai_model_v2";
  const METRICS_KEY = "gradeai_model_metrics_v2";
  const FEATURE_KEYS = ["ai", "dt", "kb", "ki", "es"];

  const MEMBER_DATA = {
    RR: {
      name: "Ruziyev Raxmatillo",
      role: "Lead Developer / AI Engineer",
      tasks: [
        "Loyiha arxitekturasini yaratish va barcha sahifalarni yagona tizimga birlashtirish",
        "Datasetni yig‘ish, tozalash va final_score logikasini ishlab chiqish",
        "Modelni o‘qitish, metrikalarni hisoblash va sahifalar orasida saqlash",
        "Veb interfeysni AI va analitika bilan integratsiya qilish"
      ]
    },
    AS: {
      name: "Azimjonov Shaxzod",
      role: "Data Analysis Support",
      tasks: [
        "Korrelyatsiya va statistik bog‘liqliklarni aniqlash",
        "Feature lar final_score ga ta’sirini tahlil qilish",
        "Vizual natijalarni sharhlash va hisobot tayyorlash"
      ]
    },
    AA: {
      name: "Abdunosirov Asrorbek",
      role: "Model Evaluation Support",
      tasks: [
        "Model sifatini MSE, MAE va R² orqali baholash",
        "Bashorat xatoliklarini kamaytirish bo‘yicha tahlil qilish",
        "Train/test natijalarini tekshirish va solishtirish"
      ]
    },
    ZA: {
      name: "Ziyoratquliyev Abbosbek",
      role: "UI Design Support / Documentation",
      tasks: [
        "UI/UX dizaynni soddalashtirish va yaxshilash",
        "Loyiha hujjatlarini tartibli tayyorlash",
        "Interfeys elementlari orasida yagona vizual uslubni saqlash"
      ]
    }
  };

  const NAME_BANK = {
    firstNames: ["Raxmatillo", "Shaxzod", "Asrorbek", "Abbosbek", "Sardor", "Mirfayz", "Javohir", "Qudrat", "Dilmurod", "Akrom", "Bekzod", "Doston", "Elbek", "Farrux", "G'ayrat", "Hamid", "Ilhom", "Jalol", "Karim", "Mirjon", "Nasrulla", "Oybek", "Qayyum", "Rahmon", "Sanjar", "Toir", "Ulug'bek", "Vali", "Zafar", "Aziz"],
    lastNames: ["Ruziyev", "Azimjonov", "Abdunosirov", "Ziyoratquliyev", "Karimov", "Toshmatov", "Abdulloyev", "Mirxolov", "Ortiqov", "Qo'chqarov", "Shodmonov", "Turaev", "Uralov", "Valiyev", "Xalilov", "Yusupov", "Zaynalov", "Boboyev", "Choriyev", "Daminov", "Esonov", "G'aniyev", "Haydarov", "Ibrohimov", "Jalolov"],
    patronymics: ["Rustamali o'g'li", "Majidali o'g'li", "Abdumalik o'g'li", "Hamidali o'g'li", "Rashidali o'g'li", "Sultonali o'g'li", "Alimali o'g'li", "Qudratali o'g'li", "Mirhadi o'g'li", "Bobirali o'g'li", "Nazarali o'g'li", "Ismoil o'g'li"]
  };

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const page = document.body.dataset.page || "";

  const datasetState = {
    currentPage: 1,
    pageSize: 10,
    query: "",
    editingId: null
  };

  function safeJSONParse(raw, fallback) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function clampScore(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function fullName(row) {
    return [row.lastName, row.firstName, row.patronymic].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  }

  function estimateFinalScore(scores) {
    const ai = clampScore(scores.ai);
    const dt = clampScore(scores.dt);
    const kb = clampScore(scores.kb);
    const ki = clampScore(scores.ki);
    const es = clampScore(scores.es);
    const minVal = Math.min(ai, dt, kb, ki, es);
    const stabilityBonus = minVal >= 70 ? 2 : minVal >= 60 ? 1 : 0;
    const value = ai * 0.23 + dt * 0.20 + kb * 0.19 + ki * 0.20 + es * 0.18 + stabilityBonus;
    return clampScore(value);
  }

  function createRandomRecord() {
    const base = 56 + Math.random() * 34;
    const ai = clampScore(base + (Math.random() - 0.5) * 14);
    const dt = clampScore(base + (Math.random() - 0.5) * 14);
    const kb = clampScore(base + (Math.random() - 0.5) * 14);
    const ki = clampScore(base + (Math.random() - 0.5) * 14);
    const es = clampScore(base + (Math.random() - 0.5) * 14);

    return {
      id: uid(),
      lastName: randomFrom(NAME_BANK.lastNames),
      firstName: randomFrom(NAME_BANK.firstNames),
      patronymic: randomFrom(NAME_BANK.patronymics),
      ai,
      dt,
      kb,
      ki,
      es,
      final_score: estimateFinalScore({ ai, dt, kb, ki, es })
    };
  }

  function generateDataset(count = 24) {
    return Array.from({ length: count }, () => createRandomRecord());
  }

  function getDatasetRaw() {
    const raw = localStorage.getItem(DATASET_KEY);
    if (raw === null) {
      const starter = generateDataset(24);
      localStorage.setItem(DATASET_KEY, JSON.stringify(starter));
      return starter;
    }
    const parsed = safeJSONParse(raw, []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function getDataset() {
    return getDatasetRaw().map((row) => ({
      id: row.id || uid(),
      lastName: String(row.lastName || "").trim(),
      firstName: String(row.firstName || "").trim(),
      patronymic: String(row.patronymic || "").trim(),
      ai: clampScore(row.ai),
      dt: clampScore(row.dt),
      kb: clampScore(row.kb),
      ki: clampScore(row.ki),
      es: clampScore(row.es),
      final_score: clampScore(row.final_score ?? estimateFinalScore(row))
    }));
  }

  function saveDataset(rows) {
    localStorage.setItem(DATASET_KEY, JSON.stringify(rows));
  }

  function getSavedModel() {
    return safeJSONParse(localStorage.getItem(MODEL_KEY), null);
  }

  function saveModel(model) {
    localStorage.setItem(MODEL_KEY, JSON.stringify(model));
  }

  function getSavedMetrics() {
    return safeJSONParse(localStorage.getItem(METRICS_KEY), null);
  }

  function saveMetrics(metrics) {
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  }

  function showLoader() {
    $("page-loader")?.classList.remove("loader-hidden");
  }

  function hideLoader(delay = 500) {
    window.setTimeout(() => {
      $("page-loader")?.classList.add("loader-hidden");
    }, delay);
  }

  function initTheme() {
    const root = document.documentElement;
    const fade = $("themeFade");
    const btn = $("themeToggle");

    btn?.addEventListener("click", () => {
      fade?.classList.add("is-on");
      window.setTimeout(() => {
        const current = root.dataset.theme === "light" ? "light" : "dark";
        const next = current === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        localStorage.setItem(THEME_KEY, next);
        window.dispatchEvent(new Event("gradeai-theme-change"));
        window.setTimeout(() => fade?.classList.remove("is-on"), 150);
      }, 90);
    });
  }

  function initNav() {
    const burger = $("burger");
    const mobileNav = $("mobileNav");
    const setExpanded = (value) => burger?.setAttribute("aria-expanded", value ? "true" : "false");

    burger?.addEventListener("click", () => {
      if (!mobileNav) return;
      const hidden = mobileNav.hasAttribute("hidden");
      if (hidden) {
        mobileNav.removeAttribute("hidden");
        setExpanded(true);
      } else {
        mobileNav.setAttribute("hidden", "");
        setExpanded(false);
      }
    });

    mobileNav?.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        mobileNav.setAttribute("hidden", "");
        setExpanded(false);
      }
    });

    $$("a.navlink, a.btn[data-nav]").forEach((link) => {
      link.addEventListener("click", () => showLoader());
    });
  }

  function initLoader() {
    window.addEventListener("load", () => hideLoader(650));
  }

  function closeOnEscape(callback) {
    const handler = (e) => {
      if (e.key === "Escape") callback();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }

  function initConceptPage() {
    const modal = $("memberModal");
    if (!modal) return;

    const avatar = $("memberAvatar");
    const name = $("memberName");
    const role = $("memberRole");
    const list = $("memberTasks");
    const closeBtn = $("memberModalClose");

    const closeModal = () => {
      modal.setAttribute("hidden", "");
      document.body.style.overflow = "";
    };

    const openModal = (id) => {
      const data = MEMBER_DATA[id];
      if (!data) return;

      avatar.textContent = id;
      name.textContent = data.name;
      role.textContent = data.role;
      list.innerHTML = data.tasks.map((task) => `<li>${task}</li>`).join("");

      modal.removeAttribute("hidden");
      document.body.style.overflow = "hidden";
    };

    $$("[data-member-id]").forEach((btn) => {
      btn.addEventListener("click", () => openModal(btn.dataset.memberId));
    });

    closeBtn?.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-close-modal")) closeModal();
    });
    closeOnEscape(() => !modal.hasAttribute("hidden") && closeModal());
  }

  function initDatasetPage() {
    const tbody = $("datasetTableBody");
    if (!tbody) return;

    const modal = $("studentModal");
    const form = $("studentForm");
    const searchInput = $("searchInput");
    const pageSizeSelect = $("pageSizeSelect");
    const pageInfo = $("pageInfo");
    const totalTag = $("tableTag");
    const totalCount = $("statCount");
    const currentSize = $("statPageSize");
    const prevBtn = $("prevBtn");
    const nextBtn = $("nextBtn");
    const modalTitle = $("studentModalTitle");
    const modalSub = $("studentModalSub");
    const saveBtn = $("saveStudentBtn");
    const addBtn = $("addBtn");
    const seedBtn = $("seedBtn");
    const clearBtn = $("clearBtn");
    const downloadBtn = $("downloadBtn");
    const closeBtn = $("studentModalClose");
    const cancelBtn = $("studentCancelBtn");

    const fields = {
      lastName: $("lastName"),
      firstName: $("firstName"),
      patronymic: $("patronymic"),
      ai: $("ai"),
      dt: $("dt"),
      kb: $("kb"),
      ki: $("ki"),
      es: $("es")
    };

    function getAllRows() {
      return getDataset();
    }

    function openModal(mode, row = null) {
      datasetState.editingId = row?.id || null;
      modalTitle.textContent = mode === "edit" ? "Talabani tahrirlash" : "Talaba qo‘shish";
      modalSub.textContent = mode === "edit" ? "Mavjud ma’lumotlarni yangilang" : "Yangi talaba ma’lumotini kiriting";
      saveBtn.textContent = mode === "edit" ? "Yangilash" : "Saqlash";
      form.reset();

      if (row) {
        Object.entries(fields).forEach(([key, el]) => {
          if (el) el.value = row[key] ?? "";
        });
      }

      modal.removeAttribute("hidden");
      document.body.style.overflow = "hidden";
      fields.lastName?.focus();
    }

    function closeModal() {
      modal.setAttribute("hidden", "");
      document.body.style.overflow = "";
      datasetState.editingId = null;
      form.reset();
    }

    function getFilteredRows() {
      const query = datasetState.query.trim().toLowerCase();
      const rows = getAllRows();
      if (!query) return rows;
      return rows.filter((row) => fullName(row).toLowerCase().includes(query));
    }

    function renderTable() {
      const rows = getFilteredRows();
      const pageSize = datasetState.pageSize;
      const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
      if (datasetState.currentPage > totalPages) datasetState.currentPage = totalPages;

      const start = (datasetState.currentPage - 1) * pageSize;
      const pageRows = rows.slice(start, start + pageSize);

      totalCount.textContent = String(getAllRows().length);
      currentSize.textContent = String(pageSize);
      totalTag.textContent = `${rows.length} records`;
      pageInfo.textContent = `${datasetState.currentPage} / ${totalPages}`;

      prevBtn.disabled = datasetState.currentPage <= 1;
      nextBtn.disabled = datasetState.currentPage >= totalPages;

      if (!pageRows.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9">
              <div class="empty-state">Mos ma’lumot topilmadi.</div>
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = pageRows.map((row, index) => `
        <tr>
          <td>${start + index + 1}</td>
          <td>
            <strong>${fullName(row)}</strong>
          </td>
          <td>${row.ai}</td>
          <td>${row.dt}</td>
          <td>${row.kb}</td>
          <td>${row.ki}</td>
          <td>${row.es}</td>
          <td><strong class="primary">${row.final_score}</strong></td>
          <td>
            <div class="link-row">
              <button class="mini-btn" type="button" data-action="edit" data-id="${row.id}">Tahrir</button>
              <button class="mini-btn btn-danger" type="button" data-action="delete" data-id="${row.id}">O‘chirish</button>
            </div>
          </td>
        </tr>
      `).join("");
    }

    function handleSave(e) {
      e.preventDefault();

      const payload = {
        id: datasetState.editingId || uid(),
        lastName: fields.lastName.value.trim(),
        firstName: fields.firstName.value.trim(),
        patronymic: fields.patronymic.value.trim(),
        ai: clampScore(fields.ai.value),
        dt: clampScore(fields.dt.value),
        kb: clampScore(fields.kb.value),
        ki: clampScore(fields.ki.value),
        es: clampScore(fields.es.value)
      };

      if (!payload.lastName || !payload.firstName) {
        alert("Familiya va ism kiritilishi kerak.");
        return;
      }

      payload.final_score = estimateFinalScore(payload);

      const rows = getAllRows();
      let nextRows;
      if (datasetState.editingId) {
        nextRows = rows.map((row) => row.id === datasetState.editingId ? payload : row);
      } else {
        nextRows = [payload, ...rows];
        datasetState.currentPage = 1;
      }

      saveDataset(nextRows);
      closeModal();
      renderTable();
    }

    function downloadCSV() {
      const rows = getAllRows();
      const header = ["id", "lastName", "firstName", "patronymic", "ai", "dt", "kb", "ki", "es", "final_score"];
      const csv = [
        header.join(","),
        ...rows.map((row) => header.map((key) => `"${String(row[key] ?? "").replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gradeai_dataset.csv";
      a.click();
      URL.revokeObjectURL(url);
    }

    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const id = btn.dataset.id;
      const rows = getAllRows();
      const row = rows.find((item) => item.id === id);
      if (!row) return;

      if (btn.dataset.action === "edit") {
        openModal("edit", row);
      }

      if (btn.dataset.action === "delete") {
        const ok = window.confirm(`${fullName(row)} ma’lumotini o‘chirishni xohlaysizmi?`);
        if (!ok) return;
        saveDataset(rows.filter((item) => item.id !== id));
        renderTable();
      }
    });

    addBtn?.addEventListener("click", () => openModal("create"));
    closeBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);
    modal?.addEventListener("click", (e) => {
      if (e.target.hasAttribute("data-close-modal")) closeModal();
    });

    form?.addEventListener("submit", handleSave);

    searchInput?.addEventListener("input", () => {
      datasetState.query = searchInput.value;
      datasetState.currentPage = 1;
      renderTable();
    });

    pageSizeSelect?.addEventListener("change", () => {
      datasetState.pageSize = Number(pageSizeSelect.value) || 10;
      datasetState.currentPage = 1;
      renderTable();
    });

    prevBtn?.addEventListener("click", () => {
      if (datasetState.currentPage > 1) {
        datasetState.currentPage -= 1;
        renderTable();
      }
    });

    nextBtn?.addEventListener("click", () => {
      const totalPages = Math.max(1, Math.ceil(getFilteredRows().length / datasetState.pageSize));
      if (datasetState.currentPage < totalPages) {
        datasetState.currentPage += 1;
        renderTable();
      }
    });

    seedBtn?.addEventListener("click", () => {
      showLoader();
      window.setTimeout(() => {
        saveDataset(generateDataset(100));
        datasetState.currentPage = 1;
        datasetState.query = "";
        if (searchInput) searchInput.value = "";
        renderTable();
        hideLoader(200);
      }, 250);
    });

    clearBtn?.addEventListener("click", () => {
      const ok = window.confirm("Datasetni tozalashni xohlaysizmi?");
      if (!ok) return;
      saveDataset([]);
      localStorage.removeItem(MODEL_KEY);
      localStorage.removeItem(METRICS_KEY);
      datasetState.currentPage = 1;
      renderTable();
    });

    downloadBtn?.addEventListener("click", downloadCSV);

    const initialSize = Number(pageSizeSelect?.value || 10);
    datasetState.pageSize = initialSize;
    renderTable();
    closeOnEscape(() => !modal.hasAttribute("hidden") && closeModal());
  }

  function trainLinearModel(dataset, onProgress) {
    return new Promise(async (resolve) => {
      const rows = [...dataset];
      if (!rows.length) {
        resolve(null);
        return;
      }

      rows.sort(() => Math.random() - 0.5);
      const trainSize = rows.length > 4 ? Math.max(3, Math.floor(rows.length * 0.8)) : rows.length;
      const trainRows = rows.slice(0, trainSize);
      const testRows = rows.slice(trainSize).length ? rows.slice(trainSize) : rows.slice(0, Math.min(rows.length, 3));

      let weights = [0, 0, 0, 0, 0];
      let bias = 0;
      const lr = 0.35;
      const epochs = 240;

      for (let epoch = 1; epoch <= epochs; epoch++) {
        const grads = [0, 0, 0, 0, 0];
        let biasGrad = 0;

        trainRows.forEach((row) => {
          const xs = FEATURE_KEYS.map((key) => clampScore(row[key]) / 100);
          const y = clampScore(row.final_score);
          const pred = bias + xs.reduce((sum, val, idx) => sum + val * weights[idx], 0);
          const error = pred - y;

          xs.forEach((val, idx) => {
            grads[idx] += error * val;
          });
          biasGrad += error;
        });

        weights = weights.map((weight, idx) => weight - (lr * grads[idx]) / trainRows.length);
        bias -= (lr * biasGrad) / trainRows.length;

        if (epoch % 8 === 0 || epoch === epochs) {
          onProgress?.(Math.round((epoch / epochs) * 100));
          await new Promise((r) => setTimeout(r, 12));
        }
      }

      const predict = (input) => {
        const xs = FEATURE_KEYS.map((key) => clampScore(input[key]) / 100);
        const raw = bias + xs.reduce((sum, val, idx) => sum + val * weights[idx], 0);
        return Math.max(0, Math.min(100, raw));
      };

      const metrics = calculateMetrics(testRows, predict);
      resolve({
        weights,
        bias,
        trainedAt: new Date().toLocaleString(),
        datasetCount: dataset.length,
        metrics,
        predict
      });
    });
  }

  function calculateMetrics(rows, predictFn) {
    if (!rows.length) {
      return { mse: 0, mae: 0, r2: 0 };
    }

    const actual = rows.map((row) => clampScore(row.final_score));
    const predicted = rows.map((row) => predictFn(row));
    const meanActual = actual.reduce((sum, value) => sum + value, 0) / actual.length;

    let se = 0;
    let ae = 0;
    let sst = 0;

    actual.forEach((value, idx) => {
      const error = value - predicted[idx];
      se += error * error;
      ae += Math.abs(error);
      const diff = value - meanActual;
      sst += diff * diff;
    });

    const mse = se / actual.length;
    const mae = ae / actual.length;
    const r2 = sst === 0 ? 1 : 1 - (se / sst);

    return {
      mse,
      mae,
      r2
    };
  }

  function predictWithSavedModel(input) {
    const saved = getSavedModel();
    if (!saved || !Array.isArray(saved.weights)) return null;
    const xs = FEATURE_KEYS.map((key) => clampScore(input[key]) / 100);
    const raw = Number(saved.bias || 0) + xs.reduce((sum, val, idx) => sum + val * Number(saved.weights[idx] || 0), 0);
    return Math.max(0, Math.min(100, raw));
  }

  function renderSavedMetrics() {
    const metrics = getSavedMetrics();
    if (!metrics) return;

    $("mseValue") && ($("mseValue").textContent = Number(metrics.mse).toFixed(2));
    $("maeValue") && ($("maeValue").textContent = Number(metrics.mae).toFixed(2));
    $("r2Value") && ($("r2Value").textContent = Number(metrics.r2).toFixed(3));
    $("trainedAtText") && ($("trainedAtText").textContent = metrics.trainedAt || "-");
    $("splitInfo") && ($("splitInfo").textContent = `Dataset: ${metrics.datasetCount || 0} ta qator`);
  }

  function initModelPage() {
    if (!$("trainBtn")) return;

    const statusPill = $("statusPill");
    const trainStatus = $("trainStatus");
    const loaderContainer = $("loaderContainer");
    const progressBar = $("progressBar");
    const progressPercent = $("progressPercent");
    const dsMeta = $("dsMeta");
    const predictBtn = $("predictBtn");
    const findStudentBtn = $("findStudentBtn");
    const useDemoBtn = $("useDemoBtn");
    const resultBox = $("predValue");
    const searchInput = $("studentSearch");

    const inputs = {
      ai: $("inAI"),
      dt: $("inDT"),
      kb: $("inKB"),
      ki: $("inKI"),
      es: $("inES")
    };

    function setStatus(text, type = "") {
      statusPill.textContent = text;
      statusPill.className = `pill ${type}`.trim();
    }

    function updateDatasetMeta() {
      const data = getDataset();
      dsMeta.textContent = `${data.length} qator`;
      trainStatus.textContent = data.length
        ? `${data.length} ta ma’lumot aniqlandi. Modelni o‘qitish mumkin.`
        : "Dataset bo‘sh. Avval ma’lumot yarating.";
    }

    function toggleProgress(show) {
      if (show) {
        loaderContainer.removeAttribute("hidden");
        progressBar.style.width = "0%";
        progressPercent.textContent = "0%";
      } else {
        window.setTimeout(() => loaderContainer.setAttribute("hidden", ""), 200);
      }
    }

    function renderPredictResult(value) {
      resultBox.textContent = Number(value).toFixed(1);
    }

    function resetPredictResult() {
      resultBox.textContent = "—";
    }

    renderSavedMetrics();
    updateDatasetMeta();
    resetPredictResult();

    if (getSavedModel()) {
      setStatus("Model tayyor", "ok");
      trainStatus.textContent = "Oldin o‘qitilgan model topildi. Bashorat qilish mumkin.";
    }

    $("trainBtn").addEventListener("click", async () => {
      const data = getDataset();
      if (data.length < 5) {
        setStatus("Ma’lumot kam", "warn");
        trainStatus.textContent = "Kamida 5 ta yozuv kerak.";
        return;
      }

      toggleProgress(true);
      setStatus("O‘qitilmoqda", "busy");
      trainStatus.textContent = "Model train qilinyapti...";

      const trained = await trainLinearModel(data, (percent) => {
        progressBar.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
      });

      toggleProgress(false);

      if (!trained) {
        setStatus("Xatolik", "warn");
        trainStatus.textContent = "Model train bo‘lmadi.";
        return;
      }

      saveModel({
        weights: trained.weights,
        bias: trained.bias,
        trainedAt: trained.trainedAt,
        datasetCount: trained.datasetCount
      });

      saveMetrics({
        mse: trained.metrics.mse,
        mae: trained.metrics.mae,
        r2: trained.metrics.r2,
        trainedAt: trained.trainedAt,
        datasetCount: trained.datasetCount
      });

      renderSavedMetrics();
      setStatus("Tayyor", "ok");
      trainStatus.textContent = "Model muvaffaqiyatli o‘qitildi.";
    });

    predictBtn.addEventListener("click", () => {
      const input = {
        ai: inputs.ai.value,
        dt: inputs.dt.value,
        kb: inputs.kb.value,
        ki: inputs.ki.value,
        es: inputs.es.value
      };

      const predicted = predictWithSavedModel(input);
      if (predicted === null) {
        alert("Avval modelni o‘qiting.");
        return;
      }
      renderPredictResult(predicted);
    });

    findStudentBtn.addEventListener("click", () => {
      const query = searchInput.value.trim().toLowerCase();
      if (!query) return;

      const row = getDataset().find((item) => fullName(item).toLowerCase().includes(query));
      if (!row) {
        alert("Bunday talaba topilmadi.");
        return;
      }

      FEATURE_KEYS.forEach((key) => {
        inputs[key].value = row[key];
      });

      resetPredictResult();
      setStatus("Talaba topildi", "ok");
      trainStatus.textContent = `${fullName(row)} ma’lumoti predict bo‘limiga yuklandi. Endi “Bashorat qilish” tugmasini bosing.`;
    });

    useDemoBtn.addEventListener("click", () => {
      saveDataset(generateDataset(30));
      localStorage.removeItem(MODEL_KEY);
      localStorage.removeItem(METRICS_KEY);
      updateDatasetMeta();
      resetPredictResult();
      $("mseValue").textContent = "-";
      $("maeValue").textContent = "-";
      $("r2Value").textContent = "-";
      $("trainedAtText").textContent = "-";
      $("splitInfo").textContent = "Ma'lumotlar: -";
      setStatus("Demo data", "warn");
      trainStatus.textContent = "Demo dataset yaratildi. Endi modelni qayta o‘qiting.";
    });
  }

  function initAnalysisPage() {
    if (!$("analysisFeature")) return;

    const featureSelect = $("analysisFeature");
    const redrawBtn = $("redrawBtn");

    function mean(arr) {
      return arr.reduce((sum, value) => sum + value, 0) / Math.max(1, arr.length);
    }

    function pearson(x, y) {
      const n = Math.min(x.length, y.length);
      if (n < 2) return 0;
      const mx = mean(x);
      const my = mean(y);

      let num = 0;
      let dx = 0;
      let dy = 0;

      for (let i = 0; i < n; i++) {
        const a = x[i] - mx;
        const b = y[i] - my;
        num += a * b;
        dx += a * a;
        dy += b * b;
      }

      const den = Math.sqrt(dx * dy);
      return den === 0 ? 0 : num / den;
    }

    function linearRegression(x, y) {
      const n = Math.min(x.length, y.length);
      if (n < 2) return { a: 0, b: 0 };
      const mx = mean(x);
      const my = mean(y);
      let num = 0;
      let den = 0;
      for (let i = 0; i < n; i++) {
        const dx = x[i] - mx;
        num += dx * (y[i] - my);
        den += dx * dx;
      }
      const b = den === 0 ? 0 : num / den;
      const a = my - b * mx;
      return { a, b };
    }

    function theme() {
      const styles = getComputedStyle(document.documentElement);
      return {
        card: styles.getPropertyValue("--surface-2").trim() || "rgba(255,255,255,0.08)",
        border: styles.getPropertyValue("--border").trim() || "rgba(255,255,255,0.12)",
        text: styles.getPropertyValue("--text").trim() || "#eaeefc",
        muted: styles.getPropertyValue("--muted").trim() || "rgba(255,255,255,0.7)",
        brand: styles.getPropertyValue("--brand").trim() || "#6ae4ff",
        brand2: styles.getPropertyValue("--brand-2").trim() || "#7c5cff"
      };
    }

    function toAlpha(color, alpha) {
      if (color.startsWith("rgba")) return color;
      if (color.startsWith("rgb(")) return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
      return `rgba(255,255,255,${alpha})`;
    }

    function setupCanvas(canvas) {
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(10, Math.floor(rect.width));
      const height = Math.max(10, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { ctx, width, height };
    }

    function drawBase(ctx, width, height, palette) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = palette.card;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
    }

    function drawText(ctx, text, x, y, palette, size = 12, bold = false, color = null) {
      ctx.fillStyle = color || palette.text;
      ctx.font = `${bold ? "800" : "500"} ${size}px Inter, system-ui, sans-serif`;
      ctx.fillText(text, x, y);
    }

    function drawGrid(ctx, plot, palette, xSteps = 6, ySteps = 4) {
      ctx.strokeStyle = toAlpha(palette.border, 0.55);
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

    function cleanData(rows) {
      const before = rows.length;
      const cleaned = rows.filter((row) =>
        FEATURE_KEYS.every((key) => Number(row[key]) >= 0 && Number(row[key]) <= 100) &&
        Number(row.final_score) >= 0 &&
        Number(row.final_score) <= 100
      );
      return { cleaned, before, after: cleaned.length };
    }

    function renderEmptyState() {
      $("beforeCount").textContent = "0";
      $("afterCount").textContent = "0";
      $("removedCount").textContent = "0";
      $("cleanNote").textContent = "Hozircha tahlil qilinadigan dataset yo‘q.";
      $("dsSource").textContent = "Topilmadi";
      $("dsCount").textContent = "-";
      $("statsBody").innerHTML = "";
      $("corrBody").innerHTML = "";
      $("dataNote").textContent = "Avval dataset sahifasida ma’lumot yarating.";
      const metrics = getSavedMetrics();
      if (metrics) {
        $("analysisMse").textContent = `MSE: ${Number(metrics.mse).toFixed(2)}`;
        $("analysisMae").textContent = `MAE: ${Number(metrics.mae).toFixed(2)}`;
        $("analysisR2").textContent = `R²: ${Number(metrics.r2).toFixed(3)}`;
        $("analysisTrain").textContent = `Train: ${metrics.trainedAt || "-"}`;
        $("analysisTrain").classList.remove("hidden");
      }
    }

    function renderStats(rows) {
      const mapping = {
        ai: "Sun’iy intellekt asoslari",
        dt: "Differensial tenglama",
        kb: "Kiberxavfsizlik asoslari",
        ki: "Kompyuter injeneringga kirish",
        es: "Ehtimollar va statistika",
        final_score: "final_score"
      };

      const keys = [...FEATURE_KEYS, "final_score"];
      $("statsBody").innerHTML = keys.map((key) => {
        const values = rows.map((row) => Number(row[key]));
        return `
          <tr>
            <td><strong>${mapping[key]}</strong></td>
            <td>${Math.min(...values).toFixed(1)}</td>
            <td>${Math.max(...values).toFixed(1)}</td>
            <td>${mean(values).toFixed(2)}</td>
          </tr>
        `;
      }).join("");
    }

    function getCorrRows(rows) {
      const y = rows.map((row) => Number(row.final_score));
      return FEATURE_KEYS.map((key) => {
        const x = rows.map((row) => Number(row[key]));
        return { key, corr: pearson(x, y) };
      }).sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
    }

    function renderCorrTable(rows) {
      const mapping = {
        ai: "Sun’iy intellekt asoslari",
        dt: "Differensial tenglama",
        kb: "Kiberxavfsizlik asoslari",
        ki: "Kompyuter injeneringga kirish",
        es: "Ehtimollar va statistika"
      };

      $("corrBody").innerHTML = rows.map((row) => `
        <tr>
          <td><strong>${mapping[row.key]}</strong></td>
          <td>${row.corr.toFixed(3)}</td>
        </tr>
      `).join("");
    }

    function drawHistogram(rows) {
      const canvas = $("histCanvas");
      const palette = theme();
      const { ctx, width, height } = setupCanvas(canvas);
      drawBase(ctx, width, height, palette);

      const values = rows.map((row) => Number(row.final_score));
      if (!values.length) return;

      const plot = { x: 40, y: 20, w: width - 52, h: height - 56 };
      drawGrid(ctx, plot, palette);

      const bins = 10;
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const range = (maxVal - minVal) || 1;
      const binSize = range / bins;
      const counts = new Array(bins).fill(0);

      values.forEach((value) => {
        let index = Math.floor((value - minVal) / binSize);
        if (index < 0) index = 0;
        if (index >= bins) index = bins - 1;
        counts[index] += 1;
      });

      const maxCount = Math.max(...counts) || 1;
      const barWidth = plot.w / bins;

      ctx.fillStyle = toAlpha(palette.brand, 0.9);
      counts.forEach((count, index) => {
        const barHeight = (count / maxCount) * plot.h;
        const x = plot.x + index * barWidth + 4;
        const y = plot.y + plot.h - barHeight;
        ctx.fillRect(x, y, Math.max(1, barWidth - 8), barHeight);
      });

      drawText(ctx, "final_score taqsimoti", plot.x, 14, palette, 12, true);
      drawText(ctx, `${minVal.toFixed(0)}`, plot.x, height - 12, palette, 11, false, palette.muted);
      drawText(ctx, `${maxVal.toFixed(0)}`, plot.x + plot.w - 28, height - 12, palette, 11, false, palette.muted);
    }

    function drawScatter(rows) {
      const canvas = $("scatterCanvas");
      const palette = theme();
      const { ctx, width, height } = setupCanvas(canvas);
      drawBase(ctx, width, height, palette);

      const feature = featureSelect.value;
      const xVals = rows.map((row) => Number(row[feature]));
      const yVals = rows.map((row) => Number(row.final_score));
      if (!xVals.length) return;

      const labels = {
        ai: "AI asoslari",
        dt: "Differensial",
        kb: "Kiberxavfsizlik",
        ki: "Kompyuter inj.",
        es: "Ehtimollar"
      };

      const plot = { x: 44, y: 20, w: width - 56, h: height - 56 };
      drawGrid(ctx, plot, palette);

      const xMin = Math.min(...xVals);
      const xMax = Math.max(...xVals);
      const yMin = Math.min(...yVals);
      const yMax = Math.max(...yVals);

      const mapX = (x) => plot.x + ((x - xMin) / ((xMax - xMin) || 1)) * plot.w;
      const mapY = (y) => plot.y + plot.h - ((y - yMin) / ((yMax - yMin) || 1)) * plot.h;

      ctx.fillStyle = toAlpha(palette.brand2, 0.88);
      xVals.forEach((value, index) => {
        ctx.beginPath();
        ctx.arc(mapX(value), mapY(yVals[index]), 2.6, 0, Math.PI * 2);
        ctx.fill();
      });

      const { a, b } = linearRegression(xVals, yVals);
      ctx.strokeStyle = toAlpha(palette.brand, 0.95);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mapX(xMin), mapY(a + b * xMin));
      ctx.lineTo(mapX(xMax), mapY(a + b * xMax));
      ctx.stroke();

      drawText(ctx, `${labels[feature]} → final_score`, plot.x, 14, palette, 12, true);
      drawText(ctx, `y = ${a.toFixed(2)} + ${b.toFixed(2)}x`, plot.x, height - 12, palette, 11, false, palette.muted);
    }

    function drawCorrBars(corrRows) {
      const canvas = $("corrCanvas");
      const palette = theme();
      const { ctx, width, height } = setupCanvas(canvas);
      drawBase(ctx, width, height, palette);

      const labels = {
        ai: "AI asoslari",
        dt: "Differensial",
        kb: "Kiberxavfsizlik",
        ki: "Kompyuter inj.",
        es: "Ehtimollar"
      };

      const plot = { x: 170, y: 20, w: width - 210, h: height - 40 };
      drawGrid(ctx, plot, palette, 4, corrRows.length);

      const zeroX = plot.x + plot.w / 2;
      ctx.strokeStyle = toAlpha(palette.border, 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(zeroX, plot.y);
      ctx.lineTo(zeroX, plot.y + plot.h);
      ctx.stroke();

      const rowHeight = plot.h / Math.max(1, corrRows.length);

      corrRows.forEach((row, index) => {
        const v = Math.max(-1, Math.min(1, row.corr));
        const barWidth = Math.abs(v) * (plot.w / 2);
        const x = v >= 0 ? zeroX : zeroX - barWidth;
        const y = plot.y + index * rowHeight + rowHeight * 0.18;
        const h = rowHeight * 0.64;

        ctx.fillStyle = v >= 0 ? toAlpha(palette.brand, 0.85) : toAlpha(palette.brand2, 0.85);
        ctx.fillRect(x, y, barWidth, h);

        drawText(ctx, labels[row.key], 14, y + h * 0.72, palette, 12, true);
        drawText(ctx, row.corr.toFixed(3), v >= 0 ? x + barWidth + 8 : Math.max(120, x - 54), y + h * 0.72, palette, 11, false, palette.muted);
      });

      drawText(ctx, "Feature → final_score bog‘liqligi", plot.x, 14, palette, 12, true);
    }

    function renderAnalysis() {
      const rows = getDataset();
      if (!rows.length) {
        renderEmptyState();
        return;
      }

      const cleaned = cleanData(rows);
      const validRows = cleaned.cleaned;

      $("beforeCount").textContent = String(cleaned.before);
      $("afterCount").textContent = String(cleaned.after);
      $("removedCount").textContent = String(cleaned.before - cleaned.after);
      $("cleanNote").textContent =
        cleaned.before === cleaned.after
          ? "Dataset toza — noto‘g‘ri qiymat topilmadi."
          : "Noto‘g‘ri qiymatlar olib tashlandi.";

      $("dsSource").textContent = DATASET_KEY;
      $("dsCount").textContent = `${validRows.length} ta`;

      const metrics = getSavedMetrics();
      if (metrics) {
        $("analysisMse").textContent = `MSE: ${Number(metrics.mse).toFixed(2)}`;
        $("analysisMae").textContent = `MAE: ${Number(metrics.mae).toFixed(2)}`;
        $("analysisR2").textContent = `R²: ${Number(metrics.r2).toFixed(3)}`;
        $("analysisTrain").textContent = `Train: ${metrics.trainedAt || "-"}`;
        $("analysisTrain").classList.remove("hidden");
      } else {
        $("analysisTrain").classList.add("hidden");
      }

      if (!validRows.length) {
        $("statsBody").innerHTML = "";
        $("corrBody").innerHTML = "";
        $("dataNote").textContent = "Tozalashdan keyin dataset bo‘sh qoldi.";
        return;
      }

      renderStats(validRows);
      const corrRows = getCorrRows(validRows);
      renderCorrTable(corrRows);
      drawHistogram(validRows);
      drawScatter(validRows);
      drawCorrBars(corrRows);

      const corrValue = corrRows.find((row) => row.key === featureSelect.value)?.corr ?? 0;
      $("dataNote").textContent = `Dataset: ${validRows.length} qator | Corr(${featureSelect.value}, final_score) = ${corrValue.toFixed(3)} | Tahlil tayyor ✅`;
    }

    redrawBtn.addEventListener("click", renderAnalysis);
    featureSelect.addEventListener("change", renderAnalysis);
    window.addEventListener("gradeai-theme-change", renderAnalysis);

    let resizeTimer;
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(renderAnalysis, 120);
    });

    renderAnalysis();
  }

  function initPage() {
    if (page === "concept") initConceptPage();
    if (page === "dataset") initDatasetPage();
    if (page === "model") initModelPage();
    if (page === "analysis") initAnalysisPage();
  }

  initTheme();
  initNav();
  initLoader();
  document.addEventListener("DOMContentLoaded", initPage);
})();