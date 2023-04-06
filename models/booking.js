const mongoose = require('mongoose');
var Schema = mongoose.Schema;


const BookingSchema = new mongoose.Schema({
    
    userId: {
        // User id of the one who will have the reservation
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    num_reservation: {
        type: String,
        required: true
    },

    typeMissionId: {
        type: Schema.Types.ObjectId,
        ref: 'TypesMission',
        required: true
    },
    equipId: {
        type: Schema.Types.ObjectId,
        ref: 'Equipement',
        required: true
    },
    perimeterId: {
        type: Schema.Types.ObjectId,
        ref: 'Perimeter',
        required: true
    }, 
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true,
    },
    createdBy: {
        // User id of the one who created the reservation
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    statut: {
        type: String,
        required: true,
    },
    createdOn: {
        type: Date,
        required: true,
        default: Date.now
    },
});

module.exports = mongoose.model('Booking', BookingSchema);