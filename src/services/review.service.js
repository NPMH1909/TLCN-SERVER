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

const deleteReview = async (id) => {
  try {
    return await ReviewModel.findByIdAndUpdate(
      id,
      { deleted_at: new Date() },
      { new: true }
    );
  } catch (error) {
    throw error;
  }
};

const updateReview = async (id, data) => {
  try {
    return await ReviewModel.findByIdAndUpdate(
      id,
      { ...data, updated_at: new Date() },
      { new: true }
    );
  } catch (error) {
    throw error;
  }
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
  deleteReview,
  getReviewsWithReplies,
  getReviewById,
}