/**
 * dinamico.js — Diseñados a su Imagen
 * Va en el sitio ESTÁTICO (GitHub Pages), no en el backend.
 *
 * Jala /api/contenido del backend en Render y llena:
 * 1) Cualquier elemento con [data-contenido="clave.campo"] → texto simple.
 * 2) #avisos-lista → tarjetas de avisos importantes.
 * 3) #predicas-lista → lista de enlaces a predicas/Zoom.
 *
 * Cambia BASE_API por la URL real de tu backend en Render antes de subir esto.
 */
(function () {
  const BASE_API = "https://api-iglesia-cristiana-disenados-a-su.onrender.com";

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
      // Si el backend está dormido (plan gratis de Render) o falla, el
      // sitio sigue funcionando con lo que ya tenía escrito en el HTML.
      console.warn("Contenido dinámico no disponible:", err);
    });

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
})();
