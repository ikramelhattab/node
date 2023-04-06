

const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const LeakSchema = new mongoose.Schema({

    leakName: {
        type: String,
        required: true
    },
    bookingId: {
        type: Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    leakDate: {
        type: Date,
    },
    leakGain: {
        type: Number,
    },
    leakDbRms: {
        type: Number
    },
    leakK: {
        type: Number
    },
    leakFlow: {
        type: Number
    },
    leakCost: {
        type: Number,
    },
    leakCurrency: {
        type: String,
    },
    leakImgUrl: {
        type: String
    },
    leakCoord: {
        type: Array,
    },
    // Action stuffs
    actionPilote: {
        type: String
    },
    actionDelai: {
        type: Date
    },
    actionDesc: {
        type: String
    },
    actionCost: {
        type: Number
    },
    actionStatut: {
        type: String,
        default: 'En cours'
    },

    type_action: {
        type: String,
        default: 'Réparation' 
    },
    isValidated: {
        type: Boolean,
        default: false
    },
    createdOn: {
        type: Date,
        required: true,
        default: Date.now
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
   
});

module.exports = mongoose.model('Leak', LeakSchema);