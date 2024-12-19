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



const incrementViewCount = async (videoId) => {
  const video = await VideoModel.findById(videoId);

  if (!video) {
    throw new Error('Video not found');
  }

  video.views += 1;
  return await video.save();
};

const getVideosByUserId = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const videos = await VideoModel.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  const totalVideos = await VideoModel.countDocuments({ user: userId });
  
  return {
    videos: videos || [],
    pagination: {totalPages: Math.ceil(totalVideos / limit),
      currentPage: page,}
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

export const VideoService = {
addVideo,
deleteVideo,
updateVideo,
getVideos,
getVideosByUserId
}