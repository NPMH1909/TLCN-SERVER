import express from 'express'
import { LogController } from '../controllers/log.controller.js'
const LogRouter = express.Router()

LogRouter.get('/', LogController.getAllLogs)
LogRouter.get('/search', LogController.getLogByAnyField)

export default LogRouter
