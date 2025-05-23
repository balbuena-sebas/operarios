// admin.js

// ======= Login =======
function login() {
  const clave = document.getElementById("clave").value.trim();
  if (clave === "admin123") {  // Cambia esta clave por la que quieras
    sessionStorage.setItem("autenticado", "true");
    window.location.href = "admin.html";
  } else {
    const err = document.getElementById("error");
    if (err) {
      err.style.display = "block";
      setTimeout(() => { err.style.display = "none"; }, 3000);
    }
  }
}

// ======= Control acceso en admin.html =======
if (window.location.pathname.endsWith("admin.html")) {
  if (sessionStorage.getItem("autenticado") !== "true") {
    window.location.href = "login.html";
  }
}

// ======= Variables globales =======
const API_URL = "https://script.google.com/macros/s/AKfycbz844gDFQvviGW6SATD_8ub6tW2ltv6uXKXDqF5WcrqThukcuJTsr4fLvLnFFjS5Yv5/exec"; // Reemplaza con tu URL real

const taskFilter = document.getElementById("taskFilter");
const dataBody = document.getElementById("dataBody");
const downloadExcelBtn = document.getElementById("downloadExcel");
const btnVolver = document.getElementById("btnVolver");
const ctx = document.getElementById('rankingChart')?.getContext('2d');

let allData = [];
let chart;

// ======= Funciones admin =======
async function cargarDatos() {
  try {
    const res = await fetch(API_URL);
    allData = await res.json();
    mostrarDatos(allData);
    actualizarGrafico(allData);
  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}

function mostrarDatos(data) {
  if (!dataBody) return;
  const filtro = taskFilter.value;
  const filtrados = filtro ? data.filter(d => d.tarea === filtro) : data;

  dataBody.innerHTML = "";

  filtrados.forEach(d => {
    const duracionMin = calcularDuracionMinutos(d.inicio, d.fin);
    const remitoLink = d.remito ? `<a href="${d.remito}" target="_blank">Ver Foto</a>` : "";

    dataBody.innerHTML += `
      <tr>
        <td>${d.tarea || ""}</td>
        <td>${d.operario || ""}</td>
        <td>${d.fecha || ""}</td>
        <td>${d.inicio || ""}</td>
        <td>${d.fin || ""}</td>
        <td>${duracionMin}</td>
        <td>${d.pallets || ""}</td>
        <td>${d.cliente || ""}</td>
        <td>${d.chofer || ""}</td>
        <td>${d.faltantes || ""}</td>
        <td>${remitoLink}</td>
      </tr>
    `;
  });
}

function calcularDuracionMinutos(inicio, fin) {
  if (!inicio || !fin) return "";
  const inicioDate = new Date(`1970-01-01T${inicio}Z`);
  const finDate = new Date(`1970-01-01T${fin}Z`);
  let diff = (finDate - inicioDate) / 60000; // ms a minutos
  if (diff < 0) diff += 1440; // si pasó medianoche
  return diff.toFixed(2);
}

function actualizarGrafico(data) {
  if (!ctx) return;
  const filtro = taskFilter.value;
  const filtrados = filtro ? data.filter(d => d.tarea === filtro) : data;

  const agrupado = {};
  filtrados.forEach(d => {
    const duracion = parseFloat(calcularDuracionMinutos(d.inicio, d.fin));
    if (!isNaN(duracion)) {
      if (!agrupado[d.operario]) agrupado[d.operario] = [];
      agrupado[d.operario].push(duracion);
    }
  });

  const labels = Object.keys(agrupado);
  const promedios = labels.map(op => {
    const tiempos = agrupado[op];
    const suma = tiempos.reduce((a,b) => a+b, 0);
    return (suma / tiempos.length).toFixed(2);
  });

  if(chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Duración promedio (minutos)',
        data: promedios,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Minutos' }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function descargarExcel() {
  const filtro = taskFilter.value;
  const filtrados = filtro ? allData.filter(d => d.tarea === filtro) : allData;

  const datosParaExcel = filtrados.map(d => {
    return {
      Tarea: d.tarea || "",
      Operario: d.operario || "",
      Fecha: d.fecha || "",
      Inicio: d.inicio || "",
      Fin: d.fin || "",
      "Duración (minutos)": calcularDuracionMinutos(d.inicio, d.fin),
      Pallets: d.pallets || "",
      Cliente: d.cliente || "",
      Chofer: d.chofer || "",
      Faltantes: d.faltantes || "",
      Remito: d.remito || ""
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosParaExcel);

  for (let i = 1; i <= datosParaExcel.length; i++) {
    const url = datosParaExcel[i-1].Remito;
    if (url) {
      const cellRef = `K${i + 1}`;
      if (!ws[cellRef]) ws[cellRef] = {};
      ws[cellRef].l = { Target: url, Tooltip: "Abrir imagen" };
      ws[cellRef].t = "s";
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, "Datos");
  XLSX.writeFile(wb, "datos_operarios.xlsx");
}

// ======= Eventos =======
if (taskFilter) {
  taskFilter.addEventListener("change", () => {
    mostrarDatos(allData);
    actualizarGrafico(allData);
  });
}

if (downloadExcelBtn) {
  downloadExcelBtn.addEventListener("click", descargarExcel);
}

if (btnVolver) {
  btnVolver.addEventListener("click", () => {
    sessionStorage.removeItem("autenticado");
    window.location.href = "index.html"; // Página operarios (debes tenerla)
  });
}

// Carga inicial solo si estamos en admin.html
if (window.location.pathname.endsWith("admin.html")) {
  cargarDatos();
}
