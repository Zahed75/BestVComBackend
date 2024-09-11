const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        title:{
            type: String,
            required: true,
            trim: true
        },  
        description: {
            type: String,
            required: true,
            trim: true
        },

    },
    {
        timestamps: true
    });

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;