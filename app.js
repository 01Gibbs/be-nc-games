const {
  handle500Error,
  handleCustomError,
  handlePsqlError,
  handle404PathError,
} = require('./controllers/error-handlers')
const apiRouter = require('./routes/api-router')
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api', apiRouter)

app.use(handle404PathError)
app.use(handleCustomError)
app.use(handlePsqlError)
app.use(handle500Error)

module.exports = app
