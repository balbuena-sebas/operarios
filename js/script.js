let startTime;

function renderTaskForm() {
  const task = document.getElementById("taskType").value;
  const form = document.getElementById("taskForm");
  form.innerHTML = "";
  form.className = "";

  if (!task) return;

  startTime = new Date();

  let bgClass = "";
  if (task === "clasificacion") bgClass = "bg-warning-subtle";
  if (task === "armado")        bgClass = "bg-info-subtle";
  if (task === "carga")         bgClass = "bg-danger-subtle";
  if (task === "descarga")      bgClass = "bg-success-subtle";

  form.classList.add("p-4", "rounded-4", bgClass, "shadow", "mt-3");

  let html = `
    <h4 class="mb-4 text-dark fw-bold">Formulario: ${task.charAt(0).toUpperCase() + task.slice(1)}</h4>
    <div class="mb-3">
      <label class="form-label">Nombre del Operario</label>
      <input type="text" class="form-control" id="operario" required>
    </div>
    <p class="text-muted">Inicio: ${startTime.toLocaleString()}</p>
  `;

  if (task === "clasificacion") {
    html += `<div class="mb-3"><label class="form-label">Cantidad de pallets</label><input type="number" class="form-control" id="pallets" required></div>`;
  }

  if (task === "armado") {
    html += `<div class="mb-3"><label class="form-label">Cliente</label><input type="text" class="form-control" id="cliente" required></div>`;
  }

  if (task === "carga") {
    html += `<div class="mb-3"><label class="form-label">Chofer</label><input type="text" class="form-control" id="chofer" required></div>
             <div class="mb-3"><label class="form-label">Faltantes</label><textarea class="form-control" id="faltantes" rows="2"></textarea></div>`;
  }

  if (task === "descarga") {
    html += `<div class="mb-3"><label class="form-label">Cliente</label><input type="text" class="form-control" id="clienteDescarga" required></div>
             <div class="mb-3"><label class="form-label">Foto del Remito</label><input type="file" accept="image/*" capture="environment" class="form-control" id="remitoFoto" required></div>`;
  }

  html += `<button type="submit" class="btn btn-primary mt-3">Finalizar y Enviar</button>`;
  form.innerHTML = html;
}

function submitForm(e) {
  e.preventDefault();

  const task = document.getElementById("taskType").value;
  const endTime = new Date();

  const formData = {
    operario: document.getElementById("operario").value,
    tarea: task,
    fecha: new Date().toLocaleDateString(),
    horaInicio: startTime.toLocaleTimeString(),
    horaFin: endTime.toLocaleTimeString(),
    duracion: ((endTime - startTime) / 60000).toFixed(2),
    pallets: document.getElementById("pallets")?.value || "",
    cliente: document.getElementById("cliente")?.value || document.getElementById("clienteDescarga")?.value || "",
    chofer: document.getElementById("chofer")?.value || "",
    faltantes: document.getElementById("faltantes")?.value || "",
    descargoA: task === "descarga" ? "Sí" : "",
  };

  const fileInput = document.getElementById("remitoFoto");
  const file = fileInput?.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function () {
      formData.fotoBase64 = reader.result;
      google.script.run.withSuccessHandler(() => alert("Datos enviados")).doPostClient(formData);
    };
    reader.readAsDataURL(file);
  } else {
    google.script.run.withSuccessHandler(() => alert("Datos enviados")).doPostClient(formData);
  }

  document.getElementById("taskForm").innerHTML = "";
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("taskType").addEventListener("change", renderTaskForm);
  document.getElementById("taskForm").addEventListener("submit", submitForm);
});
