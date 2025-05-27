import { HttpStatusCode } from 'axios'
import { Response } from '../dto/response/response.js'
import { BadRequestError } from '../errors/badRequest.error.js'
import { MailService } from '../services/mail.service.js'
import { UserService } from '../services/user.service.js'
import { CommonUtils } from '../utils/common.util.js'
import { LogService } from '../services/log.service.js'
import { UserModel } from '../models/users.model.js'

const loginUser = async (req, res, next) => {
  try {
    // #swagger.tags=['User']
    const result = await UserService.login(req.body)
    return new Response(HttpStatusCode.Ok, 'Đăng nhập thành công', result).resposeHandler(res)
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const loginAdmin = async (req, res, next) => {
  try {
    const result = await UserService.adminLogin(req.body)
    next(new Response(HttpStatusCode.Ok, 'Đăng nhập thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id
    const{oldPassword, newPassword} = req.body
    const result = await UserService.changePassword({userId, oldPassword, newPassword})
    next(new Response(HttpStatusCode.Ok, 'Đăng nhập thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const register = async (req, res, next) => {
  try {
    // #swagger.tags=['User']
    if (CommonUtils.checkNullOrUndefined(req.body)) {
      throw new BadRequestError('Tài khoản là bắt buộc')
    }
    const result = await UserService.register(req.body)
    next(new Response(HttpStatusCode.Created, 'Đăng ký thành công', result).resposeHandler(res))
  } catch (error) {
     return new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res)
  }
}
const getUserById = async (req, res, next) => {
  try {
    const user = await UserService.getUserById(req.user.id)
    if (!user) {
      throw new BadRequestError('Không thấy tài khoản')
    }
    next(new Response(HttpStatusCode.Ok, 'Đã tìm thấy tài khoản', user).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getAllUsers = async (req, res, next) => {
  try {
    const { page, size } = req.query
    const users = await UserService.getAllUsers(req.user.id, Number(page) || 1, Number(size) || 5)
    // await LogService.createLog(req.user.id, 'Xem danh sách nhân viên', HttpStatusCode.Ok)
    next(new Response(HttpStatusCode.Ok, 'Đã tìm thấy tài khoản', users.data, users.info).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(
      req.user.id,
      'Xem danh sách nhân viên',
      error.statusCode || HttpStatusCode.InternalServerError
    )
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const updateUserById = async (req, res, next) => {
  try {
    console.log('data', req.body)
    const user = await UserService.updateUserById(req.user.id, req.body)
    // await LogService.createLog(req.user.id, 'Cập nhật nhân viên', HttpStatusCode.Ok)
    next(new Response(HttpStatusCode.Ok, 'Cập nhật tài khoản thành công', user).resposeHandler(res))
  } catch (error) {
    // await LogService.createLog(
    //   req.user.id,
    //   'Cập nhật nhân viên',
    //   error.statusCode || HttpStatusCode.InternalServerError
    // )
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await UserService.updateUser(id, req.body)
    await LogService.createLog(req.user.id, 'Cập nhật nhân viên', HttpStatusCode.Ok)
    next(new Response(HttpStatusCode.Ok, 'Cập nhật tài khoản thành công', user).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(
      req.user.id,
      'Cập nhật nhân viên',
      error.statusCode || HttpStatusCode.InternalServerError
    )
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await UserService.deleteUser(id)
    if (!user) {
      throw new BadRequestError('Không thấy tài khoản')
    }
    await LogService.createLog(req.user.id, 'Xóa nhân viên', HttpStatusCode.Ok)
    next(new Response(HttpStatusCode.Ok, 'Xóa tài khoản thành công', null).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(req.user.id, 'Xóa nhân viên', error.statusCode || HttpStatusCode.InternalServerError)
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const registerStaff = async (req, res, next) => {
  try {
    // #swagger.tags=['User']
    const result = await UserService.registerStaff(req.body)
    LogService.createLog(req.user.id, 'Đăng ký nhân viên', HttpStatusCode.Created)
    next(new Response(HttpStatusCode.Created, 'Đăng ký thành công', result).resposeHandler(res))
  } catch (error) {
    LogService.createLog(req.user.id, 'Đăng ký nhân viên', error.statusCode || HttpStatusCode.InternalServerError)
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getStaffById = async (req, res, next) => {
  try {
    const id = req.user.id
    const result = await UserService.getStaffById(id)
    next(new Response(HttpStatusCode.Ok, 'Đăng ký thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const sendResetPasswordEmail = async (req, res, next) => {
  try {
    const { to } = req.body

    if (!to) {
      throw new BadRequestError('Email là bắt buộc')
    }

    const result = await MailService.sendResetPasswordMail(to)
    next(new Response(HttpStatusCode.Ok, 'Gửi thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const resetPassword = async (req, res, next) => {
  try {
    const { code, newPassword } = req.body
    const result = await UserService.resetPassword(code, newPassword)
    next(new Response(HttpStatusCode.Ok, 'Đổi mật khẩu thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const sendMail = async (req, res, next) => {
  try {
    // #swagger.tags=['User']
    if (CommonUtils.checkNullOrUndefined(req.body)) {
      throw new BadRequestError('Username is required')
    }
    const result = await UserService.registerStaff(req.body)
    next(new Response(HttpStatusCode.Ok, 'Đăng ký thành công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const findUsersByAnyField = async (req, res, next) => {
  try {
    const { page, size } = req.query
    const { searchTerm } = req.body
    const result = await UserService.findUsersByAnyField(searchTerm, Number(page), Number(size))
    if (result.length === 0) {
      return new Response(HttpStatusCode.NotFound, 'Không tìm thấy tài khoản', null).resposeHandler(res)
    }
    next(new Response(HttpStatusCode.Ok, 'Đã tìm thấy tài khoản', result.data, result.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

// POST /api/favorites/:restaurantId
const toggleFavorite = async (req, res) => {
  const userId = req.user.id;
  const { restaurantId } = req.params;

  const user = await UserModel.findById(userId);
  const index = user.favorites.indexOf(restaurantId);

  if (index !== -1) {
    user.favorites.splice(index, 1); // Xóa
  } else {
    user.favorites.push(restaurantId); // Thêm
  }

  await user.save();
  res.json({ success: true, favorites: user.favorites });
};
const getFavorites = async (req, res) => {
  const user = await UserModel.findById(req.user.id).populate('favorites');
  res.json({ favorites: user.favorites });
};

export const UserController = {
  loginUser,
  loginAdmin,
  register,
  getUserById,
  getAllUsers,
  deleteUser,
  registerStaff,
  sendResetPasswordEmail,
  resetPassword,
  sendMail,
  findUsersByAnyField,
  updateUser,
  updateUserById,
  changePassword,
  getStaffById,
  toggleFavorite,
  getFavorites
}
