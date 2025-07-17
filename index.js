const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const MAXPLAYERS = 2;

const path = require('path');
const fs = require('fs');

let playersConnected = 0;

app.use('/static', express.static(path.join(__dirname, '/public/')));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, '/public/', 'index.html'));
})

app.get('/conn', (req, res) => {
  playersConnected++;
  let conns = playersConnected;
  res.status(200).send("Player connected. Total players: " + conns.toString());
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
