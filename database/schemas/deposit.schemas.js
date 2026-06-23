const mongoose = require('mongoose')
const { Schema } = mongoose
const { VERIFICATION_STATUS, ROLES, ACCOUNT_TYPES, TRANSACTION_STATUS } = require('../../utils/enums')

const depositSchema = new Schema(
  {
    amount: { type: String, required: true },
    method: { type: String, required: true },
    confirmation_status: { type: String, required: true, default: TRANSACTION_STATUS[0], enum: TRANSACTION_STATUS },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

module.exports = mongoose.model('deposit', depositSchema)