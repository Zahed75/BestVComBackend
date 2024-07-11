const EventModel = require('../Events/model');
const CategoryModel = require('../Category/model'); // Import Category model
const ProductModel = require('../Products/model');
const { BadRequest } = require('../../utility/errors');
const tempEventModel = require('../tempEvent/model');



const createEvent = async (eventData) => {
    const event = new EventModel(eventData);
    await event.save();
    return event;
};


const getAllEvents = async () => {
    const events = await EventModel.find().populate('categoriesId');

    for (const event of events) {
        if (event.categoriesId) {
            const products = await ProductModel.find({ categoryId: event.categoriesId });
            event._doc.products = products; // Adding products to the event document
        }
    }

    return events;
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
