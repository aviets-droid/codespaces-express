/*
[CS491 - Assignment 4: Main] 4x4 Tic-Tac-Toe
Aisling Viets & Nicky Victoriano | 22 July 2025
*/

// #region Global Variables

const BOARD_ROWS = 4;
const BOARD_COLS = 4;
const WHITESPACE = "\u00A0";
const POLL_INTERVAL = 1000;

// Game states (buttonState enum)
const FLIPPING = "needsFlip";
const WAITING = "isWaitingToStart";
const PLAYING = "isPlaying";
const DRAW = "hasDraw";
const WIN = "hasWinner";

/**
 * @typedef {object} GameInformation
 * @property {int} gameID - Game identifier (so multiple games could be played at once).
 * @property {string} buttonState - Constants: FLIPPING, WAITING, PLAYING, DRAW, WIN
 * @property {int} playerCount - Number of players connected.
 * @property {Array<Array<string>>} boardState - Game board.
 * @property {?string} currentPlayer - Current player to go ("X" or "O").
 * @property {?string} firstPlayer - First player to go  ("X" or "O").
*/


var pollIntervalId = null;

/** 
 * ID used for pulling game info
 * @type {int} 
 */
var myGameID = -1;

/** 
 * Game state information
 * @type {GameInformation}
 */
var myGame = {};

/**
 * "X" or "O" character for this player
 * @type {?string}
 */
var myChar = null;

// HTML elements
/**
 * Flip/Clear/Start button
 * @type {HTMLButtonElement}
 */
var button;

/**
 * Infobar for displaying game information
 * @type {HTMLParagraphElement}
 */
var infobar;

/**
 * 2D array of cells on the board
 * @type {Array<Array<HTMLTableCellElement>>}
 * @description Filled with references to cells on page load, edit board with boardCells[x][x].textContent
 */
var boardCells = [];

// #endregion

// #region Game Communication

/**
 * Updates game state in server.
 * @function putToken
 * @returns {boolean} - Success.
 */
async function putToken() {
    const response = await fetch('/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(myGame)
    });
    const result = await response.json();
    if (result.success === true)
        updateGameDisplay();
    return result.success;
}

/**
 * Receives game's JSON object from Server.
 * @function getToken
 * @returns {GameInformation}
 */
async function getToken() {
    const response = await fetch(`/board?gameID=${myGameID}`);

    if (response.ok) { // Error checking for valid response and JSON -Ais
        const headerCT = response.headers.get("content-type");
        if (headerCT?.includes("application/json")) {
            return await response.json(); // Safe to parse
        } else {
            console.warn("Token from server not of content type application/json.");
            return {};
        }
    } else {
        console.warn(`Request to server failed with code ${response.status}.`);
        return {};
    }
}

/**
 * Updates server's board data with current board state.
 * @function updateServerBoard
 */
async function updateServerBoard() {
    // Map 2D array of cells to 2D array of chars in JSON format
    const boardJSON = boardCells.map(row => {
        return row.map(cell => cell.textContent);
    });

    myGame.boardState = boardJSON;
    myGame.currentPlayer = myChar === "X" ? "O" : "X";

    await putToken();
}

// #endregion

// #region Gameplay

/**
 * Checks if all cells in the given array have the same character.
 * @function allSameCells
 * @param {Array<string>} arr - Array of cells to check if all have the same character.
 * @returns {boolean} - Returns true if all cells in the array have the same character.
 */
function allSameCells(arr) {
    let arrLen = arr.length;
    let charArr = [];

    // Populate charArr with textcontents from arr
    for (let i=0; i<arrLen; i++) {
        charArr[i] = arr[i].textContent;
    }

    // Return false if there's whitespace anywhere
    if (charArr.includes(WHITESPACE)) {
        return false;
    }

    // Check if array has elements that are all the same character
    let isSame = charArr.every(cell => cell === charArr[0]);
    return isSame;
}

/**
 * Checks if a win is blocked by both players in the given array.
 * @function winBlocked
 * @param {Array<string>} arr - Array of cells to check for blocked win.
 * @returns {boolean} - Returns true if the array has both "X" and "O" in it, indicating a blocked win.
 */
function winBlocked(arr){
    let arrLen = arr.length;
    let charArr = [];

    // Populate charArr with textcontents from arr
    for (let i=0; i<arrLen; i++) {
        charArr[i] = arr[i].textContent;
    }

    // Check if array has X's and O's in any cell
    if (charArr.includes("X") && charArr.includes("O")){
        return true;
    }

    return false;
}

/**
 * Checks the board for a winner or draw.
 * @function checkBoardWinner
 * @returns {void}
 */
async function checkBoardWinner() {
    let winningArr = [];
    let winnerChar = "";
    let winnerExists = false;
    let drawExists = true;

    // Row
    for (let i=0; i<BOARD_ROWS; i++) {
        let rowArr = boardCells[i];

        if (drawExists){
            drawExists = winBlocked(rowArr);
        }

        if (allSameCells(rowArr)) {
            winningArr = rowArr;
            winnerChar = rowArr[0].textContent;
            winnerExists = true;
        }
    }

    // Column
    for (let i=0; i<BOARD_COLS; i++) {
        let colArr = [];

        for (let j=0; j<BOARD_ROWS; j++) {
            colArr.push(boardCells[j][i]);
        }

        if (drawExists){
            drawExists = winBlocked(colArr);
        }

        if (allSameCells(colArr)) {
            winningArr = colArr;
            winnerChar = colArr[0].textContent;
            winnerExists = true;
        }
    }

    // Negative Diagonal
    let NDiagonalArr = [];
    for (let i=0; i<BOARD_ROWS; i++) {
        NDiagonalArr.push(boardCells[i][i]);
    }

    if (drawExists){
        drawExists = winBlocked(NDiagonalArr);
    }
    
    if (allSameCells(NDiagonalArr)) {
        winningArr = NDiagonalArr;
        winnerChar = NDiagonalArr[0].textContent;
        winnerExists = true;
    }

    // Positive Diagonal
    let PDiagonalArr = []
    let maxidx = boardCells.length - 1;
    for (let i=0; i<BOARD_ROWS; i++) {
        PDiagonalArr.push(boardCells[i][maxidx]);
        maxidx--;
    }

    if (drawExists){
        drawExists = winBlocked(PDiagonalArr);
    }

    if (allSameCells(PDiagonalArr)) {
        winningArr = PDiagonalArr;
        winnerChar = PDiagonalArr[0].textContent;
        winnerExists = true;
    }

    // Update cells
    if (winnerExists) {
        let arrLen = winningArr.length;
        let cellclass = "";

        // Setting class to use for cell styling
        if (winnerChar == myChar) {
            cellclass = "winner";
        }
        else {
            cellclass = "winner_other";
        }

        // Add class
        for (let i=0; i<arrLen; i++) {
            winningArr[i].classList.add(cellclass);
        }

        if (myGame.buttonState !== WIN) {
            myGame.buttonState = WIN;
            myGame.firstPlayer = winnerChar; // Set first player to winner
        }
        return;
    }

    if (drawExists && myGame.buttonState !== DRAW) {
        myGame.buttonState = DRAW;
        return;
    }
}

// #endregion

// #region Updaters

/**
 * Updates the game display based on the current game state.
 * @function updateGameDisplay
 */
function updateGameDisplay() {
    updateBoardHTML();
    checkBoardWinner();

    switch (myGame.buttonState) {
        case WIN:
            button.textContent = "Clear";
            button.disabled = false;
            if (myGame.firstPlayer === myChar) {
                button.disabled = false;
                updateInfoBar(`${myGame.firstPlayer} wins! Press clear to restart.`); 
            } else {
                button.disabled = true;
                updateInfoBar(`${myGame.firstPlayer} wins! Wait for them to restart.`); 
            }
            break;
        case DRAW:
            button.textContent = "Clear";
            button.disabled = false;
            updateInfoBar("It's a draw! Press clear to restart.");
            break;
        case FLIPPING:
            button.textContent = "Flip";
            if (myChar === "X") {
                button.disabled = false;
                updateInfoBar("Press flip to begin.");
            } else {
                button.disabled = true;
                updateInfoBar("Waiting on X to flip...");
            }
            break;
        case WAITING:
            button.textContent = "Start";
            if (myGame.firstPlayer === myChar) {
                button.disabled = false;
                updateInfoBar("Press 'Start' to begin.");
            } else {
                button.disabled = true;
                updateInfoBar(`${myGame.firstPlayer} is going first. Wait for them to start.`)
            }
            break;
        case PLAYING:
            button.textContent = "Clear";
            button.disabled = false;
            updateInfoBar(`Press clear to restart the game. Current player is ${myGame.currentPlayer} ${myGame.currentPlayer == myChar ? "(you)" : "(other player)"}.`);
            break;
        default:
            button.disabled = true;
            updateInfoBar("Waiting...");
            break;
    }
}

/**
 * Clears the game board and resets the game state.
 * @function clearBoard
 */
async function clearBoard() {
    if (boardCells.length != BOARD_COLS) {
        updateInfoBar("Error: unexpected boardData length");
    };
    console.log(boardCells);
    for (let i=0; i<BOARD_ROWS; i++) {
        for (let j=0; j<BOARD_COLS; j++) {
            boardCells[i][j].textContent = WHITESPACE;
            boardCells[i][j].className = "cell"; // Clear all classes from cell except for cell class
            myGame.boardState[i][j] = WHITESPACE;
        }
    }
    myGame.currentPlayer = myGame.firstPlayer; // Reset current player to first player
    await putToken();
}

function updateInfoBar(info) {
    infobar.textContent = info;
}

/**
 * Update board visually from boardState.
 * @function updateBoardHTML
 */
function updateBoardHTML() {
    for (let i=0; i<BOARD_ROWS; i++) {
        for (let j=0; j<BOARD_COLS; j++) {
            boardCells[i][j].textContent = myGame.boardState[i][j];
            boardCells[i][j].className = "cell";
            if (["X", "O"].includes(myGame.boardState[i][j])) {
                boardCells[i][j].classList.add("filled");
            }
        }
    }

    return;
}

// #endregion

// #region Listeners

/**
 * Polls the server for updates to the game state.
 * @function pollServer
 */
async function pollServer() {
    if (myGameID === -1) {
        return;
    }

    const pulledGame = await getToken();

    if (pulledGame) {
        if (JSON.stringify(myGame) === JSON.stringify(pulledGame)){
            return;
        }
        myGame = pulledGame;
    } else {
        console.warn("Game pulled from server is stale/invalid. Skipping update due to invalid state.");
    }

    console.log("Button state: " + myGame.buttonState);
    
    if (myGame.playerCount !== 2) {
        let button = document.getElementById('button');
        button.disabled = true;
        updateInfoBar("Waiting for player 2...");
        return;
    } else {
        if (!myGame.buttonState) {
            updateInfoBar("Waiting...");
            return;
        }
        updateGameDisplay();
    }
}

/**
 * Handles button clicks for Flip/Clear/Start.
 * @function onButtonClick
 */
function onButtonClick() {
    buttontext = button.textContent;
    console.log(buttontext + " button clicked");

    switch (buttontext) {
        case "Flip":
            onFlip();
            break;
        case "Start":
            onStart();
            break;
        case "Clear":
            onClear();
            break;
    }
}

/**
 * Handles coin flip to determine first player.
 * @function onFlip
 */
async function onFlip() {
    let playerChars = ["X", "O"];
    myGame.firstPlayer = playerChars[Math.floor(Math.random() * 2)]; // Random number 1 - 2
    myGame.buttonState = WAITING;
    clearBoard();
}

/**
 * Handles game start after flip.
 * @function onStart
 */
async function onStart() {
    myGame.buttonState = PLAYING;
    await putToken();
}

/**
 * Handles clearing the board.
 * @function onClear
 */
async function onClear(){
    myGame.buttonState = WAITING;
    clearBoard();
}

function onCellClick(event) {
    // Update cell
    const targetCell = event.target;
    console.log("Cell clicked");

    if (myGame.buttonState != PLAYING 
        || targetCell.classList.contains("filled") 
        || myGame.currentPlayer !== myChar) {
        return;
    } else {
        targetCell.textContent = myChar;
        targetCell.classList.add("filled");
        myGame.currentPlayer = myChar === "X" ? "O" : "X";
        checkBoardWinner();
        updateServerBoard();
    }
}

// #endregion

// #region Initialization

/**
 * Connects to the server and retrieves game ID and player character.
 * @function connectToServer
 */
async function connectToServer() {
    const connection = await fetch('/join');
    let myInfo = await connection.json();
    myGameID = myInfo.gameID;
    myChar = myInfo.joinOrder === 1 ? "X" : "O";
    updateInfoBar(`Joined game #${myGameID} as ${myChar}!`);
    startPolling();
}

/**
 * Creates the game display with a board, button, and infobar.
 * @function createDisplay
 */
function createDisplay() {
    // Game board
    let table = document.createElement('table');
    table.id = "board";
    for (let i=0; i<BOARD_ROWS; i++) {
        let row = table.insertRow();
        boardCells[i] = [];
        for (let j=0; j<BOARD_COLS; j++) {
            let cell = row.insertCell();
            cell.appendChild(document.createTextNode(WHITESPACE));
            cell.classList.add("cell");
            cell.addEventListener('click', onCellClick);
            boardCells[i][j] = cell;
        }
    }
    document.body.appendChild(table);

    // Button
    button = document.createElement('button');
    button.id = "button";
    button.textContent = "Waiting";
    button.disabled = true;
    button.addEventListener('click', onButtonClick);
    document.body.appendChild(button);

    // Infobar
    infobar = document.getElementById('infobar');

    connectToServer();
}

/** 
 * Starts polling the server for updates.
 * @function startPolling
 */
function startPolling() {
    if (pollIntervalId) clearInterval(pollIntervalId); // Clear any existing interval
    pollIntervalId = setInterval(pollServer, POLL_INTERVAL); // Poll every second
    console.log("Polling started.");
}

// #endregion