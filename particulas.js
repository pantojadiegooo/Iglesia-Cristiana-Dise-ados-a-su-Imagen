/**
 * particulas.js — Diseñados a su Imagen
 * Animación de partículas doradas del hero (canvas #hero-particulas).
 * Antes estaba duplicada e inline en index.html, visita.html,
 * pastor-manuel.html, pastor-guadalupe.html y donaciones.html.
 * Ahora vive en un solo archivo externo (requisito para poder quitar
 * 'unsafe-inline' de script-src en la CSP).
 *
 * Se desactiva en pantallas < 768px por rendimiento, y respeta
 * prefers-reduced-motion.
 *
 * Nota de rendimiento: el ancho/alto del canvas se cachea en
 * anchoCanvas/altoCanvas y solo se vuelve a leer en resize, en vez de
 * leer canvas.offsetWidth/offsetHeight en cada frame de la animación
 * (eso forzaba un reflow de ~210ms por el layout thrashing).
 */
(function () {
  const canvas = document.getElementById('hero-particulas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let anchoCanvas = 0;
  let altoCanvas = 0;

  function ajustarTamano() {
    anchoCanvas = canvas.offsetWidth;
    altoCanvas = canvas.offsetHeight;
    canvas.width = anchoCanvas * devicePixelRatio;
    canvas.height = altoCanvas * devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  if (window.innerWidth >= 768) ajustarTamano();

  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) return;
    ajustarTamano();
  });

  // ====== SPRITES PRE-RENDERIZADOS ======
  // Antes: cada partícula dorada/blanca usaba ctx.shadowBlur + ctx.shadowColor
  // en CADA frame, lo que fuerza al motor de Canvas2D a recalcular un blur
  // por forma dibujada (operación muy costosa, era el principal Long Task
  // detectado en desktop). Ahora ese halo se dibuja UNA sola vez sobre un
  // canvas offscreen (sprite) y en cada frame solo se hace drawImage()
  // escalado, que es una copia de píxeles barata. El resultado visual es
  // el mismo halo difuminado, sin recalcularlo 90 veces por frame.
  function crearSpriteGlow(colorRGB) {
    const tam = 48;
    const off = document.createElement('canvas');
    off.width = tam;
    off.height = tam;
    const octx = off.getContext('2d');
    const centro = tam / 2;
    const grad = octx.createRadialGradient(centro, centro, 0, centro, centro, centro);
    grad.addColorStop(0, `rgba(${colorRGB}, 1)`);
    grad.addColorStop(0.35, `rgba(${colorRGB}, 0.85)`);
    grad.addColorStop(1, `rgba(${colorRGB}, 0)`);
    octx.fillStyle = grad;
    octx.fillRect(0, 0, tam, tam);
    return off;
  }

  const spritesGlow = {
    '212, 175, 55': crearSpriteGlow('212, 175, 55'),
    '255, 255, 255': crearSpriteGlow('255, 255, 255')
  };

  const NUM_PARTICULAS = prefiereMovimientoReducido ? 0 : 90;
  const particulas = [];
  const PALETAS = [
    { color: '212, 175, 55', glow: 'rgba(212, 175, 55, 0.6)', peso: 0.45 },
    { color: '255, 255, 255', glow: 'rgba(255, 255, 255, 0.5)', peso: 0.35 },
    { color: '15, 13, 10', glow: 'rgba(0, 0, 0, 0.4)', peso: 0.20 }
  ];

  function elegirPaleta() {
    const r = Math.random();
    let acumulado = 0;
    for (const p of PALETAS) {
      acumulado += p.peso;
      if (r <= acumulado) return p;
    }
    return PALETAS[0];
  }

  function crearParticula() {
    const paleta = elegirPaleta();
    const esNegra = paleta.color === '15, 13, 10';
    return {
      x: Math.random() * anchoCanvas,
      y: altoCanvas + Math.random() * 100,
      radio: esNegra ? (Math.random() * 3 + 1.5) : (Math.random() * 1.8 + 0.6),
      velocidadY: Math.random() * 0.35 + 0.12,
      deriva: Math.random() * 0.4 - 0.2,
      opacidad: esNegra ? (Math.random() * 0.3 + 0.15) : (Math.random() * 0.5 + 0.15),
      parpadeo: Math.random() * 0.02 + 0.005,
      fase: Math.random() * Math.PI * 2,
      paleta
    };
  }

  if (window.innerWidth >= 768) {
    for (let i = 0; i < NUM_PARTICULAS; i++) particulas.push(crearParticula());
  }

  function animar() {
    if (window.innerWidth < 768) return;

    ctx.clearRect(0, 0, anchoCanvas, altoCanvas);
    particulas.forEach(p => {
      p.y -= p.velocidadY;
      p.x += p.deriva;
      p.fase += p.parpadeo;
      const opacidadFinal = p.opacidad * (0.6 + 0.4 * Math.sin(p.fase));
      if (p.y < -10) {
        Object.assign(p, crearParticula());
        p.y = altoCanvas + 10;
      }
      const sprite = spritesGlow[p.paleta.color];
      if (sprite) {
        // Partículas doradas/blancas: sprite con halo pre-renderizado (drawImage, sin blur en vivo)
        const diametro = p.radio * 2 + 8; // núcleo + halo, equivalente visual al shadowBlur de 4px anterior
        ctx.globalAlpha = opacidadFinal;
        ctx.drawImage(sprite, p.x - diametro / 2, p.y - diametro / 2, diametro, diametro);
        ctx.globalAlpha = 1;
      } else {
        // Partícula negra: nunca tuvo shadowBlur (ya era barata), se mantiene igual
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.paleta.color}, ${opacidadFinal})`;
        ctx.fill();
      }
    });
    if (!prefiereMovimientoReducido) requestAnimationFrame(animar);
  }

  if (window.innerWidth >= 768) animar();
})();
