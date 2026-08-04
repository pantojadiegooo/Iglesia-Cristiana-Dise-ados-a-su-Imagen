/**
 * donaciones.js — Diseñados a su Imagen (solo donaciones.html)
 * Antes inline en donaciones.html: copiar CLABE/cuenta, selección
 * de monto y conexión con Stripe Checkout. La animación de partículas
 * del hero ahora vive en particulas.js (compartida entre páginas).
 */
document.addEventListener('DOMContentLoaded', () => {
  // Copiar CLABE / cuenta con un clic
  document.querySelectorAll('.btn-copiar').forEach(btn => {
    btn.addEventListener('click', async () => {
      const valor = document.getElementById(btn.dataset.copiar).textContent.trim();
      try {
        await navigator.clipboard.writeText(valor);
        const original = btn.textContent;
        btn.textContent = '¡Copiado!';
        btn.classList.add('copiado');
        setTimeout(() => { btn.textContent = original; btn.classList.remove('copiado'); }, 2000);
      } catch (e) {
        alert('No se pudo copiar automáticamente. Cópialo manualmente: ' + valor);
      }
    });
  });

  // Selección de monto (botones preestablecidos + campo de monto libre)
  let montoSeleccionado = 300;
  const botonDonar = document.getElementById('btn-donar-stripe');
  const inputLibre = document.getElementById('monto-libre-input');
  const wrapLibre = document.getElementById('monto-libre-wrap');

  function actualizarBotonDonar() {
    botonDonar.innerHTML = `<i class="fas fa-lock"></i> Donar $${montoSeleccionado} MXN`;
  }

  document.querySelectorAll('.monto-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.monto-btn').forEach(b => b.classList.remove('activo'));
      btn.classList.add('activo');
      wrapLibre.classList.remove('activo');
      inputLibre.value = '';
      montoSeleccionado = parseInt(btn.dataset.monto, 10);
      actualizarBotonDonar();
    });
  });

  inputLibre.addEventListener('input', () => {
    const valor = parseInt(inputLibre.value, 10);
    if (valor && valor > 0) {
      document.querySelectorAll('.monto-btn').forEach(b => b.classList.remove('activo'));
      wrapLibre.classList.add('activo');
      montoSeleccionado = valor;
    } else if (!inputLibre.value) {
      wrapLibre.classList.remove('activo');
      const activo = document.querySelector('.monto-btn.activo');
      montoSeleccionado = activo ? parseInt(activo.dataset.monto, 10) : 300;
    }
    actualizarBotonDonar();
  });

  // Conexión con el backend de Stripe Checkout
  // IMPORTANTE: reemplaza esta URL por la de TU servidor Flask (ver app_donaciones.py)
  // y agrega ese mismo dominio a connect-src en la CSP (vercel.json).
  const API_DONACIONES = 'https://iglesia-cristiana-dise-ados-a-su-imagen.onrender.com/api/crear-donacion';

  botonDonar.addEventListener('click', async () => {
    const msg = document.getElementById('stripe-msg');
    msg.textContent = '';
    msg.className = 'stripe-msg';

    if (!montoSeleccionado || montoSeleccionado < 10) {
      msg.textContent = 'Ingresa un monto válido (mínimo $10 MXN).';
      msg.className = 'stripe-msg error';
      return;
    }

    botonDonar.disabled = true;
    botonDonar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirigiendo...';

    try {
      const resp = await fetch(API_DONACIONES, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monto_mxn: montoSeleccionado })
      });
      const data = await resp.json();

      if (resp.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || 'No se pudo iniciar el pago.');
      }
    } catch (err) {
      console.error(err);
      msg.textContent = 'No pudimos conectar con el servidor de pagos. Intenta de nuevo o usa transferencia.';
      msg.className = 'stripe-msg error';
      botonDonar.disabled = false;
      botonDonar.innerHTML = `<i class="fas fa-lock"></i> Donar $${montoSeleccionado} MXN`;
    }
  });
});
