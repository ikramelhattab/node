const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const TypeEquipSchema = new mongoose.Schema({

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    typeEquip: {
        type: String,
       required: true,
    },
    description: {
        type: String,
        required: false,
        default: ''
    },
    statut: {
        type: Boolean,
        required: true,
        default: true
    },

});

module.exports = mongoose.model('TypeEquip', TypeEquipSchema);