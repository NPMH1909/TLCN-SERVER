import { body } from 'express-validator'

export const validateMenuItem = [
  body('code')
    .custom((value, { req }) => {
      if (value.trim().length === 0) {
        throw new Error('Code không được để trống hoặc chỉ chứa khoảng trắng')
      }
      return true
    })
    .isString()
    .withMessage('Mã phải là một chuỗi'),
  body('name')
    .trim()
    .custom((value, { req }) => {
      if (value.trim().length === 0) {
        throw new Error('Tên không được để trống hoặc chỉ chứa khoảng trắng')
      }
      return true
    }),
  body('category')
    .notEmpty()
    .withMessage('Danh mục không được để trống')
    .isString()
    .withMessage('Danh mục phải là một chuỗi')
    .isIn(['Dish', 'Beverage', 'Dessert'])
    .withMessage('Danh mục phải là một trong các giá trị: Dish, Beverage, Dessert'),
  body('description')
    .notEmpty()
    .withMessage('Mô tả không được để trống')
    .isString()
    .withMessage('Mô tả phải là một chuỗi'),
  body('unit').notEmpty().withMessage('Đơn vị không được để trống').isString().withMessage('Đơn vị phải là một chuỗi'),
  body('price')
    .notEmpty()
    .withMessage('Giá không được để trống')
    .isFloat({ min: 0 })
    .withMessage('Giá phải là một số dương'),
  body('discount').optional().isFloat({ min: 0 }).withMessage('Giảm giá phải là một số dương')
]
