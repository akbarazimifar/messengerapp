const mongoose = require('mongoose')
const mss = mongoose.Schema({
    ID: { type: Number },
    sender: { type: Number },
    reciever: { type: Number },
    typ: { type: Number },
    body: { type: String }
})
const msg = mongoose.model('msg', mss)

module.exports = msg