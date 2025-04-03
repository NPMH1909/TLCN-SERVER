import { CommentService } from '../services/comment.service.js';
import VideoModel from '../models/videos.model.js';
import CommentModel from '../models/comment.model.js';
import { NotFoundError } from '../errors/notFound.error.js';

// Mô phỏng các phương thức của VideoModel và CommentModel
jest.mock('../models/videos.model.js');
jest.mock('../models/comment.model.js');

describe('CommentService', () => {

  describe('createComment', () => {

    it('should create a new comment for a video', async () => {
      const videoId = '123';
      const userId = '456';
      const content = 'This is a comment';

      // Mô phỏng VideoModel.findById
      VideoModel.findById.mockResolvedValue({
        _id: videoId,
        comments: [],
      });

      // Mô phỏng CommentModel và save method
      const saveMock = jest.fn().mockResolvedValue({
        video: videoId,
        user: userId,
        content,
      });

      CommentModel.mockImplementation(() => ({
        save: saveMock,
        _id: '789',
      }));

      // Mô phỏng phương thức findByIdAndUpdate của VideoModel
      VideoModel.findByIdAndUpdate.mockResolvedValue(true);

      // Gọi hàm createComment và kiểm tra kết quả
      const newComment = await CommentService.createComment(videoId, userId, content);

      expect(newComment).toHaveProperty('video', videoId);
      expect(newComment).toHaveProperty('user', userId);
      expect(newComment).toHaveProperty('content', content);
      expect(saveMock).toHaveBeenCalledTimes(1);
      expect(VideoModel.findByIdAndUpdate).toHaveBeenCalledWith(videoId, {
        $push: { comments: '789' },
      });
    });

    it('should throw NotFoundError if video not found', async () => {
      const videoId = '123';
      const userId = '456';
      const content = 'This is a comment';

      // Mô phỏng VideoModel.findById trả về null (video không tồn tại)
      VideoModel.findById.mockResolvedValue(null);

      await expect(CommentService.createComment(videoId, userId, content))
        .rejects
        .toThrowError(NotFoundError);
    });
  });

  describe('getCommentsForVideo', () => {

    it('should return comments for a video', async () => {
      const videoId = '123';
      const mockComments = [
        { _id: '1', video: videoId, user: { username: 'user1' }, content: 'Great video!' },
        { _id: '2', video: videoId, user: { username: 'user2' }, content: 'Nice content!' },
      ];

      // Mô phỏng CommentModel.find và populate
      CommentModel.find.mockResolvedValue(mockComments);
      CommentModel.populate = jest.fn().mockResolvedValue(mockComments);

      const comments = await CommentService.getCommentsForVideo(videoId);

      expect(comments).toEqual(mockComments);
      expect(CommentModel.find).toHaveBeenCalledWith({ video: videoId });
      expect(CommentModel.populate).toHaveBeenCalledWith(mockComments, 'user', 'username');
    });

    it('should throw an error if there is an issue fetching comments', async () => {
      const videoId = '123';

      // Mô phỏng lỗi khi truy vấn CommentModel
      CommentModel.find.mockRejectedValue(new Error('Database error'));

      await expect(CommentService.getCommentsForVideo(videoId))
        .rejects
        .toThrowError('Database error');
    });
  });

});
