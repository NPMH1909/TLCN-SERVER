import express from "express"
import { requireApiKey } from "../middlewares/useApiKey.middleware.js";
import { dishReviewController } from "../controllers/dishReivew.controller.js";
import {uploadFiles} from "../middlewares/upload.middleware.js";

const dishReviewRouter = express.Router();

dishReviewRouter.post('/create/:menuItem',requireApiKey, uploadFiles, dishReviewController.createReview);
dishReviewRouter.get('/get/:menuItemId', dishReviewController.getReviewsByDish);

export default  dishReviewRouter