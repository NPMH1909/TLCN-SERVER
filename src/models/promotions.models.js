import mongoose from "mongoose";
const promotionSchema = new mongoose.Schema({
  code: {type: String, required: true, unique: true},
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  discountValue: {type: Number,required: true},
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  minOrderValue: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'upcoming', 'expired'],
    default: 'upcoming',
  },
  appliesToAllItems: {
    type: Boolean,
    default: true, 
  },
  applicableItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
  }],
  user_id: { type: mongoose.Types.ObjectId, ref: 'Users', required: true },
  deleted_at:{type: Date, default: null}
}, {
  timestamps: true,
});

promotionSchema.pre('save', function(next) {
  const currentDate = new Date();
  if (this.endDate < currentDate) {
    this.status = 'expired';
  } else if (this.startDate > currentDate) {
    this.status = 'upcoming';
  } else {
    this.status = 'active';
  }
  next();
});

const PromotionModel = mongoose.model('Promotion', promotionSchema);

export default PromotionModel