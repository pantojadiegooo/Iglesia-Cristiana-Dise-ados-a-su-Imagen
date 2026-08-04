/**
 * carga-css.js — Activa las hojas de estilo no críticas.
 * Se cargan como <link rel="preload" as="style"> para no bloquear el
 * renderizado; este script las convierte en <link rel="stylesheet">
 * en cuanto terminan de descargar. Va como script externo (no inline)
 * porque la CSP del sitio no permite 'unsafe-inline' en script-src.
 */
(function () {
  document.querySelectorAll('link[rel="preload"][as="style"][data-defer]').forEach(function (link) {
    if (link.sheet) {
      link.rel = 'stylesheet';
      return;
    }
    link.addEventListener('load', function () {
      link.rel = 'stylesheet';
    }, { once: true });
  });
})();
