import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDMc0EfgZ47u-hfCIxBKSeMPwVJpHDXec8",
  authDomain: "tareas-operarios.firebaseapp.com",
  projectId: "tareas-operarios",
  storageBucket: "tareas-operarios.appspot.com",
  messagingSenderId: "402811027330",
  appId: "1:402811027330:web:fae96b0a739213038e999b",
  measurementId: "G-3G21K71QHH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tableBody = document.querySelector("#dataTable tbody");
const filtroTarea = document.getElementById("filtroTarea");
const filtroOperario = document.getElementById("filtroOperario");
const filtroFecha = document.getElementById("filtroFecha");
const filtroMes = document.getElementById("filtroMes");
const btnExport = document.getElementById("btnExport");
const rankingList = document.getElementById("rankingList");

// Canvas para gráficos (los creamos dinámicamente)
let duracionChart, promedioChart;

let dataGlobal = [];

async function cargarDatos() {
  const colRef = collection(db, "tareas-operarios");
  const snapshot = await getDocs(colRef);

  dataGlobal = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  console.log(snapshot.docs.map(doc => doc.data()));
  console.log("Datos cargados de Firebase:", dataGlobal);  // Para ver datos en consola

  cargarFiltrosOperarios();
  filtrarYMostrarDatos();
}


function cargarFiltrosOperarios() {
  const operarios = [...new Set(dataGlobal.map(item => item.operario).filter(Boolean))];
  filtroOperario.innerHTML = `<option value="">Todos</option>` +
    operarios.map(op => `<option value="${op}">${op}</option>`).join("");
}

function filtrarYMostrarDatos() {
  let data = [...dataGlobal];

  if (filtroTarea.value) data = data.filter(item => item.tarea === filtroTarea.value);
  if (filtroOperario.value) data = data.filter(item => item.operario === filtroOperario.value);
  if (filtroFecha.value) data = data.filter(item => item.fecha === filtroFecha.value);
  if (filtroMes.value) data = data.filter(item => item.fecha && item.fecha.startsWith(filtroMes.value));

  renderizarTabla(data);
  renderizarRanking(data);
  renderizarGraficos(data);
}

function renderizarTabla(data) {
  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="11" class="text-center">No hay datos para mostrar</td></tr>`;
    return;
  }

  data.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.operario || "-"}</td>
      <td>${item.tarea || "-"}</td>
      <td>${item.fecha || "-"}</td>
      <td>${item.horaInicio || "-"}</td>
      <td>${item.horaFin || "-"}</td>
      <td>${item.duracion || "-"}</td>
      <td>${item.pallets || "-"}</td>
      <td>${item.cliente || "-"}</td>
      <td>${item.chofer || "-"}</td>
      <td>${item.faltantes || "-"}</td>
      <td>${item.remito ? `<a href="${item.remito}" target="_blank">Ver Remito</a>` : "-"}</td>
    `;
    tableBody.appendChild(tr);
  });
}

function renderizarRanking(data) {
  const ranking = {};

  data.forEach(item => {
    if (!item.operario) return;
    const dur = parseFloat(item.duracion) || 0;
    ranking[item.operario] = (ranking[item.operario] || 0) + dur;
  });

  const rankingArray = Object.entries(ranking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  rankingList.innerHTML = rankingArray.length > 0
    ? rankingArray.map(([op, dur]) => `<li class="list-group-item">${op}: ${dur.toFixed(2)} minutos</li>`).join("")
    : "<li class='list-group-item'>No hay datos</li>";
}

function renderizarGraficos(data) {
  // Preparamos datos para gráficos
  const duracionPorOperario = {};
  const cantidadPorOperario = {};

  data.forEach(item => {
    if (!item.operario) return;
    const dur = parseFloat(item.duracion) || 0;
    duracionPorOperario[item.operario] = (duracionPorOperario[item.operario] || 0) + dur;
    cantidadPorOperario[item.operario] = (cantidadPorOperario[item.operario] || 0) + 1;
  });

  const labels = Object.keys(duracionPorOperario);
  const duracionData = labels.map(op => duracionPorOperario[op]);
  const promedioData = labels.map(op => duracionPorOperario[op] / cantidadPorOperario[op]);

  // Si no hay canvas, los agregamos (solo una vez)
  if (!document.getElementById("duracionChart")) {
    const cont = document.createElement("div");
    cont.className = "mb-5";

    cont.innerHTML = `
      <h4>Duración total por operario (minutos)</h4>
      <canvas id="duracionChart" style="max-width: 700px; margin-bottom: 40px;"></canvas>
      <h4>Promedio de duración por operario (minutos)</h4>
      <canvas id="promedioChart" style="max-width: 700px;"></canvas>
    `;

    document.querySelector(".container").appendChild(cont);
  }

  const ctxDuracion = document.getElementById("duracionChart").getContext("2d");
  const ctxPromedio = document.getElementById("promedioChart").getContext("2d");

  if (duracionChart) duracionChart.destroy();
  if (promedioChart) promedioChart.destroy();

  duracionChart = new Chart(ctxDuracion, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Duración total (min)",
        data: duracionData,
        backgroundColor: "rgba(54, 162, 235, 0.7)"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });

  promedioChart = new Chart(ctxPromedio, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Promedio duración (min)",
        data: promedioData,
        backgroundColor: "rgba(255, 159, 64, 0.7)"
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

btnExport.addEventListener("click", () => {
  const data = filtrarDatosParaExportar();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tareas");
  XLSX.writeFile(wb, "tareas_operarios.xlsx");
});

function filtrarDatosParaExportar() {
  let data = [...dataGlobal];

  if (filtroTarea.value) data = data.filter(item => item.tarea === filtroTarea.value);
  if (filtroOperario.value) data = data.filter(item => item.operario === filtroOperario.value);
  if (filtroFecha.value) data = data.filter(item => item.fecha === filtroFecha.value);
  if (filtroMes.value) data = data.filter(item => item.fecha && item.fecha.startsWith(filtroMes.value));

  return data.map(({ id, ...rest }) => rest);
}

[filtroTarea, filtroOperario, filtroFecha, filtroMes].forEach(el => el.addEventListener("change", filtrarYMostrarDatos));

window.onload = cargarDatos;