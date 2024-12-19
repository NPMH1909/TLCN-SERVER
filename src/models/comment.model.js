import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId, // Tham chiếu đến video
      ref: 'Video', // Model mà nó tham chiếu (ở đây là 'Video')
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId, // Tham chiếu đến người dùng (nếu cần)
      ref: 'User', // Model người dùng, nếu bạn có model User để quản lý người dùng
      required: true,
    },
    content: {
      type: String, // Nội dung bình luận
      required: true,
      trim: true,
    },
    likes: {
      type: Number, // Số lượt thích cho bình luận
      default: 0,
    },
    createdAt: {
      type: Date, // Thời gian tạo bình luận
      default: Date.now,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

const CommentModel = mongoose.model('Comment', commentSchema);

export default CommentModel;
