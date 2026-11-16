#!/usr/bin/env python3
"""
Gera o site da Femik em vários idiomas a partir de um único modelo.

  Modelo:  src/index.template.html   (estrutura da página, com {{chaves}})
  Textos:  i18n/<idioma>.json         (um arquivo por idioma)
  Saída:   index.html (pt), en/index.html, es/index.html, sitemap.xml

Uso:  python tools/build.py
Só usa a biblioteca padrão do Python — nada para instalar.

Para adicionar um idioma: copie i18n/en.json para i18n/<código>.json,
traduza os textos e acrescente o idioma em LANGS abaixo.
"""
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://kimciddev.github.io/femik-site/"

# código -> pasta de saída ("" = raiz). A ordem é a do menu de idiomas.
LANGS = {"pt": "", "en": "en/", "es": "es/"}
X_DEFAULT = "en"  # versão mostrada a quem fala um idioma que não temos

GLOBE = ('<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/>'
         '<path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"/></svg>')
CHEVRON = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'


def flatten(d, prefix=""):
    out = {}
    for k, v in d.items():
        key = f"{prefix}{k}"
        if isinstance(v, dict):
            out.update(flatten(v, key + "."))
        else:
            out[key] = v
    return out


def rel(from_dir, to_dir):
    """Caminho relativo entre duas pastas de saída ('' ou 'en/')."""
    up = "../" * from_dir.count("/")
    return (up + to_dir) or "./"


def auto_lang_script(code, out_dir):
    """
    Só na página principal (raiz): antes de a página aparecer, abre o idioma
    do celular/navegador do visitante, se for um dos que temos.
    Não redireciona: robôs (Google, prévias de link), quem já escolheu um idioma
    e links com ?lang=xx (que também gravam essa escolha).
    Idioma que não temos (ex.: alemão) → X_DEFAULT (inglês).
    """
    if out_dir != "":
        return ""
    targets = {c: rel("", d) for c, d in LANGS.items()}
    return f"""  <script>
  /* Idioma automático — gerado por tools/build.py */
  (function () {{
    var page = "{code}", targets = {json.dumps(targets)};
    try {{
      var q = new URLSearchParams(location.search).get("lang");
      if (q && targets[q]) {{ localStorage.setItem("femik-lang", q); if (q === page) return; }}
      if (/bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegram|preview|lighthouse|headless/i.test(navigator.userAgent)) return;
      var want = q || localStorage.getItem("femik-lang");
      if (!want) {{
        var prefs = navigator.languages || [navigator.language || ""];
        for (var i = 0; i < prefs.length && !want; i++) {{
          var l = String(prefs[i]).slice(0, 2).toLowerCase();
          if (targets[l]) want = l;
        }}
        if (!want) want = "{X_DEFAULT}"; // idioma que não temos → inglês
      }}
      if (want && want !== page && targets[want]) location.replace(targets[want] + location.hash);
    }} catch (e) {{}}
  }})();
  </script>
"""


def main():
    template = (ROOT / "src/index.template.html").read_text(encoding="utf-8")
    texts = {c: json.loads((ROOT / f"i18n/{c}.json").read_text(encoding="utf-8")) for c in LANGS}

    hreflang = "\n".join(
        f'  <link rel="alternate" hreflang="{texts[c]["meta"]["htmlLang"]}" href="{SITE}{d}" />'
        for c, d in LANGS.items()
    ) + f'\n  <link rel="alternate" hreflang="x-default" href="{SITE}{LANGS[X_DEFAULT]}" />'

    for code, out_dir in LANGS.items():
        t = flatten(texts[code])
        root = "../" * out_dir.count("/")

        # menu de idiomas
        items = "\n".join(
            f'        <li><a href="{rel(out_dir, d)}" hreflang="{texts[c]["meta"]["htmlLang"]}" '
            f'lang="{texts[c]["meta"]["htmlLang"]}" data-lang="{c}"'
            + (' aria-current="true"' if c == code else "")
            + f'><b>{texts[c]["meta"]["langShort"]}</b> {texts[c]["meta"]["langName"]}</a></li>'
            for c, d in LANGS.items()
        )
        lang_switch = f'''    <div class="lang">
      <button class="lang-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="{escape(t["nav.langAria"])}">
        {GLOBE}<span>{t["meta.langName"]}</span>{CHEVRON}
      </button>
      <ul class="lang-menu">
{items}
      </ul>
    </div>'''

        og_alt = "\n".join(
            f'  <meta property="og:locale:alternate" content="{texts[c]["meta"]["ogLocale"]}" />'
            for c in LANGS if c != code
        )

        js_strings = {
            "lang": code,
            "msg": texts[code]["js"],
            "langs": {
                c: {"href": rel(out_dir, d), "html": texts[c]["meta"]["htmlLang"], **texts[c]["suggest"]}
                for c, d in LANGS.items()
            },
        }

        special = {
            "@autoLang": auto_lang_script(code, out_dir),
            "@root": root,
            "@pageUrl": SITE + out_dir,
            "@hreflang": hreflang,
            "@ogAlternates": og_alt,
            "@langSwitch": lang_switch,
            "@jsStrings": json.dumps(js_strings, ensure_ascii=False).replace("</", "<\\/"),
        }

        def fill(m):
            key = m.group(1)
            if key in special:
                return special[key]
            if key not in t:
                raise KeyError(f"[{code}] texto ausente: {key}")
            value = str(t[key])
            # valores usados dentro de atributos não podem ter HTML nem aspas
            before = m.string[: m.start()]
            in_attr = before.rfind('="') > before.rfind(">")
            return escape(value) if in_attr else value

        html = re.sub(r"\{\{([@\w.]+)\}\}", fill, template)
        assert "{{" not in html, f"[{code}] sobrou chave sem preencher"
        dest = ROOT / out_dir / "index.html"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(html, encoding="utf-8")
        print(f"ok  {dest.relative_to(ROOT)}")

    # sitemap com as versões de idioma
    urls = []
    for c, d in LANGS.items():
        alts = "".join(
            f'\n    <xhtml:link rel="alternate" hreflang="{texts[o]["meta"]["htmlLang"]}" href="{SITE}{od}"/>'
            for o, od in LANGS.items()
        )
        urls.append(f"  <url>\n    <loc>{SITE}{d}</loc>{alts}\n  </url>")
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + "\n".join(urls) + "\n</urlset>\n",
        encoding="utf-8",
    )
    print("ok  sitemap.xml")


if __name__ == "__main__":
    main()
