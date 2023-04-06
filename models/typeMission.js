const mongoose = require('mongoose');
var Schema = mongoose.Schema;

const TypesMissionSchema = new mongoose.Schema({

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    typeMission: {
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

});

// Just to permit empty string
mongoose.Schema.Types.String.checkRequired(v => v != null);

module.exports = mongoose.model('TypesMission', TypesMissionSchema);