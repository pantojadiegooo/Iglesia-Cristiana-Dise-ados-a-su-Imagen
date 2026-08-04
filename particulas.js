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
 */
(function () {
  const canvas = document.getElementById('hero-particulas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ajustarTamano() {
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }

  if (window.innerWidth >= 768) ajustarTamano();

  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) return;
    ajustarTamano();
  });

  const NUM_PARTICULAS = prefiereMovimientoReducido ? 0 : 130;
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
      x: Math.random() * canvas.offsetWidth,
      y: canvas.offsetHeight + Math.random() * 100,
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

    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    particulas.forEach(p => {
      p.y -= p.velocidadY;
      p.x += p.deriva;
      p.fase += p.parpadeo;
      const opacidadFinal = p.opacidad * (0.6 + 0.4 * Math.sin(p.fase));
      if (p.y < -10) {
        Object.assign(p, crearParticula());
        p.y = canvas.offsetHeight + 10;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.paleta.color}, ${opacidadFinal})`;
      ctx.shadowBlur = p.paleta.color === '15, 13, 10' ? 0 : 4;
      ctx.shadowColor = p.paleta.glow;
      ctx.fill();
    });
    if (!prefiereMovimientoReducido) requestAnimationFrame(animar);
  }

  if (window.innerWidth >= 768) animar();
})();
