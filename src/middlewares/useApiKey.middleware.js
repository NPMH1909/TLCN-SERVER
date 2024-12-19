import { Types } from 'mongoose'
import { UserService } from '../services/user.service.js'
import { CommonUtils } from '../utils/common.util.js'
import jwt from 'jsonwebtoken'
import { NotFoundError } from '../errors/notFound.error.js'
import { ForbiddenRequestError } from '../errors/forbiddenRequest.error.js'
import { UnAuthorizedError } from '../errors/unauthorizedRequest.error.js'
import { Response } from '../dto/response/response.js'
import { USER_ROLE } from '../constants/user.constant.js'

export const createApiKey = (data) => {
  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60000,
      data
    },
    'secret'
  )
  return token
}
export const requireApiKey = async (req, res, next) => {
  try {
    if (CommonUtils.checkNullOrUndefined(req.headers.authorization)) {
      throw new UnAuthorizedError('Bạn cần đăng nhập')
    }
    const apiKey = req.headers.authorization.split(' ')[1]

    jwt.verify(apiKey, 'secret', async (err, decoded) => {
      try {
        if (err || !decoded) {
          throw new UnAuthorizedError('Bạn cần đăng nhập')
        } else {
          const result = await UserService.authorize(decoded.data)
          if (CommonUtils.checkNullOrUndefined(result)) {
            throw new NotFoundError('Người dùng không tồn tại')
          }
          req.user = {
            id: Types.ObjectId.createFromHexString(decoded.data),
            role: result.role
          }
          next()
        }
      } catch (error) {
        next(new Response(error.statusCode || 500, error.message, null).resposeHandler(res))
      }
    })
  } catch (error) {
    next(new Response(error.statusCode || 500, error.message, null).resposeHandler(res))
  }
}

export const authenticationAdmin = async (req, res, next) => {
  try {
    if (
      CommonUtils.checkNullOrUndefined(req.user) ||
      CommonUtils.checkNullOrUndefined(req.user.role) ||
      CommonUtils.checkNullOrUndefined(req.user.id)
    ) {
      throw new UnAuthorizedError('Bạn cần đăng nhập')
    }
    if (req.user.role !== 'RESTAURANT_OWNER') {
      throw new ForbiddenRequestError('Bạn không có quyền truy cập')
    }
    next()
  } catch (error) {
    next(new Response(error.statusCode || 500, error.message, null).resposeHandler(res))
  }
}
export const authenticationStaff = async (req, res, next) => {
  try {
    console.log(req.user)
    if (
      CommonUtils.checkNullOrUndefined(req.user) ||
      CommonUtils.checkNullOrUndefined(req.user.role) ||
      CommonUtils.checkNullOrUndefined(req.user.id)
    ) {
      throw new UnAuthorizedError('Invalid access')
    }
    if (req.user.role !== USER_ROLE.STAFF) {
      throw new ForbiddenRequestError('Invalid access')
    }
    next()
  } catch (error) {
    next(new Response(error.statusCode || 500, error.message, null).resposeHandler(res))
  }
}
