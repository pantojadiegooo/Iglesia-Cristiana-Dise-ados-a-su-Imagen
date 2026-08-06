/**
 * dinamico.js — Diseñados a su Imagen
 * Consume /api/contenido del backend y llena:
 * 1) Elementos con [data-contenido="clave.campo"] → texto simple.
 * 2) #avisos-lista → tarjetas de avisos importantes.
 * 3) #predicas-lista → lista de enlaces a predicas/Zoom.
 */
(function () {
  const BASE_API = "https://iglesia-cristiana-dise-ados-a-su-imagen.onrender.com";

  // ====== VERSÍCULO DEL DÍA: rotación automática por fecha ======
  // No depende del backend: se calcula en el navegador según el día del año,
  // así que siempre cambia solo, aunque Render esté "dormido" o caído.
  // Ajusta el texto/traducción a tu versión de la NTV antes de publicar;
  // estas son referencias de ejemplo para que completes con la cita exacta.
  const VERSICULOS_DEL_DIA = [
    { texto: "Todo lo puedo en Cristo que me fortalece.", referencia: "Filipenses 4:13" },
    { texto: "El Señor es mi pastor; nada me faltará.", referencia: "Salmo 23:1" },
    { texto: "Encomienda al Señor tus afanes, y él te sustentará.", referencia: "Salmo 55:22" },
    { texto: "Este es el día que hizo el Señor; alegrémonos y gocémonos en él.", referencia: "Salmo 118:24" },
    { texto: "Todo tiene su tiempo, y todo lo que se quiere debajo del cielo tiene su hora.", referencia: "Eclesiastés 3:1" },
    { texto: "Buscad primeramente el reino de Dios y su justicia.", referencia: "Mateo 6:33" },
    { texto: "El amor es paciente, es bondadoso.", referencia: "1 Corintios 13:4" },
    { texto: "Nada hay imposible para Dios.", referencia: "Lucas 1:37" },
    { texto: "Fortaleceos en el Señor y en el poder de su fuerza.", referencia: "Efesios 6:10" },
    { texto: "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones.", referencia: "Salmo 46:1" },
    { texto: "Todo lo que hagáis, hacedlo de corazón, como para el Señor.", referencia: "Colosenses 3:23" },
    { texto: "No temas, porque yo estoy contigo.", referencia: "Isaías 41:10" },
    { texto: "Alégrense siempre en el Señor.", referencia: "Filipenses 4:4" },
    { texto: "Confía en el Señor de todo corazón.", referencia: "Proverbios 3:5" },
  ];

  function obtenerVersiculoDelDia() {
    const ahora = new Date();
    const inicioAño = new Date(ahora.getFullYear(), 0, 0);
    const diaDelAño = Math.floor((ahora - inicioAño) / 86400000);
    const indice = diaDelAño % VERSICULOS_DEL_DIA.length;
    return VERSICULOS_DEL_DIA[indice];
  }

  function mostrarVersiculoDelDia() {
    const textoEl = document.querySelector('[data-contenido="versiculo_dia.texto"]');
    const refEl = document.querySelector('[data-contenido="versiculo_dia.referencia"]');
    const versiculo = obtenerVersiculoDelDia();
    if (textoEl) textoEl.textContent = versiculo.texto;
    if (refEl) refEl.textContent = versiculo.referencia;
  }

  // Se muestra de inmediato: no hace falta esperar al backend para tener
  // un versículo correcto. Si /api/contenido responde con su propio
  // "versiculo_dia" (por ejemplo, uno especial que cargue el pastor a
  // mano para una fecha puntual), llenarCamposSimples() lo sobrescribe.
  mostrarVersiculoDelDia();

  fetch(`${BASE_API}/api/contenido`)
    .then((resp) => {
      if (!resp.ok) throw new Error("No se pudo cargar el contenido dinámico.");
      return resp.json();
    })
    .then((datos) => {
      clearTimeout(avisoTardanzaAvisos);
      llenarCamposSimples(datos);
      llenarAvisos(datos.avisos || []);
      llenarPredicas(datos.enlaces_predicas || []);
    })
    .catch((err) => {
      console.warn("Contenido dinámico no disponible:", err);
      clearTimeout(avisoTardanzaAvisos);
      const contenedorAvisos = document.getElementById("avisos-lista");
      if (contenedorAvisos) {
        contenedorAvisos.innerHTML = '<p class="avisos-vacio">No hay avisos por el momento. Vuelve pronto.</p>';
      }
    });

  // El backend (Render, plan gratuito) puede tardar 30-50s en "despertar"
  // tras estar inactivo. Sin esto, #avisos-lista se ve como un hueco roto
  // durante ese tiempo. Mostramos un estado de carga visible de inmediato
  // y lo reemplazamos en cuanto la petición de arriba responda.
  const contenedorAvisosInicial = document.getElementById("avisos-lista");
  if (contenedorAvisosInicial) {
    contenedorAvisosInicial.innerHTML = '<p class="avisos-vacio"><i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Cargando avisos…</p>';
  }
  const avisoTardanzaAvisos = setTimeout(() => {
    const contenedor = document.getElementById("avisos-lista");
    if (contenedor) {
      contenedor.innerHTML = '<p class="avisos-vacio">Esto está tardando más de lo normal. Sigue intentando cargar…</p>';
    }
  }, 6000);

  function llenarCamposSimples(datos) {
    document.querySelectorAll("[data-contenido]").forEach((el) => {
      const [clave, campo] = el.dataset.contenido.split(".");
      const seccion = datos[clave];
      if (!seccion) return;
      const valor = campo ? seccion[campo] : seccion;
      if (valor !== undefined && valor !== null) el.textContent = valor;
    });
  }

  function llenarAvisos(avisos) {
    const contenedor = document.getElementById("avisos-lista");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    if (!avisos.length) {
      contenedor.innerHTML = '<p class="avisos-vacio">No hay avisos por ahora.</p>';
      return;
    }

    avisos.forEach((aviso, i) => {
      const tarjeta = document.createElement("div");
      tarjeta.className = "aviso-tarjeta reveal";
      tarjeta.dataset.revealDelay = Math.min(i, 5) * 70;
      tarjeta.innerHTML = `
        <h3>${escaparHTML(aviso.titulo || "")}</h3>
        <p>${escaparHTML(aviso.texto || "")}</p>
        ${aviso.vigente_hasta ? `<span class="aviso-fecha">Vigente hasta ${escaparHTML(aviso.vigente_hasta)}</span>` : ""}
      `;
      contenedor.appendChild(tarjeta);
    });
  }

  function llenarPredicas(predicas) {
    const contenedor = document.getElementById("predicas-lista");
    if (!contenedor) return;
    contenedor.innerHTML = "";

    predicas.forEach((p) => {
      const item = document.createElement("a");
      item.className = "predica-enlace";
      item.href = p.url || "#";
      item.target = "_blank";
      item.innerHTML = `<i class="fas fa-video"></i> ${escaparHTML(p.titulo || "Ver prédica")}
        ${p.fecha ? `<span>${escaparHTML(p.fecha)}</span>` : ""}`;
      contenedor.appendChild(item);
    });
  }

  function escaparHTML(texto) {
    const div = document.createElement("div");
    div.textContent = String(texto);
    return div.innerHTML;
  }

  // Consentimiento de cookies
  document.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("cookie-banner");
    const btnAceptar = document.getElementById("btn-aceptar-cookies");
    const btnRechazar = document.getElementById("btn-rechazar-cookies");

    const estadoCookies = localStorage.getItem("consentimientoCookies");
    if (!estadoCookies) {
      banner.style.display = "block";
    }

    btnAceptar.addEventListener("click", () => {
      localStorage.setItem("consentimientoCookies", "aceptadas");
      banner.style.display = "none";
      if (typeof window.cargarGTM === "function") window.cargarGTM();
    });

    btnRechazar.addEventListener("click", () => {
      localStorage.setItem("consentimientoCookies", "rechazadas");
      banner.style.display = "none";
    });
  });

  // Suscripción por correo
  // NOTA: este handler solo valida y muestra el mensaje en pantalla.
  // Cuando elijas proveedor (Mailchimp, Brevo, Sender...), reemplaza el
  // bloque marcado abajo por el envío real: lo más simple es usar el
  // <form action="URL-DE-TU-PROVEEDOR" method="post"> que cada uno te da
  // en su panel de "formulario embebido", así no necesitas backend propio.
  document.addEventListener("DOMContentLoaded", () => {
    const formSuscripcion = document.getElementById("form-suscripcion");
    const mensajeSuscripcion = document.getElementById("mensaje-suscripcion");
    if (!formSuscripcion) return;

    formSuscripcion.addEventListener("submit", (evento) => {
      evento.preventDefault();
      const input = document.getElementById("correo-suscripcion");
      const correo = input.value.trim();
      const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

      if (!correoValido) {
        mensajeSuscripcion.textContent = "Ingresa un correo válido.";
        mensajeSuscripcion.className = "mensaje-estado mensaje-estado--error";
        return;
      }

      // === Reemplaza esto por la llamada/redirección de tu proveedor ===
      console.log("Suscribir correo:", correo);
      // ===================================================================

      mensajeSuscripcion.textContent = "¡Gracias! Te has suscrito correctamente.";
      mensajeSuscripcion.className = "mensaje-estado mensaje-estado--exito";
      formSuscripcion.reset();
    });
  });

})();
