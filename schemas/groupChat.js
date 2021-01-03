const mongoose = require('mongoose')

const grup = mongoose.Schema({
    ID: {
        type: Number
    },
    groupname: {
        type: String
    },
    originalName: {
        type: String
    },
    owner: {
        type: Number
    }
})

const groups = mongoose.model('groups', grup)

module.exports = groups