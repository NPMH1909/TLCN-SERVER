import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../configs/cloundinary.config.js';

const videoStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'orderingfood',
      allowedFormats: ['mp4', 'mov', 'avi'], // Chỉ cho phép định dạng video
      resource_type: 'video', // Chỉ xử lý video
    },
  });
  
  const uploadVideo = multer({ storage: videoStorage });
  
  const uploadVideoMiddleware = (req, res, next) => {
    uploadVideo.single('videoUrl')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: 'Lỗi trong quá trình upload video.',
        });
      }
      next();
    });
  };
  
  export default uploadVideoMiddleware;
  