import { StaffModel } from '../models/staff.model.js'

const getAllStaff = async (page = 1, size = 5) => {
  const staffs = await StaffModel.aggregate([
    {
      $match: {
        deleted_at: { $eq: null }
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
  const count = await StaffModel.countDocuments({ deleted_at: { $eq: null } }).exec()
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
const getAllStaffByUserId = async (userId, page = 1, size = 5) => {
  const staffs = await StaffModel.aggregate([
    {
      $match: {
        deleted_at: { $eq: null }
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
      $match: {
        'staff.user_id': userId
      }
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
    deleted_at: { $eq: null },
    'staff.user_id': userId
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
const getRestaurantByStaffId = async (id) => {
  return await StaffModel.aggregate([
    {
      $match: {
        staff_id: id,
        deleted_at: null
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
      $unwind: '$restaurant'
    },
    {
      $project: {
        _id: 1,
        name: 'restaurant.name'
      }
    }
  ]).exec()
}
export const StaffService = {
  getAllStaff,
  getAllStaffByUserId,
  getRestaurantByStaffId
}
