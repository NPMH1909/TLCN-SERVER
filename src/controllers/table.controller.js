import { HttpStatusCode } from 'axios'
import { Response } from '../dto/response/response.js'
import { BadRequestError } from '../errors/badRequest.error.js'
import { TableService } from '../services/table.service.js'
import { CommonUtils } from '../utils/common.util.js'
import { LogService } from '../services/log.service.js'

const getAllTable = async (req, res, next) => {
  // #swagger.tags=['Table']
  try {
    const { page, size } = req.query
    const data = await TableService.getAllTable(Number(page) || 1, Number(size) || 5)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data.data, data.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getAllTableByUserId = async (req, res, next) => {
  // #swagger.tags=['Table']
  try {
    const { page, size } = req.query
    const data = await TableService.getAllTableByUserId(req.user.id, Number(page) || 1, Number(size) || 5)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data.data, data.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getTableById = async (req, res, next) => {
  // #swagger.tags=['Table']
  try {
    const id = req.params.id
    const data = await TableService.getTableById(id)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const createTable = async (req, res, next) => {
  // #swagger.tags=['Table']
  // #swagger.security = [{ "Bearer": [] }]
  try {
    const result = await TableService.createTable(req.body)
    await LogService.createLog(req.user.id, 'Nhập thêm bàn')
    next(new Response(HttpStatusCode.Created, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(req.user.id, 'Nhập thêm bàn', error.statusCode || HttpStatusCode.InternalServerError)
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, error).resposeHandler(res))
  }
}

const updateTable = async (req, res, next) => {
  // #swagger.tags=['Table']
  // #swagger.security = [{ "Bearer": [] }]
  try {
    const result = await TableService.updateTable(req.params.id, req.body)
    await LogService.createLog(req.user.id, 'Cập nhật bàn ' + req.params.id)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(
      req.user.id,
      'Cập nhật bàn ' + req.params.id,
      error.statusCode || HttpStatusCode.InternalServerError
    )
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const deleteTable = async (req, res, next) => {
  // #swagger.tags=['Table']
  try {
    const result = await TableService.deleteTable(req.params.id)
    await LogService.createLog(req.user.id, 'Xóa bàn ' + req.params.id)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(
      req.user.id,
      'Xóa bàn ' + req.params.id,
      error.statusCode || HttpStatusCode.InternalServerError
    )
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const findTableByAnyField = async (req, res, next) => {
  try {
    const { searchTerm } = req.body
    const { page, size } = req.query
    const result = await TableService.findTablesByAnyField(searchTerm, Number(page) || 1, Number(size) || 5)
    next(new Response(HttpStatusCode.Ok, 'Đã tìm thấy bàn', result.data, result.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

export const TableController = {
  getAllTable,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  findTableByAnyField,
  getAllTableByUserId
}
