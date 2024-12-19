import express from 'express'
import { RestaurantController } from '../controllers/restaurant.controller.js'
import {
  RestaurangGetAllValidation,
  RestaurantCreateValidation,
  RestaurantDeleteValidation,
  RestaurantGetByIdValidation,
  RestaurantUpdateValidation
} from '../dto/in/restaurant.dto.js'
import { handleValidationErrors } from '../middlewares/validation.middleware.js'
import { authenticationAdmin, authenticationStaff, requireApiKey } from '../middlewares/useApiKey.middleware.js'
const RestaurantRouter = express.Router()

RestaurantRouter.get('/', RestaurangGetAllValidation, handleValidationErrors, RestaurantController.getAllRestaurant)
RestaurantRouter.get('/promotions', RestaurangGetAllValidation, handleValidationErrors, RestaurantController.getAllRestaurantWithPromotions)

RestaurantRouter.get(
  '/restaurant/:id',
  RestaurantGetByIdValidation,
  handleValidationErrors,
  RestaurantController.getRestaurantById
)
RestaurantRouter.post(
  '/',
  
  requireApiKey,
  authenticationAdmin,
  RestaurantController.createRestaurant
)
RestaurantRouter.put(
  '/restaurant/:id',
  requireApiKey,
  authenticationAdmin,
  RestaurantController.updateRestaurant
)
RestaurantRouter.delete(
  '/restaurant/:id',
  RestaurantDeleteValidation,
  handleValidationErrors,
  requireApiKey,
  authenticationAdmin,
  RestaurantController.deleteRestaurant
)
RestaurantRouter.post('/search', RestaurantController.findRestaurantByAnyField)
RestaurantRouter.get('/owner', requireApiKey, authenticationAdmin, RestaurantController.getRestaurantIdAndNameByUserId)
RestaurantRouter.get('/own', requireApiKey, authenticationAdmin, RestaurantController.getAllRestaurantByUserId)
RestaurantRouter.get('/staff', requireApiKey, authenticationStaff, RestaurantController.getStaffRestaurant)
RestaurantRouter.get('/provinces', RestaurantController.getProvinces);
RestaurantRouter.get('/districts/:provinceCode', RestaurantController.getDistrictsByProvince);
export default RestaurantRouter
