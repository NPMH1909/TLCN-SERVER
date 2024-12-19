import dotenv from 'dotenv'
dotenv.config()
export const DATABASE_CONFIG = {
  MONGO_DATABASE: process.env.MONGODB_URI
}
