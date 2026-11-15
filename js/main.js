/* =========================================================
   Femik — interações do site (sem dependências)
   ========================================================= */

/* ---- CONFIGURAÇÃO: troque aqui o número do WhatsApp ----
   Formato: código do país + DDD + número, só dígitos.
   O número abaixo é PROVISÓRIO. */
const CONFIG = {
  whatsapp: "5500000000000",
  mensagemPadrao: "Olá, Femik! Vim pelo site e quero saber mais sobre os serviços.",
};

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
  a.href = whatsLink(CONFIG.mensagemPadrao);
  a.target = "_blank";
  a.rel = "noopener";
});

/* ---- Formulário → mensagem pronta no WhatsApp ---- */
document.getElementById("form-contato").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const texto =
    `Olá, Femik! Meu nome é ${f.get("nome")}` +
    (f.get("empresa") ? `, da empresa ${f.get("empresa")}` : "") +
    `.\nTenho interesse em: ${f.get("servico")}.` +
    (f.get("mensagem") ? `\n\n${f.get("mensagem")}` : "");
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
