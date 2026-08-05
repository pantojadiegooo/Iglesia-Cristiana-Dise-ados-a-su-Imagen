/**
 * menu-movil.js — Diseñados a su Imagen
 * Controla el menú hamburguesa en pantallas móviles (<768px).
 * Autocontenido: no depende de otros scripts del sitio.
 */
(function () {
  const btn = document.getElementById('btn-menu-movil');
  const menu = document.getElementById('menu-links-principal');
  if (!btn || !menu) return;

  function cerrarMenu() {
    menu.classList.remove('menu-abierto');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menú');
    btn.querySelector('i').className = 'fas fa-bars';
  }

  function abrirMenu() {
    menu.classList.add('menu-abierto');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', 'Cerrar menú');
    btn.querySelector('i').className = 'fas fa-xmark';
  }

  btn.addEventListener('click', () => {
    const abierto = menu.classList.contains('menu-abierto');
    if (abierto) cerrarMenu(); else abrirMenu();
  });

  // Cerrar al hacer clic en un enlace del menú
  menu.querySelectorAll('a').forEach((enlace) => {
    enlace.addEventListener('click', cerrarMenu);
  });

  // Cerrar si la ventana se agranda a escritorio
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) cerrarMenu();
  });
})();
