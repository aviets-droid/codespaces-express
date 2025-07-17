const boardRows = 4;
const boardCols = 4;
const whitespace = "\u00A0";
const POLLINTERVAL = 2000;

let btn = document.getElementById("button");

let myChar = "";
let boardData = [];
let gameStarted = false;
let playersConnected = false;

connectToServer();
setInterval(pollServer, POLLINTERVAL);

async function pollServer() {
    return;
}

async function connectToServer() {
    try {
        const conns = await fetch('/conns');
        const conns_response = await conns.text();
        console.log(conns_response);
    }
    catch (error) {
        console.error("Error retrieving connected users: " + error);
    }
}

function onButtonClick() {
    let button = document.getElementById("button");
    let buttontext = button.textContent;
    console.log(buttontext + " button clicked");

    if (buttontext == "Flip") {
        button.disabled = true;
        onFlip();
    }
}

async function onFlip() {
    // Ping server
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
    }

    // Check for win condition
}

function clearBoard() {
    // Clear data

    // Clear display
    let table = document.getElementById('table');
    for (let i=1; i<=boardRows; i++) {
        for (let j=1; i<=boardCols; j++) {
            let cell = table.rows[i].cells[j];
            cell.textContent = whitespace;
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
    for (let i=1; i<=boardRows; i++) {
        let row = table.insertRow();
        boardData[i] = [];
        for (let j=1; j<=boardCols; j++) {
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