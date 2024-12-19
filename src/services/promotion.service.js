import PromotionModel from "../models/promotions.models.js"
import { ConflictError } from "../errors/conflict.error.js"
import { NotFoundError } from "../errors/notFound.error.js"
import { BadRequestError } from "../errors/badRequest.error.js"


const createPromotion = async (user_id, data) => {
  // Kiểm tra xem promotion với code đã tồn tại hay chưa
  const existingPromotion = await PromotionModel.findOne({ code: data.code });
  
  if (existingPromotion) {
    throw new Error('Promotion code already exists'); // Ném lỗi nếu đã tồn tại
  }

  // Nếu không tồn tại, tạo mới promotion
  const newPromotion = new PromotionModel({ ...data, user_id });
  return await newPromotion.save();
};


const updatePromotion = async (id, data) => {
  // Lấy khuyến mãi từ cơ sở dữ liệu
  const promotion = await PromotionModel.findOne({ _id: id, deleted_at: null })
    .orFail(new NotFoundError('Không tìm thấy khuyến mãi'));

  // Kiểm tra startDate và endDate để cập nhật status
  const currentDate = new Date();
  let newStatus = promotion.status; // Trạng thái ban đầu

  if (data.startDate || data.endDate) {
    const startDate = data.startDate ? new Date(data.startDate) : promotion.startDate;
    const endDate = data.endDate ? new Date(data.endDate) : promotion.endDate;

    if (endDate < currentDate) {
      newStatus = 'expired';
    } else if (startDate > currentDate) {
      newStatus = 'upcoming';
    } else {
      newStatus = 'active';
    }
  }

  // Gộp trạng thái mới vào dữ liệu cập nhật
  const updatedData = { ...data, status: newStatus };

  // Cập nhật khuyến mãi với trạng thái mới
  const updatedPromotion = await PromotionModel.findByIdAndUpdate(id, updatedData, { new: true })
    .orFail(new BadRequestError('Không thể cập nhật'));

  return updatedPromotion;
};

const deletePromotion = async (id) => {
  const promotion = await PromotionModel.findById(id).orFail(new NotFoundError('Không tìm thấy khuyến mãi'));
  await promotion.deleteOne(); // Permanently deletes the document from the database
  return { message: 'Khuyến mãi đã được xóa thành công' };
}

const getAllPromotion = async (user_id, size = 5, page = 1) => {
    try {
      // Tính toán giá trị skip cho phân trang
      const skip = (page - 1) * size;
  
      // Truy vấn khuyến mãi với điều kiện user_id và chưa bị xóa
      const promotions = await PromotionModel.find({ user_id, deleted_at: null })
        .skip(skip) // Bỏ qua các mục trước đó
        .limit(size) // Giới hạn số mục trả về
  
      // Tính tổng số khuyến mãi cho phân trang
      const totalCount = await PromotionModel.countDocuments({ user_id, deleted_at: null });
  
      return {
        data: promotions,
        info: {
          total: totalCount,
          page,
          size,
          number_of_pages: Math.ceil(totalCount / size),
        },
      };
    } catch (error) {
      // Xử lý lỗi tùy ý
      throw new Error(`Lỗi khi lấy danh sách khuyến mãi: ${error.message}`);
    }
  };
  

const getPromotionById = async(id) => {
    return await PromotionModel.findOne({_id:id, deleted_at:null}).orFail(new NotFoundError('Không tìm tháy khuyến mãi'))
}
export const PromotionService = {
    createPromotion,
    updatePromotion,
    deletePromotion,
    getAllPromotion,
    getPromotionById
}