const EventModel = require('../Events/model');
const { BadRequest } = require('../../utility/errors');




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







module.exports = {
    createEvent,
    getAllEvents,
    addAllEvents 
}
