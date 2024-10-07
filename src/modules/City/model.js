const mongoose = require('mongoose');
const { Schema } = mongoose;

const CitySchema = new Schema({
    cityName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    }
}, {
    timestamps: true  // Automatically adds createdAt and updatedAt fields
});

const CityModel = mongoose.model('City', CitySchema);
module.exports = CityModel;
