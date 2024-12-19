import { CommentService } from '../services/comment.service.js';

const createComment = async (req, res) => {
  const { videoId } = req.params; // Lấy videoId từ params
  const { content } = req.body;  // Chỉ cần nội dung comment

  try {
    const newComment = await CommentService.createComment(videoId, req.user.id, content);
    return res.status(201).json({ success: true, comment: newComment });
  } catch (error) {
    console.error('Error creating comment:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getCommentsForVideo = async (req, res) => {
  const { videoId } = req.params; // ID của video

  try {
    const comments = await CommentService.getCommentsForVideo(videoId);
    return res.status(200).json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const CommentController = {
  createComment,
  getCommentsForVideo
};
