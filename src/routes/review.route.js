import express from 'express';
import { VideoController } from '../controllers/video.controller.js';
import uploadVideoMiddleware from '../middlewares/uploadVideo.middleware.js';
import { authenticationAdmin, requireApiKey } from '../middlewares/useApiKey.middleware.js';
import { ReviewController } from '../controllers/review.controller.js';
const ReviewRouter = express.Router();

// Route thêm video mới
ReviewRouter.post('/create',requireApiKey, ReviewController.createReviewController);

// Route lấy tất cả video
ReviewRouter.get('/:restaurant_id', ReviewController.getAllReviewsController);
ReviewRouter.put('/update/:id', ReviewController.updateReviewController);
ReviewRouter.delete('/delete/:id', ReviewController.deleteReviewController);

export default ReviewRouter