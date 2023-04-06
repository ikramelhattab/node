const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const EquipSchema = new mongoose.Schema({

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    typeEquipId: {
        type: Schema.Types.ObjectId,
        ref: 'TypeEquip',
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
 
    statut: {
        type: Boolean,
        required: true,
    },

    photoUrl: {
        type: String,
        required: true,
    },
    facteur: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model('Equipement', EquipSchema);