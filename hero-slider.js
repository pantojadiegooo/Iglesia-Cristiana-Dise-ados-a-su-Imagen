/**
 * hero-slider.js — Diseñados a su Imagen
 * Alterna automáticamente entre las vistas del cuadro del hero
 * ("Planear mi visita" y "Quiénes somos"). El botón "Quiénes somos"
 * usa un enlace #ancla normal: el scroll suave ya lo maneja
 * `html { scroll-behavior: smooth }` en estilos.css, sin JS extra.
 */
(function () {
  const slider = document.getElementById('hero-slider');
  if (!slider) return;

  const slides = slider.querySelectorAll('.hero-slide');
  if (slides.length < 2) return;

  const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefiereMovimientoReducido) return; // se queda en la primera vista, sin rotar

  const INTERVALO_MS = 6000;
  let indiceActual = 0;

  setInterval(() => {
    slides[indiceActual].classList.remove('activo');
    indiceActual = (indiceActual + 1) % slides.length;
    slides[indiceActual].classList.add('activo');
  }, INTERVALO_MS);
})();
