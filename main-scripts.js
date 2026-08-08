/**
 * main-scripts.js — Diseñados a su Imagen (solo index.html)
 * Google Tag Manager, slider de pastores y envío del formulario de
 * contacto con verificación Turnstile.
 */

// GTM solo se carga si el usuario aceptó cookies.
window.cargarGTM = function () {
  if (window._gtmCargado) return;
  window._gtmCargado = true;
  (function (w, d, s, l, i) {
    w[l] = w[l] || [];
    w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    const f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != 'dataLayer' ? '&l=' + l : '';
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
    f.parentNode.insertBefore(j, f);
  })(window, document, 'script', 'dataLayer', 'GTM-NT774S3Z');
};

if (localStorage.getItem('consentimientoCookies') === 'aceptadas') {
  window.cargarGTM();
}

// Turnstile (verificación del formulario de contacto): antes se cargaba
// incondicionalmente en el <head> en cada visita, aunque el usuario nunca
// llegara al formulario. Se difiere hasta que la sección #contacto esté
// cerca del viewport. rootMargin amplio (600px) para que el script ya
// esté listo y el widget renderizado cuando el usuario realmente llegue
// a la sección, sin introducir un hueco visible. Turnstile detecta y
// renderiza automáticamente el <div class="cf-turnstile"> ya presente en
// el HTML en cuanto su script carga, sin necesidad de llamarlo a mano.
document.addEventListener('DOMContentLoaded', () => {
  const seccionContacto = document.getElementById('contacto');
  if (!seccionContacto) return;

  let turnstileCargado = false;
  function cargarTurnstile() {
    if (turnstileCargado) return;
    turnstileCargado = true;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  const observadorContacto = new IntersectionObserver((entradas, obs) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        cargarTurnstile();
        obs.disconnect();
      }
    });
  }, { rootMargin: '600px 0px 600px 0px' });

  observadorContacto.observe(seccionContacto);
});

document.addEventListener('DOMContentLoaded', () => {
  const btnIzq = document.querySelector('.slider-flecha-izq');
  const btnDer = document.querySelector('.slider-flecha-der');
  const slider = document.querySelector('.pastores-slider');

  if (btnIzq && slider) {
    btnIzq.addEventListener('click', () => slider.scrollBy({ left: -600, behavior: 'smooth' }));
  }
  if (btnDer && slider) {
    btnDer.addEventListener('click', () => slider.scrollBy({ left: 600, behavior: 'smooth' }));
  }

  const formContacto = document.getElementById('formulario-contacto');
  if (formContacto) {
    formContacto.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('nombre-usuario').value;
      const correo = document.getElementById('correo-usuario').value;
      const mensaje = document.getElementById('mensaje-usuario').value;

      const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
      const botonSubmit = e.target.querySelector('button[type="submit"]');
      const textoOriginalBoton = botonSubmit.innerText;
      const cajaMensaje = document.getElementById('mensaje-estado');

      cajaMensaje.textContent = '';
      cajaMensaje.className = 'mensaje-estado';

      if (!turnstileToken) {
        cajaMensaje.textContent = 'Por favor, completa la verificación de seguridad.';
        cajaMensaje.className = 'mensaje-estado mensaje-estado--error';
        return;
      }

      botonSubmit.innerText = 'Enviando...';
      botonSubmit.disabled = true;

      const avisoTardanza = setTimeout(() => {
        botonSubmit.innerText = 'Esto puede tardar unos segundos...';
      }, 4000);

      try {
        const respuesta = await fetch('https://iglesia-cristiana-dise-ados-a-su-imagen.onrender.com/api/contacto', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, correo, mensaje, token: turnstileToken })
        });
        const resultado = await respuesta.json();
        if (respuesta.ok && resultado.status === 'success') {
          cajaMensaje.textContent = resultado.message;
          cajaMensaje.className = 'mensaje-estado mensaje-estado--exito';
          formContacto.reset();
        } else if (respuesta.status === 429) {
          cajaMensaje.textContent = 'Enviaste varios mensajes muy seguido. Espera unos minutos e inténtalo de nuevo.';
          cajaMensaje.className = 'mensaje-estado mensaje-estado--error';
        } else if (respuesta.status === 400) {
          cajaMensaje.textContent = resultado.message || 'Revisa los datos del formulario e intenta de nuevo.';
          cajaMensaje.className = 'mensaje-estado mensaje-estado--error';
        } else {
          cajaMensaje.textContent = 'Hubo un problema al procesar tu mensaje. Intenta de nuevo en unos minutos.';
          cajaMensaje.className = 'mensaje-estado mensaje-estado--error';
        }
      } catch (error) {
        console.error('Error detectado:', error);
        cajaMensaje.textContent = 'No pudimos conectar con el servidor. Revisa tu conexión a internet e intenta de nuevo.';
        cajaMensaje.className = 'mensaje-estado mensaje-estado--error';
      } finally {
        clearTimeout(avisoTardanza);
        botonSubmit.innerText = textoOriginalBoton;
        botonSubmit.disabled = false;
        if (window.turnstile) {
          turnstile.reset();
        }
      }
    });
  }
});

// Fachada del video de YouTube: solo carga el iframe real (y sus
// cookies de terceros) cuando el usuario hace clic o pulsa Enter/Espacio.
document.addEventListener('DOMContentLoaded', () => {
  const facade = document.getElementById('youtube-facade');
  if (!facade) return;

  // Antes: se intentaba cargar una miniatura con
  // 'https://i.ytimg.com/vi_webp/live_stream/hqdefault.webp'. 'live_stream'
  // no es un Video ID real (solo es válido como parámetro en la URL de
  // embed, más abajo), así que esa miniatura siempre daba 404. Obtener el
  // video en vivo real requeriría la YouTube Data API (backend, fuera de
  // alcance). Se deja el fondo sólido de .video-facade (#111, ya definido
  // en estilos.css) como respaldo intencional detrás del botón de play.

  function cargarVideo() {
    const canal = facade.dataset.canal;
    const iframe = document.createElement('iframe');
    iframe.title = 'Transmisión en vivo de YouTube';
    iframe.src = `https://www.youtube.com/embed/live_stream?channel=${canal}&autoplay=1`;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    facade.replaceWith(iframe);
  }

  facade.addEventListener('click', cargarVideo);
});

// El menú móvil (abrir/cerrar, teclado, foco, ícono) ahora vive
// exclusivamente en menu-movil.js, cargado también en index.html.
// Se retiró el bloque duplicado que existía aquí para no mantener
// dos implementaciones divergentes (esta no cambiaba el ícono
// hamburguesa/X; menu-movil.js sí lo hace, y ya se carga en todas
// las páginas que tienen el botón).
