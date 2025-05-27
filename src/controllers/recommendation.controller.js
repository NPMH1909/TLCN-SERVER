// recommendation.controller.js
import { HttpStatusCode } from 'axios';
import { getRestaurantRecommendations } from '../services/recommendation.service.js';
import { Response } from '../dto/response/response.js'

export const getUserRecommendations = async (req, res, next) => {
  try {
    const recommendations = await getRestaurantRecommendations();
    // await LogService.createLog(req.user.id, 'Xem danh sách đơn hàng', HttpStatusCode.Ok)
    next(new Response(HttpStatusCode.Ok, 'Thành Công', recommendations).resposeHandler(res))
  } catch (error) {
    next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
};


