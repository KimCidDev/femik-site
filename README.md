# Femik — site institucional

Site da **Femik**, estúdio digital para empresas em crescimento:
presença (sites e sistemas web), automação de processos, análise de dados e mídias digitais —
tudo integrado num único método.

- **Link público (GitHub Pages):**
  - Português: https://kimciddev.github.io/femik-site/
  - English: https://kimciddev.github.io/femik-site/en/
  - Español: https://kimciddev.github.io/femik-site/es/
- **Estado:** protótipo (v0.1) — publicado no GitHub Pages, em validação

## Seções
1. Loading rápido com o logo em 3D (Three.js; se o WebGL falhar, mostra o logo em SVG)
2. Hero com carrossel de serviços (autoplay, setas, pontos e gesto de arrastar no celular)
3. Quem somos, com infográfico do Método Femik (Diagnóstico → Presença → Automação → Dados)
4. Depoimentos (**exemplos** — trocar por relatos reais antes da versão final)
5. Conecte-se conosco: formulário que monta a mensagem e abre o WhatsApp + botão flutuante

## Idiomas
O site existe em **português, inglês e espanhol**, cada um numa página estática própria
(`/`, `/en/`, `/es/`). Assim o Google indexa cada idioma e a prévia do link no WhatsApp
aparece no idioma do link compartilhado.

- Seletor de idioma no cabeçalho (ícone de globo), visível também no celular.
- Quem chega com o navegador noutro idioma disponível vê uma sugestão discreta para trocar.
- Formulário e mensagens do WhatsApp saem no idioma da página.
- Para idiomas que não temos, o navegador do visitante oferece tradução automática.

**Como editar textos:** não edite `index.html`, `en/index.html` nem `es/index.html` à mão,
porque eles são gerados.
1. Textos: `i18n/pt.json`, `i18n/en.json`, `i18n/es.json`
2. Estrutura da página: `src/index.template.html`
3. Gere as páginas: `python tools/build.py` (Python 3, sem instalar nada)

**Novo idioma:** copie `i18n/en.json` para `i18n/<código>.json`, traduza e acrescente o
código em `LANGS` no topo de `tools/build.py`.

## Como abrir
Site estático, sem build. Para testar localmente:

```bash
python -m http.server 8080
# abra http://localhost:8080
```

(Abrir o `index.html` direto com duplo clique também funciona, exceto o logo 3D,
que precisa de servidor por usar módulos JavaScript.)

## Onde mudar o quê
| O quê | Arquivo |
|---|---|
| Número do WhatsApp | `js/main.js` → `CONFIG` (no topo) |
| Mensagens do WhatsApp | `i18n/*.json` → `js` |
| E-mail de contato | `src/index.template.html` → seção `#contact` |
| Textos e serviços | `i18n/*.json` (depois `python tools/build.py`) |
| Cores e estilos | `css/style.css` → variáveis em `:root` |
| Logo 3D do loading | `js/logo3d.js` |

## Estrutura
```
index.html        página em português (gerada)
en/ · es/         páginas em inglês e espanhol (geradas)
src/              modelo da página
i18n/             textos de cada idioma
tools/build.py    gera as páginas e o sitemap.xml
css/style.css
js/main.js        interações (loader, carrossel, menu, WhatsApp)
js/logo3d.js      logo 3D (Three.js via CDN jsDelivr)
assets/logo/      logos usados pelo site + imagem de compartilhamento
marca/            kit de marca: SVG (texto em contorno) e PNG em alta (4096/8192 px)
```

## Identidade
- Paleta: fundo `#07060F` / `#0D0B1E`, roxo `#7C3AED` `#A855F7`, índigo `#6366F1`, azul `#2563EB`, ciano `#22D3EE`
- Tipografia do site: Sora (títulos) e Manrope (texto). Logotipo: Inter Display Bold convertida em contorno.
