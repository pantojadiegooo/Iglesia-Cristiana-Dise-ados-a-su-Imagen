/* =========================================================
   ACCESIBILIDAD — Diseñados a su Imagen
   WCAG 2.2 AA
   ========================================================= */

(() => {
    'use strict';

    document.addEventListener('DOMContentLoaded', () => {

        /* -------------------------------------------------
           1. Canvas decorativo
           ------------------------------------------------- */

        const canvas = document.getElementById('hero-particulas');

        if (canvas) {
            canvas.setAttribute('aria-hidden', 'true');
        }


        /* -------------------------------------------------
           2. Menú móvil
           Mantiene la lógica existente y únicamente
           mejora el nombre accesible del botón.
           ------------------------------------------------- */

        const menuButton = document.getElementById('btn-menu-movil');

        if (menuButton) {

            const updateMenuLabel = () => {
                const expanded =
                    menuButton.getAttribute('aria-expanded') === 'true';

                menuButton.setAttribute(
                    'aria-label',
                    expanded ? 'Cerrar menú' : 'Abrir menú'
                );
            };

            updateMenuLabel();

            const observer = new MutationObserver(updateMenuLabel);

            observer.observe(menuButton, {
                attributes: true,
                attributeFilter: ['aria-expanded']
            });
        }


        /* -------------------------------------------------
           3. Enlaces externos que abren nueva pestaña
           ------------------------------------------------- */

        document
            .querySelectorAll('a[target="_blank"]')
            .forEach(link => {

                const rel = new Set(
                    (link.getAttribute('rel') || '')
                        .split(/\s+/)
                        .filter(Boolean)
                );

                rel.add('noopener');
                rel.add('noreferrer');

                link.setAttribute(
                    'rel',
                    [...rel].join(' ')
                );

                /*
                 * Añadimos información accesible únicamente
                 * cuando el enlace todavía no la tiene.
                 */

                if (!link.hasAttribute('aria-label')) {

                    const text = link.textContent.trim();

                    if (!text) {
                        const image = link.querySelector('img');

                        if (image && image.alt) {
                            link.setAttribute(
                                'aria-label',
                                `${image.alt} (abre en una nueva pestaña)`
                            );
                        }
                    }
                }
            });


        /* -------------------------------------------------
           4. Evitar que elementos puramente decorativos
              sean anunciados por lectores de pantalla.
           ------------------------------------------------- */

        document
            .querySelectorAll(
                '.hero-mesh, .hero-vignette, .destello-prisma'
            )
            .forEach(element => {
                element.setAttribute('aria-hidden', 'true');
            });


        /* -------------------------------------------------
           5. Imágenes sin alt
           Solo corregimos imágenes que realmente estén
           sin atributo. Nunca sobrescribimos alt existente.
           ------------------------------------------------- */

        document
            .querySelectorAll('img:not([alt])')
            .forEach(image => {
                image.setAttribute('alt', '');
            });


        /* -------------------------------------------------
           6. Iconos Font Awesome sin nombre accesible
           Los iconos dentro de controles ya deben ser
           decorativos porque el control tiene su propio
           nombre.
           ------------------------------------------------- */

        document
            .querySelectorAll(
                'button i[class*="fa-"], a i[class*="fa-"]'
            )
            .forEach(icon => {
                icon.setAttribute('aria-hidden', 'true');
            });


        /* -------------------------------------------------
           7. Evitar autofocus inesperado
           ------------------------------------------------- */

        document
            .querySelectorAll('[autofocus]')
            .forEach(element => {
                element.removeAttribute('autofocus');
            });

    });

})();
