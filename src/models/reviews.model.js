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
    parent_id: { type: Schema.ObjectId, default: null }, 
    created_at: { type: Date, required: true, default: Date.now },
    updated_at: { type: Date, required: true, default: Date.now },
    deleted_at: { type: Date, default: null },
    sentiment: { type: String, enum: ['positive', 'negative'], default: 'positive' }, 
    isFlagged: { type: Boolean, default: false },
    rating: {type: Number, default:0}
  },
  { timestamps: true }
);

const ReviewModel = mongoose.model('Review', ReviewSchema);

export default ReviewModel;

  