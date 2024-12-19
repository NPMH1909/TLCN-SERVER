import { authenticationAdmin, requireApiKey } from '../middlewares/useApiKey.middleware.js'
import CommentRouter from './comment.route.js'
import LogRouter from './log.route.js'
import MenuRouter from './menu.route.js'
import { OrderRouter } from './order.route.js'
import PromotionRouter from './promotion.route.js'
import RestaurantRouter from './restaurant.route.js'
import ReviewRouter from './review.route.js'
import { StatRouter } from './stat.route.js'
import { TableRouter } from './table.route.js'
import UserRouter from './user.route.js'
import VideoRouter from './video.route.js'

const route = (app) => {
  app.use('/logs', requireApiKey, authenticationAdmin, LogRouter)

  app.use('/restaurants', RestaurantRouter)

  app.use('/tables', TableRouter)

  app.use('/orders', OrderRouter)

  app.use('/menus', MenuRouter)

  app.use('/promotions', PromotionRouter)

  app.use('/videos', VideoRouter)
  app.use('/reviews', ReviewRouter)
  app.use('/comments', CommentRouter)

  app.use('/stats', requireApiKey, authenticationAdmin, StatRouter)

  app.use('/', UserRouter)
}

export default route
