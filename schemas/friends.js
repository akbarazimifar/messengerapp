const mongoose = require('mongoose')

const frnd = mongoose.Schema({
    fr1: { type: Number },
    fr2: { type: Number }
})

const friends = mongoose.model('friends', frnd)
module.exports = friends