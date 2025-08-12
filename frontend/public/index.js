const socket = io();
let currentArea = null;

const areaInput = document.getElementById('areaInput');
const joinAreaBtn = document.getElementById('joinAreaBtn');
const areaContainer = document.getElementById('areaContainer');

function renderFight(fight) {
  if(!fight) {
    areaContainer.innerHTML = '<p>No hay pelea activa en esta área.</p>';
    return;
  }

  const {area, categoria, red, white, timer, status, history} = fight;

  const timerStr = `${Math.floor(timer/60)}:${(timer%60).toString().padStart(2,'0')}`;

  let timeMutedLabel = '';
  if(status === 'detenida') timeMutedLabel = '<span class="time-muted">Tiempo muerto</span>';
  if(status === 'finalizada') timeMutedLabel = '<span class="time-muted" style="background:red;">FINALIZADA</span>';

  const histHtml = history.map(ev => {
    let cl = '';
    if(ev.type === 'inicio' || ev.type === 'fin') cl = ev.type;
    else if(ev.type === 'tiempoMuerto') cl = 'tiempoMuerto';
    else if(ev.type === 'falta' || ev.type === 'salida') cl = 'falta';
    else if(ev.type === 'segundaFalta') cl = 'segundaFalta';
    else if(ev.type === 'descalificacion' || ev.type === 'lesionado') cl = 'descalificacion';

    let txt = ev.text;
    if(ev.corner === 'red') txt = txt.replace(/(\b\w+\b)/g, '<span class="redPlayer">$1</span>');
    else if(ev.corner === 'white') txt = txt.replace(/(\b\w+\b)/g, '<span class="whitePlayer">$1</span>');

    return `<span class="${cl}">${txt}</span>`;
  }).join('');

  areaContainer.innerHTML = `
    <div class="area">
      <div class="header">
        <div><strong>Área ${area}</strong></div>
        <div class="category">${categoria}</div>
      </div>
      <div class="names">
        <div class="red">${red.name}</div>
        <div class="white">${white.name}</div>
      </div>
      <div class="scores">
        <div class="score red">${red.score}</div>
        <div class="score white">${white.score}</div>
      </div>
      <div class="timer">
        ${timerStr} ${timeMutedLabel}
      </div>
      <div class="history">${histHtml}</div>
    </div>
  `;
}

joinAreaBtn.onclick = () => {
  const areaId = areaInput.value.trim();
  if(!areaId) return alert('Ingresa número de área');
  currentArea = areaId;
  socket.emit('joinArea', areaId);
};

socket.on('updateState', (fight) => {
  renderFight(fight);
});
