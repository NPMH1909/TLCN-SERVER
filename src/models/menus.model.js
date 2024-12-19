import mongoose from 'mongoose'

const menuItemSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.ObjectId,
    code: { type: String, required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Dish', 'Beverage', 'Dessert']
    },
    image: {
      url: {type: String, required: true},
      id: {type: String, required: true}
    },
    description: { type: String, required: true },
    unit: { type: String, required: true },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurants' },
    created_at: { type: Date, required: true, default: Date.now },
    updated_at: { type: Date, required: true, default: Date.now },
    deleted_at: { type: Date, default: null }
  },
  { timestamps: true }
)

const MenuItem = mongoose.model('Menus', menuItemSchema)
export default MenuItem
