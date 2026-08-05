/**
 * carga-css.js — Activa las hojas de estilo no críticas.
 * Se cargan como <link rel="preload" as="style"> para no bloquear el
 * renderizado; este script las convierte en <link rel="stylesheet">
 * en cuanto terminan de descargar. Va como script externo (no inline)
 * porque la CSP del sitio no permite 'unsafe-inline' en script-src.
 *
 * Incluye una red de seguridad: si el evento "load" no se dispara por
 * cualquier razón (inconsistencias de navegador/host), fuerza la
 * activación después de 2s en vez de dejar el CSS descargado pero
 * nunca aplicado.
 */
(function () {
  var links = document.querySelectorAll('link[rel="preload"][as="style"][data-defer]');

  links.forEach(function (link) {
    if (link.sheet) {
      link.rel = 'stylesheet';
      return;
    }
    link.addEventListener('load', function () {
      link.rel = 'stylesheet';
    }, { once: true });
  });

  // Red de seguridad: fuerza la activación de cualquier link que
  // se haya quedado sin activar tras 2 segundos.
  setTimeout(function () {
    links.forEach(function (link) {
      if (link.rel !== 'stylesheet') {
        link.rel = 'stylesheet';
      }
    });
  }, 2000);
})();
