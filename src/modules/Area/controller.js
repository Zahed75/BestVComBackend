const express = require('express');
const router = express.Router();
const areaService = require('../Area/service');
const { asyncHandler } = require("../../utility/common");

// Get all areas
const getAllAreas = asyncHandler(async (req, res) => {
    const areas = await areaService.getAllAreas();
    return res.status(200).json(areas);
});

// Add area to a specific city
const addAreaToCity = asyncHandler(async (req, res) => {
    const { cityId } = req.params;
    const areaData = req.body;

    const newArea = await areaService.addAreaToCity(cityId, areaData);
    return res.status(201).json(newArea);
});

// Update area by ID
const updateAreaById = asyncHandler(async (req, res) => {
    const updatedArea = await areaService.updateAreaById(req.params.areaId, req.body);
    return res.status(200).json(updatedArea);
});

// Delete area by ID
const deleteAreaById = asyncHandler(async (req, res) => {
    await areaService.deleteAreaById(req.params.areaId);
    return res.status(200).json({ message: 'Area deleted successfully' });
});





router.post('/add-Area/:cityId', addAreaToCity);

router.put('/updateArea/:areaId', updateAreaById);

router.get('/getAllAreas', getAllAreas);

router.delete('/deleteAreaById/:areaId', deleteAreaById);

module.exports = router;
