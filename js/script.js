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
    html += `
      <div class="mb-3">
        <label class="form-label">Cantidad de pallets preparados</label>
        <input type="number" class="form-control" id="pallets" required>
      </div>
    `;
  }

  if (task === "armado") {
    html += `
      <div class="mb-3">
        <label class="form-label">Cliente del pedido</label>
        <input type="text" class="form-control" id="cliente" required>
      </div>
    `;
  }

  if (task === "carga") {
    html += `
      <div class="mb-3">
        <label class="form-label">Chofer</label>
        <input type="text" class="form-control" id="chofer" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Faltantes (cantidad y descripción)</label>
        <textarea class="form-control" id="faltantes" rows="2"></textarea>
      </div>
    `;
  }

  if (task === "descarga") {
    html += `
      <div class="mb-3">
        <label class="form-label">Cliente</label>
        <input type="text" class="form-control" id="clienteDescarga" required>
      </div>
      <div class="mb-3">
        <label class="form-label">Foto del Remito</label>
        <input type="file" accept="image/*" capture="environment" class="form-control" id="remitoFoto" required>
      </div>
    `;
  }

  html += `<button type="submit" class="btn btn-primary mt-3">Finalizar y Enviar</button>`;
  form.innerHTML = html;
}

function submitForm(e) {
  e.preventDefault();

  const task = document.getElementById("taskType").value;
  const endTime = new Date();

  const formData = {
    task,
    operario: document.getElementById("operario").value,
    start: startTime.toISOString(),
    end: endTime.toISOString()
  };

  if (task === "clasificacion") {
    formData.pallets = document.getElementById("pallets").value;
  }

  if (task === "armado") {
    formData.cliente = document.getElementById("cliente").value;
  }

  if (task === "carga") {
    formData.chofer = document.getElementById("chofer").value;
    formData.faltantes = document.getElementById("faltantes").value;
  }

  if (task === "descarga") {
    formData.clienteDescarga = document.getElementById("clienteDescarga").value;
    const remitoInput = document.getElementById("remitoFoto");
    const file = remitoInput.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = function () {
        formData.remitoFoto = reader.result;
        sendData(formData);
      };
      reader.readAsDataURL(file);
    } else {
      sendData(formData);
    }

    return;
  }

  sendData(formData);
}

function sendData(data) {
  fetch("https://sheetdb.io/api/v1/u9lik4n7siykn", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(res => res.json())
    .then(response => {
      alert("Datos enviados correctamente.");
      document.getElementById("taskForm").innerHTML = "";
      document.getElementById("taskType").value = "";
    })
    .catch(error => {
      alert("Error al enviar los datos.");
      console.error(error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("taskType").addEventListener("change", renderTaskForm);
  document.getElementById("taskForm").addEventListener("submit", submitForm);
});
