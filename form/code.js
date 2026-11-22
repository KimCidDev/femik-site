/* =========================================================
   Femik — códigos de acesso do briefing (formato FMK-XXXX-YY)
   XXXX = 4 caracteres aleatórios · YY = verificação.
   Usado pelo formulário (/form/) e pelo gerador (/form/codigo/).

   Atenção: a verificação acontece no navegador. Ela impede acesso
   casual e erros de digitação, mas não é uma senha forte. Códigos
   únicos com validade virão quando o CRM (Supabase) estiver pronto.
   ========================================================= */
(function () {
  const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem 0, O, 1, I
  const SALT = "femik-r2|";

  function fnv(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
  }
  function check(body) {
    const h = fnv(SALT + body);
    return ALPH[h % 32] + ALPH[(h >>> 5) % 32];
  }
  function normalize(input) {
    let s = String(input || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (s.length > 6 && s.startsWith("FMK")) s = s.slice(3); // aceita colar o código completo
    return s;
  }
  function format(input) {
    const s = normalize(input).slice(0, 6);
    if (!s) return "";
    return "FMK-" + s.slice(0, 4) + (s.length > 4 ? "-" + s.slice(4) : "");
  }
  // só a parte que a pessoa digita: "XXXX-YY"
  function formatBody(input) {
    const s = normalize(input).slice(0, 6);
    return s.length > 4 ? s.slice(0, 4) + "-" + s.slice(4) : s;
  }
  function isValid(input) {
    const s = normalize(input);
    if (s.length !== 6) return false;
    if ([...s].some((c) => !ALPH.includes(c))) return false;
    return check(s.slice(0, 4)) === s.slice(4);
  }
  function generate() {
    const r = new Uint32Array(4);
    crypto.getRandomValues(r);
    const body = [...r].map((n) => ALPH[n % 32]).join("");
    return "FMK-" + body + "-" + check(body);
  }

  window.FemikCode = { isValid, generate, format, formatBody, normalize };
})();
