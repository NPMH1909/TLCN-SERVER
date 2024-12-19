import { body, param, query } from 'express-validator'

const RestaurangGetAllValidation = []

const RestaurantGetByIdValidation = [
  param('id').trim().notEmpty().withMessage('Thiếu id').isString().withMessage('Id phải là chuỗi')
]

const RestaurantCreateValidation = [
  body('name').trim().notEmpty().withMessage('Thiếu tên nhà hàng').isString().withMessage('Tên nhà hàng phải là chuỗi'),
  body('address').trim().notEmpty().withMessage('Thiếu địa chỉ').isString().withMessage('Địa chỉ phải là chuỗi'),
  body('openTime').trim().notEmpty().withMessage('Thiếu giờ mở cửa').isString().withMessage('Giờ mở cửa phải là số'),
  body('closeTime')
    .trim()
    .notEmpty()
    .withMessage('Thiếu giờ đóng cửa')
    .isString()
    .withMessage('Giờ đóng cửa phải là số'),
  body('description').trim().notEmpty().withMessage('Thiếu mô tả').isString().withMessage('Mô tả phải là chuỗi'),
  body('image_url').trim().notEmpty().withMessage('Thiếu ảnh').isString().withMessage('Ảnh phải là chuỗi'),
  body('slider1').trim().notEmpty().isString().withMessage('Ảnh 1 phải là chuỗi'),
  body('slider2').trim().notEmpty().isString().withMessage('Ảnh 2 phải là chuỗi'),
  body('slider3').trim().notEmpty().isString().withMessage('Ảnh 3 phải là chuỗi'),
  body('slider4').trim().notEmpty().isString().withMessage('Ảnh 4 phải là chuỗi')
]

const RestaurantUpdateValidation = [
  param('id').trim().notEmpty().withMessage('Thiếu id').isString().withMessage('Id phải là chuỗi'),
  body('name').trim().notEmpty().withMessage('Thiếu tên nhà hàng').isString().withMessage('Tên nhà hàng phải là chuỗi'),
  body('address').trim().notEmpty().withMessage('Thiếu address').isString().withMessage('Địa chỉ phải là chuỗi'),
  body('openTime').trim().notEmpty().isString().withMessage('Giờ mở cửa phải là số'),
  body('closeTime').trim().notEmpty().isString().withMessage('Giờ đóng cửa phải là số'),
  body('description').trim().notEmpty().isString().withMessage('Mô tả phải là chuỗi'),
  body('image_url').trim().notEmpty().isString().withMessage('Ảnh phải là chuỗi'),
  body('slider1').trim().notEmpty().isString().withMessage('Ảnh 1 phải là chuỗi'),
  body('slider2').trim().notEmpty().isString().withMessage('Ảnh 2 phải là chuỗi'),
  body('slider3').trim().notEmpty().isString().withMessage('Ảnh 3 phải là chuỗi'),
  body('slider4').trim().notEmpty().isString().withMessage('Ảnh 4 phải là chuỗi')
]

const RestaurantDeleteValidation = [
  param('id').trim().notEmpty().withMessage('Thiếu id').isString().withMessage('Id phải là chuỗi')
]
const RestaurantGetAnyFieldValidation = [
  query('page').notEmpty().withMessage('Trang không được trống').isNumeric().withMessage('Trang phải là số').toInt(),
  body('searchTerm')
    .trim()
    .notEmpty()
    .withMessage('Giá trị tìm kiếm là bắt buộc')
    .isString()
    .withMessage('Giá trị tìm kiếm phải là một chuỗi')
]
export {
  RestaurantCreateValidation,
  RestaurantUpdateValidation,
  RestaurantDeleteValidation,
  RestaurantGetByIdValidation,
  RestaurangGetAllValidation,
  RestaurantGetAnyFieldValidation
}
