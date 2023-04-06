const mongoose = require('mongoose');

const FreqSchema = new mongoose.Schema({
    _0_100euro : {
        type: Number,
        required: true,
    },
    _100_500euro: {
        type: Number,
        required: true
    },
    _500_1500euro:  {
        type: Number,
        required: true
    },

    _1500euro: {
        type: Number,
        required: true
    },

    horizon: {
        type: Number,
        required: true
    },
});

module.exports = mongoose.model('freqControle', FreqSchema);