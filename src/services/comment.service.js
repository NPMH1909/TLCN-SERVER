import { NotFoundError } from '../errors/notFound.error.js';
import CommentModel from '../models/comment.model.js';
import VideoModel from '../models/videos.model.js';

const createComment = async (videoId, userId, content) => {
  try {
    // Xác minh video tồn tại
    const video = await VideoModel.findById(videoId);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    // Tạo comment với userId
    const newComment = new CommentModel({
      video: videoId,
      user: userId,
      content,
    });

    await newComment.save();

    await VideoModel.findByIdAndUpdate(videoId, {
      $push: { comments: newComment._id },
    });

    return newComment;
  } catch (error) {
    throw new Error(error.message);
  }
};

const getCommentsForVideo = async (videoId) => {
  try {
    const comments = await CommentModel.find({ video: videoId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    return comments;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const CommentService = {
  createComment,
  getCommentsForVideo,
};
