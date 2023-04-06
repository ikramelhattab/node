const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const PerimeterSchema = new mongoose.Schema({
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    code: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true
    },
    createdOn: {
        type: Date,
        required: true,
        default: Date.now
    },
    updatedOn: {
        type: Date,
        required: true,
        default: Date.now
    },
    statut: {
        type: Boolean,
        required: true,
    },
    photoUrl: {
        type: String,
        required: true,
    },
    thumbUrl: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Perimeter', PerimeterSchema);