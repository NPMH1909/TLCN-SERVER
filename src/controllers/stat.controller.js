import { HttpStatusCode } from 'axios'
import { UserService } from '../services/user.service.js'

const countUsers = async (req, res, next) => {
  // #swagger.tags=['Stat']
  try {
    const data = await UserService.countUsers()
    next(Response(HttpStatusCode.Ok, 'Thành Công', data).resposeHandler(res))
  } catch (error) {
    next(Response(error.statusCode, error.message, null).resposeHandler(res))
  }
}

export const StatController = {
  countUsers
}
