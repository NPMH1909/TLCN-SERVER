import ReviewModel from "../models/reviews.model.js";
import { UserModel } from "../models/users.model.js";
import winkSentiment from 'wink-sentiment';
import translate from 'translate';
import { analyzeReview, checkDuplicateReview } from "./recommendation.service.js";

translate.engine = 'google'; // hoặc 'libre', tuỳ bạn
translate.key = 'YOUR_GOOGLE_API_KEY'; // nếu dùng engine cần key

//  const createReview = async (reviewData) => {
//   try {
//     const { content, rating } = reviewData;

//     let sentimentLabel = 'positive';
//     let isFlagged = false;

//     if (content && content.trim() !== '') {
//       try {
//         const translatedContent = await translate(content, { from: 'vi', to: 'en' });
//         const sentimentResult = winkSentiment(translatedContent);
//         const score = sentimentResult.score;

//         // Xác định sentiment
//         if (score < 0) {
//           sentimentLabel = 'negative';
//         }

//         // So sánh sentiment với rating (ví dụ rating từ 1-5)
//         if ((rating >= 4 && sentimentLabel === 'negative') ||
//             (rating <= 2 && sentimentLabel === 'positive')) {
//           isFlagged = true; // Người dùng có thể đánh giá không trung thực hoặc spam
//         }

//         // Gán vào reviewData
//         reviewData.sentiment = sentimentLabel;
//         reviewData.isFlagged = isFlagged;
//       } catch (e) {
//         console.error('Sentiment analysis error:', e.message);
//         // Trong trường hợp lỗi, mặc định để là positive
//         reviewData.sentiment = 'positive';
//         reviewData.isFlagged = false;
//       }
//     }

//     const newReview = await ReviewModel.create(reviewData);
//     return newReview;
//   } catch (error) {
//     throw new Error("Error creating review: " + error.message);
//   }
// };

const createReview = async (reviewData) => {
  try {
    const { content, rating } = reviewData;

    const { sentiment, isFlagged: conflictFlag } = await analyzeReview(content, rating);
    const { isSpam, reason } = await checkDuplicateReview(reviewData);

    // Tổng hợp flags
    reviewData.sentiment = sentiment;
    reviewData.isFlagged = conflictFlag || isSpam;
    reviewData.flagReason = conflictFlag ? 'Conflict sentiment' : (isSpam ? reason : null);

    const newReview = await ReviewModel.create(reviewData);
    return newReview;
  } catch (error) {
    throw new Error('Error creating review: ' + error.message);
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

  // Lấy comment gốc không bị flagged
  const rootComments = await ReviewModel.find({
    restaurant_id,
    parent_id: null,
    isFlagged: false,
  })
    .skip(skip)
    .limit(limit)
    .sort({ created_at: -1 })
    .lean();

  // Lấy tất cả comment không bị flagged
  const allComments = await ReviewModel.find({
    restaurant_id,
    isFlagged: false,
  }).lean();

  // Lấy danh sách user liên quan
  const userIds = [...new Set(allComments.map((comment) => comment.user_id))];
  const users = await UserModel.find({ _id: { $in: userIds } })
    .select("_id username")
    .lean();

  const userMap = users.reduce((map, user) => {
    map[user._id] = user.username;
    return map;
  }, {});

  // Xây dựng cây trả lời
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

  // Đếm tổng số comment gốc hợp lệ
  const totalRootComments = await ReviewModel.countDocuments({
    restaurant_id,
    parent_id: null,
    isFlagged: false,
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