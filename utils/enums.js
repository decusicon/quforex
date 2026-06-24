const { AccountStatuses, AccountRoles, AccountTypes, TransactionStatuses, WithdrawalAddressTypes, TradeStatuses, TradeTypes, TradeExecutionTypes } = require("./constants")
const VERIFICATION_STATUS = [AccountStatuses.UNVERIFIED, AccountStatuses.VERIFIED]
const TRANSACTION_STATUS = [TransactionStatuses.PENDING, TransactionStatuses.COMPLETED, TransactionStatuses.FAILED]
const WITHDRAWAL_ADDRESS_TYPES = [WithdrawalAddressTypes.BITCOIN, WithdrawalAddressTypes.PERFECTMONEY, WithdrawalAddressTypes.WIRETRANSFER]
const ROLES = [AccountRoles.MEMBER, AccountRoles.ADMIN]
const ACCOUNT_TYPES = [AccountTypes.SILVER, AccountTypes.PREMIUM, AccountTypes.GOLD]
const TRADE_STATUSES = [TradeStatuses.OPEN, TradeStatuses.CLOSED, TradeStatuses.CANCELED]
const TRADE_EXECUTION_TYPES = [TradeExecutionTypes.PROFIT, TradeExecutionTypes.LOSS]
const TRADE_TYPES = [TradeTypes.BUY, TradeTypes.SELL]


module.exports = { ROLES, VERIFICATION_STATUS, ACCOUNT_TYPES, TRANSACTION_STATUS, WITHDRAWAL_ADDRESS_TYPES, TRADE_STATUSES, TRADE_EXECUTION_TYPES, TRADE_TYPES }