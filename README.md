# Femik — site institucional

Site da **Femik**, estúdio de crescimento digital para pequenas e médias empresas:
presença (sites e portais), automação de processos, análise de dados e mídias digitais —
tudo integrado num único método.

- **Link público (GitHub Pages):** https://kimciddev.github.io/femik-site/
- **Estado:** protótipo (v0.1) — em validação

## Seções
1. Loading rápido com o logo em 3D (Three.js; se o WebGL falhar, mostra o logo em SVG)
2. Hero com carrossel de serviços (autoplay, setas, pontos e gesto de arrastar no celular)
3. Quem somos, com infográfico do Método Femik (Diagnóstico → Presença → Automação → Dados)
4. Depoimentos (**exemplos** — trocar por relatos reais antes da versão final)
5. Conecte-se conosco: formulário que monta a mensagem e abre o WhatsApp + botão flutuante

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
| Número do WhatsApp e mensagem padrão | `js/main.js` → `CONFIG` (no topo) |
| E-mail de contato | `index.html` → seção `#contato` |
| Textos e serviços | `index.html` |
| Cores e estilos | `css/style.css` → variáveis em `:root` |
| Logo 3D do loading | `js/logo3d.js` |

## Estrutura
```
index.html
css/style.css
js/main.js        interações (loader, carrossel, menu, WhatsApp)
js/logo3d.js      logo 3D (Three.js via CDN jsDelivr)
assets/logo/      logos usados pelo site + imagem de compartilhamento
marca/            kit de marca: SVG (texto em contorno) e PNG em alta (4096/8192 px)
```

## Identidade
- Paleta: fundo `#07060F` / `#0D0B1E`, roxo `#7C3AED` `#A855F7`, índigo `#6366F1`, azul `#2563EB`, ciano `#22D3EE`
- Tipografia do site: Sora (títulos) e Manrope (texto). Logotipo: Inter Display Bold convertida em contorno.
