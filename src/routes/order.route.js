import express from 'express'
import { OrderController } from '../controllers/order.controller.js'
import {
  OrderCreateValidation,
  OrderDeleteValidation,
  OrderGetAllValidation,
  OrderGetByIdValidation,
  OrderUpdateValidation
} from '../dto/in/order.dto.js'
import { handleValidationErrors } from '../middlewares/validation.middleware.js'
import { authenticationAdmin, authenticationStaff, requireApiKey } from '../middlewares/useApiKey.middleware.js'
const OrderRouter = express.Router()

OrderRouter.get(
  '/',
  OrderGetAllValidation,
  handleValidationErrors,
  requireApiKey,
  authenticationAdmin,
  OrderController.getAllOrder
)
OrderRouter.put('/update-status', OrderController.updateOrderStatus);

OrderRouter.get('/staff', requireApiKey, authenticationStaff, OrderController.getAllOrderByStaffId)
OrderRouter.get('/owner', requireApiKey, authenticationAdmin, OrderController.getAllOrderByUserId)
OrderRouter.get('/order/:id', OrderGetByIdValidation, handleValidationErrors, OrderController.getOrderById)
OrderRouter.get('/user', requireApiKey, handleValidationErrors, OrderController.getUserOrders)
OrderRouter.put('/:orderId/rating', OrderController.updateRating)
OrderRouter.get(
  '/confirm/:id',
  requireApiKey,
  OrderGetByIdValidation,
  handleValidationErrors,
  OrderController.confirmOrder
)
OrderRouter.get('/direct/confirm/:id', requireApiKey, OrderController.confirmDirectOrder)
OrderRouter.post('/pay/:id', requireApiKey, OrderGetByIdValidation, handleValidationErrors, OrderController.payOrder)
OrderRouter.post('/', requireApiKey, OrderCreateValidation, handleValidationErrors, OrderController.createOrder)
OrderRouter.post('/walkin/', requireApiKey, OrderCreateValidation, handleValidationErrors, OrderController.createWalkinOrder)
OrderRouter.patch('/walkin/pay/:orderId', requireApiKey, OrderCreateValidation, handleValidationErrors, OrderController.updatePaymentStatus)


OrderRouter.post(
  '/direct',
  requireApiKey,
  OrderCreateValidation,
  handleValidationErrors,
  OrderController.createDirectOrder
)

OrderRouter.put(
  '/:id',
  requireApiKey,
  authenticationStaff,
  // OrderUpdateValidation,
  // handleValidationErrors,
  OrderController.updateOrder
)
OrderRouter.delete('/:id', OrderDeleteValidation, handleValidationErrors, OrderController.deleteOrder)
OrderRouter.delete('/:orderid/items/:id', OrderController.deleteItemFromOrder)

OrderRouter.put('/checkout/:id', requireApiKey, authenticationStaff, OrderController.updateCheckout)
OrderRouter.put('/checkin/:id', requireApiKey, authenticationStaff, OrderController.updateCheckin)

OrderRouter.get('/checkout', requireApiKey, authenticationStaff, OrderController.getSuccessfulOrders)
OrderRouter.get('/checkin', requireApiKey, authenticationStaff, OrderController.getPendingCashOrders)
OrderRouter.get('/total-revenue', requireApiKey, authenticationAdmin, OrderController.totalRevenueOrder)
OrderRouter.get('/total-order-complete', requireApiKey, authenticationAdmin, OrderController.countCompletedOrders)
OrderRouter.get('/total-order', requireApiKey, authenticationAdmin, OrderController.countOrder)
OrderRouter.get('/total-order-hold', requireApiKey, authenticationAdmin, OrderController.countOrdersByStatus)
OrderRouter.get('/retaurant-name', requireApiKey, authenticationAdmin, OrderController.getMostFrequentRestaurantName)
OrderRouter.get('/revenue/five-years', requireApiKey, authenticationAdmin, OrderController.totalRevenueOrder5Years)
OrderRouter.get('/revenue/current-years', requireApiKey, authenticationAdmin, OrderController.totalRevenueCurrentYear)

export { OrderRouter }
