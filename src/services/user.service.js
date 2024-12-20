import { USER_ROLE } from '../constants/user.constant.js'
import { BadRequestError } from '../errors/badRequest.error.js'
import { ForbiddenRequestError } from '../errors/forbiddenRequest.error.js'
import { createApiKey } from '../middlewares/useApiKey.middleware.js'
import { UserModel } from '../models/users.model.js'
import mongoose, { Types } from 'mongoose'
import jwt from 'jsonwebtoken'
import { NotFoundError } from '../errors/notFound.error.js'
import { createHash, checkPassword } from '../middlewares/usePassword.js'
import { MailService } from './mail.service.js'
import { RestaurantModel } from '../models/restaurants.model.js'
import { StaffModel } from '../models/staff.model.js'
import { ConflictError } from '../errors/conflict.error.js'

const login = async ({ username, password }) => {
  
  const user = await UserModel.findOne({
    $and: [
      {
        $or: [{ username }, { email: username }, { phone: username }]
      },
      { deleted_at: null }
    ]
  }).orFail(() => {
    throw new BadRequestError('Username or password is incorrect')
  })
  const isPasswordValid = await checkPassword(password, user.salt, user.password)
  if (!isPasswordValid) {
    throw new BadRequestError('Username or password is incorrect')
  }
  if (user.salt === undefined) {
    throw new BadRequestError('Tài khoản đã bị khóa')
  }
  return createApiKey(user._id, user.role)
}
const adminLogin = async ({ username, password }) => {
  const user = await UserModel.findOne({
    $and: [{ $or: [{ username }, { email: username }, { phone: username }] }, { deleted_at: null }]
  }).orFail(() => {
    throw new BadRequestError('Username or password is incorrect')
  })
  const isPasswordValid = await checkPassword(password, user.salt, user.password)
  if (!isPasswordValid) {
    throw new BadRequestError('Invalid username or password')
  }

  if (user.role === USER_ROLE.ADMIN) {
    return {
      redirect_url: '/dashboard',
      token: createApiKey(user._id, user.role)
    }
  } else if (user.role === USER_ROLE.STAFF) {
    return {
      redirect_url: '/staff',
      token: createApiKey(user._id, user.role)
    }
  } else {
    throw new BadRequestError('Invalid role')
  }
}
const register = async ({ username, password, phone, email, name }) => {
  if (await UserModel.findOne({ username })) {
    throw new ConflictError('Account existed')
  }
  if (await UserModel.findOne({ email })) {
    throw new ConflictError('Email existed')
  }
  if (await UserModel.findOne({ phone })) {
    throw new ConflictError('Phone existed')
  }
  const salt = createApiKey(Math.random().toString(36).substring(2))
  const user = new UserModel({
    _id: new Types.ObjectId(),
    username,
    password: await createHash(password + salt),
    phone,
    email,
    name,
    role: USER_ROLE.USER,
    salt
  })
  return await user.save()
}
const registerStaff = async ({ username, password, phone, email, name, restaurant_id }) => {
  if ((await RestaurantModel.findById(restaurant_id)) === null) {
    throw new NotFoundError('Restaurant not found')
  }
  if (await UserModel.findOne({ username })) {
    throw new BadRequestError('Account existed')
  }
  const salt = createApiKey(Math.random().toString(36).substring(2))

  const user = new UserModel({
    _id: new Types.ObjectId(),
    username,
    password: await createHash(password + salt),
    phone,
    email,
    name,
    role: USER_ROLE.STAFF,
    salt
  })
  const staff = new StaffModel({
    _id: new Types.ObjectId(),
    restaurant_id,
    staff_id: user._id
  })
  MailService.sendMail({
    to: email,
    subject: 'Wellcome to Mindx Restaurant',
    html: `<h1>User name của bạn là: <strong>${username} </h1><p>Password của bạn là: <strong>${password}</strong></p>`
  })
  await user.save()
  return await staff.save()
}

const changePassword = async ({ userId, oldPassword, newPassword }) => {
  // Kiểm tra xem người dùng có tồn tại không
  const user = await UserModel.findById(userId).orFail(() => {
    throw new BadRequestError('User not found')
  })

  // Kiểm tra mật khẩu cũ
  const isOldPasswordValid = await checkPassword(oldPassword, user.salt, user.password)
  if (!isOldPasswordValid) {
    throw new BadRequestError('Old password is incorrect')
  }

  // Mã hóa mật khẩu mới
  const newSalt = createApiKey(Math.random().toString(36).substring(2))
  const hashedNewPassword = await createHash(newPassword + newSalt)

  // Cập nhật mật khẩu mới cho người dùng
  user.password = hashedNewPassword
  user.salt = newSalt

  // Lưu thông tin người dùng với mật khẩu mới
  await user.save()

  return { message: 'Password changed successfully' }
}

const authorize = async (id) => {
  id = Types.ObjectId.createFromHexString(id)
  return await UserModel.findById(id)
}
const checkKey = async ({ id, email }) => {
  id = Types.ObjectId.createFromHexString(id)
  return await UserModel.find({ _id: id, email })
}

const countUser = async () => {
  return await UserModel.countDocuments({ deleted_at: null })
}
const getUserById = async (id) => {
  return UserModel.findById(id, { _id: 1, name: 1, phone: 1, email: 1, username: 1 }).orFail(() => {
    throw new NotFoundError('User not found')
  })
}

const getAllUsers = async (id, page = 1, size = 5) => {
  const owner = await RestaurantModel.find({ user_id: id, deleted_at: null })
  const staffs = await StaffModel.aggregate([
    {
      $match: {
        deleted_at: null,
        restaurant_id: { $in: await RestaurantModel.find({ user_id: id, deleted_at: null }).distinct('_id') }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'staff_id',
        foreignField: '_id',
        as: 'staff'
      }
    },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurant_id',
        foreignField: '_id',
        as: 'restaurant'
      }
    },
    {
      $unwind: '$staff'
    },
    {
      $unwind: '$restaurant'
    },
    {
      $skip: Number(page - 1) * Number(size)
    },
    {
      $limit: Number(size)
    },
    {
      $project: {
        _id: 1,
        staff: '$staff',
        restaurant: '$restaurant'
      }
    }
  ]).exec()
  const count = await StaffModel.countDocuments({
    deleted_at: null,
    restaurant_id: { $in: await RestaurantModel.find({ user_id: id, deleted_at: null }).distinct('_id') }
  }).exec()
  return {
    data: staffs,
    info: {
      total: count,
      page,
      size,
      number_of_pages: Math.ceil(count / size)
    }
  }
}
const updateUser = async (id, { name, restaurant_id }) => {
  const staff = await StaffModel.findByIdAndUpdate(id, { restaurant_id }).orFail(() => {
    throw new NotFoundError('User not found')
  })
  return await UserModel.findByIdAndUpdate(staff.staff_id, { name }).orFail(() => {
    throw new NotFoundError('User not found')
  })
}
const updateUserById = async (id, data) => {
  return await UserModel.findByIdAndUpdate(id, {...data }).orFail(() => {
    throw new NotFoundError('User not found')
  })
}

const deleteUser = async (id) => {
  const staff = await StaffModel.findByIdAndUpdate(id, { deleted_at: Date.now() }).orFail(() => {
    throw new NotFoundError('User not found')
  })

  return await UserModel.findByIdAndUpdate(staff.staff_id, { deleted_at: Date.now() }).orFail(() => {
    throw new NotFoundError('User not found')
  })
}

const resetPassword = async (otp, newPassword) => {
  console.log('otp', otp)
  const user = await UserModel.findOne({otp});
  console.log('user', user)
  if (!user) {
    throw new BadRequestError('Mã OTP không hợp lệ hoặc đã hết hạn');
  }

  const hashedPassword = await createHash(newPassword + user.salt);

  await UserModel.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    otp: null, // Xoá OTP sau khi sử dụng
    updated_at: Date.now(),
  });

  return { message: 'Đặt lại mật khẩu thành công' };
};

const findUsersByAnyField = async (searchTerm, page, size) => {
  const isObjectId = Types.ObjectId.isValid(searchTerm)
  const users = await UserModel.aggregate([
    {
      $match: {
        $and: [
          { deleted_at: null },
          {
            $or: [
              { _id: isObjectId ? Types.ObjectId.createFromHexString(searchTerm) : null },
              { username: { $regex: searchTerm, $options: 'i' } },
              { email: { $regex: searchTerm, $options: 'i' } },
              { phone: { $regex: searchTerm, $options: 'i' } },
              { name: { $regex: searchTerm, $options: 'i' } }
            ]
          }
        ]
      }
    },
    { $skip: (page - 1) * size },
    { $limit: size },
    {
      $project: {
        _id: 1,
        username: 1,
        email: 1,
        phone: 1,
        name: 1
      }
    }
  ]).exec()
  const total = await UserModel.countDocuments({
    $and: [
      { deleted_at: null },
      {
        $or: [
          { _id: isObjectId ? Types.ObjectId.createFromHexString(searchTerm) : null },
          { username: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { phone: { $regex: searchTerm, $options: 'i' } },
          { name: { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  }).exec()
  return { data: users, info: { total, page, size, number_of_pages: Math.ceil(total / size) } }
}

const getStaffById = async (id) => {
  console.log('first', id)
  //id = Types.ObjectId.createFromHexString(id)
   console.log('idstaff', id)
  return StaffModel.findOne({staff_id:id}).orFail(() => {
    throw new NotFoundError('User not found')
  })
}

export const UserService = {
  login,
  register,
  changePassword,
  authorize,
  getUserById,
  getAllUsers,
  deleteUser,
  registerStaff,
  resetPassword,
  adminLogin,
  findUsersByAnyField,
  updateUser,
  updateUserById,
  getStaffById
}
