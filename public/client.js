const boardRows = 4;
const boardCols = 4;
const whitespace = "\u00A0";
const POLLINTERVAL = 2000;

let myChar = "O"; // Make empty later
let boardData = []; // Filled with references to cells on page load, edit board with boardData[#][#].cell.textContent
let gameStarted = true; // Toggle true for testing
let connectionOrder = 0; // # following join order, i.e. 1st 2nd etc
let numPlayersOK = false;

let winnerExists = false;
let winnerChar = "";

//
connectToServer();
setInterval(pollServer, POLLINTERVAL);
//

async function pollServer() {
    // Todo: Enable button if connectedPlayers is == 2
    try {
        const conns = await fetch('/conns');
        const conns_response = await conns.text();
        numPlayersOK = conns_response === "true";
    }
    catch (error) {
        console.error("Error retrieving number of connected players: " + error);
    }

    if (!numPlayersOK) {
        let button = document.getElementById('button');
        button.disabled = true;
        updateInfoBar("Too many/too few players connected. Accepted number of players is 2.");
    }

    else {
        if (button.textContent == "Flip") {
            if (connectionOrder == 1) {
                button.disabled = false;
                updateInfoBar("Press flip to begin.");
            }
            else {
                button.disabled = true;
                updateInfoBar("Waiting on player 1 to flip...");
            }
        }
        else if (button.textContent == "Start") {
            button.disabled = false;
            updateInfoBar("Press start to begin.");
        }
        else {
            button.disabled = false;
            updateInfoBar("Press clear to restart the game.");
        }
    }

    console.log("numPlayersOK: " + numPlayersOK);
    // etc
    return;
}

// Verify client can communicate with server, track the order this client joined
async function connectToServer() {
    try {
        const order = await fetch('/order');
        const order_response = await order.text();
        console.log("I am player: " + order_response);
        connectionOrder = parseInt(order_response);
    }
    catch (error) {
        console.error("Server connection error: " + error);
    }
}

async function updateServerBoard() {
    // Map 2D array of cells to 2D array of chars in JSON format
    const boardJSON = boardData.map(row => {
        row.map(cell => cell.textContent);
    });

    // Send JSON to server data
    try {
        const sendboard = await fetch('/sendboard', {
            method: 'POST',
            headers: {'Content-Type': 'application/JSON'},
            body: JSON.stringify({board: boardJSON})
        });

        if (!sendboard.ok) {
            throw new Error("Server error: " + sendboard.status);
        };

        console.log("Board sent to server. " + sendboard.status);
    }
    catch (error) {
        console.error("Error updating server's gameboard: " + error);
    }
}

// Button click logic, flip/start/clear
function onButtonClick() {
    let button = document.getElementById("button");
    let buttontext = button.textContent;
    console.log(buttontext + " button clicked");

    switch (buttontext) {
        case "Flip":
            button.textContent = "Start";
            onFlip();
            break;
        case "Start":
            button.textContent = "Clear";
            break;
        case "Clear":
            button.textContent = "Start";
            clearBoard();
            break;
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
    document.body.appendChild(button);
}