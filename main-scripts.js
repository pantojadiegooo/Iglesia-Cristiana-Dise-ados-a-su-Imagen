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
