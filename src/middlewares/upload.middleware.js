import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../configs/cloundinary.config.js';

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'orderingfood',
    allowedFormats: ['jpg', 'png', 'jpeg'], 
  },
});

const upload = multer({ storage });

const uploadFiles = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lỗi trong quá trình upload hình ảnh.', 
      });
    }
    next(); 
  });
};

export default uploadFiles;
