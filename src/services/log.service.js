/* eslint-disable camelcase */
import { Types } from 'mongoose'
import { LogModel } from '../models/logs.model.js'
import { HttpStatusCode } from 'axios'
const getAllLogs = async (sort, page = 1, size = 5) => {
  let logs, total
  if (sort === 'hour') {
    logs = await LogModel.aggregate([
      // {
      //   $match: {
      //     $and: [{ created_at: { $gte: new Date(Date.now() - 60 * 60 * 1000) } }, { delete_at: { $exists: false } }]
      //   }
      // },
      {
        $match: {
          $and: [
            {
              created_at: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
            },
            { delete_at: { $exists: false } }
          ]
        }
      },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
      { $skip: (page - 1) * size },
      { $limit: size },
      { $sort: { created_at: -1 } },
      { $project: { user: { username: 1, role: 1 }, activity: 1, status: 1, created_at: 1 } }
    ]).exec()
    total = await LogModel.countDocuments({
      $and: [
        {
          created_at: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
        },
        { delete_at: { $exists: false } }
      ]
    }).exec()
  } else if (sort === 'day') {
    logs = await LogModel.aggregate([
      {
        $match: {
          $and: [
            {
              created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            },
            { delete_at: { $exists: false } }
          ]
        }
      },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
      { $sort: { created_at: -1 } },
      { $skip: (page - 1) * size },
      { $limit: size },
      { $project: { user: { username: 1, role: 1 }, activity: 1, status: 1, created_at: 1 } }
    ]).exec()
    total = await LogModel.countDocuments({
      $and: [
        {
          created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        { delete_at: { $exists: false } }
      ]
    }).exec()
  } else if (sort === 'week') {
    logs = await LogModel.aggregate([
      {
        $match: {
          $and: [
            {
              created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            },
            { delete_at: { $exists: false } }
          ]
        }
      },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
      { $sort: { created_at: -1 } },
      { $skip: (page - 1) * size },
      { $limit: size },
      { $project: { user: { username: 1, role: 1 }, activity: 1, status: 1, created_at: 1 } }
    ]).exec()
    total = await LogModel.countDocuments({
      $and: [
        {
          created_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        { delete_at: { $exists: false } }
      ]
    }).exec()
  } else if (sort === 'month') {
    logs = await LogModel.aggregate([
      {
        $match: {
          $and: [
            {
              created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            },
            { delete_at: { $exists: false } }
          ]
        }
      },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
      { $sort: { created_at: -1 } },
      { $skip: (page - 1) * size },
      { $limit: size },
      { $project: { user: { username: 1, role: 1 }, activity: 1, status: 1, created_at: 1 } }
    ]).exec()
    total = await LogModel.countDocuments({
      $and: [
        {
          created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        { delete_at: { $exists: false } }
      ]
    }).exec()
  } else if (sort === 'year') {
    logs = await LogModel.aggregate([
      {
        $match: {
          $and: [
            {
              created_at: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
            },
            { delete_at: { $exists: false } }
          ]
        }
      },
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
      { $sort: { created_at: -1 } },
      { $skip: (page - 1) * size },
      { $limit: size },
      { $project: { user: { username: 1, role: 1 }, activity: 1, status: 1, created_at: 1 } }
    ]).exec()
    total = await LogModel.countDocuments({
      $and: [
        {
          created_at: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        },
        { delete_at: { $exists: false } }
      ]
    }).exec()
  } else {
    logs = await LogModel.aggregate([
      { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
      { $sort: { created_at: -1 } },
      { $skip: (page - 1) * size },
      { $limit: size },
      { $project: { user: { username: 1, role: 1 }, activity: 1, status: 1, created_at: 1 } }
    ]).exec()
    total = await LogModel.countDocuments().exec()
  }
  return { data: logs, info: { total, number_of_pages: Math.ceil(total / size), page, size } }
}
const getLogByAnyField = async (searchParam, page = 1, size = 5) => {
  const logs = await LogModel.aggregate([
    {
      $match: {
        or: [
          { user_id: Types.ObjectId.createFromHexString(searchParam) },
          { activity: searchParam },
          { created_at: Date(searchParam) }
        ]
      }
    },
    { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
    { $skip: (page - 1) * size, $limit: size },
    { username: '$user.username', activity: 1, created_at: 1 }
  ]).exec()
  const total = await LogModel.countDocuments({
    $or: [
      { user_id: Types.ObjectId.createFromHexString(searchParam) },
      { activity: searchParam },
      { created_at: Date(searchParam) }
    ]
  })
  return { data: logs, info: { total, number_of_pages: Math.ceil(total / size), page, size } }
}
const createLog = async (user_id, activity, status = HttpStatusCode.Ok) => {
  const newLog = await LogModel.create({ user_id, activity, status })
  return newLog
}

export const LogService = {
  getAllLogs,
  getLogByAnyField,
  createLog
}
