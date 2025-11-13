// script.js — versión completa y funcional
document.addEventListener("DOMContentLoaded", () => {

  /* ===== ANIMACIÓN ON SCROLL ===== */
  const animados = document.querySelectorAll(".fade-up");
  const mostrarAlScroll = () => {
    animados.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) el.classList.add("visible");
    });
  };
  window.addEventListener("scroll", mostrarAlScroll);
  mostrarAlScroll();

  /* ===== MODAL DE VIDEO ===== */
  const cuadros = document.querySelectorAll(".cuadro");
  const modalVideo = document.getElementById("modalVideo");
  const videoElem = document.getElementById("videoModal");
  const cerrarVideo = modalVideo?.querySelector(".cerrar");

  cuadros.forEach(c => {
    c.addEventListener("click", () => {
      const src = c.dataset.video;
      if (src) {
        videoElem.src = src;
        modalVideo.style.display = "flex";
        modalVideo.setAttribute("aria-hidden", "false");
      }
    });
  });

  if (cerrarVideo) {
    cerrarVideo.addEventListener("click", () => {
      modalVideo.style.display = "none";
      modalVideo.setAttribute("aria-hidden", "true");
      videoElem.pause();
      videoElem.currentTime = 0;
      videoElem.src = "";
    });
  }

  window.addEventListener("click", e => {
    if (e.target === modalVideo) {
      modalVideo.style.display = "none";
      videoElem.pause();
      videoElem.currentTime = 0;
      videoElem.src = "";
    }
  });

  /* ===== MODAL DE IMAGEN ===== */
  const modalImagen = document.getElementById("modalImagen");
  const imgAmpliada = document.getElementById("imagenAmpliada");
  const cerrarImg = modalImagen?.querySelector(".cerrar-img");

  if (cerrarImg) cerrarImg.addEventListener("click", () => {
    modalImagen.style.display = "none";
    imgAmpliada.src = "";
  });

  window.addEventListener("click", e => {
    if (e.target === modalImagen) {
      modalImagen.style.display = "none";
      imgAmpliada.src = "";
    }
  });

  /* ===== GEOLOCALIZACIÓN ===== */
  const btnUbicacion = document.getElementById("btn-ubicacion");
  const estadoUbicacion = document.getElementById("estado-ubicacion");

  if (btnUbicacion) {
    btnUbicacion.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Tu navegador no soporta geolocalización.");
        return;
      }

      btnUbicacion.classList.add("buscando");
      btnUbicacion.textContent = "📡 Detectando...";
      navigator.geolocation.getCurrentPosition(async pos => {
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          document.getElementById("direccion").value = data.display_name || `${lat}, ${lon}`;
          estadoUbicacion.textContent = "Ubicación compartida ✅";
          btnUbicacion.classList.remove("buscando");
          btnUbicacion.classList.add("exito", "pulso-verde");
          btnUbicacion.textContent = "✅ Ubicación lista";
          setTimeout(() => btnUbicacion.classList.remove("pulso-verde"), 1200);
        } catch (err) {
          alert("Error al obtener la dirección: " + err.message);
          btnUbicacion.classList.remove("buscando");
          btnUbicacion.textContent = "📍 Compartir ubicación";
        }
      }, err => {
        alert("No se pudo obtener ubicación: " + err.message);
        btnUbicacion.classList.remove("buscando");
        btnUbicacion.textContent = "📍 Compartir ubicación";
      });
    });
  }

  /* ===== GUARDAR REPORTE ===== */
  const form = document.getElementById("form-reporte");
  const mensajeExito = document.getElementById("mensaje-exito");

  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const tipo = document.getElementById("tipo").value;
      const desc = document.getElementById("descripcion").value;
      const dir = document.getElementById("direccion").value;
      const fotos = document.getElementById("fotos").files;

      const imagenes = [];
      for (let i = 0; i < fotos.length; i++) {
        try {
          imagenes.push(await toBase64(fotos[i]));
        } catch (err) {
          console.warn("Error leyendo imagen:", err);
        }
      }

      const nuevo = {
        id: Date.now(),
        tipo,
        desc,
        dir,
        fecha: new Date().toLocaleString(),
        imagenes
      };

      const lista = JSON.parse(localStorage.getItem("reportes") || "[]");
      lista.unshift(nuevo);
      localStorage.setItem("reportes", JSON.stringify(lista));

      mensajeExito.classList.remove("oculto");
      setTimeout(() => mensajeExito.classList.add("oculto"), 3000);
      form.reset();

      if (document.getElementById("tabla-reportes")) populateTabla();
    });
  }

  /* ===== PANEL ADMIN ===== */
  const panel = document.getElementById("panelAdmin");
  const btnAdmin = document.getElementById("btn-admin");
  const sidebarBtns = document.querySelectorAll(".sidebar li[data-section]");
  const secciones = document.querySelectorAll(".panel-seccion");

  if (btnAdmin && panel) {
    btnAdmin.addEventListener("click", () => {
      panel.classList.toggle("activo");
      const abierto = panel.classList.contains("activo");
      btnAdmin.textContent = abierto ? "❌ Cerrar Panel" : "⚙️ Abrir Panel";
      btnAdmin.setAttribute("aria-expanded", abierto);
      panel.setAttribute("aria-hidden", !abierto);
      if (abierto) populateTabla();
    });
  }

  sidebarBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sidebarBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const target = btn.dataset.section;
      secciones.forEach(sec => sec.classList.remove("visible"));

      const targetSection = document.getElementById("seccion-" + target);
      if (targetSection) targetSection.classList.add("visible");
    });
  });

  document.getElementById("cerrarSesion")?.addEventListener("click", () => {
    alert("Sesión cerrada (simulada).");
    panel.classList.remove("activo");
    btnAdmin.textContent = "⚙️ Abrir Panel";
  });

  /* ===== TABLA DE REPORTES ===== */
  function populateTabla() {
    const tabla = document.getElementById("tabla-reportes");
    if (!tabla) return;

    const datos = JSON.parse(localStorage.getItem("reportes") || "[]");
    const tbody = tabla.querySelector("tbody");
    tbody.innerHTML = "";

    if (!datos.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:#777;">No hay reportes guardados.</td></tr>`;
      return;
    }

    datos.forEach((r, i) => {
      const fila = document.createElement("tr");
      const evidHTML = r.imagenes?.length
        ? r.imagenes.map(src => `<img src="${src}" class="thumb" alt="evidencia">`).join("")
        : "Sin imagen";

      fila.innerHTML = `
        <td>${i + 1}</td>
        <td>${r.tipo}</td>
        <td>${r.desc}</td>
        <td>${r.dir}</td>
        <td>${r.fecha}</td>
        <td>${evidHTML}</td>
        <td><span class="estado pendiente">Pendiente</span></td>
        <td><button class="btn-ver">Ver</button></td>
      `;
      tbody.appendChild(fila);
    });
  }

  /* ===== EVENTOS DE TABLA ===== */
  document.addEventListener("click", e => {
    if (e.target.classList.contains("btn-ver")) {
      const estado = e.target.closest("tr").querySelector(".estado");
      if (estado.classList.contains("pendiente")) {
        estado.className = "estado enproceso";
        estado.textContent = "En proceso";
      } else if (estado.classList.contains("enproceso")) {
        estado.className = "estado atendido";
        estado.textContent = "Atendido";
      } else {
        estado.className = "estado pendiente";
        estado.textContent = "Pendiente";
      }
    }

    if (e.target.classList.contains("thumb")) {
      imgAmpliada.src = e.target.src;
      modalImagen.style.display = "flex";
    }
  });

  /* ===== BOTÓN DE MESA INTERINSTITUCIONAL ===== */
  const btnMesa = document.getElementById("btnMesa");
  const estadoMesa = document.getElementById("estadoMesa");

  if (btnMesa) {
    btnMesa.addEventListener("click", () => {
      estadoMesa.innerHTML = `<p style="color:#007bff;font-weight:bold;">✅ Mesa Interinstitucional instalada con éxito.</p>`;
      btnMesa.disabled = true;
      btnMesa.textContent = "Mesa creada";
      btnMesa.style.background = "#28a745";
    });
  }
});
/* ===============================
   CONFIGURACIÓN, USUARIOS Y ESTADÍSTICAS
================================= */

// --- CONFIGURACIÓN ---
const temaSelect = document.getElementById("tema");
const btnLimpiar = document.getElementById("btnLimpiar");
const estadoConfig = document.getElementById("estadoConfig");

if (temaSelect) {
  temaSelect.addEventListener("change", () => {
    const tema = temaSelect.value;
    document.body.dataset.tema = tema;
    localStorage.setItem("tema", tema);
  });

  // Cargar tema guardado
  const temaGuardado = localStorage.getItem("tema") || "claro";
  document.body.dataset.tema = temaGuardado;
  temaSelect.value = temaGuardado;
}

if (btnLimpiar) {
  btnLimpiar.addEventListener("click", () => {
    localStorage.removeItem("reportes");
    estadoConfig.textContent = "Reportes eliminados correctamente ✅";
    setTimeout(() => (estadoConfig.textContent = ""), 3000);
  });
}

// --- USUARIOS ---
const formUsuario = document.getElementById("formUsuario");
const tablaUsuarios = document.getElementById("tablaUsuarios");

function cargarUsuarios() {
  if (!tablaUsuarios) return;
  tablaUsuarios.querySelector("tbody").innerHTML = "";
  const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
  usuarios.forEach((u, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${u.nombre}</td>
      <td>${u.correo}</td>
      <td><button class="btn-ver btn-del" data-index="${i}">❌ Eliminar</button></td>`;
    tablaUsuarios.querySelector("tbody").appendChild(tr);
  });
}

if (formUsuario) {
  formUsuario.addEventListener("submit", e => {
    e.preventDefault();
    const nombre = document.getElementById("nombreUsuario").value.trim();
    const correo = document.getElementById("correoUsuario").value.trim();
    if (!nombre || !correo) return alert("Completa todos los campos");

    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
    usuarios.push({ nombre, correo });
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    formUsuario.reset();
    cargarUsuarios();
  });
}

document.addEventListener("click", e => {
  if (e.target.classList.contains("btn-del")) {
    const i = e.target.dataset.index;
    const usuarios = JSON.parse(localStorage.getItem("usuarios") || "[]");
    usuarios.splice(i, 1);
    localStorage.setItem("usuarios", JSON.stringify(usuarios));
    cargarUsuarios();
  }
});

// === ESTADÍSTICAS (solo visibles en su sección) ===
let chartTipos = null;
let chartEstados = null;

function crearGraficos() {
  const canvasTipos = document.getElementById("graficoTipos");
  const canvasEstados = document.getElementById("graficoEstados");
  if (!canvasTipos || !canvasEstados) return;

  const ctxTipos = canvasTipos.getContext("2d");
  const ctxEstados = canvasEstados.getContext("2d");

  const reportes = JSON.parse(localStorage.getItem("reportes") || "[]");

  const porTipo = {};
  const porEstado = { pendiente: 0, enproceso: 0, atendido: 0 };

  reportes.forEach(r => {
    porTipo[r.tipo] = (porTipo[r.tipo] || 0) + 1;
    // simulamos estado inicial como pendiente
    porEstado.pendiente++;
  });

  chartTipos = new Chart(ctxTipos, {
    type: "bar",
    data: {
      labels: Object.keys(porTipo),
      datasets: [{
        label: "Reportes por tipo",
        data: Object.values(porTipo),
        backgroundColor: "#0077cc",
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#333", font: { size: 11 } } },
        y: { ticks: { color: "#333", font: { size: 11 } } }
      }
    }
  });

  chartEstados = new Chart(ctxEstados, {
    type: "doughnut",
    data: {
      labels: ["Pendiente", "En proceso", "Atendido"],
      datasets: [{
        data: [porEstado.pendiente, porEstado.enproceso, porEstado.atendido],
        backgroundColor: ["#f59e0b", "#3b82f6", "#22c55e"],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom", labels: { font: { size: 11 } } }
      },
      cutout: "65%"
    }
  });
}

function destruirGraficos() {
  if (chartTipos) { chartTipos.destroy(); chartTipos = null; }
  if (chartEstados) { chartEstados.destroy(); chartEstados = null; }
}

// === Control de visibilidad de secciones ===
document.querySelectorAll(".sidebar li[data-section]").forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.section;

    // Ocultar todas las secciones
    document.querySelectorAll(".panel-seccion").forEach(sec => sec.classList.remove("visible"));
    const activa = document.getElementById("seccion-" + target);
    if (activa) activa.classList.add("visible");

    // Destruir gráficos si salimos de "estadísticas"
    if (target !== "estadisticas") {
      destruirGraficos();
    }

    // Crear gráficos solo si estamos en estadísticas
    if (target === "estadisticas") {
      setTimeout(crearGraficos, 200);
    }
  });
});
