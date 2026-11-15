/* =========================================================
   Femik — logo 3D da tela de carregamento (Three.js)
   Usa as mesmas formas do arquivo assets/logo/femik-simbolo.svg,
   extrudadas em 3D, com degradê roxo → azul → ciano.
   Se o WebGL ou o CDN falharem, o SVG continua visível.
   ========================================================= */
import * as THREE from "three";

const canvas = document.getElementById("logo3d");
const stage = canvas.parentElement;

try {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 9.5);

  // ---- formas (coordenadas do SVG 0–100, y invertido e centralizado) ----
  const S = 0.05; // escala SVG → mundo
  const P = (x, y) => [(x - 49) * S, -(y - 50.5) * S];

  function top() {
    const s = new THREE.Shape();
    s.moveTo(...P(31, 17));
    s.lineTo(...P(75, 17));
    s.quadraticCurveTo(...P(84, 17), ...P(79.5, 24.5));
    s.lineTo(...P(74, 33.5));
    s.lineTo(...P(18, 33.5));
    s.closePath();
    return s;
  }
  function body() {
    const s = new THREE.Shape();
    s.moveTo(...P(31, 41));
    s.lineTo(...P(71, 41));
    s.quadraticCurveTo(...P(80, 41), ...P(80, 50));
    s.lineTo(...P(80, 55));
    s.quadraticCurveTo(...P(80, 64), ...P(71, 64));
    s.lineTo(...P(45, 64));
    s.lineTo(...P(45, 77));
    s.quadraticCurveTo(...P(45, 84), ...P(38, 84));
    s.lineTo(...P(25, 84));
    s.quadraticCurveTo(...P(18, 84), ...P(18, 77));
    s.lineTo(...P(18, 54));
    s.quadraticCurveTo(...P(18, 41), ...P(31, 41));
    return s;
  }

  const extrude = {
    depth: 0.55, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06,
    bevelSegments: 4, curveSegments: 16,
  };

  // degradê por vértice (diagonal), como no logo 2D
  function paint(geo, stops) {
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const pos = geo.attributes.position;
    const cols = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    const cs = stops.map((h) => new THREE.Color(h));
    for (let k = 0; k < pos.count; k++) {
      const tx = (pos.getX(k) - bb.min.x) / (bb.max.x - bb.min.x);
      const ty = (pos.getY(k) - bb.min.y) / (bb.max.y - bb.min.y);
      let t = Math.min(1, Math.max(0, tx * 0.65 + ty * 0.35));
      const seg = t * (cs.length - 1);
      const n = Math.min(cs.length - 2, Math.floor(seg));
      c.copy(cs[n]).lerp(cs[n + 1], seg - n);
      cols.set([c.r, c.g, c.b], k * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(cols, 3));
    return geo;
  }

  const mat = () => new THREE.MeshPhysicalMaterial({
    vertexColors: true, metalness: 0.15, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15,
    emissive: 0x1a0f3a, emissiveIntensity: 0.6,
  });

  const logo = new THREE.Group();
  const topMesh = new THREE.Mesh(paint(new THREE.ExtrudeGeometry(top(), extrude), ["#7C3AED", "#A855F7", "#C084FC"]), mat());
  const bodyMesh = new THREE.Mesh(paint(new THREE.ExtrudeGeometry(body(), extrude), ["#3B2BD6", "#2563EB", "#22D3EE"]), mat());
  [topMesh, bodyMesh].forEach((m) => { m.geometry.translate(0, 0, -extrude.depth / 2); logo.add(m); });
  scene.add(logo);

  // ---- luzes nas cores da marca ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 6); scene.add(key);
  const violet = new THREE.PointLight(0xa855f7, 40, 20); violet.position.set(-4, 3, 3); scene.add(violet);
  const cyan = new THREE.PointLight(0x22d3ee, 40, 20); cyan.position.set(4, -3, 3); scene.add(cyan);

  // ---- animação: entra girando, depois balança suave ----
  const t0 = performance.now();
  let running = true;
  const ease = (x) => 1 - Math.pow(1 - x, 3);

  function frame(now) {
    if (!running) return;
    const t = (now - t0) / 1000;
    const intro = ease(Math.min(1, t / 1.3));
    logo.rotation.y = (1 - intro) * Math.PI * 1.5 + Math.sin(t * 1.6) * 0.35 * intro;
    logo.rotation.x = Math.sin(t * 1.1) * 0.12;
    logo.scale.setScalar(0.6 + 0.4 * intro);
    violet.position.x = Math.sin(t * 1.4) * 4;
    cyan.position.x = -Math.sin(t * 1.4) * 4;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  stage.classList.add("has-3d");

  // libera a GPU depois que o loader some
  window.addEventListener("femik:loaded", () => setTimeout(() => {
    running = false;
    renderer.dispose();
  }, 800));
} catch (err) {
  console.warn("Logo 3D indisponível, usando SVG:", err);
}
