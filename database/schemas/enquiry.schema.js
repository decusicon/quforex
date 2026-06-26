const mongoose = require('mongoose')
const { Schema } = mongoose

const enquirySchema = new Schema(
  {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    country: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

module.exports = mongoose.model('enquiry', enquirySchema)