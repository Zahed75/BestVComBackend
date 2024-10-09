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
    timestamps: true
});

// Virtual field to link areas associated with this city
CitySchema.virtual('areas', {
    ref: 'Area',  // The model to use
    localField: '_id',  // The field in CityModel (City._id)
    foreignField: 'city',  // The field in AreaModel that refers to city (Area.city)
    justOne: false  // A city can have multiple areas
});

// Ensure virtuals are included in the output
CitySchema.set('toObject', { virtuals: true });
CitySchema.set('toJSON', { virtuals: true });

const CityModel = mongoose.model('City', CitySchema);

module.exports = CityModel;
