const express = require('express')
const app = express()
const port = 3000 || process.env.PORT

const path = require('path')
const fs = require('fs')

app.use('/static', express.static(path.join(__dirname, 'public')))
app.use(express.json())

app.get('/', (req, res) => {
  res.status(200).sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
