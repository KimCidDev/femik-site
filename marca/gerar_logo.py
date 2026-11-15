"""Gera os arquivos oficiais do logo Femik (SVG com texto em contorno + PNGs)."""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

out = sys.argv[1]
font = TTFont('/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf')
gs, cmap, upm = font.getGlyphSet(), font.getBestCmap(), font['head'].unitsPerEm
SIZE, TRACK = 66, -2  # px, tracking em px
scale = SIZE / upm

def text_paths(text, x0, base):
    x, paths = x0, []
    for ch in text:
        g = gs[cmap[ord(ch)]]
        pen = SVGPathPen(gs)
        g.draw(TransformPen(pen, (scale, 0, 0, -scale, x, base)))
        paths.append((ch, pen.getCommands()))
        x += g.width * scale + TRACK
    return paths, x

MARK_DEFS = '''
    <linearGradient id="fk-top" x1="18" y1="18" x2="82" y2="34" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#7C3AED"/><stop offset="0.55" stop-color="#A855F7"/><stop offset="1" stop-color="#C084FC"/>
    </linearGradient>
    <linearGradient id="fk-bot" x1="18" y1="84" x2="80" y2="42" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3B2BD6"/><stop offset="0.5" stop-color="#2563EB"/><stop offset="1" stop-color="#22D3EE"/>
    </linearGradient>
    <linearGradient id="fk-fold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>'''
MARK = '''
  <path d="M31 17 H75 Q84 17 79.5 24.5 L74 33.5 H18 Z" fill="url(#fk-top)"/>
  <path d="M31 17 H52 L40 33.5 H18 Z" fill="url(#fk-fold)" opacity=".55"/>
  <path d="M31 41 H71 Q80 41 80 50 V55 Q80 64 71 64 H45 V77 Q45 84 38 84 H25 Q18 84 18 77 V54 Q18 41 31 41 Z" fill="url(#fk-bot)"/>
  <path d="M31 41 H58 L45 64 V77 Q45 84 38 84 H25 Q18 84 18 77 V54 Q18 41 31 41 Z" fill="url(#fk-fold)" opacity=".35"/>'''

def wordmark(fill_word, x0=102, base=79):
    paths, xend = text_paths('femik', x0, base)
    dot, xend2 = text_paths('.', xend, base)
    body = '\n'.join(f'  <path d="{d}" fill="{fill_word}"/>' for _, d in paths)
    body += f'\n  <path d="{dot[0][1]}" fill="#22D3EE"/>'
    return body, xend2

def write(name, w, h, defs, body, bg=None):
    rect = f'\n  <rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w*10}" height="{h*10}" role="img" aria-label="Femik">
  <defs>{defs}
  </defs>{rect}{body}
</svg>
'''
    open(f'{out}/{name}', 'w').write(svg)

word_grad = '''
    <linearGradient id="fk-word" x1="100" y1="0" x2="360" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F5F3FF"/><stop offset="1" stop-color="#C7D2FE"/>
    </linearGradient>'''

# símbolo
write('femik-simbolo.svg', 100, 100, MARK_DEFS, MARK)
write('femik-simbolo-fundo-escuro.svg', 100, 100, MARK_DEFS, MARK, bg='#07060F')
# logotipo horizontal — versão clara (para fundo escuro) e escura (para fundo claro)
body, xe = wordmark('url(#fk-word)')
W = round(xe + 14)
write('femik-logo-horizontal.svg', W, 100, MARK_DEFS + word_grad, MARK + '\n' + body)
write('femik-logo-horizontal-fundo-escuro.svg', W, 100, MARK_DEFS + word_grad, MARK + '\n' + body, bg='#07060F')
body_d, _ = wordmark('#0D0B1E')
write('femik-logo-horizontal-texto-escuro.svg', W, 100, MARK_DEFS, MARK + '\n' + body_d)
print('width', W)
