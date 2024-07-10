const express = require('express');
const router = express.Router();
const roleMiddleware = require('../../middlewares/roleMiddleware');
const authMiddleware = require('../../middlewares/authMiddleware');
const { asyncHandler } = require('../../utility/common');
const eventService = require('./service');
const { HEAD_OFFICE, BRANCH_ADMIN } = require('../../config/constants');






const createEventHandler = asyncHandler(async (req, res) => {
    const eventData = req.body;
    const event = await eventService.createEvent(eventData);
    res.status(201).json({
        message: 'Event created successfully',
        event,
    });
});



const getAllEvents = asyncHandler(async (req, res) => {
    const events = await eventService.getAllEvents();
    res.status(200).json({
        message: 'Events fetched successfully',
        events,
    });
});




router.post('/create-event',createEventHandler);
router.get('/getAll-events',getAllEvents);

module.exports = router;