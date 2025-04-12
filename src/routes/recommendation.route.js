import express from "express";
import { requireApiKey } from "../middlewares/useApiKey.middleware.js";
import {getUserRecommendations} from '../controllers/recommendation.controller.js';

const Recommendation = express.Router();

// Route để tạo bình luận mới cho video
Recommendation.get('/', getUserRecommendations);

export default Recommendation;
