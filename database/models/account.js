const Account = require('../schemas/account.schema')

// Create a Account
const addAccount = async (obj) => {
  try {
    const account = await Account.create({ ...obj })
    return account
  } catch (err) {
    err.message =
      err.code === 11000 ? 'Sorry, account already exist!' : err.message

    throw new Error(err.message)
  }
}

// Find Accounts
const findAccounts = async () => {
  try {
    const accounts = await Account.find().lean()
    return accounts
  } catch (err) {
    throw new Error(err.message)
  }
}

// Find a Account
const findAccount = async (obj) => {
  try {
    const found_account = await Account.findOne({ ...obj }).lean()
    return found_account
  } catch (err) {
    throw new Error(err.message)
  }
}

// Update Account
const updateAccount = async (obj, updatedObj) => {
  try {
    const updated_account = await Account.updateOne(
      { ...obj },
      { ...updatedObj }
    ).lean()
    return updated_account
  } catch (err) {
    throw new Error(err.message)
  }
}

// Delete Account
const deleteAccount = async (obj) => {
  try {
    const deleted_account = await Account.deleteOne({ ...obj })
    return deleted_account
  } catch (err) {
    throw new Error(err.message)
  }
}

module.exports = { addAccount, findAccount, findAccounts, updateAccount, deleteAccount }