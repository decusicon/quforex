const mongoose = require('mongoose')
const { Schema } = mongoose
const { TRADE_STATUSES, TRADE_EXECUTION_TYPES, TRADE_TYPES } = require('../../utils/enums')

const tradeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'account', required: true },
    volume: { type: String, required: true, },
    trade_type: { type: String, required: true, enum: TRADE_TYPES },
    symbol: { type: String, required: true },
    stop_loss: { type: String, required: true, default: '0.0000' },
    take_profit: { type: String, required: true, default: '0.0000' },
    comment: { type: String, required: true, default: 'No comment' },
    traded_status: { type: String, required: true, default: TRADE_STATUSES[0], enum: TRADE_STATUSES },
    time_to_exp: { type: Date, required: true, default: () => Date.now() + 24 * 60 * 60 * 1000 }, // Time to expiration is 24hrs
    execution_type: { type: String, required: true, enum: TRADE_EXECUTION_TYPES },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
)

module.exports = mongoose.model('trade', tradeSchema)