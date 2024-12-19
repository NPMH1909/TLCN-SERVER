import mongoose, { Schema } from 'mongoose'
const ObjectId = Schema.ObjectId
const Table = new Schema({
  number_of_tables: { type: Number, required: true },
  people_per_table: { type: Number, required: true },
  restaurant_id: { type: ObjectId, ref: 'Restaurants', required: true },
  created_at: { type: Date, required: true, default: Date.now },
  updated_at: { type: Date, required: true, default: Date.now },
  deleted_at: { type: Date, default: null }
})
const TableModel = mongoose.model('Tables', Table)

export { TableModel }
