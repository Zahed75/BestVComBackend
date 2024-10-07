const mongoose = require('mongoose');
const { Schema } = mongoose;

const areaSchema = new Schema({
    areaName: {
        type: String,
        required: true,
    },
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',  // Reference to the City model
        required: true
    }
}, {
    timestamps: true  // To keep track of creation and update times
});

const AreaModel = mongoose.model('Area', areaSchema);

module.exports = AreaModel;
