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



const addAllEventsHandler = asyncHandler(async (req, res) => {
    const events = req.body.events;
    const createdEvents = await eventService.addAllEvents(events);
    res.status(201).json({
        message: 'Events added successfully',
        events: createdEvents,
    });
});


const updateCatEventIdByEventId = asyncHandler(async (req, res) => {
    const { eventId, catEventId } = req.body;
    const updatedEvent = await eventService.updateCatEventIdByEventId(eventId, catEventId);
    res.status(200).json({
        message: 'Event catEventId updated successfully',
        event: updatedEvent,
    });
});


const getProductsByEventId = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const products = await eventService.getProductsByEventId(eventId);
    res.status(200).json({
        message: 'Products fetched successfully',
        products,
    });
});





router.post('/create-event',createEventHandler);
router.get('/getAll-events',getAllEvents);
router.post('/addAll-events',addAllEventsHandler);
router.patch('/updateCatEventId',updateCatEventIdByEventId); // New endpoint for updating catEventId
router.get('/list/:eventId', getProductsByEventId);


module.exports = router;