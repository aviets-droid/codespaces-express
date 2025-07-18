const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const MAXPLAYERS = 2;

const path = require('path');
const fs = require('fs');

app.use('/static', express.static(path.join(__dirname, '/public/')));
app.use(express.json());

const dataPath = path.join(__dirname, '/data/');
const boardDataPath = path.join(dataPath, 'board/');

// Data lock(s)
let boardLocked = false;

// Other vars
let playersConnected = 0;

app.get('/', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, '/public/', 'index.html'));
})

// Get the join order, called once by each client
app.get('/order', (req, res) => {
  playersConnected++;
  let order = playersConnected;
  res.status(200).send(order.toString());
})

// Check if appropriate # of players is connected, send true or false
app.get('/conns', (req, res) => {
  let conns = playersConnected === 2;
  res.status(200).send(conns.toString());
})

// Get server's board data
app.get('/getboard', (req, res) => {
  fs.readFile(boardDataPath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading board data: " + err);
      return res.status(500).send("Failed to read board data.");
    }
    res.json(JSON.parse(data));
  })
})

// Update server's board data
app.post('/sendboard', async (req, res) => {
  if (boardLocked) {
    // Return status code 423: resource locked
  }

  boardLocked = true;
  const data = req.body;
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
