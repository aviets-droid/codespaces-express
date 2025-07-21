const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;

const path = require('path');
const fs = require('fs');

app.use('/static', express.static(path.join(__dirname, '/public/')));
app.use(express.json());

const BOARD_FILE = path.join(__dirname, '/data/', 'boards.json');

/**
 * @typedef {object} GameInformation
 * @property {int} gameID - Game identifier (so multiple games could be played at once).
 * @property {string} buttonState - "needsFlip", "isWaitingToStart", "isPlaying", "hasDraw", "hasWinner" 
 * @property {int} playerCount - Number of players connected.
 * @property {Array<Array<string>>} boardState - Game board.
 * @property {?string} currentPlayer - Last player to go ("X" or "O").
 * @property {?string} firstPlayer - First player to go  ("X" or "O").
*/

app.get('/', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, '/public/', 'index.html'));
})

// Join game
app.get('/join', (req, res) => {
  /**@type {Array<GameInformation>} */
  var gameList = JSON.parse(fs.readFileSync(BOARD_FILE));
  let gameID = -1;
  let joinOrder = 0;
  const lastGame = gameList[gameList.length - 1];
  if (lastGame.playerCount == 2){
    let newServer = CreateServer(lastGame.gameID);
    gameList.push(newServer);
    fs.writeFileSync(BOARD_FILE, JSON.stringify(gameList));
    gameID = newServer.gameID;
    joinOrder = 1;
  } else {
    const indexToUpdate = gameList.findIndex(game => game.gameID === lastGame.gameID);
    gameList[indexToUpdate].playerCount = 2;
    fs.writeFileSync(BOARD_FILE, JSON.stringify(gameList));
    gameID = lastGame.gameID;
    joinOrder = 2;
  }
  
  res.json({gameID: gameID, joinOrder: joinOrder});
  console.log(`Player ${joinOrder} joined game ${gameID}`);
})

// Get server's board data
app.get('/board', (req, res) => {
  const gameId = parseInt(req.query.gameID);
  const gameList = JSON.parse(fs.readFileSync(BOARD_FILE));
  const indexToGet = gameList.findIndex(game => game.gameID === gameId);
  res.json(gameList[indexToGet]);
})

// Update server's board data
app.post('/board', async (req, res) => {
  /** @type {GameInformation} */
  const gameInfo = req.body;
  /** @type {Array<GameInformation>} */
  const gameList = JSON.parse(fs.readFileSync(BOARD_FILE));
  const indexToUpdate = gameList.findIndex(game => game.gameID === gameInfo.gameID);
  
  gameList[indexToUpdate] = gameInfo;
  
  fs.writeFileSync(BOARD_FILE, JSON.stringify(gameList));
  res.json({success: true});
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
})

/**
 * 
 * @param {int} lastGameId - Last gameID stored in boards.json
 * @returns {GameInformation}
 */
function CreateServer(lastGameId){
  let newGameId = lastGameId + 1;
  return {
    gameID: newGameId,
    buttonState: "needsFlip",
    playerCount: 1,
    boardState: [[" "," "," "," "], [" "," "," "," "], [" "," "," "," "], [" "," "," "," "]],
    currentPlayer: null,
    firstPlayer: null
  }
}