import { HttpStatusCode } from 'axios'
import { Response } from '../dto/response/response.js'
import { BadRequestError } from '../errors/badRequest.error.js'
import { OrderService } from '../services/order.service.js'
import { CommonUtils } from '../utils/common.util.js'
import { LogService } from '../services/log.service.js'

const getAllOrder = async (req, res, next) => {
  // #swagger.tags=['Order']
  // #swagger.security = [{ "Bearer": [] }]
  try {
    const { page, size } = req.query
    const data = await OrderService.getAllOrder(Number(page) || 1, Number(size) || 5)
    // await LogService.createLog(req.user.id, 'Xem danh sách đơn hàng', HttpStatusCode.Ok)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data.data, data.info).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(
      req.user.id,
      'Xem danh sách đơn hàng',
      error.statusCode || HttpStatusCode.InternalServerError
    )
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const getAllOrderByStaffId = async (req, res, next) => {
  // #swagger.tags=['Order']
  // #swagger.security = [{ "Bearer": [] }]
  try {
    const { page, size } = req.query
    const data = await OrderService.getAllOrderByStaffId(req.user.id, Number(page) || 1, Number(size) || 5)
    // await LogService.createLog(req.user.id, 'Xem danh sách đơn hàng', HttpStatusCode.Ok)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data.data, data.info).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(
      req.user.id,
      'Xem danh sách đơn hàng',
      error.statusCode || HttpStatusCode.InternalServerError
    )
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getAllOrderByUserId = async (req, res, next) => {
  // #swagger.tags=['Order']
  // #swagger.security = [{ "Bearer": [] }]
  try {
    const { page, size, status } = req.query
    const data = await OrderService.getAllOrderByUserId(req.user.id, Number(page) || 1, Number(size) || 5, status)
    // await LogService.createLog(req.user.id, 'Xem danh sách đơn hàng', HttpStatusCode.Ok)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data.data, data.info).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(
      req.user.id,
      'Xem danh sách đơn hàng',
      error.statusCode || HttpStatusCode.InternalServerError
    )
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const updateOrderStatus = async (req, res) => {
  const { orderId, newStatus } = req.body;

  try {
    // Gọi service để cập nhật status
    const updatedOrder = await OrderService.updateStatus(orderId, newStatus);
    res.status(200).json({
      status:200,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
};
const updateRating = async (req, res) => {
  try {
    const { orderId } = req.params; // Lấy order ID từ params
    const { rating } = req.body; // Lấy rating từ body

    if (typeof rating === 'undefined') {
      return res.status(400).json({ message: 'Rating is required.' });
    }

    const updatedOrder = await OrderService.updateOrderRating(orderId, rating);

    return res.status(200).json({
      message: 'Rating updated successfully.',
      data: updatedOrder,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};
const getUserOrders = async (req, res, next) => {
  // #swagger.tags=['Order']
  // #swagger.security = [{ "Bearer": [] }]
  try {
    const { page, size } = req.query
    const data = await OrderService.getUserOrders(req.user.id, Number(page) || 1, Number(size) || 5)
    // await LogService.createLog(req.user.id, 'Xem danh sách đơn hàng', HttpStatusCode.Ok)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data.data, data.info).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(
      req.user.id,
      'Xem danh sách đơn hàng',
      error.statusCode || HttpStatusCode.InternalServerError
    )
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getOrderById = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    const data = await OrderService.getOrderById(req.params.id)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const confirmOrder = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    const data = await OrderService.confirmOrder(req.params.id)
    await LogService.createLog(req.user.id, 'Xác nhận đơn hàng', HttpStatusCode.Ok)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(req.user.id, 'Xác nhận đơn hàng', error.statusCode || HttpStatusCode.InternalServerError)
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const payOrderDirect = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    const paymentLinkRes = await OrderService.payOrderDirect(req.body)
    await LogService.createLog(req.user.id, 'Thanh toán đơn hàng')
    return res.json({
      error: 0,
      message: 'Thành Công',
      data: {
        bin: paymentLinkRes.bin,
        checkoutUrl: paymentLinkRes.checkoutUrl,
        accountNumber: paymentLinkRes.accountNumber,
        accountName: paymentLinkRes.accountName,
        amount: paymentLinkRes.amount,
        description: paymentLinkRes.description,
        orderCode: paymentLinkRes.orderCode,
        qrCode: paymentLinkRes.qrCode
      }
    })
  } catch (error) {
    await LogService.createLog(req.user.id, 'Thanh toán đơn hàng', -1)
    next(new Response(-1, error.message, null).resposeHandler(res))
  }
}
const payOrder = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    const paymentLinkRes = await OrderService.payOrder(req.body)
    await LogService.createLog(req.user.id, 'Thanh toán đơn hàng', HttpStatusCode.Ok)
    return res.json({
      error: 0,
      message: 'Thành Công',
      data: {
        bin: paymentLinkRes.bin,
        checkoutUrl: paymentLinkRes.checkoutUrl,
        accountNumber: paymentLinkRes.accountNumber,
        accountName: paymentLinkRes.accountName,
        amount: paymentLinkRes.amount,
        description: paymentLinkRes.description,
        orderCode: paymentLinkRes.orderCode,
        qrCode: paymentLinkRes.qrCode
      }
    })
  } catch (error) {
    await LogService.createLog(req.user.id, 'Thanh toán đơn hàng', -1)
    next(new Response(-1, error.message, null).resposeHandler(res))
  }
}
const createOrder = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    if (CommonUtils.checkNullOrUndefined(req.body)) {
      throw new BadRequestError('Dữ liệu là bắt buộc')
    }
    const result = await OrderService.createOrder(req.user.id, req.body)
    next(new Response(HttpStatusCode.Created, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const createWalkinOrder = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    if (CommonUtils.checkNullOrUndefined(req.body)) {
      throw new BadRequestError('Dữ liệu là bắt buộc')
    }
    const result = await OrderService.createWalkinOrder(req.user.id, req.body)
    next(new Response(HttpStatusCode.Created, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const updatePaymentStatus = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    if (CommonUtils.checkNullOrUndefined(req.body)) {
      throw new BadRequestError('Dữ liệu là bắt buộc')
    }
    const {orderId} = req.params
    const {paymentMethod, amount_due} = req.body
    const result = await OrderService.updatePaymentStatus(orderId, paymentMethod, amount_due)
    next(new Response(HttpStatusCode.Created, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const createDirectOrder = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    if (CommonUtils.checkNullOrUndefined(req.body)) {
      throw new BadRequestError('Dữ liệu là bắt buộc')
    }
    const result = await OrderService.createDirectOrder(req.user.id, req.body)
    next(new Response(HttpStatusCode.Created, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const updateOrder = async (req, res, next) => {
  console.log("first", req.body)
  // #swagger.tags=['Order']
  try {
    if (CommonUtils.checkNullOrUndefined(req.body)) {
      throw new BadRequestError('Dữ liệu là bắt buộc')
    }
    const result = await OrderService.updateOrder(req.params.id, req.body)
    
    await LogService.createLog(req.user.id, 'Chỉnh sửa đơn hàng')
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(
      req.user.id,
      'Thanh toán đơn hàng',
      error.statusCode || HttpStatusCode.InternalServerError
    )
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const confirmDirectOrder = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    const data = await OrderService.confirmDirectOrder(req.params.id)
    await LogService.createLog(req.user.id, 'Xác nhận đơn hàng')
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(req.user.id, 'Xác nhận đơn hàng', error.statusCode || HttpStatusCode.InternalServerError)
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const updateCheckin = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    const data = await OrderService.updateCheckin(req.params.id)
    await LogService.createLog(req.user.id, 'Xác nhận nhận bàn')
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(req.user.id, 'Xác nhận nhận bàn', error.statusCode || HttpStatusCode.InternalServerError)
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const updateCheckout = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    const data = await OrderService.updateCheckout(req.params.id)
    await LogService.createLog(req.user.id, 'Xác nhận trả bàn')
    next(new Response(HttpStatusCode.Ok, 'Thành Công', data).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(req.user.id, 'Xác nhận trả bàn', error.statusCode || HttpStatusCode.InternalServerError)
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const deleteOrder = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    const result = await OrderService.deleteOrder(req.params.id)
    await LogService.createLog(req.user.id, 'Xóa đơn hàng')
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    await LogService.createLog(req.user.id, 'Xóa đơn hàng', error.statusCode || HttpStatusCode.InternalServerError)
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const deleteItemFromOrder = async (req, res, next) => {
  // #swagger.tags=['Order']
  try {
    const result = await OrderService.deleteItemFromOrder(req.params.orderid, req.params.id)
    //await LogService.createLog(req.user.id, 'Xóa đơn hàng')
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    //await LogService.createLog(req.user.id, 'Xóa đơn hàng', error.statusCode || HttpStatusCode.InternalServerError)
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getSuccessfulOrders = async (req, res, next) => {
  try {
    const { page, size, phone } = req.query
    const orders = await OrderService.findSuccessfulOrders(req.user.id, Number(page) || 1, Number(size) || 5, phone||'')
    next(new Response(HttpStatusCode.Ok, 'Thành Công', orders.data, orders.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getPendingCashOrders = async (req, res, next) => {
  try {
    const { page, size, phone } = req.query
    const orders = await OrderService.findPendingCashOrders(req.user.id, Number(page) || 1, Number(size) || 5, phone||'')
    next(new Response(HttpStatusCode.Ok, 'Thành Công', orders.data, orders.info).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const totalRevenueOrder = async (req, res, next) => {
  try {
    const result = await OrderService.totalRevenueOrder(req.user.id)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const countCompletedOrders = async (req, res, next) => {
  try {
    const result = await OrderService.countCompletedOrders()
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const countOrder = async (req, res, next) => {
  try {
    const result = await OrderService.countOrder()
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const countOrdersByStatus = async (req, res, next) => {
  try {
    const result = await OrderService.countOrdersByStatus()
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const getMostFrequentRestaurantName = async (req, res, next) => {
  try {
    const result = await OrderService.getMostFrequentRestaurantName()
    next(new Response(HttpStatusCode.Ok, 'Thành Công', result).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}
const totalRevenueOrder5Years = async (req, res, next) => {
  try {
    const revenueData = await OrderService.totalRevenueOrder5Years(req.user.id)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', revenueData).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

const totalRevenueCurrentYear = async (req, res, next) => {
  try {
    const revenueData = await OrderService.totalRevenueCurrentYear(req.user.id, req.query.year)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', revenueData).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
}

export const OrderController = {
  getAllOrder,
  getOrderById,
  createOrder,
  createWalkinOrder,
  updateOrder,
  deleteOrder,
  deleteItemFromOrder,
  confirmOrder,
  payOrderDirect,
  payOrder,
  createDirectOrder,
  confirmDirectOrder,
  updateCheckin,
  updateCheckout,
  getSuccessfulOrders,
  getPendingCashOrders,
  totalRevenueOrder,
  totalRevenueCurrentYear,
  countCompletedOrders,
  countOrder,
  countOrdersByStatus,
  getMostFrequentRestaurantName,
  totalRevenueOrder5Years,
  getAllOrderByUserId,
  getAllOrderByStaffId,
  updatePaymentStatus,
  getUserOrders,
  updateRating,
  updateOrderStatus
}
