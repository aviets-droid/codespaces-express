// #region Global Variables

const BOARD_ROWS = 4;
const BOARD_COLS = 4;
const WHITESPACE = "\u00A0";
const POLL_INTERVAL = 1000;

/**
 * @typedef {object} GameInformation
 * @property {int} gameID - Game identifier (so multiple games could be played at once).
 * @property {string} buttonState - "needsFlip", "isWaitingToStart", "isPlaying", "hasDraw", "hasWinner" 
 * @property {int} playerCount - Number of players connected.
 * @property {Array<Array<string>>} boardState - Game board.
 * @property {?string} currentPlayer - Current player to go ("X" or "O").
 * @property {?string} firstPlayer - First player to go  ("X" or "O").
*/

// Game info
var pollIntervalId = null;
var myGameID = -1;

/** @type {GameInformation} */
var myGame = {};
var myChar = null; // Make empty later

// HTML elements
var button;
var infobar;
var boardCells = []; // Filled with references to cells on page load, edit board with boardCells[#][#].cell.textContent

var winnerExists = false;
var winnerChar = "";

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
    return result.success;
}

/**
 * Receives game's JSON file from Server.
 * @function getToken
 * @returns {GameInformation}
 */
async function getToken() {
    const response = await fetch(`/board?gameID=${myGameID}`);
    return await response.json();;
}

// #endregion

// #region Gameplay

async function updateServerBoard() {
    // Map 2D array of cells to 2D array of chars in JSON format
    const boardJSON = boardCells.map(row => {
        return row.map(cell => cell.textContent);
    });

    myGame.boardState = boardJSON;
    myGame.currentPlayer = myChar === "X" ? "O" : "X";

    await putToken();
}

// Given an array of cells, check the textContent of all elements, return true if all equal
function allSameCells(arr) {
    let arrLen = arr.length;
    let charArr = [];

    // Populate charArr with textcontents from arr
    for (i=0; i<arrLen; i++) {
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

// Check the board for a winner
function checkBoardWinner() {
    let winningArr = [];

    // Row
    for (let i=0; i<BOARD_ROWS; i++) {
        let rowArr = boardCells[i];

        if (allSameCells(rowArr)) {
            winningArr = rowArr;
            winnerChar = rowArr[0].textContent;
            winnerExists = true;
        }
    }

    // Column
    for (let i=0; i<BOARD_COLS; i++) {
        let colArr = [];

        for (j=0; j<BOARD_ROWS; j++) {
            colArr.push(boardCells[j][i]);
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

        // Make all cells unclickable
        // setCellClickability(false);
    }
}

// Change clickability of every cell on the board
function setCellClickability() {
    for (let i=0; i<BOARD_ROWS; i++) {
        for (let j=0; j<BOARD_COLS; j++) {
            let cell = boardCells[i][j];
            if (myGame.buttonState === "isPlaying" 
                && cell.textContent === WHITESPACE 
                && myGame.currentPlayer === myChar) {   
                cell.removeEventListener('click', onCellClick);
                cell.addEventListener('click', onCellClick);
            } else {
                cell.removeEventListener('click', onCellClick);
            }
        }
    }
}

async function clearBoard() {
    if (boardCells.length != BOARD_COLS) {
        updateInfoBar("Error: unexpected boardData length");
    };
    console.log(boardCells);
    for (let i=0; i<BOARD_ROWS; i++) {
        for (let j=0; j<BOARD_COLS; j++) {
            boardCells[i][j].textContent = WHITESPACE;
            boardCells[i][j].className = "cell"; // Clear all classes from cell except for cell class
        }
    }

    await putToken();
}

function updateInfoBar(info) {
    infobar.textContent = info;
}

// #endregion

// #region Listeners

async function pollServer() {
    if (myGameID === -1) {
        return;
    }

    const pulledGame = await getToken();

    if (JSON.stringify(myGame) === JSON.stringify(pulledGame)){
        return;
    }

    myGame = pulledGame;

    if (myGame.playerCount !== 2) {
        let button = document.getElementById('button');
        button.disabled = true;
        updateInfoBar("Waiting for player 2...");
        return;
    } else {
        if (myGame.buttonState === "needsFlip") {
            button.textContent = "Flip";
            if (myChar === "X") {
                button.disabled = false;
                updateInfoBar("Press flip to begin.");
            } else {
                button.disabled = true;
                updateInfoBar("Waiting on X to flip...");
            }
        } else if (myGame.buttonState === "isWaitingToStart") {
            button.textContent = "Start";
            if (myGame.firstPlayer === myChar) {
                button.disabled = false;
                updateInfoBar("Press 'Start' to begin.");
            } else {
                button.disabled = true;
                updateInfoBar(`${myGame.firstPlayer} is going first! Wait for them to start!`)
            }
        } else {
            button.textContent = "Clear";
            button.disabled = false;
            updateInfoBar(`Press clear to restart the game. Current player is ${myGame.currentPlayer}.`);
        }
    }
    // etc
    return;
}

// Button click logic, flip/start/clear
function onButtonClick() {
    buttontext = button.textContent;
    console.log(buttontext + " button clicked");

    switch (buttontext) {
        case "Flip":
            button.textContent = "Start";
            onFlip();
            break;
        case "Start":
            button.textContent = "Clear";
            onStart();
            break;
        case "Clear":
            button.textContent = "Start";
            onClear();
            break;
    }
}

async function onFlip() {
    let playerChars = ["X", "O"];
    myGame.firstPlayer = playerChars[Math.floor(Math.random() * 2)]; // Random number 1 - 2
    myGame.currentPlayer = myGame.firstPlayer;
    myGame.buttonState = "isWaitingToStart";
    clearBoard();
}

async function onStart() {
    myGame.buttonState = "isPlaying";
    await putToken();
}

async function onClear(){
    clearBoard();
}

function onCellClick(event) {
    // Update cell
    const targetCell = event.target;
    console.log("Cell clicked");

    if (myGame.buttonState != "isPlaying" 
        || targetCell.classList.contains("filled") 
        || myGame.currentPlayer !== myChar) {
        return;
    } else {
        targetCell.textContent = myChar;
        targetCell.classList.add("filled");
        checkBoardWinner();
        myGame.currentPlayer = myChar === "X" ? "O" : "X";
        updateServerBoard();
    }
}

// #endregion

// #region Initialization

// Verify client can communicate with server, track the order this client joined
async function connectToServer() {
    const connection = await fetch('/join');
    let myInfo = await connection.json();
    myGameID = myInfo.gameID;
    myChar = myInfo.joinOrder === 1 ? "X" : "O";
    updateInfoBar(`Joined game #${myGameID} as ${myChar}!`);
    startPolling();
}

// Create display (called on HTML parsed in index.html)
// Gameboard ID = "board"
// Button ID = "button"
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

/** Starts polling the server for updates.
 * @function startPolling
 */
function startPolling() {
    if (pollIntervalId) clearInterval(pollIntervalId); // Clear any existing interval
    pollIntervalId = setInterval(pollServer, POLL_INTERVAL); // Poll every second
    console.log("Polling started.");
}

// #endregion