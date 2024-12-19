import mongoose, { Schema } from "mongoose";


const ReviewSchema = new Schema(
  {
    restaurant_id: { type: Schema.ObjectId, required: true },
    user_id: { type: Schema.ObjectId, required: true },
    image: {
      url: { type: String },
      id: { type: String }
    },
    content: { type: String, required: true },
    parent_id: { type: Schema.ObjectId, default: null }, // Thêm trường này
    created_at: { type: Date, required: true, default: Date.now },
    updated_at: { type: Date, required: true, default: Date.now },
    deleted_at: { type: Date, default: null }
  },
  { timestamps: true }
);

const ReviewModel = mongoose.model('Review', ReviewSchema);

export default ReviewModel;

  