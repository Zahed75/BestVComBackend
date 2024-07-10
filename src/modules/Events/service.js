const EventModel = require('../Events/model');
const { BadRequest } = require('../../utility/errors');





const createEvent = async (eventData) => {
    const event = new EventModel(eventData);
    await event.save();
    return event;
};










module.exports = {
    createEvent
}
