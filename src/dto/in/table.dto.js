import { body, param } from 'express-validator'
const TableGetById = [param('id').trim().notEmpty().withMessage('Thiếu ID').isMongoId().withMessage('Invalid ID')]

const TableCreateValidation = [
  body('tableNumber')
    .trim()
    .notEmpty()
    .withMessage('Thiếu số bàn')
    .isNumeric()
    .withMessage('Table number phải là một số'),
  body('restaurantID')
    .trim()
    .notEmpty()
    .withMessage('Thiếu ID nhà hàng')
    .isMongoId()
    .withMessage('Invalid restaurant ID')
]

const TableUpdateValidation = [
  body('tableNumber').trim().notEmpty().withMessage('Thiếu số bàn').isNumeric().withMessage('Số bàn phải là một số'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Thiếu trạng thái')
    .isBoolean()
    .withMessage('Trạng thái phải là một chuỗi'),
  body('restaurantID').trim().notEmpty().withMessage('Thiếu ID nhà hàng').isMongoId().withMessage('ID không hợp lệ')
]

const TableDeleteValidation = [
  param('id').trim().notEmpty().withMessage('Thiếu ID').isMongoId().withMessage('ID không hợp lệ')
]

export { TableGetById, TableCreateValidation, TableUpdateValidation, TableDeleteValidation }
