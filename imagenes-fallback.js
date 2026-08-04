/**
 * imagenes-fallback.js — Diseñados a su Imagen
 * Reemplaza los atributos onerror="" inline (fotos de pastores,
 * código QR de donaciones). Los atributos on* también cuentan como
 * script inline para la CSP y se bloquean junto con 'unsafe-inline'.
 *
 * Uso en el HTML:
 *   <img src="foto.webp" data-fallback="https://ui-avatars.com/...">
 */
(function () {
  document.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => {
      img.src = img.dataset.fallback;
    }, { once: true });
  });
})();
