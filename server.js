import express, { json } from 'express'
import morgan from 'morgan'
import cors from 'cors'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'

import { body, validationResult } from 'express-validator'
// import { createServer } from 'node:http'
// import { Server } from 'socket.io'
import mongoose from 'mongoose'

import { logRequestTime } from './src/middlewares/logRequestTime.middleware.js'
import { logRequestMethod } from './src/middlewares/logRequestMethod.middleware.js'
import { DATABASE_CONFIG } from './src/configs/database.config.js'
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from './swagger-output.json' assert { type: 'json' }
import route from './src/routes/index.route.js'
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
// const server = createServer(app)
// const io = new Server(server)

const port = process.env.PORT || 7000
app.use(
  cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  })
)
// HTTP logger
app.use(morgan('dev'))
app.use(morgan('combined'))

app.use(json())
app.use(express.static('public'))
app.use(logRequestTime)
app.use(logRequestMethod)
app.use(cookieParser())

route(app)

const DB_CONNECTION_STR = DATABASE_CONFIG.MONGO_DATABASE || 'mongodb://localhost:27017/restaurant'
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100000,
  standardHeaders: 'draft-7',
  legacyHeaders: false
})
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

const start = async () => {
  try {
    console.log('Start connecting...')
    await mongoose.connect(DB_CONNECTION_STR)
    console.log('Connect success')

    app.listen(port, () => {
      console.log(`Listening at port ${port}`)
    })
  } catch (error) {
    console.log('Error connect to database with error: ' + error.message)
  }
}

start()
