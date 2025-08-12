// public/js/control.js

const socket = io();
let currentArea = null;

const areaSelect = document.getElementById('areaSelect');
const connectBtn = document.getElementById('connectBtn');
const timerEl = document.getElementById('timer');
const redNameInput = document.getElementById('redName');
const whiteNameInput = document.getElementById('whiteName');
const redScoreEl = document.getElementById('redScore');
const whiteScoreEl = document.getElementById('whiteScore');
const redFoulsEl = document.getElementById('redFouls');
const whiteFoulsEl = document.getElementById('whiteFouls');
const redOutsEl = document.getElementById('redOuts');
const whiteOutsEl = document.getElementById('whiteOuts');
const historyTableBody = document.getElementById('historyTableBody');

// --- Conexión ---
connectBtn.addEventListener('click', () => {
  const area = areaSelect.value;
  if (currentArea) socket.emit('leaveArea', currentArea);
  currentArea = area;
  socket.emit('joinArea', area);
  agregarEventoHistorial(`Conectado a Área ${area}`);
});

// --- Actualizar interfaz ---
socket.on('updateState', (state) => {
  timerEl.textContent = formatTime(state.timer);
  redNameInput.value = state.red.name;
  whiteNameInput.value = state.white.name;
  redScoreEl.textContent = state.red.score;
  whiteScoreEl.textContent = state.white.score;
  redFoulsEl.textContent = state.red.fouls;
  whiteFoulsEl.textContent = state.white.fouls;
  redOutsEl.textContent = state.red.outs || 0;
  whiteOutsEl.textContent = state.white.outs || 0;
});

// --- Historial ---
socket.on('eventOccurred', agregarEventoHistorial);

function agregarEventoHistorial(texto) {
  const row = document.createElement('tr');
  row.className = 'even:bg-gray-700 odd:bg-gray-800';

  const cell = document.createElement('td');
  cell.className = 'px-2 py-1';

  // (Opcional) Normalización rápida por si llegan mensajes crudos
  let t = texto.trim();
  t = t
    .replace(/^\s*RED\s*\+\d.*punto.*$/i, 'PUNTO Esquina Roja')
    .replace(/^\s*WHITE\s*\+\d.*punto.*$/i, 'PUNTO Esquina Blanca')
    .replace(/^\s*RED\s*-\d.*punto.*$/i, 'RESTA Esquina Roja')
    .replace(/^\s*WHITE\s*-\d.*punto.*$/i, 'RESTA Esquina Blanca')
    .replace(/falta.*red/i, 'FALTA Esquina Roja')
    .replace(/falta.*white/i, 'FALTA Esquina Blanca')
    .replace(/pausa|cronómetro pausado/i, 'TIEMPO MUERTO');

  // Colores por tipo
  if (/lesi/i.test(t)) cell.classList.add('text-red-400');
  else if (/descal/i.test(t)) cell.classList.add('text-red-500');
  else if (/punto|resta/i.test(t)) cell.classList.add('text-blue-400');
  else if (/falta/i.test(t)) cell.classList.add('text-yellow-400');
  else if (/tiempo muerto/i.test(t)) cell.classList.add('text-gray-400', 'italic');
  else cell.classList.add('text-white');

  cell.textContent = t;
  row.appendChild(cell);
  historyTableBody.appendChild(row);

  // Autoscroll: solo el contenedor de la tabla
  const scrollBox = document.getElementById('historyScrollBox');
  if (scrollBox) scrollBox.scrollTop = scrollBox.scrollHeight;
}

// --- Eventos de puntuación ---
document.querySelectorAll('.score-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!currentArea) return;
    const corner = btn.dataset.corner;
    const delta = parseInt(btn.dataset.delta);
    socket.emit('changeScore', { area: currentArea, corner, delta });
    agregarEventoHistorial(`${delta > 0 ? 'PUNTO' : 'RESTA'} Esquina ${corner === 'red' ? 'Roja' : 'Blanca'}`);
  });
});

// --- Faltas ---
document.querySelectorAll('.foul-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!currentArea) return;
    const corner = btn.dataset.corner;
    socket.emit('addFoul', { area: currentArea, corner });
    agregarEventoHistorial(`FALTA Esquina ${corner === 'red' ? 'Roja' : 'Blanca'}`);
  });
});

// --- Salidas ---
document.querySelectorAll('.out-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!currentArea) return;
    const corner = btn.dataset.corner;
    socket.emit('addOut', { area: currentArea, corner });
    agregarEventoHistorial(`SALIDA Esquina ${corner === 'red' ? 'Roja' : 'Blanca'}`);
  });
});

// --- Cronómetro ---
document.getElementById('startBtn').addEventListener('click', () => {
  if (!currentArea) return;
  socket.emit('startTimer', { area: currentArea });
  agregarEventoHistorial('Inicio del cronómetro');
});
document.getElementById('stopBtn').addEventListener('click', () => {
  if (!currentArea) return;
  socket.emit('stopTimer', { area: currentArea });
  agregarEventoHistorial('TIEMPO MUERTO');
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!currentArea) return;
  socket.emit('resetTimer', { area: currentArea });
  agregarEventoHistorial('Reinicio del cronómetro');
});

// --- Nombres ---
redNameInput.addEventListener('change', () => {
  if (!currentArea) return;
  socket.emit('updateCompetitors', {
    area: currentArea,
    red: redNameInput.value,
    white: whiteNameInput.value
  });
});
whiteNameInput.addEventListener('change', () => {
  if (!currentArea) return;
  socket.emit('updateCompetitors', {
    area: currentArea,
    red: redNameInput.value,
    white: whiteNameInput.value
  });
});

// --- Deshacer ---
document.getElementById('undoBtn')?.addEventListener('click', () => {
  if (!currentArea) return;
  socket.emit('undoAction', { area: currentArea });
  agregarEventoHistorial('Deshacer acción');
});

// --- Menú contextual ---
document.querySelectorAll('.options-menu').forEach(menu => {
  const toggle = menu.previousElementSibling;
  toggle.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });
});

// Lesionado / Descalificar
['lesion-btn', 'dq-btn'].forEach(cls => {
  document.querySelectorAll(`.${cls}`).forEach(btn => {
    btn.addEventListener('click', () => {
      const corner = btn.dataset.corner;
      const tipo = cls === 'lesion-btn' ? 'lesionado' : 'descalificado';
      const confirmMsg = tipo === 'descalificado' ? `¿Confirmás la descalificación de ${corner}?` : `¿Confirmás lesión de ${corner}?`;
      if (confirm(confirmMsg)) {
        socket.emit('endFight', {
          area: currentArea,
          winner: corner === 'red' ? 'white' : 'red',
          method: tipo.toUpperCase()
        });
        agregarEventoHistorial(`${tipo.toUpperCase()} Esquina ${corner === 'red' ? 'Roja' : 'Blanca'}`);
      }
    });
  });
});

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}
