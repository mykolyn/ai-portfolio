// Shared interactions for every page.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ---------------------------------------------------------- theme toggle */
const themeBtn = $("[data-theme-toggle]");
themeBtn?.addEventListener("click", () => {
  const root = document.documentElement;
  const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  const next = current === "light" ? "dark" : "light";
  root.dataset.theme = next;
  try { localStorage.setItem("theme", next); } catch (e) {}
});

/* ---------------------------------------------------------- header */
const header = $("[data-header]");
let lastY = scrollY;
const onScroll = () => {
  const y = scrollY;
  header.classList.toggle("is-scrolled", y > 20);
  const menuOpen = document.body.classList.contains("menu-open");
  header.classList.toggle("is-hidden", !menuOpen && y > 400 && y > lastY + 2);
  if (y < lastY - 2) header.classList.remove("is-hidden");
  lastY = y;
};
addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------------------------------------------------------- mobile menu */
const menuBtn = $("[data-menu-toggle]");
const menu = $("[data-mobile-menu]");
const setMenu = (open) => {
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  menu.hidden = !open;
  document.body.classList.toggle("menu-open", open);
  document.body.style.overflow = open ? "hidden" : "";
};
menuBtn?.addEventListener("click", () => setMenu(menu.hidden));
addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });
$$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* ---------------------------------------------------------- reveal on scroll */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
  { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
);
$$(".reveal").forEach((el) => io.observe(el));

/* ---------------------------------------------------------- custom cursor */
if (finePointer && !reduceMotion) {
  document.body.classList.add("has-cursor");
  const cursor = $(".cursor");
  const dot = $(".cursor__dot");
  const ring = $(".cursor__ring");
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    cursor.classList.remove("is-hidden");
  }, { passive: true });
  document.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
  const loop = () => {
    rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
  document.addEventListener("pointerover", (e) => {
    const hit = e.target.closest("a, button, summary, label, input, textarea, [data-cursor]");
    cursor.classList.toggle("is-hover", !!hit && !e.target.closest("input, textarea"));
  });
}

/* ---------------------------------------------------------- magnetic buttons */
if (finePointer && !reduceMotion) {
  $$("[data-magnetic]").forEach((el) => {
    const strength = 0.25;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * strength;
      const y = (e.clientY - r.top - r.height / 2) * strength;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
}

/* ---------------------------------------------------------- spotlight cards */
$$("[data-spotlight]").forEach((grid) => {
  grid.addEventListener("pointermove", (e) => {
    for (const card of grid.children) {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }
  });
});

/* ---------------------------------------------------------- work filters */
const filters = $("[data-filters]");
if (filters) {
  const grid = $("[data-work-grid]");
  const empty = $("[data-empty]");
  filters.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-filter]");
    if (!btn) return;
    $$("[data-filter]", filters).forEach((b) => b.classList.toggle("is-active", b === btn));
    const f = btn.dataset.filter;
    let shown = 0;
    $$(".work-card", grid).forEach((card) => {
      const match = f === "*" || card.dataset.tags.split("|").includes(f);
      card.classList.toggle("is-filtered", !match);
      if (match) { shown++; card.classList.remove("is-in"); requestAnimationFrame(() => card.classList.add("is-in")); }
    });
    grid.classList.toggle("is-filtering", f !== "*");
    empty.hidden = shown > 0;
  });
}

/* ---------------------------------------------------------- post search */
const search = $("[data-post-search]");
if (search) {
  const rows = $$("[data-post-list] .post-row");
  const empty = $("[data-empty]");
  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    rows.forEach((row) => {
      const match = !q || row.textContent.toLowerCase().includes(q);
      row.classList.toggle("is-filtered", !match);
      if (match) { shown++; row.classList.add("is-in"); }
    });
    empty.hidden = shown > 0;
  });
}

/* ---------------------------------------------------------- reading progress + toc */
const progress = $("[data-progress]");
if (progress) {
  const article = $(".prose--post");
  const update = () => {
    const r = article.getBoundingClientRect();
    const total = r.height - innerHeight * 0.6;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(total, 1)));
    progress.style.transform = `scaleX(${p})`;
  };
  addEventListener("scroll", update, { passive: true });
  update();
}
const tocLinks = $$(".toc a");
if (tocLinks.length) {
  const map = new Map(tocLinks.map((a) => [decodeURIComponent(a.hash.slice(1)), a]));
  const tocIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        tocLinks.forEach((a) => a.classList.remove("is-active"));
        map.get(e.target.id)?.classList.add("is-active");
      }
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  map.forEach((_, id) => { const h = document.getElementById(id); if (h) tocIO.observe(h); });
}

/* ---------------------------------------------------------- copy link */
$$("[data-copy-link]").forEach((btn) =>
  btn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href); btn.textContent = "Copied ✓"; }
    catch { btn.textContent = "Copy failed"; }
    setTimeout(() => (btn.textContent = "Copy link"), 2000);
  })
);

/* ---------------------------------------------------------- contact form → mailto */
const form = $("[data-contact-form]");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const interests = d.getAll("interest").join(", ") || "—";
    const body = [
      `Name: ${d.get("name")}`,
      `Email: ${d.get("email")}`,
      `Company: ${d.get("company") || "—"}`,
      `Budget: ${d.get("budget") || "—"}`,
      `Interested in: ${interests}`,
      "",
      d.get("message"),
    ].join("\n");
    const subject = `New project — ${d.get("name")}${d.get("company") ? " @ " + d.get("company") : ""}`;
    location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $("[data-form-note]").textContent = "Your email app should open now. Thanks — talk soon!";
  });
}
