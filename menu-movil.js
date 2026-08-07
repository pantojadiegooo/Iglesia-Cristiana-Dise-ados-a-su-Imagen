/**
 * menu-movil.js — Diseñados a su Imagen
 * Controla el menú hamburguesa en pantallas móviles (<768px).
 * Autocontenido: no depende de otros scripts del sitio.
 */
(function () {
  const btn = document.getElementById('btn-menu-movil');
  const menu = document.getElementById('menu-links-principal');
  if (!btn || !menu) return;

  function cerrarMenu(devolverFoco) {
    menu.classList.remove('menu-abierto');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú');
    btn.querySelector('i').className = 'fas fa-bars';
    document.body.classList.remove('menu-movil-bloqueo');
    if (devolverFoco) btn.focus();
  }

  function abrirMenu() {
    menu.classList.add('menu-abierto');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Cerrar menú');
    btn.querySelector('i').className = 'fas fa-xmark';
    document.body.classList.add('menu-movil-bloqueo');
    const primerEnlace = menu.querySelector('a');
    if (primerEnlace) primerEnlace.focus();
  }

  btn.addEventListener('click', () => {
    const abierto = menu.classList.contains('menu-abierto');
    if (abierto) cerrarMenu(false); else abrirMenu();
  });

  // Cerrar al hacer clic en un enlace del menú
  menu.querySelectorAll('a').forEach((enlace) => {
    enlace.addEventListener('click', () => cerrarMenu(false));
  });

  // Cerrar con Escape y devolver foco al botón
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu.classList.contains('menu-abierto')) {
      cerrarMenu(true);
    }
  });

  // Cerrar si la ventana se agranda a escritorio
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) cerrarMenu(false);
  });
})();
