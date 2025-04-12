import ReviewModel from "../models/reviews.model.js";
import { UserModel } from "../models/users.model.js";

const createReview = async (reviewData) => {
  try {
    
    const newReview = await ReviewModel.create(reviewData);
    return newReview;
  } catch (error) {
    throw new Error("Error creating review: " + error.message);
  }
};

const getReviewById = async (id) => {
  try {
    const review = await ReviewModel.findById(id);
    return review;
  } catch (error) {
    throw new Error("Error fetching review: " + error.message);
  }
};


export const updateReview = async (id, content, parent_id, image) => {
  const review = await ReviewModel.findById(id);

  if (!review) {
    throw { statusCode: 404, message: 'Review not found' };
  }

  // Cập nhật nội dung
  review.content = content || review.content;
  review.parent_id = parent_id || review.parent_id;

  // Cập nhật ảnh nếu có
  if (image) {
    review.image = {
      url: image.path,
      id: image.filename,
    };
  }

  review.updated_at = new Date();
  return await review.save();
};

export const deleteReviewById = async (id) => {
  const deletedReview = await ReviewModel.findByIdAndDelete(id);

  if (!deletedReview) {
    throw { statusCode: 404, message: 'Review not found' };
  }

  return deletedReview;
};


const getReviewsWithReplies = async (restaurant_id, page, limit) => {
  const skip = (page - 1) * limit;
  const rootComments = await ReviewModel.find({
    restaurant_id,
    parent_id: null,
  })
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 })
    .lean();

  const allComments = await ReviewModel.find({ restaurant_id }).lean();
  const userIds = [...new Set(allComments.map((comment) => comment.user_id))];
  const users = await UserModel.find({ _id: { $in: userIds } }).select("_id username").lean();

  const userMap = users.reduce((map, user) => {
    map[user._id] = user.username;
    return map;
  }, {});

  const buildTree = (parentId) =>
    allComments
      .filter((comment) => String(comment.parent_id) === String(parentId))
      .map((comment) => ({
        ...comment,
        username: userMap[comment.user_id] || "Unknown",
        replies: buildTree(comment._id),
      }));

  const tree = rootComments.map((comment) => ({
    ...comment,
    username: userMap[comment.user_id] || "Unknown",
    replies: buildTree(comment._id),
  }));

  const totalRootComments = await ReviewModel.countDocuments({
    restaurant_id,
    parent_id: null,
  });

  const totalPages = Math.ceil(totalRootComments / limit);

  return {
    comments: tree,
    pagination: {
      totalComments: totalRootComments,
      totalPages,
      currentPage: page,
      perPage: limit,
    },
  };
};

export const ReviewService={
  createReview,
  updateReview,
  deleteReviewById,
  getReviewsWithReplies,
  getReviewById,
}