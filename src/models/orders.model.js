import mongoose, { Schema } from 'mongoose'
import { PAYMENT_STATUS } from '../constants/payment_status.constant.js'
import { PAYMENT_METHOD } from '../constants/payment_method.constant.js'
const ObjectId = Schema.ObjectId
// const Order = new Schema(
//   {
//     user_id: { type: ObjectId, ref: 'Users', required: true },
//     restaurant_id: { type: ObjectId, ref: 'Restaurants', required: true },
//     name: { type: String, required: true },
//     phone_number: { type: String, required: true },
//     email: { type: String, required: true },
//     payment: { type: String, require: true, enum: PAYMENT_METHOD },
//     status: { type: String, required: true, enum: PAYMENT_STATUS },
//     checkin: { type: Date, required: true },
//     checkout: { type: Date, default: null },
//     orderCode: { type: Number, default: Number(String(new Date().getTime()).slice(-6)) },
//     total_people: { type: Number, required: true },
//     list_menu: { type: [Object], required: true },
//     total: { type: Number, default: 0 },
//     created_at: { type: Date, required: true, default: Date.now },
//     updated_at: { type: Date, required: true, default: Date.now },
//     deleted_at: { type: Date, default: null }
//   },
//   { timestamps: true }
// )
// const OrderModel = mongoose.model('Orders', Order)

// export { OrderModel }

const OrderSchema = new Schema(
  {
    user_id: { type: ObjectId, ref: 'Users', required: false }, // Không bắt buộc cho khách walk-in
    restaurant_id: { type: ObjectId, ref: 'Restaurants', required: true },
    is_walk_in: { type: Boolean, required: true, default: false }, // Phân biệt loại đơn hàng
    rating:{type: Number, default: 0},
    name: { type: String, required: function () { return !this.is_walk_in; } }, // Bắt buộc với đơn qua website
    phone_number: { type: String, required: function () { return !this.is_walk_in; } },
    email: { type: String, required: function () { return !this.is_walk_in; } },
    payment: { type: String, required: false, enum: PAYMENT_METHOD },
    status: { type: String, required: true, enum: PAYMENT_STATUS },
    checkin: { type: Date, required: true },
    checkout: { type: Date, default: null },
    orderCode: { 
      type: Number, 
      required: true, 
      default: () => Number(String(new Date().getTime()).slice(-6))
    },
    total_people: { type: Number, required: function () { return !this.is_walk_in; } }, // Chỉ bắt buộc với đơn qua website
    list_menu: { type: [Object], required: true },
    total: { type: Number, default: 0 }, // Tổng tiền của đơn hàng
    amount_received: { type: Number, default: 0 }, // Tiền đã nhận (có thể là tiền cọc)
    amount_due: { type: Number, default: function () { return this.total - this.amount_received; } }, // Tiền cần thanh toán (tính theo cọc)
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    deleted_at: { type: Date, default: null }
  },
  { timestamps: true }
);

const OrderModel = mongoose.model('Orders', OrderSchema);
export { OrderModel };
