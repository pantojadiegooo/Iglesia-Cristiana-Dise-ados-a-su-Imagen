// Animaciones compartidas del sitio "Diseñados a su Imagen"
// Hace que los elementos con la clase .reveal aparezcan suavemente
// cuando entran en la pantalla al hacer scroll.
document.addEventListener('DOMContentLoaded', () => {
    const elementos = document.querySelectorAll('.reveal');
    if (!elementos.length) return;

    const observador = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (entrada.isIntersecting) {
                entrada.target.classList.add('visible');
                observador.unobserve(entrada.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    elementos.forEach((el, indice) => {
        // Pequeño retraso escalonado para que las tarjetas de un mismo
        // grupo aparezcan en cascada en lugar de todas a la vez.
        el.style.transitionDelay = `${(indice % 4) * 0.08}s`;
        observador.observe(el);
    });
});
