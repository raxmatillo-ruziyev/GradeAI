// GradeAI main.js
(function () {
  const root = document.documentElement;

  // Ensure theme exists (if head script fails for any reason)
  try {
    const saved = localStorage.getItem("theme");
    if (saved !== "light" && saved !== "dark") {
      const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
      root.dataset.theme = prefersLight ? "light" : "dark";
    }
  } catch (e) { }

  // Theme toggle with smooth fade overlay
  const btn = document.getElementById("themeToggle");
  const fade = document.getElementById("themeFade");

  btn?.addEventListener("click", () => {
    fade?.classList.add("is-on");

    // Fade-in -> switch -> fade-out
    window.setTimeout(() => {
      const current = root.dataset.theme || "dark";
      const next = current === "dark" ? "light" : "dark";
      root.dataset.theme = next;

      try { localStorage.setItem("theme", next); } catch (e) { }

      window.setTimeout(() => fade?.classList.remove("is-on"), 160);
    }, 90);
  });

  // Mobile nav toggle
  const burger = document.getElementById("burger");
  const mobileNav = document.getElementById("mobileNav");

  const setBurgerState = (open) => {
    if (!burger) return;
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  };

  burger?.addEventListener("click", () => {
    const isHidden = mobileNav?.hasAttribute("hidden");
    if (!mobileNav) return;

    if (isHidden) {
      mobileNav.removeAttribute("hidden");
      setBurgerState(true);
    } else {
      mobileNav.setAttribute("hidden", "");
      setBurgerState(false);
    }
  });

  // Close mobile nav when clicking a link
  mobileNav?.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    mobileNav.setAttribute("hidden", "");
    setBurgerState(false);
  });
})();



window.addEventListener("load", () => {
    const loader = document.getElementById("page-loader");
    
    // Sahifa tayyor bo'lgach, loader biroz ushlab turilib keyin yo'qoladi
    setTimeout(() => {
        loader.classList.add("loader-hidden");
    }, 2800); 
});

// Agar siz navigatsiya tugmalariga bosganda ham loader chiqishini xohlasangiz:
document.querySelectorAll('.navlink, .btn').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/')) {
            document.getElementById("page-loader").classList.remove("loader-hidden");
        }
    });
});
const memberData = {
    'RR': {
        name: "Ruziyev Raxmatillo",
        role: "Lead Developer / AI Engineer",
        tasks: [
            "Loyiha arxitekturasini (HTML/CSS/JS) ishlab chiqish",
            "Datasetlarni yig'ish, tozalash va tahlil qilish",
            "Regression modelini yaratish va uning aniqligini optimallashtirish",
            "AI modelini veb-interfeysga integratsiya qilish"
        ]
    },
    'AS': {
        name: "Azimjonov Shaxzod",
        role: "Data Analysis Support",
        tasks: [
            "Ma'lumotlar orasidagi korrelyatsiyani aniqlash",
            "Dataset trendlarini statistik tahlil qilish",
            "Natijalarni interpretatsiya qilish va vizuallashtirish"
        ]
    },
    'AA': {
        name: "Abdunosirov Asrorbek",
        role: "Model Evaluation Support",
        tasks: [
            "Model sifatini MSE, MAE va R² metrikalari orqali baholash",
            "Bashorat aniqligini nazorat qilish va xatoliklarni kamaytirish",
            "Algoritm samaradorligini tahlil qilish"
        ]
    },
    'ZA': {
        name: "Ziyoratquliyev Abbosbek",
        role: "UI Design Support / Documentation",
        tasks: [
            "Loyiha UI/UX dizaynini shakllantirish va optimallashtirish",
            "Loyiha hujjatlarini (documentation) tayyorlash",
            "Interfeys elementlarining o'zaro muvofiqligini ta'minlash"
        ]
    }
};

function openMemberModal(id) {
    const data = memberData[id];
    document.getElementById('modalAvatar').innerText = id;
    document.getElementById('modalName').innerText = data.name;
    document.getElementById('modalRole').innerText = data.role;
    
    const taskList = document.getElementById('modalTasks');
    taskList.innerHTML = ''; // Tozalash
    data.tasks.forEach(task => {
        const li = document.createElement('li');
        li.innerText = task;
        taskList.appendChild(li);
    });

    document.getElementById('memberModal').classList.add('is-active');
}

function closeMemberModal() {
    document.getElementById('memberModal').classList.remove('is-active');
}

// Modal tashqarisiga bosganda yopish
window.onclick = function(event) {
    const modal = document.getElementById('memberModal');
    if (event.target == modal) {
        closeMemberModal();
    }
}