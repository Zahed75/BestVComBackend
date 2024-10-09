const express=require('express');
const router=express.Router();

const cityService = require('../City/service');
const {asyncHandler} = require("../../utility/common");


// Create a new city

const createCityHandler = asyncHandler(async (req, res) => {
    try {
        const city = await cityService.createCity(req.body);
        return res.status(201).json(city);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
})





// Get all cities

const getAllCitiesHandler = asyncHandler(async (req, res) => {
    try {
        const cities = await cityService.getAllCities();
        return res.status(200).json(cities);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});




// Get city by ID
const getCityById = asyncHandler(async (req, res) => {
    try {
        const city = await cityService.getCityById(req.params.cityId);
        return res.status(200).json(city);
    } catch (error) {
        return res.status(404).json({ error: error.message });
    }
})

// Update a city by ID
const updateCity = asyncHandler(async (req, res) => {
    try {
        const city = await cityService.updateCity(req.params.cityId, req.body);
        return res.status(200).json(city);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
})





// Delete a city by ID
const deleteCity = asyncHandler(async (req, res) => {
    try {
        await cityService.deleteCity(req.params.cityId);
        return res.status(200).json({ message: 'City deleted successfully' });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
})



// Add area to city
const addAreaToCity = asyncHandler(async (req, res) => {
    try {
        const area = await cityService.addAreaToCity(req.params.cityId, req.body);
        return res.status(201).json(area);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
})






router.post('/createCity',createCityHandler);

router.get('/getCityById/:cityId', getCityById);

router.put('/updateCityById/:cityId', updateCity);

router.delete('/deleteCityById/:cityId',deleteCity);

router.get('/getAllCities', getAllCitiesHandler);

router.post('/cities/:cityId/areas',addAreaToCity);



module.exports = router;