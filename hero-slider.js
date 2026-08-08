/**
 * hero-slider.js — Diseñados a su Imagen
 * Carrusel automático del hero: la vista activa se desliza hacia la
 * izquierda y sale, mientras la siguiente entra desde la derecha
 * (translateX real, no solo un cambio de opacidad).
 *
 * El botón "Quiénes somos" usa un enlace #ancla normal: el scroll
 * suave ya lo maneja `html { scroll-behavior: smooth }` en estilos.css.
 *
 * Accesibilidad (WCAG 2.2.2 Pausable, nivel A):
 * - Botón #hero-slider-pausa permite detener/reanudar la rotación
 *   automática en cualquier momento.
 * - Los .hero-slide sin la clase .activo quedan con aria-hidden="true"
 *   y sus enlaces/botones internos con tabindex="-1", para que no sean
 *   alcanzables por teclado ni anunciados por lectores de pantalla
 *   mientras están fuera de vista (aunque visualmente translateX los
 *   saque del viewport, seguían siendo focuseables antes de este cambio).
 */
(function () {
  const slider = document.getElementById('hero-slider');
  if (!slider) return;

  const slides = Array.from(slider.querySelectorAll('.hero-slide'));
  if (slides.length < 2) return;

  const DURACION_MS = 800; // debe coincidir con la transición en dinamico.css
  const INTERVALO_MS = 6000;

  const btnPausa = document.getElementById('hero-slider-pausa');
  const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function actualizarAccesibilidadSlides() {
    slides.forEach((slide) => {
      const activo = slide.classList.contains('activo');
      slide.setAttribute('aria-hidden', activo ? 'false' : 'true');
      slide.querySelectorAll('a, button').forEach((el) => {
        if (activo) {
          el.removeAttribute('tabindex');
        } else {
          el.setAttribute('tabindex', '-1');
        }
      });
    });
  }

  let indiceActual = slides.findIndex((s) => s.classList.contains('activo'));
  if (indiceActual === -1) indiceActual = 0;

  actualizarAccesibilidadSlides();

  let intervalo = null;
  let pausado = prefiereMovimientoReducido; // respeta reduced-motion: arranca pausado

  function avanzar() {
    const anterior = slides[indiceActual];
    const siguiente = slides[(indiceActual + 1) % slides.length];

    anterior.classList.remove('activo');
    anterior.classList.add('saliente');
    siguiente.classList.add('activo');
    actualizarAccesibilidadSlides();

    // Cuando termina de salir, la regresamos a su posición de espera
    // (a la derecha) SIN animación, lista para el siguiente ciclo.
    // Doble rAF: el navegador aplica 'sin-transicion' en su propio ciclo
    // de estilos, sin que JS tenga que forzar un reflow síncrono.
    setTimeout(() => {
      anterior.classList.add('sin-transicion');
      anterior.classList.remove('saliente');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          anterior.classList.remove('sin-transicion');
        });
      });
    }, DURACION_MS);

    indiceActual = (indiceActual + 1) % slides.length;
  }

  function iniciar() {
    if (intervalo) return;
    intervalo = setInterval(avanzar, INTERVALO_MS);
  }

  function detener() {
    clearInterval(intervalo);
    intervalo = null;
  }

  function actualizarBotonPausa() {
    if (!btnPausa) return;
    btnPausa.setAttribute('aria-pressed', pausado ? 'true' : 'false');
    btnPausa.setAttribute(
      'aria-label',
      pausado ? 'Reanudar carrusel automático' : 'Pausar carrusel automático'
    );
    const icono = btnPausa.querySelector('i');
    if (icono) icono.className = pausado ? 'fas fa-play' : 'fas fa-pause';
  }

  if (btnPausa) {
    btnPausa.addEventListener('click', () => {
      pausado = !pausado;
      if (pausado) {
        detener();
      } else {
        iniciar();
      }
      actualizarBotonPausa();
    });
  }

  actualizarBotonPausa();

  if (!pausado) iniciar();
})();
