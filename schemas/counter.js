const mongoose = require('mongoose')
const cntr = mongoose.Schema({
    _id: { type: String },
    usr: { type: Number },
    friends: { type: Number },
    mesg: { type: Number },
    groups: { type: Number }
})

const cnts = mongoose.model('cnts', cntr)
module.exports = cnts