/**
 * dinamico.js — Diseñados a su Imagen
 * Consume /api/contenido del backend y llena:
 * 1) Elementos con [data-contenido="clave.campo"] → texto simple.
 * 2) #avisos-lista → tarjetas de avisos importantes.
 * 3) #predicas-lista → lista de enlaces a predicas/Zoom.
 */
(function () {
  const BASE_API = "https://iglesia-cristiana-dise-ados-a-su-imagen.onrender.com";

  fetch(`${BASE_API}/api/contenido`)
    .then((resp) => {
      if (!resp.ok) throw new Error("No se pudo cargar el contenido dinámico.");
      return resp.json();
    })
    .then((datos) => {
      llenarCamposSimples(datos);
      llenarAvisos(datos.avisos || []);
      llenarPredicas(datos.enlaces_predicas || []);
    })
    .catch((err) => {
      console.warn("Contenido dinámico no disponible:", err);
      mostrarVersiculoFallback();
      const contenedorAvisos = document.getElementById("avisos-lista");
      if (contenedorAvisos && !contenedorAvisos.innerHTML.trim()) {
        contenedorAvisos.innerHTML = '<p style="color:var(--text-muted); text-align:center;">No hay avisos por el momento. Vuelve pronto.</p>';
      }
    });

  // Si el backend tarda más de 5s (arranque en frío), se muestra el
  // versículo de respaldo de inmediato; si el backend responde después,
  // el .then() de arriba sobrescribe este texto con el real.
  const avisoTardanzaVersiculo = setTimeout(mostrarVersiculoFallback, 5000);
  let versiculoYaMostrado = false;

  function mostrarVersiculoFallback() {
    if (versiculoYaMostrado) return;
    versiculoYaMostrado = true;
    clearTimeout(avisoTardanzaVersiculo);
    const textoEl = document.querySelector('[data-contenido="versiculo_dia.texto"]');
    const refEl = document.querySelector('[data-contenido="versiculo_dia.referencia"]');
    if (textoEl && textoEl.textContent.includes("Cargando")) {
      textoEl.textContent = "Todo lo puedo en Cristo que me fortalece.";
    }
    if (refEl && !refEl.textContent.trim()) {
      refEl.textContent = "Filipenses 4:13";
    }
  }

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
      contenedor.innerHTML = '<p style="color:var(--text-muted);">No hay avisos por ahora.</p>';
      return;
    }

    avisos.forEach((aviso, i) => {
      const tarjeta = document.createElement("div");
      tarjeta.className = "aviso-tarjeta reveal";
      tarjeta.dataset.revealDelay = Math.min(i, 5) * 70;
      tarjeta.innerHTML = `
        <h4>${escaparHTML(aviso.titulo || "")}</h4>
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

})();
