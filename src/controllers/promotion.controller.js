import { HttpStatusCode } from "axios"
import {PromotionService} from "../services/promotion.service.js"
import { Response } from "../dto/response/response.js"
const createPromotion = async(req, res)=>{
    try {
        const {id} = req.user
        const result = await PromotionService.createPromotion(id,req.body)
        return new Response(HttpStatusCode.Created, 'Thành công', result).resposeHandler(res)
    } catch (error) {
        return new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res)
    }
}

const updatePromotion = async(req, res)=>{
    try {
        const {id} = req.params
        const result = await PromotionService.updatePromotion(id,req.body)
        return new Response(HttpStatusCode.Ok, 'Thành công', result).resposeHandler(res)
    } catch (error) {
        return new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res)
    }
}

const deletePromotion = async(req, res)=>{
    try {
        const {id} = req.params
        const result = await PromotionService.deletePromotion(id)
        return new Response(HttpStatusCode.Ok, 'Thành công', result).resposeHandler(res)
    } catch (error) {
        return new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res)
    }
}

const getAllPromotion = async(req, res)=>{
    try {
        const { page, size } = req.query
        const {id} = req.user
        const result = await PromotionService.getAllPromotion(id, Number(size)|| 8, Number(page) || 1)
        return new Response(HttpStatusCode.Ok, 'Thành công', result.data, result.info).resposeHandler(res)
    } catch (error) {
        return new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res)
    }
}

const getPromotionById = async(req, res)=>{
    try {
        const {id} = req.params
        const result = await PromotionService.getPromotionById(id)
        return new Response(HttpStatusCode.Ok, 'Thành công', result).resposeHandler(res)
    } catch (error) {
        return new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res)
    }
}


export const PromotioController = {
    createPromotion,
    updatePromotion,
    deletePromotion,
    getAllPromotion,
    getPromotionById,
}
