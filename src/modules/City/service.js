const cityModel = require("../City/model");
const areaModel = require("../Area/model");
const {asyncHandler} = require("../../utility/common");




// Create a new city
const createCity = async (cityData) => {
    try {
        const city = new cityModel(cityData);
        await city.save();
        return city;
    } catch (error) {
        throw new Error('Error creating city: ' + error.message);
    }
};



// Get all cities
const getAllCities = async () => {
    try {
        // Populate the areas associated with each city
        return await cityModel.find().populate({
            path: 'areas',  // Populate the 'areas' field
            model: 'Area',  // Specify the Area model
            select: 'areaName'  // Select the fields you want to return (optional)
        }).lean().exec();
    } catch (error) {
        throw new Error('Error fetching cities: ' + error.message);
    }
};






// Get city by ID
const getCityById = async (cityId) => {
    try {
        return await cityModel.findById(cityId);
    } catch (error) {
        throw new Error('City not found: ' + error.message);
    }
};

// Update a city by ID
const updateCity = async (cityId, cityData) => {
    try {
        return await cityModel.findByIdAndUpdate(cityId, cityData, { new: true });
    } catch (error) {
        throw new Error('Error updating city: ' + error.message);
    }
};

// Delete a city by ID
const deleteCity = async (cityId) => {
    try {
        return await cityModel.findByIdAndDelete(cityId);
    } catch (error) {
        throw new Error('Error deleting city: ' + error.message);
    }
};

// Add a new area to a city
const addAreaToCity = async (cityId, areaData) => {
    try {
        const city = await cityModel.findById(cityId);
        if (!city) throw new Error('City not found');

        const area = new AreaModel({ ...areaData, city: cityId });
        await area.save();

        return area;
    } catch (error) {
        throw new Error('Error adding area to city: ' + error.message);
    }
};




module.exports = {

    createCity,
    getAllCities,
    getCityById,
    updateCity,
    deleteCity,
    addAreaToCity,

};
