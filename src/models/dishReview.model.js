import mongoose, { Schema } from "mongoose";

const ReviewDishSchema = new Schema({
    content: {type: String},
    image: {
        url: {type: String},
        id: {type: String},
    },
    rating: {type: Number, default: 0},
    menuItem: {type:Schema.Types.ObjectId, ref:'Menus'},
    user: {type: Schema.Types.ObjectId, ref:'User'}
},
{timestamps: true})

const ReviewDishModel = mongoose.model('ReviewDish', ReviewDishSchema)
export default ReviewDishModel