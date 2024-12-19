import express from "express"
import { PromotioController } from "../controllers/promotion.controller.js"
import { handleValidationErrors } from "../middlewares/validation.middleware.js"
import { authenticationAdmin, requireApiKey } from "../middlewares/useApiKey.middleware.js"
const PromotionRouter = express.Router()

PromotionRouter.get('/', requireApiKey, handleValidationErrors, authenticationAdmin, PromotioController.getAllPromotion)
PromotionRouter.get('/promotion',  handleValidationErrors, authenticationAdmin, PromotioController.getPromotionById)
PromotionRouter.post('/create',requireApiKey ,handleValidationErrors, authenticationAdmin, PromotioController.createPromotion)
PromotionRouter.put('/:id',requireApiKey,  handleValidationErrors, authenticationAdmin, PromotioController.updatePromotion)
PromotionRouter.delete('/:id', requireApiKey, handleValidationErrors, authenticationAdmin, PromotioController.deletePromotion)

export default PromotionRouter
