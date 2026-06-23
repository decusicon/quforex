const mongoose = require('mongoose')
const { Schema } = mongoose
const { VERIFICATION_STATUS, ROLES, ACCOUNT_TYPES } = require('../../utils/enums')

const accountSchema = new Schema(
  {
    role: { type: String, required: true, default: ROLES[0], enum: ROLES },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    reset_password_token: { type: String },
    reset_password_expires: { type: Date },
    currency: { type: String, required: true },
    balance: { type: String, required: true },
    member_id: { type: String, required: true },
    verified_status: { type: String, required: true, default: VERIFICATION_STATUS[0], enum: VERIFICATION_STATUS },
    account_type: { type: String, required: true, default: ACCOUNT_TYPES[0], enum: ACCOUNT_TYPES },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

module.exports = mongoose.model('account', accountSchema)