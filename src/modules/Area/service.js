const areaModel = require("../Area/model");
const cityModel = require("../City/model");  // Import City model



// Add area under a specific city
const addAreaToCity = async (cityId, areaData) => {
    try {
        // Ensure the city exists
        const city = await cityModel.findById(cityId);
        if (!city) {
            throw new Error('City not found');
        }

        // Create new area with reference to the city
        const newArea = new areaModel({
            areaName: areaData.areaName,
            city: cityId
        });

        return await newArea.save();  // Save the new area
    } catch (error) {
        throw new Error('Error adding area: ' + error.message);
    }
};

// Get all areas with city information populated
const getAllAreas = async () => {
    try {
        return await areaModel.find().populate('city', 'cityName');  // Populate city name
    } catch (error) {
        throw new Error('Error fetching areas: ' + error.message);
    }
};

// Update an area by ID
const updateAreaById = async (areaId, areaData) => {
    try {
        return await areaModel.findByIdAndUpdate(areaId, areaData, { new: true });
    } catch (error) {
        throw new Error('Error updating area: ' + error.message);
    }
};

// Delete an area by ID
const deleteAreaById = async (areaId) => {
    try {
        return await areaModel.findByIdAndDelete(areaId);
    } catch (error) {
        throw new Error('Error deleting area: ' + error.message);
    }
};

module.exports = {
    addAreaToCity,
    getAllAreas,
    updateAreaById,
    deleteAreaById
};
