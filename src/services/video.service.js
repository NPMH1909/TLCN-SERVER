import VideoModel from '../models/videos.model.js';
import CommentModel from '../models/comment.model.js';
import { RestaurantModel } from '../models/restaurants.model.js';

const addVideo = async (videoData) => {
  const newVideo = new VideoModel(videoData);
  return await newVideo.save();
};

const getVideos = async (restaurantName = "") => {
  // Nếu không có tên nhà hàng, trả toàn bộ video
  let restaurants = [];
  if (restaurantName) {
    // Tìm nhà hàng theo tên
    restaurants = await RestaurantModel.find({
      name: { $regex: restaurantName, $options: "i" }, // Tìm kiếm không phân biệt hoa thường
    });
  }
  const videos = await VideoModel.find(
    restaurantName && restaurants.length > 0
      ? { restaurant: { $in: restaurants.map((r) => r._id) } } // Lọc theo nhà hàng
      : {} // Không có điều kiện nếu không tìm theo tên
  ).sort({ createdAt: -1 });

  if (videos.length === 0) {
    return [];
  }

  const videoWithComments = await Promise.all(
    videos.map(async (video) => {
      const comments = await CommentModel.find({ video: video._id });
      const restaurant = await RestaurantModel.findById(video.restaurant);
      return { ...video.toObject(), comments, restaurantName: restaurant.name };
    })
  );

  return videoWithComments;
};


const getVideosByUserId = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  // Tìm tất cả nhà hàng thuộc userId
  const restaurants = await RestaurantModel.find({ user_id: userId }, '_id');
  const restaurantIds = restaurants.map((restaurant) => restaurant._id);

  // Nếu không có nhà hàng, trả về rỗng
  if (restaurantIds.length === 0) {
    return {
      videos: [],
      pagination: {
        totalPages: 0,
        currentPage: page,
      },
    };
  }

  // Tìm video dựa trên restaurantIds
  const videos = await VideoModel.find({ restaurant: { $in: restaurantIds } })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalVideos = await VideoModel.countDocuments({ restaurant: { $in: restaurantIds } });

  return {
    videos: videos || [],
    pagination: {
      totalPages: Math.ceil(totalVideos / limit),
      currentPage: page,
    },
  };
};

const deleteVideo = async (videoId) => {
  const video = await VideoModel.findByIdAndDelete(videoId);

  if (!video) {
    throw new Error('Video not found');
  }

  await CommentModel.deleteMany({ video: videoId });

  return video;
};

const updateVideo = async (videoId, updateData) => {
  const video = await VideoModel.findByIdAndUpdate(
    videoId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!video) {
    throw new Error('Video not found');
  }

  return video;
};
const getMostLikedVideo = async (restaurantId) => {
  const video = await VideoModel.findOne({ restaurant: restaurantId }) 
    .sort({ likes: -1 }) // Sắp xếp theo lượt thích giảm dần
    .limit(1);

  if (!video) {
    throw new Error("Không tìm thấy video nào.");
  }

  return video;
};
const likeVideo = async ({videoId, userId}) => {
  const video = await VideoModel.findById(videoId);
  if (!video) throw new Error('Video not found');

  // Kiểm tra xem user đã like chưa
  const hasLiked = video.likedUsers.includes(userId);
  
  if (hasLiked) {
    // Nếu đã like thì unlike (bỏ like)
    video.likes -= 1;
    video.likedUsers = video.likedUsers.filter(id => id.toString() !== userId);
  } else {
    // Nếu chưa like thì like
    video.likes += 1;
    video.likedUsers.push(userId);
  }

  await video.save();
  return video;
};


export const VideoService = {
addVideo,
deleteVideo,
updateVideo,
getVideos,
getVideosByUserId,
likeVideo,
getMostLikedVideo
}