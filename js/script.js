import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";

// Inicializar Firebase
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
  if (task === "armado") bgClass = "bg-info-subtle";
  if (task === "carga") bgClass = "bg-danger-subtle";
  if (task === "descarga") bgClass = "bg-success-subtle";

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
        <label class="form-label">Cantidad de pallets</label>
        <input type="number" class="form-control" id="pallets" required>
      </div>
    `;
  }

  if (task === "armado") {
    html += `
      <div class="mb-3">
        <label class="form-label">Cliente</label>
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
        <label class="form-label">Faltantes</label>
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

  html += `
    <button type="submit" class="btn btn-primary mt-3">Finalizar y Enviar</button>
  `;

  form.innerHTML = html;
}

async function uploadToImgur(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("https://api.imgur.com/3/image", {
    method: "POST",
    headers: {
      Authorization: "Client-ID 3e16ba3904bb85c"
    },
    body: formData
  });

  const data = await response.json();
  if (data.success) return data.data.link;
  else throw new Error("Error al subir la imagen a Imgur");
}

async function enviarAFirebase(data) {
  await addDoc(collection(db, "tareas"), {
    ...data,
    timestamp: serverTimestamp()
  });
}

async function submitForm(e) {
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
    remitoURL: ""
  };

  const fileInput = document.getElementById("remitoFoto");
  const file = fileInput?.files[0];

  try {
    if (file) {
      const url = await uploadToImgur(file);
      formData.remitoURL = url;
    }

    await enviarAFirebase(formData);

    alert("Datos enviados correctamente");
    document.getElementById("taskForm").innerHTML = "";
    document.getElementById("taskType").value = "";
  } catch (error) {
    console.error("Error al enviar datos:", error);
    alert("Error al enviar los datos");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("taskType").addEventListener("change", renderTaskForm);
  document.getElementById("taskForm").addEventListener("submit", submitForm);
});

