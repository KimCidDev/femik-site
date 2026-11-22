/* =========================================================
   Femik — motor do briefing (femik.ca/form)
   Fluxo: código de acesso → abertura → 1 pergunta por tela →
   resumo → envio por e-mail (com avaliação automática) → obrigado.
   ========================================================= */

/* ---------- CONFIGURAÇÃO ---------- */
const CONFIG = {
  // Serviço gratuito que transforma o envio em e-mail (sem servidor próprio).
  // No 1º envio, o FormSubmit manda um e-mail de ATIVAÇÃO para kim@femik.ca — é preciso clicar nele uma vez.
  endpoint: "https://formsubmit.co/ajax/kim@femik.ca",
  cc: "isabel@femik.ca,felipe@femik.ca",
  fallbackEmail: "kim@femik.ca",
  secondsPerScreen: 22, // estimativa de tempo restante
};

const { SECTIONS, QUESTIONS, COUNTRIES, UI } = window.FORM;
const SPEND_STOPS = [0, 500, 1000, 2500, 5000, 10000, 25000, 50000];
const CURRENCIES = { BRL: "R$", CAD: "CA$", EUR: "€", USD: "US$" };
const TO_CAD = { BRL: 0.25, CAD: 1, EUR: 1.5, USD: 1.37 };
const COUNTRY_CUR = { BR: "BRL", CA: "CAD", ES: "EUR", PT: "EUR", US: "USD", XX: "USD" };
const LANGS = ["en", "pt", "es"];

/* ---------- Estado ---------- */
const app = document.getElementById("app");
const state = { lang: pickLang(), code: null, answers: {}, pos: 0, startedAt: null, skipped: [] };
let lastSection = null;

function pickLang() {
  const q = new URLSearchParams(location.search).get("lang");
  if (LANGS.includes(q)) return q;
  try { const s = localStorage.getItem("femik-lang"); if (LANGS.includes(s)) return s; } catch (_) {}
  for (const l of navigator.languages || [navigator.language || ""]) {
    const c = String(l).slice(0, 2).toLowerCase();
    if (LANGS.includes(c)) return c;
  }
  return "en";
}
const L = () => UI[state.lang];
const tr = (obj) => (obj ? obj[state.lang] || obj.pt : "");
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const storeKey = () => "femik-form-" + state.code;

function save() {
  try { localStorage.setItem(storeKey(), JSON.stringify({ answers: state.answers, pos: state.pos, startedAt: state.startedAt, skipped: state.skipped })); } catch (_) {}
}
function load() {
  try { return JSON.parse(localStorage.getItem(storeKey()) || "null"); } catch (_) { return null; }
}

const visible = () => QUESTIONS.filter((q) => !q.showIf || q.showIf(state.answers));

/* ---------- Cabeçalho (idioma) ---------- */
function renderHeader() {
  const h = document.getElementById("lang");
  h.innerHTML = LANGS.map((l) => `<button type="button" data-l="${l}" ${l === state.lang ? 'aria-current="true"' : ""}>${l.toUpperCase()}</button>`).join("");
  h.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
    state.lang = b.dataset.l;
    try { localStorage.setItem("femik-lang", state.lang); } catch (_) {}
    document.documentElement.lang = state.lang === "pt" ? "pt-BR" : state.lang;
    renderHeader(); route();
  }));
  document.getElementById("brief").textContent = L().brief;
}

/* ---------- Roteamento simples ---------- */
let screen = "gate";
function route() {
  window.scrollTo({ top: 0 });
  if (screen === "gate") return renderGate();
  if (screen === "intro") return renderIntro();
  if (screen === "review") return renderReview();
  if (screen === "done") return renderDone();
  return renderQuestion();
}
function go(s) { screen = s; route(); }

/* ---------- Tela: código de acesso ---------- */
function renderGate() {
  const u = L();
  app.innerHTML = `
    <section class="card gate anim">
      <div class="lock" aria-hidden="true">🔐</div>
      <h1>${u.gateTitle}</h1>
      <p class="muted">${u.gateText}</p>
      <form id="gateForm" autocomplete="off" novalidate>
        <div class="code-wrap"><span class="code-prefix">FMK-</span>
        <input id="code" class="code-input" inputmode="text" autocapitalize="characters" spellcheck="false"
          placeholder="XXXX-XX" maxlength="12" aria-label="${u.gateTitle}" /></div>
        <p class="err" id="gateErr" role="alert"></p>
        <button class="btn" type="submit">${u.gateBtn} →</button>
      </form>
      <p class="tiny muted">${u.gateHelp} <a href="mailto:${CONFIG.fallbackEmail}">${CONFIG.fallbackEmail}</a></p>
    </section>`;
  const inp = document.getElementById("code");
  inp.addEventListener("input", () => {
    const p = inp.selectionStart === inp.value.length;
    inp.value = FemikCode.formatBody(inp.value);
    if (p) inp.setSelectionRange(inp.value.length, inp.value.length);
    document.getElementById("gateErr").textContent = "";
    inp.classList.remove("bad");
  });
  document.getElementById("gateForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!FemikCode.isValid(inp.value)) {
      document.getElementById("gateErr").textContent = u.gateError;
      inp.classList.add("bad");
      inp.animate([{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }], { duration: 260 });
      return;
    }
    state.code = FemikCode.format(inp.value);
    try { sessionStorage.setItem("femik-form-code", state.code); } catch (_) {}
    const saved = load();
    if (saved) Object.assign(state, saved);
    go("intro");
  });
  setTimeout(() => inp.focus(), 50);
}

/* ---------- Tela: abertura ---------- */
function renderIntro() {
  const u = L();
  const saved = state.startedAt && Object.keys(state.answers).length;
  app.innerHTML = `
    <section class="intro anim">
      <p class="eyebrow">${u.introEyebrow}</p>
      <h1>${u.introTitle1}<br><span class="grad">${u.introTitle2}</span></h1>
      <p class="lead">${u.introText}</p>
      <ul class="pills">${u.pills.map((p) => `<li>${p}</li>`).join("")}</ul>
      <div class="intro-cta">
        <button class="btn btn-lg" id="startBtn">${saved ? u.resume : u.start} →</button>
        ${saved ? `<button class="link" id="restartBtn">${u.restart}</button>` : ""}
      </div>
    </section>`;
  document.getElementById("startBtn").addEventListener("click", () => {
    if (!state.startedAt) state.startedAt = Date.now();
    lastSection = null;
    save();
    go("q");
  });
  const r = document.getElementById("restartBtn");
  if (r) r.addEventListener("click", () => {
    state.answers = {}; state.pos = 0; state.skipped = []; state.startedAt = Date.now();
    save(); lastSection = null; go("q");
  });
}

/* ---------- Tela: pergunta ---------- */
function renderQuestion() {
  keyHandler = null;
  const list = visible();
  if (state.pos >= list.length) return go("review");
  if (state.pos < 0) state.pos = 0;
  const q = list[state.pos];
  const u = L();
  const sec = SECTIONS[q.section];
  const remaining = list.length - state.pos;
  const mins = Math.max(1, Math.round((remaining * CONFIG.secondsPerScreen) / 60));
  const pct = Math.round((state.pos / list.length) * 100);
  const secKeys = Object.keys(SECTIONS);

  let toast = "";
  if (lastSection && lastSection !== q.section && secKeys.indexOf(q.section) > secKeys.indexOf(lastSection)) {
    toast = `<div class="toast" role="status">✓ ${fmt(u.sectionDone, { s: tr(SECTIONS[lastSection].t) })} <span>${remaining <= 6 ? u.almost : fmt(u.minLeft, { n: mins })}</span></div>`;
  }
  lastSection = q.section;

  app.innerHTML = `
    ${toast}
    <div class="topbar">
      <span class="chip">${sec.emoji} ${tr(sec.t)}</span>
      <span class="muted small">${state.pos + 1} / ${list.length} · ${fmt(u.minLeft, { n: mins })}</span>
    </div>
    <div class="bar"><i style="width:${pct}%"></i></div>
    <section class="card q anim" id="qcard">
      <h2>${tr(q.title)}${q.required ? ' <span class="req">*</span>' : ""}</h2>
      ${q.help ? `<p class="muted help">${tr(q.help)}</p>` : hint(q)}
      <div class="body" id="qbody"></div>
      <p class="err" id="qerr" role="alert"></p>
      <div class="nav">
        <button class="btn ghost" id="backBtn" type="button">← ${u.back}</button>
        <div class="nav-right">
          ${!q.required ? `<button class="link" id="skipBtn" type="button">${u.skip}</button>` : ""}
          <button class="btn" id="nextBtn" type="button">${u.next} →</button>
        </div>
      </div>
      <p class="tiny muted enter-hint">${u.enterHint}</p>
    </section>`;

  const body = document.getElementById("qbody");
  ({ text: bodyText, single: bodyChoice, multi: bodyChoice, contact: bodyContact, scale: bodyScale, spend: bodySpend })[q.type](q, body);

  document.getElementById("backBtn").addEventListener("click", () => {
    if (state.pos === 0) return go("intro");
    state.pos--; save(); lastSection = null; route();
  });
  document.getElementById("nextBtn").addEventListener("click", () => next(q));
  const sk = document.getElementById("skipBtn");
  if (sk) sk.addEventListener("click", () => {
    if (!state.skipped.includes(q.id)) state.skipped.push(q.id);
    state.pos++; save(); route();
  });
}

function hint(q) {
  const u = L();
  if (q.type === "multi") {
    if (q.min && q.max) return `<p class="muted help">${fmt(u.range, { a: q.min, b: q.max })}</p>`;
    if (q.max) return `<p class="muted help">${fmt(u.upTo, { n: q.max })}</p>`;
    return `<p class="muted help">${u.many}</p>`;
  }
  if (q.type === "single") return `<p class="muted help">${u.one}</p>`;
  return "";
}

function next(q) {
  const err = validate(q);
  const box = document.getElementById("qerr");
  if (err) {
    box.textContent = err;
    document.getElementById("qcard").animate([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 240 });
    return;
  }
  state.skipped = state.skipped.filter((x) => x !== q.id);
  state.pos++;
  save();
  route();
}

function validate(q) {
  const u = L();
  const a = state.answers[q.id];
  if (q.type === "contact") {
    const c = a || {};
    if (!c.company || !c.name || !c.email) return u.required;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) return u.emailInvalid;
    return "";
  }
  if (q.type === "text") return q.required && !(a || "").trim() ? u.required : "";
  if (q.type === "single") return q.required && !(a && a.v) ? u.required : "";
  if (q.type === "multi") {
    const n = (a && a.v && a.v.length) || 0;
    if (q.required && !n) return u.required;
    if (n && q.min && n < q.min) return fmt(u.min, { n: q.min });
    if (q.max && n > q.max) return fmt(u.max, { n: q.max });
  }
  return "";
}

/* ---------- Corpos de pergunta ---------- */
function bodyText(q, el) {
  el.innerHTML = `<textarea id="ta" rows="4" placeholder="${esc(tr(q.placeholder))}">${esc(state.answers[q.id] || "")}</textarea>`;
  const ta = document.getElementById("ta");
  ta.addEventListener("input", () => { state.answers[q.id] = ta.value; save(); });
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); next(q); } });
  setTimeout(() => ta.focus(), 60);
}

function bodyChoice(q, el) {
  const u = L();
  const multi = q.type === "multi";
  const a = state.answers[q.id] || { v: multi ? [] : "", other: "" };
  const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const cls = q.chips ? "opts chips" : q.swatches ? "opts swatches" : "opts";
  el.innerHTML = `
    <div class="${cls}" role="${multi ? "group" : "radiogroup"}">
      ${q.options.map((op, i) => {
        const on = multi ? a.v.includes(op.id) : a.v === op.id;
        const sw = op.color ? `<span class="sw ${op.color === "rainbow" ? "rainbow" : ""}" style="${op.color !== "rainbow" ? `background:${op.color}` : ""}"></span>` : "";
        return `<button type="button" class="opt" data-id="${op.id}" role="${multi ? "checkbox" : "radio"}" aria-checked="${on}">
          ${q.chips ? "" : `<kbd>${keys[i]}</kbd>`}${sw}<span>${esc(tr(op.t))}</span></button>`;
      }).join("")}
    </div>
    <div class="other ${(multi ? a.v.includes("other") : a.v === "other") ? "show" : ""}">
      <input id="otherIn" type="text" placeholder="${u.otherPh}" value="${esc(a.other || "")}" />
    </div>
    ${q.extra ? `<label class="extra">${tr(q.extra.label)} <span class="muted small">(${u.optional})</span>
      <textarea id="extraIn" rows="2" placeholder="${esc(tr(q.extra.placeholder))}">${esc(a.extra || "")}</textarea></label>` : ""}`;

  const otherBox = el.querySelector(".other");
  const otherIn = document.getElementById("otherIn");
  const commit = () => { state.answers[q.id] = a; save(); };

  const toggle = (id) => {
    document.getElementById("qerr").textContent = "";
    if (multi) {
      if (a.v.includes(id)) a.v = a.v.filter((x) => x !== id);
      else {
        if (q.max && a.v.length >= q.max) {
          document.getElementById("qerr").textContent = fmt(u.max, { n: q.max });
          return;
        }
        a.v.push(id);
      }
    } else a.v = id;
    el.querySelectorAll(".opt").forEach((b) => b.setAttribute("aria-checked", multi ? a.v.includes(b.dataset.id) : a.v === b.dataset.id));
    const showOther = multi ? a.v.includes("other") : a.v === "other";
    otherBox.classList.toggle("show", showOther);
    commit();
    if (showOther && id === "other") setTimeout(() => otherIn.focus(), 30);
    else if (!multi) setTimeout(() => next(q), 320); // escolha única avança sozinha
  };
  el.querySelectorAll(".opt").forEach((b) => b.addEventListener("click", () => {
    b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
    toggle(b.dataset.id);
  }));
  otherIn.addEventListener("input", () => { a.other = otherIn.value; commit(); });
  const ex = document.getElementById("extraIn");
  if (ex) ex.addEventListener("input", () => { a.extra = ex.value; commit(); });

  // atalhos de teclado: letras escolhem opções
  keyHandler = (e) => {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const i = keys.indexOf(e.key.toUpperCase());
    if (!q.chips && i >= 0 && i < q.options.length) { e.preventDefault(); toggle(q.options[i].id); }
  };
}

function bodyContact(q, el) {
  const u = L();
  const c = state.answers.contact || {};
  const field = (k, type, req, ac, ph) => `
    <label class="field"><span>${u["f_" + k]}${req ? ' <b class="req">*</b>' : ` <em>${u.optional}</em>`}</span>
      <input data-k="${k}" type="${type}" autocomplete="${ac}" placeholder="${ph || ""}" value="${esc(c[k] || "")}" /></label>`;
  el.innerHTML = `<div class="fields">
    ${field("company", "text", true, "organization")}
    ${field("name", "text", true, "name")}
    ${field("email", "email", true, "email", "you@company.com")}
    ${field("whatsapp", "tel", false, "tel", "+1 …")}
    ${field("website", "url", false, "url", "https://…")}
    ${field("instagram", "text", false, "off", "@…")}
    <label class="field"><span>${u.f_country} <em>${u.optional}</em></span>
      <select data-k="country"><option value="">—</option>${COUNTRIES.map((x) => `<option value="${x.id}" ${c.country === x.id ? "selected" : ""}>${esc(tr(x.t))}</option>`).join("")}</select></label>
  </div>`;
  el.querySelectorAll("[data-k]").forEach((inp) => inp.addEventListener("input", () => {
    c[inp.dataset.k] = inp.value.trim();
    state.answers.contact = c; save();
  }));
  setTimeout(() => el.querySelector("input").focus(), 60);
}

function bodyScale(q, el) {
  const u = L();
  const s = state.answers[q.id] || {};
  const faces = ["😖", "😕", "😐", "🙂", "🤩"];
  el.innerHTML = `<div class="scale">${q.items.map((it) => `
    <div class="srow" data-id="${it.id}">
      <p class="slabel">${esc(tr(it.t))}</p>
      <div class="faces">
        ${faces.map((f, i) => `<button type="button" class="face" data-v="${i + 1}" aria-pressed="${s[it.id] === i + 1}" title="${u.sc[i]}"><span>${f}</span><small>${i + 1}</small></button>`).join("")}
        <button type="button" class="face na" data-v="0" aria-pressed="${s[it.id] === 0}">${u.s0}</button>
      </div>
    </div>`).join("")}</div>`;
  el.querySelectorAll(".srow").forEach((row) => row.querySelectorAll(".face").forEach((b) => b.addEventListener("click", () => {
    s[row.dataset.id] = Number(b.dataset.v);
    row.querySelectorAll(".face").forEach((x) => x.setAttribute("aria-pressed", x === b));
    b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
    state.answers[q.id] = s; save();
  })));
}

function bodySpend(q, el) {
  const u = L();
  const country = (state.answers.contact || {}).country;
  const sp = state.answers.spend || { cur: COUNTRY_CUR[country] || "CAD", idx: 3, notSay: false, cats: [] };
  const label = () => {
    const sym = CURRENCIES[sp.cur];
    const n = (v) => v.toLocaleString(state.lang === "en" ? "en-CA" : state.lang === "es" ? "es-ES" : "pt-BR");
    if (sp.idx === 0) return u.nothing;
    if (sp.idx === SPEND_STOPS.length - 1) return `${sym} ${n(SPEND_STOPS[sp.idx])}+`;
    return `${u.upToMoney} ${sym} ${n(SPEND_STOPS[sp.idx])}`;
  };
  el.innerHTML = `
    <div class="spend ${sp.notSay ? "off" : ""}">
      <div class="curs" role="radiogroup" aria-label="${u.currency}">
        ${Object.keys(CURRENCIES).map((c) => `<button type="button" data-c="${c}" aria-pressed="${sp.cur === c}">${c}</button>`).join("")}
      </div>
      <output id="spendOut" class="money">${label()}</output>
      <input id="spendRange" type="range" min="0" max="${SPEND_STOPS.length - 1}" step="1" value="${sp.idx}" aria-label="${tr(q.title)}" />
      <div class="ticks"><span>0</span><span>${CURRENCIES[sp.cur]} 50k+</span></div>
      <p class="cat-title">${u.catTitle}</p>
      <div class="opts chips">${q.categories.map((c) => `<button type="button" class="opt" data-id="${c.id}" aria-checked="${sp.cats.includes(c.id)}"><span>${esc(tr(c.t))}</span></button>`).join("")}</div>
    </div>
    <label class="check"><input type="checkbox" id="notSay" ${sp.notSay ? "checked" : ""}/> ${u.notSay}</label>`;
  const commit = () => { state.answers.spend = sp; save(); };
  const out = document.getElementById("spendOut");
  const range = document.getElementById("spendRange");
  range.addEventListener("input", () => { sp.idx = Number(range.value); out.textContent = label(); out.classList.remove("pop"); void out.offsetWidth; out.classList.add("pop"); commit(); });
  el.querySelectorAll("[data-c]").forEach((b) => b.addEventListener("click", () => {
    sp.cur = b.dataset.c; el.querySelectorAll("[data-c]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    out.textContent = label(); el.querySelector(".ticks span:last-child").textContent = `${CURRENCIES[sp.cur]} 50k+`; commit();
  }));
  el.querySelectorAll(".chips .opt").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.id;
    sp.cats = sp.cats.includes(id) ? sp.cats.filter((x) => x !== id) : [...sp.cats, id];
    b.setAttribute("aria-checked", sp.cats.includes(id)); commit();
  }));
  document.getElementById("notSay").addEventListener("change", (e) => {
    sp.notSay = e.target.checked; el.querySelector(".spend").classList.toggle("off", sp.notSay); commit();
  });
  commit();
}

/* ---------- Tela: resumo e envio ---------- */
function renderReview() {
  const u = L();
  const list = visible();
  const bySec = {};
  list.forEach((q, i) => { (bySec[q.section] = bySec[q.section] || []).push({ q, i }); });
  const answeredCount = list.filter((q) => isAnswered(q)).length;
  app.innerHTML = `
    <div class="bar"><i style="width:100%"></i></div>
    <section class="card review anim">
      <h2>${u.reviewTitle}</h2>
      <p class="muted">${u.reviewText}</p>
      <p class="score-pill">${fmt(u.answered, { a: answeredCount, b: list.length })}</p>
      <ul class="sections">
        ${Object.keys(bySec).map((s) => {
          const items = bySec[s];
          const done = items.filter((x) => isAnswered(x.q)).length;
          return `<li><span>${SECTIONS[s].emoji} ${tr(SECTIONS[s].t)}</span>
            <span class="muted small">${done}/${items.length}</span>
            <button class="link" data-pos="${items[0].i}">${u.edit}</button></li>`;
        }).join("")}
      </ul>
      <label class="check consent"><input type="checkbox" id="consent" ${state.answers.consent ? "checked" : ""}/> <span>${u.consent}</span></label>
      <p class="tiny muted">${u.privacy}</p>
      <p class="err" id="sendErr" role="alert"></p>
      <div class="nav">
        <button class="btn ghost" id="backBtn">← ${u.back}</button>
        <button class="btn btn-lg" id="sendBtn" ${state.answers.consent ? "" : "disabled"}>${u.send} ✓</button>
      </div>
      <div id="fallback" class="fallback"></div>
    </section>`;
  app.querySelectorAll("[data-pos]").forEach((b) => b.addEventListener("click", () => { state.pos = Number(b.dataset.pos); lastSection = null; go("q"); }));
  document.getElementById("backBtn").addEventListener("click", () => { state.pos = list.length - 1; lastSection = null; go("q"); });
  const consent = document.getElementById("consent");
  const send = document.getElementById("sendBtn");
  consent.addEventListener("change", () => { state.answers.consent = consent.checked; send.disabled = !consent.checked; save(); });
  send.addEventListener("click", submit);
}

function isAnswered(q) {
  const a = state.answers[q.id];
  if (!a) return false;
  if (typeof a === "string") return !!a.trim();
  if (q.type === "multi") return a.v && a.v.length > 0;
  if (q.type === "single") return !!a.v;
  if (q.type === "scale") return Object.keys(a).length > 0;
  if (q.type === "spend") return true;
  if (q.type === "contact") return !!a.company;
  return true;
}

async function submit() {
  const u = L();
  const btn = document.getElementById("sendBtn");
  const err = document.getElementById("sendErr");
  btn.disabled = true; btn.textContent = u.sending; err.textContent = "";
  const report = buildReport();
  try {
    const res = await fetch(CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(report.fields),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || String(data.success) === "false") throw new Error(data.message || res.status);
    state.answers.sentAt = new Date().toISOString(); save();
    go("done");
  } catch (e) {
    console.warn("Envio falhou:", e);
    err.textContent = u.sendError;
    btn.disabled = false; btn.textContent = u.retry;
    const body = encodeURIComponent(report.text.slice(0, 1800));
    const subj = encodeURIComponent(report.fields._subject);
    document.getElementById("fallback").innerHTML =
      `<a class="btn ghost" href="mailto:${CONFIG.fallbackEmail}?subject=${subj}&body=${body}">✉️ ${u.mailFallback}</a>`;
  }
}

/* ---------- Tela: obrigado ---------- */
function renderDone() {
  const u = L();
  app.innerHTML = `
    <section class="card done anim">
      <div class="confetti" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>
      <h1>${u.doneTitle}</h1>
      <p class="muted">${u.doneText}</p>
      <ol class="steps">${u.steps.map((s) => `<li>${s}</li>`).join("")}</ol>
      <a class="btn" href="../${state.lang === "en" ? "" : state.lang + "/"}">${u.toSite} →</a>
    </section>`;
}

/* =========================================================
   AVALIAÇÃO AUTOMÁTICA (vai no e-mail para a equipe)
   Critérios simples e explicáveis — ajuste os pesos aqui.
   ========================================================= */
function evaluate(a) {
  const pick = (id) => (a[id] && a[id].v) || [];
  const has = (id, opt) => { const v = pick(id); return Array.isArray(v) ? v.includes(opt) : v === opt; };
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

  // Satisfação (1–5; 0 = "não temos")
  const sat = a.sat || {};
  const satVals = Object.values(sat);
  const answeredSat = satVals.filter((v) => v > 0);
  const satAvgAll = satVals.length ? satVals.map((v) => (v === 0 ? 1 : v)).reduce((x, y) => x + y, 0) / satVals.length : 3;
  const satAvg = answeredSat.length ? answeredSat.reduce((x, y) => x + y, 0) / answeredSat.length : null;

  // Clareza de marca
  let brand = { both: 90, mission: 70, slogan: 60, developing: 40, none: 20 }[pick("q5")] ?? 40;
  if (has("q3", "searching")) brand -= 15;
  if (has("q7", "defining")) brand -= 15;
  if (has("q8", "unclear")) brand -= 10;
  if (has("y5", "undefined")) brand -= 10;
  if (pick("values").length >= 3) brand += 10;
  brand = clamp(brand);

  // Maturidade digital
  const pro = ["crm", "erp", "booking", "ecommerce", "automation_tools", "accounting"];
  const toolsPro = pick("tools").filter((x) => pro.includes(x)).length;
  const channels = pick("q4").filter((x) => !["nochannel", "other"].includes(x)).length;
  const hasSite = !!((a.contact || {}).website) || (pick("q19").length && !has("q19", "nosite"));
  const maturity = clamp(((satAvgAll - 1) / 4) * 40 + (hasSite ? 10 : 0) + (Math.min(toolsPro, 3) / 3) * 20 + (has("q4", "nochannel") ? 0 : (Math.min(channels, 3) / 3) * 15) + brand * 0.15);

  // Urgência
  const urgency = { asap: 100, weeks: 80, months: 50, planning: 20 }[pick("start")] ?? 40;

  // Capacidade de investimento (pelo gasto do último ano, convertido para CAD)
  const sp = a.spend;
  let invest = null, spendText = "—";
  if (sp && !sp.notSay) {
    const cad = SPEND_STOPS[sp.idx] * TO_CAD[sp.cur];
    invest = sp.idx === 0 ? 10 : cad < 1000 ? 30 : cad < 4000 ? 50 : cad < 10000 ? 70 : cad < 30000 ? 85 : 95;
    const sym = CURRENCIES[sp.cur];
    const v = SPEND_STOPS[sp.idx].toLocaleString("pt-BR");
    spendText = sp.idx === 0 ? "Nada" : sp.idx === SPEND_STOPS.length - 1 ? `${sym} ${v}+` : `Até ${sym} ${v}`;
  } else if (sp && sp.notSay) spendText = "Preferiu não dizer";

  // Dor = insatisfação
  const pain = satAvg === null ? 50 : clamp(100 - ((satAvg - 1) / 4) * 100);

  // Temperatura do lead
  const temp = clamp(urgency * 0.4 + (invest ?? 45) * 0.3 + pain * 0.3);
  const tempLabel = temp >= 70 ? "🔥 Quente" : temp >= 45 ? "🌤️ Morno" : "❄️ Frio";

  // Serviços sugeridos (linhas da Femik)
  const low = (k) => sat[k] !== undefined && sat[k] <= 2;
  const svc = { Websites: 0, "Tráfego": 0, "Automação": 0, "Análise de Dados": 0 };
  const t = pick("projectType");
  if (t.includes("site_new") || t.includes("redesign") || t.includes("brand")) svc.Websites += 3;
  if (has("q19", "nosite")) svc.Websites += 3;
  if (low("site")) svc.Websites += 2;
  svc.Websites += Math.min(pick("q19").filter((x) => !["nosite", "satisfied", "other"].includes(x)).length, 3);
  if (t.includes("traffic")) svc["Tráfego"] += 3;
  if (low("social")) svc["Tráfego"] += 2;
  if (has("q4", "nochannel")) svc["Tráfego"] += 2;
  if (has("q19", "seo")) svc["Tráfego"] += 2;
  if (has("y1", "clients")) svc["Tráfego"] += 1;
  if (has("y1", "revenue")) svc["Tráfego"] += 1;
  if (has("q22", "seo")) svc["Tráfego"] += 1;
  if (t.includes("automation")) svc["Automação"] += 3;
  if (low("process")) svc["Automação"] += 2;
  if (low("automation")) svc["Automação"] += 2;
  svc["Automação"] += Math.min(pick("timeloss").filter((x) => ["messages", "quotes", "scheduling", "billing", "onboarding"].includes(x)).length, 3);
  if (has("q18", "automate")) svc["Automação"] += 2;
  ["chat", "booking", "crm"].forEach((x) => { if (has("q22", x)) svc["Automação"] += 1; });
  if (has("y1", "organize")) svc["Automação"] += 1;
  if (t.includes("data")) svc["Análise de Dados"] += 3;
  if (low("org")) svc["Análise de Dados"] += 2;
  if (pick("tools").length && pick("tools").every((x) => ["sheets", "paper", "none"].includes(x))) svc["Análise de Dados"] += 1;
  if (has("y3", "predictable")) svc["Análise de Dados"] += 1;
  ["reports", "sales_control"].forEach((x) => { if (has("timeloss", x)) svc["Análise de Dados"] += 1; });
  if (has("q22", "crm")) svc["Análise de Dados"] += 1;
  const services = Object.entries(svc).filter(([, s]) => s > 0).sort((x, y) => y[1] - x[1])
    .map(([name, s]) => `${name} ${s >= 6 ? "★★★" : s >= 3 ? "★★☆" : "★☆☆"}`);

  // Pontos de atenção
  const unsureMap = { q2: ["nostory"], q3: ["searching"], q4: ["nochannel"], q5: ["developing"], y5: ["undefined"], q7: ["defining"], q8: ["unclear"], q10: ["unsure"], q22: ["guidance"], projectType: ["unsure"] };
  const unsure = Object.entries(unsureMap).filter(([q, ids]) => ids.some((id) => has(q, id))).length;
  const alerts = [];
  if (unsure >= 3) alerts.push(`Muitas respostas "ainda não sei" (${unsure}) — vale uma conversa curta de alinhamento antes da proposta`);
  if (pick("q22").length >= 7) alerts.push(`Pediu muitas funcionalidades (${pick("q22").length}) — propor o projeto em fases`);
  if ((has("q22", "store") || has("q22", "payment") || has("q18", "sell")) && invest !== null && invest <= 50) alerts.push("Quer loja/pagamento online, mas o investimento declarado é baixo — apresentar opção enxuta ou em fases");
  if (pick("start") === "asap" && pick("q22").length >= 6) alerts.push("Prazo urgente com escopo grande");
  if (has("q10", "international") || has("y5", "international") || has("q22", "languages")) alerts.push("Interesse internacional — considerar site multilíngue");
  if (t.includes("redesign") && sat.site >= 4) alerts.push("Diz estar satisfeito com o site, mas pede redesign — investigar o motivo real");
  if (pick("q5") === "none") alerts.push("Quer ajuda com missão/slogan — oportunidade de branding");
  if (has("q16", "suggest")) alerts.push("Quer que a Femik proponha a paleta de cores");
  if (state.skipped.length >= 6) alerts.push(`Pulou ${state.skipped.length} perguntas`);

  return { temp, tempLabel, maturity, brand, urgency, invest, pain, services, alerts, spendText, satAvg };
}

/* ---------- Monta o e-mail (sempre em português) ---------- */
function answerPT(q, a) {
  const lab = (list, id) => { const x = list.find((o) => o.id === id); return x ? x.t.pt : id; };
  if (a === undefined || a === null || a === "") return "—";
  if (q.type === "text") return a.trim() || "—";
  if (q.type === "single") return a.v ? (a.v === "other" ? `Outro: ${a.other || "—"}` : lab(q.options, a.v)) : "—";
  if (q.type === "multi") {
    if (!a.v || !a.v.length) return "—";
    let s = a.v.map((id) => (id === "other" ? `Outro: ${a.other || "—"}` : lab(q.options, id))).join(" · ");
    if (a.extra) s += ` | Evitar: ${a.extra}`;
    return s;
  }
  if (q.type === "scale") return q.items.map((it) => `${it.t.pt}: ${a[it.id] === undefined ? "—" : a[it.id] === 0 ? "não tem" : a[it.id] + "/5"}`).join(" · ");
  if (q.type === "spend") {
    const sym = CURRENCIES[a.cur];
    const v = a.notSay ? "Preferiu não dizer" : a.idx === 0 ? "Nada" : a.idx === SPEND_STOPS.length - 1 ? `${sym} ${SPEND_STOPS[a.idx].toLocaleString("pt-BR")}+` : `Até ${sym} ${SPEND_STOPS[a.idx].toLocaleString("pt-BR")}`;
    return v + (a.cats.length ? ` — em: ${a.cats.map((c) => lab(q.categories, c)).join(", ")}` : "");
  }
  return "—";
}

function buildReport() {
  const a = state.answers;
  const c = a.contact || {};
  const ev = evaluate(a);
  const country = COUNTRIES.find((x) => x.id === c.country);
  const mins = state.startedAt ? Math.max(1, Math.round((Date.now() - state.startedAt) / 60000)) : "—";
  const f = {
    _subject: `Briefing Femik — ${c.company || "sem nome"} (${ev.tempLabel.replace(/^\S+\s/, "")})`,
    _template: "table",
    _captcha: "false",
    _replyto: c.email || "",
    _cc: CONFIG.cc,
    _honey: "",
    "🌡️ Temperatura do lead": `${ev.tempLabel} — ${ev.temp}/100`,
    "🧭 Serviços sugeridos": ev.services.join(" · ") || "—",
    "📊 Maturidade digital": `${ev.maturity}/100`,
    "🎨 Clareza de marca": `${ev.brand}/100`,
    "⏰ Urgência": `${ev.urgency}/100`,
    "💰 Capacidade de investimento": ev.invest === null ? "Sem dado" : `${ev.invest}/100 (gasto no último ano: ${ev.spendText})`,
    "😣 Nível de insatisfação": `${ev.pain}/100${ev.satAvg ? ` (média ${ev.satAvg.toFixed(1)}/5)` : ""}`,
    "⚠️ Pontos de atenção": ev.alerts.join(" | ") || "Nenhum",
    Empresa: c.company || "—",
    Contato: c.name || "—",
    "E-mail": c.email || "—",
    WhatsApp: c.whatsapp || "—",
    Site: c.website || "—",
    Instagram: c.instagram || "—",
    "País": country ? country.t.pt : "—",
    "Código de acesso": state.code,
    "Idioma do formulário": UI[state.lang].langName,
    "Tempo de preenchimento": `${mins} min`,
    "Perguntas puladas": state.skipped.length ? state.skipped.join(", ") : "nenhuma",
  };
  visible().forEach((q, i) => {
    const key = `${String(i + 1).padStart(2, "0")}. ${q.title.pt}`;
    f[key] = q.type === "contact" ? "(ver dados acima)" : answerPT(q, a[q.id]);
  });
  f["Dados brutos (JSON — para importar no CRM)"] = JSON.stringify({ code: state.code, lang: state.lang, answers: a, evaluation: ev });

  const text = Object.entries(f).filter(([k]) => !k.startsWith("_") && !k.startsWith("Dados brutos")).map(([k, v]) => `${k}: ${v}`).join("\n");
  return { fields: f, text };
}

/* ---------- Teclado global ---------- */
let keyHandler = null;
document.addEventListener("keydown", (e) => {
  if (screen !== "q") return;
  if (e.key === "Enter" && document.activeElement.tagName !== "TEXTAREA" && !e.isComposing) {
    const b = document.getElementById("nextBtn");
    if (b && document.activeElement.tagName !== "BUTTON") { e.preventDefault(); b.click(); return; }
  }
  if (keyHandler) keyHandler(e);
});

/* ---------- Início ---------- */
document.documentElement.lang = state.lang === "pt" ? "pt-BR" : state.lang;
renderHeader();
try {
  const c = sessionStorage.getItem("femik-form-code");
  if (c && FemikCode.isValid(c)) {
    state.code = c;
    const saved = load();
    if (saved) Object.assign(state, saved);
    screen = state.answers.sentAt ? "done" : "intro";
  }
} catch (_) {}
route();
