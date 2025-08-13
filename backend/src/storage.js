const XLSX = require("xlsx");
const fs = require("fs");

const FILE_PATH = "../db/fights.xlsx";

function saveFight(fightData) {
  let wb, ws;

  if (fs.existsSync(FILE_PATH)) {
    wb = XLSX.readFile(FILE_PATH);
    ws = wb.Sheets[wb.SheetNames[0]];
  } else {
    wb = XLSX.utils.book_new();
    ws = XLSX.utils.aoa_to_sheet([
      [
        "Área",
        "Rojo",
        "Blanco",
        "Puntos Rojo",
        "Puntos Blanco",
        "Faltas Rojo",
        "Faltas Blanco",
        "Ganador",
        "Método",
        "Duración (s)",
      ],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Fights");
  }

  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  data.push([
    fightData.area,
    fightData.red,
    fightData.white,
    fightData.scoreRed,
    fightData.scoreWhite,
    fightData.foulsRed,
    fightData.foulsWhite,
    fightData.winner,
    fightData.method,
    fightData.duration,
  ]);

  const newWS = XLSX.utils.aoa_to_sheet(data);
  wb.Sheets[wb.SheetNames[0]] = newWS;
  XLSX.writeFile(wb, FILE_PATH);
}

module.exports = { saveFight };
