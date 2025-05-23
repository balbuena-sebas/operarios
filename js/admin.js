const SHEET_URL = "https://sheet.best/api/sheets/TU_ID_AQUI"; // Reemplazá con tu URL real

const dataTable = document.getElementById("dataTable");
const dataBody = document.getElementById("dataBody");
const taskFilter = document.getElementById("taskFilter");
const downloadExcel = document.getElementById("downloadExcel");
const ctx = document.getElementById("rankingChart").getContext("2d");

let allData = [];
let chart;

fetch(SHEET_URL)
  .then(res => res.json())
  .then(data => {
    allData = data;
    renderTable(data);
    updateChart(data);
  });

taskFilter.addEventListener("change", () => {
  const filtered = taskFilter.value
    ? allData.filter(row => row.tarea === taskFilter.value)
    : allData;
  renderTable(filtered);
  updateChart(filtered);
});

function renderTable(data) {
  dataBody.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.tarea || ""}</td>
      <td>${row.operario || ""}</td>
      <td>${row.fecha || ""}</td>
      <td>${row.inicio || ""}</td>
      <td>${row.fin || ""}</td>
      <td>${row.duracion_min || ""}</td>
      <td>${row.pallets || ""}</td>
      <td>${row.cliente || ""}</td>
      <td>${row.chofer || ""}</td>
      <td>${row.faltantes || ""}</td>
      <td>${row.remito ? `<a href='${row.remito}' target='_blank'>Ver Remito</a>` : ""}</td>
    `;
    dataBody.appendChild(tr);
  });
}

function updateChart(data) {
  const resumen = {};
  data.forEach(row => {
    if (!row.operario || !row.duracion_min) return;
    const dur = parseFloat(row.duracion_min);
    if (!resumen[row.operario]) resumen[row.operario] = { total: 0, count: 0 };
    resumen[row.operario].total += dur;
    resumen[row.operario].count++;
  });

  const labels = Object.keys(resumen);
  const duraciones = labels.map(op =>
    (resumen[op].total / resumen[op].count).toFixed(1)
  );

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Duración Promedio (min)',
        data: duraciones,
        backgroundColor: 'rgba(13, 110, 253, 0.5)',
        borderColor: 'rgba(13, 110, 253, 1)',
        borderWidth: 1
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

downloadExcel.addEventListener("click", () => {
  let csvContent = "data:text/csv;charset=utf-8,";
  const headers = [
    "Tarea", "Operario", "Fecha", "Inicio", "Fin", "Duración (min)",
    "Pallets", "Cliente", "Chofer", "Faltantes", "Remito"
  ];
  csvContent += headers.join(",") + "\n";

  const filtered = taskFilter.value
    ? allData.filter(row => row.tarea === taskFilter.value)
    : allData;

  filtered.forEach(row => {
    const rowData = [
      row.tarea || "",
      row.operario || "",
      row.fecha || "",
      row.inicio || "",
      row.fin || "",
      row.duracion_min || "",
      row.pallets || "",
      row.cliente || "",
      row.chofer || "",
      row.faltantes || "",
      row.remito ? `=HYPERLINK(\"${row.remito}\",\"Ver Remito\")` : ""
    ];
    csvContent += rowData.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "reporte_operarios.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
