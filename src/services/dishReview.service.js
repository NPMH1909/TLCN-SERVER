import mongoose from "mongoose";
import ReviewDishModel from "../models/dishReview.model.js";

 const createReview = async (reviewData) => {
    const newReview = new ReviewDishModel(reviewData);
    await newReview.save();
    return newReview;
};


const getReviewsByDish = async (menuItemId) => {
    try {
        // Lấy danh sách đánh giá và thông tin user
        const reviews = await ReviewDishModel.find({ menuItem: menuItemId })
            .populate('user', 'name')
            .sort({ createdAt: -1 });

        // Tính rating trung bình
        const averageRating = await ReviewDishModel.aggregate([
            { $match: { menuItem: new mongoose.Types.ObjectId(menuItemId) } },
            { $group: { _id: null, avgRating: { $avg: "$rating" } } }
        ]);

        // Nếu không có đánh giá, trả về rating trung bình là 0
        const avgRating = averageRating.length > 0 ? averageRating[0].avgRating : 0;

        return { reviews, avgRating };
    } catch (error) {
        throw new Error("Không thể lấy danh sách đánh giá: " + error.message);
    }
};


 const getReviewById = async (reviewId) => {
    try {
        return await ReviewDishModel.findById(reviewId).populate("user", "name");
    } catch (error) {
        throw new Error("Không thể lấy chi tiết đánh giá: " + error.message);
    }
};


 const updateReview = async (reviewId, updateData) => {
    try {
        return await ReviewDishModel.findByIdAndUpdate(reviewId, updateData, { new: true });
    } catch (error) {
        throw new Error("Không thể cập nhật đánh giá: " + error.message);
    }
};


 const deleteReview = async (reviewId) => {
    try {
        return await ReviewDishModel.findByIdAndDelete(reviewId);
    } catch (error) {
        throw new Error("Không thể xóa đánh giá: " + error.message);
    }
};


export const dishReviewService = {
    createReview,
    getReviewsByDish,
}