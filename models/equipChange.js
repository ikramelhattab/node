const mongoose = require('mongoose');
var Schema = mongoose.Schema;

// PeriChanges collection is used to store
// changes made to the plan in the perimeter

const EquipChangeSchema = new mongoose.Schema({
    equipement: {
        type: Schema.Types.ObjectId,
        ref: 'Equipement',
        required: true
    },
    changeDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    facteur: {
        type: Number,
        required: true,
    }
});

module.exports = mongoose.model('EquipChange', EquipChangeSchema);