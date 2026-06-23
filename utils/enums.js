const { AccountStatuses, AccountRoles, AccountTypes, TransactionStatuses } = require("./constants")
const VERIFICATION_STATUS = [AccountStatuses.UNVERIFIED, AccountStatuses.VERIFIED]
const TRANSACTION_STATUS = [TransactionStatuses.PENDING, TransactionStatuses.COMPLETED, TransactionStatuses.FAILED]
const ROLES = [AccountRoles.MEMBER, AccountRoles.ADMIN]
const ACCOUNT_TYPES = [AccountTypes.SILVER, AccountTypes.PREMIUM, AccountTypes.GOLD]


module.exports = { ROLES, VERIFICATION_STATUS, ACCOUNT_TYPES, TRANSACTION_STATUS }