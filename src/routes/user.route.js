import express from 'express'
import { UserController } from '../controllers/user.controller.js'
import { UserGetAnyFieldValidation, UserLoginValidation, UserRegisterValidation } from '../dto/in/user.dto.js'
import { handleValidationErrors } from '../middlewares/validation.middleware.js'
import { authenticationAdmin, requireApiKey } from '../middlewares/useApiKey.middleware.js'
const UserRouter = express.Router()

UserRouter.post('/login', UserLoginValidation, handleValidationErrors, UserController.loginUser)
UserRouter.post('/auth/login', UserLoginValidation, handleValidationErrors, UserController.loginAdmin)
UserRouter.post('/register',UserRegisterValidation, handleValidationErrors, UserController.register)
UserRouter.post('/change-password',requireApiKey, UserController.changePassword)

UserRouter.post('/mail', UserController.sendMail)
UserRouter.post(
  '/staff/resgister',
  UserRegisterValidation,
  handleValidationErrors,
  requireApiKey,
  authenticationAdmin,
  UserController.registerStaff
)
UserRouter.get('/user', requireApiKey, UserController.getUserById)
UserRouter.get('/users', requireApiKey, authenticationAdmin, UserController.getAllUsers)
// UserRouter.put('/user/:id', requireApiKey, UserController.updateUser)
UserRouter.put('/user/update', requireApiKey, UserController.updateUserById)

UserRouter.delete('/:id', requireApiKey, authenticationAdmin, UserController.deleteUser)
UserRouter.get('/staff', requireApiKey, UserController.getStaffById)

UserRouter.post('/mailrs', UserController.sendResetPasswordEmail)
UserRouter.put('/password', UserController.resetPassword)

UserRouter.post('/search', UserGetAnyFieldValidation, handleValidationErrors, UserController.findUsersByAnyField)
UserRouter.get('/favorites', requireApiKey, UserController.getFavorites)
UserRouter.post('/favorites/:restaurantId', requireApiKey, UserController.toggleFavorite)

export default UserRouter
