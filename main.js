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