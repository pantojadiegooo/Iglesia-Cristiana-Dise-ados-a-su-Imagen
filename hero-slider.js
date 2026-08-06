/**
 * hero-slider.js — Diseñados a su Imagen
 * Carrusel automático del hero: la vista activa se desliza hacia la
 * izquierda y sale, mientras la siguiente entra desde la derecha
 * (translateX real, no solo un cambio de opacidad).
 *
 * El botón "Quiénes somos" usa un enlace #ancla normal: el scroll
 * suave ya lo maneja `html { scroll-behavior: smooth }` en estilos.css.
 */
(function () {
  const slider = document.getElementById('hero-slider');
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll('.hero-slide'));
  if (slides.length < 2) return;

  const DURACION_MS = 800; // debe coincidir con la transición en dinamico.css

  function ajustarAltura() {
    const alturas = slides.map((s) => s.scrollHeight);
    slider.style.height = Math.max(...alturas) + 'px';
  }

  ajustarAltura();
  window.addEventListener('resize', ajustarAltura);

  const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefiereMovimientoReducido) return; // se queda en la primera vista, sin rotar

  const INTERVALO_MS = 6000;
  let indiceActual = slides.findIndex((s) => s.classList.contains('activo'));
  if (indiceActual === -1) indiceActual = 0;

  setInterval(() => {
    const anterior = slides[indiceActual];
    const siguiente = slides[(indiceActual + 1) % slides.length];

    anterior.classList.remove('activo');
    anterior.classList.add('saliente');
    siguiente.classList.add('activo');

    // Cuando termina de salir, la regresamos a su posición de espera
    // (a la derecha) SIN animación, lista para el siguiente ciclo.
    setTimeout(() => {
      anterior.classList.add('sin-transicion');
      anterior.classList.remove('saliente');
      void anterior.offsetWidth; // fuerza reflow para aplicar el reseteo sin transición
      anterior.classList.remove('sin-transicion');
    }, DURACION_MS);

    indiceActual = (indiceActual + 1) % slides.length;
  }, INTERVALO_MS);
})();
