module.exports = function ScoreManager(areaId) {
  let timer = 120; // 2 minutos
  let running = false;
  let history = [];

  const state = {
    area: areaId,
    red: { name: "J. PEREZ", score: 0, fouls: 0 },
    white: { name: "M. LOPEZ", score: 0, fouls: 0 },
    timer: timer
  };

  function getState() {
    return JSON.parse(JSON.stringify(state));
  }

  function changeScore(corner, delta) {
    history.push(getState());
    state[corner].score = Math.max(0, state[corner].score + delta);
  }

  function addFoul(corner, type = 'normal') {
    history.push(getState());
    state[corner].fouls += 1;
  }

  function undo() {
    if (history.length > 0) {
      const prev = history.pop();
      Object.assign(state, prev);
    }
  }

  function timerTick() {
    if (running && state.timer > 0) {
      state.timer--;
      if (state.timer <= 0) {
        running = false;
        console.log(`⏱️ Tiempo finalizado en área ${state.area}`);
      }
    }
  }

  function start() { running = true; }
  function stop() { running = false; }

  function reset() {
    history = [];
    state.red.score = 0;
    state.red.fouls = 0;
    state.white.score = 0;
    state.white.fouls = 0;
    state.timer = timer;
    running = false;
  }

  function setCompetitors(red, white) {
    state.red.name = red;
    state.white.name = white;
  }

  return {
    getState,
    changeScore,
    addFoul,
    undo,
    timerTick,
    start,
    stop,
    reset,
    setCompetitors
  };
};
