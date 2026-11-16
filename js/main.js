/* =========================================================
   Femik — interações do site (sem dependências)
   ========================================================= */

/* ---- CONFIGURAÇÃO: troque aqui o número do WhatsApp ----
   Formato: código do país + DDD + número, só dígitos.
   */
const CONFIG = {
  whatsapp: "16043386130",
};

/* Textos do idioma da página — injetados por tools/build.py (ver i18n/*.json) */
const I18N = window.FEMIK_I18N || { lang: "pt", msg: {}, langs: {} };
const fmt = (str, vars) => str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

const whatsLink = (texto) =>
  `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(texto)}`;

/* ---- Loader: some quando a página carrega (mín. 1,6 s, máx. 3,5 s) ---- */
(() => {
  const loader = document.getElementById("loader");
  const start = performance.now();
  let done = false;
  const hide = () => {
    if (done) return;
    done = true;
    loader.classList.add("hide");
    document.body.classList.remove("is-loading");
    window.dispatchEvent(new Event("femik:loaded"));
  };
  window.addEventListener("load", () => {
    const wait = Math.max(0, 1600 - (performance.now() - start));
    setTimeout(hide, wait);
  });
  setTimeout(hide, 3500); // segurança: nunca prende o visitante
})();

/* ---- Links do WhatsApp ---- */
document.querySelectorAll(".js-whats").forEach((a) => {
  a.href = whatsLink(I18N.msg.defaultMsg);
  a.target = "_blank";
  a.rel = "noopener";
});

/* ---- Formulário → mensagem pronta no WhatsApp (no idioma da página) ---- */
document.getElementById("contact-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const m = I18N.msg;
  const texto =
    fmt(m.greeting, { name: f.get("name") }) +
    (f.get("company") ? fmt(m.fromCompany, { company: f.get("company") }) : "") +
    fmt(m.interest, { service: f.get("service") }) +
    (f.get("message") ? `\n\n${f.get("message")}` : "");
  window.open(whatsLink(texto), "_blank", "noopener");
});

/* ---- Navegação: fundo ao rolar + menu mobile ---- */
const nav = document.querySelector(".nav");
const menu = document.getElementById("menu");
const toggle = document.querySelector(".nav-toggle");
const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();
toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  nav.classList.toggle("menu-open", open);
  toggle.setAttribute("aria-expanded", open);
});
menu.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    menu.classList.remove("open");
    nav.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

/* ---- Carrossel de serviços ---- */
(() => {
  const root = document.querySelector(".carousel");
  const slides = [...root.querySelectorAll(".slide")];
  const dotsBox = root.querySelector(".dots");
  let i = 0;
  let timer;

  const dots = slides.map((s, n) => {
    const b = document.createElement("button");
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", s.querySelector("h2").textContent);
    b.addEventListener("click", () => { go(n); restart(); });
    dotsBox.appendChild(b);
    return b;
  });

  function go(n) {
    const next = (n + slides.length) % slides.length;
    if (next === i && slides[i].classList.contains("is-active")) { paint(); return; }
    const prev = slides[i];
    prev.classList.remove("is-active");
    prev.classList.add("is-leaving");
    setTimeout(() => prev.classList.remove("is-leaving"), 600);
    i = next;
    slides[i].classList.add("is-active");
    paint();
  }
  function paint() {
    dots.forEach((d, n) => {
      d.classList.toggle("on", n === i);
      d.setAttribute("aria-selected", n === i);
    });
  }
  function restart() {
    clearInterval(timer);
    timer = setInterval(() => go(i + 1), 5200);
  }

  root.querySelector(".next").addEventListener("click", () => { go(i + 1); restart(); });
  root.querySelector(".prev").addEventListener("click", () => { go(i - 1); restart(); });
  root.addEventListener("mouseenter", () => clearInterval(timer));
  root.addEventListener("mouseleave", restart);

  // gesto de arrastar no celular
  let x0 = null;
  const area = root.querySelector(".slides");
  area.addEventListener("touchstart", (e) => (x0 = e.touches[0].clientX), { passive: true });
  area.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 40) { go(dx < 0 ? i + 1 : i - 1); restart(); }
    x0 = null;
  });

  paint();
  restart();
})();

/* ---- Ponto orbitando o infográfico ---- */
(() => {
  const dot = document.querySelector(".orbit-dot");
  if (!dot || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = 170, c = 260;
  const tick = (t) => {
    const a = (t / 4200) * Math.PI * 2 - Math.PI / 2;
    dot.setAttribute("cx", c + r * Math.cos(a));
    dot.setAttribute("cy", c + r * Math.sin(a));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

/* ---- Infográfico: reduz rótulos longos para caber no círculo (qualquer idioma) ---- */
const fitLabels = () =>
  document.querySelectorAll(".info-svg .t-lbl").forEach((t) => {
    const max = 72; // largura útil do círculo na altura do rótulo
    t.style.fontSize = "";
    const w = t.getBBox().width;
    if (w > max) t.style.fontSize = `${(11.5 * max) / w}px`;
  });
fitLabels();
if (document.fonts) document.fonts.ready.then(fitLabels); // mede de novo com a fonte final

/* ---- Revelar seções ao rolar ---- */
(() => {
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    }),
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el, n) => {
    el.style.transitionDelay = `${(n % 3) * 90}ms`;
    io.observe(el);
  });
})();

document.getElementById("ano").textContent = new Date().getFullYear();

/* ---- Menu de idiomas ---- */
(() => {
  const box = document.querySelector(".lang");
  if (!box) return;
  const btn = box.querySelector(".lang-btn");
  const setOpen = (open) => {
    box.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open);
  };
  btn.addEventListener("click", (e) => { e.stopPropagation(); setOpen(!box.classList.contains("open")); });
  document.addEventListener("click", (e) => { if (!box.contains(e.target)) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

  // ao trocar de idioma: lembra a escolha e mantém a seção em que a pessoa está
  box.querySelectorAll("a[data-lang]").forEach((a) =>
    a.addEventListener("click", () => {
      try { localStorage.setItem("femik-lang", a.dataset.lang); } catch (_) {}
      a.href = a.getAttribute("href").split("#")[0] + location.hash;
    })
  );
})();

/* ---- Sugestão de idioma: se o navegador fala outro idioma que temos ---- */
(() => {
  let chosen = null;
  try { chosen = localStorage.getItem("femik-lang"); } catch (_) {}
  if (chosen) return; // a pessoa já escolheu um idioma
  const prefs = (navigator.languages || [navigator.language || ""]).map((l) => l.slice(0, 2).toLowerCase());
  const match = prefs.find((l) => I18N.langs[l]);
  if (!match || match === I18N.lang) return;
  const L = I18N.langs[match];
  const bar = document.createElement("div");
  bar.className = "lang-suggest";
  bar.lang = L.html;
  bar.innerHTML = `<span></span><a></a><button type="button">×</button>`;
  bar.querySelector("span").textContent = L.text;
  const go = bar.querySelector("a");
  go.textContent = L.go;
  go.href = L.href;
  go.addEventListener("click", () => {
    try { localStorage.setItem("femik-lang", match); } catch (_) {}
    go.href = L.href + location.hash;
  });
  const close = bar.querySelector("button");
  close.setAttribute("aria-label", L.close);
  close.addEventListener("click", () => {
    try { localStorage.setItem("femik-lang", I18N.lang); } catch (_) {}
    bar.remove();
  });
  const show = () => document.body.appendChild(bar);
  if (document.body.classList.contains("is-loading")) window.addEventListener("femik:loaded", show, { once: true });
  else show();
})();
