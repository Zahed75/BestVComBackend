const EventModel = require('../Events/model');
const CategoryModel = require('../Category/model'); // Import Category model
const ProductModel = require('../Products/model');
const { BadRequest } = require('../../utility/errors');
const tempEventModel = require('../tempEvent/model');
const mongoose = require('mongoose');


const createEvent = async (eventData) => {
    const event = new EventModel(eventData);
    await event.save();
    return event;
};


// const getAllEvents = async () => {
//     const events = await EventModel.find().populate('categoriesId');

//     for (const event of events) {
//         if (event.categoriesId) {
//             const products = await ProductModel.find({ categoryId: event.categoriesId });
//             event._doc.products = products; // Adding products to the event document
//         }
//     }

//     return events;
// };


const getAllEvents = async () => {
    try {
        const events = await EventModel.find().populate('categoriesId').exec();

        const eventsWithProducts = await Promise.all(events.map(async (event) => {
            if (event.categoriesId && event.categoriesId._id) {
                const categoryId = event.categoriesId._id; // Assuming event.categoriesId._id is already an ObjectId
                const products = await ProductModel.find({ categoryId: categoryId }).exec();
                return {
                    ...event._doc,
                    products: products
                };
            } else {
                return {
                    ...event._doc,
                    products: []
                };
            }
        }));

        return { message: "Events fetched successfully", events: eventsWithProducts };
    } catch (error) {
        console.error("Error fetching events:", error);
        throw error;
    }
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


const getProductsByEventId = async (eventId) => {
    const event = await EventModel.findById(eventId);
    if (!event) {
        throw new Error('Event not found');
    }

    const products = await ProductModel.find({ categoryId: event.categoriesId });
    return products;
};




const getAllProductsAndEvents = async () => {
    try {
        const events = await EventModel.find().populate('categoriesId').exec();
        let allProductsAndEvents = [];

        for (let event of events) {
            const categoryId = event.categoriesId?._id.toString(); // Ensure categoryId is a string

            if (categoryId) {
                const products = await ProductModel.find({ categoryId: categoryId }).exec();
                allProductsAndEvents.push({
                    event: event,
                    products: products
                });
            } else {
                console.warn(`No categoryId found for event: ${event._id}`);
            }
        }

        return allProductsAndEvents;
    } catch (error) {
        console.error("Error fetching products and events:", error);
        throw new Error("Failed to fetch products and events");
    }
};







module.exports = {
    createEvent,
    getAllEvents,
    addAllEvents,
    updateCatEventIdByEventId,
    getProductsByEventId,
    getAllProductsAndEvents,

}
