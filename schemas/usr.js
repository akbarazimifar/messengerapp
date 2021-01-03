const mongoose = require('mongoose')

const usr = mongoose.Schema({
    ID: { type: Number },
    uname: { type: String, unique: true },
    userpageID: { type: String },
    messagepageID: { type: String },
    pwd: { type: String },
    propic: { type: String }
})

const userz = mongoose.model('userz', usr)

module.exports = userz