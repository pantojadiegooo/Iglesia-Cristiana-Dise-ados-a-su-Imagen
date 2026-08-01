/**
 * animaciones.js — Diseñados a su Imagen
 * Animaciones de scroll-reveal de alto rendimiento.
 *
 * Por qué así (y no scroll-listeners o librerías pesadas):
 * - IntersectionObserver no bloquea el hilo principal (a diferencia de
 *   escuchar 'scroll' y calcular getBoundingClientRect en cada frame).
 * - Cero dependencias externas = cero JS extra que descargar/parsear.
 * - Compatible con Chrome/Safari/Firefox actuales sin polyfill.
 */
(function () {
  const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const elementos = document.querySelectorAll('.reveal');
  if (!elementos.length) return;

  if (prefiereMovimientoReducido) {
    // Respetamos accesibilidad: mostramos todo de inmediato, sin animar.
    elementos.forEach(el => el.classList.add('visible'));
    return;
  }

  const observador = new IntersectionObserver((entradas, obs) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        // Efecto de cascada suave cuando varios elementos entran juntos
        const retraso = entrada.target.dataset.revealDelay || 0;
        setTimeout(() => entrada.target.classList.add('visible'), retraso);
        obs.unobserve(entrada.target); // se anima una sola vez, no repetimos trabajo
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  elementos.forEach((el, i) => {
    // Cascada automática dentro de un mismo grid (máx. 5 pasos para no sentirse lento)
    const contenedorPadre = el.closest('.mvv-grid, .ministerios-grid, .horarios-grid, .foto-grid, .metodos-grid, .values-grid');
    if (contenedorPadre) {
      const hermanos = Array.from(contenedorPadre.children);
      const posicion = hermanos.indexOf(el.closest(':scope > *') || el);
      el.dataset.revealDelay = Math.min(posicion, 5) * 70;
    }
    observador.observe(el);
  });

  // Indicador de lectura activo (scroll-spy) para el menú principal, si existe
  const enlacesMenu = document.querySelectorAll('.menu-links a[href^="#"]');
  if (enlacesMenu.length) {
    const secciones = Array.from(enlacesMenu)
      .map(a => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);

    const spyObservador = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        const id = entrada.target.getAttribute('id');
        const enlace = document.querySelector(`.menu-links a[href="#${id}"]`);
        if (!enlace) return;
        if (entrada.isIntersecting) {
          enlacesMenu.forEach(a => a.classList.remove('activo'));
          enlace.classList.add('activo');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    secciones.forEach(sec => spyObservador.observe(sec));
  }
})();
