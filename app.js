
const createError = require('http-errors')
const express = require('express')
const cookieParser = require('cookie-parser')
const path = require('path')

const apiRouter = require('./routes/api')
const app = express()

// view engine setup
// app.use(expressStatic('./views'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// app.use('/', indexRouter)
app.use('/coverage-api', apiRouter)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404))
})

// error handler
app.use(function (err, req, res, next) {
  res.send({
    status: false,
    responseCode: err.status || 500,
    message: err.message
  })
})

module.exports = app
