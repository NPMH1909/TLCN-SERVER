import  mongoose from "mongoose"

// Định nghĩa schema cho Video
const videoSchema = new mongoose.Schema(
  {
    videoUrl: {
      type: String, 
      required: true,
    },
    title: {
      type: String, 
      required: true,
      trim: true,
    },
    description: {
      type: String, 
      required: true,
      trim: true,
    },
    likes: {
      type: Number, 
      default: 0,
    },
    views: {
      type: Number, 
      default: 0,
    },
    createdAt: {
      type: Date, 
      default: Date.now,
    },
    //comment: {type: String,required: true, unique: true}
    restaurant: {
      type: mongoose.Schema.Types.ObjectId, // Trường này sẽ tham chiếu đến mô hình Restaurant
      ref: 'Restaurant', // Ánh xạ đến mô hình 'Restaurant'
      required: true, // Mỗi video phải thuộc về một nhà hàng
    },
    likedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Danh sách user đã like
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// Tạo model từ schema
const VideoModel = mongoose.model('Video', videoSchema);

export default VideoModel