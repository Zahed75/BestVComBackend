const EventModel = require('../Events/model');
const { BadRequest } = require('../../utility/errors');
const tempEventModel = require('../tempEvent/model');



const createEvent = async (eventData) => {
    const event = new EventModel(eventData);
    await event.save();
    return event;
};


const getAllEvents = async () => {
    return await EventModel.find().populate('categoriesId');
};



const addAllEvents = async (events) => {
    const createdEvents = await EventModel.insertMany(events);
    return createdEvents;
};




const updateCatEventIdByEventId = async (eventId, catEventId) => {
    const event = await EventModel.findById(eventId);
    if (!event) {
        throw new Error('Event not found');
    }
    event.eventCatId = catEventId;
    await event.save();
    return event;
};





module.exports = {
    createEvent,
    getAllEvents,
    addAllEvents,
    updateCatEventIdByEventId
}
