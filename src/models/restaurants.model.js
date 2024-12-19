import mongoose, { Schema } from 'mongoose'
const ObjectId = Schema.ObjectId

const Restaurant = new Schema(
  {
    name: { type: String, required: true, unique: true },
    address: {
      province: { type: String, required: true },
      provinceCode:{type: String}, // Tỉnh/Thành phố
      district: { type: String, required: true },
      districtCode:{type: String}, // Tỉnh/Thành phố
      // Huyện/Quận
      detail: { type: String, required: true },   // Địa chỉ chi tiết (số nhà, đường...)
    },
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
    description: { type: String, required: true },
    rating:{type: Number, required: true, default:0},
    image_url: { type: String, required: true },
    slider1: { type: String, required: true },
    slider2: { type: String, required: true },
    slider3: { type: String, required: true },
    slider4: { type: String, required: true },
    public_id_avatar: { type: String, required: true },
    public_id_slider1: { type: String, required: true },
    public_id_slider2: { type: String, required: true },
    public_id_slider3: { type: String, required: true },
    public_id_slider4: { type: String, required: true },
    price_per_table: { type: Number, required: true },
    orderAvailable: {type: Number, default: 20},
    peopleAvailable: {type: Number, default: 20},
    limitTime: {type: Number, default: 2},
    promotions: { type: String },
    createdAt: { type: Date, required: true, default: Date.now },
    updated_at: { type: Date, required: true, default: Date.now },
    deleted_at: { type: Date, default: null },
    user_id: { type: ObjectId, refs: 'Users', required: true }
  },
)
const RestaurantModel = mongoose.model('Restaurants', Restaurant)

export { RestaurantModel }
