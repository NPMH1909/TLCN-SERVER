import express from 'express'
import { StatController } from '../controllers/stat.controller.js'
const StatRouter = express.Router()

StatRouter.get('/users', StatController.countUsers)

export { StatRouter }
