const mongoose = require('mongoose')

const lstm = mongoose.Schema({
    sender: { type: Number },
    reciever: { type: Number },
    body: { type: String },
    msid: { type: Number },
    typ: { type: Number }
})

const lastmsg = mongoose.model('lastmsg', lstm)

module.exports = lastmsg