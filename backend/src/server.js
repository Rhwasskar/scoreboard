const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const ScoreManager = require("./scoreManager");
const { saveFight } = require("./storage");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const path = require("path");
const publicDir = path.resolve(__dirname, "../../frontend/public");
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(publicDir));

// Diccionario de áreas -> ScoreManager
const areas = {};

// Crear área si no existe
function getArea(areaId) {
  if (!areas[areaId]) areas[areaId] = ScoreManager(areaId);
  return areas[areaId];
}

// Enviar estado a todos en un área específica
function broadcastState(areaId) {
  const state = getArea(areaId).getState();
  io.to(`area_${areaId}`).emit("updateState", state);
}

// Cronómetro global, corre cada segundo
setInterval(() => {
  for (let areaId in areas) {
    const manager = areas[areaId];
    manager.timerTick();
    broadcastState(areaId);
  }
}, 1000);

io.on("connection", (socket) => {
  console.log("Cliente conectado");

  // Cliente se une a un área
  socket.on("joinArea", (areaId) => {
    socket.join(`area_${areaId}`);
    console.log(`Cliente unido a área ${areaId}`);
    socket.emit("updateState", getArea(areaId).getState());
  });

  // Cambios de puntuación
  socket.on("changeScore", ({ area, corner, delta }) => {
    const manager = getArea(area);
    manager.changeScore(corner, delta);
    broadcastState(area);
  });

  // Faltas
  socket.on("addFoul", ({ area, corner }) => {
    const manager = getArea(area);
    manager.addFoul(corner, "normal");
    broadcastState(area);
  });

  // Cronómetro
  socket.on("startTimer", ({ area }) => {
    getArea(area).start();
    broadcastState(area);
  });

  socket.on("stopTimer", ({ area }) => {
    getArea(area).stop();
    broadcastState(area);
  });

  socket.on("resetTimer", ({ area }) => {
    getArea(area).reset();
    broadcastState(area);
  });

  // Actualizar competidores
  socket.on("updateCompetitors", ({ area, red, white }) => {
    const manager = getArea(area);
    manager.setCompetitors(red, white);
    broadcastState(area);
  });

  // Deshacer
  socket.on("undoAction", ({ area }) => {
    const manager = getArea(area);
    manager.undo();
    broadcastState(area);
  });

  // Finalizar pelea manual
  socket.on("endFight", ({ area, winner, method }) => {
    const manager = getArea(area);
    const state = manager.getState();

    saveFight({
      area: state.area,
      red: state.red.name,
      white: state.white.name,
      scoreRed: state.red.score,
      scoreWhite: state.white.score,
      foulsRed: state.red.fouls,
      foulsWhite: state.white.fouls,
      winner,
      method,
      duration: 120 - state.timer,
    });

    console.log(`Pelea de área ${area} guardada en fights.xlsx`);

    // Reset marcador para siguiente pelea
    manager.reset();
    manager.setCompetitors("J. PEREZ", "M. LOPEZ"); // placeholders
    broadcastState(area);
  });
});

server.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
