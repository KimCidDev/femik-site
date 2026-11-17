# Femik — site institucional

Site da **Femik**, estúdio digital para empresas em crescimento:
presença (sites e sistemas web), automação de processos, análise de dados e mídias digitais —
tudo integrado num único método.

- **Link público (GitHub Pages):**
  - English (padrão): https://kimciddev.github.io/femik-site/
  - Português: https://kimciddev.github.io/femik-site/pt/
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
(`/` em inglês, `/pt/`, `/es/`). Assim o Google indexa cada idioma e a prévia do link no WhatsApp
aparece no idioma do link compartilhado.

- **Inglês por regra:** o endereço principal é a versão em inglês. Se algo falhar
  (JavaScript bloqueado, navegador dentro de um app), o visitante vê inglês.
- **Idioma automático:** se o celular/navegador estiver em português ou espanhol, a página
  principal abre direto `/pt/` ou `/es/`, antes de aparecer. Qualquer outro idioma
  (hindi, chinês, alemão…) fica no inglês. Não redireciona robôs (Google, prévias de link),
  quem já escolheu um idioma, nem links com `?lang=en|pt|es`, que também fixam a escolha.
- Links diretos `/pt/` e `/es/` são sempre respeitados. Links antigos `/en/` levam à raiz.
- Seletor no cabeçalho com globo + nome do idioma ("English", "Español", "Português"),
  visível também no celular. Sem bandeiras: bandeira indica país, não idioma.
- Formulário e mensagens do WhatsApp saem no idioma da página.
- Para idiomas que não temos, o navegador do visitante oferece tradução automática.

**Como editar textos:** não edite `index.html`, `pt/index.html` nem `es/index.html` à mão,
porque eles são gerados.
1. Textos: `i18n/pt.json`, `i18n/en.json`, `i18n/es.json`
2. Estrutura da página: `src/index.template.html`
3. Gere as páginas: `python tools/build.py` (Python 3, sem instalar nada)

**QR codes** (`marca/qr/`): `femik-qr-automatico` abre no idioma do celular de quem escaneia;
os outros fixam português, inglês ou espanhol. Para gerar de novo (ex.: após mudar o domínio):
`python tools/make_qr.py` (requer OpenCV). O script confere a leitura de cada QR.

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
index.html        página em inglês, padrão (gerada)
pt/ · es/         páginas em português e espanhol (geradas)
en/               só redireciona links antigos para a raiz
src/              modelo da página
i18n/             textos de cada idioma
tools/build.py    gera as páginas, o idioma automático e o sitemap.xml
tools/make_qr.py  gera e confere os QR codes
css/style.css
js/main.js        interações (loader, carrossel, menu, WhatsApp)
js/logo3d.js      logo 3D (Three.js via CDN jsDelivr)
assets/logo/      logos usados pelo site + imagem de compartilhamento
marca/            kit de marca (e marca/qr/ com os QR codes): SVG (texto em contorno) e PNG em alta (4096/8192 px)
```

## Identidade
- Paleta: fundo `#07060F` / `#0D0B1E`, roxo `#7C3AED` `#A855F7`, índigo `#6366F1`, azul `#2563EB`, ciano `#22D3EE`
- Tipografia do site: Sora (títulos) e Manrope (texto). Logotipo: Inter Display Bold convertida em contorno.
