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

// services/eventsService.js
const getProductsByEventId = async (eventId) => {
    try {
        const event = await EventModel.findById(eventId).populate('categoriesId').exec();
        if (!event) {
            throw new Error('Event not found');
        }

        const categoryId = event.categoriesId?._id.toString(); // Ensure categoryId is a string

        if (categoryId) {
            const products = await ProductModel.find({ categoryId: categoryId }).exec();
            return {
                event: {
                    _id: event._id,
                    eventCatId: event.eventCatId,
                    title: event.title,
                    description: event.description,
                    url: event.url,
                    categoriesId: categoryId,
                    __v: event.__v,
                    products: products
                },
               
            };
        } else {
            console.warn(`No categoryId found for event: ${event._id}`);
            throw new Error('Category not found for event');
        }
    } catch (error) {
        console.error("Error fetching products and event:", error);
        throw new Error("Failed to fetch products and event");
    }
};









const getAllProductsAndEvents = async () => {
    try {
        const events = await EventModel.find().populate('categoriesId').exec();
        let allProductsAndEvents = [];

        for (let event of events) {
            const categoryId = event.categoriesId?._id.toString(); // Ensure categoryId is a string

            if (categoryId) {
                const products = await ProductModel.find({ categoryId: categoryId }).exec();
                event = {
                    ...event._doc,
                    categoriesId: categoryId,
                    products: products 
                };
                allProductsAndEvents.push(event);
            } else {
                console.warn(`No categoryId found for event: ${event._id}`);
            }
        }

        return allProductsAndEvents; // Return array directly
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
