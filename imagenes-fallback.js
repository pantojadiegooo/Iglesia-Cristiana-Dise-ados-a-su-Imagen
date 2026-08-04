/**
 * imagenes-fallback.js — Diseñados a su Imagen
 * Uso: <img src="foto.webp" data-fallback="https://ui-avatars.com/...">
 */
(function () {
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => {
      img.src = img.dataset.fallback;
    }, { once: true });
  });
})();
