const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    eventCatId:{
        type:String,
    },
    title: {
        type: String,
        max: 10000,
  
    },
    description: {
        type: String,
        max: 10000,
        
    },
    url: {
        type: String,
        max: 10000,
      
    },
    categoriesId: {
       type: String,
       max: 10000,
       
    },
    eventLists:{
        eventCatId:{
            type:String,
        },
            title: {
                type: String,
                max: 10000,
            },
            description: {
                type: String,
                max: 10000,
            },
            url: {
                type: String,
                max: 10000,
            },
            date: {
                type: Date,
            },
            categoriesId: {
                type: String,
                max: 10000,
                
             },
    }

});

const EventModel = mongoose.model('Event', EventSchema);

module.exports = EventModel;
