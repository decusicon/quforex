const mongoose = require('mongoose')
const { connect, connection } = mongoose
mongoose.set('strictQuery', true)

const connectionString =
  process.env.NODE_ENV === 'development'
    ? `${process.env.MONGODB_LOCAL_URI}`
    : `${process.env.MONGODB_ONLINE_URI}`

connect(connectionString)
  .then(() => console.log(`Connected to MongoDB -> ${process.env.APP_NAME} `))
  .catch((err) => console.error('MONGODB ERROR: ', err))

module.exports = connection