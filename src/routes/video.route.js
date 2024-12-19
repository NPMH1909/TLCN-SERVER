import express from 'express';
import { VideoController } from '../controllers/video.controller.js';
import uploadVideoMiddleware from '../middlewares/uploadVideo.middleware.js';
import { authenticationAdmin, requireApiKey } from '../middlewares/useApiKey.middleware.js';
const VideoRouter = express.Router();

// Route thêm video mới
VideoRouter.post('/add', uploadVideoMiddleware, VideoController.addVideo);

// Route lấy tất cả video
VideoRouter.get('/', VideoController.getVideos);
VideoRouter.get('/user', requireApiKey, authenticationAdmin, VideoController.getVideosByUserId);
VideoRouter.put('/update/:videoId',uploadVideoMiddleware, VideoController.updateVideo);
VideoRouter.delete('/delete/:videoId', VideoController.deleteVideo);
// Route cập nhật lượt xem video
// VideoRouter.put('/:videoId/view', VideoController.incrementViewCount);

export default VideoRouter