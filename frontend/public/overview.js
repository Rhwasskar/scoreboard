const socket = io();
const areasContainer = document.getElementById('areasContainer');

let areasState = {}; // areaId -> state

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Renderiza todas las tarjetas
function renderAreas() {
  areasContainer.innerHTML = '';
  
  Object.values(areasState).forEach(state => {
    const card = document.createElement('div');
    card.className = "bg-gray-900 rounded-xl p-4 shadow-lg flex flex-col";

    // Estado visual
    let statusColor = 'text-green-400';
    let statusText = 'En curso';
    if (state.status === 'detenida') {
      statusColor = 'text-orange-400';
      statusText = 'Tiempo Muerto';
    } else if (state.status === 'finalizada') {
      statusColor = 'text-red-500';
      statusText = 'Finalizada';
    } else if (state.status === 'arreglada') {
      statusColor = 'text-blue-400';
      statusText = 'Arreglada';
    }

    card.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h2 class="text-lg font-bold">Área ${state.area}</h2>
        <span class="${statusColor} font-semibold">${statusText}</span>
      </div>
      <div class="text-sm text-orange-400 font-bold mb-2">${state.category || ''}</div>
      <div class="text-center text-3xl font-mono mb-2">${formatTime(state.timer)}</div>
      <div class="grid grid-cols-2 gap-2">
        <!-- Roja -->
        <div class="bg-red-700 p-2 rounded text-center">
          <div class="font-bold text-white truncate">${state.red.name}</div>
          <div class="text-3xl font-bold">${state.red.score}</div>
          <div class="text-xs mt-1">F:${state.red.fouls} S:${state.red.outs}</div>
        </div>
        <!-- Blanca -->
        <div class="bg-white p-2 rounded text-center">
          <div class="font-bold text-black truncate">${state.white.name}</div>
          <div class="text-3xl font-bold text-black">${state.white.score}</div>
          <div class="text-xs mt-1 text-black">F:${state.white.fouls} S:${state.white.outs}</div>
        </div>
      </div>
    `;
    areasContainer.appendChild(card);
  });
}

// --- Socket ---
socket.emit('overviewMode', true); // Pedimos al server que nos mande todas las áreas

socket.on('updateAllAreas', allAreas => {
  areasState = allAreas;
  renderAreas();
});
