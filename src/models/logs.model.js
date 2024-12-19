import { HttpStatusCode } from 'axios'
import mongoose, { Schema } from 'mongoose'
const ObjectId = Schema.ObjectId

const Log = new Schema({
  user_id: { type: ObjectId, ref: 'Users', required: true },
  activity: { type: String, required: true },
  status: { type: Number, required: true },
  created_at: { type: Date, required: true, default: Date.now }
})
const LogModel = mongoose.model('Logs', Log)

export { LogModel }
