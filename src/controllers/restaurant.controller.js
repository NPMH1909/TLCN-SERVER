import { HttpStatusCode } from 'axios'
import { Response } from '../dto/response/response.js'
import { BadRequestError } from '../errors/badRequest.error.js'
import { NotFoundError } from '../errors/notFound.error.js'
import { RestaurantService } from '../services/restaurant.service.js'
import { CommonUtils } from '../utils/common.util.js'
import { LogService } from '../services/log.service.js'
import { StaffService } from '../services/staff.service.js'

const getAllRestaurant = async (req, res, next) => {
  // #swagger.tags=['Restaurant']
  try {
    const { sort, page, size, field, searchTerm, priceRange ,  provinceCode='', 
      districtCode = '', 
      detail = ''} = req.query; // Thêm priceRange vào đây
    const data = await RestaurantService.getAllRestaurant(
      Number(page) || 1,
      Number(size) || 6,
      field, // field không cần chuyển đổi sang Number nếu nó là một chuỗi
      Number(sort) || -1,
      searchTerm,
      priceRange, // Truyền priceRange vào hàm Service
      provinceCode,
      districtCode,
      detail
    );
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data.data, data.info).resposeHandler(res));
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res));
  }
};
const getAllRestaurantWithPromotions = async (req, res, next) => {
  // #swagger.tags=['Restaurant']
  try {
    const { page, size} = req.query; 
    const data = await RestaurantService.getAllRestaurantWithPromotions(
      Number(page) || 1,
      Number(size) || 6
    );
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data.data, data.info).resposeHandler(res));
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res));
  }
};

const getAllRestaurantByUserId = async (req, res, next) => {
  // #swagger.tags=['Restaurant']
  try {
    const { page, size } = req.query
    const data = await RestaurantService.getAllRestaurantByUserId(req.user.id, Number(page) || 1, Number(size) || 5)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data.data, data.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const getRestaurantById = async (req, res, next) => {
  // #swagger.tags=['Restaurant']
  try {
    const data = await RestaurantService.getRestaurantById(req.params.id)
    if (data === null) {
      return (new Response(HttpStatusCode.NotFound, 'Không tìm thấy nhà hàng', data).resposeHandler(res))
    }
    return (new Response(HttpStatusCode.Ok, 'Thành Công', data).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const createRestaurant = async (req, res, next) => {
  // #swagger.tags=['Restaurant']
  try {
    if (CommonUtils.checkNullOrUndefined(req.body)) {
      throw new BadRequestError('Dữ liệu là bắt buộc')
    }
    const result = await RestaurantService.createRestaurant(req.user.id, req.body)
    await LogService.createLog(req.user.id, 'Thêm nhà hàng')
    next(new Response(HttpStatusCode.Created, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const updateRestaurant = async (req, res, next) => {
  // #swagger.tags=['Restaurant']
  try {
    if (CommonUtils.checkNullOrUndefined(req.body)) {
      throw new BadRequestError('Dữ liệu là bắt buộc')
    }
    const result = await RestaurantService.updateRestaurant(req.params.id, req.body)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const deleteRestaurant = async (req, res, next) => {
  // #swagger.tags=['Restaurant']
  try {
    const result = await RestaurantService.deleteRestaurant(req.params.id)
    next(new Response(HttpStatusCode.Accepted, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const getFourNearestRestaurant = async (req, res, next) => {
  // #swagger.tags=['Restaurant']
  try {
    const data = await RestaurantService.getFourNearestRestaurant(req.query)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const getDistanceFromRestaurant = async (req, res, next) => {
  // #swagger.tags=['Restaurant']
  try {
    const data = await RestaurantService.getDistanceFromRestaurant(req.query)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const findRestaurantByAnyField = async (req, res, next) => {
  // #swagger.tags=['Restaurant']
  try {
    const { page, size } = req.query
    const { searchTerm } = req.body
    if (!searchTerm) {
      throw new BadRequestError('Giá trị tìm kiếm là bắt buộc')
    }
    const result = await RestaurantService.findRestaurantsByAnyField(searchTerm, Number(page) || 1, Number(size) || 5)
    next(new Response(HttpStatusCode.Ok, 'Đã tìm thấy nhà hàng', result.data, result.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const countRestaurant = async (req, res, next) => {
  try {
    const result = await RestaurantService.countRestaurant()
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getRestaurantIdAndNameByUserId = async (req, res, next) => {
  try {
    const result = await RestaurantService.getRestaurantIdAndNameByUserId(req.user.id)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getStaffRestaurant = async (req, res, next) => {
  try {
    const result = await StaffService.getRestaurantByStaffId(req.user.id)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getProvinces = async (req, res) => {
  try {
    const provinces = await RestaurantService.getProvinces();
    res.status(200).json(provinces);
  } catch (error) {
    res.status(500).json({ message: "Error fetching provinces", error });
  }
};

const getDistrictsByProvince = async (req, res) => {
  try {
    const { provinceCode } = req.params;
    const districts = await RestaurantService.getDistrictsByProvince(provinceCode);
    res.status(200).json(districts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching districts", error });
  }
};
export const RestaurantController = {
  getProvinces,getDistrictsByProvince,
  getAllRestaurant,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getFourNearestRestaurant,
  getDistanceFromRestaurant,
  findRestaurantByAnyField,
  countRestaurant,
  getRestaurantIdAndNameByUserId,
  getAllRestaurantByUserId,
  getStaffRestaurant,
  getAllRestaurantWithPromotions
}
