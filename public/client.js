const boardRows = 4;
const boardCols = 4;
const whitespace = "\u00A0";

// Poll Server function here

function onTableClick() {
    //
}

function onButtonClick() {
    //
}

// Create display function (on HTML parse)
// Gameboard ID = "board"
// Button ID = "button"
function createDisplay() {
    // Game board
    let table = document.createElement('table');
    table.id = "board";
    for (let i=1; i<=boardRows; i++) {
        let row = table.insertRow();
        for (let j=1; j<=boardCols; j++) {
            let cell = row.insertCell();
            cell.appendChild(document.createTextNode(whitespace));
            cell.classList.add("cell");
        }
    }
    document.body.appendChild(table);

    // Button
    let button = document.createElement('button');
    button.id = "button";
    button.textContent = "Flip";
    document.body.appendChild(button);
}