import { HttpStatusCode } from "axios";
import { Response } from "../dto/response/response.js";
import {VideoService} from "../services/video.service.js"

const addVideo = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Vui lòng tải lên một video.' });
  }

  const { title, description, restaurant } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Tất cả các trường là bắt buộc.' });
  }

  try {
    const videoUrl = req.file.path;

    const result = await VideoService.addVideo({
      videoUrl,
      title,
      description,
      restaurant
    });

    return new Response(HttpStatusCode.Ok, 'Đăng nhập thành công', result).resposeHandler(res)
  } catch (error) {
      next(new Response(error.statusCode || HttpStatusCode.InternalServerError, error.message, null).resposeHandler(res))
  }
};


const getVideos = async (req, res) => {
  try {
    const {restaurantName} = req.query
    const videos = await VideoService.getVideos(restaurantName);
    res.status(200).json(videos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Không thể lấy video, vui lòng thử lại.' });
  }
};

// const incrementViewCount = async (req, res) => {
//   const { videoId } = req.params;

//   try {
//     const updatedVideo = await incrementViewCountService(videoId);
//     res.status(200).json({ message: 'Lượt xem đã được cập nhật.', video: updatedVideo });
//   } catch (error) {
//     console.error(error);

//     if (error.message === 'Video not found') {
//       return res.status(404).json({ message: 'Video không tồn tại.' });
//     }

//     res.status(500).json({ message: 'Không thể cập nhật lượt xem, vui lòng thử lại.' });
//   }
// };


const getVideosByUserId = async (req, res) => {
  const { userId } = req.user;
  const { page = 1, limit = 10 } = req.query;

  try {
    const { videos, totalPages, currentPage } = await VideoService.getVideosByUserId(userId, page, limit);

    res.status(200).json({ videos, totalPages, currentPage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Không thể lấy video, vui lòng thử lại.' });
  }
};


const deleteVideo = async (req, res) => {
  const { videoId } = req.params;

  try {
    const deletedVideo = await VideoService.deleteVideo(videoId);
    res.status(200).json({ message: 'Video đã được xóa thành công.', video: deletedVideo });
  } catch (error) {
    console.error(error);

    if (error.message === 'Video not found') {
      return res.status(404).json({ message: 'Video không tồn tại.' });
    }

    res.status(500).json({ message: 'Không thể xóa video, vui lòng thử lại.' });
  }
};

const updateVideo = async (req, res) => {
  const { videoId } = req.params;
  const { title, description, videoUrl } = req.body;
  console.log('data', req.body)

  try {
    const updatedVideo = await VideoService.updateVideo(videoId, { title, description, videoUrl });
    res.status(200).json({ message: 'Video đã được cập nhật thành công.', video: updatedVideo });
  } catch (error) {
    console.error(error);

    if (error.message === 'Video not found') {
      return res.status(404).json({ message: 'Video không tồn tại.' });
    }

    res.status(500).json({ message: 'Không thể cập nhật video, vui lòng thử lại.' });
  }
};

export const VideoController = {
  addVideo,
  getVideos,
  getVideosByUserId,
  deleteVideo, 
  updateVideo,
};

