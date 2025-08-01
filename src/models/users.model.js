import mongoose, { Schema } from 'mongoose'

const User = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  salt: { type: String, required: true },
  otp: {type: String},
  viewedRestaurants: [
    {
      restaurant: { type: Schema.Types.ObjectId, ref: "Restaurants" },
      lastViewed: { type: Date, default: Date.now },
    }
  ],
  bookedRestaurants: [{ type: Schema.Types.ObjectId, ref: "Restaurants" }], // Danh sách nhà hàng đã đặt bàn
  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurants',
    },
  ],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  deleted_at: { type: Date, default: null }
})

const UserModel = mongoose.model('User', User)
export { UserModel }
