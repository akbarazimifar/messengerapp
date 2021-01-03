const mongoose = require('mongoose')

const rreqs = mongoose.Schema({
    sender: {
        type: Number
    },
    reciever: {
        type: Number
    }
})

const frndrq = mongoose.model('frndrq', rreqs)

module.exports = frndrq