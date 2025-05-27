import { Response } from '../dto/response/response.js'
import { MenuService } from '../services/menus.service.js'
import { BadRequestError } from '../errors/badRequest.error.js'
import { HttpStatusCode } from 'axios'
import { LogService } from '../services/log.service.js'
import MenuItem from '../models/menus.model.js'
const createMenuItem = async (req, res, next) => {
  try {
    const image = {
      url: req.file.path, 
      id: req.file.filename
  }
    const newItem = await MenuService.createMenuItem(req.body, image)
    await LogService.createLog(req.user.id, 'Tạo menu')
    next(new Response(HttpStatusCode.Created, 'Menu đã được tạo', newItem).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(req.user.id, 'Tạo menu', error.statusCode || HttpStatusCode.InternalServerError)
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const getAllMenuItems = async (req, res, next) => {
  try {
    const { page, size } = req.query
    const items = await MenuService.getAllMenuItems(Number(page) || 1, Number(size) || 5)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', items.data, items.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getAllMenuItemsByUserId = async (req, res, next) => {
  try {
    const { page, size } = req.query
    const items = await MenuService.getAllMenuItemsByUserId(req.user.id, Number(page) || 1, Number(size) || 5)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', items.data, items.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getMenuItemById = async (req, res, next) => {
  try {
    const item = await MenuService.getMenuItemById(req.params.id)
    console.log('item', item)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', item).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getMenuByRestaurant = async (req, res, next) => {
  try {
    const {page, size, category} = req.query
    const {restaurantId} = req.params
    const item = await MenuService.getMenuByRestaurant(restaurantId, page||1, size||6, category)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', item).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getMenuByRestaurantForStaff = async (req, res, next) => {
  try {
    const {restaurantId} = req.params
    const item = await MenuService.getMenuByRestaurant(restaurantId)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', item).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const updateMenuItemById = async (req, res, next) => {
  try {
    const updates = req.body;  
    if (req.file) {
      updates.image = {
          url: req.file.path,   
          id: req.file.filename 
      };
  }
    const item = await MenuService.updateMenuItemById(req.params.id, updates)
    await LogService.createLog(req.user.id, 'Chỉnh sửa menu' + req.params.id)
    next(new Response(HttpStatusCode.Ok, 'Menu đã được cập nhật', item).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const deleteMenuItemById = async (req, res, next) => {
  try {
    await MenuService.deleteMenuItemById(req.params.id)
    await LogService.createLog(req.user.id, 'Xóa menu' + req.params.id)
    next(new Response(HttpStatusCode.Ok, 'Menu đã được xóa', null).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(req.user.id, 'Xóa menu', error.statusCode || HttpStatusCode.InternalServerError)
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const findMenuByAnyField = async (req, res, next) => {
  try {
    const { searchTerm } = req.body
    const { page, size } = req.query
    const result = await MenuService.findMenuItemsByAnyField(searchTerm, page, size)
    await LogService.createLog(req.user.id, 'Tìm kiếm ' + searchTerm)
    next(new Response(HttpStatusCode.Ok, 'Đã tìm thấy bàn', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const countMenu = async (req, res, next) => {
  try {
    const result = await MenuService.countMenu()
    await LogService.createLog(req.user.id, 'Đã đếm menu')
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getBestSellingMenuItems = async (req, res) => {
  try {
    const bestSellers = await MenuItem.find({ deleted_at: null })
      .sort({ sold: -1 })
      .limit(8)
      .populate({
        path: 'restaurant_id',
        select: 'name _id' // Chỉ lấy tên và id nhà hàng
      });

    res.status(200).json({
      success: true,
      data: bestSellers
    });
  } catch (error) {
    console.error("Lỗi khi lấy món nổi bật kèm nhà hàng:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách món ăn nổi bật",
    });
  }
};
export const MenuController = {
  createMenuItem,
  getAllMenuItems,
  getMenuItemById,
  updateMenuItemById,
  deleteMenuItemById,
  findMenuByAnyField,
  countMenu,
  getAllMenuItemsByUserId,
  getMenuByRestaurant,
  getMenuByRestaurantForStaff,
  getBestSellingMenuItems
}
