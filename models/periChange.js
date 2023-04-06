const mongoose = require('mongoose');
var Schema = mongoose.Schema;

// PeriChanges collection is used to store
// changes made to the plan in the perimeter

const PeriChangeSchema = new mongoose.Schema({
    perimeter: {
        type: Schema.Types.ObjectId,
        ref: 'Perimeter',
        required: true
    },
    changeDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    planUrl: {
        type: String,
        required: true,
    }
});

module.exports = mongoose.model('PeriChange', PeriChangeSchema);