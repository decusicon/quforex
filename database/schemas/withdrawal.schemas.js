const mongoose = require('mongoose')
const { Schema } = mongoose
const { TRANSACTION_STATUS, WITHDRAWAL_ADDRESS_TYPES } = require('../../utils/enums')

const withdrawalSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'account', required: true },
    amount: { type: String, required: true },
    method: { type: String, required: true, enum: WITHDRAWAL_ADDRESS_TYPES },
    address_details: { type: Object, required: true }, // E.g { 'bitcoin_address': 'bitcoin_address' } OR { 'account_no': 'account_no', 'account_name': 'account_name' } OR { 'account_no': 'account_no', 'account_name': 'account_name', 'bank_name': 'bank_name', 'swift_code': 'swift_code', 'routing_number': 'routing_number', 'bank_address': 'bank_address' }
    confirmation_status: { type: String, required: true, default: TRANSACTION_STATUS[0], enum: TRANSACTION_STATUS },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

module.exports = mongoose.model('withdrawal', withdrawalSchema)