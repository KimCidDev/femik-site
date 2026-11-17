"""Gera os QR codes da Femik (PNG + SVG) e confere se cada um é lido corretamente.
Uso: python tools/make_qr.py   (requer OpenCV: cv2)"""
import subprocess, cv2, numpy as np
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "marca/qr"
SITE = "https://kimciddev.github.io/femik-site/"
QRS = {
    "femik-qr-automatico": (SITE, "femik.", "Abre no idioma do celular · Opens in your phone's language"),
    "femik-qr-portugues": (SITE + "pt/", "Português", "Site em português"),
    "femik-qr-english": (SITE + "?lang=en", "English", "Website in English"),
    "femik-qr-espanol": (SITE + "es/", "Español", "Sitio en español"),
}
SYMBOL = (ROOT / "assets/logo/femik-simbolo.svg").read_text()
SYMBOL_INNER = SYMBOL[SYMBOL.index("<defs>"):SYMBOL.rindex("</svg>")]

def matrix(url):
    p = cv2.QRCodeEncoder_Params(); p.correction_level = cv2.QRCodeEncoder_CORRECT_LEVEL_H
    img = cv2.QRCodeEncoder.create(p).encode(url)       # 1 px por módulo, com margem
    return (img < 128)

def svg(mods, title, sub):
    n = mods.shape[0]; cell = 24; qr = n * cell
    m = 3 * cell                      # margem branca extra (o encoder já dá 2 módulos → 5 no total)
    pad = 36 + m; W = qr + 2 * pad
    H = W + 130
    rects = "".join(f'<rect x="{x*cell}" y="{y*cell}" width="{cell}" height="{cell}"/>'
                    for y in range(n) for x in range(n) if mods[y, x])
    logo = qr * 0.2; lx = (qr - logo) / 2
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
  <rect width="{W}" height="{H}" rx="48" fill="#07060F"/>
  <rect x="36" y="36" width="{qr+2*m}" height="{qr+2*m}" rx="32" fill="#FFFFFF"/>
  <g transform="translate({pad} {pad})" fill="#0D0B1E">{rects}
    <rect x="{lx-cell}" y="{lx-cell}" width="{logo+2*cell}" height="{logo+2*cell}" rx="{cell}" fill="#FFFFFF"/>
    <svg x="{lx}" y="{lx}" width="{logo}" height="{logo}" viewBox="0 0 100 100">{SYMBOL_INNER}</svg>
  </g>
  <text x="{W/2}" y="{W+40}" text-anchor="middle" font-family="Inter Display, Inter, Arial, sans-serif" font-weight="700" font-size="56" fill="#F5F3FF">{title}</text>
  <text x="{W/2}" y="{W+90}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="26" fill="#A49FC4">{sub}</text>
</svg>'''

det = cv2.QRCodeDetector()
for name, (url, title, sub) in QRS.items():
    s = svg(matrix(url), title, sub)
    (OUT / f"{name}.svg").write_text(s, encoding="utf-8")
    subprocess.run(["rsvg-convert", "-w", "1600", str(OUT / f"{name}.svg"), "-o", str(OUT / f"{name}.png")], check=True)
    img = cv2.imread(str(OUT / f"{name}.png"))
    data, *_ = det.detectAndDecode(img)
    small = cv2.resize(img, None, fx=0.25, fy=0.25, interpolation=cv2.INTER_AREA)  # simula leitura de longe
    data2, *_ = det.detectAndDecode(small)
    ok = data == url and data2 == url
    print(("OK  " if ok else "ERRO") + f" {name}: lido '{data}'")
    assert ok
