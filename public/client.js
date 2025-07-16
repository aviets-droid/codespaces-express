const boardRows = 4;
const boardCols = 4;
const whitespace = "\u00A0";

// Poll Server function here

function createTable() {
    let table = document.createElement('table');
    let rows = 4;
    let cols = 4;
    
    table.id = "board";
    for (let i=1; i<=rows; i++) {
        let row = table.insertRow();
        for (let j=1; j<=cols; j++) {
            let cell = row.insertCell();
            cell.appendChild(document.createTextNode(whitespace));
        }
    }
    document.body.appendChild(table);
}

function onTableClick() {
    //
}

function onButtonClick() {
    //
}