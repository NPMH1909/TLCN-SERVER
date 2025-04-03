import {VideoService} from "../services/video.service.js"
import VideoModel from '../models/videos.model.js';
import CommentModel from '../models/comment.model.js';
import { RestaurantModel } from '../models/restaurants.model.js';

// Mock các model
jest.mock('../models/videos.model.js');
jest.mock('../models/comment.model.js');
jest.mock('../models/restaurants.model.js');

describe('VideoService', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Xóa mock trước mỗi lần test
  });

  describe('addVideo', () => {
    it('should add a new video successfully', async () => {
      const videoData = { title: 'Sample Video', url: 'https://example.com', restaurant: 'restaurantId' };

      // Mock phương thức save của VideoModel
      VideoModel.prototype.save.mockResolvedValue(videoData);

      const result = await VideoService.addVideo(videoData);

      expect(result).toEqual(videoData);
      expect(VideoModel.prototype.save).toHaveBeenCalledWith(videoData);
    });
  });

  describe('getVideos', () => {
    it('should get all videos if no restaurantName is provided', async () => {
      const videos = [{ title: 'Video 1' }, { title: 'Video 2' }];
      VideoModel.find.mockResolvedValue(videos);

      const result = await VideoService.getVideos();

      expect(result).toEqual(videos);
      expect(VideoModel.find).toHaveBeenCalledWith({});
    });

    it('should get videos filtered by restaurantName if provided', async () => {
      const restaurantName = 'Restaurant 1';
      const restaurants = [{ _id: 'restaurantId', name: restaurantName }];
      const videos = [{ title: 'Video 1', restaurant: 'restaurantId' }];
      
      // Mock các phương thức
      RestaurantModel.find.mockResolvedValue(restaurants);
      VideoModel.find.mockResolvedValue(videos);
      CommentModel.find.mockResolvedValue([]);
      RestaurantModel.findById.mockResolvedValue({ name: restaurantName });

      const result = await VideoService.getVideos(restaurantName);

      expect(result).toEqual([{ ...videos[0], comments: [], restaurantName }]);
      expect(RestaurantModel.find).toHaveBeenCalledWith({ name: { $regex: restaurantName, $options: 'i' } });
    });
  });

  describe('incrementViewCount', () => {
    it('should increment the view count of the video', async () => {
      const videoId = 'videoId123';
      const video = { _id: videoId, views: 5, save: jest.fn().mockResolvedValue({ views: 6 }) };

      // Mock VideoModel.findById
      VideoModel.findById.mockResolvedValue(video);

      const result = await VideoService.incrementViewCount(videoId);

      expect(result.views).toBe(6);
      expect(VideoModel.findById).toHaveBeenCalledWith(videoId);
      expect(video.save).toHaveBeenCalled();
    });

    it('should throw error if video is not found', async () => {
      const videoId = 'nonExistentId';
      VideoModel.findById.mockResolvedValue(null);

      await expect(VideoService.incrementViewCount(videoId)).rejects.toThrow('Video not found');
    });
  });

  describe('getVideosByUserId', () => {
    it('should get videos by userId with pagination', async () => {
      const userId = 'user123';
      const page = 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const videos = [{ title: 'Video 1' }];
      const totalVideos = 1;

      VideoModel.find.mockResolvedValue(videos);
      VideoModel.countDocuments.mockResolvedValue(totalVideos);

      const result = await VideoService.getVideosByUserId(userId, page, limit);

      expect(result.videos).toEqual(videos);
      expect(result.pagination).toEqual({ totalPages: 1, currentPage: page });
      expect(VideoModel.find).toHaveBeenCalledWith({ user: userId });
      expect(VideoModel.countDocuments).toHaveBeenCalledWith({ user: userId });
    });
  });

  describe('deleteVideo', () => {
    it('should delete video and its comments', async () => {
      const videoId = 'videoId123';
      const video = { _id: videoId };

      // Mock các phương thức
      VideoModel.findByIdAndDelete.mockResolvedValue(video);
      CommentModel.deleteMany.mockResolvedValue();

      const result = await VideoService.deleteVideo(videoId);

      expect(result).toEqual(video);
      expect(VideoModel.findByIdAndDelete).toHaveBeenCalledWith(videoId);
      expect(CommentModel.deleteMany).toHaveBeenCalledWith({ video: videoId });
    });

    it('should throw error if video is not found', async () => {
      const videoId = 'nonExistentId';
      VideoModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(VideoService.deleteVideo(videoId)).rejects.toThrow('Video not found');
    });
  });

  describe('updateVideo', () => {
    it('should update video successfully', async () => {
      const videoId = 'videoId123';
      const updateData = { title: 'Updated Video' };
      const updatedVideo = { _id: videoId, title: 'Updated Video' };

      // Mock các phương thức
      VideoModel.findByIdAndUpdate.mockResolvedValue(updatedVideo);

      const result = await VideoService.updateVideo(videoId, updateData);

      expect(result).toEqual(updatedVideo);
      expect(VideoModel.findByIdAndUpdate).toHaveBeenCalledWith(videoId, { $set: updateData }, { new: true, runValidators: true });
    });

    it('should throw error if video is not found', async () => {
      const videoId = 'nonExistentId';
      VideoModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(VideoService.updateVideo(videoId, {})).rejects.toThrow('Video not found');
    });
  });
});
