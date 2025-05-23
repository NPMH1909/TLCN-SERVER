import { authenticationAdmin, requireApiKey } from '../middlewares/useApiKey.middleware.js'
import ChatBox from './chatbox.route.js'
import CommentRouter from './comment.route.js'
import dishReviewRouter from './dishReview.route.js'
import LogRouter from './log.route.js'
import MenuRouter from './menu.route.js'
import { OrderRouter } from './order.route.js'
import PromotionRouter from './promotion.route.js'
import Recommendation from './recommendation.route.js'
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
  app.use('/dishreviews', dishReviewRouter)

  app.use('/comments', CommentRouter)
  app.use('/chatbot', ChatBox)

  app.use('/stats', requireApiKey, authenticationAdmin, StatRouter)
  app.use('/recommendation', Recommendation)
  app.use('/', UserRouter)
}

export default route
