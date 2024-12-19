import { HttpStatusCode } from 'axios'
import { Response } from '../dto/response/response.js'
import { LogService } from '../services/log.service.js'
const getAllLogs = async (req, res, next) => {
  // #swagger.tags=['Log']
  // #swagger.description = 'Get all log'
  try {
    const { sort, page, size } = req.query

    const data = await LogService.getAllLogs(sort, Number(page) || 1, Number(size) || 5)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data.data, data.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, error).resposeHandler(res))
  }
}
const getLogByAnyField = async (req, res, next) => {
  // #swagger.tags=['Log']
  // #swagger.description = 'Get log by any field'
  try {
    const { searchParam, page, size } = req.query

    const data = await LogService.getLogByAnyField(searchParam, Number(page), Number(size))
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data.data, data.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, error).resposeHandler(res))
  }
}
export const LogController = {
  getAllLogs,
  getLogByAnyField
}
