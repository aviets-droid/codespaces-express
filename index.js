const express = require('express');
const app = express();
const port = 3000 || process.env.PORT;
const MAXPLAYERS = 2;

const path = require('path');
const fs = require('fs');

app.use('/static', express.static(path.join(__dirname, '/public/')));
app.use(express.json());

const dataPath = path.join(__dirname, 'data.json');

let playersConnected = 0;

app.get('/', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, '/public/', 'index.html'));
})

app.get('/conns', (req, res) => {
  playersConnected++;
  let conns = playersConnected;
  res.status(200).send(conns.toString());
})

app.get('/data', (req, res) => {
  //
})

app.post('/data', (req, res) => {
  //
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
