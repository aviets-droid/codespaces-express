const boardRows = 4;
const boardCols = 4;
const whitespace = "\u00A0";
const POLLINTERVAL = 2000;

let myChar = "O"; // Make empty later
let boardData = []; // Filled with references to cells on page load, edit board with boardData[#][#].cell.textContent
let gameStarted = true; // Toggle true for testing
let connectionOrder = 0; // # following join order, i.e. 1st 2nd etc

let winnerExists = false;
let winnerChar = "";

// Todo: get/post this to/from server json
let gameData = {
    connectedPlayers: 0,
    board: [],
}

//
connectToServer();
setInterval(pollServer, POLLINTERVAL);
//

async function pollServer() {
    // Todo: Enable button if connectedPlayers is == 2
    // etc
    return;
}

// Verify client can communicate with server, track the order this client joined
async function connectToServer() {
    try {
        const conns = await fetch('/conns');
        const conns_response = await conns.text();
        console.log("I am player: " + conns_response);
        connectionOrder = parseInt(conns_response);
    }
    catch (error) {
        console.error("Server connection error: " + error);
    }
}

// Button click logic, flip/start/clear
function onButtonClick() {
    let button = document.getElementById("button");
    let buttontext = button.textContent;
    console.log(buttontext + " button clicked");

    if (buttontext == "Flip") {
        onFlip();
        // buttontext = "Start";
    }
    else if (buttontext == "Start") {
        buttontext = "Clear";
    }
    else if (buttontext == "Clear") {
        clearBoard();
        buttontext = "Start";
    }
}

async function onFlip() {
    // Flip coin to determine who goes first
    // Communicate turn order to server

    // Testing board functionality for now
    clearBoard();
}

function onCellClick(event) {
    // Update cell
    const targetCell = event.target;
    console.log("Cell clicked");

    if (!gameStarted || targetCell.classList.contains("filled")) {
        return;
    }
    else {
        targetCell.textContent = myChar;
        targetCell.classList.add("filled");
        checkBoardWinner();
    }
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
    if (charArr.includes(whitespace)) {
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
    for (let i=0; i<boardRows; i++) {
        let rowArr = boardData[i];

        if (allSameCells(rowArr)) {
            winningArr = rowArr;
            winnerChar = rowArr[0].textContent;
            winnerExists = true;
        }
    }

    // Column
    for (let i=0; i<boardCols; i++) {
        let colArr = [];

        for (j=0; j<boardRows; j++) {
            colArr.push(boardData[j][i]);
        }

        if (allSameCells(colArr)) {
            winningArr = colArr;
            winnerChar = colArr[0].textContent;
            winnerExists = true;
        }
    }

    // Negative Diagonal
    let NDiagonalArr = [];
    for (let i=0; i<boardRows; i++) {
        NDiagonalArr.push(boardData[i][i]);
    }
    if (allSameCells(NDiagonalArr)) {
        winningArr = NDiagonalArr;
        winnerChar = NDiagonalArr[0].textContent;
        winnerExists = true;
    }

    // Positive Diagonal
    let PDiagonalArr = []
    let maxidx = boardData.length - 1;
    for (let i=0; i<boardRows; i++) {
        PDiagonalArr.push(boardData[i][maxidx]);
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
function setCellClickability(bool) {
    for (let i=0; i<boardRows; i++) {
        for (let j=0; j<boardCols; j++) {
            let cell = boardData[i][j];
            if (bool) {
                cell.addEventListener('click', onCellClick);
            }
            else {
                cell.removeEventListener('click', onCellClick);
            }
        }
    }
}

function clearBoard() {
    if (boardData.length != boardCols) {
        updateInfoBar("Error: unexpected boardData length");
    };
    console.log(boardData);
    for (let i=0; i<boardRows; i++) {
        for (let j=0; j<boardCols; j++) {
            boardData[i][j].textContent = whitespace;
            boardData[i][j].className = "cell"; // Clear all classes from cell except for cell class
        }
    }
}

function updateInfoBar(info) {
    let infobar = document.getElementById("infobar");
    infobar.textContent = info;
}

// Create display (called on HTML parsed in index.html)
// Gameboard ID = "board"
// Button ID = "button"
function createDisplay() {
    // Game board
    let table = document.createElement('table');
    table.id = "board";
    for (let i=0; i<boardRows; i++) {
        let row = table.insertRow();
        boardData[i] = [];
        for (let j=0; j<boardCols; j++) {
            let cell = row.insertCell();
            cell.appendChild(document.createTextNode(whitespace));
            cell.classList.add("cell");
            cell.addEventListener('click', onCellClick);
            boardData[i][j] = cell;
        }
    }
    document.body.appendChild(table);

    // Button
    let button = document.createElement('button');
    button.id = "button";
    button.textContent = "Flip";
    button.addEventListener('click', onButtonClick);
    // button.disabled = true; // Disable button initially, enable it in pollServer when 2 clients connect
    document.body.appendChild(button);
}