const mongoose = require('mongoose')

const mem = mongoose.Schema({
    group: {
        type: Number
    },
    member: {
        type: Number
    }
})

const members = mongoose.model('members', mem)

module.exports = members