import { HttpStatusCode } from "axios"
import { Response } from "../dto/response/response.js"
import { dishReviewService } from "../services/dishReview.service.js"

const createReview = async (req, res, next) => {
    try {
        const { content, rating } = req.body;
        const { menuItem } = req.params;
        const user = req.user.id;

        // Kiểm tra nếu có ảnh thì thêm vào, nếu không thì để null
        let image = null;
        if (req.file) {
            image = {
                url: req.file.path,
                id: req.file.filename,
            };
        }

        const reviewData = { content, image, user, menuItem, rating };
        const newCreate = await dishReviewService.createReview(reviewData);

        next(new Response(HttpStatusCode.Created, "Tạo thành công", newCreate).resposeHandler(res));
    } catch (error) {
        next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res));
    }
};

const getReviewsByDish = async(req, res, next) => {
    try {
        const {menuItemId} = req.params
        const newCreate = await dishReviewService.getReviewsByDish(menuItemId);
        next(new Response(HttpStatusCode.Created, 'Tao thanh cong', newCreate.reviews, newCreate.avgRating ).resposeHandler(res));
    } catch (error) {
        next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
    }
}

export const dishReviewController = {
    createReview,
    getReviewsByDish,
}